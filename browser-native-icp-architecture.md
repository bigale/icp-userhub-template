# Browser-Native App Platform: Architecture & POC Roadmap
### The Zero-Server Stack: CheerpX + CheerpJ + WASM + ICP + Chrome Extension

---

## Core Thesis

Every application that currently requires a server can be decomposed into three things:
1. **Compute** — logic, processing, compilation
2. **State** — data persistence, history, sync
3. **Identity** — auth, access control, ownership

The browser now handles (1) natively via WebAssembly. ICP handles (2) and (3) via canisters and Internet Identity. A Chrome extension is the ideal host because it provides persistent local context, bypasses CORS/COOP/COEP header restrictions, and bridges the browser's compute layer with the ICP sync layer.

The result: **no backend servers required, ever.**

---

## The Recursive Loop

```
┌─────────────────────────────────────────────────────────────────┐
│                     CHROME EXTENSION                            │
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐  │
│  │  SOURCE CODE │───▶│   COMPILER   │───▶│  RUNNING APP     │  │
│  │  (in OPFS)   │    │ Clang/Cheerp │    │  (.wasm module)  │  │
│  │              │    │  (WASM)      │    │                  │  │
│  └──────┬───────┘    └──────────────┘    └───────┬──────────┘  │
│         │                                         │             │
│         ▼                                         ▼             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │               LOCAL STATE LAYER                          │  │
│  │   PGlite (PostgreSQL WASM) │ DuckDB WASM │ OPFS          │  │
│  └─────────────────────────────┬────────────────────────────┘  │
│                                 │                               │
└─────────────────────────────────┼───────────────────────────────┘
                                  │ sync
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                        ICP LAYER                                │
│                                                                 │
│   Internet Identity (auth)  │  Canisters (state/storage)       │
│   Chain Fusion (BTC/ETH)    │  vNFT-wrapped assets (AAV)       │
└─────────────────────────────────────────────────────────────────┘
```

**Write → Compile → Run → Persist → Sync** — entirely in-browser, ICP as the trust anchor.

---

## Technology Stack

| Layer | Technology | Status | Notes |
|---|---|---|---|
| x86 App Runtime | CheerpX | ✅ Production | Runs unmodified 32-bit Linux binaries |
| Java Runtime | CheerpJ | ✅ Production | Already proven in AAV |
| C/C++ Compiler | Clang → WASM (via Wasmer/Emscripten) | ✅ Proven | ~100MB, OPFS-cached after first load |
| C++ → WASM Compiler | Cheerp | ✅ Production | LLVM-based, outputs optimized WASM |
| PostgreSQL | PGlite | ✅ Production | 3MB gzip, IndexedDB/OPFS persistence |
| Analytics DB | DuckDB WASM | ✅ Production | Columnar, reads Parquet from ICP |
| SQLite | wa-sqlite + OPFS | ✅ Production | Best for small embedded use cases |
| Git Client | isomorphic-git | ✅ Production | Full git protocol in browser |
| Local Filesystem | OPFS (Origin Private File System) | ✅ Chrome 102+ | Synchronous, fast, persistent |
| State Sync | ICP Canisters | ✅ Production | Stable memory as blob/structured store |
| Auth | Internet Identity | ✅ Production | WebAuthn-based, no passwords |
| Asset Ownership | AAV vNFT model | 🔧 AAV | NFT-wrapped data/code assets |
| Extension Host | Chrome Extension (MV3) | ✅ Production | Side panel, offscreen docs, service worker |
| BTC/ETH Settlement | ICP Chain Fusion | ✅ Production | Threshold signatures, no bridges |

---

## Chrome Extension Architecture

The extension is the ideal host for three reasons:

1. **SharedArrayBuffer available by default** — Chrome extensions run with `COOP/COEP` headers pre-satisfied, which CheerpX requires and which normal web pages struggle to configure
2. **Persistent local context** — service worker + OPFS means state survives tab closes; the "app" is always there
3. **No CORS friction** — extensions can call ICP canister endpoints directly without server-side proxy

### Extension Structure

