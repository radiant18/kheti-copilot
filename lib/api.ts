import { proofToken } from "./session";

/**
 * Single fetch entry point.
 *
 * On the web this resolves to same-origin `/api/...`. Inside the Capacitor
 * shell the bundle is served from `capacitor://localhost`, so every call has to
 * go to the deployed origin instead — that is what NEXT_PUBLIC_API_BASE is for.
 * Keeping all network access behind this one function is what makes the same
 * codebase ship to web, Android and iOS unchanged.
 *
 * It also attaches the proof-of-number token when the device holds one, so the
 * routes that publish or message a phone number can read it off the token
 * rather than believing the request body. See lib/otp.ts.
 */
const BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

function headers(extra?: Record<string, string>): Record<string, string> {
  const token = proofToken();
  return {
    ...extra,
    ...(token ? { authorization: `Bearer ${token}` } : {}),
  };
}

export async function apiGet<T>(path: string, params?: Record<string, string | number>): Promise<T> {
  const qs = params
    ? "?" + new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString()
    : "";
  const res = await fetch(`${BASE}${path}${qs}`, { headers: headers({ accept: "application/json" }) });
  if (!res.ok) throw new Error(`${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

/** POST counterpart, same base-URL rule so it works in the Capacitor shell. */
export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: headers({ "content-type": "application/json" }),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export interface SendResponse<T> {
  ok: boolean;
  status: number;
  /** Parsed body when there was one — error routes return a reason here too. */
  data: T | null;
}

/**
 * For calls whose failure is part of the flow rather than an exception: a wrong
 * code, a number already in use, a lot somebody else owns. The forms need to
 * show the reason, so this hands back the status and the body instead of
 * throwing, and still goes through BASE and the token like everything else.
 */
export async function apiSend<T>(
  path: string,
  method: "POST" | "PATCH",
  body: unknown,
): Promise<SendResponse<T>> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers: headers({ "content-type": "application/json" }),
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => null)) as T | null;
    return { ok: res.ok, status: res.status, data };
  } catch {
    // Offline, or the shell could not reach the deployed origin.
    return { ok: false, status: 0, data: null };
  }
}
