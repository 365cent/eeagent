//go:build windows

package ui

import "testing"

func ident() scale {
	return scale{x: func(v int) int { return v }, y: func(v int) int { return v }}
}

func TestLayoutFitsWindow(t *testing.T) {
	const w, h = 460, 308
	f := layoutFrame(w, h, ident())

	if f.card.r > int32(w) || f.card.b > int32(h) {
		t.Fatalf("card %+v exceeds window %dx%d", f.card, w, h)
	}
	if f.area.empty() || !contains(f.card, f.area) {
		t.Fatalf("paste area %+v must sit inside card %+v", f.area, f.card)
	}
	if !contains(f.card, f.send) || !contains(f.card, f.hint) {
		t.Fatalf("send %+v / hint %+v must sit inside card %+v", f.send, f.hint, f.card)
	}
	if f.hint.r > f.send.l {
		t.Fatalf("hint overlaps send: %+v vs %+v", f.hint, f.send)
	}
	if !contains(f.panel, f.save) || !contains(f.panel, f.cancel) {
		t.Fatalf("panel buttons outside panel")
	}
	for _, b := range []box{f.linkNav, f.manualNav, f.jobsNav, f.manualURL, f.manualTitle, f.manualBody, f.jobPrev, f.jobNext} {
		if b.empty() {
			t.Fatalf("interactive area is empty: %+v", b)
		}
	}
	for i, row := range f.jobRows {
		if !contains(f.card, row) || !contains(row, f.jobPrimary[i]) || !contains(row, f.jobSecondary[i]) {
			t.Fatalf("job row/action outside card: row=%+v primary=%+v secondary=%+v", row, f.jobPrimary[i], f.jobSecondary[i])
		}
	}
	for _, b := range []box{f.apiField, f.parallelField, f.maxField, f.timeField, f.engineRow, f.headlessRow} {
		if !contains(f.panel, b) {
			t.Fatalf("settings box %+v outside panel %+v", b, f.panel)
		}
	}
	if f.parallelField.r > f.maxField.l || f.maxField.r > f.timeField.l {
		t.Fatalf("value fields overlap")
	}
}

func TestHeaderButtonsOrdered(t *testing.T) {
	f := layoutFrame(460, 308, ident())
	if f.settings.r > f.min.l || f.min.r > f.close.l {
		t.Fatalf("header buttons overlap: %+v %+v %+v", f.settings, f.min, f.close)
	}
	if f.close.r > 460 {
		t.Fatalf("close outside window: %+v", f.close)
	}
}

func contains(outer, inner box) bool {
	return inner.l >= outer.l && inner.t >= outer.t && inner.r <= outer.r && inner.b <= outer.b
}
