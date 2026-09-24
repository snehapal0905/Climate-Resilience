/**
 * One-shot browser geolocation with typed failures.
 * Coordinates are sensitive: callers should use them only to resolve a region and then drop them.
 * Never log, store, or put them in a URL.
 */

export type LocationErrorKind = "unsupported" | "denied" | "unavailable" | "timeout";

export class LocationError extends Error {
  readonly kind: LocationErrorKind;
  constructor(kind: LocationErrorKind) {
    super(kind);
    this.kind = kind;
  }
}

export interface Coordinates {
  lat: number;
  lon: number;
}

const OPTIONS: PositionOptions = {
  // District-level lookup doesn't need GPS precision, and coarse positions arrive faster.
  enableHighAccuracy: false,
  timeout: 15_000,
  maximumAge: 10 * 60_000,
};

export function requestCurrentPosition(): Promise<Coordinates> {
  if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
    return Promise.reject(new LocationError("unsupported"));
  }
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      (err) => {
        const kind: LocationErrorKind = err.code === err.PERMISSION_DENIED ? "denied" : err.code === err.TIMEOUT ? "timeout" : "unavailable";
        reject(new LocationError(kind));
      },
      OPTIONS,
    );
  });
}
