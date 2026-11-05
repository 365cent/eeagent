package ui

import (
	"math"
	"syscall"
	"unsafe"

	"github.com/rodrigocfd/windigo/co"
	"github.com/rodrigocfd/windigo/win"
)

const (
	pageR, pageG, pageB    = 246, 247, 247
	inkR, inkG, inkB       = 26, 26, 26
	muteR, muteG, muteB    = 120, 124, 128
	brandR, brandG, brandB = 1, 200, 134
	lineR, lineG, lineB    = 229, 231, 233
	errR, errG, errB       = 202, 76, 76
)

type fonts struct{ title, body, small win.HFONT }

func rgb(r, g, b byte) win.COLORREF { return win.RGB(r, g, b) }

func mixColor(a, b [3]byte, t float64) [3]byte {
	if t < 0 {
		t = 0
	}
	if t > 1 {
		t = 1
	}
	var out [3]byte
	for i := 0; i < 3; i++ {
		out[i] = byte(float64(a[i]) + (float64(b[i])-float64(a[i]))*t)
	}
	return out
}

func (a *appState) invalidate() {
	if a.hwnd != 0 {
		_ = a.hwnd.InvalidateRect(nil, false)
	}
}

func (a *appState) paint() {
	var ps win.PAINTSTRUCT
	hdc, err := a.hwnd.BeginPaint(&ps)
	if err != nil {
		return
	}
	defer a.hwnd.EndPaint(&ps)
	rc, err := a.hwnd.GetClientRect()
	if err != nil {
		return
	}
	mem := a.back(hdc, int(rc.Right), int(rc.Bottom))
	if mem == 0 {
		return
	}
	a.paintInto(mem, int(rc.Right), int(rc.Bottom))
	_ = hdc.BitBlt(win.POINT{}, win.SIZE{Cx: rc.Right, Cy: rc.Bottom}, mem, win.POINT{}, co.ROP_SRCCOPY)
}

func (a *appState) back(hdc win.HDC, w, h int) win.HDC {
	if w <= 0 || h <= 0 {
		return 0
	}
	if a.buf != 0 && a.bufW == w && a.bufH == h {
		return a.buf
	}
	a.dropBack()
	mem, err := hdc.CreateCompatibleDC()
	if err != nil {
		return 0
	}
	bmp, err := hdc.CreateCompatibleBitmap(w, h)
	if err != nil {
		_ = mem.DeleteDC()
		return 0
	}
	old, _ := mem.SelectObjectBmp(bmp)
	a.buf, a.bufBmp, a.bufOld, a.bufW, a.bufH = mem, bmp, old, w, h
	return mem
}

func (a *appState) dropBack() {
	if a.buf == 0 {
		return
	}
	if a.bufOld != 0 {
		_, _ = a.buf.SelectObjectBmp(a.bufOld)
	}
	_ = a.bufBmp.DeleteObject()
	_ = a.buf.DeleteDC()
	a.buf, a.bufBmp, a.bufOld = 0, 0, 0
	a.bufW, a.bufH = 0, 0
}

func (a *appState) paintInto(hdc win.HDC, w, h int) {
	_, _ = hdc.SetBkMode(co.BKMODE_TRANSPARENT)
	rc := win.RECT{Right: int32(w), Bottom: int32(h)}
	_ = hdc.FillRect(&rc, a.page)

	f := layoutFrame(w, h, winScale)
	a.lay = f
	a.paintHeader(hdc, f)
	if a.panelOpen {
		a.paintPanel(hdc, f)
		return
	}
	a.paintCard(hdc, f)
	a.paintStatus(hdc, f)
}

