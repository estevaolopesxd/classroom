import api from "./client";
import type { CourseProgress, ContinueWatching } from "@/types";

export const progressApi = {
  update: (lessonId: string, watchedSeconds: number, isCompleted = false) =>
    api.post(`/api/progress/lessons/${lessonId}`, { watchedSeconds, isCompleted }).then((r) => r.data),

  getCourseProgress: (courseId: string) =>
    api.get<CourseProgress>(`/api/courses/${courseId}/progress`).then((r) => r.data),

  getContinueWatching: () =>
    api.get<ContinueWatching[]>("/api/progress/continue").then((r) => r.data),
};
