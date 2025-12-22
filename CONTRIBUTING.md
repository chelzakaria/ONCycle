# Contributing to ONCycle

Thanks for taking the time to help improve ONCycle! This guide explains how to propose changes, report issues, and collaborate effectively.

## Quick start (absolute beginners)
- Install Python 3.10+ and Node.js 18+.
- Clone the repo, then in the project root run: `python -m venv env && env\Scripts\activate && python -m pip install -r requirements.txt`.
- For the API, run: `uvicorn app.main:app --reload` and visit http://127.0.0.1:8000/docs.
- For the UI, from `ui/client` run: `npm install` then `npm run dev`; open the shown localhost URL.
- Make one small change, commit, and open a PR that explains what changed and how to test it.

## Ways to contribute
- Report bugs or data issues with clear reproduction steps and screenshots/logs when possible.
- Propose or build new features (UI, API, modeling, tooling) via issues and pull requests.
- Improve docs, examples, and developer experience (DX).
- Optimize performance or reliability (frontend, backend, model serving, data pipelines).

## Before you start
- By contributing you agree your work will be licensed under the project MIT License (see LICENSE).
- Follow respectful, inclusive communication. If unsure, default to the standard Contributor Covenant guidelines.
- Avoid committing secrets, private data, or large binaries; prefer environment variables and small, versioned artifacts.

## Development setup
- Backend: Python 3.10+ with FastAPI. Install dependencies with `python -m pip install -r requirements.txt` (or `app/requirements.txt` if working only on the API).
- Frontend: Node.js 18+ with Vite/React. Install dependencies from `ui/client` with `npm install` (or `pnpm install`) and run `npm run dev`.
- Experiments: Keep notebooks and data artifacts in `experiments/` and avoid pushing large raw datasets.
- Use virtual environments (`python -m venv env` then `env\Scripts\activate` on Windows) to keep dependencies isolated.

## Workflow
1) Open or comment on an issue describing the problem or proposal. If none exists, create one first for visibility.
2) Fork or branch from `main`: use names like `feature/short-summary` or `fix/short-summary`.
3) Make focused commits with clear messages; keep PRs scoped and small when possible.
4) Add or update tests/docs relevant to your change.
5) Run checks before submitting:
   - Backend: run existing tests or at least `python -m pytest` if available; manual smoke-test the FastAPI app via `uvicorn app.main:app --reload`.
   - Frontend: `npm run lint` and `npm run test` if available; otherwise manually verify key flows in the browser.
6) Submit a pull request that explains the change, risks, and how to test; include screenshots for UI changes.

## Coding guidelines
- Python: follow PEP 8 style; prefer type hints and meaningful logging; keep functions small and focused.
- JavaScript/TypeScript: follow existing lint rules; prefer functional, composable components and typed props.
- Tests: add regression tests when fixing bugs and cover new paths for new features; keep fixtures small and deterministic.
- Docs: update README sections and inline comments when behavior changes.

## Review expectations
- Be responsive to feedback and keep discussions in the PR thread.
- If you cannot continue a PR, leave notes on remaining work so others can pick it up.
- After approval and checks pass, maintainers will merge; avoid force pushes after reviews unless requested.

## Community Exchange readiness
A clear CONTRIBUTING.md is required for Community Exchange submissions. Ensure your PR descriptions remain student-friendly, highlight learning outcomes, and link to any demo or notebook updates that showcase what you built.
