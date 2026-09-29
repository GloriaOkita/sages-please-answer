# 古人朋友圈第一阶段框架 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local, mobile-first React prototype that completes publishing, friend mentions, 2-4 option polls, manual refresh, mock historical interactions, likes, and reply collection.

**Architecture:** A Vite React single-page app uses explicit page and modal state. Pure domain functions create posts, enforce poll and mention limits, merge pending interactions on manual refresh, and queue character replies; localStorage persists only durable state. Static character data and the single mock AI adapter remain replaceable without component changes.

**Tech Stack:** React 18, Vite 5, Vitest, Testing Library, native CSS, localStorage.

**Spec:** `docs/01-第一阶段产品需求.md`, `docs/02-交互与页面状态规范.md`, `docs/03-视觉设计规范.md`, `docs/04-数据结构与AI接口.md`

## Global Constraints

- The fixed user name is `我`; avatar and cover are not editable.
- Publishing supports text only and an optional poll of exactly 2-4 non-empty options.
- A maximum of 5 characters may be mentioned.
- Character interactions never appear automatically; only manual refresh reveals the full pending batch.
- All AI behavior passes through `callAI(systemPrompt, userMessage, history = [], task)`.
- Character records live only in `src/data/characters.json`.
- No database, router, image upload, message tab, profile tab, character profile page, or result page in phase one.

---

### Task 1: Project foundation and domain contracts

**Files:**
- Create: `package.json`, `vite.config.js`, `index.html`, `src/main.jsx`, `src/test/setup.js`
- Create: `src/data/characters.json`, `src/utils/moments.js`, `src/utils/moments.test.js`
- Create: `public/assets/user/avatar.jpg`, `public/assets/user/cover.svg`, and the 14 user-supplied JPG files under `public/assets/好友头像/`

**Interfaces:**
- Produces: `validatePoll(poll)`, `createPost(draft, interactions, now)`, `revealPending(post)`, `queueUserReply(post, commentId, text, characterReply)`.

- [ ] Write failing tests proving the 2-4 option rule, 5-friend cap, invisible pending interactions, one-batch refresh, and queued character reply.
- [ ] Run `npm test -- --run src/utils/moments.test.js` and verify failures are caused by missing implementation.
- [ ] Implement the minimal pure functions and three-character JSON contract.
- [ ] Re-run the targeted tests and verify they pass.

### Task 2: AI mock and persistent application flow

**Files:**
- Create: `src/services/callAI.js`, `src/services/callAI.test.js`, `src/hooks/usePersistedMoments.js`
- Create: `src/App.jsx`, `src/App.test.jsx`

**Interfaces:**
- Consumes: domain contracts from Task 1 and `characters.json`.
- Produces: deterministic `initial_interactions` and `reply_to_user` mock results; durable post state under `ancient-moments-state-v1`.

- [ ] Write failing tests for deterministic poll-valid mock interactions and publish-before-refresh behavior.
- [ ] Verify the targeted tests fail for the missing adapter and app flow.
- [ ] Implement mock AI, persistent state, and page/modal orchestration.
- [ ] Re-run tests and verify green.

### Task 3: Feed, composer, mention and poll interfaces

**Files:**
- Create: `src/components/icons.jsx`, `TopBar.jsx`, `FeedPage.jsx`, `PostCard.jsx`, `ComposerPage.jsx`, `MentionDialog.jsx`, `PollDialog.jsx`, `ReplyDialog.jsx`, `Toast.jsx`
- Create: `src/styles.css`

**Interfaces:**
- Consumes: callbacks and durable state from `App.jsx`.
- Produces: accessible controls named 发布朋友圈, 刷新朋友圈, @好友, 投票, 发表, 完成, 回复.

- [ ] Extend `src/App.test.jsx` with failing user-flow tests for menu, 5-person selection cap, disabled incomplete poll, publish, refresh, pink like state, reply, and second refresh.
- [ ] Run the tests and confirm behavior failures rather than setup errors.
- [ ] Implement semantic React components and exact interaction states from the spec.
- [ ] Add the constrained mobile canvas, desktop-centered dialogs, colors, line icons, responsive layout, and reduced-motion behavior.
- [ ] Re-run all tests and verify green.

### Task 4: Documentation, browser verification and delivery

**Files:**
- Create: `CLAUDE.md`, `开发日志/2026-09-22-第一阶段框架.md`
- Create via browser check: `output/playwright/phase-one-feed.png`, `output/playwright/phase-one-poll-dialog.png`

**Interfaces:**
- Consumes: completed application and all standards in `docs/`.
- Produces: reproducible local preview and evidence against `docs/07-验收清单.md`.

- [ ] Run `npm test -- --run` and require zero failures.
- [ ] Run `npm run build` and require exit code 0.
- [ ] Start the local preview and exercise the full workflow in a real browser at desktop and mobile viewport sizes.
- [ ] Inspect screenshots for clipping, incorrect modal centering, weak hierarchy, and reference-style mismatch; fix and re-run checks if needed.
- [ ] Record implementation decisions, completed work, checks, and next-stage items in the development log.

## Self-review

- Spec coverage: each first-stage requirement maps to Tasks 1-4; intentionally deferred pages are explicitly excluded.
- Placeholder scan: no implementation requirement is left as TBD or TODO.
- Type consistency: all tasks use the same `visibleInteractions`, `pendingInteractions`, option IDs A-D, character IDs, and single `callAI` signature.
