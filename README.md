# EvidenceShield MVP

Real-time, browser-only prototype for tamper-evident digital evidence management. Files stay local, while their cryptographic fingerprints, Merkle tree aggregation, simulated zero-knowledge attestations, and Polygon transparency feed are generated instantly for every upload batch.

## Getting Started

```bash
npm install
npm run dev
```

Visit `http://localhost:5173`, sign in with any email/password (no backend involved), and begin uploading evidence. All state lives in memory only – refreshing the page clears the workspace to mimic a secure stateless client.

### Additional scripts

| Command                | Purpose                                                |
| ---------------------- | ------------------------------------------------------ |
| `npm run build`        | Production build via Vite                              |
| `npm run preview`      | Preview the production bundle locally                  |
| `npm run lint`         | ESLint (flat config) over `src/**/*.jsx`               |
| `npm run deploy`       | Build + publish `dist/` to the `gh-pages` branch       |
| `npm run deploy:clean` | Clear the cached `gh-pages` workspace before deploying |

## Architecture Overview

- **Frontend only (React + Vite)** – No backend services; everything runs in the browser.
- **Session guard** – Lightweight in-memory auth context that unlocks the console after a local-only email/password submission, plus a mock reset password flow.
- **Evidence pipeline**:
  1. Client-side SHA-256 hashing with the Web Crypto API.
  2. Merkle tree creation (supports multi-file batches) with proofs stored alongside each leaf.
  3. IPFS CID generation via `multiformats/raw` to mimic pinning while keeping files local.
  4. Simulated Polygon transaction hash + ZKP proof ID per batch for transparency.
- **State management** uses a lightweight React context (`EvidenceProvider`). Data resets on refresh by design.

## Key UI Surfaces

- **Dashboard** – Upload evidence, inspect generated hashes/roots, and view session-wide stats.
- **Tamper Detection Panel** – Re-verify any stored item by re-uploading it; hash/merkle mismatches are highlighted instantly.
- **PolygonScan Transparency** – Dedicated route presenting Polygon-style transaction rows that reference Merkle roots and proof identifiers for public auditability.

## Extending the MVP

- Plug in real IPFS pinning (e.g., via Pinata, web3.storage) where `createIpfsCid` currently runs locally.
- Replace the Polygon hash stub with an on-chain anchoring service or smart contract call.
- Swap the synthetic ZKP proof generator with a true verifier (e.g., snarkjs or zk-SNARK service).
- Persist session data through IndexedDB or a backend API once ready for integration tests.

## GitHub Pages Hosting

The project is pre-configured for GitHub Pages at `https://<your-user>.github.io/BLOCKCHAIN-EVIDENCE/`:

- Vite’s `base` path is set to `/BLOCKCHAIN-EVIDENCE/` and routing uses `HashRouter`, so assets and deep links resolve correctly.
- Running `npm run deploy` builds the site and pushes the `dist/` output to the `gh-pages` branch via `gh-pages`. The deploy script uses `--add` to avoid Windows command-length limits; run `npm run deploy:clean` first whenever you want to wipe the cached workspace.
- Enable GitHub Pages in the repo settings, point it at `gh-pages`, and the site will update each time you run the deploy script.
