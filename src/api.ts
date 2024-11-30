import axios from "axios";
import { v4 as uuidv4 } from "uuid";

const API_BASE_URL = "http://localhost:1222/wizzcloud";

const apiWithInterceptors = axios.create({              // will use in future for secure api calls
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const apiWithoutInterceptors = axios.create({
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
    const response = await apiWithInterceptors.post(
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

export const signUp = async (
  fullName: string,
  email: string,
  password: string
) => {
  try {
    const deviceId = getDeviceId();
    const response = await apiWithoutInterceptors.post("/auth/register", {
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
    const response = await apiWithoutInterceptors.post("/auth/login", {
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