```
chrome-extension/
├── manifest.json              # MV3, side_panel, offscreen permissions
├── service-worker.js          # ICP sync, background canister polling
├── side-panel/
│   ├── index.html             # Main UI (React/Svelte)
│   ├── cheerpx-loader.js      # CheerpX VM init + app boot
│   ├── compiler.js            # Clang/Cheerp WASM wrapper
│   └── icp-client.js          # @dfinity/agent canister calls
├── offscreen/
│   └── db-worker.js           # PGlite / DuckDB in offscreen doc
└── shared/
    ├── git-client.js          # isomorphic-git + ICP remote
    └── opfs-manager.js        # OPFS read/write abstraction
```

### Communication Model

```
Side Panel UI
    │  postMessage / chrome.runtime.sendMessage
    ▼
Service Worker
    ├── ICP sync (on commit / on interval)
    ├── isomorphic-git pull/push to canister
    └── Internet Identity session management
    
Offscreen Document (persistent, hidden)
    ├── PGlite instance (always-on Postgres)
    ├── DuckDB WASM instance (analytics queries)
    └── CheerpX VM (running app binary)
```

---

## ICP Canister Design

### Core Canister Interface (Rust)

```rust
// Minimal canister for blob + structured sync
#[update]
fn push_blob(key: String, data: Vec<u8>) -> Result<BlobRef, String>

#[query]  
fn fetch_blob(key: String) -> Option<Vec<u8>>

#[update]
fn push_git_pack(repo_id: String, pack_data: Vec<u8>) -> Result<(), String>

#[query]
fn git_info_refs(repo_id: String) -> Vec<u8>  // git HTTP smart protocol

#[update]
fn sync_db_snapshot(app_id: String, snapshot: Vec<u8>) -> Result<u64, String>

#[query]
fn get_db_snapshot(app_id: String) -> Option<(Vec<u8>, u64)>  // (data, timestamp)
```

### Sync Strategy

| Scenario | Strategy |
|---|---|
| Small app state (<5MB) | Full snapshot on each save |
| Large DB (>5MB) | Delta sync using content-addressed chunks |
| Git repos | Git pack protocol — only changed objects |
| Real-time collab | Canister as event log, clients replay |

---

## POC #1 — Decentralized Git + Build

**Goal:** Clone a C++ repo from ICP, compile in-browser, run the output.

**Minimal Viable Scope:**
- isomorphic-git configured with ICP canister as HTTP remote
- Clang WASM (pre-cached in OPFS) compiles a small C++ file
- Output .wasm module runs in the same side panel
- Commit changes back to ICP canister

**Key Files to Write:**
1. `icp-git-remote.js` — implements git HTTP smart protocol over ICP canister calls (~300 lines)
2. `compiler-worker.js` — wraps Clang WASM, exposes `compile(source) → wasm_bytes` (~150 lines)
3. `canister/src/lib.rs` — git pack storage + blob API (~200 lines Rust)

**Success Criteria:** `git clone → edit → compile → run → git push` with zero server involvement

---

## POC #2 — Python App + PGlite + ICP Sync

**Goal:** Run a Python data processing script in-browser against a Postgres database, sync DB state to ICP.

**Stack:**
- CheerpX boots a minimal Alpine Linux image with Python 3.11
- PGlite as the database (Python connects via in-process socket shim)
- On save: PGlite OPFS file serialized → pushed to ICP canister
- On load: fetch canister snapshot → hydrate PGlite → mount in CheerpX

**Use Case Target:** A self-contained EDI/HL7 processing tool (direct AAV relevance) — drag in an X12 file, Python grammar processor runs client-side, de-identified output stored on ICP as vNFT.

**Success Criteria:** PHI never touches a server. Processing happens entirely in browser. ICP holds the audit trail.

---

## POC #3 — Browser-Native Crypto Node

**Goal:** Run a lightweight blockchain node (Bitcoin SPV or ICP-native) in-browser with Chain Fusion settlement.

**Stack:**
- bcoin or Knuth JS-WASM for chain validation
- ICP Chain Fusion as settlement layer (no Bitcoin P2P TCP proxy needed)
- Internet Identity as wallet key manager
- DuckDB WASM for transaction analytics

