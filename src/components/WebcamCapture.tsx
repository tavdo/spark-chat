"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "./ui";
import { Camera, RefreshCcw } from "lucide-react";

type Props = {
  onCapture: (blob: Blob) => void;
  previewUrl?: string | null;
};

export function WebcamCapture({ onCapture, previewUrl }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [shot, setShot] = useState<string | null>(previewUrl ?? null);

  useEffect(() => {
    let cancelled = false;
    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: 720, height: 720 },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setReady(true);
        }
      } catch {
        setError("Camera access is required for verification. Allow the webcam and try again.");
      }
    }
    if (!shot) void start();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [shot]);

  function capture() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    const size = Math.min(video.videoWidth || 720, video.videoHeight || 720);
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const sx = (video.videoWidth - size) / 2;
    const sy = (video.videoHeight - size) / 2;
    ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        setShot(URL.createObjectURL(blob));
        streamRef.current?.getTracks().forEach((t) => t.stop());
        onCapture(blob);
      },
      "image/jpeg",
      0.9
    );
  }

  function retake() {
    setShot(null);
    setReady(false);
  }

  return (
    <div className="space-y-3">
      <div className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-3xl border border-border bg-black">
        {shot ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shot} alt="Captured face" className="h-full w-full object-cover" />
        ) : (
          <video
            ref={videoRef}
            playsInline
            muted
            className="h-full w-full scale-x-[-1] object-cover"
          />
        )}
        {!shot && (
          <div className="pointer-events-none absolute inset-6 rounded-full border border-accent/40" />
        )}
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex justify-center gap-3">
        {shot ? (
          <Button type="button" className="bg-[#7c3aed] text-white hover:bg-[#6d28d9]" onClick={retake}>
            <RefreshCcw className="h-4 w-4" />
            Retake
          </Button>
        ) : (
          <Button type="button" onClick={capture} disabled={!ready}>
            <Camera className="h-4 w-4" />
            Capture face photo
          </Button>
        )}
      </div>
      <p className="text-center text-xs text-muted">
        Live capture only — this photo is used for gender and identity checks, and is visible to admins.
      </p>
    </div>
  );
}
