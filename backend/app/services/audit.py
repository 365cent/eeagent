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
    *,
    reason: str | None = None,
    model_version: str | None = None,
    rule_version: str | None = None,
    skill_version: str | None = None,
    score_source: str | None = None,
) -> None:
    """REQ-RULE-02: 人工纠偏必须留痕。"""
    if old_value == new_value:
        return
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
            reason=reason,
            model_version=model_version,
            rule_version=rule_version,
            skill_version=skill_version,
            score_source=score_source,
        )
    )
