/** Small, read-only preview of the user's district, reusing the Explore map. Never shows a point location. */
import { ExploreMap } from "../explore/ExploreMap";
import { useDistrictsGeo, useGeoIndex, useStatesGeo } from "../explore/geo";
import { useRiskRegions } from "../explore/riskRegions";
import { useRiskMap } from "../lib/api";
import type { ResolvedPlace } from "./resolvePlace";

export default function RegionPreviewMap({ place }: { place: ResolvedPlace }) {
  const states = useStatesGeo();
  const index = useGeoIndex();
  const risk = useRiskMap(undefined, undefined);
  const { collection, statesWithData } = useRiskRegions(risk.isError ? undefined : risk.data, index.data);
  const hasModelRegions = statesWithData.includes(place.state.slug);
  const districts = useDistrictsGeo(place.state.slug, !hasModelRegions);

  return (
    <ExploreMap
      states={states.data}
      riskRegions={collection}
      districts={hasModelRegions ? undefined : districts.data}
      statesWithData={statesWithData}
      mode="risk"
      selectedState={place.state.slug}
      selectedDistrict={place.district.slug}
      focus={place.district.bbox}
      refocus={0}
      onPick={() => {}}
      onReady={() => {}}
      describe={(stateSlug, districtSlug) => {
        if (districtSlug === place.district.slug && stateSlug === place.state.slug) return { title: place.district.name, detail: "Your approximate district" };
        const s = index.data?.states.find((x) => x.slug === stateSlug);
        return { title: s?.name ?? stateSlug, detail: "Open Explore to view other regions" };
      }}
    />
  );
}
