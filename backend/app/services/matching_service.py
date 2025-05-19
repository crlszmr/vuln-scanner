from sqlalchemy.orm import Session
from sqlalchemy import select, distinct, or_
from app.models.device_config import DeviceConfig
from app.models.platform import Platform
from app.models.cpe_title import CpeTitle

import re
from collections import Counter, defaultdict
from rapidfuzz import fuzz, process

MIN_MATCH_SCORE = 60

def normalize_separators(text: str) -> str:
    return re.sub(r'[\s\-_\.]+', ' ', text).strip()

def clean_word(word: str) -> str:
    alpha = re.match(r'[a-zA-Z]+', word)
    return alpha.group(0).lower() if alpha else word.lower()

def translate_symbols(text: str) -> str:
    replacements = {
        '+': ' plus ',
        '-': ' minus ',
        '&': ' and '
    }
    for symbol, word in replacements.items():
        text = text.replace(symbol, word)
    return text

def normalize(text: str) -> str:
    if not text:
        return ""
    return re.sub(r'[^\w\s]', '', text.strip().lower())

def preprocess(text: str) -> str:
    return normalize_separators(normalize(translate_symbols(text)))

def get_acronym(text: str) -> str:
    words = normalize(text).split()
    return ''.join(w[0] for w in words if w)

def extract_year_or_version(text: str) -> int:
    match = re.search(r'(\d{4})', text)
    if match:
        return int(match.group(1))
    match = re.search(r'(\d+)', text)
    if match:
        return int(match.group(1))
    return None

def ends_with_number(text: str) -> bool:
    return bool(re.search(r'\d+$', text))

def generate_phrases(words: list[str], max_size: int = 5) -> list[str]:
    cleaned_words = [clean_word(w) for w in words]
    phrases = [] 
    limit = min(len(cleaned_words), max_size)
    for size in range(1, limit + 1):
        phrase = " ".join(cleaned_words[:size])
        phrases.append(phrase)
    return phrases

def match_progressively(target_phrases: list[str], candidate_map: dict, source: str):
    for phrase in target_phrases:
        if phrase in candidate_map:
            return candidate_map[phrase], f"exact_{source}"
    return None, None