func (a *appState) paintHeader(hdc win.HDC, f frame) {
	a.fillAA(hdc, [3]byte{brandR, brandG, brandB}, win.RECT{
		Left: f.header.l + int32(winScale.x(20)), Top: int32(winScale.y(17)),
		Right: f.header.l + int32(winScale.x(28)), Bottom: int32(winScale.y(25)),
	}, 0, true)
	textAt(hdc, a.fonts.title, int(f.header.l)+winScale.x(36), winScale.y(10), rgb(inkR, inkG, inkB), "EEA 采集")
	textAt(hdc, a.fonts.small, int(f.settings.l), winScale.y(14), rgb(muteR, muteG, muteB), "设置")
	textRight(hdc, a.fonts.body, int(f.min.r), winScale.y(12), rgb(muteR, muteG, muteB), "—")
	textRight(hdc, a.fonts.body, int(f.close.r), winScale.y(12), rgb(muteR, muteG, muteB), "×")
}

func (a *appState) paintCard(hdc win.HDC, f frame) {
	a.fillAA(hdc, [3]byte{lineR, lineG, lineB}, f.card.rect(), winScale.x(12), false)
	a.fillAA(hdc, [3]byte{255, 255, 255}, inset(f.card, 1).rect(), winScale.x(11), false)

	hint := "粘贴链接，或把文件拖进来"
	if n := a.pendingLines(); n > 0 {
		hint = "Ctrl+Enter 上传"
	}
	textAt(hdc, a.fonts.small, int(f.hint.l), int(f.hint.t)+winScale.y(4), rgb(muteR, muteG, muteB), hint)
	a.paintPill(hdc, f.send, "上传", a.canSend())
}

func (a *appState) paintPill(hdc win.HDC, b box, label string, on bool) {
	bg := [3]byte{brandR, brandG, brandB}
	fg := rgb(255, 255, 255)
	if !on {
		bg = [3]byte{lineR, lineG, lineB}
		fg = rgb(muteR, muteG, muteB)
	}
	a.fillAA(hdc, bg, b.rect(), b.dy()/2, false)
	sz, err := extent(hdc, a.fonts.body, label)
	x := int(b.l) + (b.dx()-int(sz.Cx))/2
	y := int(b.t) + (b.dy()-int(sz.Cy))/2
	if err != nil {
		x, y = int(b.l)+winScale.x(24), int(b.t)+winScale.y(5)
	}
	textAt(hdc, a.fonts.body, x, y, fg, label)
}

func (a *appState) paintStatus(hdc win.HDC, f frame) {
	col := rgb(muteR, muteG, muteB)
	switch {
	case a.busy > 0:
		col = rgb(inkR, inkG, inkB)
	case a.failed > 0:
		col = rgb(errR, errG, errB)
	}
	textAt(hdc, a.fonts.small, int(f.status.l), int(f.status.t), col,
		fit(hdc, a.fonts.small, a.statusText(), int(f.status.dx())))
}

