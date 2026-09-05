"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Flag,
  ImagePlus,
  Mic,
  MoreHorizontal,
  Send,
  ShieldBan,
  SkipForward,
  Sticker,
  Square,
} from "lucide-react";
import { BrandArt, Button, SparkMark } from "./ui";
import { REPORT_REASONS } from "@/lib/constants";
import { cn, formatGender } from "@/lib/utils";

type Phase = "idle" | "searching" | "chatting" | "ended";

type ChatMessage = {
  id: string;
  senderId: string;
  type: "TEXT" | "PHOTO" | "VOICE" | "GIF";
  content: string;
  waveform?: number[];
  createdAt: string;
};

type Stranger = {
  nickname: string;
  gender: string;
  age: number;
  avatarUrl: string | null;
};

type Session = {
  phase: Phase | "searching" | "idle" | "chatting" | "ended";
  chatId: string | null;
  stranger: Stranger | null;
  typing?: boolean;
  messages?: ChatMessage[];
  error?: string;
};

function isBlockedFromChat(message?: string) {
  const text = (message || "").toLowerCase();
  return text.includes("rejected") || text.includes("banned") || text.includes("suspended");
}

function mergeMessages(curr: ChatMessage[], incoming: ChatMessage[]) {
  const seen = new Set(curr.map((m) => m.id));
  const next = [...curr];
  for (const msg of incoming) {
    if (!seen.has(msg.id)) next.push(msg);
  }
  return next;
}