def match_platforms_for_device(device_id: int, db: Session):
    platform_vendor_map = defaultdict(list)
    for v in db.scalars(select(distinct(Platform.vendor))):
        norm = normalize_separators(preprocess(v))
        platform_vendor_map[norm].append(v)

    platform_product_map = defaultdict(list)
    for p in db.scalars(select(distinct(Platform.product))):
        norm = normalize_separators(preprocess(p))
        platform_product_map[norm].append(p)

    cpe_title_map = defaultdict(list)
    for t in db.query(CpeTitle).distinct(CpeTitle.value).all():
        norm = normalize_separators(preprocess(t.value))
        cpe_title_map[norm].append((t.value, t.platform_id))

    device_configs = db.query(DeviceConfig).filter(DeviceConfig.device_id == device_id).all()

    results = []
    match_types_counter = Counter()

    for config in device_configs:
        raw_vendor = config.vendor or ""
        raw_product = config.product or ""
        raw_version = config.version or ""

        normalized_vendor = normalize_separators(preprocess(raw_vendor))
        normalized_product = normalize_separators(preprocess(raw_product))

        vendor_words = normalized_vendor.split()
        product_words = normalized_product.split()

        vendor_phrases = generate_phrases(vendor_words)
        product_phrases = generate_phrases(product_words)

        vendor_acronym = get_acronym(raw_vendor)

        match_found = False
        matched_vendor = None
        match_type = "none"
        matched_platform = None
        matched_product = None
        match_score = 0.0
        needs_review = False

        # 1️⃣ platform.vendor
        vendor_matches, match_type = match_progressively(vendor_phrases, platform_vendor_map, source="vendor")
        if vendor_matches:
            matched_vendor = vendor_matches[0]
            match_found = True

        # 2️⃣ Acronym
        elif vendor_acronym in platform_vendor_map:
            matched_vendor = platform_vendor_map[vendor_acronym][0]
            match_type = "acronym"
            match_found = True

        # 3️⃣ platform.product (solo si no se encontró vendor)
        if not match_found:
            product_matches, match_type = match_progressively(product_phrases, platform_product_map, source="product")
            if product_matches:
                matched_vendor = product_matches[0]
                match_found = True

        # 4️⃣ cpe_titles.title (solo si no se encontró vendor/product)
        if not match_found:
            title_candidate, title_type = match_progressively(vendor_phrases + product_phrases, cpe_title_map, source="title")
            if title_candidate:
                matched_vendor = title_candidate[0]
                match_type = title_type
                platform_id = title_candidate[1]
                matched_platform = db.query(Platform).filter(Platform.id == platform_id).first()
                match_found = True

        # ➕ Match de product si vendor ya fue identificado
        if matched_vendor and match_type in ("exact_vendor", "acronym") and normalized_product:
            vendor_platforms = db.query(Platform).filter(Platform.vendor == matched_vendor).all()
            product_candidates = [(p.product, p) for p in vendor_platforms if p.product]
            if product_candidates:
                choices = [normalize_separators(preprocess(prod)) for prod, _ in product_candidates]
                best_match = process.extractOne(normalized_product, choices, scorer=fuzz.token_sort_ratio)
                if best_match:
                    best_score, matched_text = best_match[1], best_match[0]
                    for orig_text, platform in product_candidates:
                        if normalize_separators(preprocess(orig_text)) == matched_text:
                            dev_year = extract_year_or_version(raw_version or raw_product)
                            plat_year = extract_year_or_version(platform.version or platform.product)
                            if dev_year and plat_year and abs(dev_year - plat_year) > 10:
                                best_score -= 20
                            score = max(0.0, best_score)
                            if score >= MIN_MATCH_SCORE:
                                matched_product = orig_text
                                match_score = round(score, 2)
                                matched_platform = platform
                            break

            if not matched_product:
                filtered_titles = db.query(CpeTitle).join(Platform).filter(Platform.vendor == matched_vendor).all()
                title_norms = [(normalize_separators(preprocess(t.value)), t) for t in filtered_titles if t.value]
                if title_norms:
                    title_match = process.extractOne(
                        normalized_product,
                        [t[0] for t in title_norms],
                        scorer=fuzz.token_sort_ratio
                    )
                    if title_match:
                        matched_text = title_match[0]
                        for norm_text, title in title_norms:
                            if norm_text == matched_text:
                                dev_year = extract_year_or_version(raw_version or raw_product)
                                plat_year = extract_year_or_version(title.platform.version or title.platform.product)
                                score = title_match[1]
                                if dev_year and plat_year and abs(dev_year - plat_year) > 10:
                                    score -= 20
                                score = max(0.0, score)
                                if score >= MIN_MATCH_SCORE:
                                    matched_product = title.value
                                    match_score = round(score, 2)
                                    matched_platform = title.platform
                                break

        if MIN_MATCH_SCORE <= match_score < 75:
            needs_review = True

        if match_score < MIN_MATCH_SCORE:
            matched_product = None
            matched_platform = None
            match_found = False
            match_type = None

        match_types_counter[match_type] += 1

        result_entry = {
            "device_config_id": config.id,
            "original_vendor": raw_vendor,
            "original_product": raw_product,
            "matched_vendor": matched_vendor,
            "match": match_found,
            "match_type": match_type,
            "matched_product": matched_product,
            "match_score": match_score,
            "needs_review": needs_review
        }

        if matched_platform:
            result_entry["matched_platform"] = {
                "id": matched_platform.id,
                "vendor": matched_platform.vendor,
                "product": matched_platform.product,
                "version": matched_platform.version
            }

        results.append(result_entry)

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
