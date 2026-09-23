import { PredictResponseSchema, type PredictRequest, type PredictResponse } from "@climate/shared";
import { env } from "../env.js";

const TIMEOUT_MS = 30_000;

export async function predict(req: PredictRequest): Promise<PredictResponse> {
  const res = await fetch(`${env.ML_SERVICE_URL}/predict`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(req),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`ML service ${res.status}: ${await res.text()}`);
  // Validate so a contract drift in the ML service fails loudly here instead of corrupting data.
  return PredictResponseSchema.parse(await res.json());
}

export async function mlHealth(): Promise<{ status: string; model_version?: string }> {
  const res = await fetch(`${env.ML_SERVICE_URL}/health`, { signal: AbortSignal.timeout(3000) });
  if (!res.ok) throw new Error(`ML service ${res.status}`);
  return (await res.json()) as { status: string; model_version?: string };
}
