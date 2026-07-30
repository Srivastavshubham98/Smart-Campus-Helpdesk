import axios from "axios";

const API_BASE_URL =
  "https://smart-campus-helpdesk-backend.onrender.com/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const refreshApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let failedRequestQueue = [];

const processQueue = (error, accessToken = null) => {
  failedRequestQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(accessToken);
    }
  });

  failedRequestQueue = [];
};

const clearAuthData = () => {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  localStorage.removeItem("user");
};

const redirectToLogin = () => {
  if (window.location.pathname !== "/login") {
    window.location.replace("/login");
  }
};

// Har protected API request ke saath access token bhejega.
api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem("access");

    if (accessToken) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Access token expire hone par automatically refresh karega.
api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;
    const statusCode = error.response?.status;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Sirf 401 Unauthorized par token refresh try karna.
    if (statusCode !== 401) {
      return Promise.reject(error);
    }

    const requestUrl = originalRequest.url || "";

    // Login aur refresh endpoint ko dobara refresh loop me mat bhejna.
    const isAuthenticationRequest =
      requestUrl.includes("/accounts/login/") ||
      requestUrl.includes("/accounts/refresh/");

    if (isAuthenticationRequest || originalRequest._retry) {
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem("refresh");

    if (!refreshToken) {
      clearAuthData();
      redirectToLogin();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    // Agar ek refresh already chal raha hai,
    // to baaki failed requests wait karengi.
    if (isRefreshing) {
      try {
        const newAccessToken = await new Promise((resolve, reject) => {
          failedRequestQueue.push({
            resolve,
            reject,
          });
        });

        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization =
          `Bearer ${newAccessToken}`;

        return api(originalRequest);
      } catch (queueError) {
        return Promise.reject(queueError);
      }
    }

    isRefreshing = true;

    try {
      const response = await refreshApi.post(
        "/accounts/refresh/",
        {
          refresh: refreshToken,
        }
      );

      const newAccessToken = response.data?.access;
      const newRefreshToken = response.data?.refresh;

      if (!newAccessToken) {
        throw new Error(
          "Refresh endpoint did not return a new access token."
        );
      }

      localStorage.setItem("access", newAccessToken);

      // Refresh-token rotation enabled hone par
      // backend naya refresh token bhi bhej sakta hai.
      if (newRefreshToken) {
        localStorage.setItem("refresh", newRefreshToken);
      }

      api.defaults.headers.common.Authorization =
        `Bearer ${newAccessToken}`;

      processQueue(null, newAccessToken);

      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization =
        `Bearer ${newAccessToken}`;

      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError);

      clearAuthData();
      redirectToLogin();

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;