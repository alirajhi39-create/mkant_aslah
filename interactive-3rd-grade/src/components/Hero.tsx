import type { ReactNode } from "react";
import mosqueHero from "../assets/mosque-hero.jpg?inline";
import { journey, lesson, strategies } from "../content";
import { Arabesque, Button, Icon, Reveal, StarBurst, StrategyChip, cn, type IconName } from "./ui";

const journeyIcons: Record<string, IconName> = {
  book: "book",
  spark: "spark",
  star: "star",
  check: "check",
};

function FloatingChip({
  children,
  className,
  delay = "0s",
}: {
  children: ReactNode;
  className?: string;
  delay?: string;
}) {
  return (
    <div
      className={cn(
        "absolute z-20 flex items-center gap-2 rounded-2xl border border-white/70 bg-white/90 px-3 py-2 text-[11px] font-bold text-brand-800 shadow-[0_16px_30px_-16px_rgba(14,62,59,0.5)] backdrop-blur-md animate-float",
        className,
      )}
      style={{ animationDelay: delay }}
    >
      {children}
    </div>
  );
}

export function Hero({ onOpenCertificate }: { onOpenCertificate: () => void }) {
  return (
    <section id="overview" aria-labelledby="lesson-title" className="scroll-margin-section relative overflow-hidden pb-20 lg:pb-4">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -right-32 -top-24 h-[30rem] w-[30rem] rounded-full bg-brand-100/50 blur-3xl" />
        <div className="absolute -left-24 top-40 h-80 w-80 rounded-full bg-sand-200/60 blur-3xl" />
        <div className="pattern-dots absolute inset-x-0 top-0 h-72 opacity-30 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      </div>

      <div className="relative mx-auto max-w-[1240px] px-4 pb-6 pt-8 sm:px-6 sm:pt-12 lg:px-8 lg:pt-16">
        <div className="grid items-center gap-10 lg:grid-cols-[1.06fr_0.94fr] lg:gap-12">
          <Reveal className="order-2 text-center lg:order-1 lg:text-right">
            <div className="mb-4 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-700 px-3 py-1.5 text-[11px] font-bold text-sand-50">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold-400" />
                {lesson.number} · {lesson.subject}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gold-400/40 bg-sand-100 px-3 py-1.5 text-[11px] font-bold text-gold-600">
                <Icon name="users" className="h-3.5 w-3.5" />
                {lesson.grade} · {lesson.audience}
              </span>
            </div>

            <h1
              id="lesson-title"
              className="font-display text-[2.7rem] font-extrabold leading-[1.25] tracking-tight text-brand-900 text-balance sm:text-6xl lg:text-[4.2rem]"
            >
              مكانةُ
              <span className="relative mx-1 inline-block text-brand-600">
                الصلاة
                <svg
                  viewBox="0 0 220 20"
                  className="absolute -bottom-3 left-0 h-4 w-full text-gold-400"
                  fill="none"
                  aria-hidden="true"
                >
                  <path d="M4 13c40-9 110-11 212-4" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
                  <path d="M26 18c38-5 92-6 155-3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity=".55" />
                </svg>
              </span>
            </h1>

            <p className="mx-auto mt-7 max-w-xl font-serif text-lg leading-9 text-brand-800 sm:text-xl lg:mx-0 lg:text-[22px]">
              {lesson.subtitle}
            </p>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-muted lg:mx-0">{lesson.intro}</p>

            <div className="mt-7 flex flex-col items-center justify-center gap-2.5 sm:flex-row lg:justify-start">
              <a href="#read" className="w-full sm:w-auto">
                <Button size="lg" icon="compass" className="w-full sm:w-auto">
                  ابدأ الرحلة التعليمية
                </Button>
              </a>
              <Button
                size="lg"
                variant="outline"
                icon="trophy"
                onClick={onOpenCertificate}
                className="w-full bg-white/70 sm:w-auto"
              >
                بطاقة إنجازي
              </Button>
            </div>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] font-bold text-brand-700 lg:justify-start">
              <span className="flex items-center gap-1.5">
                <Icon name="book" className="h-4 w-4 text-brand-500" /> ٤ أحاديث نبوية
              </span>
              <span className="flex items-center gap-1.5">
                <Icon name="check" className="h-4 w-4 text-brand-500" /> ٣ أنشطة تقويم
              </span>
              <span className="flex items-center gap-1.5">
                <Icon name="sound" className="h-4 w-4 text-brand-500" /> استماع للأحاديث
              </span>
            </div>
          </Reveal>

          <Reveal className="order-1 lg:order-2" delay={120}>
            <div className="relative mx-auto w-full max-w-[500px]">
              <StarBurst className="absolute -right-5 -top-6 z-20 h-14 w-14 animate-twinkle text-gold-500" />
              <StarBurst className="absolute -bottom-2 -left-5 z-20 h-10 w-10 animate-twinkle text-brand-400 [animation-delay:1.4s]" />

              <div className="absolute -inset-2 rounded-[32px] border border-brand-200/70 sm:-inset-3 sm:rounded-[46px]" aria-hidden="true" />
              <div className="absolute -inset-4 hidden rounded-[54px] border border-dashed border-gold-400/30 sm:block" aria-hidden="true" />

              <div className="relative overflow-hidden rounded-[24px] border-4 border-white bg-brand-100 shadow-[0_35px_70px_-30px_rgba(14,62,59,0.55)] sm:rounded-[38px] sm:border-[6px]">
                <img
                  src={mosqueHero}
                  alt="رسم أنمي لمشهد مسجد أخضر القبة في الصباح، مع أطفال يتجهون إليه للصلاة"
                  className="h-[230px] w-full object-cover min-[420px]:h-[270px] sm:h-[390px] lg:h-[430px]"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-900/65 via-brand-900/5 to-transparent" />

                <div className="absolute inset-x-2.5 bottom-2.5 flex items-end justify-between gap-2 rounded-xl border border-white/20 bg-brand-900/45 p-2.5 text-white backdrop-blur-md sm:inset-x-4 sm:bottom-4 sm:rounded-2xl sm:p-3">
                  <div>
                    <p className="text-[10px] font-medium text-brand-100">من الدرس</p>
                    <p className="font-serif text-base font-bold leading-7 sm:text-xl sm:leading-8">«الصلاةُ على وقتِها»</p>
                  </div>
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold-400 text-brand-900">
                    <Icon name="clock" className="h-5 w-5" />
                  </span>
                </div>
              </div>

              <FloatingChip className="-right-2 top-16 hidden min-[400px]:flex sm:-right-7 sm:top-20" delay="0.4s">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-100 text-brand-700">
                  <Icon name="star" className="h-3.5 w-3.5" />
                </span>
                أحبُّ الأعمالِ إلى الله
              </FloatingChip>

              <FloatingChip className="-left-1 top-6 hidden min-[400px]:flex sm:-left-8 sm:top-10" delay="1.1s">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-sand-200 text-gold-600">
                  <Icon name="target" className="h-3.5 w-3.5" />
                </span>
                الركن الثاني من الإسلام
              </FloatingChip>

              <div className="absolute -bottom-5 left-1/2 z-20 hidden -translate-x-1/2 items-center gap-2 rounded-full border border-brand-100 bg-white px-4 py-2 shadow-lg sm:flex">
                {[1, 2, 3, 4, 5].map((n) => (
                  <span
                    key={n}
                    className={cn(
                      "grid h-5 w-5 place-items-center rounded-full text-[9px] font-extrabold",
                      n === 2 ? "bg-gold-400 text-brand-900 ring-2 ring-sand-200" : "bg-brand-50 text-brand-500",
                    )}
                  >
                    {n}
                  </span>
                ))}
                <span className="ms-1 text-[10px] font-bold text-muted">أركان الإسلام</span>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Lesson facts bar */}
        <Reveal className="mt-14" delay={80}>
          <div className="grid grid-cols-2 divide-brand-100/80 overflow-hidden rounded-2xl border border-brand-100 bg-white/80 shadow-soft sm:grid-cols-4 sm:divide-x sm:divide-x-reverse">
            {[
              { icon: "book" as IconName, label: "الدرس", value: "السادس" },
              { icon: "mosque" as IconName, label: "المادة", value: "الدراسات الإسلامية" },
              { icon: "shahada" as IconName, label: "أركان الإسلام", value: "خمسة أركان" },
              { icon: "clock" as IconName, label: "مدة الرحلة", value: "١٥–٢٠ دقيقة" },
            ].map((item, index) => (
              <div
                key={item.label}
                className={cn(
                  "flex items-center gap-3 px-4 py-4 sm:px-5",
                  index < 2 && "border-b border-brand-100/80 sm:border-b-0",
                  index % 2 === 0 && "border-l border-brand-100/80 sm:border-l-0",
                )}
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <Icon name={item.icon} className="h-4.5 w-4.5" />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-medium text-muted">{item.label}</p>
                  <p className="truncate text-xs font-extrabold text-brand-900">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        {/* Journey */}
        <div className="mt-14">
          <Reveal className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="mb-1.5 flex items-center gap-2 text-xs font-bold tracking-[0.16em] text-brand-500">
                <span className="inline-block h-px w-7 bg-gold-400" />
                خطة الرحلة
              </p>
              <h2 className="font-display text-2xl font-extrabold text-brand-900 sm:text-3xl">
                أربع محطات ممتعة بانتظارك
              </h2>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {strategies.map((strategy) => (
                <StrategyChip key={strategy} label={strategy} />
              ))}
            </div>
          </Reveal>

          <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
            {journey.map((station, index) => (
              <Reveal key={station.id} delay={index * 70}>
                <a
                  href={`#${station.id}`}
                  className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-brand-100 bg-white/90 p-5 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-brand-300 hover:shadow-lift"
                >
                  <div className="absolute left-0 top-0 h-24 w-24 rounded-br-[80px] bg-brand-50/80 transition-colors group-hover:bg-sand-100" aria-hidden="true" />
                  <div className="relative mb-4 flex items-start justify-between">
                    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-700 text-sand-50 shadow-sm transition-transform duration-300 group-hover:rotate-6">
                      <Icon name={journeyIcons[station.icon]} className="h-5 w-5" />
                    </span>
                    <span className="font-display text-2xl font-extrabold text-brand-200 transition-colors group-hover:text-gold-400">
                      {station.step}
                    </span>
                  </div>
                  <h3 className="relative mb-1.5 font-display text-[15px] font-extrabold text-brand-900">
                    {station.title}
                  </h3>
                  <p className="relative mb-4 flex-1 text-xs leading-6 text-muted">{station.description}</p>
                  <div className="relative flex items-center justify-between border-t border-dashed border-brand-100 pt-3">
                    <span className="flex items-center gap-1 text-[10px] font-bold text-gold-600">
                      <span className="grid h-4 w-4 place-items-center rounded-full bg-sand-100">
                        <Icon name="target" className="h-2.5 w-2.5" />
                      </span>
                      {station.strategy}
                    </span>
                    <Icon
                      name="arrow"
                      className="h-4 w-4 text-brand-400 transition-transform duration-300 group-hover:-translate-x-1"
                    />
                  </div>
                </a>
              </Reveal>
            ))}
          </div>
        </div>
      </div>

      <Arabesque className="pointer-events-none absolute -left-20 bottom-0 h-72 w-72 text-brand-900/[0.04]" />
    </section>
  );
}
