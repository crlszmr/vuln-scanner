import re
from typing import List, Dict
from difflib import SequenceMatcher
from sqlalchemy.orm import Session
from app.models.device_config import DeviceConfig
from app.models.platform import Platform


def normalize(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[\(\)\[\],._\-]", " ", text)
    text = re.sub(r"\b(corporation|corp|inc|ltd|s\.a\.|s\.l\.)\b", "", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def similarity(a: str, b: str) -> float:
    return SequenceMatcher(None, a, b).ratio()


def match_device_configs_to_platforms(device_id: int, db: Session, threshold=0.75) -> Dict[int, List[Dict]]:
    print(f"🔍 Empezando matching para device_id={device_id}")
    result = {}

    configs = db.query(DeviceConfig).filter(DeviceConfig.device_id == device_id).all()
    print(f"📦 Se encontraron {len(configs)} entradas en device_config")

    platforms = db.query(Platform).all()
    print(f"💽 Se encontraron {len(platforms)} plataformas posibles")

    for config in configs:
        print(f"\n➡️ Procesando config ID={config.id}: vendor='{config.vendor}', product='{config.product}', version='{config.version}'")

        config_vendor = normalize(config.vendor or "")
        config_product = normalize(config.product or "")
        config_version = normalize(config.version or "")

        matches = []

        for p in platforms:
            p_vendor = normalize(p.vendor or "")
            p_product = normalize(p.product or "")
            p_version = normalize(p.version or "")

            vendor_score = similarity(config_vendor, p_vendor)
            product_score = similarity(config_product, p_product)
            version_score = similarity(config_version, p_version) if config_version and p_version else 1.0

            total_score = 0.4 * vendor_score + 0.5 * product_score + 0.1 * version_score

            if total_score >= threshold:
                print(f"      ✅ Match aceptado (score ≥ {threshold})")
                matches.append({
                    "platform_id": p.id,
                    "vendor": p.vendor,
                    "product": p.product,
                    "version": p.version,
                    "score": round(total_score, 3)
                })

        result[config.id] = matches

    print(f"✅ Matching finalizado para device_id={device_id}")
    return result