export function ChatApp({
  me,
}: {
  me: { id: string; nickname: string; avatarUrl: string | null };
}) {
  const router = useRouter();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [stranger, setStranger] = useState<Stranger | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [gifOpen, setGifOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const peaksRef = useRef<number[]>([]);
  const sinceRef = useRef<string | null>(null);
  const chatIdRef = useRef<string | null>(null);
  const phaseRef = useRef<Phase>("idle");

  function applySession(data: Session) {
    if (isBlockedFromChat(data.error)) {
      router.push("/pending");
      return;
    }
    if (data.phase === "chatting" && data.chatId) {
      if (chatIdRef.current !== data.chatId) {
        chatIdRef.current = data.chatId;
        setMessages([]);
        sinceRef.current = null;
      }
      setStranger(data.stranger);
      setTyping(Boolean(data.typing));
      phaseRef.current = "chatting";
      setPhase("chatting");
      if (data.messages?.length) {
        setMessages((curr) => {
          const merged = mergeMessages(curr, data.messages || []);
          const last = merged[merged.length - 1];
          if (last) sinceRef.current = last.createdAt;
          return merged;
        });
      }
      return;
    }
    if (data.phase === "searching") {
      chatIdRef.current = null;
      sinceRef.current = null;
      setStranger(null);
      setMessages([]);
      setTyping(false);
      phaseRef.current = "searching";
      setPhase("searching");
      return;
    }
    if (data.phase === "ended" || (data.phase === "idle" && phaseRef.current === "chatting")) {
      chatIdRef.current = null;
      setTyping(false);
      phaseRef.current = "ended";
      setPhase("ended");
      return;
    }
    if (data.phase === "idle" && phaseRef.current !== "ended") {
      phaseRef.current = "idle";
      setPhase("idle");
    }
  }

  async function postSession(body: Record<string, unknown>) {
    const res = await fetch("/api/chat/session", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as Session;
    if (res.status === 403 && isBlockedFromChat(data.error)) {
      router.push("/pending");
      return data;
    }
    applySession(data);
    return data;
  }

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      const params = sinceRef.current
        ? `?since=${encodeURIComponent(sinceRef.current)}`
        : "";
      const res = await fetch(`/api/chat/session${params}`, { credentials: "include" });
      if (!res.ok || cancelled) {
        if (res.status === 403) {
          const data = await res.json().catch(() => ({}));
          if (isBlockedFromChat(String(data.error || ""))) router.push("/pending");
        }
        return;
      }
      const data = (await res.json()) as Session;
      if (!cancelled) applySession(data);
    }
    const id = setInterval(() => void poll(), 1200);
    void poll();
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [router]);

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  function start() {
    void postSession({ action: "join" });
  }

  function skip() {
    setMenuOpen(false);
    if (phase === "searching") {
      void postSession({ action: "skip", searching: true });
      return;
    }
    void postSession({ action: "skip" });
  }

  function block() {
    setMenuOpen(false);
    void postSession({ action: "block" });
    setStranger(null);
    setMessages([]);
  }

  async function sendText() {
    const content = text.trim();
    if (!content || phase !== "chatting") return;
    setText("");
    void postSession({ action: "typing", typing: false });
    const res = await fetch("/api/chat/message", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "TEXT", content }),
    });
    const data = await res.json().catch(() => ({}));
    if (data.message) {
      setMessages((curr) => {
        const merged = mergeMessages(curr, [data.message]);
        sinceRef.current = data.message.createdAt;
        return merged;
      });
    }
  }

  async function sendFile(file: File, kind: "photo" | "voice", waveform: number[] = []) {
    const form = new FormData();
    form.set("file", file);
    form.set("kind", kind);
    const res = await fetch("/api/upload", { method: "POST", body: form });
    const data = await res.json();
    if (!res.ok) return;
    const sent = await fetch("/api/chat/message", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: data.type,
        content: data.url,
        waveform,
      }),
    });
    const payload = await sent.json().catch(() => ({}));
    if (payload.message) {
      setMessages((curr) => {
        const merged = mergeMessages(curr, [payload.message]);
        sinceRef.current = payload.message.createdAt;
        return merged;
      });
    }
  }

  async function toggleRecord() {
    if (recording) {
      mediaRecorderRef.current?.stop();
      setRecording(false);
      return;
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    chunksRef.current = [];
    peaksRef.current = [];
    const ctx = new AudioContext();
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);
    const timer = setInterval(() => {
      analyser.getByteTimeDomainData(data);
      const peak = Math.max(...Array.from(data).map((n) => Math.abs(n - 128)));
      peaksRef.current.push(Math.min(32, Math.round(peak / 4)));
    }, 80);

    recorder.ondataavailable = (e) => {
      if (e.data.size) chunksRef.current.push(e.data);
    };
    recorder.onstop = async () => {
      clearInterval(timer);
      stream.getTracks().forEach((t) => t.stop());
      void ctx.close();
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
      const file = new File([blob], "voice.webm", { type: blob.type });
      await sendFile(file, "voice", peaksRef.current.slice(0, 48));
    };
    mediaRecorderRef.current = recorder;
    recorder.start();
    setRecording(true);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }

  const statusLabel = useMemo(() => {
    if (phase === "searching") return "Connecting...";
    if (phase === "chatting" && stranger) return `Stranger found · ${stranger.nickname}`;
    if (phase === "ended") return "Stranger disconnected";
    return "Ready when you are";
  }, [phase, stranger]);

  return (
    <div className="flex h-screen flex-col bg-black/35">
      <header className="flex items-center justify-between border-b border-border bg-black/25 px-4 py-3 backdrop-blur-md">
        <Link href="/">
          <SparkMark />
        </Link>
        <div className="flex items-center gap-2">
          <Button
            onClick={phase === "idle" ? start : skip}
            className="min-w-28"
          >
            <SkipForward className="h-4 w-4" />
            {phase === "idle" ? "Start chat" : "Skip"}
          </Button>
          <div className="relative">
            <Button variant="ghost" className="px-3" onClick={() => setMenuOpen((v) => !v)}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
            {menuOpen && (
              <div className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-2xl border border-border bg-surface py-1">
                <button
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-surface-2"
                  onClick={block}
                  disabled={phase !== "chatting"}
                >
                  <ShieldBan className="h-4 w-4" /> Block
                </button>
                <button
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-surface-2"
                  onClick={() => {
                    setReportOpen(true);
                    setMenuOpen(false);
                  }}
                  disabled={phase !== "chatting"}
                >
                  <Flag className="h-4 w-4" /> Report
                </button>
                <Link
                  href="/profile"
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-surface-2"
                >
                  Profile
                </Link>
                <button
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-surface-2"
                  onClick={logout}
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="border-b border-border bg-black/20 px-4 py-2 text-sm text-muted backdrop-blur-md">{statusLabel}</div>

      <div ref={scrollerRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-6">
        {phase === "idle" && (
          <EmptyState
            art="/brand/logo.jpg"
            title="Talk to someone new"
            body="You'll be paired with a verified stranger. Skip is instant."
            action="Start chat"
            onAction={start}
          />
        )}
        {phase === "searching" && (
          <EmptyState
            art="/brand/logo-glow.jpg"
            pulse
            title="Connecting..."
            body="Looking for the next available stranger."
          />
        )}
        {phase === "ended" && (
          <EmptyState
            art="/brand/logo.jpg"
            title="Stranger disconnected"
            body="Jump back in whenever you're ready."
            action="Next stranger"
            onAction={start}
          />
        )}
        {stranger && phase === "chatting" && (
          <p className="text-center text-xs text-muted">
            Chatting with {stranger.nickname} · {formatGender(stranger.gender)}, {stranger.age}
          </p>
        )}
        {messages.map((msg) => (
          <Bubble key={msg.id} mine={msg.senderId === me.id} message={msg} />
        ))}
        {typing && phase === "chatting" && (
          <div className="max-w-[70%] rounded-2xl bg-surface-2 px-4 py-2 text-sm text-muted">
            Stranger is typing...
          </div>
        )}
      </div>

      <form
        className="flex items-end gap-2 border-t border-border bg-black/25 p-3 backdrop-blur-md"
        onSubmit={(e) => {
          e.preventDefault();
          sendText();
        }}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void sendFile(file, "photo");
            e.currentTarget.value = "";
          }}
        />
        <IconBtn onClick={() => fileRef.current?.click()} disabled={phase !== "chatting"}>
          <ImagePlus className="h-5 w-5" />
        </IconBtn>
        <IconBtn onClick={() => setGifOpen(true)} disabled={phase !== "chatting"}>
          <Sticker className="h-5 w-5" />
        </IconBtn>
        <IconBtn onClick={() => void toggleRecord()} disabled={phase !== "chatting"}>
          {recording ? <Square className="h-5 w-5 text-danger" /> : <Mic className="h-5 w-5" />}
        </IconBtn>
        <input
          value={text}
          disabled={phase !== "chatting"}
          onChange={(e) => {
            setText(e.target.value);
            void postSession({ action: "typing", typing: e.target.value.length > 0 });
          }}
          placeholder={recording ? "Recording voice..." : "Say something"}
          className="flex-1 rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm outline-none focus:border-accent"
        />
        <Button type="submit" className="h-12 w-12 px-0" disabled={phase !== "chatting"}>
          <Send className="h-4 w-4" />
        </Button>
      </form>

      {gifOpen && (
        <GifPicker
          onClose={() => setGifOpen(false)}
          onPick={(url) => {
            setGifOpen(false);
            void fetch("/api/chat/message", {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ type: "GIF", content: url }),
            })
              .then((r) => r.json())
              .then((payload) => {
                if (payload.message) {
                  setMessages((curr) => {
                    const merged = mergeMessages(curr, [payload.message]);
                    sinceRef.current = payload.message.createdAt;
                    return merged;
                  });
                }
              });
          }}
        />
      )}

      {reportOpen && (
        <ReportModal
          onClose={() => setReportOpen(false)}
          onSubmit={(reason, details) => {
            void postSession({ action: "report", reason, details }).then(() => {
              setReportOpen(false);
              skip();
            });
          }}
        />
      )}
    </div>
  );
}

