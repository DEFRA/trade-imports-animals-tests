import type { Frontend } from './scenarios/index.js';

type Obligation = { id: string; name: string };
type ManifestModule = { obligations: Obligation[] };

const cache = new Map<Frontend, Map<string, string>>();

const loadManifest = async (frontend: Frontend): Promise<ManifestModule> => {
  if (frontend === 'animals') {
    return (await import('../../../trade-imports-animals-frontend/src/server/app/sets/live-animals/obligations/index.js')) as ManifestModule;
  }
  return (await import('../../../trade-imports-plants-frontend/src/server/app/sets/high-risk-plants/obligations/index.js')) as ManifestModule;
};

const nameToUuidFor = async (frontend: Frontend): Promise<Map<string, string>> => {
  const cached = cache.get(frontend);
  if (cached) return cached;
  const { obligations } = await loadManifest(frontend);
  const map = new Map(obligations.map((o) => [o.name, o.id]));
  cache.set(frontend, map);
  return map;
};

export const resolveObligationId = async (frontend: Frontend, name: string): Promise<string> => {
  const map = await nameToUuidFor(frontend);
  const id = map.get(name);
  if (!id) {
    throw new Error(`Manifest for ${frontend} does not define an obligation named "${name}".`);
  }
  return id;
};

export const resolveObligationIds = async (frontend: Frontend, names: readonly string[]): Promise<Map<string, string>> => {
  const map = await nameToUuidFor(frontend);
  const out = new Map<string, string>();
  for (const name of names) {
    const id = map.get(name);
    if (id) out.set(id, name);
  }
  return out;
};
