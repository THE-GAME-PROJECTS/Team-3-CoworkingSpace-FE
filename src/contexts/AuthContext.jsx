import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

const API_BASE_URL = import.meta.env.VITE_API_URL;
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // ==============================================
  // 1. STATE MANAGEMENT
  // ==============================================
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ==============================================
  // 2. TOKEN OPERATIONS
  // ==============================================
  const storeTokens = (accessToken, refreshToken) => {
    localStorage.setItem("access_token", accessToken);
    localStorage.setItem("refresh_token", refreshToken);
  };

  const getTokens = () => {
    return {
      accessToken: localStorage.getItem("access_token"),
      refreshToken: localStorage.getItem("refresh_token"),
    };
  };

  const clearTokens = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  };

  // ==============================================
  // 3. TOKEN REFRESH LOGIC
  // ==============================================
  const refreshToken = useCallback(async () => {
    try {
      const { refreshToken } = getTokens();
      if (!refreshToken) return null;

      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        throw new Error("Token refresh failed");
      }

      const data = await response.json();
      storeTokens(data.access_token, data.refresh_token);
      return data.access_token;
    } catch (error) {
      console.error("Token refresh error:", error);
      clearTokens();
      setUser(null);
      return null;
    }
  }, []);

  // ==============================================
  // 4. TOKEN VERIFICATION
  // ==============================================
  const verifyToken = useCallback(async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Token verification failed");
      }

      return await response.json();
    } catch (error) {
      console.error("Token verification error:", error);
      throw error;
    }
  }, []);

  // ==============================================
  // 5. AUTH INITIALIZATION (MOUNT EFFECT)
  // ==============================================
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { accessToken } = getTokens();
        if (accessToken) {
          const userData = await verifyToken(accessToken);
          setUser(userData);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        clearTokens();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [verifyToken]);

  // ==============================================
  // 6. AUTHENTICATION METHODS
  // ==============================================
  const signIn = useCallback(async (email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Невдалий вхід в систему");
      }

      const data = await response.json();
      storeTokens(data.access_token, data.refresh_token);
      setUser(data.user);
      return data;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  }, []);

  const signUp = useCallback(async (userData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 422) {
          throw { detail: data.detail };
        }
        throw new Error(data.message || "Помилка реєстрації");
      }

      return data;
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  }, []);

  const signOut = useCallback(() => {
    clearTokens();
    setUser(null);
  }, []);

  // ==============================================
  // 7. ROLE CHECKING
  // ==============================================
  const isAdmin = useCallback(() => {
    return user?.role === "admin";
  }, [user]);

  // ==============================================
  // 8. AUTHENTICATED FETCH WRAPPER
  // ==============================================
  const authFetch = useCallback(
    async (endpoint, options = {}) => {
      const url = `${API_BASE_URL}`;
      let { accessToken } = getTokens();

      console.log(`[authFetch] Початковий accessToken: ${accessToken}`);

      if (!accessToken) {
        console.log(
          "[authFetch] Токен доступу не знайдено, спроба оновлення...",
        );
        try {
          accessToken = await refreshToken();
          console.log(`[authFetch] Оновлений accessToken: ${accessToken}`);
          if (!accessToken) {
            throw new Error("Не вдалося оновити токен");
          }
        } catch (refreshError) {
          console.error("[authFetch] Помилка оновлення токена:", refreshError);
          throw new Error("Помилка аутентифікації");
        }
      }

      const headers = {
        ...options.headers,
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      };

      console.log(`[authFetch] Запит на ${url} з заголовками:`, headers);

      try {
        let response = await fetch(url, { ...options, headers });

        if (response.status === 401) {
          console.log(
            "[authFetch] Отримано 401, спроба повторного оновлення...",
          );
          try {
            const newAccessToken = await refreshToken();
            console.log(
              `[authFetch] Оновлений accessToken після 401: ${newAccessToken}`,
            );
            if (!newAccessToken) {
              throw new Error("Не вдалося оновити токен після 401");
            }
            headers.Authorization = `Bearer ${newAccessToken}`;
            console.log(
              `[authFetch] Повторний запит з новим токеном:`,
              headers,
            );
            response = await fetch(url, { ...options, headers });
          } catch (refreshError) {
            console.error(
              "[authFetch] Помилка оновлення токена після 401:",
              refreshError,
            );
            throw new Error("Помилка аутентифікації");
          }
        }

        return response;
      } catch (error) {
        console.error("[authFetch] Помилка запиту:", error);
        throw error;
      }
    },
    [refreshToken],
  );

  // ==============================================
  // 9. CONTEXT VALUE PROVIDER
  // ==============================================
  const value = {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    isAdmin,
    authFetch,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ==============================================
// 10. CUSTOM HOOK FOR CONTEXT ACCESS
// ==============================================
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
