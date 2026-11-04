'use client';

import { useEffect, useRef } from 'react';
import Hls from 'hls.js';

export function VideoPlayer({
  src,
  poster,
  onTimeUpdate,
}: {
  src?: string | null;
  poster?: string;
  onTimeUpdate?: (seconds: number) => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video || !src) return;
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      return;
    }
    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: false });
      hls.on(Hls.Events.ERROR, () => {
        /* evitar crash si el manifiesto HLS demo no está disponible */
      });
      hls.loadSource(src);
      hls.attachMedia(video);
      return () => hls.destroy();
    }
  }, [src]);

  return (
    <div
      className="relative aspect-video overflow-hidden rounded-none bg-black md:rounded-[20px]"
      style={poster ? { backgroundImage: `url(${poster})`, backgroundSize: 'cover' } : undefined}
    >
      <video
        ref={ref}
        className="h-full w-full object-cover"
        controls
        playsInline
        onTimeUpdate={(e) => onTimeUpdate?.(Math.floor(e.currentTarget.currentTime))}
      />
      {!src && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40">
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-3xl">▶</span>
        </div>
      )}
    </div>
  );
}
