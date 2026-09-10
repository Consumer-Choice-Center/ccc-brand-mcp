# Remote deployment

The CCC production endpoint is `https://mcp.consumerchoicecenter.org/mcp`. Caddy and the service communicate on the external `archivebox_default` Docker network; the MCP container does not publish a host port.

Deployment is manual and local to the server. GitHub is not given any access to the server, and no workflow deploys to it automatically — GitHub only runs CI (build, typecheck, test, smoke, audit) on push.

## Initial server bootstrap

1. Clone the repository to `/home/archive/ccc-brand-mcp`.
2. Build and start the image:

   ```bash
   docker compose --project-directory deploy -f deploy/docker-compose.yml build
   docker compose --project-directory deploy -f deploy/docker-compose.yml up -d
   ```

3. Add the `mcp.consumerchoicecenter.org` site block to `/home/archive/archivebox/Caddyfile`, validate it, and reload Caddy.
4. Verify container health and `https://mcp.consumerchoicecenter.org/healthz` before registering either connector.

## Redeploying an update

On the server, in `/home/archive/ccc-brand-mcp`:

```bash
git pull
docker compose --project-directory deploy -f deploy/docker-compose.yml build
docker compose --project-directory deploy -f deploy/docker-compose.yml up -d
```

Check health before considering the deploy done:

```bash
docker inspect --format '{{.State.Health.Status}}' ccc-brand-mcp
curl --fail --silent --show-error https://mcp.consumerchoicecenter.org/healthz
```

## Rollback

Docker keeps the previous image cached under `<none>` after a rebuild. To roll back, find its image ID and recreate the container from it directly:

```bash
docker images ccc-brand-mcp
docker tag <previous-image-id> ccc-brand-mcp:local
docker compose --project-directory deploy -f deploy/docker-compose.yml up -d --no-build
```

Alternatively, `git checkout <previous-commit>` before rebuilding.
