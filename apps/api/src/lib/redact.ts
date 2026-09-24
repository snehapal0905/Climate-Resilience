/**
 * Request logging must never record precise locations. Location lookups carry coordinates in the
 * query string, so for those paths the logged URL loses its query and the parsed query is dropped.
 */
const LOCATION_PATHS = ["/api/regions/locate"];

interface SerializedRequest {
  url?: string;
  query?: unknown;
  [key: string]: unknown;
}

export function redactLocation<T extends SerializedRequest>(req: T): T {
  const url = req.url ?? "";
  const path = url.split("?")[0] ?? "";
  if (!LOCATION_PATHS.includes(path)) return req;
  const { query: _query, ...rest } = req;
  return { ...rest, url: url.includes("?") ? `${path}?[redacted]` : path } as T;
}