function EmptyState({
  art,
  pulse,
  title,
  body,
  action,
  onAction,
}: {
  art: string;
  pulse?: boolean;
  title: string;
  body: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <BrandArt
        src={art}
        alt=""
        className={cn("mb-5 h-20 w-20 rounded-2xl object-cover ring-1 ring-accent/20", pulse && "pulse-ring")}
      />
      <h2 className="text-2xl font-semibold">{title}</h2>
      <p className="mt-2 max-w-sm text-sm text-muted">{body}</p>
      {action && onAction && (
        <Button className="mt-6" onClick={onAction}>
          {action}
        </Button>
      )}
    </div>
  );
}

function Bubble({ mine, message }: { mine: boolean; message: ChatMessage }) {
  return (
    <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[78%] overflow-hidden rounded-3xl px-4 py-2.5 text-sm",
          mine ? "rounded-br-md bg-accent-strong text-white" : "rounded-bl-md bg-surface-2"
        )}
      >
        {message.type === "TEXT" && <p className="whitespace-pre-wrap break-words">{message.content}</p>}
        {(message.type === "PHOTO" || message.type === "GIF") && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={message.content} alt="" className="max-h-64 rounded-2xl object-cover" />
        )}
        {message.type === "VOICE" && (
          <VoicePlayer src={message.content} waveform={message.waveform || []} mine={mine} />
        )}
      </div>
    </div>
  );
}