func (a *appState) paintPanel(hdc win.HDC, f frame) {
	a.fillAA(hdc, [3]byte{lineR, lineG, lineB}, f.panel.rect(), winScale.x(12), false)
	a.fillAA(hdc, [3]byte{255, 255, 255}, inset(f.panel, 1).rect(), winScale.x(11), false)

	label := func(b box, text string) {
		textAt(hdc, a.fonts.small, int(b.l), int(b.t), rgb(muteR, muteG, muteB), text)
	}
	field := func(b box) {
		a.fillAA(hdc, [3]byte{lineR, lineG, lineB}, b.rect(), winScale.x(7), false)
		a.fillAA(hdc, [3]byte{255, 255, 255}, inset(b, 1).rect(), winScale.x(6), false)
	}

	label(f.apiLabel, "接口地址")
	field(f.apiField)
	label(f.parallelLabel, "并发")
	label(f.maxLabel, "上传上限 MB")
	label(f.timeLabel, "超时 秒")
	field(f.parallelField)
	field(f.maxField)
	field(f.timeField)

	a.paintSwitch(hdc, f.engineRow, "抓取引擎 · "+a.engineText(), a.engineChrome)
	a.paintSwitch(hdc, f.headlessRow, "无窗口", a.headlessOn)

	textAt(hdc, a.fonts.small, int(f.profile.l), int(f.profile.t), rgb(muteR, muteG, muteB),
		fit(hdc, a.fonts.small, "Profile  "+a.profilePath(), int(f.profile.dx())))
	note := a.panelNote
	noteColor := rgb(errR, errG, errB)
	if note == "" {
		note = "配置保存到 config.json"
		noteColor = rgb(muteR, muteG, muteB)
	}
	textAt(hdc, a.fonts.small, int(f.note.l), int(f.note.t), noteColor,
		fit(hdc, a.fonts.small, note, int(f.note.dx())))

	a.paintPill(hdc, f.save, "保存", true)
	sz, err := extent(hdc, a.fonts.body, "取消")
	x, y := int(f.cancel.l)+winScale.x(20), int(f.cancel.t)+winScale.y(6)
	if err == nil {
		x = int(f.cancel.l) + (f.cancel.dx()-int(sz.Cx))/2
		y = int(f.cancel.t) + (f.cancel.dy()-int(sz.Cy))/2
	}
	textAt(hdc, a.fonts.body, x, y, rgb(muteR, muteG, muteB), "取消")
}

func (a *appState) paintSwitch(hdc win.HDC, b box, label string, on bool) {
	if b.empty() {
		return
	}
	trackW, trackH := winScale.x(32), winScale.y(16)
	top := int(b.t) + (b.dy()-trackH)/2
	track := win.RECT{Left: b.l, Top: int32(top), Right: b.l + int32(trackW), Bottom: int32(top + trackH)}
	col := [3]byte{210, 214, 216}
	if on {
		col = [3]byte{brandR, brandG, brandB}
	}
	a.fillAA(hdc, col, track, trackH/2, false)
	knob := trackH - winScale.y(4)
	if knob < 4 {
		knob = 4
	}
	x := int(track.Left) + winScale.x(2)
	if on {
		x = int(track.Right) - knob - winScale.x(2)
	}
	y := top + (trackH-knob)/2
	a.fillAA(hdc, [3]byte{255, 255, 255}, win.RECT{
		Left: int32(x), Top: int32(y), Right: int32(x + knob), Bottom: int32(y + knob),
	}, 0, true)
	textAt(hdc, a.fonts.small, int(b.l)+trackW+winScale.x(8), int(b.t)+winScale.y(5),
		rgb(inkR, inkG, inkB), label)
}

func (a *appState) fillAA(hdc win.HDC, col [3]byte, rc win.RECT, radius int, disc bool) {
	w := int(rc.Right - rc.Left)
	h := int(rc.Bottom - rc.Top)
	if w < 1 || h < 1 {
		return
	}
	if !gdipFill(hdc, col, rc, radius, disc) {
		br := solidBrush(col[0], col[1], col[2])
		if disc {
			prevB, _ := hdc.SelectObjectBrush(br)
			prevP, _ := hdc.SelectObjectPen(a.nullPen)
			_ = hdc.Ellipse(rc)
			_, _ = hdc.SelectObjectBrush(prevB)
			_, _ = hdc.SelectObjectPen(prevP)
		} else {
			fillRound(hdc, br, a.nullPen, rc, radius)
		}
		_ = br.DeleteObject()
	}
}

func fillRound(hdc win.HDC, brush win.HBRUSH, pen win.HPEN, rc win.RECT, radius int) {
	prevB, _ := hdc.SelectObjectBrush(brush)
	prevP, _ := hdc.SelectObjectPen(pen)
	_ = hdc.RoundRect(rc, win.SIZE{Cx: int32(radius * 2), Cy: int32(radius * 2)})
	_, _ = hdc.SelectObjectBrush(prevB)
	_, _ = hdc.SelectObjectPen(prevP)
}

