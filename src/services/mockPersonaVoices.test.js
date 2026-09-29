import { describe, expect, it } from "vitest";
import characters from "../data/characters.json";
import { mockMainComment, mockUserReply } from "./mockPersonaVoices.js";

const samplePost = {
  content: "工作稳定但没有热情，我该留下还是重新开始？",
  poll: {
    question: "我该怎么办？",
    options: [{ id: "A", text: "留在稳定工作" }, { id: "B", text: "重新开始" }],
  },
};

describe("distinct content-aware mock voices", () => {
  it("changes the same person's answer without quoting the full question", () => {
    const luxun = characters.find(({ id }) => id === "luxun");
    const salary = mockMainComment(luxun, {
      content: "工资翻倍但每天通勤四小时，要不要接受？",
      poll: { options: [{ id: "A", text: "接受高薪" }, { id: "B", text: "拒绝长通勤" }] },
    }).comment;
    const promotion = mockMainComment(luxun, {
      content: "升职要隐瞒同事犯错，我该不该答应？",
      poll: { options: [{ id: "A", text: "答应升职" }, { id: "B", text: "拒绝隐瞒" }] },
    }).comment;
    expect(salary).not.toBe(promotion);
    expect(salary).toMatch(/工资翻倍|通勤四小时|高薪|长通勤/);
    expect(promotion).toMatch(/升职|隐瞒|同事犯错/);
    expect(salary).not.toContain("工资翻倍但每天通勤四小时，要不要接受？");
    expect(promotion).not.toContain("升职要隐瞒同事犯错，我该不该答应？");
    expect(salary.length).toBeLessThan(110);
    expect(promotion.length).toBeLessThan(110);
  });

  it("generates valid, non-placeholder main comments for all fourteen people", () => {
    const outputs = characters.map((character) => mockMainComment(character, samplePost));
    expect(outputs).toHaveLength(14);
    expect(new Set(outputs.map(({ comment }) => comment)).size).toBe(14);
    for (const [index, output] of outputs.entries()) {
      expect(output.characterId).toBe(characters[index].id);
      expect(output.comment).not.toMatch(/占位|等待真实|作为AI|综合考虑/);
      expect(output.comment.length).toBeGreaterThan(15);
      expect(output.comment).not.toContain(samplePost.content);
      expect(output.commentTags.length).toBeGreaterThanOrEqual(1);
      expect(output.commentTags.every((tag) => characters[index].agreeTags.includes(tag))).toBe(true);
      if (characters[index].id === "socrates") expect(output.vote).toBeNull();
      else expect(["A", "B"]).toContain(output.vote);
    }
  });

  it("keeps recognizable structural differences", () => {
    const outputs = Object.fromEntries(
      characters.map((character) => [character.id, mockMainComment(character, samplePost).comment]),
    );
    expect(outputs.luxun).toContain("么？");
    expect(outputs.nietzsche).toMatch(/桥|锁链|成为/);
    expect(outputs.socrates.match(/？/g).length).toBeGreaterThanOrEqual(2);
    expect(outputs.franklin).toMatch(/天|周|小时|开支|日程/);
    expect(outputs.marx).toMatch(/制度|收入|劳动|选择权|条件/);
    expect(outputs.zhangailing).toMatch(/衬衫|灯|茶|衣|钥匙/);
  });

  it("adapts replies to unrelated open-domain questions", () => {
    const beauvoir = characters.find(({ id }) => id === "beauvoir");
    const einstein = characters.find(({ id }) => id === "einstein");
    const social = mockUserReply(beauvoir, "学校为什么规定女生必须穿裙子", [], 2);
    const science = mockUserReply(einstein, "火星上的一年为什么更长", [], 2);
    expect(social.content).toMatch(/应该|学校|定义|期待/);
    expect(science.content).toMatch(/参照系|变量|火星/);
  });

  it("keeps the original moment context when a user asks a short follow-up", () => {
    const marx = characters.find(({ id }) => id === "marx");
    const reply = mockUserReply(
      marx,
      "为什么？",
      [],
      2,
      "工作稳定但没有热情，我该留下还是重新开始？",
    );
    expect(reply.content).toMatch(/工时|收入依赖|评价权|制度/);
  });

  it("keeps open-domain outputs content-sensitive without routing through topic buckets", () => {
    const beauvoir = characters.find(({ id }) => id === "beauvoir");
    const marx = characters.find(({ id }) => id === "marx");
    const einstein = characters.find(({ id }) => id === "einstein");
    const socialPost = { content: "学校为什么规定女生必须穿裙子？", poll: null };
    const sciencePost = { content: "火星上的一年为什么比地球长？", poll: null };
    expect(mockMainComment(beauvoir, socialPost).comment).toMatch(/学校|规定|应该|定义/);
    expect(mockMainComment(marx, samplePost).comment).toContain("工作稳定");
    expect(mockMainComment(einstein, sciencePost).comment).toContain("火星上的一年");
  });

  it("does not contain a fixed career, relationship, value, or generic router", async () => {
    const source = await import("./mockPersonaVoices.js?source-contract");
    expect(source.MOCK_ROUTING_MODE).toBe("open_domain");
    expect(source.MOCK_TOPIC_BUCKETS).toEqual([]);
  });

  it("does not cut a long question into a broken sentence fragment", () => {
    const wangyangming = characters.find(({ id }) => id === "wangyangming");
    const post = {
      content: "我处在一个传统行业，我发现，我们专业的同学相比其他互联网/金融等新兴行业来说，性格普遍更加保守，对网络热梗的敏锐度也普遍更低。所以，到底是专业塑造了性格，还是人选择了与自己特质相近的专业？",
      poll: null,
    };
    const comment = mockMainComment(wangyangming, post).comment;
    expect(comment).not.toMatch(/我处在一个传统行业，我发(?:时|”|……)/);
    expect(comment).toMatch(/专业|性格|塑造|选择/);
    expect(comment).not.toMatch(/去留|承担后果|今日可行的小事/);
  });

  it("answers an identity thought experiment naturally without quoting the question", () => {
    const post = { content: "如果出生在500年前，我还会是我吗？", poll: null };
    const outputs = characters.map((character) => mockMainComment(character, post).comment);
    for (const comment of outputs) {
      expect(comment).not.toContain("如果出生在500年前");
      expect(comment).not.toMatch(/^[“\"『「].{4,}[………]{2,}/);
    }
    expect(new Set(outputs.map((comment) => comment.slice(0, 10))).size).toBeGreaterThanOrEqual(10);
    expect(outputs.join("\n")).toMatch(/时代|五百年|语言|制度|身份|自我/);
  });

});
