// One cinema per row of the brief's booking examples. The brief gives only the
// bundle sizes, so the names are made up.
export const sampleCinemas = [
  { name: 'Starlight Cinema', bundleSizes: [1, 3, 4] }, // group of 6  → 2 bundles: 3 × 2
  { name: 'Galaxy Multiplex', bundleSizes: [2, 5] }, //    group of 11 → 4 bundles: 5 × 1, 2 × 3
  { name: 'Nova Screens', bundleSizes: [6, 9, 20] }, //    group of 44 → 4 bundles: 20 × 1, 9 × 2, 6 × 1
  { name: 'Orbit Theatre', bundleSizes: [4, 6] }, //       group of 7  → not possible
];
