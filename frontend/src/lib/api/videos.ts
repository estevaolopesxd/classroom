import api from "./client";
import type { UploadInitResponse, Video } from "@/types";

export const videosApi = {
  initiateUpload: (data: { fileName: string; fileSize: number; contentType: string; title?: string }) =>
    api.post<UploadInitResponse>("/api/videos/upload/initiate", data).then((r) => r.data),

  completeUpload: (data: { videoId: string; uploadId: string; parts: Array<{ partNumber: number; eTag: string }> }) =>
    api.post<Video>("/api/videos/upload/complete", data).then((r) => r.data),

  abortUpload: (videoId: string, uploadId: string) =>
    api.post("/api/videos/upload/abort", { videoId, uploadId }),

  getPlayUrl: (id: string) =>
    api.get<{ url: string; hlsKey: string }>(`/api/videos/${id}/play-url`).then((r) => r.data),

  getStatus: (id: string) =>
    api.get<Video>(`/api/videos/${id}/status`).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/api/videos/${id}`),
};
