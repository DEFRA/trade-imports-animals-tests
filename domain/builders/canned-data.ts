import { readFileSync } from 'node:fs';
import type { Operator, Transporter } from '@domain/models/api/notification';

export type SpeciesOption = {
  text: string;
  value: string;
};

type SpeciesFile = {
  data: {
    types: Array<{ text: string; value: string }>;
    species: Array<{ text: string; value: string }>;
  };
};

function loadCannedData<T>(file: string): T {
  const url = new URL(`../../resources/canned-data/${file}`, import.meta.url);
  return JSON.parse(readFileSync(url, 'utf-8')) as T;
}

const speciesFile = loadCannedData<SpeciesFile>('species.json');

export const cannedCommodityTypes: string[] = speciesFile.data.types.map((type) => type.text);

export const cannedSpeciesOptions: SpeciesOption[] = speciesFile.data.species.map(({ text, value }) => ({ text, value }));

export const cannedTransporters = loadCannedData<Transporter[]>('transporters.json');

export const cannedPlaceOfOrigins = loadCannedData<Operator[]>('place-of-origins.json');

export const cannedConsignors = loadCannedData<Operator[]>('consignors.json');

export const cannedConsignees = loadCannedData<Operator[]>('consignees.json');

export const cannedImporters = loadCannedData<Operator[]>('importers.json');

export const cannedDestinations = loadCannedData<Operator[]>('destinations.json');

export const cannedContacts = loadCannedData<Operator[]>('contacts.json');
