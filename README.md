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

## Key Technical Details

- **Candid encoding**: Motoko `?Text` maps to TypeScript `[] | [string]` (not `string | undefined`). Use `toCandidProfile()`/`fromCandidProfile()` in `backend.ts` for conversion.
- **Vite env**: Uses `envPrefix` + `envDir` (not `process.env`). All source code uses `import.meta.env.X`.
- **Actor singleton**: `ActorProvider` in `useActor.ts` creates one shared HttpAgent/Actor instance via React context.
- **Init flow**: `useInitializeAccessControl()` registers the user in the RBAC system before any queries fire.
