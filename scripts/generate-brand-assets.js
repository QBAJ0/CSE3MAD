const fs = require("fs");
const path = require("path");
const { PNG } = require("pngjs");

const OUT_DIR = path.join(__dirname, "..", "assets", "images");

const COLORS = {
  teal: "#007C7A",
  tealDark: "#005F5E",
  blue: "#2F80ED",
  orange: "#F28C28",
  cream: "#F6D7A8",
  white: "#FFFFFF",
  dark: "#12343B",
  pale: "#E6F4FE",
};

function hexToRgba(hex, alpha = 255) {
  const clean = hex.replace("#", "");
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
    a: alpha,
  };
}

function createCanvas(size, background) {
  const png = new PNG({ width: size, height: size });
  const bg = background ? hexToRgba(background) : { r: 0, g: 0, b: 0, a: 0 };
  for (let i = 0; i < png.data.length; i += 4) {
    png.data[i] = bg.r;
    png.data[i + 1] = bg.g;
    png.data[i + 2] = bg.b;
    png.data[i + 3] = bg.a;
  }
  return png;
}

function blend(png, x, y, color) {
  if (x < 0 || y < 0 || x >= png.width || y >= png.height || color.a <= 0) return;
  const idx = (Math.floor(y) * png.width + Math.floor(x)) * 4;
  const srcA = color.a / 255;
  const dstA = png.data[idx + 3] / 255;
  const outA = srcA + dstA * (1 - srcA);
  if (outA <= 0) return;
  png.data[idx] = Math.round((color.r * srcA + png.data[idx] * dstA * (1 - srcA)) / outA);
  png.data[idx + 1] = Math.round((color.g * srcA + png.data[idx + 1] * dstA * (1 - srcA)) / outA);
  png.data[idx + 2] = Math.round((color.b * srcA + png.data[idx + 2] * dstA * (1 - srcA)) / outA);
  png.data[idx + 3] = Math.round(outA * 255);
}

function fillCircle(png, cx, cy, r, color) {
  const c = typeof color === "string" ? hexToRgba(color) : color;
  const minX = Math.floor(cx - r);
  const maxX = Math.ceil(cx + r);
  const minY = Math.floor(cy - r);
  const maxY = Math.ceil(cy + r);
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      if (dx * dx + dy * dy <= r * r) blend(png, x, y, c);
    }
  }
}

function strokeLine(png, x1, y1, x2, y2, width, color) {
  const c = typeof color === "string" ? hexToRgba(color) : color;
  const r = width / 2;
  const minX = Math.floor(Math.min(x1, x2) - r);
  const maxX = Math.ceil(Math.max(x1, x2) + r);
  const minY = Math.floor(Math.min(y1, y2) - r);
  const maxY = Math.ceil(Math.max(y1, y2) + r);
  const vx = x2 - x1;
  const vy = y2 - y1;
  const len2 = vx * vx + vy * vy || 1;
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const px = x + 0.5;
      const py = y + 0.5;
      const t = Math.max(0, Math.min(1, ((px - x1) * vx + (py - y1) * vy) / len2));
      const qx = x1 + t * vx;
      const qy = y1 + t * vy;
      const dx = px - qx;
      const dy = py - qy;
      if (dx * dx + dy * dy <= r * r) blend(png, x, y, c);
    }
  }
}

function strokePolyline(png, points, width, color) {
  for (let i = 1; i < points.length; i++) {
    strokeLine(png, points[i - 1][0], points[i - 1][1], points[i][0], points[i][1], width, color);
  }
  points.forEach(([x, y]) => fillCircle(png, x, y, width / 2, color));
}

function bezierPoint(t, p0, p1, p2, p3) {
  const u = 1 - t;
  return [
    u ** 3 * p0[0] + 3 * u ** 2 * t * p1[0] + 3 * u * t ** 2 * p2[0] + t ** 3 * p3[0],
    u ** 3 * p0[1] + 3 * u ** 2 * t * p1[1] + 3 * u * t ** 2 * p2[1] + t ** 3 * p3[1],
  ];
}

function sCurve(size) {
  const p = [];
  const curves = [
    [[0.66, 0.24], [0.32, 0.16], [0.18, 0.36], [0.50, 0.48]],
    [[0.50, 0.48], [0.85, 0.61], [0.70, 0.87], [0.34, 0.76]],
  ];
  curves.forEach((curve) => {
    for (let i = 0; i <= 34; i++) {
      const pt = bezierPoint(i / 34, ...curve);
      p.push([pt[0] * size, pt[1] * size]);
    }
  });
  return p;
}

function downsample(src, factor) {
  const dst = new PNG({ width: src.width / factor, height: src.height / factor });
  const area = factor * factor;
  for (let y = 0; y < dst.height; y++) {
    for (let x = 0; x < dst.width; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let yy = 0; yy < factor; yy++) {
        for (let xx = 0; xx < factor; xx++) {
          const idx = ((y * factor + yy) * src.width + (x * factor + xx)) * 4;
          r += src.data[idx];
          g += src.data[idx + 1];
          b += src.data[idx + 2];
          a += src.data[idx + 3];
        }
      }
      const out = (y * dst.width + x) * 4;
      dst.data[out] = Math.round(r / area);
      dst.data[out + 1] = Math.round(g / area);
      dst.data[out + 2] = Math.round(b / area);
      dst.data[out + 3] = Math.round(a / area);
    }
  }
  return dst;
}

