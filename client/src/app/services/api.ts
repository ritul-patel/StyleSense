import axios from "axios";

function normalizeBaseUrl(value?: string): string {
  const fallbackUrl = "http://localhost:4000";
  const rawValue = (value || fallbackUrl).trim();
  const normalizedValue = rawValue.replace(/\/api(?:\/v\d+)?\/?$/i, "");

  try {
    return new URL(normalizedValue).toString().replace(/\/$/, "");
  } catch {
    return fallbackUrl;
  }
}

export const API_BASE_URL = normalizeBaseUrl(process.env.NEXT_PUBLIC_API_URL);
const GUEST_KEY = "ss_guest_id";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
});

function getGuestId(): string {
  let id = localStorage.getItem(GUEST_KEY);

  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(GUEST_KEY, id);
  }

  return id;
}

api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const guestId = getGuestId();
      config.headers = config.headers ?? {};
      config.headers["x-guest-id"] = guestId;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const apiError = {
      code: err.response?.data?.code || "UNKNOWN_ERROR",
      message:
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Something went wrong. Please try again.",
    };

    return Promise.reject(apiError);
  }
);

export default api;
