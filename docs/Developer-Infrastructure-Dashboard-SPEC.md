# Developer Infrastructure Dashboard
## Product & Technical Specification

**Version:** 1.0  
**Date:** November 18, 2026  
**Hosting:** GitHub Pages  
**Repository:** `dev-infra-dashboard`  
**Application type:** Static web application  
**Status:** MVP implemented

---

## 1. Overview

Developer Infrastructure Dashboard is a lightweight, centralized dashboard for documenting and monitoring the infrastructure behind personal software projects.

It provides a single place to understand:

- What projects exist.
- Where applications are hosted.
- Which databases and backend services they use.
- Which third-party integrations they depend on.
- What hosting plans and costs are involved.

The dashboard is intended for personal developer operations, not public marketing.

It will be hosted independently from the personal website using GitHub Pages.

### Primary objective

Make it possible to understand the infrastructure behind all personal projects within 30 seconds.

### Design principles

- Simple and information-dense.
- Easy to maintain.
- No backend or database required.
- Minimal dependencies.
- Responsive across desktop, tablet, and mobile.
- Data-driven rather than hardcoded into UI components.
- Safe for public hosting.

---

## 2. Current Infrastructure

The initial dashboard will include the following projects.

| Project | Application Hosting | Database / Backend | Integrations |
|---|---|---|---|
| Personal Website | Netlify | — | Kit |
| Pangu Terminal | Render | Neon PostgreSQL | — |
| LunrFast | Expo (iOS/Android) + GitHub Pages (landing page) | Supabase PostgreSQL | Buttondown |
| Homebase | Render (planned) | Neon (planned) | — |

### Initial provider directory

| Provider | Purpose |
|---|---|
| Netlify | Static website hosting |
| Kit | Newsletter management |
| Render | Application hosting |
| Neon | PostgreSQL hosting |
| Expo | Mobile application development and distribution |
| Supabase | PostgreSQL and backend services |
| GitHub Pages | Static website hosting |
| Buttondown | Newsletter and waitlist management |

Provider costs, plan details, and resource limits should be editable and initially marked as unknown where they have not been verified.

---

## 3. Application Structure

The application has four primary sections. A maintenance checklist was originally planned and has been removed; recurring reminders (backups, billing, domain renewals) are kept in a calendar instead, because checklist state stored in the browser cannot sync between devices.

### A. Overview

The default landing page.

Display summary cards for:

- Total projects.
- Active projects.
- Planned projects.
- Total infrastructure providers.
- Known monthly infrastructure costs.

Below the summary cards, display:

**Project Overview**

A collection of project cards showing:

- Project name.
- Project description.
- Lifecycle status.
- Application hosting.
- Database provider.
- Integrations.
- Estimated monthly cost.

**Infrastructure Distribution**

A breakdown of services by provider.

### B. Projects

A dedicated project directory.

Each project should have its own detail view.

Project information:

| Field | Description |
|---|---|
| Name | Project name |
| Slug | Unique identifier |
| Description | Short project description |
| Status | Active, planned, paused, archived |
| Type | Website, web application, mobile application, API, tool |
| Repository | Optional GitHub repository URL |
| Hosting provider | Application hosting provider |
| Database provider | Database or backend provider |
| Integrations | Connected external services |
| Monthly cost | Estimated or known cost |
| Environment | Production, staging, development |
| Notes | Non-sensitive project notes |

Project cards should allow navigation to a detailed project page or modal.

### C. Providers

A directory of infrastructure providers.

Provider information:

- Provider name.
- Provider category.
- Official website.
- Services being used.
- Associated projects.
- Current subscription plan.
- Monthly cost.
- Billing frequency.
- Free-tier limitations.
- Notes.

Provider categories:

- Application hosting.
- Database hosting.
- Static hosting.
- Mobile development.
- Email and newsletters.
- Source control.
- Monitoring.
- Domain and DNS.

### D. Costs

A consolidated view of infrastructure expenses.

Display:

