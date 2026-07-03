const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:3000";

export async function apiapifetch(
  endpoint: string,
  options: RequestInit = {}
) {
  return apifetch(`${API_BASE_URL}${endpoint}`, {
    credentials: "include",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
}