import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/* ---------------------------------- Icons --------------------------------- */

export type IconName =
  | "book"
  | "spark"
  | "star"
  | "check"
  | "mosque"
  | "compass"
  | "arrow"
  | "sound"
  | "stop"
  | "refresh"
  | "close"
  | "heart"
  | "clock"
  | "trophy"
  | "printer"
  | "bulb"
  | "users"
  | "pen"
  | "lock"
  | "quote"
  | "menu"
  | "target"
  | "hand"
  | "zakat"
  | "fasting"
  | "hajj"
  | "shahada"
  | "prayer"
  | "search"
  | "download"
  | "trash"
  | "userPlus"
  | "chart"
  | "eye"
  | "send"
  | "shield";

const paths: Record<IconName, ReactNode> = {
  book: (
    <>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v15H6.5A2.5 2.5 0 0 0 4 20.5V5.5Z" />
      <path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H19v3H6.5A2.5 2.5 0 0 1 4 20.5Z" />
      <path d="M9 7.5h6" />
    </>
  ),
  spark: (
    <>
      <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3Z" />
      <path d="M18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z" />
    </>
  ),
  star: <path d="M12 3.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8-5.3-2.8-5.3 2.8 1-5.8-4.2-4.1 5.9-.9L12 3.5Z" />,
  check: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.2 12.2 2.5 2.5 5.1-5.2" />
    </>
  ),
  mosque: (
    <>
      <path d="M3 21h18" />
      <path d="M5 21V11a7 7 0 0 1 14 0v10" />
      <path d="M9 21v-4a3 3 0 0 1 6 0v4" />
      <path d="M12 3.2c2 2 3.2 3.2 3.2 5H8.8c0-1.8 1.2-3 3.2-5Z" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m15.3 8.7-2 4.6-4.6 2 2-4.6 4.6-2Z" />
    </>
  ),
  arrow: (
    <>
      <path d="M19 12H5" />
      <path d="m11 6-6 6 6 6" />
    </>
  ),
  sound: (
    <>
      <path d="M5 9v6h3.5L14 19V5L8.5 9H5Z" />
      <path d="M17.5 8.5a5 5 0 0 1 0 7" />
      <path d="M20 6a8.5 8.5 0 0 1 0 12" />
    </>
  ),
  stop: (
    <>
      <rect x="7" y="7" width="10" height="10" rx="2" />
      <circle cx="12" cy="12" r="9" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 11a8 8 0 1 0-2.3 6.3" />
      <path d="M20 4v7h-7" />
    </>
  ),
  close: <path d="m6 6 12 12M18 6 6 18" />,
  heart: <path d="M20.8 5.9a5.2 5.2 0 0 0-7.4 0L12 7.3l-1.4-1.4a5.2 5.2 0 0 0-7.4 7.4L12 22l8.8-8.7a5.2 5.2 0 0 0 0-7.4Z" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5.5l3.5 2" />
    </>
  ),
  trophy: (
    <>
      <path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" />
      <path d="M8 5H5v2a3 3 0 0 0 3 3M16 5h3v2a3 3 0 0 1-3 3" />
      <path d="M12 13v4M9 21h6M10 17h4l1 4H9l1-4Z" />
    </>
  ),
  printer: (
    <>
      <path d="M6 9V3h12v6" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="7" rx="1.5" />
    </>
  ),
  bulb: (
    <>
      <path d="M9 18h6M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.3 1 2.1h5c0-.8.4-1.6 1-2.1A6 6 0 0 0 12 3Z" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20a6 6 0 0 1 12 0" />
      <path d="M16 5.2a3.2 3.2 0 0 1 0 6.1M18 14.4A6 6 0 0 1 21 20" />
    </>
  ),
  pen: (
    <>
      <path d="m14.5 4.5 5 5L8 21l-5 1 1-5L14.5 4.5Z" />
      <path d="m12.5 6.5 5 5" />
    </>
  ),
  lock: (
    <>
      <rect x="4.5" y="10" width="15" height="10" rx="2.5" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </>
  ),
  quote: (
    <>
      <path d="M8 6H4v6h4c0 3-1.5 4.5-4 5.5" />
      <path d="M20 6h-4v6h4c0 3-1.5 4.5-4 5.5" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.2" />
    </>
  ),
  hand: (
    <>
      <path d="M6 12.5V6.7a1.7 1.7 0 0 1 3.4 0v4.6" />
      <path d="M9.4 11.3V5.2a1.7 1.7 0 0 1 3.4 0v6.1" />
      <path d="M12.8 11.3V6.5a1.7 1.7 0 0 1 3.4 0v5.8" />
      <path d="M16.2 12.3V9a1.7 1.7 0 0 1 3.4 0v5.8A7.2 7.2 0 0 1 12.4 22h-.7a7 7 0 0 1-5.2-2.4l-3-3.6a1.8 1.8 0 0 1 2.6-2.5L6 14.8" />
    </>
  ),
  zakat: (
    <>
      <path d="M12 3v18M7 7h7a3 3 0 0 1 0 6H9a3 3 0 0 0 0 6h8" />
    </>
  ),
  fasting: (
    <>
      <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />
      <path d="M17.5 3.5l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2Z" />
    </>
  ),
  hajj: (
    <>
      <path d="M4 21V9l8-5 8 5v12" />
      <path d="M4 21h16M9 21v-6h6v6" />
      <path d="M9 11h6" />
    </>
  ),
  shahada: (
    <>
      <path d="M12 3v18" />
      <path d="M5 6.5C8 8 10 10 12 13c2-3 4-5 7-6.5" />
      <path d="M5 17.5C8 16 10 14 12 11c2 3 4 5 7 6.5" />
    </>
  ),
  prayer: (
    <>
      <path d="M4 20h16" />
      <path d="M6 20v-5a6 6 0 0 1 12 0v5" />
      <path d="M12 5.5c1.3 1 2 1.9 2 3H10c0-1.1.7-2 2-3Z" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.6-3.6" />
    </>
  ),
  download: (
    <>
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M4 19v1.5h16V19" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16" />
      <path d="M9 7V4.5h6V7" />
      <path d="M6.5 7l1 13h9l1-13" />
      <path d="M10 11v5M14 11v5" />
    </>
  ),
  userPlus: (
    <>
      <circle cx="9" cy="8" r="3.4" />
      <path d="M2.8 20a6.2 6.2 0 0 1 12.4 0" />
      <path d="M18.5 8v6M15.5 11h6" />
    </>
  ),
  chart: (
    <>
      <path d="M4 20V4" />
      <path d="M4 20h16" />
      <path d="M8 16v-4M12 16V8M16 16v-6" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  send: (
    <>
      <path d="m21 3-7.5 18-3.4-7.1L3 10.5 21 3Z" />
      <path d="m10.1 13.9 4.4-4.4" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 4.5 5.8v5.4c0 4.5 3.1 8.2 7.5 9.8 4.4-1.6 7.5-5.3 7.5-9.8V5.8L12 3Z" />
      <path d="m9.2 11.7 2 2 3.6-3.7" />
    </>
  ),
};

