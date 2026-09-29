import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App.jsx";

vi.mock("./services/callAI.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    callAI: vi.fn(actual.callAI),
  };
});

import { callAI } from "./services/callAI.js";

describe("phase-one moments flow", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(callAI).mockImplementation(async (...args) => {
      const actual = await vi.importActual("./services/callAI.js");
      return actual.callAI(...args);
    });
  });

  it("mirrors the friend bookmark shell without mirroring its icon or label", () => {
    render(<App />);

    const handle = screen.getByRole("button", { name: "打开好友列表" });
    expect(handle).toHaveAttribute("data-shell-direction", "outward");
    expect(handle.querySelector("span").style.transform).toBe("");
    expect(handle.querySelector("svg").style.transform).toBe("");
  });

  it("keeps the fixed user avatar and cover mounted throughout composing and publishing", async () => {
    const user = userEvent.setup();
    render(<App />);

    const avatar = screen.getByAltText("我的固定头像");
    const cover = screen.getByAltText("我的固定朋友圈背景");

    await user.click(screen.getByRole("button", { name: "打开朋友圈菜单" }));
    await user.click(screen.getByRole("menuitem", { name: "发布朋友圈" }));

    expect(screen.getByAltText("我的固定头像")).toBe(avatar);
    expect(screen.getByAltText("我的固定朋友圈背景")).toBe(cover);

    await user.type(
      screen.getByPlaceholderText("这一刻，你想问古人什么？也可以写下你的处境。"),
      "测试固定头像和背景",
    );
    await user.click(screen.getByRole("button", { name: "发表" }));

    expect(screen.getByAltText("我的固定头像")).toBe(avatar);
    expect(screen.getByAltText("我的固定朋友圈背景")).toBe(cover);
  });

  it("publishes quietly and reveals all historical interactions only on manual refresh", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByAltText("我的固定头像")).toHaveAttribute(
      "src",
      "/assets/user/avatar.jpg",
    );

    await user.click(screen.getByRole("button", { name: "打开朋友圈菜单" }));
    await user.click(screen.getByRole("menuitem", { name: "发布朋友圈" }));
    await user.type(
      screen.getByPlaceholderText("这一刻，你想问古人什么？也可以写下你的处境。"),
      "我应该留在熟悉的地方，还是去远方重新开始？",
    );

    await user.click(screen.getByRole("button", { name: "设置投票" }));
    const pollDialog = screen.getByRole("dialog", { name: "投票" });
    expect(within(pollDialog).getByRole("button", { name: "完成投票" })).toBeDisabled();
    await user.type(within(pollDialog).getByLabelText("投票问题"), "我该选哪条路？");
    await user.type(within(pollDialog).getByLabelText("选项 A"), "留在熟悉的地方");
    await user.type(within(pollDialog).getByLabelText("选项 B"), "去远方重新开始");
    await user.click(within(pollDialog).getByRole("button", { name: "添加选项" }));
    await user.type(within(pollDialog).getByLabelText("选项 C"), "先停下来想一想");
    await user.click(within(pollDialog).getByRole("button", { name: "完成投票" }));

    await user.click(screen.getByRole("button", { name: "发表" }));
    expect(screen.getByText("我应该留在熟悉的地方，还是去远方重新开始？")).toBeVisible();
    expect(screen.queryByText(/从来有人这样选，便一定对么/)).not.toBeInTheDocument();
    expect(screen.getAllByText("0 票")).toHaveLength(3);

    const storedBeforeRefresh = JSON.parse(
      localStorage.getItem("ancient-moments-state-v2"),
    ).posts[0];
    expect(storedBeforeRefresh.participantIds.length).toBeGreaterThanOrEqual(6);
    expect(storedBeforeRefresh.participantIds.length).toBeLessThanOrEqual(8);

    await user.click(screen.getByRole("button", { name: "打开朋友圈菜单" }));
    await user.click(screen.getByRole("menuitem", { name: "刷新朋友圈" }));
    expect((await screen.findAllByRole("article", { name: /的评论$/ })).length).toBeGreaterThanOrEqual(6);
    expect(screen.queryByText(/占位评论|等待真实人物卡/)).not.toBeInTheDocument();
    expect(screen.getAllByAltText(/点赞了这条朋友圈/).length).toBeGreaterThanOrEqual(6);
    expect(screen.getAllByText(/^[1-8] 票$/).reduce((sum, element) => sum + Number.parseInt(element.textContent, 10), 0)).toBeGreaterThanOrEqual(5);
  });

  it("limits mentions, toggles comment likes, and delays a character reply until the next refresh", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "打开朋友圈菜单" }));
    await user.click(screen.getByRole("menuitem", { name: "发布朋友圈" }));
    await user.type(
      screen.getByPlaceholderText("这一刻，你想问古人什么？也可以写下你的处境。"),
      "这是一条占位问题",
    );
    await user.click(screen.getByRole("button", { name: "选择要@的好友" }));
    const mentionDialog = screen.getByRole("dialog", { name: "@好友" });
    await user.click(within(mentionDialog).getByRole("checkbox", { name: "选择鲁迅" }));
    await user.click(within(mentionDialog).getByRole("checkbox", { name: "选择武则天" }));
    await user.click(within(mentionDialog).getByRole("checkbox", { name: "选择尼采" }));
    expect(within(mentionDialog).getByText("已选择 3/5")).toBeVisible();
    await user.click(within(mentionDialog).getByRole("button", { name: "完成选择" }));

    await user.click(screen.getByRole("button", { name: "发表" }));
    const storedParticipants = JSON.parse(
      localStorage.getItem("ancient-moments-state-v2"),
    ).posts[0].participantIds;
    expect(storedParticipants.slice(0, 3)).toEqual(["luxun", "wuzetian", "nietzsche"]);
    expect(storedParticipants.length).toBeGreaterThanOrEqual(6);
    expect(storedParticipants.length).toBeLessThanOrEqual(8);
    await user.click(screen.getByRole("button", { name: "打开朋友圈菜单" }));
    await user.click(screen.getByRole("menuitem", { name: "刷新朋友圈" }));

    const like = screen.getByRole("button", { name: "赞鲁迅的评论" });
    expect(like).toHaveAttribute("aria-pressed", "false");
    await user.click(like);
    expect(like).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("button", { name: "回复鲁迅" }));
    const replyDialog = screen.getByRole("dialog", { name: "回复 鲁迅" });
    await user.type(within(replyDialog).getByLabelText("回复内容"), "你为什么这么想？");
    await user.click(within(replyDialog).getByRole("button", { name: "发送回复" }));
    expect(
      screen.getByText(
        (_, element) =>
          element.tagName === "P" && element.textContent === "我 回复 鲁迅：你为什么这么想？",
      ),
    ).toBeVisible();
    expect(screen.queryByText(/你说这是为大家好/)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "打开朋友圈菜单" }));
    await user.click(screen.getByRole("menuitem", { name: "刷新朋友圈" }));
    expect(
      await screen.findByText((_, element) =>
        element.tagName === "P" &&
        element.textContent.includes("鲁迅 回复 我：") &&
        element.textContent.length > "鲁迅 回复 我：".length,
      ),
    ).toBeVisible();
  });

  it("reports the revealed batch size after the first refresh", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "打开朋友圈菜单" }));
    await user.click(screen.getByRole("menuitem", { name: "发布朋友圈" }));
    await user.type(
      screen.getByPlaceholderText("这一刻，你想问古人什么？也可以写下你的处境。"),
      "刷新计数占位问题",
    );
    await user.click(screen.getByRole("button", { name: "发表" }));
    await user.click(screen.getByRole("button", { name: "打开朋友圈菜单" }));
    await user.click(screen.getByRole("menuitem", { name: "刷新朋友圈" }));

    expect(screen.getByRole("status")).toHaveTextContent(/收到 (1[2-9]|2[0-4]) 条来自历史的回应/);
  });

  it("opens the friend drawer, profile preview, and historical moments", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "打开好友列表" }));
    const drawer = screen.getByRole("dialog", { name: "好友列表" });
    expect(within(drawer).getAllByRole("button", { name: /^查看/ })).toHaveLength(14);
    expect(within(drawer).getByText("无字碑上，任后人评说。")).toBeVisible();

    await user.click(within(drawer).getByRole("button", { name: "查看鲁迅" }));
    expect(screen.getByRole("heading", { name: "鲁迅" })).toBeVisible();
    expect(screen.getByText("从来如此，便对么？")).toBeVisible();
    expect(screen.getByText("IP：上海")).toBeVisible();
    expect(screen.getByRole("button", { name: "发消息" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "查看鲁迅的朋友圈" }));
    expect(screen.getByRole("heading", { name: "鲁迅的朋友圈" })).toBeVisible();
    expect(screen.getByText("1906年")).toBeVisible();
    expect(screen.getByText(/我决定不学医了/)).toBeVisible();
    expect(screen.getAllByRole("img", { name: /鲁迅的历史朋友圈配图/ })).toHaveLength(3);
  });

  it("returns from a friend timeline to that person's current comment", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "打开朋友圈菜单" }));
    await user.click(screen.getByRole("menuitem", { name: "发布朋友圈" }));
    await user.type(
      screen.getByPlaceholderText("这一刻，你想问古人什么？也可以写下你的处境。"),
      "这是一条定位测试问题",
    );
    await user.click(screen.getByRole("button", { name: "选择要@的好友" }));
    const mentionDialog = screen.getByRole("dialog", { name: "@好友" });
    await user.click(within(mentionDialog).getByRole("checkbox", { name: "选择鲁迅" }));
    await user.click(within(mentionDialog).getByRole("button", { name: "完成选择" }));
    await user.click(screen.getByRole("button", { name: "发表" }));
    await user.click(screen.getByRole("button", { name: "打开朋友圈菜单" }));
    await user.click(screen.getByRole("menuitem", { name: "刷新朋友圈" }));

    await user.click(screen.getByRole("button", { name: "打开好友列表" }));
    await user.click(screen.getByRole("button", { name: "查看鲁迅" }));
    await user.click(screen.getByRole("button", { name: "查看鲁迅的朋友圈" }));
    expect(screen.getByText(/本轮投票|本轮未设置投票/)).toBeVisible();
    await user.click(screen.getByRole("button", { name: "回到鲁迅的评论" }));

    expect(screen.getByRole("article", { name: "鲁迅的评论" })).toHaveAttribute(
      "data-highlighted",
      "true",
    );
  });

  it("renders distinct persona comments and persona-authored character interaction replies", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "打开朋友圈菜单" }));
    await user.click(screen.getByRole("menuitem", { name: "发布朋友圈" }));
    await user.type(
      screen.getByPlaceholderText("这一刻，你想问古人什么？也可以写下你的处境。"),
      "工作稳定但没有热情，我该留下还是重新开始？",
    );
    await user.click(screen.getByRole("button", { name: "选择要@的好友" }));
    const mentionDialog = screen.getByRole("dialog", { name: "@好友" });
    for (const name of ["鲁迅", "尼采", "苏格拉底", "马克思", "富兰克林"]) {
      await user.click(within(mentionDialog).getByRole("checkbox", { name: `选择${name}` }));
    }
    await user.click(within(mentionDialog).getByRole("button", { name: "完成选择" }));
    await user.click(screen.getByRole("button", { name: "发表" }));
    await user.click(screen.getByRole("button", { name: "打开朋友圈菜单" }));
    await user.click(screen.getByRole("menuitem", { name: "刷新朋友圈" }));

    expect(screen.getByText(/从来这样算，便对么/)).toBeVisible();
    expect(screen.getByText(/成为何种人/)).toBeVisible();
    expect(screen.getByText(/分别意味着什么/)).toBeVisible();
    expect(screen.getByText(/制度与条件/)).toBeVisible();
    expect(screen.getByText(/一周日程/)).toBeVisible();
    const interactionThread = screen.getByRole("group", { name: "尼采与富兰克林的一来一回" });
    const threadReplies = within(interactionThread).getAllByRole("paragraph");
    expect(threadReplies).toHaveLength(2);
    expect(threadReplies[0]).toHaveTextContent("富兰克林 回复 尼采");
    expect(threadReplies[1]).toHaveTextContent("尼采 回复 富兰克林");
    expect(screen.queryByText(/占位评论|等待真实人物卡/)).not.toBeInTheDocument();
  });

  it("publishes the post before slow character generation finishes", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "打开朋友圈菜单" }));
    await user.click(screen.getByRole("menuitem", { name: "发布朋友圈" }));
    await user.type(
      screen.getByPlaceholderText("这一刻，你想问古人什么？也可以写下你的处境。"),
      "工资翻倍但每天通勤四小时，要不要接受？",
    );
    await user.click(screen.getByRole("button", { name: "发表" }));

    expect(screen.getByRole("heading", { name: "朋友圈" })).toBeVisible();
    expect(screen.getByText("工资翻倍但每天通勤四小时，要不要接受？")).toBeVisible();
    const persisted = JSON.parse(
      localStorage.getItem("ancient-moments-state-v2"),
    ).posts[0];
    expect(["generating", "ready"]).toContain(persisted.generationStatus);
    if (persisted.generationStatus === "generating") {
      expect(screen.getByText("人物正在阅读这条朋友圈…")).toBeVisible();
    }
  });

  it("keeps generated replies when the user refreshes while AI is still working", async () => {
    let releaseFirstComment;
    const firstComment = new Promise((resolve) => {
      releaseFirstComment = resolve;
    });
    let mainCallCount = 0;
    vi.mocked(callAI).mockImplementation(async (_systemPrompt, userMessage, _history, task) => {
      const payload = JSON.parse(userMessage);
      if (task === "persona_main_comment") {
        mainCallCount += 1;
        const result = {
          characterId: payload.characterId,
          vote: null,
          comment: `刷新期间生成的${payload.characterId}具体回应`,
          commentTags: ["清醒"],
          likesPost: true,
        };
        return mainCallCount === 1 ? firstComment.then(() => result) : result;
      }
      if (task === "interaction_director") return { interactions: [] };
      return {};
    });
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "打开朋友圈菜单" }));
    await user.click(screen.getByRole("menuitem", { name: "发布朋友圈" }));
    await user.type(
      screen.getByPlaceholderText("这一刻，你想问古人什么？也可以写下你的处境。"),
      "测试刷新和后台生成是否会互相覆盖",
    );
    await user.click(screen.getByRole("button", { name: "发表" }));

    await user.click(screen.getByRole("button", { name: "打开朋友圈菜单" }));
    await user.click(screen.getByRole("menuitem", { name: "刷新朋友圈" }));
    releaseFirstComment();

    expect(
      (await screen.findAllByRole("article", { name: /的评论$/ })).length,
    ).toBeGreaterThanOrEqual(6);
  });

  it("reveals completed replies immediately when generation finishes during a refresh", async () => {
    let releaseFirstComment;
    const firstComment = new Promise((resolve) => {
      releaseFirstComment = resolve;
    });
    let mainCallCount = 0;
    vi.mocked(callAI).mockImplementation(async (_systemPrompt, userMessage, _history, task) => {
      const payload = JSON.parse(userMessage);
      if (task === "persona_main_comment") {
        mainCallCount += 1;
        const result = {
          characterId: payload.characterId,
          vote: null,
          comment: `本次刷新收到的${payload.characterId}具体回应`,
          commentTags: ["清醒"],
          likesPost: true,
        };
        return mainCallCount === 1 ? firstComment.then(() => result) : result;
      }
      if (task === "interaction_director") return { interactions: [] };
      return {};
    });
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "打开朋友圈菜单" }));
    await user.click(screen.getByRole("menuitem", { name: "发布朋友圈" }));
    await user.type(
      screen.getByPlaceholderText("这一刻，你想问古人什么？也可以写下你的处境。"),
      "点刷新时还在生成，完成后这一次刷新就应该看到",
    );
    await user.click(screen.getByRole("button", { name: "发表" }));
    await user.click(screen.getByRole("button", { name: "打开朋友圈菜单" }));
    await user.click(screen.getByRole("menuitem", { name: "刷新朋友圈" }));
    releaseFirstComment();

    expect(
      (await screen.findAllByRole("article", { name: /的评论$/ })).length,
    ).toBeGreaterThanOrEqual(6);
  });

  it("recovers a post that was interrupted while generating after the page is reopened", async () => {
    localStorage.setItem(
      "ancient-moments-state-v2",
      JSON.stringify({
        posts: [
          {
            id: "post_interrupted",
            author: "me",
            content: "上次等待回复时页面关闭了，这次应该继续生成",
            createdAt: "2026-09-22T12:00:00.000Z",
            mentionedCharacterIds: ["luxun"],
            participantIds: ["luxun", "wuzetian", "nietzsche", "socrates", "marx", "franklin"],
            generationStatus: "generating",
            poll: null,
            visibleInteractions: { likes: [], votes: [], comments: [] },
            pendingInteractions: { likes: [], votes: [], comments: [], replies: [] },
          },
        ],
      }),
    );
    vi.mocked(callAI).mockImplementation(async (_systemPrompt, userMessage, _history, task) => {
      const payload = JSON.parse(userMessage);
      if (task === "persona_main_comment") {
        return {
          characterId: payload.characterId,
          vote: null,
          comment: `恢复生成后的${payload.characterId}具体回应`,
          commentTags: ["清醒"],
          likesPost: true,
        };
      }
      if (task === "interaction_director") return { interactions: [] };
      return {};
    });
    const user = userEvent.setup();
    render(<App />);

    expect(
      screen.getByText("上次等待回复时页面关闭了，这次应该继续生成"),
    ).toBeVisible();
    await user.click(screen.getByRole("button", { name: "打开朋友圈菜单" }));
    await user.click(screen.getByRole("menuitem", { name: "刷新朋友圈" }));

    expect(
      (await screen.findAllByRole("article", { name: /的评论$/ })).length,
    ).toBe(6);
  });

  it("retries a failed generation from the refresh action", async () => {
    localStorage.setItem(
      "ancient-moments-state-v2",
      JSON.stringify({
        posts: [
          {
            id: "post_failed",
            author: "me",
            content: "这条回复第一次失败了，刷新后应该重试",
            createdAt: "2026-09-22T12:00:00.000Z",
            mentionedCharacterIds: ["luxun"],
            participantIds: ["luxun", "wuzetian", "nietzsche", "socrates", "marx", "franklin"],
            generationStatus: "failed",
            poll: null,
            visibleInteractions: { likes: [], votes: [], comments: [] },
            pendingInteractions: { likes: [], votes: [], comments: [], replies: [] },
          },
        ],
      }),
    );
    vi.mocked(callAI).mockImplementation(async (_systemPrompt, userMessage, _history, task) => {
      const payload = JSON.parse(userMessage);
      if (task === "persona_main_comment") {
        return {
          characterId: payload.characterId,
          vote: null,
          comment: `重新生成后的${payload.characterId}具体回应`,
          commentTags: ["清醒"],
          likesPost: true,
        };
      }
      if (task === "interaction_director") return { interactions: [] };
      return {};
    });
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByText("这次回应生成失败，请重新发布试试")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "打开朋友圈菜单" }));
    await user.click(screen.getByRole("menuitem", { name: "刷新朋友圈" }));

    expect(
      (await screen.findAllByRole("article", { name: /的评论$/ })).length,
    ).toBe(6);
  });
});
