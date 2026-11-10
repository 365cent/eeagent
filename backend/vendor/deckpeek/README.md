# deckpeek (vendored)

Single-file PPTX → HTML slide viewer used by `app.services.pptx_deck_preview`.

- **Source**: `reference-will-deleted/deckpeek-src-20261028.zip` / `deckpeek.py` (see git history).
- **License**: Use only under the same terms as the reference package; do not redistribute outside this repo without review.
- **EEA changes**: Loading via `importlib` from this path; `export()` is monkey-patched in `pptx_deck_preview.py` for server builds (no missing-slide banner). Slide PNGs may be supplied from `pptx_slide_render` (LibreOffice + pypdfium2) instead of PowerPoint COM.

Do not edit `deckpeek.py` unless upgrading from a new upstream drop; prefer patches in `pptx_deck_preview.py`.
