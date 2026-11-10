"""deckpeek 图标：一份几何，两种渲染（SVG 源 + 多尺寸 ico）。

设计：Kimi 风格的「讲演中的圆球角色」—— 无背景、透明底。
一颗品牌蓝的圆球（渐变出圆球感）+ 两只白眼睛当角色，右手一支藏青教棒，
指着右上角的深蓝演示板（板上有两条浅色内容条）。
"""
import pathlib

from PIL import Image, ImageDraw

TILE = 512
SS = 2                                   # 渲染倍率（球体渐变自带柔边）

NAVY = "#002F5B"                         # Kimi 深海军蓝：演示板
BLUE = "#007CFF"                         # Kimi 品牌蓝：教棒
BLUE_HI = "#4FA8FF"                      # Kimi 亮蓝：球顶、板上浅色文字
BLUE_LO = "#0066D6"                      # 球底
WHITE = "#FFFFFF"

BOARD = (232, 96, 248, 156, 20)          # 演示板 x, y, w, h, 圆角
MARKS = [(268, 140, 148, 24, 12, WHITE),          # 板上的标题条
         (268, 186, 100, 16, 8, BLUE_HI)]         # 板上的正文线
BALL = (176, 312, 132)                   # 角色圆球 cx, cy, r
EYES = [(128, 296, 24), (224, 296, 24)]  # 两只眼睛
# 教棒：起于球的下部、自下而上指向板子；白棒身 + 藏青描边，三种底色上都分得开
STICK = (252, 412, 312, 244, 20)         # x1, y1, x2, y2, 棒身粗细
STICK_EDGE = 28                          # 描边后的总粗细


# ---------------------------------------------------------------- SVG 源 --
def svg_text():
    x, y, w, h, r = BOARD
    out = [
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">',
        '  <title>deckpeek</title>',
        '  <desc>A Kimi-style ball character pointing a stick at a presentation board.</desc>',
        '  <defs>',
        '    <linearGradient id="ball" x1="0" y1="0" x2="0" y2="1">',
        '      <stop offset="0" stop-color="%s"/>' % BLUE_HI,
        '      <stop offset="1" stop-color="%s"/>' % BLUE_LO,
        '    </linearGradient>',
        '  </defs>',
        '  <rect x="%d" y="%d" width="%d" height="%d" rx="%d" fill="%s"/>  <!-- 演示板 -->'
        % (x, y, w, h, r, NAVY),
    ]
    for mx, my, mw, mh, mr, mcol in MARKS:
        out.append('  <rect x="%d" y="%d" width="%d" height="%d" rx="%d" fill="%s"/>'
                   % (mx, my, mw, mh, mr, mcol))
    out.append('  <circle cx="%d" cy="%d" r="%d" fill="url(#ball)"/>' % BALL)
    x1, y1, x2, y2, sw = STICK
    out.append('  <line x1="%d" y1="%d" x2="%d" y2="%d" stroke="%s" stroke-width="%d" '
               'stroke-linecap="round"/>' % (x1, y1, x2, y2, NAVY, STICK_EDGE))
    out.append('  <line x1="%d" y1="%d" x2="%d" y2="%d" stroke="%s" stroke-width="%d" '
               'stroke-linecap="round"/>' % (x1, y1, x2, y2, WHITE, sw))
    for ex, ey, er in EYES:
        out.append('  <circle cx="%d" cy="%d" r="%d" fill="%s"/>' % (ex, ey, er, WHITE))
    out.append('</svg>')
    return "\n".join(out) + "\n"


# ------------------------------------------------------------ 光栅化 --
def _rgb(hx):
    hx = hx.lstrip("#")
    return tuple(int(hx[i:i + 2], 16) for i in (0, 2, 4))


def _k(size):
    return size / float(TILE)


def ball_layer(size):
    """A vertically graded circle, so the shape reads as a ball and not a disc."""
    grad = Image.new("RGBA", (size, size))
    d = ImageDraw.Draw(grad)
    hi, lo = _rgb(BLUE_HI), _rgb(BLUE_LO)
    for y in range(size):
        t = y / float(max(1, size - 1))
        d.line([(0, y), (size, y)],
               fill=tuple(int(round(a + (b - a) * t)) for a, b in zip(hi, lo)) + (255,))
    cx, cy, r = BALL
    k = _k(size)
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).ellipse([(cx - r) * k, (cy - r) * k, (cx + r) * k, (cy + r) * k],
                                 fill=255)
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.paste(grad, (0, 0), mask)
    return out


def _rrect(d, x, y, w, h, r, fill, k):
    """Rounded rect in design coords; radius never exceeds half the box (PIL would raise)."""
    x0, y0 = x * k, y * k
    x1, y1 = x0 + w * k, y0 + h * k
    return d.rounded_rectangle([x0, y0, x1, y1],
                               radius=max(0.0, min(r * k, (x1 - x0) / 2.0, (y1 - y0) / 2.0)),
                               fill=fill)


def render(size):
    k = _k(size)
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    _rrect(d, *BOARD, fill=NAVY, k=k)                       # 演示板
    for mx, my, mw, mh, mr, mcol in MARKS:                  # 板上内容
        _rrect(d, mx, my, mw, mh, mr, mcol, k)
    img = Image.alpha_composite(img, ball_layer(size))      # 角色圆球
    x1, y1, x2, y2, sw = STICK                              # 教棒：先藏青描边、再白棒身
    d = ImageDraw.Draw(img)

    def capsule(shine_width, colour):
        d.line([x1 * k, y1 * k, x2 * k, y2 * k], fill=colour,
               width=max(1, int(round(shine_width * k))))
        for px, py in ((x1, y1), (x2, y2)):
            rr = max(0.5, shine_width * k / 2.0)
            d.ellipse([px * k - rr, py * k - rr, px * k + rr, py * k + rr], fill=colour)

    capsule(STICK_EDGE, NAVY)
    capsule(sw, WHITE)
    for ex, ey, er in EYES:                                 # 眼睛
        d.ellipse([(ex - er) * k, (ey - er) * k, (ex + er) * k, (ey + er) * k], fill=WHITE)
    return img


if __name__ == "__main__":
    root = pathlib.Path(__file__).resolve().parent     # 就在本文件旁边生成
    out = root / "build"                               # 预览图属于构建产物
    out.mkdir(exist_ok=True)
    (root / "deckpeek.svg").write_text(svg_text(), encoding="utf-8")
    render(TILE * SS).save(
        root / "deckpeek.ico",
        sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
    render(256).save(out / "icon_preview.png")
    parts = [render(256)]
    for s in (48, 32, 16):
        parts.append(render(s).resize((s * 6, s * 6), Image.NEAREST))
    total = sum(p.width for p in parts) + 20 * (len(parts) - 1)
    sheet = Image.new("RGBA", (total, max(p.height for p in parts)), (245, 247, 250, 255))
    x = 0
    for p in parts:
        sheet.alpha_composite(p, (x, 0))
        x += p.width + 20
    sheet.convert("RGB").save(out / "icon_sheet.png")
    print("deckpeek.svg / deckpeek.ico 已更新")
