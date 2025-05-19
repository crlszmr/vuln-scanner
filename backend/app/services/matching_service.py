from sqlalchemy.orm import Session
from sqlalchemy import select, distinct, or_
from app.models.device_config import DeviceConfig
from app.models.platform import Platform
from app.models.cpe_title import CpeTitle

import re
from collections import Counter
from rapidfuzz import fuzz, process

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

def match_progressively(target_phrases: list[str], candidates: set[str], source: str, threshold=85):
    for phrase in target_phrases:
        if phrase in candidates:
            return phrase, f"exact_{source}"
    return None, None

def match_platforms_for_device(device_id: int, db: Session, fuzzy_threshold: int = 85):
    platform_vendor_set = set(normalize_separators(preprocess(v)) for v in db.scalars(select(distinct(Platform.vendor))).all())
    platform_product_set = set(normalize_separators(preprocess(p)) for p in db.scalars(select(distinct(Platform.product))).all())
    cpe_title_set = {
        normalize_separators(preprocess(t.value)): t.platform_id
        for t in db.query(CpeTitle).distinct(CpeTitle.value).all()
    }

    device_configs = db.query(DeviceConfig).filter(DeviceConfig.device_id == device_id).all()

    results = []
    match_types_counter = Counter()

    for config in device_configs:
        raw_vendor = config.vendor or ""
        raw_product = config.product or ""

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

        # 1️⃣ platform.vendor
        matched_vendor, match_type = match_progressively(vendor_phrases, platform_vendor_set, source="vendor", threshold=fuzzy_threshold)
        if matched_vendor:
            match_found = True

        # 2️⃣ Acronym
        elif vendor_acronym in platform_vendor_set:
            matched_vendor = vendor_acronym
            match_type = "acronym"
            match_found = True

        # 3️⃣ platform.product
        if not match_found:
            matched_vendor, match_type = match_progressively(product_phrases, platform_product_set, source="product", threshold=fuzzy_threshold)
            if matched_vendor:
                match_found = True

        # 4️⃣ cpe_titles.title
        if not match_found:
            title_candidate, title_type = match_progressively(vendor_phrases + product_phrases, set(cpe_title_set.keys()), source="title", threshold=fuzzy_threshold)
            if title_candidate:
                matched_vendor = title_candidate
                match_type = title_type
                platform_id = cpe_title_set[title_candidate]
                matched_platform = db.query(Platform).filter(Platform.id == platform_id).first()
                match_found = True

        match_types_counter[match_type] += 1

        result_entry = {
            "device_config_id": config.id,
            "original_vendor": raw_vendor,
            "original_product": raw_product,
            "matched_vendor": matched_vendor,
            "match": match_found,
            "match_type": match_type,
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