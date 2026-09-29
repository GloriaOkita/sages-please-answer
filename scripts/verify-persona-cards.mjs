import { access, readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const characters = JSON.parse(await readFile(path.join(root, "src/data/characters.json"), "utf8"));
const requiredSections = ["## 身份锚点", "## 原文语料", "## 可迁移语言特征", "## 生成策略", "## 示例", "## 输出自检"];
const seen = new Set();

for (const character of characters) {
  if (!character.personaFile || seen.has(character.personaFile)) {
    throw new Error(`Invalid or duplicate personaFile for ${character.name}`);
  }
  seen.add(character.personaFile);
  const absolutePath = path.join(root, character.personaFile);
  await access(absolutePath);
  const card = await readFile(absolutePath, "utf8");
  if (!card.startsWith(`# ${character.name}角色语料卡`)) {
    throw new Error(`Identity heading mismatch: ${character.personaFile}`);
  }
  for (const section of requiredSections) {
    if (!card.includes(section)) throw new Error(`${character.name} missing ${section}`);
  }
  if (card.length < 700) throw new Error(`${character.name} corpus is unexpectedly short`);
}

if (seen.size !== 14) throw new Error(`Expected 14 persona cards, found ${seen.size}`);
console.log("Verified 14 isolated persona Markdown cards and required sections.");
