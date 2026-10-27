import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  audioFolderHint,
  getTrack,
  recordedCount,
  resolvedTracks,
  totalTracks,
  type AudioTrackId,
  type ResolvedTrack,
} from "../audio";
import { Icon, Reveal, cn } from "./ui";

type PlaybackController = { stop: () => void };
let activePlayback: PlaybackController | null = null;

function claimPlayback(controller: PlaybackController) {
  if (activePlayback && activePlayback !== controller) activePlayback.stop();
  activePlayback = controller;
}

function releasePlayback(controller: PlaybackController) {
  if (activePlayback === controller) activePlayback = null;
}

const arabicVoice = () => {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return undefined;
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((voice) => voice.lang.toLowerCase().startsWith("ar-sa")) ??
    voices.find((voice) => voice.lang.toLowerCase().startsWith("ar"))
  );
};

const toArabicDigits = (value: string) => value.replace(/\d/g, (digit) => "٠١٢٣٤٥٦٧٨٩"[Number(digit)]);

export function formatAudioTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "٠:٠٠";
  const minutes = Math.floor(seconds / 60);
  const rest = Math.floor(seconds % 60);
  return toArabicDigits(`${minutes}:${rest.toString().padStart(2, "0")}`);
}

export function useLessonAudio(track: ResolvedTrack) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const ttsSupported = typeof window !== "undefined" && "speechSynthesis" in window;
  const hasRecording = Boolean(track.src);
  const canPlay = hasRecording || ttsSupported;

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      try {
        audio.currentTime = 0;
      } catch {
        /* العنصر لم يحمّل بعد */
      }
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setPlaying(false);
    setProgress(0);
  }, []);

  const controller = useMemo<PlaybackController>(() => ({ stop }), [stop]);

  useEffect(() => {
    return () => {
      if (activePlayback === controller) {
        stop();
        activePlayback = null;
      }
    };
  }, [controller, stop]);

  const toggle = useCallback(() => {
    setError(null);

    if (playing) {
      stop();
      releasePlayback(controller);
      return;
    }

    claimPlayback(controller);

    if (hasRecording && audioRef.current) {
      const audio = audioRef.current;
      audio.currentTime = 0;
      audio
        .play()
        .then(() => setPlaying(true))
        .catch(() => {
          setError("تعذّر تشغيل التسجيل الصوتي.");
          releasePlayback(controller);
        });
      return;
    }

    if (!ttsSupported) {
      setError("الاستماع غير مدعوم في هذا المتصفح.");
      releasePlayback(controller);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(
      track.text.replace(/[«»ﷺ()]/g, " ").replace(/\s+/g, " "),
    );
    utterance.lang = "ar-SA";
    utterance.rate = 0.82;
    utterance.pitch = 1;
    const voice = arabicVoice();
    if (voice) utterance.voice = voice;
    utterance.onend = () => {
      setPlaying(false);
      releasePlayback(controller);
    };
    utterance.onerror = () => {
      setPlaying(false);
      releasePlayback(controller);
    };
    window.speechSynthesis.speak(utterance);
    setPlaying(true);
  }, [controller, hasRecording, playing, stop, track.text, ttsSupported]);

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    setProgress((audio.currentTime / audio.duration) * 100);
  };

  const handleLoadedMetadata = () => {
    const audio = audioRef.current;
    if (!audio) return;
    setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
  };

  const handleEnded = () => {
    setPlaying(false);
    setProgress(0);
    releasePlayback(controller);
  };

  const handleError = () => {
    setPlaying(false);
    setError("تعذّر تحميل ملف التسجيل، ويمكن استخدام الاستماع الآلي.");
    releasePlayback(controller);
  };

  const seek = (ratio: number) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    const clamped = Math.max(0, Math.min(1, ratio));
    audio.currentTime = clamped * audio.duration;
    setProgress(clamped * 100);
  };

  const audioProps = {
    ref: audioRef,
    src: track.src ?? undefined,
    preload: "metadata" as const,
    onTimeUpdate: handleTimeUpdate,
    onLoadedMetadata: handleLoadedMetadata,
    onEnded: handleEnded,
    onError: handleError,
    className: "hidden",
    "aria-hidden": true as const,
  };

  return {
    playing,
    progress,
    duration,
    error,
    canPlay,
    hasRecording,
    source: track.source,
    toggle,
    stop,
    seek,
    audioProps,
  };
}

