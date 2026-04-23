import api from "./client";
import type { Purchase } from "@/types";

export const paymentsApi = {
  createCheckout: (courseId: string) =>
    api.post<{ checkoutUrl: string; sessionId: string }>("/api/payments/checkout", { courseId }).then((r) => r.data),

  getHistory: () =>
    api.get<Purchase[]>("/api/payments/history").then((r) => r.data),
};
