from sqlalchemy.orm import Session
from sqlalchemy import select, distinct, or_
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

    cpe_titles_by_platform = defaultdict(list)
    for t in db.query(CpeTitle).all():
        norm = normalize_separators(preprocess(t.value))
        cpe_titles_by_platform[t.platform_id].append(norm)

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

        vendor_acronym = get_acronym(raw_vendor)

        match_found = False
        matched_vendor = None
        match_type = "none"
        matched_product = None
        matched_platform = None
        match_score = 0.0
        needs_review = False

        # 1️⃣ platform.vendor
        vendor_matches, match_type = match_progressively(vendor_words, platform_vendor_map, source="vendor")
        if vendor_matches:
            matched_vendor = vendor_matches[0]
            match_found = True

        # 2️⃣ Acronym
        elif vendor_acronym in platform_vendor_map:
            matched_vendor = platform_vendor_map[vendor_acronym][0]
            match_type = "acronym"
            match_found = True

        best_score = 0.0
        best_platform = None

        if matched_vendor:
            vendor_platforms = db.query(Platform).filter(Platform.vendor == matched_vendor).all()

            for platform in vendor_platforms:
                scores = []

                if platform.product:
                    norm_prod = normalize_separators(preprocess(platform.product))
                    scores.append(fuzz.token_sort_ratio(normalized_product, norm_prod))

                for title in cpe_titles_by_platform.get(platform.id, []):
                    scores.append(fuzz.token_sort_ratio(normalized_product, title))

                if scores:
                    max_score = max(scores)
                    if max_score > best_score:
                        best_score = max_score
                        best_platform = platform

        if best_score >= MIN_MATCH_SCORE:
            matched_product = best_platform.product
            matched_platform = best_platform
            match_score = round(best_score, 2)
            match_found = True
            match_type = match_type or "product_match"
            if MIN_MATCH_SCORE <= best_score < 75:
                needs_review = True
        else:
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
            "matched_platform": {
                "id": matched_platform.id,
                "vendor": matched_platform.vendor,
                "product": matched_platform.product,
                "version": matched_platform.version
            } if matched_platform else None,
            "match_score": match_score,
            "needs_review": needs_review
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