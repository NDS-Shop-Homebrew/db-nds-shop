// Pure hex helpers, ported from multitools/front/src/lib/hexUtils.ts
// Only the subset needed by the forwarder patch logic.

export const NTR = 0;
export const TWL = 1;

export function getHexString(byteArray) {
  return Array.from(byteArray, (byte) => ("0" + (byte & 0xff).toString(16)).slice(-2)).join("");
}

export function getHexNumber(byteArray) {
  return parseInt("0x" + getHexString(byteArray));
}

export function reverseArray(original) {
  const reversed = [];
  for (let i = original.length - 1; i >= 0; i--) {
    reversed.push(original[i]);
  }
  return reversed;
}

export function getBytesFromWord(s) {
  const encoder = new TextEncoder();
  return Array.from(encoder.encode(s));
}

export function getWordFromHexOneByte(bytes) {
  let result = "";
  try {
    for (let i = 0; i < bytes.length; i++) {
      result += String.fromCharCode(parseInt("0x" + getHexString([bytes[i]])));
    }
  } catch {
    // ignore malformed bytes
  }
  return result;
}
