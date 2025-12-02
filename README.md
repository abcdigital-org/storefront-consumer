# Storefront Consumer Contracts

This repository hosts the Pact consumer tests for the Storefront service. The tests exercise the storefront orchestration code against Pact mock servers and produce contracts for the Catalog and Inventory providers.

## Local Development

```bash
npm install
npm test
```

Generated pact files are written to `pacts/`. When running in CI, copy these files into the contracts repository before opening a pull request.

## Contract Workflow

1. Run `npm test` to refresh the pact files.
2. Copy `pacts/*.json` into the matching provider directory inside the contracts repository (e.g. `catalog-service/`, `inventory-service/`).
3. Open a PR against the contracts repository.
4. Trigger provider verifications via repository dispatch events (see GitHub Action).

Refer to `.github/workflows/pact-consumer.yml` for the automated sequence.
