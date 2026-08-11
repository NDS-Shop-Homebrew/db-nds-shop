// Extracts the 32x32 banner icon from a NDS/DSi ROM and returns a 48x48
// RGBA PNG (store convention), with no external dependencies (node:zlib).
//
// Banner layout (GBATEK, retail DS carts incl. NDSi-Enhanced):
//   +0x020  200h  Icon Bitmap (32x32 px, 4x4 tiles of 8x8, 4bit depth)
//                  tile-major order: 32 bytes per tile, 4 bytes per row
//                  lower nibble = left dot, upper nibble = right dot
//   +0x220  20h   16x RGB555 palette (entry 0 is transparent)
//   +0x240  0A00h 8x UTF-16 game titles (JP/EN/FR/DE/IT/ES/zh/ko)

import zlib from "node:zlib";
import { parseNDS } from "./ndsFile.mjs";
import { NTR, TWL } from "./hexUtils.mjs";

let crcTable = null;
function crc32(buf) {
  if (!crcTable) {
    crcTable = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      crcTable[n] = c;
    }
  }
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const t = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crc]);
}

function encodePng(width, height, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6; // RGBA
  const stride = width * 4;
  const raw = Buffer.alloc(height * (1 + stride));
  for (let y = 0; y < height; y++) {
    raw[y * (1 + stride)] = 0;
    rgba.copy(raw, y * (1 + stride) + 1, y * stride, (y + 1) * stride);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", zlib.deflateSync(raw)),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

function rgb555(v) {
  return [
    (((v & 0x1f) * 255) / 31) | 0,
    ((((v >> 5) & 0x1f) * 255) / 31) | 0,
    ((((v >> 10) & 0x1f) * 255) / 31) | 0,
  ];
}

// Decode the 4bpp icon bitmap (32x32) into an RGBA buffer.
// Every palette entry is rendered opaque (entry 0 included), so the icon
// comes out as a solid square instead of showing holes in file explorers.
function decodeIcon(romBuffer, bl) {
  const px = Buffer.alloc(32 * 32 * 4);
  for (let ty = 0; ty < 4; ty++) {
    for (let tx = 0; tx < 4; tx++) {
      const tileOff = (ty * 4 + tx) * 32;
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
          const byte = romBuffer[bl + 0x20 + tileOff + row * 4 + (col >> 1)];
          // even col = left dot = lower nibble
          const idx = col & 1 ? byte >> 4 : byte & 0x0f;
          const i = (ty * 8 + row) * 32 + (tx * 8 + col);
          const pal = romBuffer.readUInt16LE(bl + 0x220 + idx * 2);
          const [r, g, b] = rgb555(pal);
          px[i * 4] = r;
          px[i * 4 + 1] = g;
          px[i * 4 + 2] = b;
          px[i * 4 + 3] = 255;
        }
      }
    }
  }
  return px;
}

// Bilinear upscale 32x32 -> 48x48 (48px cap enforced by the 3DS store app).
// Source coordinates are clamped into [0,31] before interpolation so weights
// stay in [0,1]: output colors are always convex blends of the 4 neighbors
// and can never invent out-of-palette colors (the previous version could
// extrapolate past the image edges and produced stray red/pink pixels).
function upscale(px) {
  const srcW = 32, srcH = 32, outW = 48, outH = 48;
  const out = Buffer.alloc(outW * outH * 4);
  for (let y = 0; y < outH; y++) {
    const sy = Math.min(srcH - 1, Math.max(0, ((y + 0.5) * srcH) / outH - 0.5));
    const y0 = Math.floor(sy);
    const y1 = Math.min(srcH - 1, y0 + 1);
    const fy = sy - y0;
    for (let x = 0; x < outW; x++) {
      const sx = Math.min(srcW - 1, Math.max(0, ((x + 0.5) * srcW) / outW - 0.5));
      const x0 = Math.floor(sx);
      const x1 = Math.min(srcW - 1, x0 + 1);
      const fx = sx - x0;
      const w00 = (1 - fx) * (1 - fy);
      const w01 = fx * (1 - fy);
      const w10 = (1 - fx) * fy;
      const w11 = fx * fy;
      const o = (y * outW + x) * 4;
      for (let c = 0; c < 4; c++) {
        const p00 = px[(y0 * srcW + x0) * 4 + c];
        const p01 = px[(y0 * srcW + x1) * 4 + c];
        const p10 = px[(y1 * srcW + x0) * 4 + c];
        const p11 = px[(y1 * srcW + x1) * 4 + c];
        out[o + c] = Math.round(w00 * p00 + w01 * p01 + w10 * p10 + w11 * p11);
      }
    }
  }
  return out;
}

export function extractIconPng(romBuffer) {
  const nds = parseNDS(romBuffer);
  const bl = nds.getBannerLocation();
  const mode = nds.getCardMode();
  if (mode !== NTR && mode !== TWL) throw new Error("Carte non supportée (mode " + mode + ")");

  // DS retail games (including NDSi-Enhanced) use the classic 4bpp banner:
  // bitmap 32x32 at +0x20 (512 bytes), 16xRGB555 palette at +0x220.
  // The 8bpp/0x103 banner only exists in DSiWare/3DS titles.
  return encodePng(48, 48, upscale(decodeIcon(romBuffer, bl)));
}