- Total known monthly costs.
- Total known annual costs.
- Free services.
- Paid services.
- Unknown costs.
- Cost breakdown by provider.
- Costs that belong to one project (such as a domain) on that project's page. There is no separate by-project table, because provider plans are shared between projects.

Support monthly and annual billing frequencies.

Convert annual expenses into monthly equivalents for comparison.

Do not treat unknown costs as zero. Display them separately.

---

## 4. Data Architecture

The application will use local JSON files as its source of truth.

No backend or database is required.

Implemented structure (see [MAINTAINING.md](MAINTAINING.md) for the field reference):

```text
dev-infra-dashboard/
├── index.html
├── assets/
│   ├── css/styles.css
│   ├── js/            app.js, data.js, costs.js, schema.js, storage.js, dom.js, components.js, views/
│   └── icons/
├── data/
│   ├── projects.json      projects and the services each one uses
│   └── providers.json     providers, plans and costs
├── scripts/               validate-data.mjs, serve.mjs
├── tests/
├── .github/workflows/deploy.yml
└── README.md
```

There is no `costs.json`. Cost is a property of the provider, so it has a single source of truth.

### Data relationships

A project references providers through a `services` list. Each entry has a role (`hosting`, `database` or `integration`), a provider `id`, an optional label, and a `state` (`active` or `planned`).

Provider-to-project links are derived from `services`, not stored twice.

Use stable identifiers rather than display names.

Example project data:

```json
{
  "id": "pangu-terminal",
  "name": "Pangu Terminal",
  "description": "Personal Ruby on Rails application.",
  "status": "active",
  "type": "web-application",
  "environment": "production",
  "repository": null,
  "services": [
    { "role": "hosting", "provider": "render" },
    { "role": "database", "provider": "neon", "label": "PostgreSQL" }
  ],
  "notes": []
}
```

Example provider data. `amount: null` means unknown, `0` means free:

```json
{
  "id": "render",
  "name": "Render",
  "category": "application-hosting",
  "website": "https://render.com",
  "plan": null,
  "cost": { "amount": null, "currency": "USD", "billing": null },
  "freeTier": null,
  "notes": []
}
```

The actual project data should remain editable without changing application code.

---

## 5. User Interface and Design

### Visual direction

A restrained developer-oriented interface.

Design references:

- GitHub.
- Linear.
- Vercel.
- Modern developer dashboards.

Avoid excessive gradients, unnecessary animations, oversized cards, and decorative charts.

### Layout

**Desktop**

- Sidebar navigation.
- Main content area.
- Compact summary cards.
- Responsive project grid.
- Clear information hierarchy.

**Mobile**

- Collapsible navigation.
- Single-column project cards.
- Stacked summary cards.
- Scrollable tables where necessary.

### Theme

Support:

- Dark mode.
- Light mode.
- System preference.

Persist the selected theme locally using browser local storage.

### UI components

- Navigation sidebar.
- Summary cards.
- Project cards.
- Provider cards.
- Status badges.
- Cost indicators.
- Search field.
- Filter controls.
- Detail panels.

### Status colors

- Active: green.
- Planned: neutral blue.
- Paused: yellow.
- Archived: gray.
- Unknown: neutral gray.

Use text labels alongside color indicators for accessibility.

---

## 6. Functionality

### Required MVP features

1. Display all projects.
2. Display all providers.
3. Display project-provider relationships.
4. Display infrastructure costs.
5. Filter projects by status and type.
6. Search projects and providers.
7. Display individual project details.
8. Support dark and light themes.
9. Load information from JSON configuration files.

### Nice-to-have features

- Cost distribution charts.
- Provider usage summaries.
- Project dependency visualization.
- Export inventory as JSON.
- Print-friendly overview.
- Last-updated timestamp.
- External links to provider dashboards.
- Infrastructure change history maintained through Git.

### Explicitly out of scope

- User authentication.
- Multi-user collaboration.
- Database.
- Backend API.
- Live provider API integrations.
- Automatic billing retrieval.
- Automated uptime monitoring.
- Credential management.
- Infrastructure provisioning.
- Cloud resource management.