export function ListenButton({
  trackId,
  label = "استمع للحديث",
  variant = "default",
  iconOnly = false,
  className,
}: {
  trackId: AudioTrackId;
  label?: string;
  variant?: "default" | "light";
  iconOnly?: boolean;
  className?: string;
}) {
  const track = getTrack(trackId);
  const player = useLessonAudio(track);

  if (iconOnly) {
    return (
      <div className={cn("inline-flex flex-col items-center gap-1", className)}>
        <audio {...player.audioProps} />
        <button
          type="button"
          onClick={player.toggle}
          disabled={!player.canPlay}
          aria-pressed={player.playing}
          aria-label={player.playing ? "إيقاف الاستماع للحديث" : "استمع لحديث عبدالله بن مسعود رضي الله عنه"}
          title={
            player.error
              ? player.error
              : player.playing
                ? "إيقاف الاستماع"
                : player.hasRecording
                  ? "تشغيل التسجيل الصوتي للحديث"
                  : "استمع للحديث (قراءة آلية)"
          }
          className={cn(
            "group relative grid h-11 w-11 place-items-center rounded-full border-2 shadow-sm transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50",
            player.playing
              ? "border-gold-400 bg-brand-700 text-gold-400 shadow-[0_10px_22px_-10px_rgba(14,93,87,0.8)]"
              : "border-brand-200 bg-white text-brand-700 hover:border-brand-500 hover:bg-brand-50",
          )}
        >
          <Icon name={player.playing ? "stop" : "sound"} className="h-5 w-5" />
          <span
            className={cn(
              "absolute -bottom-0.5 -left-0.5 h-2.5 w-2.5 rounded-full border-2 border-white",
              player.hasRecording ? "bg-gold-400" : "bg-brand-400",
            )}
            aria-hidden="true"
          />
          {player.playing && <span className="absolute inset-0 animate-ping rounded-full border border-gold-400/50" aria-hidden="true" />}
        </button>
        <span className="text-[8px] font-extrabold text-muted">
          {player.playing ? "إيقاف" : "استماع"}
        </span>
        {player.error && (
          <span role="alert" className="max-w-[90px] text-center text-[8px] font-bold leading-3 text-clay-500">
            {player.error}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={cn("inline-flex flex-col items-stretch gap-1", className)}>
      <audio {...player.audioProps} />
      <button
        type="button"
        onClick={player.toggle}
        disabled={!player.canPlay}
        aria-pressed={player.playing}
        title={player.hasRecording ? "تسجيل صوتي للدرس" : "استماع آلي من المتصفح"}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-bold transition-all disabled:cursor-not-allowed disabled:opacity-50",
          variant === "light"
            ? "border-white/25 bg-white/10 text-white hover:border-white/45 hover:bg-white/20"
            : "border-brand-200 bg-white/90 text-brand-700 hover:border-brand-400 hover:bg-brand-50",
          player.playing && (variant === "light" ? "border-gold-400/70 bg-white/20" : "border-brand-500 bg-brand-50 text-brand-800"),
        )}
      >
        <Icon name={player.playing ? "stop" : "sound"} className="h-4 w-4" />
        {player.playing ? "إيقاف الاستماع" : label}
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            player.hasRecording ? "bg-gold-400" : variant === "light" ? "bg-white/50" : "bg-brand-300",
          )}
          title={player.hasRecording ? "تسجيل جاهز" : "قراءة آلية"}
        />
      </button>

      {player.playing && player.hasRecording && (
        <div
          className={cn(
            "h-1 w-full overflow-hidden rounded-full",
            variant === "light" ? "bg-white/20" : "bg-brand-100",
          )}
          aria-hidden="true"
        >
          <div
            className="h-full rounded-full bg-gold-400 transition-[width] duration-300"
            style={{ width: `${player.progress}%` }}
          />
        </div>
      )}

      {player.error && (
        <span role="alert" className="max-w-[190px] text-[9px] font-bold leading-4 text-clay-500">
          {player.error}
        </span>
      )}
    </div>
  );
}

