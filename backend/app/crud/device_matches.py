from sqlalchemy.orm import Session
from app.models.device_match import DeviceMatch

def mark_vulnerabilities_as_solved(db: Session, device_id: int, cve_ids: list[str]):
    db.query(DeviceMatch).filter(
        DeviceMatch.device_id == device_id,
        DeviceMatch.cve_id.in_(cve_ids)
    ).update({DeviceMatch.solved: True}, synchronize_session=False)
    db.commit()


def unmark_vulnerabilities_as_solved(db: Session, device_id: int, cve_ids: list[str]):
    db.query(DeviceMatch).filter(
        DeviceMatch.device_id == device_id,
        DeviceMatch.cve_id.in_(cve_ids)
    ).update({DeviceMatch.solved: False}, synchronize_session=False)
    db.commit()


def get_solved_cves_for_device(db: Session, device_id: int) -> list[str]:
    results = db.query(DeviceMatch.cve_id).filter(
        DeviceMatch.device_id == device_id,
        DeviceMatch.solved == True
    ).all()
    return [row.cve_id for row in results]
