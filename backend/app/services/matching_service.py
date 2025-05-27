from sqlalchemy.orm import Session
from sqlalchemy import select, distinct
from app.models.device_config import DeviceConfig
from app.models.platform import Platform
from app.models.cpe_title import CpeTitle
from app.models.cve_cpe import CveCpe
from app.models.device_match import DeviceMatch
import re
from collections import Counter, defaultdict
from rapidfuzz import fuzz
import asyncio

MIN_MATCH_SCORE = 60

VALID_HW = {'*', '-', 'x86', 'x64', 'amd64', 'i386', 'i686', 'unknown'}
INVALID_SW = {
    "linux", "android", "ios", "mac", "macos", "unix",
    "ibm_zos", "solaris", "openbsd", "freebsd", "netbsd",
    "hpux", "aix", "vxworks", "rtos", "tizen", "watchos",
    "tvos", "esx", "chromeos", "qnx"
}

def normalize_separators(text: str) -> str:
    return re.sub(r'[\s\-_\.]+', ' ', text).strip()

def translate_symbols(text: str) -> str:
    replacements = {
        '+': ' plus ',
        '&': ' and '
    }
    for symbol, word in replacements.items():
        text = text.replace(symbol, word)
    return text

def normalize(text: str) -> str:
    if not text:
        return ""
    return re.sub(r'[^\w\s-]', '', text.strip().lower())

def preprocess(text: str) -> str:
    return normalize_separators(normalize(translate_symbols(text)))

def extended_normalize(text: str) -> str:
    return re.sub(r'[^\w\s]', '', preprocess(text))

def get_acronym(text: str) -> str:
    words = normalize(text).split()
    return ''.join(w[0] for w in words if w)

def extract_version(product_name: str, config_version: str) -> str:
    year_match = re.search(r'(19\d{2}|20\d{2}|2100)', product_name)
    if year_match:
        return year_match.group(1)
    if config_version:
        return config_version.strip()
    return None

def normalize_field(text: str) -> str:
    text = text.replace('\\', '').replace("'", '').replace('-', '_')
    return normalize(text)

def escape_like(text: str) -> str:
    return text.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")

def match_version_with_cpe_uri(matched_vendor: str, matched_product: str, target_major_version: str, db: Session):
    if not (matched_vendor and matched_product and target_major_version):
        return []

    norm_vendor = normalize_field(matched_vendor)
    norm_product = normalize_field(matched_product)

    escaped_vendor = escape_like(matched_vendor)
    escaped_product = escape_like(matched_product)

    like_expr = f"cpe:2.3:%:{escaped_vendor}:{escaped_product}:%"
    candidates = db.query(CveCpe).filter(CveCpe.cpe_uri.like(like_expr, escape='\\')).all()

    matched = []
    for cpe in candidates:
        parts = cpe.cpe_uri.split(':')
        if len(parts) >= 13:
            vendor = normalize_field(parts[3])
            product = normalize_field(parts[4])
            version = parts[5]
            target_sw = parts[10].lower()
            target_hw = parts[11].lower()

            if vendor != norm_vendor or product != norm_product:
                continue

            if target_hw not in VALID_HW or target_sw in INVALID_SW:
                continue

            if version in ('*', '-'):
                matched.append(cpe)
                continue

            if version == target_major_version:
                matched.append(cpe)

    if not matched:
        print(f"⚠️ No se encontró ningún CPE para {matched_vendor}:{matched_product} con versión {target_major_version}")

    return matched

def match_progressively(target_words: list[str], candidate_map: dict, source: str):
    for i in range(len(target_words)):
        for j in range(i + 1, len(target_words) + 1):
            phrase = ' '.join(target_words[i:j])
            if phrase in candidate_map:
                return candidate_map[phrase], f"exact_{source}"
    return None, None