**Why Chrome Extension:** Persistent service worker keeps node synced in background even when side panel is closed. No "always-on server" needed — the browser IS the node.

**Success Criteria:** Sign and verify a Bitcoin transaction entirely in-browser, settled via ICP Chain Fusion, no external server or wallet app.

---

## Use Cases by Vertical

### 🔵 Developer Tools
| App | Server Eliminated | ICP Role |
|---|---|---|
| C/C++ IDE (Clang WASM) | Build server, CI/CD | Source repo, build artifacts |
| Python Notebook (CheerpX) | Jupyter server | Notebook persistence, reproducibility |
| Decentralized Git | GitHub, GitLab | Repo storage, git wire protocol |
| GitForAI semantic memory | Memory server | AI context as canister-resident index |

### 🔵 Healthcare / Compliance
| App | Server Eliminated | ICP Role |
|---|---|---|
| HL7/EDI Processor (AAV iXML) | Integration engine server | De-identified output, audit trail |
| NIST HL7 Validator (CheerpJ) | Validation service | Validation reports as NFT-wrapped assets |
| PHI Redaction Pipeline | Cloud NLP service | Redacted records, BAA-free architecture |

### 🔵 Crypto / Finance
| App | Server Eliminated | ICP Role |
|---|---|---|
| BTC SPV Node (bcoin WASM) | Node hosting server | Chain Fusion settlement |
| Algo Trading Backtester | Cloud compute | Strategy NFTs, performance records |
| DeFi Analytics (DuckDB WASM) | Analytics API | Query results, portfolio state |
| Zorro Plugin Browser Port | Broker API proxy | Trade log immutability |

### 🔵 Media / Content
| App | Server Eliminated | ICP Role |
|---|---|---|
| FFmpeg Transcoder (WASM) | Encoding server (Cloudinary etc.) | Content-addressed media blobs |
| AI Inference (WebGPU) | API inference server | Model weights as vNFT assets |
| Decentralized CMS | Web server, DB server | Content canisters, identity-gated access |

### 🔵 Data / Analytics
| App | Server Eliminated | ICP Role |
|---|---|---|
| DuckDB WASM Query Engine | Data warehouse | Parquet blobs as canister assets |
| PGlite App Backend | DB server | DB snapshots, multi-device sync |
| Offline-first ERPNext subset | ERP server, DB server | Business records, sync on reconnect |

---

## POC Prioritization

| POC | Effort | Impact | Recommended Order |
|---|---|---|---|
| Decentralized Git (isomorphic-git + ICP) | Low | High | **1st — proves the loop** |
| Python + PGlite + ICP sync (AAV EDI) | Medium | Extreme | **2nd — AAV direct value** |
| Clang WASM compile-in-browser | Medium | High | **3rd — unlocks all C++ apps** |
| Crypto node + Chain Fusion | High | High | 4th |
| Full CheerpX app (larger Python app) | High | Medium | 5th |

---

## Immediate Next Steps

1. **Stand up ICP canister** with git pack + blob API (reuse AAV canister patterns)
2. **Wire isomorphic-git** to use canister as HTTP remote — this is the foundational primitive everything else builds on
3. **OPFS manager** — a shared abstraction for reading/writing local files that both CheerpX and PGlite can use
4. **CheerpX Python POC** — boot Alpine + Python in side panel, connect to PGlite via socket shim
5. **AAV EDI integration** — drop an X12 file into the extension, process with iXML grammar, push de-identified result to ICP canister as vNFT

---

## Key Insight

> The Chrome extension is not a "thin client." It is the application server, the database server, the build server, and the wallet — all running on the user's hardware, with ICP as the tamper-proof persistence and settlement layer. The user owns the compute. The user owns the data. There is no infrastructure bill.

This is the inversion of cloud computing: instead of renting compute and trusting someone else's servers with your data, the user's device IS the server — and ICP makes that device's state portable, persistent, and verifiable across any other device they own.

---

*Document version: 1.0 — March 2026*
*Stack: CheerpX · CheerpJ · Cheerp · Clang WASM · PGlite · DuckDB WASM · isomorphic-git · ICP · Internet Identity · AAV vNFT*
