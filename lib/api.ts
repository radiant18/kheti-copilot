/**
 * Single fetch entry point.
 *
 * On the web this resolves to same-origin `/api/...`. Inside the Capacitor
 * shell the bundle is served from `capacitor://localhost`, so every call has to
 * go to the deployed origin instead — that is what NEXT_PUBLIC_API_BASE is for.
 * Keeping all network access behind this one function is what makes the same
 * codebase ship to web, Android and iOS unchanged.
 */
const BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

export async function apiGet<T>(path: string, params?: Record<string, string | number>): Promise<T> {
  const qs = params
    ? "?" + new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString()
    : "";
  const res = await fetch(`${BASE}${path}${qs}`, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`${path} failed: ${res.status}`);
  return res.json() as Promise<T>;
}
