# Command Code v0.28.1 — Full Decompilation

End-to-end reverse-engineering of the [`command-code`](https://www.npmjs.com/package/command-code) npm package (v0.28.1). The CLI was installed, its single-file ESM bundle (1.4 MB minified / 70,494 lines beautified) was decompiled, and every layer — from model catalog and pricing to telemetry tokens — was extracted, documented, and organized into readable source files.

## What's Inside

| Document | Description |
|---|---|
| **[README.md](README.md)** (this file) | Full architecture, model catalog, API routes, tools, auth — everything |
| **[TOOL-REPAIR.md](TOOL-REPAIR.md)** | Deep-dive: how 6 repair rules shipped 36K+ fixes and made DeepSeek V4 Pro beat Opus 4.7 |
| **[DESIGN-SKILLS.md](DESIGN-SKILLS.md)** | Deep-dive: the AI design partner — 16 tools, 24 reference docs, smell system |

| File / Directory | Contents |
|---|---|
| **[`index.mjs`](index.mjs)** | Full beautified bundle (70,494 lines) — the complete decompiled source |
| **[`source/`](source/)** | Extracted key source sections (model catalog, pricing, tool repair, agents, skill loader) |
| **[`skills/`](skills/)** | Original bundled skill files — design system (389-line orchestrator + 24 references) and agent browser |
| **[`vsix-extension/`](vsix-extension/)** | Decompiled VS Code extension (578-line IPC bridge) |

---

## Table of Contents

- [Package Identity](#package-identity)
- [Architecture Overview](#architecture-overview)
- [Dependencies (60+)](#dependencies-60)
- [Full Model Catalog and Pricing](#full-model-catalog-and-pricing)
- [Subscription Plans](#subscription-plans)
- [Auth Providers](#auth-providers)
- [API Architecture](#api-architecture)
- [AI Tools (15 Client + 2 Server)](#ai-tools-15-client--2-server)
- [CLI Commands](#cli-commands)
- [Slash Commands (In-Session)](#slash-commands-in-session)
- [The taste-1 System](#the-taste-1-system)
- [.commandcode Directory Structure](#commandcode-directory-structure)
- [Skills System](#skills-system)
- [MCP (Model Context Protocol)](#mcp-model-context-protocol)
- [Telemetry (OpenTelemetry to Axiom)](#telemetry-opentelemetry-to-axiom)
- [Environment Variables](#environment-variables)
- [VS Code Extension (VSIX)](#vs-code-extension-vsix)
- [Design Skill System (24 Reference Docs)](#design-skill-system-24-reference-docs)
- [Error Handling and Retry](#error-handling-and-retry)
- [Security Features](#security-features)
- [Tool-Input Repair System](#tool-input-repair-system)
- [Repository Structure](#repository-structure)

---

## Package Identity

| Field | Value |
|---|---|
| Name | `command-code` |
| Version | `0.28.1` |
| License | `UNLICENSED` |
| Binaries | `cmd`, `cmdc`, `command-code`, `commandcode` |
| Entry point | `dist/index.mjs` (ESM, `#!/usr/bin/env node`) |
| Bundle size | 1.4 MB minified, 70,494 lines beautified |
| Build tool | `tsup` (with optional `javascript-obfuscator` + `terser`) |
| Repo | [github.com/CommandCodeAI/command-code](https://github.com/CommandCodeAI/command-code) |

---

## Architecture Overview

```mermaid
block-beta
  columns 1
  block:bundle["dist/index.mjs — Single-file ESM CLI bundle (70,494 lines)"]
    columns 3
    L1["Layer 1\nImports & Shims\nLines 1–160"]
    L2["Layer 2\nConstants (models, pricing, API)\nLines 160–1,320"]
    L3["Layer 3\nAuth, Config, Input Components\nLines 1,320–3,600"]
    L4["Layer 4\nUtilities (model, telemetry, paths)\nLines 3,600–5,800"]
    L5["Layer 5\nBundled ORM + DB Driver\nLines 5,800–23,400"]
    L6["Layer 6\nAPI Client, Skills, MCP\nLines 23,400–27,900"]
    L7["Layer 7\nOAuth Flows & Login\nLines 27,900–29,700"]
    L8["Layer 8\nMemory, Taste, Settings\nLines 29,700–31,500"]
    L9["Layer 9\nAI Tool Implementations\nLines 31,500–34,200"]
    L10["Layer 10\nAgent System & SSE Streaming\nLines 34,200–37,700"]
    L11["Layer 11\nHooks, Permissions, Learning\nLines 37,700–41,500"]
    L12["Layer 12\nContextEngine (Core AI Loop)\nLines 41,500–44,500"]
    L13["Layer 13\nOnboarding, Updates, IDE\nLines 44,500–46,700"]
    L14["Layer 14\nSlash Commands & React TUI\nLines 46,700–62,500"]
    L15["Layer 15\nCLI Program & Commands\nLines 62,500–70,494"]
  end
```

**Key architectural observations:**

1. **React/Ink TUI** -- The interactive mode is a React application rendered via [Ink](https://github.com/vadimdemedes/ink) (terminal React renderer), with components, hooks (`useState`, `useRef`, `useEffect`), and memoization.
2. **~25% ORM** -- Lines 5,800-23,400 (~17,600 lines) are the entire Drizzle ORM + Postgres.js driver bundled inline.
3. **Custom SSE client** -- Does **not** use the Vercel AI SDK. All LLM traffic goes through a custom SSE streaming client to `api.commandcode.ai`.
4. **Zero exports** -- Pure CLI executable, not a library.

### Core Classes

| Class | Purpose |
|---|---|
| `ContextEngine` | Central AI conversation engine -- messages, API calls, streaming, compaction |
| `SessionManager` | Session persistence (save/load/resume) |
| `Request` | HTTP client for API communication |
| `LearningAgent` | Background taste learning from conversations |
| `CompactAgent` | Conversation compaction / summarization |
| `TasteManager` | Manages `.commandcode/taste/` directory |
| `PermissionsService` | File/tool permission management |
| `CheckpointManager` | File edit checkpoint/undo system |
| `FileHistoryManager` | File edit history tracking |
| `McpConnectionManager` | MCP server connection management |
| `IPCServer` | VS Code IPC integration |
| `SessionImporter` | Import sessions from Codex, Cursor, etc. |

---

## Dependencies (60+)

| Category | Packages |
|---|---|
| **TUI** | `react`, `ink` (Box, Text, render, useInput), `ink-spinner`, `ink-select-input`, `chalk`, `picocolors`, `ora`, `figures`, `fast-wrap-ansi`, `terminal-link` |
| **CLI** | `commander` (Command, Option), `@clack/prompts` (select, confirm, password) |
| **AI/Telemetry** | `zod`, `@opentelemetry/*` (sdk-node, exporter-trace-otlp-http, api) |
| **File/Markdown** | `gray-matter`, `marked`, `marked-terminal`, `diff`, `minimatch`, `glob`, `ignore`, `shell-quote` |
| **Utility** | `uuid`, `semver`, `dotenv`, `dedent`, `sharp` (images), `open`, `open-editor`, `@sindresorhus/slugify` |

---

## Full Model Catalog and Pricing

### Premium Models

| Model | ID | Provider | Prompt $/M | Completion $/M | Context Window |
|---|---|---|---|---|---|
| **Claude Sonnet 4.6** (default) | `claude-sonnet-4-6` | Anthropic | $3 | $15 | 1M |
| Claude Opus 4.7 | `claude-opus-4-7` | Anthropic | $5 | $25 | 1M |
| Claude Haiku 4.5 | `claude-haiku-4-5-20251001` | Anthropic | $1 | $5 | 200K |
| GPT-5.5 | `gpt-5.5` | OpenAI | $5 | $30 | -- |
| GPT-5.4 | `gpt-5.4` | OpenAI | $2.50 | $15 | 400K |
| GPT-5.3 Codex | `gpt-5.3-codex` | OpenAI | $2 | $8 | 400K |
| GPT-5.4 Mini | `gpt-5.4-mini` | OpenAI | $0.75 | $4.50 | 400K |

### Open Source Models (via gateways)

| Model | ID | Prompt $/M | Completion $/M | Context Window |
|---|---|---|---|---|
| DeepSeek V4 Pro | `deepseek/deepseek-v4-pro` | -- | -- | 1M |
| DeepSeek V4 Flash | `deepseek/deepseek-v4-flash` | -- | -- | 1M |
| Kimi K2.6 | `moonshotai/Kimi-K2.6` | $0.95 | $4 | 256K |
| **Kimi K2.5** (fallback) | `moonshotai/Kimi-K2.5` | $0.60 | $3 | 256K |
| Qwen 3.7 Max | `Qwen/Qwen3.7-Max` | -- | -- | 1M |
| Qwen 3.6 Plus | `Qwen/Qwen3.6-Plus` | -- | -- | -- |
| Qwen 3.6 Max Preview | `Qwen/Qwen3.6-Max-Preview` | -- | -- | -- |
| GLM-5 | `zai-org/GLM-5` | $0.95 | $3.15 | 200K |
| GLM-5.1 | `zai-org/GLM-5.1` | -- | -- | -- |
| MiniMax M2.5 | `MiniMaxAI/MiniMax-M2.5` | $0.50 | $2 | 200K |
| MiniMax M2.7 | `MiniMaxAI/MiniMax-M2.7` | -- | -- | -- |
| Step 3.5 Flash | `stepfun/Step-3.5-Flash` | -- | -- | 1M |
| MiMo V2.5 Pro | `xiaomi/mimo-v2.5-pro` | -- | -- | 1M |
| MiMo V2.5 | `xiaomi/mimo-v2.5` | -- | -- | 1M |
| Gemini 3.5 Flash | `google/gemini-3.5-flash` | -- | -- | 1M |
| Gemini 3.1 Flash Lite | `google/gemini-3.1-flash-lite` | -- | -- | 1M |

### Multi-Provider Routing

Open-source models route through **Vercel AI Gateway**, **Baseten**, **Cloudflare AI Gateway**, or **OpenRouter** with per-model routing tables. Two API wire formats:
- `chatComplete` -- Anthropic-style (Claude, all open-source via gateway)
- `responses` -- OpenAI-style (GPT series)

### Legacy Model Aliases

```
claude-sonnet-4-20250514   -> claude-sonnet-4-6
claude-sonnet-4-5-20250929 -> claude-sonnet-4-6
claude-opus-4-5-20251101   -> claude-opus-4-7
claude-opus-4-6            -> claude-opus-4-7
claude-haiku-4-5           -> claude-haiku-4-5-20251001
```

---

## Subscription Plans

| Plan | Premium Requests | OSS Requests | Total | Model Restrictions |
|---|---|---|---|---|
| `Go` (free) | 0 | 10 | 10 | OSS only |
| `Pro` | 15 | 15 | 30 | No Opus models |
| `Max` | 100 | 50 | 150 | All models |
| `Ultra` | 200 | 100 | 300 | All models |
| `Teams Pro` | 40 | 0 | 40 | All models |

When premium credits run out, auto-switches to Kimi K2.5.

---

## Auth Providers

| Provider | Label | Auth Method | Models |
|---|---|---|---|
| `command-code` | Command Code (default) | Own OAuth | All |
| `anthropic` | Anthropic | OAuth PKCE | Claude only |
| `github-copilot` | GitHub Copilot | Device code flow | Anthropic + OpenAI |
| `codex` | ChatGPT (Codex) | OAuth PKCE | OpenAI only |

---

## API Architecture

**All LLM traffic is proxied** -- the CLI never calls AI providers directly.

| Environment | Base URL |
|---|---|
| Production | `https://api.commandcode.ai` |
| Staging | `https://staging-api.commandcode.ai` |
| Local dev | `http://localhost:9090` |

### Core Generation Endpoint

```
POST /alpha/generate
```

**Payload:** `{ model, messages, system, tools, max_tokens, stream: true, reasoning_effort?, threadId }`

**SSE event types:**

| Event | Data |
|---|---|
| `text-delta` | Incremental text content |
| `reasoning-start` | Reasoning block begins |
| `reasoning-delta` | Incremental reasoning text |
| `reasoning-end` | Reasoning block complete |
| `tool-call` | `{ toolCallId, toolName, input }` |
| `tool-result` | Server-executed tool result |
| `finish` | `{ totalUsage, finishReason }` |
| `error` | `{ statusCode, isRetryable }` |

### All Discovered API Routes (70+)

**Generation:** `/alpha/generate`, `/alpha/agent/generate`

**Identity:** `/alpha/whoami`, `/alpha/namespaces`

**Taste:** `/alpha/taste/{get,update,delete}`, `/alpha/learn`

**Billing:** `/alpha/billing/{credits,subscriptions}`, `/alpha/usage/summary`

**Sharing:** `/alpha/share/{create,delete,data,append,connect}`

**Sandbox:** `/alpha/sandbox/{start,stream,status,stop,sessions}`

**Lifecycle:** `/alpha/lifecycle-events`, `/alpha/conversions/track`, `/alpha/consent/set`

**Taste Packages (Beta):** `/beta/taste/packages/{upload,list,get,files,download,delete}`

**Internal Admin:** `/internal/admin/{users,orgs,grant-credits,ban-user,delete-user,...}`

**Internal Profile:** `/internal/profile/:login/{get,packages,followers,following}`

**Internal Orgs:** `/internal/orgs/{list,get,create,update,delete,avatar,members,...}`

**Internal User:** `/internal/user/{settings,avatar,follow,followers,following}`

**Internal Usage:** `/internal/usage/{list,summary,charts}`

**Internal Billing:** `/internal/billing/{credits,customers,checkout,subscriptions,webhook}`

**Internal API Keys:** `/internal/api-keys/{create,list,delete}`

**Provider Proxy:** `/provider/v1/{chat/completions,models,messages}`

---

## AI Tools (15 Client + 2 Server)

### 15 Client-Side Tools

| # | Tool | Description |
|---|---|---|
| 1 | `read_file` | Read file contents (text/binary detection, line ranges) |
| 2 | `edit_file` | Exact string replacement with file backup |
| 3 | `read_directory` | List directory with `.gitignore` respect |
| 4 | `write_file` | Create/overwrite file with auto `mkdir -p` |
| 5 | `read_multiple_files` | Bulk read via glob patterns |
| 6 | `grep` | Regex search across files (PCRE) |
| 7 | `glob` | File search by glob patterns |
| 8 | `shell_command` | Shell execution (30s default, max 300s timeout) |
| 9 | `todo_write` | Task list management |
| 10 | `ask_user_question` | Structured user questions with choices |
| 11 | `kill_shell` | Kill process by port or PID |
| 12 | `exit_plan_mode` | Exit plan mode, begin implementation |
| 13 | `enter_plan_mode` | Enter read-only exploration mode |
| 14 | `diagnostics` | Get IDE LSP diagnostics (via VS Code IPC) |
| 15 | `get_self_knowledge` | Return product documentation |

### 2 Server-Side Tools

| Tool | Type | Limit |
|---|---|---|
| `web_search` | `web_search_20250305` | Max 5 uses per turn |
| `web_fetch` | `web_fetch_20250910` | Unlimited |

---

## CLI Commands

### Top-Level

| Command | Description |
|---|---|
| `cmd [prompt]` | Interactive AI chat (default action) |
| `cmd help` | Display help |
| `cmd info` | System information |
| `cmd whoami` | Current user identity |
| `cmd update` | Update CLI to latest |
| `cmd feedback` | Open GitHub issues |
| `cmd login` / `logout` | Auth management |
| `cmd learn-taste` | Learn from previous sessions |

### `cmd taste <subcommand>`

`learn` (experimental), `lint`, `list`, `open`, `pull`, `push`

### `cmd mcp <subcommand>`

`add`, `list`, `get`, `remove`, `add-json`, `auth`

### `cmd skills <subcommand>`

`add <repo>`, `remove <name>`, `list`

### `cmd sandbox [prompt]` (experimental)

Autonomous sandbox execution mode. Gated behind `--experimental`.

---

## Slash Commands (In-Session)

`/add-dir` `/agents` `/clear` `/compact` `/compact-mode` `/context` `/courses` `/design` `/exit` `/extra` `/feedback` `/help` `/ide` `/init` `/learn-taste` `/login` `/logout` `/mcp` `/memory` `/model` `/plan` `/pr-comments` `/provider` `/rename` `/resume` `/rewind` `/share` `/unshare` `/skills` `/status` `/taste` `/terminal-setup` `/upgrade` `/usage`

---

## The taste-1 System

**`taste-1` is marketing branding, not a separate model.** It is implemented as:

1. **LearningAgent** -- background agent calling `/alpha/learn` with conversation history
2. **Session import** -- learns from Claude Code, Cursor, Codex, and Aider transcripts
3. **Observer** -- uses Kimi K2.5 to scan prompts and produce observations
4. **Storage** -- `.commandcode/taste/taste.md` files with `- Pattern... Confidence:` entries
5. **Auto-reorganization** -- when `taste.md` grows past threshold, categories split into subdirectories

---

## `.commandcode` Directory Structure

```mermaid
graph LR
  subgraph Global["~/.commandcode/ (Global root)"]
    auth["auth.json — API credentials (chmod 0600)"]
    config["config.json — User config (model, telemetry)"]
    settings["settings.json — User-level settings"]
    agents_md["AGENTS.md — User memory / instructions"]
    history["history.jsonl — Conversation history (NDJSON)"]
    mcp["mcp.json — User-level MCP config"]
    hooks["trusted-hooks.json — Trusted hook fingerprints"]
    updates["updates.json — Update check state"]
    subgraph logs["logs/"]
      cmd_log["command.log — Debug log"]
      flicker["flicker.log — UI flicker debug"]
    end
    g_skills["skills/ — Global skills"]
    g_agents["agents/ — Global agents"]
    taste_g["taste/taste.md — Global taste data"]
    ide["ide/ — VS Code IPC socket tracking"]
    subgraph filehist["file-history/&lt;sessionId&gt;/"]
      backup["&lt;sha256-hash&gt;@v&lt;N&gt; — Versioned backups"]
    end
    projects["projects/&lt;hash&gt;/ — Per-project global data"]
  end

  subgraph Local["&lt;project&gt;/.commandcode/ (Project-local root)"]
    l_settings["settings.json / settings.local.json"]
    l_agents_md["AGENTS.md"]
    l_skills["skills/ / agents/"]
    l_taste["taste/taste.md"]
    l_plans["plans/"]
    l_commands["commands/"]
    l_design["design/ — Design audit reports"]
  end
```

---

## Skills System

- Recognized filenames: `SKILL.md`, `skill.md`
- Skill name validation: lowercase alphanumeric + hyphens only
- Search order: cwd `.commandcode/skills/` -> cwd `.agents/skills/` -> gitroot `.commandcode/skills/` -> gitroot `.agents/skills/` -> `~/.commandcode/skills/` -> `~/.agents/skills/` -> bundled

---

## MCP (Model Context Protocol)

| Scope | Config Path |
|---|---|
| User | `~/.commandcode/mcp.json` |
| Project | `.mcp.json` |
| Local | `~/.commandcode/projects/<hash>/mcp.json` |

Protocol version: `2025-03-26`. Transports: stdio and HTTP. Tool naming: `mcp__<server>__<tool>`. MCP tools blocked in plan mode.

---

## Telemetry (OpenTelemetry to Axiom)

| Setting | Value |
|---|---|
| Endpoint | `https://api.axiom.co/v1/traces` |
| Dataset | `command_code_cli_tracing` |
| Prod token | `xaat-818bfed7-bc54-45bc-8bfa-d1198174064a` |
| Staging token | `xaat-fde9e569-4a3c-4994-aa0d-7a632332d220` |
| Local token | `xaat-add69148-8f73-4833-921d-bc843285c95f` |
| Opt-out | `DO_NOT_TRACK=1` or `{ "telemetry": false }` in config |

---

## Environment Variables

| Variable | Purpose |
|---|---|
| `COMMAND_CODE_API_KEY` | API key override |
| `COMMANDCODE_API_URL` | Override API base URL |
| `COMMANDCODE_SANDBOX` | Sandbox mode flag |
| `DO_NOT_TRACK` | Disable telemetry |
| `COMMANDCODE_SKIP_UPDATES` | Skip update checks |
| `CMD_ZDR` | Zero data retention mode |
| `CMD_LOG_REPAIRS` | Enable tool repair diagnostic logging |
| `OSS_PRIMARY_PROVIDER` | Override OSS model provider |
| `DEBUG` | Debug logging to `~/.commandcode/logs/command.log` |
| `NO_COLOR` | Disable colored terminal output |
| `EDITOR` / `VISUAL` | Editor preference |
| `CI` | CI environment detection |
| `HTTPS_PROXY` / `HTTP_PROXY` | Proxy configuration |

---

## VS Code Extension (VSIX)

Lightweight IPC bridge extension (578 lines CJS). Activates on startup, creates a Unix socket at `~/.commandcode/ide/`, exposes two IPC actions: `getContext` (workspace, active file, selection, open files) and `getDiagnostics` (LSP errors/warnings). Detects VS Code, Cursor, and Windsurf. Security: socket chmod 0600, max 16 connections, 60s idle timeout, 8MB buffer cap.

---

## Design Skill System (24 Reference Docs)

Full deep-dive: **[DESIGN-SKILLS.md](DESIGN-SKILLS.md)**

The `/design` skill is a complete AI design partner — 389-line orchestrator + 24 specialized reference docs (~4,300 lines total). It teaches the model how to think about color, typography, layout, motion, interaction, copy, and more, then edits real files (not mockups).

**16 tools in 5 groups:**

| Group | Tools |
|---|---|
| **Audit** | `checkup` (/60), `smell` (/10 inverted), `review` (/50) |
| **Systems** | `typeset`, `recolor`, `motion`, `interaction` |
| **Compose** | `relayout`, `responsive` |
| **Build** | `redesign`, `tokenize`, `setup`, `create` |
| **Ship** | `finish`, `refine`, `voice`, `surface` |

**Key architectural choices:**
- **7 work patterns** (monitor/operate/compare/configure/learn/decide/explore) — every tool starts by identifying the dominant pattern before any visual decision
- **Anti-AI smell system** — 10 tracked odors (tech gradient, feature tile grid, accent rail, unearned blur, center stack, etc.)
- **OKLCH color** with 4 commitment levels (whisper/statement/conversation/flood)
- **1-4-9 spacing rhythm** (4px micro, 16px component, 36px section)
- **Truthful completion** — model cannot claim work it didn't verify in the rendered output
- **Report continuity** — audit reports feed into action tools; findings become implementation priorities

See the dedicated document for the complete analysis with every reference doc cataloged.

---

## Error Handling and Retry

- **5 retries** with exponential backoff: 200ms x 2^attempt
- **Retries on:** network errors, 5xx, connection resets
- **Never retries:** insufficient credits, auth errors, user abort

---

## Security Features

- **Permission modes:** Standard, Auto-accept, Plan (read-only), Bypass
- **Trusted commands:** `ls`, `pwd`, `grep`, `tree`, `find`, `stat`, `git status/log/diff/branch`
- **Blocked `find` flags:** `-exec`, `-execdir`, `-delete`, `-fprint`
- **File backups:** versioned before every edit
- **Path traversal protection** in taste system
- **Auth files:** chmod 0600, dirs chmod 0700
- **Atomic writes:** `.tmp` + rename

---

## Tool-Input Repair System

Full deep-dive: **[TOOL-REPAIR.md](TOOL-REPAIR.md)**

The repair layer shipped **36,000+ repairs** in v0.28.0 and is the key infrastructure that made DeepSeek V4 Pro outperform Claude Opus 4.7 on internal evals. Six repair rules, markdown auto-link stripping, relational defaults, and validate-then-repair architecture. See the dedicated document for the complete analysis with decompiled code.

---

## Repository Structure

```mermaid
graph TD
  ROOT["command-code/"]

  ROOT --> INDEX["index.mjs — Full beautified bundle (70,494 lines)"]
  ROOT --> README["README.md — Full decompilation report"]
  ROOT --> TOOLREPAIR["TOOL-REPAIR.md — Tool repair deep-dive"]
  ROOT --> DESIGNSKILLS["DESIGN-SKILLS.md — Design skill deep-dive"]

  ROOT --> SOURCE["source/"]
  SOURCE --> MODELS["models/"]
  MODELS --> CATALOG["catalog.js — 23 model definitions + legacy aliases"]
  MODELS --> PRICING["pricing.js — Per-model pricing & plan limits"]
  SOURCE --> TR["tool-repair/"]
  TR --> REPAIR["repair-system.js — Validate-then-repair engine (6 rules)"]
  TR --> PREPARSE["pre-parse.js — JSON repair (control chars, truncation)"]
  TR --> READFILE["read-file-defaults.js — Semantic defaults"]
  SOURCE --> TOOLS["tools/"]
  TOOLS --> SELFKNOW["self-knowledge.js — Product docs, shortcuts, FAQs"]
  TOOLS --> SKILLLOAD["skill-loader.js — Skill discovery & resolution"]
  SOURCE --> AGENTS["agents/"]
  AGENTS --> BUILTIN["builtin-agents.js — Built-in agents (explore, plan)"]

  ROOT --> SKILLS["skills/"]
  SKILLS --> DESIGN["design/"]
  DESIGN --> SKILLMD["SKILL.md — 389-line orchestrator"]
  DESIGN --> REFS["references/ — 24 docs (~4,300 lines)"]
  SKILLS --> BROWSER["agent-browser/"]
  BROWSER --> BROWSERSKILL["SKILL.md — Browser automation"]

  ROOT --> VSIX["vsix-extension/"]
  VSIX --> EXT["extension.js — 578-line IPC bridge"]
  VSIX --> PKG["package.json — Extension manifest"]
  VSIX --> ICONS["icon.png, icons/"]
  VSIX --> DOCS["readme.md, changelog.md, LICENSE.txt"]
```

---

## Disclaimer

This decompilation is for **educational and research purposes only**. The `command-code` package is `UNLICENSED`. All trademarks belong to their respective owners. This repository documents publicly available npm package contents — no proprietary server-side code is included.