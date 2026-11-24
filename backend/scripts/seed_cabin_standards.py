"""Fill the deployment-standard nine-grid for the cabin perception landing point.

DRAFT standards, not customer-confirmed rules: every cell is derived from the
function card and reverse trace already saved for this feature (camera + mic
fusion, on-vehicle processing, L2 prompt vs L4 takeover). Business review should
replace or confirm each line before release acceptance.

Writes through the public REST API (PUT /landing-points/{lp_id}/standards) so
each change is an upsert with history, exactly as a researcher would do it in
the UI.

Usage:
    python scripts/seed_cabin_standards.py             # print the grid
    python scripts/seed_cabin_standards.py --apply     # write the nine cells
"""
from __future__ import annotations

import argparse
import json
import urllib.request

API = 'http://127.0.0.1:8000/api/v1'
HEADERS = {
    'Content-Type': 'application/json',
    'X-EEA-Authenticated-User': 'local-development-user',
    'X-EEA-Authenticated-Role': 'researcher',
}
LANDING_POINT_NAME = '座舱多模融合感知模块'

GRID: dict[tuple[str, str], str] = {
    ('设计', '工程化'): (
        '摄像头与麦克风模组满足 AEC-Q100 Grade 2 与车规声学指标；融合推理在 -40~85℃ '
        '保持 ≥25fps，端到端时延 ≤100ms。'
    ),
    ('设计', '经济性'): (
        '复用座舱既有摄像头与麦克风，不新增传感器；融合模型算力 ≤2 TOPS，优先运行在座舱域控 NPU。'
    ),
    ('设计', '安全合规'): (
        '舱内影像与语音仅在车端处理，原始数据不出车；提供采集提示与一键关闭，满足个人信息保护法与汽车数据安全要求。'
    ),
    ('制造', '工程化'): (
        '产线完成摄像头标定与麦克风阵列一致性校验；融合模型随域控软件刷写并写入版本号。'
    ),
    ('制造', '经济性'): (
        '标定并入既有座舱下线检测，单台增加工时 ≤30s，不新增工位。'
    ),
    ('制造', '安全合规'): (
        '下线检测验证采集提示与关闭开关生效，并固化影像不出车的出厂配置基线。'
    ),
    ('运营', '工程化'): (
        '模型 OTA 灰度发布并保留回滚版本；持续监控误唤醒率与疲劳漏检率。'
    ),
    ('运营', '经济性'): '模型更新复用现有 OTA 通道，按季度节奏发布，不单独建设通道。',
    ('运营', '安全合规'): (
        '每次舱内采集写入可审计记录；支持用户查询与删除个人数据，异常按事故流程上报。'
    ),
}


def get(path: str):
    with urllib.request.urlopen(API + path) as response:
        return json.load(response)


def landing_point() -> dict:
    points = get('/landing-points')
    found = [point for point in points if point['name'] == LANDING_POINT_NAME]
    if not found:
        raise SystemExit(f'landing point not found: {LANDING_POINT_NAME}')
    return found[0]


def put_cell(lp_id: str, phase: str, constraint: str, text: str) -> None:
    body = json.dumps(
        {'phase': phase, 'constraint_type': constraint, 'requirement_text': text},
        ensure_ascii=False,
    ).encode('utf-8')
    request = urllib.request.Request(
        f'{API}/landing-points/{lp_id}/standards', data=body, headers=HEADERS, method='PUT'
    )
    with urllib.request.urlopen(request) as response:
        json.load(response)


def main(apply: bool) -> int:
    point = landing_point()
    print(f"{point['name']} ({point['id']})")
    for (phase, constraint), text in GRID.items():
        print(f'  {phase} · {constraint}: {text}')
    if not apply:
        print(f'dry run: {len(GRID)} cells; re-run with --apply')
        return len(GRID)
    for (phase, constraint), text in GRID.items():
        put_cell(point['id'], phase, constraint, text)
    lp_id = point['id']
    grid = get(f'/landing-points/{lp_id}/standards')
    filled = [cell for cell in grid['cells'] if (cell.get('requirement_text') or '').strip()]
    print(f'wrote {len(GRID)} cells; server now holds {len(filled)} filled rows')
    return len(filled)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Fill the cabin perception nine-grid (draft).')
    parser.add_argument('--apply', action='store_true')
    args = parser.parse_args()
    main(args.apply)
