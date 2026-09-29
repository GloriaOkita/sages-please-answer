# 第二阶段人物互动与好友朋友圈 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the local prototype with authoritative persona cards, guaranteed-mentioned plus random 6-8 participant selection, one-layer AI-directed character interaction, and a friend drawer/profile/history flow.

**Architecture:** Pure domain modules own participant selection, legacy ID migration, director-output validation, and post lookup. React page state owns feed/composer/friend preview/friend moments; the friend drawer remains an overlay. All generated language still goes through the single `callAI` adapter, while historical moments and downloaded images remain static character data.

**Tech Stack:** React 18, Vite 5, Vitest, Testing Library, native CSS, localStorage, local image assets.

**Spec:** `docs/09-第二阶段产品与交互规范.md`, `docs/10-人物互动与AI提示词规范.md`, `docs/11-历史朋友圈图片清单.md`

## Global Constraints

- The latest 14 persona cards are the sole authority and replace prior IDs, signatures, IPs, tags, and groups.
- Mentioned friends must participate; every round has 6-8 unique participants.
- Semantic interaction relations are decided in one `interaction_director` AI call, never by exact string matching.
- Each character may reply to at most two main comments and interactions never recurse.
- There is no perspective map or result page.
- Historical moment images are local files with recorded source URLs; the first moment image is the profile cover.
- Existing publish/manual-refresh/reply behavior must remain intact.

---

### Task 1: Authoritative character data and durable migration

**Files:**
- Modify: `src/data/characters.json`
- Create: `src/data/legacyCharacterIds.js`, `src/data/characters.test.js`
- Modify: `src/hooks/usePersistedMoments.js`

**Interfaces:**
- Produces: `normalizeCharacterId(id)` and `migratePersistedPosts(posts)`.

- [ ] Write failing tests asserting all 14 exact IDs, group counts 5/5/2/2, all persona fields, 3 moments per person, and old-to-new ID migration throughout posts.
- [ ] Run the targeted tests and confirm failures are missing data/migration behavior.
- [ ] Replace all 14 JSON cards with the approved data and implement recursive post ID migration.
- [ ] Re-run targeted tests and require all green.

### Task 2: Participant selection and AI director domain

**Files:**
- Create: `src/utils/participants.js`, `src/utils/participants.test.js`
- Create: `src/utils/interactions.js`, `src/utils/interactions.test.js`
- Modify: `src/services/callAI.js`, `src/services/callAI.test.js`

**Interfaces:**
- Produces: `selectParticipants(characters, mentionedIds, random)`, `sanitizeDirectedInteractions(output, comments, participants)`, and mock tasks `initial_interactions`, `interaction_director`, `reply_to_user`.

- [ ] Write failing tests for 0/3/5 mentions, target 6/7/8, uniqueness, mention-first ordering, legal votes, max-two replies, no self-reply, one-level nesting, and invalid-director fallback.
- [ ] Verify the tests fail for absent behavior.
- [ ] Implement deterministic Fisher-Yates selection and director validation.
- [ ] Extend mock AI outputs and merge directed replies into pending interactions.
- [ ] Run targeted and full tests.

### Task 3: Friend drawer and profile navigation

**Files:**
- Create: `src/components/FriendDrawer.jsx`, `FriendPreviewPage.jsx`, `FriendMomentsPage.jsx`, `MomentTimeline.jsx`
- Modify: `src/components/FeedPage.jsx`, `src/components/PostCard.jsx`, `src/components/icons.jsx`, `src/App.jsx`, `src/styles.css`
- Modify tests: `src/App.test.jsx`

**Interfaces:**
- Consumes: characters, posts, active character ID, and comment anchors.
- Produces: accessible actions `打开好友列表`, `查看<人物>`, `查看<人物>的朋友圈`, and `回到<人物>的评论`.

- [ ] Add failing integration tests for drawer open/close, 14 entries, friend preview, disabled message, moment detail, current vote/comment context, and return-to-comment highlighting.
- [ ] Verify failures are behavioral.
- [ ] Implement the overlay drawer, preview, timeline, and page state without adding a router dependency.
- [ ] Add desktop/mobile responsive styling and reduced-motion behavior.
- [ ] Re-run integration and full tests.

### Task 4: Historical image assets and documentation

**Files:**
- Create: `public/assets/moments/<character-id>/01-03.<ext>` for 14 characters
- Modify: `docs/11-历史朋友圈图片清单.md`, `docs/00-文档索引.md`, `docs/06-官方平台复刻执行提示词.md`, `docs/07-验收清单.md`, `CLAUDE.md`, `开发日志/2026-09-22-第一阶段框架.md`

**Interfaces:**
- Produces: 42 loadable local image paths referenced by character moments and a source record for every asset.

- [ ] Select an era-appropriate source image for each moment and verify source-page/usage metadata.
- [ ] Download local copies into stable paths and add paths to character JSON.
- [ ] Run an asset integrity script proving every moment image exists and decodes.
- [ ] Update the official-platform prompt and implementation log.

### Task 5: End-to-end verification

**Files:**
- Create/update: `output/playwright/phase-two-*.png`

**Interfaces:**
- Consumes the complete application.
- Produces browser evidence for desktop and mobile acceptance.

- [ ] Run `npm test -- --run` with zero failures.
- [ ] Run `npm run build` with exit code 0.
- [ ] Exercise publish with 0 and 5 mentions, manual refresh, character interaction, user reply, friend drawer, preview, timeline, and return-to-comment in a real browser.
- [ ] Verify 390px and 1280px viewports have no horizontal overflow and console has zero errors.
- [ ] Fix any discovered issue and repeat the complete checks.

## Self-review

- Spec coverage: participant selection, personas, semantic director, user reply limits, friend navigation, static moments, local images, and comment return are mapped to Tasks 1-5.
- Placeholder scan: every task names exact files, interfaces, checks, and expected behavior.
- Type consistency: IDs, `commentTags`, `directedReplies`, `moments[].image`, and page states match the specifications.
