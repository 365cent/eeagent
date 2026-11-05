package ui

import (
	wui "github.com/rodrigocfd/windigo/ui"
	"github.com/rodrigocfd/windigo/win"
)

// box is an integer client-area rectangle.
type box struct{ l, t, r, b int32 }

func (b box) empty() bool { return b.r <= b.l || b.b <= b.t }

func (b box) rect() win.RECT {
	return win.RECT{Left: b.l, Top: b.t, Right: b.r, Bottom: b.b}
}

func (b box) contains(x, y int32) bool {
	return x >= b.l && x < b.r && y >= b.t && y < b.b
}

func (b box) dx() int { return int(b.r - b.l) }
func (b box) dy() int { return int(b.b - b.t) }

func inset(b box, d int32) box {
	return box{b.l + d, b.t + d, b.r - d, b.b - d}
}

// scale converts logical pixels to device pixels; tests inject identity.
type scale struct{ x, y func(int) int }

var winScale = scale{x: wui.DpiX, y: wui.DpiY}

// frame holds every painted hit area for a given client size.
type frame struct {
	header                       box
	settings, min, close         box
	card                         box
	area                         box
	hint, send                   box
	status                       box
	panel                        box
	apiLabel, apiField           box
	parallelLabel, parallelField box
	maxLabel, maxField           box
	timeLabel, timeField         box
	engineRow, headlessRow       box
	profile, note                box
	save, cancel                 box
}

// layoutFrame lays out the window at the given client size.
func layoutFrame(w, h int, s scale) frame {
	px, py := s.x, s.y
	var f frame
	f.header = box{0, 0, int32(w), int32(py(44))}

	right := int32(w - px(14))
	f.close = box{right - int32(px(22)), int32(py(11)), right, int32(py(33))}
	f.min = box{f.close.l - int32(px(12)) - int32(px(22)), int32(py(11)), f.close.l - int32(px(12)), int32(py(33))}
	f.settings = box{f.min.l - int32(px(16)) - int32(px(46)), int32(py(11)), f.min.l - int32(px(16)), int32(py(33))}

	margin := int32(px(16))
	f.card = box{margin, int32(py(52)), int32(w) - margin, int32(py(252))}
	f.area = box{f.card.l + int32(px(14)), f.card.t + int32(py(14)), f.card.r - int32(px(14)), f.card.b - int32(py(38))}
	f.send = box{f.card.r - int32(px(14)) - int32(px(78)), f.card.b - int32(py(40)), f.card.r - int32(px(14)), f.card.b - int32(py(12))}
	f.hint = box{f.area.l, f.card.b - int32(py(26)), f.send.l - int32(px(8)), f.card.b - int32(py(12))}
	f.status = box{int32(px(20)), int32(py(262)), int32(w) - int32(px(20)), int32(py(282))}

	f.panel = box{margin, f.card.t, int32(w) - margin, int32(py(292))}
	left := f.panel.l + int32(px(12))
	rightIn := f.panel.r - int32(px(12))

	f.apiLabel = box{left, int32(py(62)), rightIn, int32(py(74))}
	f.apiField = box{left, int32(py(76)), rightIn, int32(py(104))}

	colW := (rightIn - left - int32(px(24))) / 3
	second := left + colW + int32(px(12))
	third := second + colW + int32(px(12))
	f.parallelLabel = box{left, int32(py(112)), left + colW, int32(py(124))}
	f.maxLabel = box{second, int32(py(112)), second + colW, int32(py(124))}
	f.timeLabel = box{third, int32(py(112)), third + colW, int32(py(124))}
	f.parallelField = box{left, int32(py(126)), left + colW, int32(py(152))}
	f.maxField = box{second, int32(py(126)), second + colW, int32(py(152))}
	f.timeField = box{third, int32(py(126)), third + colW, int32(py(152))}

	f.engineRow = box{left, int32(py(164)), left + int32(px(170)), int32(py(190))}
	f.headlessRow = box{left + int32(px(190)), int32(py(164)), rightIn, int32(py(190))}

	f.profile = box{left, int32(py(196)), rightIn, int32(py(210))}
	f.note = box{left, int32(py(218)), rightIn, int32(py(234))}

	f.save = box{rightIn - int32(px(84)), int32(py(250)), rightIn, int32(py(278))}
	f.cancel = box{f.save.l - int32(px(10)) - int32(px(62)), int32(py(250)), f.save.l - int32(px(10)), int32(py(278))}
	return f
}
