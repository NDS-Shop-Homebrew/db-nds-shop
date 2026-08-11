// Parses a forwarder card definition (.fwd), e.g. sdcard.fwd:
//   name=DSi/3DS SD Card
//   gamepath_location=0x1DD74
//   gamepath_length=252
//   banner_location=0x29E00
//   generate_dat=false
//   version=31

export function parseCard(text) {
  const json = {};
  for (const line of text.split(/\r?\n/)) {
    if (!line) continue;
    const idx = line.indexOf("=");
    if (idx <= 0) continue;
    json[line.slice(0, idx)] = line.slice(idx + 1);
  }
  return {
    name: json.name,
    gamepath_location: parseInt(json.gamepath_location, 16),
    gamepath_length: parseInt(json.gamepath_length, 10),
    banner_location: parseInt(json.banner_location, 16),
  };
}
