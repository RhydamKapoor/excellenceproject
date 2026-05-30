/** App branding and URLs — safe to import from client components */
export const APP_NAME =
  process.env.NEXT_PUBLIC_APP_NAME || process.env.APP_NAME || "Taskflow";

export function getAppUrl() {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}
