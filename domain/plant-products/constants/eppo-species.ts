export const eppoSpecies = {
  '06011010': [{ eppoCode: 'ABWBR', genusAndSpecies: 'Albuca bracteata', speciesId: '1325967' }],
  '0603197090': [{ eppoCode: 'GYPEL', genusAndSpecies: 'Gypsophila elegans', speciesId: '1355418' }],
  '06042090': [
    { eppoCode: 'CXQDA', genusAndSpecies: '+ Crataegomespilus dardarii', speciesId: '1345651' },
    { eppoCode: 'LENCU', genusAndSpecies: 'Lens culinaris', speciesId: '1346687' },
  ],
  '0713500010': [{ eppoCode: 'VICHI', genusAndSpecies: 'Vicia hirsuta', speciesId: '1367380' }],
  '08059000': [{ eppoCode: 'CIDAC', genusAndSpecies: 'Citrus australasica', speciesId: '1364882' }],
  '0808108010': [{ eppoCode: 'MABSD', genusAndSpecies: 'Malus domestica', speciesId: '1391442' }],
  '09103000': [{ eppoCode: 'CURLO', genusAndSpecies: 'Curcuma longa', speciesId: '1402229' }],
  '10083000': [{ eppoCode: 'PHAAN', genusAndSpecies: 'Phalaris angusta', speciesId: '1416873' }],
  '14019000': [{ eppoCode: 'AEAFL', genusAndSpecies: 'Adenaria floribunda', speciesId: '1333611' }],
  '84321000': [{ eppoCode: 'NNNXX', genusAndSpecies: 'no plants', speciesId: '1435652' }],
  '87019510': [{ eppoCode: 'NNNXX', genusAndSpecies: 'no plants', speciesId: '1435652' }],
} as const;

export type EppoSpecies = (typeof eppoSpecies)[keyof typeof eppoSpecies][number];
