#!/bin/bash
# PostToolUse[Bash] — log npm quality-gate commands to append-only JSONL.
# Receives hook event JSON on stdin.

INPUT=$(cat)

CMD=$(echo "$INPUT" | python -c "
import json, sys
try:
    d = json.load(sys.stdin)
    ti = d.get('tool_input', d)
    print(ti.get('command') or '')
except Exception:
    print('')
" 2>/dev/null)

# Only log npm quality-gate commands
if ! echo "$CMD" | grep -qE 'npm[[:space:]]+(build|test|run)'; then
  exit 0
fi

ISSUE_FILE=".claude/current-issue"
ISSUE=$(cat "$ISSUE_FILE" 2>/dev/null || echo "unknown")

# Infer pass/fail from output text (Claude Code bash response is plain text)
OUTPUT=$(echo "$INPUT" | python -c "
import json, sys
try:
    d = json.load(sys.stdin)
    tr = d.get('tool_response', {})
    if isinstance(tr, str):
        print(tr)
    else:
        print(tr.get('output', '') or tr.get('stdout', ''))
except Exception:
    print('')
" 2>/dev/null)

if echo "$OUTPUT" | grep -qiE 'passed|passing|✓|All tests passed|no ESLint errors|Built in|vite build'; then
  EXIT_CODE=0
else
  EXIT_CODE=1
fi

TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)
LOG_FILE="logs/issue-${ISSUE}.jsonl"
mkdir -p logs

# Truncate and escape command for JSON safety
SAFE_CMD=$(echo "$CMD" | head -c 120 | python -c "import sys; print(sys.stdin.read().rstrip().replace('\\\\','\\\\\\\\').replace('\"','\\\\\"'))")

printf '{"ts":"%s","stage":"gate","cmd":"%s","exit_code":%d}\n' \
  "$TS" "$SAFE_CMD" "$EXIT_CODE" \
  >> "$LOG_FILE"

exit 0
