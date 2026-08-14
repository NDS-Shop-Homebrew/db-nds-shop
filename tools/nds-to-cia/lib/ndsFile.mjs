// Read-only NDS ROM parser (Buffer-based port of NDSFile).
// The original (multitools/front/src/lib/ndsFile.ts) read through the
// browser File API; here we read straight from a Node Buffer.

import { NTR, TWL, getHexNumber, reverseArray } from "./hexUtils.mjs";

export function parseNDS(buffer) {
  const getBytes = (start, end) => Array.from(buffer.subarray(start, end));

  const getBannerLocation = () => {
    const result = getBytes(0x68, 0x6c);
    return getHexNumber(reverseArray(result));
  };

  const getCardMode = () => {
    const b = buffer[0x12];
    if (b === 0) return NTR;
    if (b === 2 || b === 3) return TWL;
    return 0;
  };

  const getBannerIconBytes = () => {
    const location = getBannerLocation();
    const mode = getCardMode();
    if (mode === NTR) return getBytes(location, location + 0x840);
    if (mode === TWL) return getBytes(location, location + 0x23c0);
    return [];
  };

  const getJapaneseNameBytes = () => {
    const bl = getBannerLocation();
    return getBytes(bl + 0x240, bl + 0x340);
  };

  const getEnglishNameBytes = () => {
    const bl = getBannerLocation();
    return getBytes(bl + 0x340, bl + 0x440);
  };

  return {
    buffer,
    getBytes,
    getBannerLocation,
    getCardMode,
    getBannerIconBytes,
    getJapaneseNameBytes,
    getEnglishNameBytes,
  };
}
