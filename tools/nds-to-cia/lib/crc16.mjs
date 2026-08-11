// CRC16-ARC implementation (also known as CRC16-IBM or CRC16-LHA)
// Polynomial: 0x8005 (reversed: 0xA001)
// Initial value: 0x0000
// Ported from multitools/front/src/lib/crc16.ts

export function crc16(bytes) {
  let crc = 0x0000;
  for (let i = 0; i < bytes.length; i++) {
    crc ^= bytes[i];
    for (let j = 0; j < 8; j++) {
      if (crc & 1) {
        crc = (crc >>> 1) ^ 0xa001;
      } else {
        crc >>>= 1;
      }
    }
  }
  return crc & 0xffff;
}
