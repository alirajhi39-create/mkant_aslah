import { useEffect, useRef, useState } from "react";
import prayerStillLife from "../assets/prayer-still-life.jpg?inline";
import { activityHadith } from "../content";
import { ListenButton } from "./AudioPlayer";
import {
  Button,
  Feedback,
  Icon,
  Reveal,
  StarBurst,
  StrategyChip,
  cn,
  type IconName,
} from "./ui";

const REFLECTION_KEY = "salah-reflection-v1";
const reflectionKey = (studentId: string) => `${REFLECTION_KEY}:${studentId}`;

const thinkSteps: { title: string; text: string; icon: IconName }[] = [
  {
    title: "أفكّر",
    text: "أقرأ الحديث بتأنٍّ، وأحدّد أول ما يُحاسب عليه العبد يوم القيامة.",
    icon: "bulb",
  },
  {
    title: "أناقش",
    text: "أشارك زميلي ما فهمته من الحديث، وأستمع إلى استنتاجه.",
    icon: "users",
  },
  {
    title: "أشارك",
    text: "أكتب استفادتي بأسلوبي، ثم أعرضها على صفي.",
    icon: "pen",
  },
];

export function ActivitySection({
  onComplete,
  onResult,
  studentId,
}: {
  onComplete: (key: "activity") => void;
  onResult?: (task: "activity", correct: boolean) => void;
  studentId: string;
}) {
  const [value, setValue] = useState("");
  const [saved, setSaved] = useState(false);
  const [showModel, setShowModel] = useState(false);
  const [step, setStep] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // كل طالب يبدأ بمساحة تدبّر فارغة، وتُحفظ إجابته باسمه فقط.
    setValue("");
    setSaved(false);
    setShowModel(false);
    setStep(0);
    try {
      const stored = window.localStorage.getItem(reflectionKey(studentId));
      if (stored) {
        setValue(stored);
        setSaved(true);
      }
    } catch {
      /* التخزين غير متاح */
    }
  }, [studentId]);

  const handleSave = () => {
    if (value.trim().length < 4) return;
    try {
      window.localStorage.setItem(reflectionKey(studentId), value.trim());
    } catch {
      /* يُكمل الطالب دون حفظ دائم */
    }
    setSaved(true);
    onResult?.("activity", true);
    onComplete("activity");
  };

  const revealModel = () => {
    setShowModel((previous) => !previous);
    onComplete("activity");
  };

  const chooseStep = (index: number) => {
    setStep(index);
    if (index === 2) textareaRef.current?.focus();
  };

  return (
    <section
      id="activity"
      aria-labelledby="activity-title"
      className="scroll-margin-section relative overflow-hidden bg-brand-900 py-16 text-sand-50"
    >
      <div className="pattern-grid pointer-events-none absolute inset-0 opacity-25" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-24 top-10 h-96 w-96 rounded-full bg-brand-500/20 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -left-24 bottom-10 h-80 w-80 rounded-full bg-gold-500/10 blur-3xl" aria-hidden="true" />
      <StarBurst className="pointer-events-none absolute left-10 top-14 h-16 w-16 animate-twinkle text-gold-400/40" />
      <StarBurst className="pointer-events-none absolute bottom-16 right-8 h-24 w-24 animate-twinkle text-brand-400/30 [animation-delay:1.2s]" />

      <div className="relative mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
        <Reveal className="mb-9 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <p className="mb-2 flex items-center gap-2 text-[11px] font-bold tracking-[0.18em] text-gold-400">
              <span className="inline-block h-px w-7 bg-gold-400" />
              المحطة الثانية · نشاط
            </p>
            <h2 id="activity-title" className="font-display text-2xl font-extrabold leading-snug text-white sm:text-3xl">
              ماذا نستفيد من حديث النبي ﷺ؟
            </h2>
            <p className="mt-2 text-sm leading-7 text-brand-100/80">
              نتأمّل الحديث الشريف، ثم نتبادل الاستنتاج مع الزميل ونكتبه في مساحة التدبّر.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StrategyChip label="فكر – ناقش – شارك" icon="users" />
            <StrategyChip label="الاستنتاج" icon="bulb" />
          </div>
        </Reveal>

        <div className="grid items-stretch gap-5 lg:grid-cols-[0.82fr_1.18fr]">
          {/* Illustration */}
          <Reveal className="order-2 lg:order-1">
            <figure className="relative h-full min-h-[340px] overflow-hidden rounded-[26px] border border-white/15 bg-brand-800">
              <img
                src={prayerStillLife}
                alt="رسم أنمي لسجادة صلاة خضراء ومسبحة وفانوس عند نافذة في وقت الفجر"
                className="h-full w-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-900 via-brand-900/25 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-bold text-sand-100 backdrop-blur">
                  <Icon name="target" className="h-3 w-3 text-gold-400" />
                  فرصة للتدبّر
                </span>
                <p className="font-serif text-xl leading-9 text-white">
                  «إنَّ أوَّلَ ما يُحاسَبُ به العبدُ... صلاتُه»
                </p>
              </div>
              <div className="absolute right-4 top-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-brand-900/50 text-gold-400 backdrop-blur-md">
                <Icon name="mosque" className="h-7 w-7" />
              </div>
            </figure>
          </Reveal>

          {/* Hadith */}
          <Reveal delay={90} className="order-1 lg:order-2">
            <article className="relative flex h-full flex-col overflow-hidden rounded-[26px] border border-white/20 bg-sand-50 text-ink shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sand-200 bg-sand-100/80 px-5 py-4 sm:px-6">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-700 text-sand-50">
                    <Icon name="quote" className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-[9px] font-bold text-gold-600">الحديث الثاني</p>
                    <h3 className="font-display text-sm font-extrabold text-brand-900">أولُ ما يُحاسبُ عليه العبدُ</h3>
                  </div>
                </div>
                <ListenButton trackId="first-account" label="استمع للحديث" />
              </div>

              <div className="relative flex flex-1 flex-col justify-center px-5 py-6 sm:px-7">
                <div className="pattern-dots pointer-events-none absolute inset-0 opacity-20" aria-hidden="true" />
                <div className="relative">
                  <p className="mb-3 text-xs font-bold text-brand-600">{activityHadith.narrator}</p>
                  <p className="font-quran text-[20px] font-bold leading-[2.2] text-brand-900 sm:text-[25px]">
                    {activityHadith.text}
                  </p>
                  <p className="mt-5 text-[10px] font-medium text-muted">{activityHadith.reference}</p>
                </div>
              </div>
            </article>
          </Reveal>
        </div>

        {/* Strategy + reflection */}
        <Reveal className="mt-5">
          <div className="overflow-hidden rounded-[26px] border border-white/15 bg-white/[0.06] p-4 backdrop-blur-sm sm:p-6">
            <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-gold-400 text-brand-900">
                    <Icon name="users" className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-[9px] font-bold text-brand-200">استراتيجية التعلم</p>
                    <h3 className="font-display text-sm font-extrabold text-white">فكر – ناقش – شارك</h3>
                  </div>
                </div>
                <div className="space-y-2">
                  {thinkSteps.map((item, index) => {
                    const isActive = step === index;
                    return (
                      <button
                        key={item.title}
                        type="button"
                        onClick={() => chooseStep(index)}
                        aria-pressed={isActive}
                        className={cn(
                          "flex w-full items-start gap-2.5 rounded-xl border p-2.5 text-right transition-all",
                          isActive
                            ? "border-gold-400/60 bg-white/10"
                            : "border-white/10 bg-transparent hover:border-white/25 hover:bg-white/5",
                        )}
                      >
                        <span
                          className={cn(
                            "grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px] font-extrabold",
                            isActive ? "bg-gold-400 text-brand-900" : "bg-white/10 text-brand-200",
                          )}
                        >
                          {index + 1}
                        </span>
                        <span className="min-w-0">
                          <span className={cn("block text-[11px] font-extrabold", isActive ? "text-white" : "text-brand-100")}>
                            {item.title}
                          </span>
                          <span className={cn("mt-0.5 block text-[10px] leading-5", isActive ? "text-brand-100" : "text-brand-200/70")}>
                            {item.text}
                          </span>
                        </span>
                        <Icon
                          name={item.icon}
                          className={cn("ms-auto h-4 w-4 shrink-0", isActive ? "text-gold-400" : "text-white/25")}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl bg-sand-50 p-4 text-ink sm:p-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-display text-sm font-extrabold text-brand-900 sm:text-base">
                    {activityHadith.question}
                  </h3>
                  <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-bold text-brand-600">
                    مساحة التدبّر
                  </span>
                </div>

                <label htmlFor="reflection" className="sr-only">
                  اكتب استفادتك من الحديث
                </label>
                <textarea
                  id="reflection"
                  ref={textareaRef}
                  value={value}
                  onChange={(event) => {
                    setValue(event.target.value);
                    setSaved(false);
                  }}
                  rows={4}
                  maxLength={300}
                  placeholder="أستفيد من الحديث أن..."
                  className="w-full resize-none rounded-xl border border-brand-200 bg-white p-3.5 text-sm leading-7 text-ink outline-none transition placeholder:text-muted/60 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
                />

                <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[10px] font-medium text-muted">{value.length} / ٣٠٠ حرف</span>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" icon="bulb" onClick={revealModel}>
                      {showModel ? "إخفاء" : "إجابة نموذجية"}
                    </Button>
                    <Button size="sm" icon={saved ? "check" : "pen"} onClick={handleSave} disabled={value.trim().length < 4}>
                      {saved ? "تم حفظ إجابتي" : "احفظ إجابتي"}
                    </Button>
                  </div>
                </div>

                {showModel && (
                  <div className="mt-3">
                    <Feedback status="info">{activityHadith.modelAnswer}</Feedback>
                  </div>
                )}

                {saved && !showModel && (
                  <div className="mt-3">
                    <Feedback status="correct">
                      أحسنت! حُفظت استفادتك، شاركها مع زميلك أو معلّمك.
                    </Feedback>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
