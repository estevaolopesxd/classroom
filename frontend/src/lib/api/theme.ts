import api from "./client";
import type { Theme } from "@/types";

export const themeApi = {
  getActive: () =>
    api.get<Theme>("/api/theme").then((r) => r.data),

  update: (data: Partial<Theme>) =>
    api.put<Theme>("/api/theme", data).then((r) => r.data),
};
