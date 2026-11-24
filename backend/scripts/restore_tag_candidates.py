"""Re-add domain acronyms that a tag purge removed (dry run by default).

Each signal keeps the recall pool it was tagged from in
``classification_basis.tag_candidates``, so a too-broad purge can be undone for
real vocabulary (SoC, PCIe, CAN) without guessing: the terms are already in the
stored pool. Runs through the normal tag endpoint, so every change is audited.
Nothing is removed; human-corrected tags stay.

Usage:
    python scripts/restore_tag_candidates.py            # list what would return
    python scripts/restore_tag_candidates.py --apply    # write the tags
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

#: Domain acronyms worth keeping even when only one signal mentions them.
ACRONYMS = {
    'soc': 'SoC', 'pcie': 'PCIe', 'ucie': 'UCIe', 'serdes': 'SerDes',
    'adas': 'ADAS', 'ads': 'ADS', 'can': 'CAN', 'chiplet': 'Chiplet',
    'efuse': 'eFuse', 'autosar': 'AUTOSAR', 'secoc': 'SecOC', 'avs': 'AVs',
    'evcc': 'EVCC', 'l2': 'L2', 'l3': 'L3', 'l4': 'L4', 'iso': 'ISO',
    'iec': 'IEC', 'sae': 'SAE', 'nhtsa': 'NHTSA', 'mipi': 'MIPI',
    'tsn': 'TSN', 'ecu': 'ECU', 'ota': 'OTA', 'soa': 'SOA', 'bmw': 'BMW',
}


def get(path: str):
    with urllib.request.urlopen(API + path) as response:
        return json.load(response)


def put(path: str, payload: dict) -> dict:
    request = urllib.request.Request(
        API + path, data=json.dumps(payload).encode('utf-8'), headers=HEADERS, method='PUT'
    )
    with urllib.request.urlopen(request) as response:
        return json.load(response)


def plan() -> list[tuple[dict, list[str]]]:
    todo = []
    for signal in get('/signals?limit=200'):
        candidates = (signal.get('classification_basis') or {}).get('tag_candidates') or []
        current = list(signal.get('tags') or [])
        add: list[str] = []
        for candidate in candidates:
            name = ACRONYMS.get(str(candidate).strip().lower())
            if name and name not in current and name not in add:
                add.append(name)
        if add:
            todo.append((signal, add))
    return todo


def main(apply: bool) -> int:
    todo = plan()
    if not todo:
        print('nothing to restore')
        return 0
    for signal, add in todo:
        print(f"{signal['id'][:8]} {signal['title'][:34]!r}: + " + ', '.join(add))
    total = sum(len(add) for _, add in todo)
    if not apply:
        print(f'dry run: {total} tags on {len(todo)} signals; re-run with --apply')
        return total
    for signal, add in todo:
        put(
            f"/signals/{signal['id']}/tags",
            {'tag_names': list(signal['tags']) + add, 'expected_updated_at': signal['updated_at']},
        )
    print(f'restored {total} tags on {len(todo)} signals')
    return total


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Re-add domain acronyms from tag_candidates.')
    parser.add_argument('--apply', action='store_true')
    args = parser.parse_args()
    main(args.apply)
