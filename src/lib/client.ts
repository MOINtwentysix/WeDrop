export async function api<T = any>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
    cache: "no-store",
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error || "Something went wrong. Please try again.");
  return data;
}
export function shareUrl(id: string) {
  return `${(process.env.NEXT_PUBLIC_APP_URL || window.location.origin).replace(/\/$/, "")}/d/${id}`;
}
export function remaining(date: string) {
  const seconds = Math.max(
    0,
    Math.ceil((Date.parse(date) - Date.now()) / 1000),
  );
  if (!seconds) return "Expired";
  if (seconds < 60) return `${seconds}s left`;
  if (seconds < 3600) return `${Math.ceil(seconds / 60)}m left`;
  if (seconds < 86400) return `${Math.ceil(seconds / 3600)}h left`;
  return `${Math.ceil(seconds / 86400)}d left`;
}
