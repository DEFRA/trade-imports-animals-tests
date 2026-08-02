export const packageTypes = {
  bag: { value: 'BAG', display: 'Bag' },
  bale: { value: 'BALE', display: 'Bale' },
  bottleFlaskOtherGlassPackages: {
    value: 'BOTTLE_FLASK_OTHER_GLASS_PACKAGES',
    display: 'Bottle, flask and other glass packages',
  },
  box: { value: 'BOX', display: 'Box' },
  bulkSolidGranularParticles: {
    value: 'BULK_SOLID_GRANULAR_PARTICLES',
    display: 'Bulk solid granular particles ("grains")',
  },
  can: { value: 'CAN', display: 'Can' },
  carton: { value: 'CARTON', display: 'Carton' },
  case: { value: 'CASE', display: 'Case' },
  cask: { value: 'CASK', display: 'Cask' },
  coffer: { value: 'COFFER', display: 'Coffer' },
  container: { value: 'CONTAINER', display: 'Container' },
  crate: { value: 'CRATE', display: 'Crate' },
  other: { value: 'OTHER', display: 'Other' },
  package: { value: 'PACKAGE', display: 'Package' },
  pallet: { value: 'PALLET', display: 'Pallet' },
  polystyreneBox: { value: 'POLYSTYRENE_BOX', display: 'Polystyrene box' },
  tray: { value: 'TRAY', display: 'Tray' },
  tube: { value: 'TUBE', display: 'Tube' },
  vial: { value: 'VIAL', display: 'Vial' },
  woodBundle: { value: 'WOOD_BUNDLE', display: 'Wood bundle' },
  woodCrate: { value: 'WOOD_CRATE', display: 'Wood crate' },
  woodenBarrel: { value: 'WOODEN_BARREL', display: 'Wooden barrel' },
  woodenCaseWithPalletBase: {
    value: 'WOODEN_CASE_WITH_PALLET_BASE',
    display: 'Wooden case with pallet base',
  },
} as const;

export type PackageType = (typeof packageTypes)[keyof typeof packageTypes];