function writePng(name, png) {
  fs.writeFileSync(path.join(OUT_DIR, name), PNG.sync.write(png));
}

function drawMark(png, opts = {}) {
  const s = png.width;
  const mono = opts.mono;
  const main = mono ? COLORS.white : COLORS.white;
  const blue = mono ? COLORS.white : COLORS.blue;
  const orange = mono ? COLORS.white : COLORS.orange;
  const cream = mono ? COLORS.white : COLORS.cream;

  strokeLine(png, s * 0.28, s * 0.34, s * 0.70, s * 0.26, s * 0.035, hexToRgba(cream, mono ? 130 : 180));
  strokeLine(png, s * 0.70, s * 0.26, s * 0.78, s * 0.68, s * 0.035, hexToRgba(cream, mono ? 130 : 180));
  strokeLine(png, s * 0.78, s * 0.68, s * 0.32, s * 0.75, s * 0.035, hexToRgba(cream, mono ? 130 : 180));

  fillCircle(png, s * 0.28, s * 0.34, s * 0.055, orange);
  fillCircle(png, s * 0.70, s * 0.26, s * 0.055, blue);
  fillCircle(png, s * 0.78, s * 0.68, s * 0.055, cream);
  fillCircle(png, s * 0.32, s * 0.75, s * 0.055, blue);

  strokePolyline(png, sCurve(s), s * 0.16, hexToRgba(COLORS.dark, mono ? 95 : 65));
  strokePolyline(png, sCurve(s), s * 0.118, main);
  strokePolyline(png, sCurve(s), s * 0.062, mono ? COLORS.white : COLORS.teal);

  fillCircle(png, s * 0.50, s * 0.51, s * 0.055, mono ? COLORS.white : COLORS.orange);
  fillCircle(png, s * 0.50, s * 0.51, s * 0.025, mono ? COLORS.teal : COLORS.white);
}

function makeIcon() {
  const factor = 3;
  const size = 1024 * factor;
  const png = createCanvas(size, COLORS.teal);
  fillCircle(png, size * 0.50, size * 0.50, size * 0.43, hexToRgba(COLORS.tealDark, 135));
  fillCircle(png, size * 0.50, size * 0.50, size * 0.38, hexToRgba(COLORS.white, 25));
  drawMark(png);
  return downsample(png, factor);
}

function makeForeground() {
  const factor = 3;
  const size = 1024 * factor;
  const png = createCanvas(size, null);
  drawMark(png);
  return downsample(png, factor);
}

function makeBackground() {
  const factor = 2;
  const size = 1024 * factor;
  const png = createCanvas(size, COLORS.teal);
  fillCircle(png, size * 0.18, size * 0.18, size * 0.26, hexToRgba(COLORS.blue, 55));
  fillCircle(png, size * 0.88, size * 0.20, size * 0.20, hexToRgba(COLORS.cream, 75));
  fillCircle(png, size * 0.22, size * 0.88, size * 0.22, hexToRgba(COLORS.orange, 60));
  fillCircle(png, size * 0.80, size * 0.82, size * 0.30, hexToRgba(COLORS.tealDark, 80));
  return downsample(png, factor);
}

function makeMonochrome() {
  const factor = 3;
  const size = 1024 * factor;
  const png = createCanvas(size, null);
  drawMark(png, { mono: true });
  return downsample(png, factor);
}

function makeSplashIcon() {
  const factor = 3;
  const size = 1024 * factor;
  const png = createCanvas(size, null);
  fillCircle(png, size * 0.50, size * 0.50, size * 0.31, COLORS.teal);
  fillCircle(png, size * 0.50, size * 0.50, size * 0.275, hexToRgba(COLORS.white, 30));
  drawMark(png);
  return downsample(png, factor);
}

function resizeNearest(src, size) {
  const dst = new PNG({ width: size, height: size });
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const sx = Math.floor((x / size) * src.width);
      const sy = Math.floor((y / size) * src.height);
      const si = (sy * src.width + sx) * 4;
      const di = (y * size + x) * 4;
      dst.data[di] = src.data[si];
      dst.data[di + 1] = src.data[si + 1];
      dst.data[di + 2] = src.data[si + 2];
      dst.data[di + 3] = src.data[si + 3];
    }
  }
  return dst;
}

fs.mkdirSync(OUT_DIR, { recursive: true });

const icon = makeIcon();
writePng("icon.png", icon);
writePng("android-icon-background.png", makeBackground());
writePng("android-icon-foreground.png", makeForeground());
writePng("android-icon-monochrome.png", makeMonochrome());
writePng("splash-icon.png", makeSplashIcon());
writePng("favicon.png", resizeNearest(icon, 48));

console.log("Generated Stemmlab product icon and splash assets.");
