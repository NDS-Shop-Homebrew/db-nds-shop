// CRC16-Modbus implementation (the variant the NDS/DSi banner + header use)
// Polynomial: 0x8005 (reversed: 0xA001)
// Initial value: 0xFFFF
// cf. GBATEK pseudocode + ndsForwarder (volkanturkut) crc16Modbus.

export function crc16(bytes) {
  let crc = 0xffff;
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
