#!/bin/bash
# Untrack BrainSync generated rules and memory files from Git cache

echo "Untracking BrainSync rules and memory files..."

git rm --cached .clinerules .cursorrules .windsurfrules AGENTS.md CLAUDE.md GEMINI.md
git rm --cached .cursor/rules/brainsync.mdc
git rm --cached .windsurf/rules/brainsync.md
git rm --cached .gemini/GEMINI.md
git rm --cached .gemini/antigravity/brain/brainsync.md
git rm --cached .kiro/steering/brainsync.md
git rm --cached .brainsync/generated-context.md
git rm --cached .brainsync/sync-state.json
git rm --cached .agent-mem/last-session.md

echo "Rules and memory files untracked successfully."
