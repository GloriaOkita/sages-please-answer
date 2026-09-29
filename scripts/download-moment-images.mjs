import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const characters = JSON.parse(await readFile(path.join(root, "src/data/characters.json"), "utf8"));

const queries = {
  luxun: ["Lu Xun Tokyo 1906", "New Youth magazine 1918 China", "Lu Xun 1936"],
  wuzetian: ["Wu Zetian portrait", "Longmen Grottoes Tang dynasty", "Qianling Wu Zetian wordless stele"],
  nietzsche: ["Friedrich Nietzsche 1869", "Friedrich Nietzsche 1882", "Friedrich Nietzsche Turin"],
  socrates: ["Socrates agora painting", "Death of Socrates David", "Socrates Crito prison painting"],
  buddha: ["Great Departure Buddha relief", "Mahabodhi temple old photograph", "Sarnath Dhamek Stupa old photograph"],
  yingzheng: ["Qin Shi Huang portrait", "Qin dynasty bamboo slips", "Qin Shi Huang immortality painting"],
  kangxi: ["Kangxi Emperor portrait", "Treaty of Nerchinsk 1689", "Kangxi Emperor elderly portrait"],
  libai: ["Li Bai portrait", "Chang'an Tang dynasty painting", "Li Bai moon painting"],
  marx: ["Communist Manifesto first edition", "Das Kapital first edition 1867", "Karl Marx 1882"],
  franklin: ["Benjamin Franklin young portrait", "Benjamin Franklin kite experiment", "Benjamin Franklin 1785 portrait"],
  wangyangming: ["Wang Yangming portrait", "Guizhou landscape old painting", "Wang Yangming calligraphy"],
  beauvoir: ["Simone de Beauvoir 1949", "Simone de Beauvoir 1955", "Montparnasse cemetery Sartre Beauvoir"],
  zhangailing: ["Shanghai 1940s street", "Shanghai 1950 old photograph", "Los Angeles 1990 skyline"],
  einstein: ["Einstein patent office Bern", "Einstein Roosevelt letter 1939", "Albert Einstein 1955"],
};

const usedUrls = new Set();
const sources = [];

function plainText(value = "") {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

async function searchCommons(query, fallbackName) {
  const searchTerms = [query, `${fallbackName} history`, fallbackName];
  for (const term of searchTerms) {
    const params = new URLSearchParams({
      action: "query",
      generator: "search",
      gsrsearch: term,
      gsrnamespace: "6",
      gsrlimit: "12",
      prop: "imageinfo",
      iiprop: "url|extmetadata|mime|size",
      iiurlwidth: "1200",
      format: "json",
      formatversion: "2",
    });
    const response = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, {
      headers: { "User-Agent": "AncientMomentsHackathon/1.0 (local prototype)" },
    });
    if (!response.ok) continue;
    const data = await response.json();
    const pages = data.query?.pages ?? [];
    const candidates = pages
      .map((page) => ({ page, info: page.imageinfo?.[0] }))
      .filter(({ info }) => info?.mime === "image/jpeg" && info.width >= 500 && info.height >= 300)
      .filter(({ info }) => {
        const license = info.extmetadata?.LicenseShortName?.value ?? "";
        return /public domain|cc by|cc0|pdm/i.test(license);
      });
    const unused = candidates.find(({ info }) => !usedUrls.has(info.url));
    if (unused) return { ...unused, query: term };
  }
  throw new Error(`No reusable Wikimedia Commons image found for: ${query}`);
}

for (const character of characters) {
  const characterQueries = queries[character.id];
  if (!characterQueries) throw new Error(`Missing image queries for ${character.id}`);
  const directory = path.join(root, "public/assets/moments", character.id);
  await mkdir(directory, { recursive: true });

  for (const [index, moment] of character.moments.entries()) {
    const result = await searchCommons(characterQueries[index], character.name);
    const { page, info, query } = result;
    usedUrls.add(info.url);
    const imageUrl = info.thumburl ?? info.url;
    const imageResponse = await fetch(imageUrl, {
      headers: { "User-Agent": "AncientMomentsHackathon/1.0 (local prototype)" },
    });
    if (!imageResponse.ok) throw new Error(`Download failed: ${imageUrl}`);
    const bytes = Buffer.from(await imageResponse.arrayBuffer());
    const filename = `0${index + 1}.jpg`;
    await writeFile(path.join(directory, filename), bytes);

    const metadata = info.extmetadata ?? {};
    sources.push({
      sourceId: `${character.id}-${String(index + 1).padStart(2, "0")}`,
      characterId: character.id,
      characterName: character.name,
      momentId: moment.id,
      momentDate: moment.date,
      localPath: `/assets/moments/${character.id}/${filename}`,
      query,
      sourcePage: info.descriptionurl,
      sourcePlatform: "Wikimedia Commons",
      title: page.title.replace(/^File:/, ""),
      creator: plainText(metadata.Artist?.value || metadata.Credit?.value || "Wikimedia Commons contributor"),
      license: plainText(metadata.LicenseShortName?.value || metadata.UsageTerms?.value || "See source page"),
      originalUrl: info.url,
      usageNote: "时代、地点或人物主题氛围图；除非来源页明确说明，否则不宣称为文案事件现场。",
    });
    process.stdout.write(`Downloaded ${character.name} ${index + 1}/3: ${page.title}\n`);
  }
}

await writeFile(
  path.join(root, "src/data/momentImageSources.json"),
  `${JSON.stringify(sources, null, 2)}\n`,
);

const rows = sources
  .map(
    (source) =>
      `| ${source.characterName} | ${source.momentDate} | \`${source.localPath}\` | [${source.title}](${source.sourcePage}) | ${source.license} | ${source.usageNote} |`,
  )
  .join("\n");
const markdown = `# 历史朋友圈图片来源登记\n\n本文件由 \`scripts/download-moment-images.mjs\` 根据 Wikimedia Commons API 元数据生成。共 ${sources.length} 张图片，均已下载到本地。来源页、作者与许可详情以链接页面为准。\n\n| 人物 | 朋友圈年份 | 本地路径 | 来源页 | 许可 | 使用说明 |\n| --- | --- | --- | --- | --- | --- |\n${rows}\n`;
await writeFile(path.join(root, "docs/12-历史朋友圈图片来源登记.md"), markdown);

console.log(`Completed: ${sources.length} local images and source records.`);
