// Extrait le PNG 48x48 depuis le favicon.ico (BMP BGRA 32bpp + AND mask)
const fs = require("fs");
const zlib = require("zlib");

const ico = fs.readFileSync(process.argv[2]);
const off = ico.readUInt32LE(6 + 12);
const w = ico.readInt32LE(off + 4);
const h = ico.readInt32LE(off + 8); // 96 = 48 pixels + 48 AND mask
const bpp = ico.readUInt16LE(off + 14);
const px = w; // hauteur réelle des pixels = h / 2
const dataStart = off + 40;
const rowSize = Math.floor((bpp * w + 31) / 32) * 4;
const stride = rowSize;

// Lignes BMP en bas -> haut
const raw = Buffer.alloc(w * px * 4);
for (let y = 0; y < px; y++) {
  const srcRow = dataStart + (px - 1 - y) * stride;
  const dstRow = y * w * 4;
  for (let x = 0; x < w; x++) {
    const si = srcRow + x * 4;
    const di = dstRow + x * 4;
    raw[di] = ico[si + 2];     // R
    raw[di + 1] = ico[si + 1]; // G
    raw[di + 2] = ico[si];     // B
    raw[di + 3] = ico[si + 3]; // A
  }
}

// PNG
function crc32(buf) {
  let c, table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(w, 0);
ihdr.writeUInt32BE(px, 4);
ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA
const idat = zlib.deflateSync(raw);
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk("IHDR", ihdr),
  chunk("IDAT", idat),
  chunk("IEND", Buffer.alloc(0)),
]);
fs.writeFileSync(process.argv[3], png);
console.log(`PNG ${w}x${px} écrit: ${process.argv[3]} (${png.length} octets)`);
