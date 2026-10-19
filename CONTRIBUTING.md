# Contributing

This guide explains the contribution workflow of this project. For setting up the project locally, see the [README](README.md#quick-start).

## Workflow overview

1. Pick or create an issue, and assign it to yourself.
2. Create a branch from `dev`.
3. Make changes in small commits.
4. Open a pull request (PR) against `dev`.
5. Enable auto-merge on your PR. Once a reviewer approves and all checks pass, it merges automatically.

## Branches

- `dev` is the default branch. All work is merged here.
- `main` holds release-ready code. Only PR into `main` when the team agrees to release.
- Direct pushes to `dev` and `main` are not allowed. Both require a PR.
- Head branches are deleted automatically after merge.

Always branch from an up-to-date `dev`:

```bash
git checkout dev
git pull
git checkout -b feat/short-description
```

### Branch naming

Use `type/short-description`:

| Type    | Use for                                  |
| :------ | :--------------------------------------- |
| `feat`  | New functionality                        |
| `fix`   | Bug fixes                                |
| `chore` | Tooling, config, dependencies, scaffolding |
| `docs`  | Documentation only                       |
| `test`  | Adding or fixing tests                   |
| `refactor` | Code changes that don't alter behavior |

## Commits

Small, focused commits are prefered. Use `type: short-description`:

```
feat: add question list endpoint
fix: fix broken link
docs: update installation instructions
```

## Pull requests

- Target `dev`.
- Link the issue in the description (`Closes #12`) so it closes automatically on merge.
- Use the template below as a starting point and apply parts that are needed. The goal is that reviewers should be able to verify your work from the description alone.
- Don't commit secrets or `.env` files.
- Every PR needs **1 approval** from someone other than the author before merging.

### PR description template

```markdown
## Summary
Closes #<issue number>.

- What changed, as short bullet points

## Running commands
- Exact commands a reviewer can run to try it

## Validation checks / Testing
- [ ] What you checked and how

## Notes
- Additional information a reviewer should know
```

## Definition of Done

WIP

A task is done when all of these are true:

- [ ] The acceptance criteria in the issue are met
- [ ] Docs are updated if setup, commands or behavior changed (README, `.env.example`)
- [ ] The PR is approved and merged into `dev`, and the issue is closed

## Tests

WIP

## Database changes

- Edit `server/prisma/schema.prisma`, then create a migration:
  `pnpm --filter @x02/server exec prisma migrate dev --name short-description`
- Commit the generated migration files.
- Describe the changes in the PR.

## Environment variables

- Add new variables to `.env.example` with safe placeholder values.
- Never commit `.env`.