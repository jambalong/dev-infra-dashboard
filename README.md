# Developer Infrastructure Dashboard

A static dashboard that tracks personal projects, hosting providers, databases, integrations and infrastructure costs. Plain HTML, CSS and JavaScript. Inventory data lives in JSON files. Hosted on GitHub Pages at [infra.ambalong.dev](https://infra.ambalong.dev). No backend, no build step, no dependencies.

- **Overview**: summary cards, project status, provider distribution, known costs.
- **Projects**: project cards and detail pages, with search and status/type filters.
- **Providers**: provider directory with plan, cost and the projects that use each one.
- **Costs**: monthly/annual breakdown. Unknown costs are shown separately and are never counted as zero.

Dark, light and system themes. The sidebar collapses to a menu on mobile.

## Run locally

Requires Node.js 18+ (used only for the helper scripts).

```sh
node scripts/serve.mjs                          # http://localhost:8080/
node scripts/serve.mjs --base /dev-infra-dashboard/   # mimic the GitHub Pages subpath
npm test                                        # validate data + run tests
```

Opening `index.html` directly from disk will not work, because browsers block `fetch` and ES modules on `file://`.

## Project layout

```text
index.html            app shell
assets/css/           styles
assets/js/            app.js (routing, theme), data.js, costs.js, views/
data/                 projects.json, providers.json
scripts/              validate-data.mjs, serve.mjs
tests/                node:test suites
docs/                 documentation (start at docs/README.md)
.github/workflows/    deploy.yml
```

## Documentation

See [docs/README.md](docs/README.md). To change the inventory or deploy, read [docs/MAINTAINING.md](docs/MAINTAINING.md).

## Public by design

The deployed site is public. Keep only non-sensitive information in `data/`. `npm test` rejects obvious secrets such as connection strings, tokens and IP addresses.
