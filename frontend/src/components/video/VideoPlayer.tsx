"use client";

import { useEffect, useRef, useState } from "react";
import { progressApi } from "@/lib/api/progress";

interface VideoPlayerProps {
  hlsUrl: string;
  lessonId: string;
  initialSeconds?: number;
  onComplete?: () => void;
}

export function VideoPlayer({ hlsUrl, lessonId, initialSeconds = 0, onComplete }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<any>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval>>(null);
  const [isReady, setIsReady] = useState(false);
  const lastReportedRef = useRef(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const loadHls = async () => {
      const Hls = (await import("hls.js")).default;

      if (Hls.isSupported()) {
        const hls = new Hls({ enableWorker: false });
        hlsRef.current = hls;
        hls.loadSource(hlsUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setIsReady(true);
          if (initialSeconds > 0) {
            video.currentTime = initialSeconds;
          }
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        // Safari native HLS
        video.src = hlsUrl;
        setIsReady(true);
        if (initialSeconds > 0) video.currentTime = initialSeconds;
      }
    };

    loadHls();

    return () => {
      hlsRef.current?.destroy();
    };
  }, [hlsUrl, initialSeconds]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (Math.abs(video.currentTime - lastReportedRef.current) >= 10) {
        lastReportedRef.current = video.currentTime;
        progressApi.update(lessonId, Math.floor(video.currentTime)).catch(() => {});
      }
    };

    const handleEnded = () => {
      progressApi.update(lessonId, Math.floor(video.duration), true).then(() => {
        onComplete?.();
      }).catch(() => {});
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("ended", handleEnded);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("ended", handleEnded);
    };
  }, [lessonId, onComplete]);

  return (
    <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden">
      <video
        ref={videoRef}
        className="w-full h-full"
        controls
        playsInline
        preload="metadata"
      />
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="size-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
      )}
    </div>
  );
}
