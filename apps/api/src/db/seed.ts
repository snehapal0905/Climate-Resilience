/**
 * Loads district boundaries into `regions`.
 * Source: data/assam-districts.geojson (Census 2011 district codes, 33 districts incl. post-2015 splits).
 * Population is left null until a verified per-district dataset (e.g. WorldPop) is added.
 */
import { readFile } from "node:fs/promises";
import type { MultiPolygon, Polygon } from "geojson";
import { fileURLToPath } from "node:url";
import { sql } from "./client.js";
import { logger } from "../logger.js";

interface DistrictFeature {
  properties: { district: string; dt_code: string; st_nm: string };
  geometry: Polygon | MultiPolygon;
}

const file = fileURLToPath(new URL("../../../../data/assam-districts.geojson", import.meta.url));
const collection = JSON.parse(await readFile(file, "utf8")) as { features: DistrictFeature[] };

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

for (const f of collection.features) {
  const { district, dt_code, st_nm } = f.properties;
  const id = `as-${slug(district)}`;
  await sql`
    WITH g AS (SELECT ST_Multi(ST_MakeValid(ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(f.geometry)}), 4326))) AS geom),
         p AS (SELECT geom, ST_PointOnSurface(geom) AS pt FROM g)
    INSERT INTO regions (id, name, state, census_code, geom, ref_lat, ref_lon)
    SELECT ${id}, ${district}, ${st_nm}, ${dt_code}, geom, ST_Y(pt), ST_X(pt) FROM p
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name, state = EXCLUDED.state, census_code = EXCLUDED.census_code,
      geom = EXCLUDED.geom, ref_lat = EXCLUDED.ref_lat, ref_lon = EXCLUDED.ref_lon`;
}

logger.info(`Seeded ${collection.features.length} regions`);
await sql.end();
