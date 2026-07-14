export function getBackendBaseUrl(): string {
  return process.env.TRADE_IMPORTS_ANIMALS_BACKEND_BASE_URL ?? 'http://localhost:8085';
}

export function getReferenceDataBaseUrl(): string {
  return process.env.TRADE_IMPORTS_REFERENCE_DATA_BASE_URL ?? 'http://localhost:8086';
}
