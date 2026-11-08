#!/usr/bin/env bash
set -euo pipefail

NAME="golfgps sunday post"
REPO="/Users/ivkin/my/sundaystroke-site"
FACTORY="/Users/ivkin/my/factory-runtime"
TRIGGER="30 8,15 * * *"
PROMPT="You are the weekly Sunday post run for sundaystroke.com. This is an unattended run. Read automation/sunday-post.md in this worktree and follow it exactly."

[ -d "$REPO/.git" ] || { echo "no sundaystroke-site checkout at $REPO" >&2; exit 1; }
[ -d "$FACTORY" ] || { echo "no factory runtime at $FACTORY" >&2; exit 1; }

orca repo list | grep -q "  $REPO\$" || orca repo add --path "$REPO"

ARGS=(
  --trigger "$TRIGGER"
  --timezone Europe/Madrid
  --prompt "$PROMPT"
  --provider claude
  "--extra-agent-args=--model opus"
  --precheck "uv run --frozen --project $FACTORY factory running golfgps"
  --repo "path:$REPO"
  --workspace-mode new-per-run
  --base-branch origin/main
  --enabled
)

EXISTING="$(orca automations list --json | python3 -c 'import json,sys; name=sys.argv[1]; items=json.load(sys.stdin)["result"]["automations"]; print(next((a["id"] for a in items if a["name"]==name), ""))' "$NAME")"

if [ -n "$EXISTING" ]; then
  orca automations edit "$EXISTING" "${ARGS[@]}"
else
  orca automations create --name "$NAME" "${ARGS[@]}"
fi
