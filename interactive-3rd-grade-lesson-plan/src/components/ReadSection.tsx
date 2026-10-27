import { useMemo, useState } from "react";
import { firstHadith, pillars } from "../content";
import { shuffle } from "../shuffle";
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
  type IconName,
} from "./ui";

const pillarIcons: Record<string, IconName> = {
  shahada: "shahada",
  prayer: "prayer",
  zakat: "zakat",
  fasting: "fasting",
  hajj: "hajj",
};

export function ReadSection({
  onComplete,
  onResult,
}: {
  onComplete: (key: "read") => void;
  onResult?: (task: "read", correct: boolean) => void;
}) {
  const options = useMemo(() => shuffle(firstHadith.options), []);
  const correctOption = firstHadith.options[firstHadith.correctIndex];
  const [selected, setSelected] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const choose = (option: string) => {
    if (isCorrect) return;
    setSelected(option);
    setChecked(false);
  };

  const check = () => {
    if (selected === null) return;
    const correct = selected === correctOption;
    setIsCorrect(correct);
    setChecked(true);
    onResult?.("read", correct);
    if (correct) onComplete("read");
  };

  return (
    <section
      id="read"
      aria-labelledby="read-title"
      className="scroll-margin-section relative overflow-hidden py-16"
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute left-0 top-24 h-72 w-72 rounded-full bg-brand-50 blur-3xl" />
        <div className="absolute right-0 bottom-16 h-64 w-64 rounded-full bg-sand-100 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            eyebrow="المحطة الأولى · أقرأ وأجيب"
            title="مكانةُ الصلاة بين أركان الإسلام"
            description="نبدأ بحديث ابن عمر رضي الله عنه، ونقرؤه قراءةً متأنية، ثم نجيب عن السؤال."
            icon="book"
          />
          <div className="mb-8 flex flex-wrap justify-center gap-2 sm:justify-start">
            <StrategyChip label="القراءة الجهرية" icon="book" />
            <StrategyChip label="التعلّم التعاوني" icon="users" />
            <StrategyChip label="سؤال وجواب" icon="spark" />
          </div>
        </Reveal>

        <div className="grid items-start gap-5 lg:grid-cols-[1.12fr_0.88fr]">
          {/* Hadith card */}
          <Reveal>
            <article className="relative overflow-hidden rounded-[26px] border border-brand-100 bg-white p-0 shadow-card">
              <div className="relative overflow-hidden bg-gradient-to-l from-brand-800 via-brand-700 to-brand-600 px-5 py-5 text-white sm:px-7">
                <div className="pattern-grid absolute inset-0 opacity-30" aria-hidden="true" />
                <StarBurst className="absolute -left-4 -top-7 h-28 w-28 text-white/[0.08]" />
                <div className="relative flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-sand-100 ring-1 ring-white/20">
                      <Icon name="book" className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-[10px] font-medium text-brand-200">الحديث الأول</p>
                      <h3 className="font-display text-base font-extrabold sm:text-lg">أقرأ، وأجيب</h3>
                    </div>
                  </div>
                  <ListenButton trackId="pillars" label="استمع للحديث" variant="light" />
                </div>
              </div>

              <div className="relative bg-sand-50 px-5 py-6 sm:px-8 sm:py-8">
                <div className="absolute inset-y-8 right-0 w-1 rounded-l-full bg-gradient-to-b from-gold-400 to-brand-400 sm:right-4" aria-hidden="true" />
                <div className="relative">
                  <div className="mb-4 flex items-center gap-2 text-xs font-bold text-brand-600">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-100 text-[11px] font-extrabold text-brand-700">
                      ع
                    </span>
                    <span className="leading-6 text-muted">{firstHadith.narrator}</span>
                  </div>

                  <blockquote className="relative rounded-2xl border border-sand-200 bg-white/75 p-4 sm:p-6">
                    <Icon name="quote" className="absolute -top-3 right-4 h-7 w-7 text-gold-400" />
                    <p className="font-quran text-[19px] font-bold text-brand-900 sm:text-[24px] sm:leading-[2.2]">
                      {firstHadith.text}
                    </p>
                  </blockquote>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[10px] font-medium text-muted">{firstHadith.reference}</p>
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-bold text-brand-600">
                      <Icon name="bulb" className="h-3 w-3" />
                      ركّز على كلمة «خمس»
                    </span>
                  </div>
                </div>
              </div>
            </article>
          </Reveal>

          {/* Question card */}
          <Reveal delay={90}>
            <div className="relative overflow-hidden rounded-[26px] border border-brand-200 bg-white p-5 shadow-soft sm:p-6">
              <div className="absolute -left-6 -top-6 h-20 w-20 rounded-full bg-sand-100" aria-hidden="true" />
              <div className="relative">
                <div className="mb-4 flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gold-400/20 text-gold-600 ring-1 ring-gold-400/30">
                    <Icon name="bulb" className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="text-[10px] font-bold tracking-wider text-gold-600">سؤال المحطة</p>
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-brand-50 px-1.5 py-0.5 text-[8px] font-bold text-brand-600">
                        <Icon name="refresh" className="h-2.5 w-2.5" />
                        خيارات مخلوطة
                      </span>
                    </div>
                    <h3 className="font-display text-base font-extrabold leading-7 text-brand-900 sm:text-lg">
                      {firstHadith.question}
                    </h3>
                  </div>
                </div>

                <div className="space-y-2" role="radiogroup" aria-label={firstHadith.question}>
                  {options.map((option, index) => {
                    const active = selected === option;
                    const showCorrect = isCorrect && option === correctOption;
                    return (
                      <button
                        key={option}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        disabled={isCorrect}
                        onClick={() => choose(option)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl border px-3.5 py-2.5 text-right text-sm font-bold transition-all duration-200",
                          showCorrect
                            ? "border-brand-500 bg-brand-50 text-brand-800"
                            : checked && active
                              ? "border-clay-400/60 bg-orange-50 text-clay-600"
                              : active
                                ? "border-brand-500 bg-brand-50 text-brand-800 shadow-[0_4px_16px_-8px_rgba(15,116,107,0.5)]"
                                : "border-brand-100 bg-white text-brand-800 hover:border-brand-300 hover:bg-sand-50",
                        )}
                      >
                        <span
                          className={cn(
                            "grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[11px] font-extrabold",
                            showCorrect
                              ? "bg-brand-600 text-white"
                              : checked && active
                                ? "bg-clay-500 text-white"
                                : active
                                  ? "bg-brand-600 text-white"
                                  : "bg-brand-50 text-brand-500",
                          )}
                        >
                          {showCorrect ? <Icon name="check" className="h-3.5 w-3.5" /> : ["أ", "ب", "ج", "د"][index]}
                        </span>
                        <span className="flex-1">{option}</span>
                        <span
                          className={cn(
                            "grid h-4 w-4 place-items-center rounded-full border-2",
                            active || showCorrect ? "border-brand-500 bg-brand-500" : "border-brand-200",
                          )}
                        >
                          {(active || showCorrect) && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4">
                  {!isCorrect ? (
                    <Button onClick={check} disabled={selected === null} icon="check" className="w-full">
                      تحقّق من إجابتي
                    </Button>
                  ) : (
                    <div className="flex items-center justify-between gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-xs font-bold text-white">
                      <span className="flex items-center gap-2">
                        <Icon name="check" className="h-4 w-4 text-gold-400" />
                        أضيفت المحطة إلى إنجازك
                      </span>
                      <Icon name="star" className="h-4 w-4 text-gold-400" />
                    </div>
                  )}
                </div>

                {checked && (
                  <div className="mt-3.5">
                    {isCorrect ? (
                      <Feedback status="correct">{firstHadith.feedback}</Feedback>
                    ) : (
                      <Feedback status="incorrect">
                        ترتيب الصلاة ليس «{selected ?? "هذا"}»؛ أعِد النظر في الحديث، وتذكّر
                        أن الشهادتين تأتي أولًا.
                      </Feedback>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Reveal>
        </div>

        {/* Pillars */}
        <Reveal className="mt-6">
          <div className="relative overflow-hidden rounded-[26px] border border-brand-100 bg-white/90 p-5 shadow-soft sm:p-7">
            <div className="mb-6 flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
              <div>
                <p className="mb-1 text-[10px] font-bold tracking-[0.16em] text-brand-500">خريطة بصرية</p>
                <h3 className="font-display text-lg font-extrabold text-brand-900 sm:text-xl">
                  أركانُ الإسلامِ الخمسة
                </h3>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-sand-100 px-3 py-1.5 text-[11px] font-bold text-gold-600">
                <Icon name="star" className="h-3.5 w-3.5" />
                الصلاة هي الركن الثاني
              </span>
            </div>

            <ol className="relative grid gap-2.5 sm:grid-cols-2 xl:grid-cols-5">
              <span
                className="pointer-events-none absolute inset-x-8 top-9 hidden h-px bg-gradient-to-l from-brand-200 via-brand-300 to-brand-200 xl:block"
                aria-hidden="true"
              />
              {pillars.map((pillar, index) => (
                <li
                  key={pillar.title}
                  className={cn(
                    "relative flex items-center gap-3 rounded-2xl border p-3 transition-all duration-300 hover:-translate-y-0.5 xl:flex-col xl:items-start xl:gap-2",
                    pillar.highlighted
                      ? "border-gold-400/60 bg-sand-100/80 shadow-[0_14px_30px_-20px_rgba(188,141,49,0.8)]"
                      : "border-brand-100 bg-white hover:border-brand-200",
                  )}
                >
                  <div className="flex items-center gap-2 xl:w-full xl:justify-between">
                    <span
                      className={cn(
                        "grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-extrabold",
                        pillar.highlighted
                          ? "bg-gold-400 text-brand-900"
                          : "bg-brand-50 text-brand-600",
                      )}
                    >
                      {index + 1}
                    </span>
                    <Icon
                      name={pillarIcons[pillar.icon]}
                      className={cn("h-4.5 w-4.5 xl:mt-1", pillar.highlighted ? "text-gold-600" : "text-brand-300")}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className={cn("text-[9px] font-bold", pillar.highlighted ? "text-gold-600" : "text-muted")}>
                      الركن {pillar.order}
                    </p>
                    <p
                      className={cn(
                        "text-[11px] font-extrabold leading-5",
                        pillar.highlighted ? "text-brand-900" : "text-brand-800",
                      )}
                    >
                      {pillar.title}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
