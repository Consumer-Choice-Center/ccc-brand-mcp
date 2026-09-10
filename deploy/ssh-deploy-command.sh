#!/usr/bin/env bash
set -euo pipefail

if [[ "${SSH_ORIGINAL_COMMAND:-}" =~ ^deploy\ ([0-9a-f]{40})$ ]]; then
  exec /home/archive/ccc-brand-mcp/deploy/deploy.sh "${BASH_REMATCH[1]}"
fi

echo "only 'deploy <40-character-git-sha>' is permitted" >&2
exit 64