function VoicePlayer({
  src,
  waveform,
  mine,
}: {
  src: string;
  waveform: number[];
  mine: boolean;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const bars = waveform.length ? waveform : Array.from({ length: 24 }, () => 8);

  return (
    <button
      type="button"
      className="flex items-center gap-3"
      onClick={() => {
        const audio = audioRef.current;
        if (!audio) return;
        if (playing) audio.pause();
        else void audio.play();
      }}
    >
      <span className="grid h-8 w-8 place-items-center rounded-full bg-black/20">
        {playing ? <Square className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
      </span>
      <span className="flex h-8 items-center gap-0.5">
        {bars.slice(0, 28).map((h, i) => (
          <span
            key={i}
            className={cn("wave-bar w-0.5 rounded-full", mine ? "bg-white" : "bg-accent")}
            style={{ height: `${Math.max(4, h)}px`, animationDelay: `${i * 40}ms` }}
          />
        ))}
      </span>
      <audio
        ref={audioRef}
        src={src}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      />
    </button>
  );
}

function IconBtn({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="grid h-12 w-12 place-items-center rounded-2xl border border-border text-muted hover:text-text disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function GifPicker({
  onClose,
  onPick,
}: {
  onClose: () => void;
  onPick: (url: string) => void;
}) {
  const [q, setQ] = useState("hello");
  const [gifs, setGifs] = useState<Array<{ id: string; preview: string; url: string }>>([]);
  const [configured, setConfigured] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      fetch(`/api/giphy?q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((data) => {
          setConfigured(data.configured !== false);
          setGifs(data.gifs || []);
        });
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div className="fixed inset-0 z-30 grid place-items-end bg-black/50 p-4" onClick={onClose}>
      <div
        className="h-[70vh] w-full max-w-lg overflow-hidden rounded-3xl border border-border bg-surface"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-border p-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search GIFs"
            className="flex-1 rounded-xl bg-surface-2 px-3 py-2 text-sm outline-none"
          />
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
        {!configured && (
          <p className="p-4 text-sm text-muted">
            Add a GIPHY_API_KEY to enable GIF search.
          </p>
        )}
        <div className="grid grid-cols-3 gap-2 overflow-y-auto p-3">
          {gifs.map((g) => (
            <button key={g.id} onClick={() => onPick(g.url)} className="overflow-hidden rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={g.preview} alt="" className="h-28 w-full object-cover" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReportModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (reason: string, details: string) => void;
}) {
  const [reason, setReason] = useState("SPAM");
  const [details, setDetails] = useState("");
  return (
    <div className="fixed inset-0 z-30 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md space-y-4 rounded-3xl border border-border bg-surface p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold">Report this stranger</h2>
        <select
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-sm"
        >
          {REPORT_REASONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Optional details"
          className="h-24 w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm"
        />
        <div className="flex gap-2">
          <Button variant="ghost" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button className="flex-1" variant="danger" onClick={() => onSubmit(reason, details)}>
            Report & skip
          </Button>
        </div>
      </div>
    </div>
  );
}
