/**
 * Each frontend serves its obligation sets under `/<set-id>`, and no set at the
 * root. A set's base is one fact in one place here rather than a literal
 * repeated across page objects and specs.
 *
 * The Playwright base URL stays host-only. Putting a set prefix in the host
 * would break /signout, /health, the static assets and the OIDC callback, and
 * make every other set on that host unreachable — the prefix belongs in path
 * construction.
 */
export const SET_BASES = {
  liveAnimals: '/live-animals',
  highRiskPlants: '/high-risk-plants',
} as const;

export type SetBase = (typeof SET_BASES)[keyof typeof SET_BASES];
