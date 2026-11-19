// Allowed values and display labels. Shared by the UI and scripts/validate-data.mjs.

export const STATUSES = { active: 'Active', planned: 'Planned', paused: 'Paused', archived: 'Archived' };
export const TYPES = {
  website: 'Website',
  'web-application': 'Web application',
  'mobile-application': 'Mobile application',
  api: 'API',
  tool: 'Tool',
};
export const ENVIRONMENTS = { production: 'Production', staging: 'Staging', development: 'Development' };
export const ROLES = { hosting: 'Hosting', database: 'Database', integration: 'Integration' };
export const SERVICE_STATES = { active: 'Active', planned: 'Planned' };
export const CATEGORIES = {
  'application-hosting': 'Application hosting',
  'database-hosting': 'Database hosting',
  'static-hosting': 'Static hosting',
  'mobile-development': 'Mobile development',
  'email-newsletters': 'Email & newsletters',
  'email-delivery': 'Email delivery',
  'source-control': 'Source control',
  monitoring: 'Monitoring',
  'domain-dns': 'Domain & DNS',
};
export const BILLING = { monthly: 'Monthly', annual: 'Annual' };

/** Label for an enum value; "Unknown" for missing values, the raw id for unrecognised ones. */
export function labelOf(map, key) {
  if (key == null || key === '') return 'Unknown';
  return map[key] ?? String(key);
}
