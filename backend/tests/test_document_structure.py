"""BE-12 heading-aware document sections and figure locations."""

import pytest

from app.services.doc_ingest import Figure
from app.services.doc_structure import assign_figure_locations, split_markdown_sections

pytestmark = pytest.mark.no_db


def test_split_markdown_uses_nested_heading_paths():
    markdown = "# A\n\nintro\n\n## B\n\nbody\n\n> 图 1：caption\n\n### C\n\nbody2\n"
    chunks = split_markdown_sections(markdown, max_chars=2000)
    assert [chunk.section_path for chunk in chunks] == [
        ["A"],
        ["A", "B"],
        ["A", "B", "C"],
    ]
    assert chunks[1].figure_indices == [1]
    assert chunks[1].heading_level == 2
    assert chunks[0].char_start == 0
    assert chunks[1].char_start == markdown.index("## B")


def test_split_markdown_keeps_pre_heading_text():
    markdown = "preface\n\n# A\n\nbody\n"
    chunks = split_markdown_sections(markdown, max_chars=2000)
    assert [chunk.section_path for chunk in chunks] == [[], ["A"]]
    assert chunks[0].heading_level is None
    assert chunks[1].heading_level == 1


def test_split_markdown_splits_oversized_sections_with_same_path():
    markdown = "# A\n\n" + ("x" * 120) + "\n\n" + ("y" * 120) + "\n"
    chunks = split_markdown_sections(markdown, max_chars=40)
    assert len(chunks) > 2
    assert all(chunk.section_path == ["A"] for chunk in chunks)
    assert chunks[0].text.startswith("# A")
    assert chunks[-1].char_end <= len(markdown)


def test_assign_figure_locations_sets_path_and_offset():
    figures = [
        Figure(index=1, source="one.png", mime="image/png", data=b"one", caption="one"),
        Figure(index=2, source="two.png", mime="image/png", data=b"two", caption="two"),
    ]
    markdown = "# A\n\n## B\n\n> 图 1：one\n\n## C\n\n> 图 2：two\n"
    assign_figure_locations(markdown, figures)
    assert figures[0].section_path == ["A", "B"]
    assert figures[0].position == markdown.index("> 图 1")
    assert figures[1].section_path == ["A", "C"]
    assert figures[1].position == markdown.index("> 图 2")


def test_assign_figure_locations_leaves_unplaced_figure_empty():
    figures = [Figure(index=1, source="one.png", mime="image/png", data=b"one", caption="one")]
    assign_figure_locations("# A\n\nno marker here\n", figures)
    assert figures[0].section_path is None
    assert figures[0].position is None