export function Icon({
  name,
  className,
  strokeWidth = 1.7,
}: {
  name: IconName;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn("h-5 w-5", className)}
    >
      {paths[name]}
    </svg>
  );
}

/* -------------------------------- Ornament -------------------------------- */

export function Arabesque({ className }: { className?: string }) {
  const id = useId();
  return (
    <svg viewBox="0 0 200 200" className={cn("h-40 w-40", className)} aria-hidden="true">
      <defs>
        <pattern id={`arab-${id}`} width="50" height="50" patternUnits="userSpaceOnUse">
          <path d="M25 2 48 25 25 48 2 25Z" fill="none" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="25" cy="25" r="7" fill="none" stroke="currentColor" strokeWidth="1.2" />
          <path d="M25 0v10M25 40v10M0 25h10M40 25h10" stroke="currentColor" strokeWidth="1.2" />
        </pattern>
      </defs>
      <rect width="200" height="200" fill={`url(#arab-${id})`} />
    </svg>
  );
}

export function StarBurst({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={cn("h-16 w-16", className)} aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M50 6 61 39 94 50 61 61 50 94 39 61 6 50 39 39Z" />
        <circle cx="50" cy="50" r="9" />
      </g>
    </svg>
  );
}

/* --------------------------------- Reveal --------------------------------- */

export function Reveal({
  children,
  className,
  delay = 0,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section" | "article" | "li";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as never}
      className={cn("reveal", visible && "is-visible", className)}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}

/* --------------------------------- Buttons -------------------------------- */

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "gold" | "outline";
  size?: "sm" | "md" | "lg";
  icon?: IconName;
};

export function Button({
  children,
  className,
  variant = "primary",
  size = "md",
  icon,
  ...props
}: ButtonProps) {
  const styles = {
    primary:
      "bg-brand-700 text-white shadow-[0_14px_30px_-14px_rgba(14,93,87,0.9)] hover:bg-brand-800 active:translate-y-px",
    secondary:
      "bg-brand-100 text-brand-800 hover:bg-brand-200 active:translate-y-px",
    gold: "bg-gold-400 text-brand-900 shadow-[0_14px_30px_-14px_rgba(188,141,49,0.8)] hover:bg-gold-500 hover:text-white active:translate-y-px",
    ghost: "bg-transparent text-brand-800 hover:bg-brand-50",
    outline: "border border-brand-200 bg-white/80 text-brand-800 hover:border-brand-400 hover:bg-brand-50",
  }[variant];

  const sizes = {
    sm: "gap-1.5 rounded-xl px-3.5 py-2 text-[13px]",
    md: "gap-2 rounded-2xl px-5 py-2.5 text-sm",
    lg: "gap-2.5 rounded-2xl px-6 py-3.5 text-base",
  }[size];

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-bold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50",
        styles,
        sizes,
        className,
      )}
      {...props}
    >
      {icon && <Icon name={icon} className={size === "sm" ? "h-4 w-4" : "h-5 w-5"} />}
      {children}
    </button>
  );
}

