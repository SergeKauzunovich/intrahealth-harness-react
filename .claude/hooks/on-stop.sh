#!/bin/bash
# Stop hook — append session-end marker to the issue's JSONL log.

ISSUE=$(cat .claude/current-issue 2>/dev/null || echo "unknown")
TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)
mkdir -p logs
printf '{"ts":"%s","stage":"stop","message":"Claude Code session ended"}\n' "$TS" \
  >> "logs/issue-${ISSUE}.jsonl"
exit 0
