export const API_ROOT =
  process.env.API_URL || "https://intern-assignment-api.onrender.com";

export async function apiFetch(path: string, options?: RequestInit) {
  const url = path.startsWith("http") ? path : `${API_ROOT}${path}`;
  return fetch(url, {
    credentials: "include",
    ...options,
  });
}
