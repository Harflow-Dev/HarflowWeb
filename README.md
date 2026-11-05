# HarflowWeb

Exploratory mock-backed **new-task** frontend slice for review. Not production
Web, not a real engine connection, and not completion of migration gates W01–W05.

## Requirements

- Node.js 20+ (tested with 24)
- npm

## Install / dev / test / build

```bash
npm install
npm run dev          # http://localhost:5173/
npm run test
npm run check:architecture
npm run build
npm run verify       # architecture + test + build
```

Open `/preview` for deterministic mock scenario controls (separate from the main
composition). The main route shows one unobtrusive “Mock engine” indicator.

## Documentation

- [Architecture](docs/architecture.md)
- [Provenance](docs/provenance.md)
- [Mock scenarios](docs/mock-scenarios.md)
- [Visual validation](docs/visual-validation.md)
- [Review notes](docs/review-notes.md)
