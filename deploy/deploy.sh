#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 || ! "$1" =~ ^[0-9a-f]{40}$ ]]; then
  echo "usage: $0 <40-character-git-sha>" >&2
  exit 64
fi

sha="$1"
repo="ghcr.io/consumer-choice-center/ccc-brand-mcp"
deploy_dir="/home/archive/ccc-brand-mcp/deploy"
env_file="$deploy_dir/.env"
last_good_file="$deploy_dir/LAST_GOOD_IMAGE"
lock_file="/tmp/ccc-brand-mcp-deploy.lock"
next_image="$repo:$sha"

exec 9>"$lock_file"
flock -n 9 || {
  echo "another CCC Brand MCP deployment is already running" >&2
  exit 75
}

previous_image=""
if [[ -f "$last_good_file" ]]; then
  previous_image="$(<"$last_good_file")"
fi

write_image() {
  local image="$1"
  local temporary
  temporary="$(mktemp "$deploy_dir/.env.XXXXXX")"
  printf 'CCC_BRAND_MCP_IMAGE=%s\n' "$image" > "$temporary"
  chmod 0640 "$temporary"
  mv "$temporary" "$env_file"
}

wait_healthy() {
  local attempt status
  for attempt in $(seq 1 30); do
    status="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' ccc-brand-mcp 2>/dev/null || true)"
    if [[ "$status" == "healthy" ]]; then
      return 0
    fi
    sleep 2
  done
  return 1
}

write_image "$next_image"
docker compose --project-directory "$deploy_dir" -f "$deploy_dir/docker-compose.yml" pull ccc-brand-mcp
docker compose --project-directory "$deploy_dir" -f "$deploy_dir/docker-compose.yml" up -d --no-build ccc-brand-mcp

if wait_healthy; then
  printf '%s\n' "$next_image" > "$last_good_file"
  echo "deployed $next_image"
  exit 0
fi

if [[ -n "$previous_image" ]]; then
  echo "health check failed; rolling back to $previous_image" >&2
  write_image "$previous_image"
  docker compose --project-directory "$deploy_dir" -f "$deploy_dir/docker-compose.yml" up -d --no-build ccc-brand-mcp
  wait_healthy || echo "rollback container did not become healthy" >&2
else
  echo "health check failed and no previous image is recorded" >&2
fi
exit 1
