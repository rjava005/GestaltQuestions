---
name: github-commit-message
description: Summarize current uncommitted git changes by running git diff, checking changed files, and reporting tracked plus untracked modifications clearly for commit prep or review.
---

# Git Working Tree Summary

Use this skill when the user asks for a summary of current local git changes, uncommitted diffs, or "what changed in this branch right now."

## Workflow

1. Run status and file-level overview first.
git status --short
git diff --name-only
git diff --stat
Capture tracked diffs by file.

git diff -- <file>
Repeat for each file from git diff --name-only.

Capture untracked files separately (they are not included in git diff).
Read them directly with sed -n '1,220p' <file> (or equivalent) if needed for summary.
Clearly label these as untracked/new files.
Produce a concise summary with:
What changed functionally (behavior, tests, refactors).
Which files were touched.
Tracked diff stats (git diff --stat).
Untracked files called out explicitly.
Output Format
Use this structure unless user asks otherwise:

Tracked changes (git diff) with per-file bullets
New untracked files with purpose bullets
Net stats from git diff --stat
Rules
Do not claim untracked file changes are in git diff.
Prefer concrete statements from patch content over assumptions.
Keep it concise and commit-message friendly.
If user asks for a commit summary, provide a polished one-paragraph or bullet version based on the same findings.