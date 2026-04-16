#!/bin/bash
# PostToolUse[Edit] — run prettier on .ts/.tsx files after each edit.
# Silently no-ops on non-TypeScript files or if prettier is unavailable.

INPUT=$(cat)

FILE=$(echo "$INPUT" | python -c "
import json, sys
try:
    d = json.load(sys.stdin)
    ti = d.get('tool_input', d)
    print(ti.get('file_path') or '')
except Exception:
    print('')
" 2>/dev/null)

if [[ "$FILE" != *.ts && "$FILE" != *.tsx ]]; then
  exit 0
fi

# Walk up from the file's directory looking for package.json (max 6 levels)
ABS_FILE=$(/usr/bin/realpath -m "$FILE" 2>/dev/null || echo "$FILE")
DIR=$(dirname "$ABS_FILE")
DEPTH=0
while [[ "$DIR" != "/" && $DEPTH -lt 6 ]]; do
  if [[ -f "$DIR/package.json" ]]; then
    npx prettier --write "$ABS_FILE" --log-level silent 2>/dev/null || true
    break
  fi
  DIR=$(dirname "$DIR")
  ((DEPTH++))
done

exit 0
