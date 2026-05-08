import api from "./client";
import type { Course, CourseDetail, Module, Lesson } from "@/types";

export const coursesApi = {
  getAll: (params?: { page?: number; pageSize?: number; published?: boolean }) =>
    api.get<Course[]>("/api/courses", { params }).then((r) => ({
      data: r.data,
      total: parseInt(r.headers["x-total-count"] || "0"),
    })),

  getMy: () =>
    api.get<Course[]>("/api/courses/my").then((r) => r.data),

  getById: (id: string) =>
    api.get<CourseDetail>(`/api/courses/${id}`).then((r) => r.data),

  getBySlug: (slug: string) =>
    api.get<CourseDetail>(`/api/courses/slug/${slug}`).then((r) => r.data),

  create: (data: { title: string; description?: string; shortDescription?: string; level?: string; price?: number; currency?: string }) =>
    api.post<Course>("/api/courses", data).then((r) => r.data),

  update: (id: string, data: Partial<Course>) =>
    api.put<Course>(`/api/courses/${id}`, data).then((r) => r.data),

  publish: (id: string) =>
    api.post<Course>(`/api/courses/${id}/publish`).then((r) => r.data),

  archive: (id: string) =>
    api.post<Course>(`/api/courses/${id}/archive`).then((r) => r.data),

  updateSaleSettings: (id: string, data: { isForSale: boolean; price?: number; currency?: string }) =>
    api.patch<Course>(`/api/courses/${id}/sale-settings`, data).then((r) => r.data),

  enrollFree: (id: string) =>
    api.post(`/api/courses/${id}/enroll-free`).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/api/courses/${id}`),

  getProgress: (id: string) =>
    api.get(`/api/courses/${id}/progress`).then((r) => r.data),

  uploadThumbnail: (id: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post<Course>(`/api/courses/${id}/thumbnail`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.data);
  },

  // Modules
  getModules: (courseId: string) =>
    api.get<Module[]>(`/api/courses/${courseId}/modules`).then((r) => r.data),

  createModule: (courseId: string, data: { title: string; description?: string; isIntro?: boolean }) =>
    api.post<Module>(`/api/courses/${courseId}/modules`, data).then((r) => r.data),

  updateModule: (courseId: string, id: string, data: Partial<Module>) =>
    api.put<Module>(`/api/courses/${courseId}/modules/${id}`, data).then((r) => r.data),

  deleteModule: (courseId: string, id: string) =>
    api.delete(`/api/courses/${courseId}/modules/${id}`),

  reorderModules: (courseId: string, orderedIds: string[]) =>
    api.patch(`/api/courses/${courseId}/modules/reorder`, { orderedIds }),

  // Lessons
  getLessons: (moduleId: string) =>
    api.get<Lesson[]>(`/api/modules/${moduleId}/lessons`).then((r) => r.data),

  createLesson: (moduleId: string, data: { title: string; description?: string; type?: string; isFreePreview?: boolean; textContent?: string }) =>
    api.post<Lesson>(`/api/modules/${moduleId}/lessons`, data).then((r) => r.data),

  updateLesson: (moduleId: string, id: string, data: Partial<Lesson>) =>
    api.put<Lesson>(`/api/modules/${moduleId}/lessons/${id}`, data).then((r) => r.data),

  deleteLesson: (moduleId: string, id: string) =>
    api.delete(`/api/modules/${moduleId}/lessons/${id}`),

  reorderLessons: (moduleId: string, orderedIds: string[]) =>
    api.patch(`/api/modules/${moduleId}/lessons/reorder`, { orderedIds }),
};
