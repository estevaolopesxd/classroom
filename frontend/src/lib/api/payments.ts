import api from "./client";
import type { Purchase } from "@/types";

export const paymentsApi = {
  createCheckout: (courseId: string, couponCode?: string) =>
    api
      .post<{ checkoutUrl: string | null; sessionId: string | null; isFree: boolean }>(
        "/api/payments/checkout",
        { courseId, couponCode }
      )
      .then((r) => r.data),

  getHistory: () =>
    api.get<Purchase[]>("/api/payments/history").then((r) => r.data),
};
