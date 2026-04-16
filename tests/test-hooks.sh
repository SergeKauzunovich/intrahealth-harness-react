#!/bin/bash
# Hook unit tests for the React harness hooks.
# Mirrors the Track A test structure, adapted for npm/TypeScript.

PASS=0
FAIL=0

expect_exit() {
  local label="$1"
  local expected="$2"
  local actual="$3"
  if [[ "$actual" -eq "$expected" ]]; then
    echo "  PASS: $label"
    ((PASS++))
  else
    echo "  FAIL: $label (expected exit $expected, got $actual)"
    ((FAIL++))
  fi
}

# ---------------------------------------------------------------------------
echo "=== validate-write-path.sh ==="

# 1. No worktree file → allow any path
INPUT='{"tool_input":{"file_path":"/some/random/path.ts"}}'
rm -f .claude/current-worktree
actual=$(echo "$INPUT" | bash .claude/hooks/validate-write-path.sh; echo $?)
expect_exit "no worktree: allow any path" 0 "$actual"

# 2. Inside worktree → allow
TMPDIR_VAL=$(mktemp -d)
echo "$TMPDIR_VAL" > .claude/current-worktree
INSIDE="${TMPDIR_VAL}/src/components/MyComp.tsx"
INPUT="{\"tool_input\":{\"file_path\":\"${INSIDE}\"}}"
actual=$(echo "$INPUT" | bash .claude/hooks/validate-write-path.sh; echo $?)
expect_exit "inside worktree: allow" 0 "$actual"

# 3. Outside worktree → block
OUTSIDE="/tmp/outside/file.ts"
INPUT="{\"tool_input\":{\"file_path\":\"${OUTSIDE}\"}}"
actual=$(echo "$INPUT" | bash .claude/hooks/validate-write-path.sh 2>/dev/null; echo $?)
expect_exit "outside worktree: block" 1 "$actual"

rm -f .claude/current-worktree
rmdir "$TMPDIR_VAL" 2>/dev/null || true

# ---------------------------------------------------------------------------
echo ""
echo "=== block-destructive.sh ==="

# 4. Allow: npm install
INPUT='{"tool_input":{"command":"npm install"}}'
actual=$(echo "$INPUT" | bash .claude/hooks/block-destructive.sh; echo $?)
expect_exit "allow: npm install" 0 "$actual"

# 5. Allow: git add
INPUT='{"tool_input":{"command":"git add -A"}}'
actual=$(echo "$INPUT" | bash .claude/hooks/block-destructive.sh; echo $?)
expect_exit "allow: git add" 0 "$actual"

# 6. Block: rm -rf /
INPUT='{"tool_input":{"command":"rm -rf /"}}'
actual=$(echo "$INPUT" | bash .claude/hooks/block-destructive.sh 2>/dev/null; echo $?)
expect_exit "block: rm -rf /" 1 "$actual"

# 7. Block: git reset --hard
INPUT='{"tool_input":{"command":"git reset --hard HEAD~1"}}'
actual=$(echo "$INPUT" | bash .claude/hooks/block-destructive.sh 2>/dev/null; echo $?)
expect_exit "block: git reset --hard" 1 "$actual"

# 8. Block: git clean -fdx
INPUT='{"tool_input":{"command":"git clean -fdx"}}'
actual=$(echo "$INPUT" | bash .claude/hooks/block-destructive.sh 2>/dev/null; echo $?)
expect_exit "block: git clean -fdx" 1 "$actual"

# 9. Block: DROP TABLE
INPUT='{"tool_input":{"command":"DROP TABLE users"}}'
actual=$(echo "$INPUT" | bash .claude/hooks/block-destructive.sh 2>/dev/null; echo $?)
expect_exit "block: DROP TABLE" 1 "$actual"

# ---------------------------------------------------------------------------
echo ""
echo "=== log-bash-output.sh ==="

# 10. npm build command writes JSONL entry
echo "1" > .claude/current-issue
INPUT='{"tool_input":{"command":"npm run build"},"tool_response":{"output":"vite build\nBuilt in 2.3s"}}'
echo "$INPUT" | bash .claude/hooks/log-bash-output.sh
if [[ -f "logs/issue-1.jsonl" ]] && grep -q '"stage":"gate"' logs/issue-1.jsonl; then
  echo "  PASS: npm build writes JSONL entry"
  ((PASS++))
else
  echo "  FAIL: npm build did not write JSONL entry"
  ((FAIL++))
fi

# 11. Non-npm command ignored
rm -f logs/issue-1.jsonl
INPUT='{"tool_input":{"command":"ls -la"},"tool_response":{"output":"total 8"}}'
echo "$INPUT" | bash .claude/hooks/log-bash-output.sh
if [[ ! -f "logs/issue-1.jsonl" ]]; then
  echo "  PASS: non-npm command ignored"
  ((PASS++))
else
  echo "  FAIL: non-npm command should not write JSONL"
  ((FAIL++))
fi

rm -f .claude/current-issue logs/issue-1.jsonl
rmdir logs 2>/dev/null || true

# ---------------------------------------------------------------------------
echo ""
echo "Results: $PASS passed, $FAIL failed"
[[ $FAIL -eq 0 ]]
