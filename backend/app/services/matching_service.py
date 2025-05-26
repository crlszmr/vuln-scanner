from sqlalchemy.orm import Session
from sqlalchemy import select, distinct
from app.models.device_config import DeviceConfig
from app.models.platform import Platform
from app.models.cpe_title import CpeTitle

import re
from collections import Counter, defaultdict
from rapidfuzz import fuzz

MIN_MATCH_SCORE = 60

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

def version_similarity(version1: str, version2: str) -> float:
    if not version1 or not version2:
        return 0.0

    v1 = preprocess(version1)
    v2 = preprocess(version2)

    # Si son exactamente iguales después del normalizado, devolvemos 100 directamente
    if v1 == v2:
        return 100.0

    # Comparación caso-insensible e ignorando guiones/puntos
    score = fuzz.ratio(v1, v2)
    return score


def match_progressively(target_words: list[str], candidate_map: dict, source: str):
    for i in range(len(target_words)):
        for j in range(i+1, len(target_words)+1):
            phrase = ' '.join(target_words[i:j])
            if phrase in candidate_map:
                return candidate_map[phrase], f"exact_{source}"
    return None, None

def match_platforms_for_device(device_id: int, db: Session):
    platform_vendor_map = defaultdict(list)
    product_to_vendor = defaultdict(list)

    for v in db.scalars(select(distinct(Platform.vendor))):
        norm = preprocess(v)
        alt = extended_normalize(v)
        platform_vendor_map[norm].append(v)
        if norm != alt:
            platform_vendor_map[alt].append(v)

    for p in db.query(distinct(Platform.product), Platform.vendor).all():
        prod, vend = p
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

    for config in device_configs:
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
            "needs_review": needs_review
        })

    total = len(results)
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
