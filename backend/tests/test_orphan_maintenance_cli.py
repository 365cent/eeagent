"""The maintenance CLI refuses arguments that would widen a prune (BE-01).

These run without a database: argparse rejects the value before `_run` opens a
session, which is what keeps `--job-retention-days 0` from deleting every
terminal job the moment it is accepted.
"""

import pytest

from app.domains.capture.orphan_maintenance import main

pytestmark = pytest.mark.no_db


@pytest.mark.parametrize(
    "argv",
    [
        ["--job-retention-days", "0"],
        ["--job-retention-days", "-5"],
        ["--limit", "0"],
        ["--limit", "-1"],
    ],
)
def test_values_below_one_are_rejected_before_any_database_work(argv):
    with pytest.raises(SystemExit) as excinfo:
        main(argv)

    assert excinfo.value.code == 2