The dashboard is an inventory and documentation tool, not an actual monitoring or management platform.

---

## 7. Technology Stack

Keep the technology deliberately simple.

| Technology | Purpose |
|---|---|
| HTML5 | Application structure |
| CSS3 | Styling and responsive layout |
| Vanilla JavaScript | Application logic |
| JSON | Inventory data |
| GitHub Pages | Hosting |
| GitHub Actions | Deployment |
| Local Storage | Theme preference |

No React, Vue, Angular, Node.js backend, Ruby on Rails, or database is necessary.

A static application is sufficient for this use case.

Avoid introducing a build system unless a future requirement genuinely justifies one.

---

## 8. Security and Privacy

The GitHub Pages deployment must be treated as publicly accessible.

### Never publish

- API keys.
- Access tokens.
- Passwords.
- Database connection strings.
- Private database hostnames.
- Internal IP addresses.
- Account IDs.
- Private infrastructure endpoints.
- Sensitive billing or account information.
- Private operational documentation.

### Public-safe information

- Project names.
- General technology stacks.
- Public repository links.
- Provider names.
- General hosting architecture.
- Non-sensitive cost estimates.
- General maintenance practices.

Add a security review to the deployment process.

The repository should contain only information approved for public visibility.

If more sensitive details become necessary, keep them in a separate private document or password manager.

---

## 9. Deployment

Host the application using GitHub Pages.

### Repository

`dev-infra-dashboard`

### Deployment workflow

1. Push changes to the main branch.
2. GitHub Actions validates JSON files.
3. GitHub Actions deploys the static application.
4. GitHub Pages publishes the updated dashboard.

Use the official GitHub Pages deployment workflow and GitHub-provided deployment actions.

### URL

```text
https://infra.ambalong.dev/
```

The site is also reachable at `https://<github-username>.github.io/dev-infra-dashboard/` until the custom domain is set up, and that address then redirects. See [MAINTAINING.md](MAINTAINING.md) for the DNS and Pages steps.

---

## 10. Testing and Quality

Verify:

- All JSON files load correctly.
- Missing optional fields do not break rendering.
- Project-provider relationships resolve correctly.
- Cost calculations handle unknown values.
- Search and filtering work.
- Theme preference persists.
- Mobile layouts remain usable.
- External links work.
- No sensitive information is present in published files.
- GitHub Pages deployment succeeds.

Validate JSON data before deployment to catch malformed configuration.

---

## 11. Implementation Phases

### Phase 1 — Foundation

- Create GitHub repository.
- Set up directory structure.
- Create initial JSON datasets.
- Build the application shell.
- Configure GitHub Pages.

### Phase 2 — Core Dashboard

- Build overview.
- Build project directory.
- Build provider directory.
- Implement project detail views.

### Phase 3 — Operational Information

- Build cost tracking.
- Add search and filtering.

### Phase 4 — Polish

- Add responsive layouts.
- Add dark/light theme.
- Improve accessibility.
- Add JSON validation.
- Perform public information security review.

### Phase 5 — Deployment

- Configure GitHub Actions.
- Publish to GitHub Pages.
- Verify production deployment.
- Document how to maintain the inventory.

---

## 12. Definition of Done

The MVP is complete when:

- [ ] The application is hosted independently on GitHub Pages.
- [ ] All existing projects are represented.
- [ ] All current providers are represented.
- [ ] Project-provider relationships are accurate.
- [ ] Planned projects are clearly distinguished from active projects.
- [ ] Costs support unknown values.
- [ ] Inventory data is separate from UI code.
- [ ] Search and filtering work.
- [ ] Dark and light themes work.
- [ ] Mobile layout works.
- [ ] Deployment is automated.
- [ ] No sensitive infrastructure information is published.
- [ ] README explains how to update the inventory.

**Final product goal:** A small, maintainable, public-safe infrastructure dashboard that gives a clear overview of personal development projects and their underlying services without introducing another backend to maintain.
