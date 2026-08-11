// Unit tests for the forwarder CLI.
// Run: node tools/nds-to-cia/test/tests.mjs

import assert from "node:assert/strict";
import { crc16 } from "../lib/crc16.mjs";
import { buildPatchedNDS, calculateHeaderCRC16 } from "../lib/ndsPatcher.mjs";
import { getBytesFromWord } from "../lib/hexUtils.mjs";

const TEMPLATE_SIZE = 0x2c200; // sdcard.nds size
const BANNER_LOC = 0x29e00; // sdcard.fwd banner_location
const GP_LOC = 0x1dd74; // sdcard.fwd gamepath_location
const GP_LEN = 252;

// CRC16-ARC check value for "123456789" is 0xBB3D
const check = crc16(Array.from(Buffer.from("123456789", "ascii")));
assert.equal(check, 0xbb3d, "CRC16-ARC check vector");
console.log("✓ crc16('123456789') = 0xBB3D");

function makeSyntheticRom() {
  const bannerLoc = 0x4000;
  const buf = Buffer.alloc(bannerLoc + 0x840);
  buf.write("TESTGAMETITLE!!", 0, "ascii"); // 0x00..0x0C
  buf[0x12] = 0x00; // NTR card mode
  buf.writeUInt32LE(bannerLoc, 0x68); // banner location pointer
  for (let i = 0x20; i < 0x220; i++) buf[bannerLoc + i] = i & 0xff; // icon tiles
  for (let i = 0x220; i < 0x240; i++) buf[bannerLoc + i] = 0xa0 + (i & 0x1f); // palette
  buf.write("JapaneseName", bannerLoc + 0x240, "ascii"); // JP name
  buf.write("EnglishName", bannerLoc + 0x340, "ascii"); // EN name
  return buf;
}

const rom = makeSyntheticRom();
const templateBuf = Buffer.alloc(TEMPLATE_SIZE);
const card = { banner_location: BANNER_LOC, gamepath_location: GP_LOC, gamepath_length: GP_LEN };

const { template, tid } = buildPatchedNDS(rom, templateBuf, card, {
  tid: "A22E",
  gamepath: "/roms/nds/Test.nds",
});
assert.equal(tid, "A22E", "forced TID is used");

// 1. Header copy (0x00-0x0B and 0x10-0x11; 0x0C-0x0F is the overwritten TID)
for (let i = 0; i < 0x0c; i++) {
  assert.equal(template[i], rom[i], `header byte ${i}`);
}
for (let i = 0x10; i < 0x12; i++) {
  assert.equal(template[i], rom[i], `header byte ${i}`);
}

// 2. TID at 0x0C and reversed at 0x230
const tidBytes = getBytesFromWord("A22E");
assert.deepEqual(Array.from(template.subarray(0x0c, 0x10)), tidBytes, "TID written at 0x0C");
assert.deepEqual(
  Array.from(template.subarray(0x230, 0x234)),
  [...tidBytes].reverse(),
  "reversed TID at 0x230"
);

// 3. Banner animation header
assert.equal(template[BANNER_LOC], 0x03, "banner anim header byte 0");
assert.equal(template[BANNER_LOC + 1], 0x01, "banner anim header byte 1");

// 4. Icon tiles copied 8x at +0x1240
for (let frame = 0; frame < 8; frame++) {
  for (let i = 0; i < 0x200; i++) {
    const src = rom[0x4000 + 0x20 + i];
    assert.equal(template[BANNER_LOC + 0x1240 + frame * 0x200 + i], src, `icon frame ${frame} byte ${i}`);
  }
}

// 5. Palette copied 8x at +0x2240
for (let frame = 0; frame < 8; frame++) {
  for (let i = 0; i < 0x20; i++) {
    const src = rom[0x4000 + 0x220 + i];
    assert.equal(template[BANNER_LOC + 0x2240 + frame * 0x20 + i], src, `palette frame ${frame} byte ${i}`);
  }
}

// 6. End sequence at +0x2340
assert.deepEqual(Array.from(template.subarray(BANNER_LOC + 0x2340, BANNER_LOC + 0x2344)), [0x01, 0x00, 0x00, 0x01]);

// 7. Gamepath written and zero-padded
const gp = Array.from(template.subarray(GP_LOC, GP_LOC + GP_LEN));
const expectedGp = [...Buffer.from("/roms/nds/Test.nds", "ascii")];
assert.deepEqual(gp.slice(0, expectedGp.length), expectedGp, "gamepath content");
assert.ok(gp.slice(expectedGp.length).every((b) => b === 0), "gamepath zero-padded");

// 8. Header CRC16 at 350-351
const headerCrc = crc16(Array.from(template.subarray(0, 350)));
assert.equal(template[350], headerCrc & 0xff, "header CRC low");
assert.equal(template[351], (headerCrc >> 8) & 0xff, "header CRC high");

// 9. Banner CRCs at +2..+9
const banner = Array.from(template.subarray(BANNER_LOC, BANNER_LOC + 0x23c0));
const crcRange = (from, to) => banner.slice(from, to + 1);
const flipped = (data) => [crc16(data) & 0xff, (crc16(data) >> 8) & 0xff];
assert.deepEqual(Array.from(template.subarray(BANNER_LOC + 2, BANNER_LOC + 4)), flipped(crcRange(0x20, 0x83f)), "crc1");
assert.deepEqual(Array.from(template.subarray(BANNER_LOC + 4, BANNER_LOC + 6)), flipped(crcRange(0x20, 0x93f)), "crc2");
assert.deepEqual(Array.from(template.subarray(BANNER_LOC + 6, BANNER_LOC + 8)), flipped(crcRange(0x20, 0xa3f)), "crc3");
assert.deepEqual(Array.from(template.subarray(BANNER_LOC + 8, BANNER_LOC + 10)), flipped(crcRange(0x1240, 0x23bf)), "crc4");

console.log("✓ buildPatchedNDS invariants (header, TID, banner, CRC16, gamepath)");

console.log("\nTous les tests passent.");
