from sqlalchemy.ext.asyncio import AsyncSession

from app.core.identity import OperatorIdentity
from app.models.models import CorrectionAudit


async def record_correction(
    db: AsyncSession,
    entity_type: str,
    entity_id,
    field_name: str,
    old_value,
    new_value,
    actor: OperatorIdentity,
) -> None:
    """REQ-RULE-02: 人工纠偏必须留痕。"""
    db.add(
        CorrectionAudit(
            entity_type=entity_type,
            entity_id=entity_id,
            field_name=field_name,
            machine_value=old_value,
            human_value=new_value,
            old_value=old_value,
            new_value=new_value,
            operator_subject=actor.subject,
            operator_role=actor.role,
        )
    )