function TrackRow({ track, index }: { track: ResolvedTrack; index: number }) {
  const player = useLessonAudio(track);

  return (
    <div className="flex items-center gap-3 px-2 py-3 sm:px-3">
      <span
        className={cn(
          "grid h-9 w-9 shrink-0 place-items-center rounded-xl font-display text-[11px] font-extrabold transition-colors",
          player.playing ? "bg-gold-400 text-brand-900" : "bg-brand-50 text-brand-600",
        )}
      >
        {track.order}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <h3 className="truncate text-xs font-extrabold text-brand-900">{track.title}</h3>
          <span className="rounded-full bg-sand-100 px-1.5 py-0.5 text-[9px] font-bold text-gold-600">
            {track.section}
          </span>
          {track.source === "recording" ? (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-brand-50 px-1.5 py-0.5 text-[9px] font-bold text-brand-600">
              <Icon name="check" className="h-2.5 w-2.5" />
              تسجيل
            </span>
          ) : (
            <span className="rounded-full bg-brand-50/60 px-1.5 py-0.5 text-[9px] font-medium text-muted">
              قراءة آلية
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate text-[10px] font-medium text-muted">{track.description}</p>

        {track.source === "recording" && (player.playing || player.progress > 0) && (
          <div className="mt-1.5 flex items-center gap-2">
            <button
              type="button"
              aria-label="شريط تقدّم المقطع الصوتي"
              onClick={(event) => {
                const rect = event.currentTarget.getBoundingClientRect();
                const ratio = (event.clientX - rect.left) / rect.width;
                player.seek(ratio);
              }}
              className="group relative h-1.5 flex-1 overflow-hidden rounded-full bg-brand-100"
            >
              <span
                className="absolute inset-y-0 left-0 rounded-full bg-brand-500 transition-[width] duration-300"
                style={{ width: `${player.progress}%` }}
              />
            </button>
            <span className="shrink-0 text-[9px] font-bold tabular-nums text-muted">
              {formatAudioTime((player.progress / 100) * player.duration)}
            </span>
          </div>
        )}
        {player.error && (
          <p role="alert" className="mt-1 text-[9px] font-bold text-clay-500">
            {player.error}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={player.toggle}
        disabled={!player.canPlay}
        aria-label={player.playing ? `إيقاف ${track.title}` : `تشغيل ${track.title}`}
        aria-pressed={player.playing}
        className={cn(
          "grid h-9 w-9 shrink-0 place-items-center rounded-full shadow-sm transition-all active:scale-95 disabled:opacity-40",
          player.playing
            ? "bg-brand-700 text-gold-400"
            : "bg-white text-brand-700 ring-1 ring-brand-200 hover:bg-brand-50 hover:ring-brand-400",
          index === 0 && !player.playing ? "" : "",
        )}
        title={track.source === "recording" ? "تسجيل صوتي جاهز" : "قراءة آلية"}
      >
        <Icon name={player.playing ? "stop" : "arrow"} className={cn("h-4 w-4", !player.playing && "rotate-180")} />
      </button>
      <audio {...player.audioProps} />
    </div>
  );
}

export function AudioLibrary() {
  return (
    <section id="audio" aria-labelledby="audio-title" className="no-print relative pb-2">
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-[26px] border border-brand-100 bg-white/90 shadow-soft">
            <div className="grid lg:grid-cols-[0.78fr_1.22fr]">
              <div className="relative overflow-hidden bg-brand-800 p-5 text-white sm:p-7">
                <div className="pattern-grid pointer-events-none absolute inset-0 opacity-30" aria-hidden="true" />
                <Icon
                  name="sound"
                  className="pointer-events-none absolute -bottom-6 -left-6 h-32 w-32 text-white/[0.06]"
                />
                <div className="relative">
                  <span className="mb-3 inline-grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-gold-400 ring-1 ring-white/20">
                    <Icon name="sound" className="h-5 w-5" />
                  </span>
                  <h2 id="audio-title" className="font-display text-lg font-extrabold sm:text-xl">
                    المكتبة الصوتية للدرس
                  </h2>
                  <p className="mt-1.5 text-[11px] leading-6 text-brand-100/85">
                    استمع إلى أحاديث الدرس ومقدّمته، مع إمكانية تشغيل تسجيلات المعلّم عند توفرها.
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold text-sand-100 ring-1 ring-white/15">
                      <Icon name="book" className="h-3 w-3 text-gold-400" />
                      {totalTracks.toLocaleString("ar-EG")} مقاطع
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ring-1",
                        recordedCount > 0
                          ? "bg-gold-400/20 text-gold-400 ring-gold-400/30"
                          : "bg-white/5 text-brand-100/80 ring-white/15",
                      )}
                    >
                      <Icon name={recordedCount > 0 ? "check" : "sound"} className="h-3 w-3" />
                      {recordedCount > 0
                        ? `${recordedCount.toLocaleString("ar-EG")} تسجيلات جاهزة`
                        : "الاستماع الآلي مفعّل"}
                    </span>
                  </div>

                  <details className="group mt-4 rounded-xl border border-white/15 bg-white/5 p-3">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-[11px] font-bold text-brand-100">
                      <span className="flex items-center gap-1.5">
                        <Icon name="pen" className="h-3.5 w-3.5 text-gold-400" />
                        للمعلّم: إضافة التسجيلات الصوتية
                      </span>
                      <Icon name="arrow" className="h-3.5 w-3.5 rotate-90 transition-transform group-open:-rotate-90" />
                    </summary>
                    <div className="mt-2.5 space-y-2 border-t border-white/10 pt-2.5">
                      <p className="text-[10px] leading-5 text-brand-100/75">
                        ضع الملفات في <code className="rounded bg-white/10 px-1 py-0.5 text-gold-400">{audioFolderHint}</code>{" "}
                        بالأسماء التالية، وسيتحول الاستماع إليها تلقائيًا:
                      </p>
                      <ul className="space-y-1">
                        {resolvedTracks.map((track) => (
                          <li key={track.id} className="flex items-center justify-between gap-2 text-[10px]">
                            <span className="truncate text-brand-100/80">{track.title}</span>
                            <code
                              className={cn(
                                "shrink-0 rounded px-1.5 py-0.5 font-mono text-[9px]",
                                track.source === "recording"
                                  ? "bg-gold-400/20 text-gold-400"
                                  : "bg-white/10 text-brand-100/80",
                              )}
                              dir="ltr"
                            >
                              {track.filename}.mp3
                            </code>
                          </li>
                        ))}
                      </ul>
                      <p className="text-[9px] leading-5 text-brand-100/50">
                        الصيغ المقبولة: mp3، m4a، ogg، wav. يمكن إرسال الملفات في المحادثة لربطها مباشرة.
                      </p>
                    </div>
                  </details>
                </div>
              </div>

              <div className="p-2 sm:p-3">
                <div className="flex items-center justify-between px-2 pb-1 pt-1 sm:px-3">
                  <p className="text-[10px] font-bold text-brand-500">مقاطع الدرس</p>
                  <span className="inline-flex items-center gap-1 text-[9px] font-medium text-muted">
                    <span className="h-1.5 w-1.5 rounded-full bg-gold-400" />
                    تسجيل
                    <span className="mx-1 h-2.5 w-px bg-brand-100" />
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-300" />
                    قراءة آلية
                  </span>
                </div>
                <div className="divide-y divide-brand-50">
                  {resolvedTracks.map((track, index) => (
                    <TrackRow key={track.id} track={track} index={index} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
