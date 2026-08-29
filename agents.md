# AGENTS.md — OpenCode agent runtimes (for automation, not human devs)

**Purpose:** This file defines a small set of specialized agents formatted as runnable prompt templates for **OpenCode** (your automation runner). These agents will *implement, test, and document* the Anime Cave project. Treat each entry as a self-contained job spec: inputs, expected outputs, constraints, success criteria.

> Note: this is for OpenCode to run and produce files/commits. It is **not** for manual coding — OpenCode will execute the tasks.

---

## Global constraints (apply to every agent)
- Work locally in the repo root `anime-cave/`.
- Commit small, atomic changes to feature branches: `agent/<role>/<short-desc>`.
- Create PRs against `main` with descriptive titles and a checklist in the PR body.
- All files placed under `docs/`, `backend/`, or `frontend/` as appropriate.
- No external network exposure by default; bind services to `127.0.0.1`.
- If sensitive config is created, write it to `.env.example` and document required secrets in `docs/DEV_SETUP.md`.
- Tests must pass locally (unit or smoke); record results in `ci/results/*`.

---

## Agent list (role + prompt template + outputs)

### 1) OpenCode Orchestrator
**Role:** Coordinate runs of other agents, ensure ordering, collect artifacts, open PRs.  
**Template:**  
> "Run [AdapterDevAgent, BackendAgent, FrontendAgent, QAAgent] in sequence. For each, collect artifacts and commit to `agent/run/<timestamp>`. Create PR titled 'agent: full run <timestamp>' and include a summary table of files changed and test results."

**Outputs:** PR + run summary JSON in `ci/results/run-<ts>.json`.

---

### 2) AdapterDevAgent
**Role:** Implement or update one adapter (search/resolve/download) for a given source.  
**Template:**  
> "Implement adapter `<adapter_name>` under `backend/app/adapters/`. Follow adapter interface: search, resolve, download. Add unit tests that mock network. Commit to `agent/adapter/<adapter_name>`."

**Outputs:** `backend/app/adapters/<adapter_name>.py`, tests, docs snippet in `docs/ADAPTERS.md`.

---

### 3) BackendAgent
**Role:** Wire API endpoints, download manager hooks, VLC/aria2 bridge.  
**Template:**  
> "Add endpoints for `/api/search`, `/api/resolve`, `/api/download`, `/api/player/play`. Integrate adapter manager and download queue. Add worker tests and a basic Docker dev profile. Commit and run backend test suite."

**Outputs:** endpoints, worker files, config updates, test logs.

---

### 4) FrontendAgent
**Role:** Create UI components: search, filters, player button that calls `/api/player/play`, splash animation placeholder using Three.js stub.  
**Template:**  
> "Add React components under `frontend/src/` for SearchBar, Filters, PlayerButton, ThreeHero. Hook API client to backend endpoints. Add visual placeholders and update `frontend/README`."

**Outputs:** components, brief storybook-like snapshots, updated frontend README.

---

### 5) NetworkAgent
**Role:** Implement network/download tuning features (aria2c, concurrency controls, cache).  
**Template:**  
> "Add config knobs and download manager options: external_downloader, concurrency, per-host limits, retry/backoff. Persist defaults to `SAMPLE_CONFIG.json` and document in `docs/NETWORK.md`."

**Outputs:** config JSON, download manager changes, docs update.

---

### 6) QAAgent
**Role:** Run unit + smoke tests, validate docs completeness, generate `QA_REPORT.md`.  
**Template:**  
> "Run tests; check docs exist for each major file in `docs/` list. Produce `docs/QA_REPORT.md` with pass/fail and top 5 issues."

**Outputs:** `docs/QA_REPORT.md`, test artifacts in `ci/results/`.

---

### 7) DocsAgent
**Role:** Create or update all docs (one-shot mode). Use existing templates in `docs/`.  
**Template:**  
> "Generate the full set of docs listed in `docs/README_DOCS_INDEX.md`. Output files under `docs/` and include a small changelog entry."

**Outputs:** docs files (MD) and commit.

---

### 8) ReleaseAgent
**Role:** Create release notes, backup DB policy, and a packaged ZIP of docs.  
**Template:**  
> "Create `docs/RELEASE.md` with update/rollback steps. Export `anime-cave-docs.zip` into `artifacts/` and attach archive link in PR."

**Outputs:** `docs/RELEASE.md`, `artifacts/anime-cave-docs.zip`.

---

## Invocation conventions for OpenCode
- Provide agent with JSON context:
```text
{
  "agent": "<AgentName>",
  "branch_prefix": "agent",
  "task_id": "<short-id>",
  "inputs": { ... },
  "timeout_minutes": 20
}