def match_platforms_for_device(device_id: int, db: Session, yield_progress: bool = False):
    from collections import defaultdict, Counter
    import re
    from sqlalchemy import select, distinct
    from app.models import Platform, CpeTitle, DeviceConfig, DeviceMatch
    from fuzzywuzzy import fuzz

    platform_vendor_map = defaultdict(list)
    product_to_vendor = defaultdict(list)

    for v in db.scalars(select(distinct(Platform.vendor))):
        norm = preprocess(v)
        alt = extended_normalize(v)
        platform_vendor_map[norm].append(v)
        if norm != alt:
            platform_vendor_map[alt].append(v)

    for prod, vend in db.query(distinct(Platform.product), Platform.vendor).all():
        norm_prod = preprocess(prod or "")
        alt_prod = extended_normalize(prod or "")
        product_to_vendor[norm_prod].append(vend)
        if norm_prod != alt_prod:
            product_to_vendor[alt_prod].append(vend)

    cpe_titles_by_platform = defaultdict(list)
    for t in db.query(CpeTitle).all():
        norm = preprocess(t.value)
        cpe_titles_by_platform[t.platform_id].append(norm)

    device_configs = db.query(DeviceConfig).filter(DeviceConfig.device_id == device_id).all()
    results = []
    match_types_counter = Counter()
    total = len(device_configs)

    def process_configs():
        for idx, config in enumerate(device_configs, 1):
            raw_vendor = config.vendor or ""
            raw_product = config.product or ""
            config_version = config.version or ""

            normalized_vendor = preprocess(raw_vendor)
            extended_vendor = extended_normalize(raw_vendor)
            normalized_product = preprocess(raw_product)

            vendor_words = normalized_vendor.split()
            alt_vendor_words = extended_vendor.split()
            vendor_acronym = get_acronym(raw_vendor)

            match_found = False
            matched_vendor = None
            match_type = "none"
            matched_product = None
            match_score = 0.0
            needs_review = False

            vendor_matches, match_type = match_progressively(vendor_words, platform_vendor_map, "vendor")
            if not vendor_matches:
                vendor_matches, match_type = match_progressively(alt_vendor_words, platform_vendor_map, "vendor_cleaned")
            if not vendor_matches:
                simplified_words = [re.sub(r'\d+$', '', w) for w in alt_vendor_words]
                vendor_matches, match_type = match_progressively(simplified_words, platform_vendor_map, "vendor_simplified")

            if vendor_matches:
                matched_vendor = vendor_matches[0]
                match_found = True
            elif vendor_acronym in platform_vendor_map:
                matched_vendor = platform_vendor_map[vendor_acronym][0]
                match_type = "acronym"
                match_found = True
            else:
                vendor_matches, match_type = match_progressively(alt_vendor_words, product_to_vendor, "product_as_vendor")
                if vendor_matches:
                    matched_vendor = vendor_matches[0]
                    match_found = True

            best_score = 0.0
            if matched_vendor:
                vendor_platforms = db.query(Platform).filter(Platform.vendor == matched_vendor).all()
                for platform in vendor_platforms:
                    scores = []

                    if platform.product:
                        norm_prod = preprocess(platform.product)
                        scores.append(fuzz.token_sort_ratio(normalized_product, norm_prod))

                    for title in cpe_titles_by_platform.get(platform.id, []):
                        scores.append(fuzz.token_sort_ratio(normalized_product, title))

                    total_score = max(scores) if scores else 0

                    if total_score > best_score:
                        best_score = total_score
                        matched_product = platform.product

            if best_score >= MIN_MATCH_SCORE:
                match_found = True
                match_score = round(best_score, 2)
                match_type = match_type or "product_match"
                if best_score < 75:
                    needs_review = True
            else:
                matched_product = None

            target_version = extract_version(raw_product or "", config_version)
            matched_cpes = match_version_with_cpe_uri(matched_vendor, matched_product, target_version, db)

            match_types_counter[match_type] += 1

            results.append({
                "device_config_id": config.id,
                "original_vendor": raw_vendor,
                "original_product": raw_product,
                "device_config_version": config_version,
                "matched_vendor": matched_vendor,
                "match": match_found,
                "match_type": match_type,
                "matched_product": matched_product,
                "match_score": match_score,
                "needs_review": needs_review,
                "matched_cpe_uris": [
                    {"cve_name": c.cve_name, "cpe_uri": c.cpe_uri}
                    for c in matched_cpes
                ]
            })

            if yield_progress:
                yield f"{idx}/{total} - Procesado: {raw_vendor} {raw_product} ({match_type}, {match_score})"

    if yield_progress:
        async def generator():
            for message in process_configs():
                yield message
                await asyncio.sleep(0.05)  # opcional, da margen al cliente

            existing = db.query(DeviceMatch.cve_name, DeviceMatch.cpe_uri).filter(
                DeviceMatch.device_config_id.in_([r["device_config_id"] for r in results])
            ).all()
            existing_set = set(existing)

            to_save = []
            for result in results:
                for cpe_data in result["matched_cpe_uris"]:
                    key = (cpe_data["cve_name"], cpe_data["cpe_uri"])
                    if key not in existing_set:
                        to_save.append(DeviceMatch(
                            device_config_id=result["device_config_id"],
                            cve_name=cpe_data["cve_name"],
                            cpe_uri=cpe_data["cpe_uri"],
                            matched_vendor=result["matched_vendor"],
                            matched_product=result["matched_product"],
                            match_type=result["match_type"],
                            match_score=result["match_score"],
                            needs_review=result["needs_review"]
                        ))

            db.bulk_save_objects(to_save)
            db.commit()

            matched = total - match_types_counter["none"]
            summary = {
                "total_configs": total,
                "matched": matched,
                "unmatched": match_types_counter["none"],
                "match_percentage": round((matched / total) * 100, 2) if total else 0.0,
                "by_type": dict(match_types_counter)
            }

            yield "[DONE]"

        return generator()

    else:
        for _ in process_configs():
            pass  # ignorar yield
        existing = db.query(DeviceMatch.cve_name, DeviceMatch.cpe_uri).filter(
            DeviceMatch.device_config_id.in_([r["device_config_id"] for r in results])
        ).all()
        existing_set = set(existing)

        to_save = []
        for result in results:
            for cpe_data in result["matched_cpe_uris"]:
                key = (cpe_data["cve_name"], cpe_data["cpe_uri"])
                if key not in existing_set:
                    to_save.append(DeviceMatch(
                        device_config_id=result["device_config_id"],
                        cve_name=cpe_data["cve_name"],
                        cpe_uri=cpe_data["cpe_uri"],
                        matched_vendor=result["matched_vendor"],
                        matched_product=result["matched_product"],
                        match_type=result["match_type"],
                        match_score=result["match_score"],
                        needs_review=result["needs_review"]
                    ))

        db.bulk_save_objects(to_save)
        db.commit()

        matched = total - match_types_counter["none"]
        summary = {
            "total_configs": total,
            "matched": matched,
            "unmatched": match_types_counter["none"],
            "match_percentage": round((matched / total) * 100, 2) if total else 0.0,
            "by_type": dict(match_types_counter)
        }

        return {
            "results": results,
            "summary": summary
        }
