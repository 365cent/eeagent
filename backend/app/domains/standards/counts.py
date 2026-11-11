from app.models.models import DeploymentStandard


def substantive_standard_count(standards: list[DeploymentStandard]) -> int:
    return sum(
        1
        for std in standards
        if std.requirement_text is not None and std.requirement_text.strip()
    )
