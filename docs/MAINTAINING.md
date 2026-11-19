# Maintaining the Dashboard

## Update the inventory

All content comes from three files in `data/`. No code changes are needed. After editing, run `npm test` (validates references and values, then runs unit tests).

### Providers: `data/providers.json`

```json
{
  "id": "render",
  "name": "Render",
  "category": "application-hosting",
  "website": "https://render.com",
  "plan": "Free",
  "cost": { "amount": 0, "currency": "USD", "billing": "monthly" },
  "freeTier": "Short description of the limits",
  "notes": []
}
```

- `id`: stable, lowercase-kebab-case. Other files refer to it, so do not rename it casually.
- `category`: `application-hosting`, `database-hosting`, `static-hosting`, `mobile-development`, `email-newsletters`, `source-control`, `monitoring` or `domain-dns`.
- `plan`, `freeTier`: `null` when unverified.
- **Cost semantics:**
  - `"amount": null` means **unknown**. This is the default, and it is never counted as zero.
  - `"amount": 0` means **free**.
  - `"amount": 12` with `"billing": "monthly"` or `"annual"` means **paid**. Annual amounts are converted to monthly equivalents.
  - A paid amount requires `billing`. Use one currency across all providers.
- Which projects use a provider is derived from `projects.json`, so it is not listed here.

### Projects: `data/projects.json`

```json
{
  "id": "lunrfast",
  "name": "LunrFast",
  "description": "…",
  "status": "active",
  "type": "mobile-application",
  "environment": "production",
  "repository": null,
  "services": [
    { "role": "hosting", "provider": "expo", "label": "iOS / Android app" },
    { "role": "database", "provider": "supabase", "label": "PostgreSQL" },
    { "role": "hosting", "provider": "render", "state": "planned" }
  ],
  "notes": []
}
```

- `status`: `active`, `planned`, `paused` or `archived`.
- `type`: `website`, `web-application`, `mobile-application`, `api`, `tool`, or `null`.
- `environment`: `production`, `staging`, `development`, or `null`.
- `services[].role`: `hosting`, `database` or `integration`. `provider` must match a provider `id`. `state` is `active` (default) or `planned`. `label` is optional free text.
- `icon`: optional path to an image under `assets/icons/projects/` (svg, png, ico or webp), shown on project cards. Projects without one get an initial-letter tile. Save a copy of the favicon in the repo rather than hotlinking it, and keep to public icons.
- `repository`, `website`: public `https://` URLs or `null`/omitted. Use the live site and the public repo only.

### Maintenance: `data/maintenance.json`

Each task has `id`, `title`, optional `cadence`, `due` (`YYYY-MM-DD` or `null`), `notes`, and `providers` / `projects` id lists. An empty scope means "all infrastructure". Completion state is stored per browser in `localStorage` (`did.maintenance.v1`), keyed by task `id`. A new browser starts with every task pending. Changing a task `id` loses its saved state.

### Add a provider or project

1. Add the provider to `providers.json`.
2. Reference it from a project's `services`.
3. Bump the `updated` date in the file you changed. The sidebar shows the latest date.

## Deploy

Deployment is automatic: pushing to `main` runs `.github/workflows/deploy.yml`, which validates the data, runs tests, stages only `index.html`, `assets/` and `data/`, and publishes them with the official GitHub Pages actions. Pull requests run the validation job only.

**One-time setup:** in the GitHub repository go to *Settings → Pages → Build and deployment → Source* and choose **GitHub Actions**. The site is then served at `https://<username>.github.io/dev-infra-dashboard/`.

Subpath safety: the HTML and JS use only relative URLs, and the data directory is resolved relative to `assets/js/data.js`. Do not add root-absolute paths such as `/data/...`. To check a subpath locally, run `node scripts/serve.mjs --base /dev-infra-dashboard/`.

## Security review before pushing

The site is public. Before pushing data changes, confirm that `data/` has no keys, tokens, connection strings, private hostnames or IPs, account IDs, or billing details. `npm test` catches common patterns, but it is not a substitute for reading the diff.

## Design decisions

- **Costs live on providers, not projects.** One plan (for example Neon) can be shared by several projects, so splitting it would be invented data. The Costs page shows per project how many of its providers have a known cost.
- **Hash routing** (`#/projects/lunrfast`) so deep links work on GitHub Pages without server rewrites.
- **Theme** is stored in `localStorage` (`did.theme`). Absence of a value means "system".
- **Visual design** (`assets/css/styles.css`): neutral near-black and near-white surfaces, hairline borders and a single indigo accent (`#8b95ff` dark, `#4f46e5` light). Status colours are green, amber and red. Monospace type is used for numbers, costs and counts. Every colour is a CSS variable at the top of the stylesheet, and the System/Light/Dark switch sets `data-theme` on `<html>`.
