import api from "./client";
import type { TokenResponse, User } from "@/types";

export const authApi = {
  login: (email: string, password: string) =>
    api.post<TokenResponse>("/api/auth/login", { email, password }).then((r) => r.data),

  refresh: () =>
    api.post<TokenResponse>("/api/auth/refresh").then((r) => r.data),

  revoke: () =>
    api.post("/api/auth/revoke"),

  me: () =>
    api.get<User>("/api/auth/me").then((r) => r.data),
};