func textAt(hdc win.HDC, font win.HFONT, x, y int, color win.COLORREF, text string) {
	if text == "" || font == 0 {
		return
	}
	prev, _ := hdc.SelectObjectFont(font)
	_, _ = hdc.SetTextColor(color)
	_ = hdc.TextOut(x, y, text)
	if prev != 0 {
		_, _ = hdc.SelectObjectFont(prev)
	}
}

func textRight(hdc win.HDC, font win.HFONT, right, y int, color win.COLORREF, text string) {
	if text == "" || font == 0 {
		return
	}
	prev, _ := hdc.SelectObjectFont(font)
	_, _ = hdc.SetTextColor(color)
	_ = hdc.SetTextAlign(co.TA_RIGHT)
	_ = hdc.TextOut(right, y, text)
	_ = hdc.SetTextAlign(co.TA_LEFT)
	if prev != 0 {
		_, _ = hdc.SelectObjectFont(prev)
	}
}

func extent(hdc win.HDC, font win.HFONT, text string) (win.SIZE, error) {
	prev, _ := hdc.SelectObjectFont(font)
	sz, err := hdc.GetTextExtentPoint32(text)
	if prev != 0 {
		_, _ = hdc.SelectObjectFont(prev)
	}
	return sz, err
}

func fit(hdc win.HDC, font win.HFONT, text string, maxPx int) string {
	if maxPx <= 8 || text == "" {
		return ""
	}
	sz, err := extent(hdc, font, text)
	if err != nil || int(sz.Cx) <= maxPx {
		return text
	}
	runes := []rune(text)
	for len(runes) > 1 {
		runes = runes[:len(runes)-1]
		sz, err = extent(hdc, font, string(runes)+"…")
		if err == nil && int(sz.Cx) <= maxPx {
			return string(runes) + "…"
		}
	}
	return ""
}

type gdipStartupIn struct {
	version       uint32
	debug         uintptr
	suppressBg    int32
	suppressCodec int32
}

type gdipPoint struct{ x, y int32 }

var (
	gdipToken          uintptr
	procGdipStartup    = syscall.NewLazyDLL("gdiplus.dll").NewProc("GdiplusStartup")
	procGdipFromHDC    = syscall.NewLazyDLL("gdiplus.dll").NewProc("GdipCreateFromHDC")
	procGdipSmooth     = syscall.NewLazyDLL("gdiplus.dll").NewProc("GdipSetSmoothingMode")
	procGdipSolid      = syscall.NewLazyDLL("gdiplus.dll").NewProc("GdipCreateSolidFill")
	procGdipEllipse    = syscall.NewLazyDLL("gdiplus.dll").NewProc("GdipFillEllipseI")
	procGdipPolygon    = syscall.NewLazyDLL("gdiplus.dll").NewProc("GdipFillPolygonI")
	procGdipDelBrush   = syscall.NewLazyDLL("gdiplus.dll").NewProc("GdipDeleteBrush")
	procGdipDelGraphic = syscall.NewLazyDLL("gdiplus.dll").NewProc("GdipDeleteGraphics")
)

func gdipReady() bool {
	if gdipToken != 0 {
		return true
	}
	in := gdipStartupIn{version: 1}
	r, _, _ := procGdipStartup.Call(uintptr(unsafe.Pointer(&gdipToken)), uintptr(unsafe.Pointer(&in)), 0)
	return r == 0 && gdipToken != 0
}

