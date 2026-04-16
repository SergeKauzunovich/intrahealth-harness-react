#!/bin/bash
# PreToolUse[Write] — block writes outside the current worktree.
# Receives hook event JSON on stdin.
# Exit 0 = allow, Exit 1 = block (Claude Code treats non-zero as blocked).

INPUT=$(cat)

FILE=$(echo "$INPUT" | python -c "
import json, sys
try:
    d = json.load(sys.stdin)
    ti = d.get('tool_input', d)
    print(ti.get('file_path') or ti.get('path') or '')
except Exception:
    print('')
" 2>/dev/null)

if [[ -z "$FILE" ]]; then
  exit 0  # no path found — allow
fi

WORKTREE_STATE=".claude/current-worktree"
if [[ ! -f "$WORKTREE_STATE" ]]; then
  exit 0  # no worktree configured — dev mode, allow all writes
fi

WORKTREE=$(cat "$WORKTREE_STATE" 2>/dev/null)
if [[ -z "$WORKTREE" ]]; then
  exit 0
fi

# Normalize to absolute paths
ABS_FILE=$(/usr/bin/realpath -m "$FILE" 2>/dev/null || echo "$FILE")
ABS_WORKTREE=$(/usr/bin/realpath -m "$WORKTREE" 2>/dev/null || echo "$WORKTREE")

if [[ "$ABS_FILE" == "$ABS_WORKTREE"* ]]; then
  exit 0  # inside worktree — allow
fi

echo "BLOCKED: write to '$FILE' is outside the current worktree ($WORKTREE)" >&2
exit 1
