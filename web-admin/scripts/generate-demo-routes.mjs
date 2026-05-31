/**
 * Pré-calcule les trajectoires routières du MODE DÉMO via Mapbox Directions.
 *
 * Usage (depuis web-admin/) :
 *   VITE_MAPBOX_ACCESS_TOKEN=pk.xxx node scripts/generate-demo-routes.mjs > src/demo/seed-routes.ts
 *
 * Idempotent : on peut le rejouer si on déplace un point de départ ou l'école,
 * il suffit de mettre à jour les coordonnées ci-dessous puis de regénérer le
 * fichier de sortie.
 */

const TOKEN = process.env.VITE_MAPBOX_ACCESS_TOKEN;
if (!TOKEN) {
  console.error('Manque VITE_MAPBOX_ACCESS_TOKEN dans l\'environnement.');
  process.exit(1);
}

// École (cf. seed.ts : DEMO_SCHOOL_LOCATION).
const SCHOOL = { lat: 5.351861, lng: -3.953921 };

// Points de départ de chaque bus (cf. seed.ts : DEMO_BUSES).
const BUSES = [
  { id: 'demo-bus-12', start: { lat: 5.351861 + 0.019, lng: -3.953921 + 0.013 } },
  { id: 'demo-bus-07', start: { lat: 5.351861 + 0.023, lng: -3.953921 - 0.003 } },
  { id: 'demo-bus-23', start: { lat: 5.351861 - 0.021, lng: -3.953921 + 0.005 } },
  { id: 'demo-bus-31', start: { lat: 5.351861 + 0.007, lng: -3.953921 - 0.030 } },
  { id: 'demo-bus-45', start: { lat: 5.351861 - 0.013, lng: -3.953921 + 0.017 } },
];

const fetchRoute = async (bus) => {
  const url =
    `https://api.mapbox.com/directions/v5/mapbox/driving/` +
    `${bus.start.lng},${bus.start.lat};${SCHOOL.lng},${SCHOOL.lat}` +
    `?geometries=geojson&overview=full&access_token=${TOKEN}`;
  const res = await fetch(url);
  const data = await res.json();
  const route = data.routes?.[0];
  if (!route) {
    throw new Error(`Pas de route pour ${bus.id}: ${JSON.stringify(data).slice(0, 200)}`);
  }
  return {
    id: bus.id,
    distance: Math.round(route.distance),
    duration: Math.round(route.duration),
    coords: route.geometry.coordinates,
  };
};

const main = async () => {
  const results = await Promise.all(BUSES.map(fetchRoute));

  const lines = [
    '/**',
    ' * Trajectoires routières réelles pour le MODE DÉMO.',
    ' *',
    ' * Pré-calculées via Mapbox Directions API (mode driving) une fois pour',
    ' * toutes, de sorte que la simulation suive les vraies rues d’Abidjan',
    ' * sans appel réseau au runtime.',
    ' *',
    ' * Pour régénérer (si on déplace un point de départ ou l’école) :',
    ' *   VITE_MAPBOX_ACCESS_TOKEN=pk.xxx node scripts/generate-demo-routes.mjs > src/demo/seed-routes.ts',
    ' */',
    '',
    'import type { LatLng } from \'./seed\';',
    '',
    'interface DemoRoute {',
    '  distanceMeters: number;',
    '  durationSeconds: number;',
    '  /** Suite de points lng/lat le long du tracé routier. */',
    '  polyline: LatLng[];',
    '}',
    '',
    'export const DEMO_ROUTES: Record<string, DemoRoute> = {',
  ];

  for (const r of results) {
    lines.push(`  '${r.id}': {`);
    lines.push(`    distanceMeters: ${r.distance},`);
    lines.push(`    durationSeconds: ${r.duration},`);
    lines.push('    polyline: [');
    for (const [lng, lat] of r.coords) {
      lines.push(`      { lat: ${lat}, lng: ${lng} },`);
    }
    lines.push('    ],');
    lines.push('  },');
  }
  lines.push('};');
  lines.push('');

  process.stdout.write(lines.join('\n'));

  const summary = results
    .map((r) => `${r.id}: ${r.coords.length} pts, ${r.distance}m, ~${Math.round(r.duration / 60)}min`)
    .join('\n');
  process.stderr.write(`\n${summary}\n`);
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