/* ------------------------------ Section head ------------------------------ */

export function SectionHeading({
  eyebrow,
  title,
  description,
  icon = "book",
  tone = "brand",
}: {
  eyebrow: string;
  title: string;
  description?: string;
  icon?: IconName;
  tone?: "brand" | "gold" | "clay";
}) {
  const tones = {
    brand: "bg-brand-100 text-brand-700 ring-brand-200",
    gold: "bg-sand-100 text-gold-600 ring-sand-300",
    clay: "bg-orange-50 text-clay-600 ring-orange-100",
  }[tone];

  return (
    <div className="mb-8 flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-right">
      <span
        className={cn(
          "grid h-14 w-14 shrink-0 place-items-center rounded-2xl ring-1 ring-inset",
          tones,
        )}
      >
        <Icon name={icon} className="h-7 w-7" />
      </span>
      <div className="flex-1">
        <p className="mb-1.5 text-xs font-bold tracking-[0.18em] text-brand-500">{eyebrow}</p>
        <h2 className="font-display text-2xl font-extrabold leading-snug text-brand-900 sm:text-3xl">
          {title}
        </h2>
        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-7 text-muted sm:text-[15px]">{description}</p>
        )}
      </div>
    </div>
  );
}

export function StrategyChip({ label, icon = "target" }: { label: string; icon?: IconName }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-gold-400/30 bg-sand-100/90 px-3 py-1 text-[11px] font-bold text-gold-600">
      <Icon name={icon} className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

/* ------------------------------- Progress ring ----------------------------- */

export function ProgressRing({
  value,
  size = 52,
  stroke = 5,
  label,
  className,
}: {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
  className?: string;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      className={cn("relative grid shrink-0 place-items-center", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={label ?? `نسبة الإنجاز ${Math.round(pct)} بالمئة`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-brand-100"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (pct / 100) * circumference}
          className="text-brand-500 transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <span className="absolute font-display text-[11px] font-extrabold text-brand-800">
        {Math.round(pct)}٪
      </span>
    </div>
  );
}

/* --------------------------------- Feedback -------------------------------- */

export function Feedback({
  status,
  children,
}: {
  status: "correct" | "incorrect" | "info";
  children: ReactNode;
}) {
  const tone = {
    correct: {
      box: "border-brand-200 bg-brand-50 text-brand-800",
      badge: "bg-brand-600 text-white",
      icon: "check" as IconName,
      label: "إجابة صحيحة",
    },
    incorrect: {
      box: "border-clay-400/30 bg-orange-50 text-clay-600",
      badge: "bg-clay-500 text-white",
      icon: "refresh" as IconName,
      label: "حاول مرة أخرى",
    },
    info: {
      box: "border-gold-400/30 bg-sand-100 text-brand-800",
      badge: "bg-gold-400 text-brand-900",
      icon: "bulb" as IconName,
      label: "تلميح",
    },
  }[status];

  return (
    <div
      className={cn("flex items-start gap-3 rounded-2xl border p-4 text-sm leading-7", tone.box)}
      role={status === "correct" ? "status" : "alert"}
    >
      <span className={cn("mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full", tone.badge)}>
        <Icon name={tone.icon} className="h-4 w-4" />
      </span>
      <div>
        <p className="mb-0.5 text-xs font-extrabold">{tone.label}</p>
        <p className="font-medium">{children}</p>
      </div>
    </div>
  );
}

/* -------------------------------- Confetti -------------------------------- */

export function Confetti({ seed = 1 }: { seed?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 44 }, (_, i) => {
        const pseudo = Math.abs(Math.sin((i + 1) * (seed + 3) * 12.9898)) * 43758.5453;
        const rnd = pseudo - Math.floor(pseudo);
        const colors = ["#0f746b", "#3eada0", "#d6aa4f", "#b8623d", "#a9e2d7", "#f0e4c8"];
        return {
          left: `${(rnd * 100).toFixed(2)}%`,
          delay: `${((i % 9) * 0.18).toFixed(2)}s`,
          duration: `${(2.8 + (i % 5) * 0.35).toFixed(2)}s`,
          color: colors[i % colors.length],
          size: 6 + (i % 4) * 2,
          round: i % 3 === 0,
          drift: `${((i % 7) - 3) * 18}px`,
        };
      }),
    [seed],
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="confetti-piece absolute top-0 block"
          style={{
            left: p.left,
            width: p.size,
            height: p.round ? p.size : p.size * 1.7,
            backgroundColor: p.color,
            borderRadius: p.round ? "999px" : "2px",
            animationDelay: p.delay,
            animationDuration: p.duration,
            ["--drift" as string]: p.drift,
          }}
        />
      ))}
    </div>
  );
}
