import axios from "axios";
import { v4 as uuidv4 } from "uuid";

const API_BASE_URL = "http://localhost:1222/wizzcloud";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const getDeviceId = () => {
  let deviceId = localStorage.getItem("device_id");
  if (!deviceId) {
    deviceId = uuidv4();
    localStorage.setItem("device_id", deviceId);
  }
  return deviceId;
};

const getAccessToken = () => localStorage.getItem("access_token");
const getRefreshToken = () => localStorage.getItem("refresh_token");

const refreshTokens = async () => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error("Refresh token missing");
  }

  try {
    const response = await api.post(
      "/auth/refresh",
      {},
      { headers: { Authorization: `Bearer ${refreshToken}` } }
    );
    const { access_token, refresh_token } = response.data;

    localStorage.setItem("access_token", access_token);
    localStorage.setItem("refresh_token", refresh_token);

    return { access_token, refresh_token };
  } catch (error) {
    console.error("Failed to refresh tokens:", error);
    throw new Error("Failed to refresh tokens");
  }
};

api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      try {
        const newTokens = await refreshTokens();
        originalRequest.headers["Authorization"] = `Bearer ${newTokens.access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.error("Failed to refresh tokens in interceptor:", refreshError);

        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/signin"
        return Promise.reject(refreshError);
      }
    } else if (error.response?.status === 401 && originalRequest?._retry) {
      console.error("Request failed after token refresh attempt:", error);
      return Promise.reject(error);
    }
    return Promise.reject(error);
  }
);

export const signUp = async (
  fullName: string,
  email: string,
  password: string
) => {
  try {
    const deviceId = getDeviceId();
    const response = await api.post("/auth/register", {
      fullName,
      email,
      password,
      deviceId,
    });
    console.log("Server response:", response.data);
    const { accessToken, refreshToken } = response.data;
    return { accessToken, refreshToken };
  } catch (error) {
    console.log("signUp error", error);
    throw error;
  }
};

export const signIn = async (email: string, password: string) => {
  try {
    const deviceId = getDeviceId();
    const response = await api.post("/auth/login", {
      email,
      password,
      deviceId,
    });
    console.log("Server response:", response.data);
    const { accessToken, refreshToken } = response.data;
    return { accessToken, refreshToken };
  } catch (error) {
    console.log("signIn error", error);
    throw error;
  }
};
