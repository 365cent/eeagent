from app.domains.standards.counts import substantive_standard_count
from app.models.models import TechLandingPoint
from app.schemas.schemas import LandingPointOut


def landing_point_out(lp: TechLandingPoint) -> LandingPointOut:
    out = LandingPointOut.model_validate(lp)
    out.domain_name = lp.domain.name if lp.domain else ""
    out.standard_count = substantive_standard_count(lp.standards)
    return out
