import { useEffect, useRef, useState } from 'react';
import { Film, MapPin, Play } from 'lucide-react';
import type { UnloadingVideo } from '../types/autoTrade.ts';
import { ResilientImage } from './ResilientImage';

interface ContainerVideosSectionProps {
  videos: UnloadingVideo[];
}

function getYouTubeEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtube.com')) {
      const v = parsed.searchParams.get('v');
      return v ? `https://www.youtube.com/embed/${v}` : null;
    }
    if (parsed.hostname === 'youtu.be') {
      const id = parsed.pathname.replace('/', '');
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    return null;
  } catch {
    return null;
  }
}

export function ContainerVideosSection({ videos }: ContainerVideosSectionProps) {
  const [selectedId, setSelectedId] = useState<string>(videos[0]?.id ?? '');
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videos.length > 0 && !videos.some((v) => v.id === selectedId)) {
      setSelectedId(videos[0].id);
    }
  }, [videos, selectedId]);

  if (videos.length === 0) return null;

  const activeVideo = videos.find((v) => v.id === selectedId) ?? videos[0];
  const youtubeEmbed = getYouTubeEmbedUrl(activeVideo.videoUrl);

  const handleSelectVideo = (videoId: string) => {
    setSelectedId(videoId);
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {
          // Ignore autoplay restriction if triggered without gesture
        });
      }
    }, 50);
  };

  return (
    <section
      id="container-unloading-videos"
      className="py-16 sm:py-20 bg-white border-b border-slate-200"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-10">
          <p className="text-sm font-medium text-blue-900 mb-2">
            Container Arrival & Unloading Reels
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-950">
            Cars unloaded straight from shipping containers at Caribbean ports.
          </h2>
          <p className="mt-3 text-base text-slate-600 leading-relaxed">
            Inspect how 20ft and 40ft container shipments arrive braced and protected from Japan,
            then roll smoothly down steel ramps onto island port docks.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Active Video Player */}
          <div className="lg:col-span-8 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
            <div className="aspect-video w-full bg-zinc-950 relative">
              {youtubeEmbed ? (
                <iframe
                  src={youtubeEmbed}
                  title={activeVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              ) : (
                <video
                  ref={videoRef}
                  key={activeVideo.id}
                  src={activeVideo.videoUrl}
                  poster={activeVideo.posterUrl}
                  controls
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border-t border-slate-200">
              <div>
                <h3 className="font-display text-lg font-semibold text-zinc-950">
                  {activeVideo.title}
                </h3>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                  <span className="inline-flex items-center gap-1 text-blue-900 font-medium">
                    <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                    {activeVideo.portLabel}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{activeVideo.containerType}</span>
                </div>
              </div>

              <div className="text-xs font-medium text-slate-500 whitespace-nowrap shrink-0">
                {activeVideo.vehicleSummary}
              </div>
            </div>
          </div>

          {/* Playlist Selector */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500 px-1">
              <span className="inline-flex items-center gap-1.5">
                <Film className="w-3.5 h-3.5 text-blue-900" aria-hidden="true" />
                <span>Unloading Clips ({videos.length})</span>
              </span>
              <span>Select to play</span>
            </div>

            <div className="space-y-3">
              {videos.map((clip) => {
                const isActive = clip.id === activeVideo.id;
                return (
                  <button
                    key={clip.id}
                    type="button"
                    onClick={() => handleSelectVideo(clip.id)}
                    aria-pressed={isActive}
                    className={`w-full text-left p-3 rounded-xl border transition-colors flex gap-3.5 items-center cursor-pointer ${
                      isActive
                        ? 'border-blue-900 bg-blue-50/60'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="relative w-28 aspect-video rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                      <ResilientImage
                        src={clip.posterUrl}
                        alt={clip.title}
                        fallbackTitle={clip.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-zinc-950/25 flex items-center justify-center">
                        <span className="w-7 h-7 rounded-md bg-zinc-950/80 text-white inline-flex items-center justify-center">
                          <Play className="w-3.5 h-3.5 fill-current ml-0.5" aria-hidden="true" />
                        </span>
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-zinc-950 line-clamp-2 leading-snug">
                        {clip.title}
                      </div>
                      <div className="mt-1 text-xs text-blue-900 font-medium truncate">
                        {clip.portLabel}
                      </div>
                      <div className="mt-0.5 text-[11px] font-mono text-slate-500 tabular-nums">
                        {clip.durationLabel} · {clip.containerType}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
