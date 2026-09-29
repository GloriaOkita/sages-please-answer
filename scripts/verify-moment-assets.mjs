import { access, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const characters = JSON.parse(await readFile(path.join(root, "src/data/characters.json"), "utf8"));
const sources = JSON.parse(await readFile(path.join(root, "src/data/momentImageSources.json"), "utf8"));
const sourceByPath = new Map(sources.map((source) => [source.localPath, source]));
let count = 0;

for (const character of characters) {
  if (character.moments.length !== 3) {
    throw new Error(`${character.name} must have exactly 3 moments`);
  }
  for (const moment of character.moments) {
    await access(path.join(root, "public", moment.image));
    const source = sourceByPath.get(moment.image);
    if (!source?.sourcePage || !source?.license) {
      throw new Error(`Missing source metadata for ${moment.image}`);
    }
    count += 1;
  }
}

if (count !== 42 || sources.length !== 42) {
  throw new Error(`Expected 42 images and records, found ${count}/${sources.length}`);
}

console.log(`Verified ${count} historical moment images and source records.`);
