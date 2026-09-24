// Bundle a folder of numbered frame images into a few "pack" files plus an index.
// Phones on mobile data pay ~150–300 ms of latency per request, so 600 separate frame requests are slow
// no matter how small the files are; ~26 packs download far faster.
//   node scripts/pack-frames.mjs <frames-dir> <frames-per-pack>
// Writes <frames-dir>/pack-000.bin … and prints the JSON index (list of packs with [offset, length] per frame).
import fs from "node:fs";
import path from "node:path";

const [dir, perPackArg] = process.argv.slice(2);
if (!dir) { console.error("usage: node pack-frames.mjs <frames-dir> <frames-per-pack>"); process.exit(1); }
const perPack = Number(perPackArg) || 24;

const files = fs.readdirSync(dir).filter((f) => /^frame-\d+\.(webp|jpg)$/.test(f)).sort();
if (!files.length) { console.error(`no frame-*.webp|jpg files in ${dir}`); process.exit(1); }
const type = files[0].endsWith(".webp") ? "image/webp" : "image/jpeg";

const packs = [];
for (let p = 0; p * perPack < files.length; p++) {
  const name = `pack-${String(p).padStart(3, "0")}.bin`;
  const parts = [], frames = [];
  let offset = 0;
  for (const f of files.slice(p * perPack, (p + 1) * perPack)) {
    const buf = fs.readFileSync(path.join(dir, f));
    frames.push([offset, buf.length]);
    parts.push(buf);
    offset += buf.length;
  }
  fs.writeFileSync(path.join(dir, name), Buffer.concat(parts));
  packs.push({ file: name, frames });
}
for (const f of files) fs.unlinkSync(path.join(dir, f)); // the packs replace the individual frames

process.stdout.write(JSON.stringify({ type, perPack, count: files.length, packs }));
