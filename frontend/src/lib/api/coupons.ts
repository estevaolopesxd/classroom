import api from "./client";

export interface CouponDto {
  id: string;
  code: string;
  discountPercent: number;
  courseId: string | null;
  courseTitle: string | null;
  coursePrice: number | null;
  courseCurrency: string | null;
  isActive: boolean;
  expiresAt: string | null;
  maxUses: number | null;
  usedCount: number;
  createdAt: string;
}

export interface CreateCouponRequest {
  code?: string | null;
  discountPercent: number;
  courseId?: string | null;
  isActive?: boolean;
  expiresAt?: string | null;
  maxUses?: number | null;
}

export interface UpdateCouponRequest {
  code?: string | null;
  discountPercent?: number | null;
  courseId?: string | null;
  isActive?: boolean | null;
  expiresAt?: string | null;
  maxUses?: number | null;
}

export interface ValidateCouponResponse {
  valid: boolean;
  message: string | null;
  couponId: string | null;
  code: string | null;
  discountPercent: number;
  originalPrice: number;
  finalPrice: number;
  savedAmount: number;
}

export const couponsApi = {
  getAll: () =>
    api.get<CouponDto[]>("/api/coupons").then((r) => r.data),

  getById: (id: string) =>
    api.get<CouponDto>(`/api/coupons/${id}`).then((r) => r.data),

  create: (data: CreateCouponRequest) =>
    api.post<CouponDto>("/api/coupons", data).then((r) => r.data),

  update: (id: string, data: UpdateCouponRequest) =>
    api.put<CouponDto>(`/api/coupons/${id}`, data).then((r) => r.data),

  toggle: (id: string) =>
    api.post<CouponDto>(`/api/coupons/${id}/toggle`).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/api/coupons/${id}`),

  generateCode: () =>
    api.post<{ code: string }>("/api/coupons/generate-code").then((r) => r.data),

  validate: (code: string, courseId: string) =>
    api
      .post<ValidateCouponResponse>("/api/coupons/validate", { code, courseId })
      .then((r) => r.data),
};
