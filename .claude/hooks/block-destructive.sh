#!/bin/bash
# PreToolUse[Bash] — block destructive shell commands.
# Receives hook event JSON on stdin.
# Exit 0 = allow, Exit 1 = block.

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

if [[ -z "$CMD" ]]; then
  exit 0
fi

# Patterns that require human approval before running
DESTRUCTIVE_PATTERNS=(
  'rm[[:space:]]+-[[:alpha:]]*r[[:alpha:]]*f[[:space:]]*/[^/]'
  'rm[[:space:]]+-[[:alpha:]]*r[[:alpha:]]*f[[:space:]]*/[[:space:]]*$'
  'git[[:space:]]+reset[[:space:]]+--hard'
  'git[[:space:]]+clean[[:space:]]+-[[:alpha:]]*f'
  'DROP[[:space:]]+TABLE'
  'DROP[[:space:]]+DATABASE'
)

for pattern in "${DESTRUCTIVE_PATTERNS[@]}"; do
  if echo "$CMD" | grep -qiE "$pattern"; then
    echo "BLOCKED: destructive command requires human approval: $CMD" >&2
    exit 1
  fi
done

exit 0
