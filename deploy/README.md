# Remote deployment

The CCC production endpoint is `https://mcp.consumerchoicecenter.org/mcp`. Caddy and the service communicate on the external `archivebox_default` Docker network; the MCP container does not publish a host port.

## Initial server bootstrap

1. Clone the repository to `/home/archive/ccc-brand-mcp`.
2. Build and start the local image:

   ```bash
   docker compose --project-directory deploy -f deploy/docker-compose.yml build
   docker compose --project-directory deploy -f deploy/docker-compose.yml up -d
   ```

3. Add the `mcp.consumerchoicecenter.org` site block to `/home/archive/archivebox/Caddyfile`, validate it, and reload Caddy.
4. Verify container health and `https://mcp.consumerchoicecenter.org/healthz` before registering either connector.

## GitHub Actions production environment

Create a protected GitHub environment named `production` and add:

- `DEPLOY_SSH_HOST`: `89.167.6.150`
- `DEPLOY_SSH_USER`: the dedicated restricted deployment account
- `DEPLOY_SSH_KEY`: its private Ed25519 key
- `DEPLOY_SSH_KNOWN_HOSTS`: the verified server host-key line, collected through an already trusted SSH session

The server-side public key must be restricted in `authorized_keys`:

```text
restrict,command="/home/archive/ccc-brand-mcp/deploy/ssh-deploy-command.sh" ssh-ed25519 AAAA... ccc-brand-mcp-deploy
```

The account must be able to run Docker and write only the files under `/home/archive/ccc-brand-mcp/deploy` required by `deploy.sh`. Docker group membership is effectively root-equivalent; retain the forced command and do not reuse this key for interactive access.

The `Deploy remote MCP` workflow runs only after the `CI` workflow succeeds on a push to `main`. It builds and publishes `ghcr.io/consumer-choice-center/ccc-brand-mcp:<commit-sha>`, then requests deployment of that exact SHA. Make the GHCR package public after its first publication so the server can pull without a registry token.

## Health and rollback

```bash
docker inspect --format '{{.State.Health.Status}}' ccc-brand-mcp
curl --fail --silent --show-error https://mcp.consumerchoicecenter.org/healthz
```

`deploy.sh` records the last healthy image in `deploy/LAST_GOOD_IMAGE` and automatically returns to it if the new container does not become healthy. To roll back manually, write the prior immutable image to `deploy/.env` as `CCC_BRAND_MCP_IMAGE=...` and recreate only the MCP service.
