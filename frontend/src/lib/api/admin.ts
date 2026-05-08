import api from "./client";
import type { AdminDashboard, User } from "@/types";

export const adminApi = {
  getDashboard: () =>
    api.get<AdminDashboard>("/api/admin/dashboard").then((r) => r.data),

  getCourseAnalytics: (courseId: string) =>
    api.get(`/api/admin/courses/${courseId}/analytics`).then((r) => r.data),

  // Users
  getUsers: (page = 1, pageSize = 20) =>
    api.get<User[]>("/api/users", { params: { page, pageSize } }).then((r) => ({
      data: r.data,
      total: parseInt(r.headers["x-total-count"] || "0"),
    })),

  getUser: (id: string) =>
    api.get<User>(`/api/users/${id}`).then((r) => r.data),

  createUser: (data: { email: string; password: string; firstName: string; lastName: string; role: string }) =>
    api.post<User>("/api/users", data).then((r) => r.data),

  updateUser: (id: string, data: Partial<User>) =>
    api.put<User>(`/api/users/${id}`, data).then((r) => r.data),

  getUserProgress: (id: string) =>
    api.get(`/api/users/${id}/progress`).then((r) => r.data),

  // Enrollment management
  getEnrollments: (userId: string) =>
    api.get(`/api/users/${userId}/enrollments`).then((r) => r.data),

  addEnrollment: (userId: string, courseId: string) =>
    api.post(`/api/users/${userId}/enrollments`, { courseId }).then((r) => r.data),

  removeEnrollment: (userId: string, courseId: string) =>
    api.delete(`/api/users/${userId}/enrollments/${courseId}`),

  // Certificates
  getCertificateConfig: () =>
    api.get("/api/admin/certificates/config").then((r) => r.data),

  saveCertificateConfig: (data: object) =>
    api.put("/api/admin/certificates/config", data).then((r) => r.data),

  addSponsor: (data: { name: string; logoUrl: string; order: number }) =>
    api.post("/api/admin/certificates/config/sponsors", data).then((r) => r.data),

  updateSponsor: (id: string, data: { name: string; logoUrl: string; order: number }) =>
    api.put(`/api/admin/certificates/config/sponsors/${id}`, data).then((r) => r.data),

  deleteSponsor: (id: string) =>
    api.delete(`/api/admin/certificates/config/sponsors/${id}`),

  getAllCertificates: (page = 1, pageSize = 20) =>
    api.get("/api/admin/certificates", { params: { page, pageSize } }).then((r) => ({
      data: r.data,
      total: parseInt(r.headers["x-total-count"] || "0"),
    })),

  issueCertificate: (userId: string, courseId: string) =>
    api.post("/api/admin/certificates/issue", { userId, courseId }).then((r) => r.data),

  // Streams
  getStreams: () =>
    api.get("/api/streams").then((r) => r.data),

  createStream: (data: { title: string; scheduledAt?: string }) =>
    api.post("/api/streams", data).then((r) => r.data),

  endStream: (id: string) =>
    api.post(`/api/streams/${id}/end`).then((r) => r.data),
};
