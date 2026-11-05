"""Seed eea_ref_code closed vocabularies + eFuse harness dataset (附录 A/B/C).

Harness data is test data for the acceptance chain, not platform master data
(docs/platform-implementation-plan.md §11).
"""
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

import app.models as m
from app.core.config import get_settings
from app.services.refcodes import REF_CODES  # noqa: F401 (shared closed vocabularies)
from app.services.tagging import get_or_create_vocab, normalize_url, sha256_text

SEED_DOMAINS = ["硬件", "软件", "工具链", "电源"]


async def seed(db) -> None:
    # closed vocabularies
    for domain, codes in REF_CODES.items():
        for item in codes:
            code, label = item[0], item[1]
            alias = item[2] if len(item) > 2 else None
            existing = (
                await db.execute(
                    select(m.RefCode).where(m.RefCode.domain == domain, m.RefCode.code == code)
                )
            ).scalar_one_or_none()
            if existing:
                continue
            db.add(m.RefCode(domain=domain, code=code, label=label, fixture_alias=alias))

    for name in SEED_DOMAINS:
        await get_or_create_vocab(db, "domain", name)

    # harness chain (表A 2条信号 → 主题「低压系统智能化」 → 需求点 → 功能 → eFuse → 标准 → 研判)
    # first()/limit(1), not scalar_one_or_none(): POST /themes allows a second
    # theme with the same working_name, and any existing match just means
    # "already seeded" — a duplicate must skip, not crash bootstrap
    if (
        await db.execute(
            select(m.TechTheme).where(m.TechTheme.working_name == "低压系统智能化").limit(1)
        )
    ).scalars().first():
        await db.commit()
        return

    theme = m.TechTheme(working_name="低压系统智能化", value_chain_stage_code="creation_supply")
    db.add(theme)
    await db.flush()

    signals = [
        dict(
            title="48V低压供电网络研究：48V供应链活跃，将优先落地线控底盘等高功率场景",
            url="https://example.com/industry/48v-low-voltage-network",
            channel_code="web",
            publisher="与非网",
            published_at=datetime(2026, 6, 1, tzinfo=timezone.utc),
            stage="creation_supply",
            type="strategy",
            evolution="release",
            tags=["智能配电", "区域控制", "线控底盘", "eFuse"],
            excerpt="48V供应链活跃，多家功率半导体厂商布局eFuse、SSCB等智能配电器件，将优先落地线控底盘等高功率场景。",
        ),
        dict(
            title="汽车加速进入48V eFuse时代",
            url="https://mp.weixin.qq.com/s/efuse-48v-era",
            channel_code="wechat_mp",
            publisher="微信公众平台",
            published_at=datetime(2026, 3, 1, tzinfo=timezone.utc),
            stage="creation_supply",
            type="technology",
            evolution="nomination_validation",
            tags=["智能配电", "区域控制", "功能安全", "整车OTA", "电池安全", "eFuse"],
            excerpt="48V+eFuse在特斯拉Cybertruck量产后呈标配化趋势，MPS/Vishay/ST/Infineon/TI/onsemi等厂商集体入场。",
        ),
    ]
    for s in signals:
        tags = s.pop("tags")
        stage, type_, evo = s.pop("stage"), s.pop("type"), s.pop("evolution")
        sig = m.Signal(
            **s,
            url_normalized=normalize_url(s["url"]),
            value_chain_stage_code=stage,
            signal_type_code=type_,
            evolution_node_code=evo,
            evidence_status_code="retained",
            source_label=s["publisher"],
            body_sha256=sha256_text(s["excerpt"]),
            captured_at=datetime(2026, 6, 2, tzinfo=timezone.utc),
            tech_theme_id=theme.id,
        )
        db.add(sig)
        await db.flush()
        for name in tags:
            v = await get_or_create_vocab(db, "tech_tag", name)
            db.add(m.SignalTag(signal_id=sig.id, vocab_id=v.id))

    demand = m.DemandPoint(
        name="低压系统智能化",
        source_tech_theme_id=theme.id,
        value_chain_stage_code="creation_supply",
        cross_validation={
            "conclusion": "通过",
            "perspectives": ["架构变化", "器件供给", "产业化发展"],
            "detail": "不同主体、不同技术对象、不同渠道的独立信号共同指向低压系统智能化的产业级需求。",
        },
        time_series=[
            {"time": "2026-03", "event": "48V+eFuse 在 Cybertruck 量产标配"},
            {"time": "2026-06", "event": "多家功率半导体厂商发布车规 eFuse / SSCB 布局"},
        ],
        review_status="confirmed",
    )
    db.add(demand)
    await db.flush()

    func = m.VehicleFunction(
        demand_point_id=demand.id,
        name="全节点智能配电",
        value_chain_stage_code="creation_supply",
        forward_trace={
            "steps": [
                "拆解核心诉求：低压配电节点级感知与软件定义通断",
                "识别缺口：传统保险丝与机械继电器无法节点级控制",
                "定位关键流：低压配电网络",
                "推导系统行为：监测、控制、保护、诊断、恢复闭环",
                "收敛为功能：全节点智能配电",
            ]
        },
        reverse_trace={
            "necessity": "无此功能则节点级状态感知、软件定义通断、快速故障隔离与自动恢复不能完整实现",
            "coverage": "仅远程开关、仅电流采集或仅电子熔断均不足以承接该需求",
        },
        published=True,
    )
    db.add(func)
    await db.flush()

    hardware = (await db.execute(select(m.Vocab).where(m.Vocab.kind == "domain", m.Vocab.name == "硬件"))).scalar_one()
    lp = m.TechLandingPoint(
        vehicle_function_id=func.id,
        domain_vocab_id=hardware.id,
        name="智能保险丝（eFuse）",
        role_description="全节点智能配电的执行层硬件：每个配电支路一个可被软件定义和驱动的保护器件，实现毫秒级主动保护与故障自恢复。",
    )
    db.add(lp)
    await db.flush()

    for phase, req in [
        ("设计", "满足AEC-Q100标准，支持过流/过压/过热保护"),
        ("制造", "完成保护功能验证"),
        # 运营阶段：无实质内容，如实留空（REQ-STD-02），不建行
    ]:
        db.add(
            m.DeploymentStandard(
                tech_landing_point_id=lp.id, phase=phase, constraint_type="工程化", requirement_text=req
            )
        )

    db.add(
        m.StrategicAssessment(
            tech_landing_point_id=lp.id,
            version=1,
            funnel_step=4,
            score_business=4,
            score_maturity=4,
            score_moat=3,
            score_supply_chain=4,
            score_feasibility=5,
            classification="产业投资/生态合作",
            strategy_note="建议通过战略投资或与头部厂商建立生态合作锁定供给，同步开展智能配电架构预研，确保电源系统产品线的器件保障。",
            operator_subject="seed",
            is_current=True,
        )
    )
    await db.commit()


async def main() -> None:
    settings = get_settings()
    engine = create_async_engine(settings.database_url)
    async with async_sessionmaker(engine, expire_on_commit=False)() as db:
        await seed(db)
    await engine.dispose()
    print("seed done")


if __name__ == "__main__":
    import asyncio
    import sys

    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(main())
