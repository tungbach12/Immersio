export interface UserDto {
  id: string;
  username: string;
  email: string;
  subscriptionTier?: string;
  subscriptionExpiresAt?: string | null;
  streakCount?: number;
  experiencePoints?: number;
  learningHours?: number;
  currentLanguageLevel?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserDto;
}

const BASE_URL = "http://localhost:5249/api/auth";

export const authService = {
  getAccessToken(): string | null {
    return localStorage.getItem("accessToken");
  },

  getRefreshToken(): string | null {
    return localStorage.getItem("refreshToken");
  },

  getUser(): UserDto | null {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  },

  updateUser(user: UserDto) {
    localStorage.setItem("user", JSON.stringify(user));
  },

  setSession(accessToken: string, refreshToken: string, user: UserDto) {
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("user", JSON.stringify(user));
  },

  clearSession() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
  },

  async register(username: string, email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${BASE_URL}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, email, password }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: "Registration failed" }));
      throw new Error(err.detail || "Registration failed");
    }

    const res = await response.json();
    const data: AuthResponse = res.data;
    this.setSession(data.accessToken, data.refreshToken, data.user);
    return data;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${BASE_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: "Login failed" }));
      throw new Error(err.detail || "Login failed");
    }

    const res = await response.json();
    const data: AuthResponse = res.data;
    this.setSession(data.accessToken, data.refreshToken, data.user);
    return data;
  },

  async refreshToken(): Promise<string> {
    const accessToken = this.getAccessToken();
    const refreshToken = this.getRefreshToken();

    if (!accessToken || !refreshToken) {
      throw new Error("No active session to refresh");
    }

    const response = await fetch(`${BASE_URL}/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ accessToken, refreshToken }),
    });

    if (!response.ok) {
      this.clearSession();
      throw new Error("Session expired, please login again");
    }

    const res = await response.json();
    const data: AuthResponse = res.data;
    this.setSession(data.accessToken, data.refreshToken, data.user);
    return data.accessToken;
  },

  async revokeToken(): Promise<void> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return;

    try {
      await this.fetchWithAuth(`${BASE_URL}/revoke`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });
    } catch (e) {
      console.error("Failed to revoke token on backend", e);
    } finally {
      this.clearSession();
    }
  },

  // Helper function to make authenticated requests with auto-refresh mechanism
  async fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    let token = this.getAccessToken();
    if (!token) {
      throw new Error("No active session");
    }

    options.headers = {
      ...options.headers,
      "Authorization": `Bearer ${token}`,
    };

    let response = await fetch(url, options);

    // If unauthorized, attempt to rotate / refresh token
    if (response.status === 401) {
      try {
        token = await this.refreshToken();
        options.headers = {
          ...options.headers,
          "Authorization": `Bearer ${token}`,
        };
        response = await fetch(url, options);
      } catch (refreshErr) {
        this.clearSession();
        window.location.href = "/login";
        throw refreshErr;
      }
    }

    // Intercept response.json() to unwrap success responses automatically
    if (response.ok) {
      const originalJson = response.json.bind(response);
      response.json = async () => {
        const jsonVal = await originalJson();
        if (jsonVal && typeof jsonVal === "object" && jsonVal.success === true && "data" in jsonVal) {
          return jsonVal.data;
        }
        return jsonVal;
      };
    }

    return response;
  },

  async getMe(): Promise<UserDto> {
    const response = await this.fetchWithAuth(`${BASE_URL}/me`);
    if (!response.ok) {
      throw new Error("Failed to fetch user profile");
    }
    return response.json();
  }
};
