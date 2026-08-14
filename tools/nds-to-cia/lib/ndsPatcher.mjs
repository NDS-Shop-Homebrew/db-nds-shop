// Forwarder patch logic, ported from multitools:
//   - front/src/components/tools/nds-forwarder/GameList.tsx (buildPatchedNDS)
//   - front/src/lib/ndsFile.ts (writeBanner, calculateHeaderCRC16, writeGamePath)

import { crc16 } from "./crc16.mjs";
import { NTR, TWL, getBytesFromWord } from "./hexUtils.mjs";
import { parseNDS } from "./ndsFile.mjs";
import { getRandomTid } from "./tidList.mjs";

const setByte = (t, pos, val) => {
  if (pos >= 0 && pos < t.length) t[pos] = val ?? 0;
};

export function writeBanner(templateBytes, bannerLocation, mode, nds) {
  const start = bannerLocation;

  if (mode === TWL) {
    const banner = nds.getBannerIconBytes();
    if (banner.length >= 0x23c0) {
      for (let i = 0; i < 0x23c0; i++) setByte(templateBytes, start + i, banner[i]);
    }
    return;
  }

  // NTR mode: expand 2112-byte banner to 9152-byte format
  const banner = nds.getBannerIconBytes();
  if (banner.length === 0) return;

  // 1. Copy raw banner (2112 bytes) to template, zero-fill the rest
  for (let i = 0; i < banner.length && i < 0x840; i++) setByte(templateBytes, start + i, banner[i]);
  for (let i = banner.length; i < 0x840; i++) setByte(templateBytes, start + i, 0);

  // 2. Japanese names (256 bytes at banner+0x240) to offset +0x840
  const japName = nds.getJapaneseNameBytes();
  for (let i = 0; i < japName.length && i < 0x100; i++) setByte(templateBytes, start + 0x840 + i, japName[i]);

  // 3. English names (256 bytes at banner+0x340) to offset +0x940
  const engName = nds.getEnglishNameBytes();
  for (let i = 0; i < engName.length && i < 0x100; i++) setByte(templateBytes, start + 0x940 + i, engName[i]);

  // 4. Animation header (0x03, 0x01)
  setByte(templateBytes, start, 0x03);
  setByte(templateBytes, start + 1, 0x01);

  // 5. Icon tile data (32..544) copied 8 times to animation area (+0x1240)
  const iconTiles = [];
  for (let i = 0x20; i < 0x220 && i < banner.length; i++) iconTiles.push(banner[i] ?? 0);
  for (let frame = 0; frame < 8; frame++) {
    for (let i = 0; i < iconTiles.length; i++) {
      setByte(templateBytes, start + 0x1240 + frame * iconTiles.length + i, iconTiles[i]);
    }
  }

  // 6. Palette (544..576) copied 8 times to palette animation area (+0x2240)
  const palette = [];
  for (let i = 0x220; i < 0x240 && i < banner.length; i++) palette.push(banner[i] ?? 0);
  for (let frame = 0; frame < 8; frame++) {
    for (let i = 0; i < palette.length; i++) {
      setByte(templateBytes, start + 0x2240 + frame * palette.length + i, palette[i]);
    }
  }

  // 7. End sequence at +0x2340
  setByte(templateBytes, start + 0x2340, 0x01);
  setByte(templateBytes, start + 0x2341, 0x00);
  setByte(templateBytes, start + 0x2342, 0x00);
  setByte(templateBytes, start + 0x2343, 0x01);

  // 8. CRC16 checksums
  const getRange = (from, to) => {
    const result = [];
    for (let i = from; i <= to; i++) {
      if (start + i < templateBytes.length) result.push(templateBytes[start + i]);
    }
    return result;
  };

  const getFlippedCRC = (data) => {
    const value = crc16(data);
    return [value & 0xff, (value >> 8) & 0xff];
  };

  const crc1 = getFlippedCRC(getRange(0x20, 0x83f));
  const crc2 = getFlippedCRC(getRange(0x20, 0x93f));
  const crc3 = getFlippedCRC(getRange(0x20, 0xa3f));
  const crc4 = getFlippedCRC(getRange(0x1240, 0x23bf));

  setByte(templateBytes, start + 2, crc1[0]);
  setByte(templateBytes, start + 3, crc1[1]);
  setByte(templateBytes, start + 4, crc2[0]);
  setByte(templateBytes, start + 5, crc2[1]);
  setByte(templateBytes, start + 6, crc3[0]);
  setByte(templateBytes, start + 7, crc3[1]);
  setByte(templateBytes, start + 8, crc4[0]);
  setByte(templateBytes, start + 9, crc4[1]);
}

export function calculateHeaderCRC16(templateBytes) {
  const data = Array.from(templateBytes.slice(0, 350));
  const crc = crc16(data);
  templateBytes[350] = crc & 0xff;
  templateBytes[351] = (crc >> 8) & 0xff;
}

export function writeGamePath(templateBytes, offset, length, gamePath) {
  const bytes = getBytesFromWord(gamePath);
  let counter = 0;
  let i = offset;
  while (counter < length) {
    templateBytes[i] = bytes[counter] ?? 0;
    counter++;
    i++;
  }
}

// Mirrors GameList.buildPatchedNDS (multitools). Produces the patched
// forwarder template + the TID used.
export function buildPatchedNDS(romBuffer, templateBuffer, card, options = {}) {
  const nds = parseNDS(romBuffer);
  const template = Uint8Array.from(templateBuffer);

  const tid = options.tid || getRandomTid();
  const gamePath = options.gamepath || "";

  // Header ROM (0x00-0x11), including the game title bytes
  template.set(romBuffer.subarray(0, 0x12), 0);

  // TID bytes (0x0C-0x0F) + reversed at 0x230
  const tidBytes = getBytesFromWord(tid);
  template.set(tidBytes, 0x0c);
  template.set(reversed(tidBytes), 0x230);

  // Banner (icon + palette from the ROM)
  writeBanner(template, card.banner_location, nds.getCardMode(), nds);

  // Game path on the SD card
  writeGamePath(template, card.gamepath_location, card.gamepath_length, gamePath);

  // Header CRC16 before finalizing
  calculateHeaderCRC16(template);

  return { template, tid };
}

function reversed(arr) {
  const out = [];
  for (let i = arr.length - 1; i >= 0; i--) out.push(arr[i]);
  return out;
}
