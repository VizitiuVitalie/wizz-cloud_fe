import axios from "axios";
import { v4 as uuidv4 } from "uuid";

const API_BASE_URL = "http://localhost:1222/wizzcloud";

export const apiWithInterceptors = axios.create({ 
  // will use in future for api calls what needs interceptors
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const apiWithoutInterceptors = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const getDeviceId = () => {
  let deviceId = localStorage.getItem("device_id");
  if (!deviceId) {
    deviceId = uuidv4();
    localStorage.setItem("device_id", deviceId);
  }
  return deviceId;
};

export const getAccessToken = () => localStorage.getItem("access_token");
export const getRefreshToken = () => localStorage.getItem("refresh_token");

apiWithInterceptors.interceptors.request.use(
  (config) => {
    const accessToken = getAccessToken();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiWithInterceptors.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = getRefreshToken();
      
      if (refreshToken) {
        try {
          const response = await axios.post(
            `${API_BASE_URL}/auth/refresh`,
            {},
            { headers: { Authorization: `Bearer ${refreshToken}` } }
          );

          const newAccessToken = response.data.accessToken;
          const newRefreshToken = response.data.refreshToken;

          localStorage.setItem("access_token", newAccessToken);
          localStorage.setItem("refresh_token", newRefreshToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

          return axios(originalRequest);
        } catch (refreshError) {
          if (axios.isAxiosError(refreshError) && refreshError.response && refreshError.response.status === 401) {
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            window.location.href = "/signin";
          } else {
            console.error("Unexpected error during token refresh:", refreshError);
          }
        }
      }
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
    const response = await apiWithoutInterceptors.post("/auth/register", {
      fullName,
      email,
      password,
      deviceId,
    });
    console.log("Server response:", response.data);
    return response.data;
  } catch (error) {
    console.log("signUp error", error);
    throw error;
  }
};

export const verifyEmail = async (email: string, code: string, deviceId: string) => {
  try {
    const response = await apiWithoutInterceptors.post("/auth/verify-email", {
      email,
      code,
      deviceId,
    });
    console.log("Server response:", response.data);
    const { accessToken, refreshToken } = response.data;
    return { accessToken, refreshToken };
  } catch (error) {
    console.log("verifyEmail error", error);
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
    const accessToken = response.data.accessToken;
    const refreshToken = response.data.refreshToken;
    localStorage.setItem("access_token", accessToken);
    localStorage.setItem("refresh_token", refreshToken);
    return { accessToken, refreshToken };
  } catch (error) {
    console.log("signIn error", error);
    throw error;
  }
};

export const getNickname = async (userId: number) => {
  try {
    const accessToken = getAccessToken();
    const response = await apiWithInterceptors.get(`/user/fullName/${userId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data.nickname;
  } catch (error) {
    console.error("Failed to fetch nickname: ", error);
    throw error;
  }
};