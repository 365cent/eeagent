from app.services.url_list_capture import parse_url_lines


def test_parse_url_lines_dedupes_and_splits():
    text = """
    https://example.com/one
    https://example.com/two  extra
    https://example.com/one

    https://example.com/three
    """
    urls = parse_url_lines(text)
    assert urls == [
        "https://example.com/one",
        "https://example.com/two",
        "https://example.com/three",
    ]


def test_parse_url_lines_dedupes_short_link_target():
    text = """
    https://link.wtturl.cn/?target=https%3A%2F%2Fexample.com%2Fdoc.pdf&scene=im
    https://example.com/doc.pdf
    """
    urls = parse_url_lines(text)
    assert urls == ["https://link.wtturl.cn/?target=https%3A%2F%2Fexample.com%2Fdoc.pdf&scene=im"]
