import luxun from "../../docs/人物卡/luxun-鲁迅.md?raw";
import wuzetian from "../../docs/人物卡/wuzetian-武则天.md?raw";
import nietzsche from "../../docs/人物卡/nietzsche-尼采.md?raw";
import socrates from "../../docs/人物卡/socrates-苏格拉底.md?raw";
import buddha from "../../docs/人物卡/buddha-释迦牟尼.md?raw";
import yingzheng from "../../docs/人物卡/yingzheng-嬴政.md?raw";
import kangxi from "../../docs/人物卡/kangxi-康熙.md?raw";
import libai from "../../docs/人物卡/libai-李白.md?raw";
import marx from "../../docs/人物卡/marx-马克思.md?raw";
import franklin from "../../docs/人物卡/franklin-富兰克林.md?raw";
import wangyangming from "../../docs/人物卡/wangyangming-王阳明.md?raw";
import beauvoir from "../../docs/人物卡/beauvoir-波伏娃.md?raw";
import zhangailing from "../../docs/人物卡/zhangailing-张爱玲.md?raw";
import einstein from "../../docs/人物卡/einstein-爱因斯坦.md?raw";

const PERSONA_CARDS = Object.freeze({
  luxun,
  wuzetian,
  nietzsche,
  socrates,
  buddha,
  yingzheng,
  kangxi,
  libai,
  marx,
  franklin,
  wangyangming,
  beauvoir,
  zhangailing,
  einstein,
});

export const PERSONA_IDS = Object.freeze(Object.keys(PERSONA_CARDS));

export function getPersonaCard(characterId) {
  const card = PERSONA_CARDS[characterId];
  if (!card) throw new Error(`Unknown persona: ${characterId}`);
  return card;
}
