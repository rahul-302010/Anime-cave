# RELEASE

> Update, rollback, and backup DB policy for Anime Cave. Local-first releases — simple, reversible, no surprises.

## Purpose
Give any contributor a safe upgrade path for the local app, including data protection for `anime_cave.db`.

## Versioning
- SemVer `MAJOR.MINOR.PATCH`. Tag `vX.Y.Z` on `main`. Changelog in `CHANGELOG.md`.
- Release artifacts: git tag + `artifacts/anime-cave-docs.zip` (docs) + optional app zip.

## Update Steps
1. **Pre-check:** `git status` clean, backend/frontend tests pass, `docs/QA_REPORT.md` green.
2. **Backup DB:** `copy anime_cave.db anime_cave.db.bak` (or `cp` on macOS). Also backup `cache/` if large? No — cache is regenerable.
3. **Pull:** `git fetch && git checkout main && git pull`
4. **Migrate:** run `python backend/app/migrate.py` if present; otherwise schema is additive (WAL, new cols default null).
5. **Deps:** `pip install -r backend/requirements.txt` + `cd frontend && npm install && npm run build`
6. **Verify:** `uvicorn app.main:app --host 127.0.0.1 --port 8000` + `npm run preview` ? smoke search/play.
7. **Tag (maintainer):** `git tag vX.Y.Z && git push origin vX.Y.Z`

## Rollback Steps
1. Stop services.
2. Restore DB: `copy anime_cave.db.bak anime_cave.db` (keep current as `.failed` for inspection).
3. Checkout previous tag: `git checkout vX.Y.(Z-1)`
4. Reinstall deps at that tag, restart, verify.
5. File issue with `ci/results/` logs.

## Backup Policy
- **DB:** SQLite `anime_cave.db` — auto-copy to `backups/anime_cave-YYYY-MM-DD.db` on every successful update; keep last 5. User can manually copy anywhere.
- **Retention:** 5 backups max, oldest pruned. Cache never backed up.
- **Location:** `./backups/` (gitignored) + user-chosen path via `DB_BACKUP_DIR` env.
- **Restore:** doc steps above; no tooling required beyond file copy.

## Checklist
- [ ] DB backed up before migrate
- [ ] Smoke tests pass post-update
- [ ] Rollback restores DB and tag
- [ ] Backups pruned to 5
