# 角色语料库与隔离生成 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn 14 individual Markdown persona cards into the isolated runtime source for distinctive, content-aware main comments, character interactions, and user replies.

**Architecture:** Vite imports the canonical Markdown cards as raw text through a persona library. A persona runtime builds one-card-only system prompts, wraps untrusted user content as data, calls the single AI adapter, and validates outputs. The mock adapter remains local but uses 14 distinct question-aware voice functions; the director chooses relationships only, while each final interaction line is generated in a separate call under the responding character's card.

**Tech Stack:** React 18, Vite raw Markdown imports, Vitest, Testing Library, local mock AI adapter.

**Spec:** `docs/14-角色语料与隔离规范.md`

## Global Constraints

- Every character has exactly one independent Markdown card under `docs/人物卡/`.
- No persona generation call may contain another character's source corpus.
- User content is untrusted data and never overrides persona instructions.
- The interaction director returns relationships only and never final dialogue.
- All generated text still passes through `callAI(systemPrompt, userMessage, history, task)`.
- User conversations contain only the active character's latest six messages.
- Failed outputs retry once or use a character-specific fallback, never a shared assistant phrase.

---

### Task 1: Canonical persona corpus

**Files:**
- Create: `docs/人物卡/00-人物卡索引.md`
- Create: 14 files `docs/人物卡/<id>-<姓名>.md`
- Modify: `src/data/characters.json`, `docs/00-文档索引.md`, `CLAUDE.md`

**Interfaces:**
- Produces: one `personaFile` per character and 14 independently editable corpora.

- [ ] Add a failing contract test requiring 14 unique Markdown paths and exact identity metadata.
- [ ] Write each approved persona card with source excerpts, transferable style features, sentence patterns, imagery, prohibitions, positive/negative examples, and a generation checklist.
- [ ] Link every JSON character to its card and verify no card is missing.

### Task 2: Persona library and isolation prompts

**Files:**
- Create: `src/services/personaLibrary.js`, `src/services/personaLibrary.test.js`
- Create: `src/services/personaRuntime.js`, `src/services/personaRuntime.test.js`

**Interfaces:**
- Produces: `getPersonaCard(id)`, `buildPersonaSystemPrompt(id, task)`, `generateMainComment`, `generateInteractionReply`, `generateUserReply`, `validatePersonaText`.

- [ ] Write failing tests proving a prompt contains exactly one corpus, wraps user text as data, truncates history to six messages, validates IDs/tags/votes, and rejects assistant boilerplate.
- [ ] Implement raw Markdown loading and task-specific isolation prompts.
- [ ] Implement one retry and per-character fallback behavior.
- [ ] Run targeted tests green.

### Task 3: Distinct content-aware mock voices

**Files:**
- Create: `src/services/mockPersonaVoices.js`, `src/services/mockPersonaVoices.test.js`
- Modify: `src/services/callAI.js`, `src/services/callAI.test.js`

**Interfaces:**
- Produces: `mockMainComment`, `mockInteractionReply`, `mockUserReply` for all 14 IDs.

- [ ] Write failing tests across unrelated open-domain questions, requiring concrete question anchors, legal votes, Socrates abstention, and distinctive structural markers. Test prompts are coverage samples, never routing categories.
- [ ] Implement 14 separate voice strategies using question/poll extraction rather than static placeholder strings.
- [ ] Preserve cooldown and deterministic tests.

### Task 4: Isolated multi-call orchestration

**Files:**
- Modify: `src/App.jsx`, `src/utils/interactions.js`, `src/utils/interactions.test.js`, `src/App.test.jsx`

**Interfaces:**
- Consumes persona runtime methods.
- Produces one main-comment call per participant, one relationship-only director call, and one persona-isolated call per directed reply.

- [ ] Add failing integration tests ensuring 6-8 distinct comments, no placeholder copy, mentioned-first participants, relationship-only director plans, and rendered persona replies.
- [ ] Replace aggregate initial generation with independent per-character generation.
- [ ] Materialize validated director plans through the responding personas and preserve manual-refresh behavior.
- [ ] Run integration and full tests.

### Task 5: Documentation and verification

**Files:**
- Modify: `docs/06-官方平台复刻执行提示词.md`, `docs/07-验收清单.md`, `docs/10-人物互动与AI提示词规范.md`, `开发日志/2026-09-22-第一阶段框架.md`

**Interfaces:**
- Produces an official-platform-ready persona package and acceptance evidence.

- [ ] Update upload order, isolation rules, card paths, model tasks, retry behavior, and acceptance prompts.
- [ ] Run all tests, production build, asset verification, and browser flows.
- [ ] Manually compare three question categories for recognizable voice separation and record residual mock-vs-real-model limits.

## Self-review

- Coverage: individual cards, source excerpts, style abstraction, isolation, prompt injection boundary, output validation, content-aware mock, director separation, user context, docs and verification are all assigned.
- Placeholder scan: no task delegates unspecified implementation behavior.
- Type consistency: all tasks use the same persona IDs, `commentTags`, `vote`, director plan, and `callAI` signatures.
