# CLAUDE.md

## Documentation index

Start at [docs/README.md](docs/README.md). It is the index of all project docs. Current spec: [docs/Developer-Infrastructure-Dashboard-SPEC.md](docs/Developer-Infrastructure-Dashboard-SPEC.md).

## Rules

### Keep the project organized
- Keep the repository root minimal: config files, `README.md`, `CLAUDE.md`, and top-level folders only.
- Put source code in a dedicated source folder, tests in a tests folder, and all documentation in `docs/`.
- Group files by purpose. Do not leave stray, temporary, or duplicate files in the repo.
- Use clear, consistent file and folder names.

### Keep docs organized
- All documentation lives in `docs/`.
- Every doc must be linked from `docs/README.md` with a one-line description.
- When adding, renaming, moving, or deleting a doc, update `docs/README.md` in the same change.

### Keep the repository up to date
- After every change, update everything it affects: docs, the docs index, the README, and this file if the rules or structure changed.
- Keep docs consistent with the code. If the spec and the code diverge, fix one so they match.
- Commit changes in small, focused commits with clear messages.

### Commits
- No AI attribution of any kind. Do not add `Co-Authored-By` trailers, "Generated with" lines, or any other trailers or tool mentions to commit messages, PR descriptions, code, or docs.
