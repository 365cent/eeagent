from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import CorrectionAudit


async def record_correction(
    db: AsyncSession,
    entity_type: str,
    entity_id,
    field_name: str,
    machine_value,
    human_value,
    operator_subject: str = "local-admin",
    operator_role: str = "方法论/词表管理员",
) -> None:
    """REQ-RULE-02: 人工纠偏必须留痕。"""
    db.add(
        CorrectionAudit(
            entity_type=entity_type,
            entity_id=entity_id,
            field_name=field_name,
            machine_value=machine_value,
            human_value=human_value,
            operator_subject=operator_subject,
            operator_role=operator_role,
        )
    )