// gdipFill paints an anti-aliased rounded rectangle, or a disc when disc is set.
func gdipFill(hdc win.HDC, col [3]byte, rc win.RECT, radius int, disc bool) bool {
	if !gdipReady() {
		return false
	}
	var g, brush uintptr
	if r, _, _ := procGdipFromHDC.Call(uintptr(hdc), uintptr(unsafe.Pointer(&g))); r != 0 || g == 0 {
		return false
	}
	defer procGdipDelGraphic.Call(g)
	_, _, _ = procGdipSmooth.Call(g, 4) // SmoothingModeAntiAlias
	argb := uint32(0xFF)<<24 | uint32(col[0])<<16 | uint32(col[1])<<8 | uint32(col[2])
	if r, _, _ := procGdipSolid.Call(uintptr(argb), uintptr(unsafe.Pointer(&brush))); r != 0 || brush == 0 {
		return false
	}
	defer procGdipDelBrush.Call(brush)
	w := int(rc.Right - rc.Left)
	h := int(rc.Bottom - rc.Top)
	if disc {
		r, _, _ := procGdipEllipse.Call(g, brush, uintptr(rc.Left), uintptr(rc.Top), uintptr(w), uintptr(h))
		return r == 0
	}
	pts := roundPoly(rc, radius)
	if len(pts) < 3 {
		return false
	}
	r, _, _ := procGdipPolygon.Call(g, brush, uintptr(unsafe.Pointer(&pts[0])), uintptr(len(pts)), 0)
	return r == 0
}

func roundPoly(rc win.RECT, radius int) []gdipPoint {
	x0, y0 := float64(rc.Left), float64(rc.Top)
	x1, y1 := float64(rc.Right-rc.Left), float64(rc.Bottom-rc.Top)
	r := float64(radius)
	if r > x1/2 {
		r = x1 / 2
	}
	if r > y1/2 {
		r = y1 / 2
	}
	if r < 1 {
		return []gdipPoint{{rc.Left, rc.Top}, {rc.Right, rc.Top}, {rc.Right, rc.Bottom}, {rc.Left, rc.Bottom}}
	}
	const n = 5
	pts := make([]gdipPoint, 0, n*4)
	add := func(cx, cy, from, sweep float64) {
		for i := 0; i <= n; i++ {
			a := (from + sweep*float64(i)/float64(n)) * math.Pi / 180
			pts = append(pts, gdipPoint{
				x: int32(math.Round(x0 + cx + r*math.Cos(a))),
				y: int32(math.Round(y0 + cy + r*math.Sin(a))),
			})
		}
	}
	add(x1-r, r, 270, 90)
	add(x1-r, y1-r, 0, 90)
	add(r, y1-r, 90, 90)
	add(r, r, 180, 90)
	return pts
}

var (
	procCreateSolidBrush = syscall.NewLazyDLL("gdi32.dll").NewProc("CreateSolidBrush")
	procTrackMouse       = syscall.NewLazyDLL("user32.dll").NewProc("TrackMouseEvent")
	procDwm              = syscall.NewLazyDLL("dwmapi.dll").NewProc("DwmSetWindowAttribute")
	procSetCursor        = syscall.NewLazyDLL("user32.dll").NewProc("SetCursor")
)

func solidBrush(r, g, b byte) win.HBRUSH {
	color := uintptr(r) | uintptr(g)<<8 | uintptr(b)<<16
	h, _, _ := procCreateSolidBrush.Call(color)
	return win.HBRUSH(h)
}

type trackMouseEvent struct {
	Size      uint32
	Flags     uint32
	Hwnd      uintptr
	HoverTime uint32
}

func trackLeave(hwnd win.HWND) {
	t := trackMouseEvent{Size: uint32(unsafe.Sizeof(trackMouseEvent{})), Flags: 2, Hwnd: uintptr(hwnd)}
	_, _, _ = procTrackMouse.Call(uintptr(unsafe.Pointer(&t)))
}

func roundWindow(hwnd win.HWND) {
	var pref int32 = 2
	_, _, _ = procDwm.Call(uintptr(hwnd), 33, uintptr(unsafe.Pointer(&pref)), 4)
	none := uint32(0xFFFFFFFE)
	_, _, _ = procDwm.Call(uintptr(hwnd), 34, uintptr(unsafe.Pointer(&none)), 4)
}

func setCursor(c win.HCURSOR) { _, _, _ = procSetCursor.Call(uintptr(c)) }
