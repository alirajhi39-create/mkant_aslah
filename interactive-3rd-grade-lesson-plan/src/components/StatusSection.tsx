import { useMemo, useState } from "react";
import { shuffle } from "../shuffle";
import boyPrayer from "../assets/boy-prayer.jpg?inline";
import { gratitudeCard, statusSection } from "../content";
import { ListenButton } from "./AudioPlayer";
import {
  Button,
  Feedback,
  Icon,
  Reveal,
  SectionHeading,
  StarBurst,
  StrategyChip,
  cn,
} from "./ui";

export function StatusSection({
  onComplete,
  onResult,
}: {
  onComplete: (key: "status") => void;
  onResult?: (task: "status", correct: boolean) => void;
}) {
  const options = useMemo(() => shuffle(statusSection.options), []);
  const correctOption = statusSection.options[statusSection.correctIndex];
  const [selected, setSelected] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const check = () => {
    if (selected === null) return;
    const correct = selected === correctOption;
    setIsCorrect(correct);
    setChecked(true);
    onResult?.("status", correct);
    if (correct) onComplete("status");
  };

  return (
    <section
      id="status"
      aria-labelledby="status-title"
      className="scroll-margin-section relative overflow-hidden py-16"
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-sand-100/70 blur-3xl" />
        <div className="absolute -left-20 top-10 h-64 w-64 rounded-full bg-brand-50 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            eyebrow="المحطة الثالثة · مكانة الصلاة"
            title="مكانةٌ عظيمة وحكمُ أداءٍ واضح"
            description="نجمع ما تعلمناه عن مكانة الصلاة، ونقرأ حكم أدائها وحديث ابن مسعود رضي الله عنه."
            icon="star"
            tone="gold"
          />
          <div className="mb-8 flex flex-wrap justify-center gap-2 sm:justify-start">
            <StrategyChip label="الخريطة الذهنية" icon="compass" />
            <StrategyChip label="التعلم النشط" icon="spark" />
          </div>
        </Reveal>

        {/* Statement banner */}
        <Reveal className="mb-5">
          <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-l from-brand-800 via-brand-700 to-brand-600 p-6 text-white shadow-card sm:p-8">
            <div className="pattern-grid absolute inset-0 opacity-25" aria-hidden="true" />
            <StarBurst className="absolute -left-6 -top-8 h-40 w-40 text-white/[0.07]" />
            <StarBurst className="absolute -bottom-10 right-10 h-32 w-32 text-gold-400/15" />
            <div className="relative flex flex-col items-start gap-5 sm:flex-row sm:items-center">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gold-400 text-brand-900 shadow-lg sm:h-16 sm:w-16">
                <Icon name="mosque" className="h-8 w-8" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <p className="mb-1.5 text-[10px] font-bold tracking-[0.2em] text-gold-400">خلاصة المكانة</p>
                <p className="font-serif text-[23px] font-bold leading-[1.9] sm:text-[30px]">
                  الصلاةُ أفضلُ الأعمالِ وأعظمُ أركانِ الإسلامِ بعدَ الشهادتين.
                </p>
              </div>
              <span className="hidden shrink-0 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-center sm:block">
                <Icon name="star" className="mx-auto mb-1 h-5 w-5 text-gold-400" />
                <span className="block font-display text-xs font-extrabold">الركن الثاني</span>
                <span className="mt-0.5 block text-[9px] text-brand-200">من أركان الإسلام</span>
              </span>
            </div>
          </div>
        </Reveal>

        <div className="grid items-start gap-5 lg:grid-cols-[1.12fr_0.88fr]">
          {/* Ruling + hadith + question */}
          <div className="space-y-5">
            <Reveal>
              <article className="relative overflow-hidden rounded-[26px] border border-brand-100 bg-white p-5 shadow-soft sm:p-7">
                <div className="absolute left-0 top-0 h-24 w-24 rounded-br-[60px] bg-sand-50" aria-hidden="true" />
                <div className="relative">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-display text-lg font-extrabold text-brand-900 sm:text-xl">
                      {statusSection.heading}
                    </h3>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-bold text-brand-600">
                      <Icon name="target" className="h-3 w-3" />
                      حكم شرعي
                    </span>
                  </div>

                  <p className="mb-5 text-[15px] leading-8 text-brand-900">
                    أداءُ الصلواتِ الخمسِ{" "}
                    <span className="rounded bg-brand-100 px-1.5 py-0.5 font-extrabold text-brand-800">واجبةٌ</span> على
                    المسلمِ، والمحافظةُ عليها{" "}
                    <span className="rounded bg-sand-200 px-1.5 py-0.5 font-extrabold text-gold-600">في وقتِها</span> من
                    صفاتِ المؤمنِ التي يحبُّها اللهُ.
                  </p>

                  <div className="mb-5 grid gap-2.5 sm:grid-cols-2">
                    {[
                      { icon: "hand" as const, title: "أداؤها واجب", note: "الصلاة واجبة على المسلم" },
                      { icon: "clock" as const, title: "المحافظة على وقتها", note: "من صفات المؤمن التي يحبها الله" },
                    ].map((item) => (
                      <div
                        key={item.title}
                        className="flex items-center gap-3 rounded-xl border border-brand-100 bg-brand-50/50 p-3"
                      >
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-brand-600 shadow-sm">
                          <Icon name={item.icon} className="h-4.5 w-4.5" />
                        </span>
                        <div>
                          <p className="text-xs font-extrabold text-brand-900">{item.title}</p>
                          <p className="mt-0.5 text-[10px] font-medium text-muted">{item.note}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="relative overflow-hidden rounded-2xl border border-sand-200 bg-sand-50 p-4 pe-20 sm:p-5 sm:pe-24">
                    <div className="absolute inset-y-0 right-0 w-1 bg-gold-400" aria-hidden="true" />
                    <div className="absolute inset-y-0 left-0 z-10 flex w-16 items-center justify-center rounded-e-xl border-e border-sand-200/80 bg-sand-100/60 sm:w-20">
                      <ListenButton trackId="best-deeds" iconOnly />
                    </div>
                    <p className="mb-2 text-[11px] font-bold leading-6 text-muted">
                      {statusSection.hadithNarrator}
                    </p>
                    <p className="font-quran text-[21px] font-bold text-brand-900 sm:text-[25px]">
                      {statusSection.hadithText}
                    </p>
                    <p className="mt-2 text-[10px] font-medium text-muted">{statusSection.reference}</p>
                  </div>
                </div>
              </article>
            </Reveal>

            <Reveal delay={80}>
              <div className="rounded-[26px] border border-brand-200 bg-white p-5 shadow-soft sm:p-6">
                <div className="mb-4 flex items-start gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gold-400/20 text-gold-600">
                    <Icon name="bulb" className="h-4.5 w-4.5" />
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="text-[10px] font-bold text-gold-600">تحقّق سريع</p>
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-brand-50 px-1.5 py-0.5 text-[8px] font-bold text-brand-600">
                        <Icon name="refresh" className="h-2.5 w-2.5" />
                        خيارات مخلوطة
                      </span>
                    </div>
                    <h3 className="font-display text-sm font-extrabold leading-7 text-brand-900 sm:text-base">
                      {statusSection.question}
                    </h3>
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label={statusSection.question}>
                  {options.map((option, index) => {
                    const isSelected = selected === option;
                    const showCorrect = isCorrect && option === correctOption;
                    return (
                      <button
                        key={option}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        disabled={isCorrect}
                        onClick={() => {
                          setSelected(option);
                          setChecked(false);
                        }}
                        className={cn(
                          "flex items-center gap-2 rounded-xl border p-3 text-right text-xs font-bold transition-all",
                          showCorrect
                            ? "border-brand-500 bg-brand-50 text-brand-800"
                            : isSelected
                              ? "border-gold-400 bg-sand-100 text-brand-900"
                              : "border-brand-100 text-brand-800 hover:border-brand-300 hover:bg-sand-50",
                        )}
                      >
                        <span
                          className={cn(
                            "grid h-6 w-6 shrink-0 place-items-center rounded-full border",
                            showCorrect
                              ? "border-brand-600 bg-brand-600 text-white"
                              : isSelected
                                ? "border-gold-400 bg-gold-400 text-brand-900"
                                : "border-brand-200 bg-white text-brand-500",
                          )}
                        >
                          {showCorrect ? <Icon name="check" className="h-3 w-3" /> : index + 1}
                        </span>
                        <span className="leading-5">{option}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-3.5">
                  {!isCorrect ? (
                    <Button size="sm" onClick={check} disabled={selected === null} icon="check">
                      تحقّق من إجابتي
                    </Button>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 text-[11px] font-bold text-brand-700">
                      <Icon name="check" className="h-3.5 w-3.5" />
                      أضيفت المحطة إلى إنجازك
                    </span>
                  )}
                </div>

                {checked && (
                  <div className="mt-3.5">
                    {isCorrect ? (
                      <Feedback status="correct">{statusSection.feedback}</Feedback>
                    ) : (
                      <Feedback status="incorrect">
                        ليست هذه الإجابة؛ راجع قول النبي ﷺ في الحديث، واختر ما ورد نصًّا.
                      </Feedback>
                    )}
                  </div>
                )}
              </div>
            </Reveal>
          </div>

          {/* Illustration + gratitude */}
          <div className="space-y-5">
            <Reveal delay={60}>
              <figure className="relative overflow-hidden rounded-[26px] border-[5px] border-white bg-brand-100 shadow-card">
                <img
                  src={boyPrayer}
                  alt="رسم أنمي لطفل يرتدي الثوب الأبيض ويدخل من باب خشبي مزخرف إلى المسجد"
                  className="h-[300px] w-full object-cover sm:h-[340px]"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-900/60 via-transparent to-transparent" />
                <figcaption className="absolute inset-x-4 bottom-4 flex items-center gap-2 rounded-xl border border-white/20 bg-brand-900/45 px-3 py-2 text-[11px] font-bold text-white backdrop-blur">
                  <Icon name="mosque" className="h-4 w-4 text-gold-400" />
                  أحافظ على أداء الصلوات الخمس
                </figcaption>
              </figure>
            </Reveal>

            <Reveal delay={120}>
              <div className="relative overflow-hidden rounded-[26px] border border-gold-400/40 bg-sand-100 p-5 shadow-soft">
                <div className="absolute -left-6 -top-6 h-24 w-24 rounded-full bg-white/60" aria-hidden="true" />
                <div className="relative">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-gold-600 shadow-sm">
                      <Icon name="heart" className="h-3 w-3" />
                      {gratitudeCard.badge}
                    </span>
                    <StarBurst className="h-7 w-7 text-gold-500/60" />
                  </div>
                  <p className="font-serif text-lg font-bold leading-[2] text-brand-900 sm:text-xl">
                    {gratitudeCard.text}
                  </p>
                  <div className="mt-4 flex items-center gap-2 border-t border-gold-400/25 pt-3">
                    <span className="flex -space-x-1 space-x-reverse">
                      <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-700 text-[11px] font-extrabold text-white">
                        أ
                      </span>
                      <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-400 text-[11px] font-extrabold text-white">
                        م
                      </span>
                    </span>
                    <p className="text-[10px] font-medium leading-5 text-muted">
                      بالدعاء والامتنان لمن علّمني الصلاة.
                    </p>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
