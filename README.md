# ICP UserHub Template

A starter template for Internet Computer (ICP) apps with role-based access control (RBAC), Internet Identity authentication, and user profile management.

## Features

- **Motoko backend** with RBAC (admin/user/guest roles) and user profiles
- **React + TypeScript frontend** with Tailwind CSS and shadcn/ui components
- **Internet Identity** authentication (with dev bypass for local testing)
- **Docker dev container** using the official dfinity/icp-dev-env image
- **First user becomes admin** automatically; subsequent users get regular role
- **Admin dashboard** with user management (view all users, assign roles)

## Quick Start

### Option A: VS Code Dev Container (recommended)

1. Install [Docker](https://docs.docker.com/get-docker/) and the [Dev Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) VS Code extension
2. Open this folder in VS Code
3. Click "Reopen in Container" when prompted
4. Inside the container terminal:

```bash
dfx start --background
dfx deps pull && dfx deps deploy    # Internet Identity canister
dfx deploy                           # Backend + frontend canisters
npm run dev                          # Vite dev server on port 5173
```

### Option B: Local (requires dfx CLI + Node.js)

```bash
npm install
dfx start --background
dfx deps pull && dfx deps deploy
dfx deploy
cd src/frontend && npx vite
```

Open http://localhost:5173 in your browser.

## Dev Bypass (skip Internet Identity login)

For local development, set `DEV_BYPASS_II=1` in your `.env` file (or pass as env var to Vite) to auto-login with a deterministic identity:

```bash
# Append to .env after dfx deploy generates it
echo "DEV_BYPASS_II=1" >> .env
```

### Multi-user testing

Use the `dev_seed` URL parameter to create distinct test identities in parallel browser tabs:

| URL | Identity | Role |
|-----|----------|------|
| `http://localhost:5173` | Seed 0 (default) | Admin (first user) |
| `http://localhost:5173?dev_seed=1` | Seed 1 | User |
| `http://localhost:5173?dev_seed=2` | Seed 2 | User |

Each seed generates a unique principal. The first user to call the backend becomes admin.

## Project Structure

```
.devcontainer/devcontainer.json    # Docker dev container config
dfx.json                           # ICP canister definitions
package.json                       # Root workspace config
spec.md                            # Application specification
port-forward.py                    # WSL-to-Docker port forwarding utility
src/
  backend/
    main.mo                        # Motoko actor: RBAC + user profiles
    migration.mo                   # Schema migration utilities
    authorization/
      access-control.mo            # Role-based permission system
  frontend/
    index.html                     # HTML entry point
    vite.config.ts                 # Vite bundler config (import.meta.env)
    package.json                   # Frontend dependencies
    tsconfig.json                  # TypeScript config
    tailwind.config.js             # Tailwind CSS config
    src/
      main.tsx                     # React bootstrap + providers
      App.tsx                      # Auth flow + routing
      backend.ts                   # Candid type converters
      hooks/
        useInternetIdentity.tsx    # II auth + dev bypass
        useActor.ts                # Backend canister actor (singleton)
        useQueries.ts              # React Query hooks for all backend calls
      pages/
        Dashboard.tsx              # Admin/user dashboard with tabs
      components/
        Header.tsx, Footer.tsx     # Layout
        ProfileTab.tsx             # Profile view/edit
        ProfileSetupModal.tsx      # First-time profile creation
        UsersTab.tsx               # Admin user management
        LoadingScreen.tsx          # Loading state
        ui/                        # shadcn/ui component library
```

## Customization

- **Add backend functions**: Edit `src/backend/main.mo` and add corresponding hooks in `src/frontend/src/hooks/useQueries.ts`
- **Add pages/components**: Create in `src/frontend/src/pages/` or `src/frontend/src/components/`
- **Modify roles**: Edit `src/backend/authorization/access-control.mo` to change permission levels
- **Environment variables**: Vite exposes vars prefixed with `CANISTER_`, `DFX_`, or `DEV_` via `import.meta.env`

## Playwright MCP for Automated Testing & Development

This template is designed for an AI-assisted development workflow using [Claude Code](https://claude.ai/claude-code) with the [Playwright MCP](https://github.com/anthropics/mcp-playwright) server. Playwright MCP gives Claude Code direct browser control — it can navigate pages, fill forms, click buttons, take screenshots, and inspect console output, enabling fully autonomous testing and development cycles.

### Setup

Add the Playwright MCP server to Claude Code:

```bash
claude mcp add playwright npx playwright-mcp@latest
```

This registers Playwright as an MCP tool. Claude Code can then use `init-browser`, `get-screenshot`, `execute-code`, and other Playwright tools directly.

### Port Forwarding (Docker/WSL setup)

When running the dev container in Docker on WSL, the Vite dev server (port 5173) and dfx replica (port 4943) are inside the container and not directly accessible from the WSL host where Playwright runs. Use the included port forwarder:

```bash
# Find your container IP
docker inspect <container_id> | grep IPAddress

# Update CONTAINER_IP in port-forward.py if needed, then run:
python3 port-forward.py &
```

This forwards `localhost:5173` and `localhost:4943` from the WSL host to the Docker container, allowing Playwright to reach the app at `http://localhost:5173`.

If using VS Code Dev Containers with automatic port forwarding, or running dfx natively (not in Docker), you can skip this step.

### How It Works

With the dev server running and Playwright MCP configured, Claude Code can:

**Navigate and screenshot:**
```
# Claude Code uses these MCP tools automatically:
init-browser → open http://localhost:5173
get-screenshot → capture current page state
```

**Interact with the app:**
```javascript
// Claude Code runs Playwright code via execute-code tool:
async function run(page) {
  await page.fill('input[placeholder="Enter your name"]', 'Test User');
  await page.click('button:has-text("Create Profile")');
  await page.waitForTimeout(3000);
}
```

**Capture errors and console output:**
```javascript
async function run(page) {
  const errors = [];
  const logs = [];
  page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => errors.push(err.message));

  await page.goto('http://localhost:5173');
  await page.waitForTimeout(5000);

  return { errors, logs };
}
```

**Multi-user testing with parallel browser contexts:**
```javascript
async function run(page) {
  // Admin user (seed 0) is already on the current page
  const adminText = await page.textContent('body');

  // Create a second browser context for a different user
  const browser = page.context().browser();
  const newContext = await browser.newContext();
  const page2 = await newContext.newPage();

  // Navigate as a different user (seed 1 = non-admin)
  await page2.goto('http://localhost:5173?dev_seed=1');
  await page2.waitForTimeout(5000);

  const userText = await page2.textContent('body');
  return {
    adminHasUsersTab: adminText.includes('All Users'),
    userHasUsersTab: userText.includes('All Users'),  // should be false
  };
}
```

### Development Workflow

The typical Claude Code + Playwright workflow:

1. **Make code changes** — Claude Code edits source files
2. **Copy to container** — `docker cp` updated files into the running container (Vite HMR picks up changes automatically)
3. **Test with Playwright** — Navigate to the app, take screenshots, verify UI state, check for console errors
4. **Iterate** — If errors are found, fix and re-test without manual intervention
5. **Verify source transforms** — Fetch served source to confirm Vite is processing files correctly:
   ```javascript
   async function run(page) {
     const source = await page.evaluate(async () => {
       const r = await fetch('/src/hooks/useInternetIdentity.tsx');
       return await r.text();
     });
     return source.substring(0, 500);
   }
   ```

### Container Management

Claude Code can also manage the Docker container directly:

```bash
# Check container status
docker ps --filter name=icp

# Execute commands inside the container
docker exec <container_id> dfx deploy backend
docker exec <container_id> dfx canister install backend --mode reinstall  # reset state

# Restart Vite after config changes
docker exec <container_id> bash -c 'kill $(pgrep -f vite)'
docker exec -d <container_id> bash -c 'cd /workspaces/*/src/frontend && DEV_BYPASS_II=1 npx vite --host 0.0.0.0 --port 5173 > /tmp/vite.log 2>&1'

# Check Vite logs
docker exec <container_id> cat /tmp/vite.log
```

## Key Technical Details

- **Candid encoding**: Motoko `?Text` maps to TypeScript `[] | [string]` (not `string | undefined`). Use `toCandidProfile()`/`fromCandidProfile()` in `backend.ts` for conversion.
- **Vite env**: Uses `envPrefix` + `envDir` (not `process.env`). All source code uses `import.meta.env.X`.
- **Actor singleton**: `ActorProvider` in `useActor.ts` creates one shared HttpAgent/Actor instance via React context.
- **Init flow**: `useInitializeAccessControl()` registers the user in the RBAC system before any queries fire.
