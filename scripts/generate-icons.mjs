import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "icons");

const BG = [14, 10, 24];
const GOLD_HI = [240, 221, 171];
const GOLD_LO = [181, 143, 76];
const GOLD_GLOW = [200, 169, 110];

const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const tb = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([tb, data])));
  return Buffer.concat([len, tb, data, crc]);
}

function encodePNG(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    Buffer.from(rgba.buffer, rgba.byteOffset + y * stride, stride).copy(raw, y * (stride + 1) + 1);
  }
  const idat = deflateSync(raw);
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

function starVertices(cx, cy, R, r, points = 5) {
  const v = [];
  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? R : r;
    const angle = -Math.PI / 2 + (i * Math.PI) / points;
    v.push([cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)]);
  }
  return v;
}

function pointInPoly(x, y, verts) {
  let inside = false;
  for (let i = 0, j = verts.length - 1; i < verts.length; j = i++) {
    const [xi, yi] = verts[i];
    const [xj, yj] = verts[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function renderIcon(size, starFactor) {
  const S = 4;
  const R = size * starFactor;
  const r = R * 0.382;
  const cx = size / 2;
  const cy = size / 2;
  const verts = starVertices(cx, cy, R, r);

  const px = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let rSum = 0, gSum = 0, bSum = 0;
      for (let sy = 0; sy < S; sy++) {
        for (let sx = 0; sx < S; sx++) {
          const px = x + (sx + 0.5) / S;
          const py = y + (sy + 0.5) / S;
          let cr = BG[0], cg = BG[1], cb = BG[2];
          const d = Math.hypot(px - cx, py - cy) / size;
          const glow = Math.max(0, 1 - d / 0.55) * 0.22;
          cr += (GOLD_GLOW[0] - BG[0]) * glow;
          cg += (GOLD_GLOW[1] - BG[1]) * glow;
          cb += (GOLD_GLOW[2] - BG[2]) * glow;
          if (pointInPoly(px, py, verts)) {
            const t = Math.min(1, Math.max(0, (py - (cy - R)) / (2 * R)));
            cr = GOLD_HI[0] + (GOLD_LO[0] - GOLD_HI[0]) * t;
            cg = GOLD_HI[1] + (GOLD_LO[1] - GOLD_HI[1]) * t;
            cb = GOLD_HI[2] + (GOLD_LO[2] - GOLD_HI[2]) * t;
          }
          rSum += cr; gSum += cg; bSum += cb;
        }
      }
      const i = (y * size + x) * 4;
      const n = S * S;
      px[i] = Math.round(rSum / n);
      px[i + 1] = Math.round(gSum / n);
      px[i + 2] = Math.round(bSum / n);
      px[i + 3] = 255;
    }
  }
  return encodePNG(size, size, px);
}

const specs = [
  ["icon-192.png", 192, 0.3],
  ["icon-512.png", 512, 0.3],
  ["icon-512-maskable.png", 512, 0.26],
  ["apple-touch-icon.png", 180, 0.3],
];

mkdirSync(OUT, { recursive: true });
for (const [name, size, factor] of specs) {
  const file = join(OUT, name);
  writeFileSync(file, renderIcon(size, factor));
  console.log(`✓ ${name} (${size}x${size})`);
}
