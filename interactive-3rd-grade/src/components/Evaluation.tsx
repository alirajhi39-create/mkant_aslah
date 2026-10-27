import { useEffect, useMemo, useState } from "react";
import { evaluation } from "../content";
import { formatScore, STATION_MARK, STATIONS_MAX, TOTAL_MAX } from "../classroom";
import { shuffle, shuffleDifferent } from "../shuffle";
import { ListenButton } from "./AudioPlayer";
import {
  Button,
  Confetti,
  Feedback,
  Icon,
  ProgressRing,
  Reveal,
  SectionHeading,
  StarBurst,
  cn,
} from "./ui";

const ar = (value: number) => value.toLocaleString("ar-EG");

type BlankId = string;
type Placements = Record<BlankId, string | null>;

export function Evaluation({
  onComplete,
  onOpenCertificate,
  onEvaluationScore,
  stationsCompleted = 0,
}: {
  onComplete: (key: "evaluation") => void;
  onOpenCertificate: () => void;
  onEvaluationScore?: (score: number) => void;
  stationsCompleted?: number;
}) {
  const initialPlacements = useMemo(
    () => Object.fromEntries(evaluation.fillBlank.sentences.map((sentence) => [sentence.id, null])) as Placements,
    [],
  );

  const [placements, setPlacements] = useState<Placements>(initialPlacements);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [fillChecked, setFillChecked] = useState(false);
  const [fillCorrect, setFillCorrect] = useState(false);
  const [showFillSolution, setShowFillSolution] = useState(false);

  const [hadithChoice, setHadithChoice] = useState<string | null>(null);
  const [hadithChecked, setHadithChecked] = useState(false);
  const [hadithCorrect, setHadithCorrect] = useState(false);

  const [ordered, setOrdered] = useState<string[]>([]);
  const [orderChecked, setOrderChecked] = useState(false);
  const [orderCorrect, setOrderCorrect] = useState(false);
  const [showOrderSolution, setShowOrderSolution] = useState(false);

  const [bankOrder, setBankOrder] = useState<string[]>(() => shuffle(evaluation.fillBlank.words));
  const [wordBank, setWordBank] = useState<string[]>(() => shuffle(evaluation.order.words));
  const hadithOptions = useMemo(() => shuffle(evaluation.hadith.options), []);

  const bankWords = bankOrder.filter((word) => !Object.values(placements).includes(word));

  const score = [fillCorrect, hadithCorrect, orderCorrect].filter(Boolean).length;
  const allCorrect = score === 3;
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    // لا نمسح درجة طالب سابق عند فتح التقويم؛ تُحدَّث الدرجة بعد أول محاولة.
    if (!touched) return;
    onEvaluationScore?.(score);
  }, [onEvaluationScore, score, touched]);

  useEffect(() => {
    if (allCorrect) onComplete("evaluation");
  }, [allCorrect, onComplete]);

  const placeWord = (blankId: BlankId, word: string) => {
    if (fillCorrect) return;
    setPlacements((previous) => {
      const next = { ...previous };
      // إن كانت الكلمة موضوعة في فراغ آخر فسنفكها أولًا
      Object.keys(next).forEach((key) => {
        if (next[key] === word) next[key] = null;
      });
      next[blankId] = word;
      return next;
    });
    setSelectedWord(null);
    setFillChecked(false);
  };

  const clearBlank = (blankId: BlankId) => {
    if (fillCorrect) return;
    setPlacements((previous) => ({ ...previous, [blankId]: null }));
    setFillChecked(false);
  };

  const checkFill = () => {
    setTouched(true);
    const correct = evaluation.fillBlank.sentences.every(
      (sentence) => placements[sentence.id] === sentence.answer,
    );
    setFillCorrect(correct);
    setFillChecked(true);
    if (!correct) setShowFillSolution(false);
  };

  const resetFill = () => {
    setPlacements(initialPlacements);
    setFillCorrect(false);
    setFillChecked(false);
    setShowFillSolution(false);
    setSelectedWord(null);
    setBankOrder((previous) => shuffleDifferent(evaluation.fillBlank.words, previous));
  };

  const checkHadith = () => {
    if (!hadithChoice) return;
    setTouched(true);
    const correct = hadithChoice === evaluation.hadith.correctId;
    setHadithCorrect(correct);
    setHadithChecked(true);
  };

  const checkOrder = () => {
    if (ordered.length !== evaluation.order.correct.length) return;
    setTouched(true);
    const correct = ordered.every((word, index) => word === evaluation.order.correct[index]);
    setOrderCorrect(correct);
    setOrderChecked(true);
    if (!correct) setShowOrderSolution(false);
  };

  const resetOrder = () => {
    setOrdered([]);
    setOrderCorrect(false);
    setOrderChecked(false);
    setShowOrderSolution(false);
    setWordBank((previous) => shuffleDifferent(evaluation.order.words, previous));
  };

  const resetAll = () => {
    resetFill();
    setHadithChoice(null);
    setHadithChecked(false);
    setHadithCorrect(false);
    resetOrder();
  };

  return (
    <section
      id="evaluation"
      aria-labelledby="evaluation-title"
      className="scroll-margin-section relative overflow-hidden py-16"
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -right-20 top-20 h-80 w-80 rounded-full bg-sand-200/50 blur-3xl" />
        <div className="absolute -left-10 bottom-32 h-72 w-72 rounded-full bg-brand-100/50 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            eyebrow="المحطة الرابعة · التقويم"
            title="نقيس ما تعلمناه"
            description={evaluation.intro}
            icon="check"
            tone="clay"
          />
        </Reveal>

        <Reveal className="mb-5">
          <div className="flex flex-col items-stretch justify-between gap-3 rounded-2xl border border-brand-100 bg-white/90 p-3 shadow-soft sm:flex-row sm:items-center sm:p-4">
            <div className="flex items-center gap-3">
              <ProgressRing value={(score / 3) * 100} size={46} stroke={4.5} />
              <div>
                <p className="text-[10px] font-bold text-muted">الدرجة الكلية للدرس</p>
                <p className="whitespace-nowrap font-display text-sm font-extrabold text-brand-900" dir="ltr">
                  {formatScore(Math.min(TOTAL_MAX, stationsCompleted * STATION_MARK + score))}
                  <span className="mx-0.5 text-[10px] text-muted">/</span>
                  {formatScore(TOTAL_MAX)}
                </p>
                <p className="text-[9px] font-semibold text-muted">
                  المحطات <span dir="ltr">{formatScore(stationsCompleted * STATION_MARK)} / {formatScore(STATIONS_MAX)}</span>{" "}
                  · التقويم <span dir="ltr">{ar(score)} / ٣</span>
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {[
                { label: "الفراغات", done: fillCorrect },
                { label: "الاستنتاج", done: hadithCorrect },
                { label: "الترتيب", done: orderCorrect },
              ].map((item) => (
                <span
                  key={item.label}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold",
                    item.done ? "bg-brand-50 text-brand-700" : "bg-sand-100 text-muted",
                  )}
                >
                  <Icon name={item.done ? "check" : "lock"} className="h-3 w-3" />
                  {item.label}
                </span>
              ))}
              <Button variant="ghost" size="sm" icon="refresh" onClick={resetAll} className="text-xs">
                إعادة الكل
              </Button>
            </div>
          </div>
        </Reveal>

        <div className="grid items-start gap-5">
          {/* Exercise 1 */}
          <Reveal>
            <article className="overflow-hidden rounded-[26px] border border-brand-100 bg-white shadow-soft">
              <header className="flex flex-wrap items-center justify-between gap-2 border-b border-brand-50 bg-sand-50/80 px-5 py-3.5 sm:px-6">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-brand-700 font-display text-xs font-extrabold text-white">
                    ١
                  </span>
                  <h3 className="font-display text-sm font-extrabold text-brand-900 sm:text-base">
                    {evaluation.fillBlank.title}
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-muted">اسحب الكلمة أو اضغطها ثم اختر الفراغ</span>
              </header>

              <div className="p-5 sm:p-6">
                <div className="space-y-4">
                  {evaluation.fillBlank.sentences.map((sentence) => {
                    const value = placements[sentence.id];
                    const correct = fillChecked && value === sentence.answer;
                    const wrong = fillChecked && value !== sentence.answer;
                    return (
                      <div
                        key={sentence.id}
                        className="rounded-xl border border-brand-50 bg-brand-50/20 p-3.5 text-sm font-bold leading-9 text-brand-900 sm:text-[15px]"
                      >
                        <span>{sentence.before} </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (selectedWord) placeWord(sentence.id, selectedWord);
                            else if (value) clearBlank(sentence.id);
                          }}
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={(event) => {
                            event.preventDefault();
                            const word = event.dataTransfer.getData("text/plain");
                            if (word) placeWord(sentence.id, word);
                          }}
                          aria-label={value ? `إزالة ${value}` : "اختر الفراغ لوضع الكلمة"}
                          className={cn(
                            "mx-1 inline-flex min-w-[110px] items-center justify-center gap-1.5 rounded-lg border-2 border-dashed px-3 py-1 align-middle text-xs font-extrabold transition-all",
                            value
                              ? correct
                                ? "border-brand-500 bg-brand-50 text-brand-800"
                                : wrong
                                  ? "border-clay-400 bg-orange-50 text-clay-600"
                                  : "border-brand-300 bg-white text-brand-700"
                              : selectedWord
                                ? "border-gold-400 bg-sand-100 text-gold-600 hover:bg-sand-200"
                                : "border-brand-200 bg-white text-muted",
                          )}
                        >
                          {value ?? "......."}
                          {value && <Icon name="close" className="h-3 w-3 opacity-60" />}
                        </button>
                        <span>{sentence.after}</span>
                        {fillChecked && (
                          <span
                            className={cn(
                              "mr-1 inline-grid h-5 w-5 place-items-center rounded-full align-middle",
                              correct ? "bg-brand-500 text-white" : "bg-clay-500 text-white",
                            )}
                          >
                            <Icon name={correct ? "check" : "close"} className="h-3 w-3" />
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 rounded-xl border border-dashed border-brand-200 bg-white p-3">
                  <p className="mb-2 flex items-center gap-1.5 text-[10px] font-extrabold text-brand-500">
                    بنك الكلمات
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-1.5 py-0.5 text-[8px] font-bold text-brand-600">
                      <Icon name="refresh" className="h-2.5 w-2.5" />
                      ترتيب مخلوط
                    </span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {bankWords.length === 0 && (
                      <span className="text-[11px] font-medium text-muted">وضعت جميع الكلمات، تحقّق من إجابتك.</span>
                    )}
                    {bankWords.map((word) => (
                      <button
                        key={word}
                        type="button"
                        draggable={!fillCorrect}
                        onDragStart={(event) => {
                          event.dataTransfer.setData("text/plain", word);
                          setSelectedWord(word);
                        }}
                        onClick={() => setSelectedWord(selectedWord === word ? null : word)}
                        disabled={fillCorrect}
                        aria-pressed={selectedWord === word}
                        className={cn(
                          "inline-flex cursor-grab items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-extrabold transition-all active:cursor-grabbing",
                          selectedWord === word
                            ? "border-gold-400 bg-sand-100 text-brand-900 shadow-sm"
                            : "border-brand-200 bg-white text-brand-700 hover:border-brand-400 hover:bg-brand-50",
                        )}
                      >
                        {word}
                        {selectedWord === word && <Icon name="arrow" className="h-3 w-3 rotate-90" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Button size="sm" onClick={checkFill} disabled={Object.values(placements).some((v) => !v) || fillCorrect} icon="check">
                    صحّح إجابتي
                  </Button>
                  {fillChecked && !fillCorrect && (
                    <Button
                      size="sm"
                      variant="ghost"
                      icon="bulb"
                      onClick={() => setShowFillSolution((previous) => !previous)}
                    >
                      {showFillSolution ? "إخفاء الحل" : "اعرض الحل"}
                    </Button>
                  )}
                  <Button size="sm" variant="outline" icon="refresh" onClick={resetFill}>
                    إعادة المحاولة
                  </Button>
                </div>

                {fillChecked && (
                  <div className="mt-3.5">
                    {fillCorrect ? (
                      <Feedback status="correct">أحسنت! أكملت الفراغات إكمالًا صحيحًا، ونلت نقطة هذا النشاط.</Feedback>
                    ) : (
                      <Feedback status="incorrect">
                        راجع الحديث الأول في بداية الدرس، ثم أعد المحاولة.
                      </Feedback>
                    )}
                  </div>
                )}
                {showFillSolution && (
                  <div className="mt-3 rounded-xl bg-sand-100 px-4 py-2.5 text-xs font-extrabold text-brand-800">
                    {evaluation.fillBlank.solution}
                  </div>
                )}
              </div>
            </article>
          </Reveal>

          {/* Exercise 2 */}
          <Reveal delay={60}>
            <article className="overflow-hidden rounded-[26px] border border-brand-100 bg-white shadow-soft">
              <header className="flex flex-wrap items-center justify-between gap-2 border-b border-brand-50 bg-sand-50/80 px-5 py-3.5 sm:px-6">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-brand-700 font-display text-xs font-extrabold text-white">
                    ٢
                  </span>
                  <h3 className="max-w-xl font-display text-sm font-extrabold leading-6 text-brand-900 sm:text-base">
                    {evaluation.hadith.title}
                  </h3>
                </div>
                <ListenButton trackId="guardian" label="استمع للحديث" />
              </header>

              <div className="p-5 sm:p-6">
                <div className="relative overflow-hidden rounded-2xl border border-sand-200 bg-sand-50 p-4 sm:p-5">
                  <div className="absolute inset-y-0 right-0 w-1 bg-brand-400" aria-hidden="true" />
                  <p className="mb-2 text-[11px] font-bold text-muted">{evaluation.hadith.narrator}</p>
                  <p className="font-quran text-lg font-bold leading-[2.15] text-brand-900 sm:text-[22px]">
                    {evaluation.hadith.text}
                  </p>
                  <p className="mt-2 text-[10px] font-medium text-muted">{evaluation.hadith.reference}</p>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label={evaluation.hadith.title}>
                  {hadithOptions.map((option) => {
                    const selected = hadithChoice === option.id;
                    const isRight = hadithChecked && option.correct;
                    const isWrong = hadithChecked && selected && !option.correct;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        disabled={hadithCorrect}
                        onClick={() => {
                          setHadithChoice(option.id);
                          setHadithChecked(false);
                        }}
                        className={cn(
                          "flex items-start gap-2.5 rounded-xl border p-3 text-right text-xs font-bold leading-6 transition-all",
                          isRight
                            ? "border-brand-500 bg-brand-50 text-brand-800"
                            : isWrong
                              ? "border-clay-400 bg-orange-50 text-clay-600"
                              : selected
                                ? "border-gold-400 bg-sand-100 text-brand-900"
                                : "border-brand-100 text-brand-800 hover:border-brand-300 hover:bg-sand-50",
                        )}
                      >
                        <span
                          className={cn(
                            "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border",
                            isRight
                              ? "border-brand-600 bg-brand-600 text-white"
                              : isWrong
                                ? "border-clay-500 bg-clay-500 text-white"
                                : selected
                                  ? "border-gold-400 bg-gold-400 text-brand-900"
                                  : "border-brand-200 text-brand-400",
                          )}
                        >
                          <Icon name={isRight ? "check" : isWrong ? "close" : "bulb"} className="h-2.5 w-2.5" />
                        </span>
                        {option.text}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {!hadithCorrect && (
                    <Button size="sm" onClick={checkHadith} disabled={!hadithChoice} icon="check">
                      تحقّق من استنتاجي
                    </Button>
                  )}
                  {(hadithCorrect || hadithChecked) && (
                    <Button
                      size="sm"
                      variant="outline"
                      icon="refresh"
                      onClick={() => {
                        setHadithChoice(null);
                        setHadithChecked(false);
                        setHadithCorrect(false);
                      }}
                    >
                      إعادة المحاولة
                    </Button>
                  )}
                </div>

                {hadithChecked && (
                  <div className="mt-3.5">
                    <Feedback status={hadithCorrect ? "correct" : "incorrect"}>
                      {hadithCorrect
                        ? evaluation.hadith.feedback
                        : "تأمّل آخر الحديث: «كان له عندَ اللهِ عهدٌ…»، وحدّد الجزاء الصحيح."}
                    </Feedback>
                  </div>
                )}
              </div>
            </article>
          </Reveal>

          {/* Exercise 3 */}
          <Reveal delay={120}>
            <article className="overflow-hidden rounded-[26px] border border-brand-100 bg-white shadow-soft">
              <header className="flex flex-wrap items-center justify-between gap-2 border-b border-brand-50 bg-sand-50/80 px-5 py-3.5 sm:px-6">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-brand-700 font-display text-xs font-extrabold text-white">
                    ٣
                  </span>
                  <h3 className="font-display text-sm font-extrabold text-brand-900 sm:text-base">
                    {evaluation.order.title}
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-muted">
                  اضغط الكلمة لإضافتها، واضغطها في الجملة لإرجاعها
                </span>
              </header>

              <div className="p-5 sm:p-6">
                <div
                  className={cn(
                    "flex min-h-[76px] flex-wrap items-center gap-2 rounded-2xl border-2 border-dashed p-3 transition-colors",
                    orderCorrect ? "border-brand-400 bg-brand-50/60" : orderChecked ? "border-clay-400/60 bg-orange-50/40" : "border-brand-200 bg-brand-50/30",
                  )}
                  aria-live="polite"
                >
                  {ordered.length === 0 && (
                    <span className="px-2 text-[11px] font-medium text-muted">ابدأ باختيار الكلمة الأولى...</span>
                  )}
                  {ordered.map((word, index) => (
                    <button
                      key={`${word}-${index}`}
                      type="button"
                      disabled={orderCorrect}
                      onClick={() => {
                        setOrdered((previous) => previous.filter((_, position) => position !== index));
                        setOrderChecked(false);
                        setOrderCorrect(false);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-brand-300 bg-white px-3 py-1.5 text-xs font-extrabold text-brand-800 shadow-sm transition hover:border-brand-400 hover:bg-sand-50"
                    >
                      <span className="grid h-4 w-4 place-items-center rounded-full bg-brand-100 text-[9px] text-brand-600">
                        {ar(index + 1)}
                      </span>
                      {word}
                    </button>
                  ))}
                  {orderCorrect && (
                    <span className="ms-auto inline-flex items-center gap-1 rounded-full bg-brand-600 px-2.5 py-1 text-[10px] font-bold text-white">
                      <Icon name="check" className="h-3 w-3" />
                      جملة صحيحة
                    </span>
                  )}
                </div>

                <div className="mt-1 flex items-center justify-between gap-2">
                  <p className="text-[10px] font-bold text-brand-500">الكلمات المتاحة</p>
                  <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-1.5 py-0.5 text-[8px] font-bold text-brand-600">
                    <Icon name="refresh" className="h-2.5 w-2.5" />
                    ترتيب مخلوط
                  </span>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-2 rounded-xl border border-dashed border-sand-300 bg-sand-50 p-3">
                  {wordBank.map((word) => {
                    const used = ordered.includes(word);
                    return (
                      <button
                        key={word}
                        type="button"
                        onClick={() => {
                          if (orderCorrect) return;
                          setOrdered((previous) => [...previous, word]);
                          setOrderChecked(false);
                          setOrderCorrect(false);
                        }}
                        disabled={used || orderCorrect}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-extrabold transition-all",
                          used
                            ? "cursor-not-allowed border-sand-200 bg-sand-100/60 text-muted/50 line-through"
                            : "border-brand-200 bg-white text-brand-700 hover:-translate-y-0.5 hover:border-brand-400 hover:bg-brand-50",
                        )}
                      >
                        {word}
                        {!used && <Icon name="arrow" className="h-3 w-3 rotate-90 opacity-50" />}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    onClick={checkOrder}
                    disabled={ordered.length !== evaluation.order.correct.length || orderCorrect}
                    icon="check"
                  >
                    تحقّق من الترتيب
                  </Button>
                  <Button size="sm" variant="outline" icon="refresh" onClick={resetOrder}>
                    إعادة المحاولة
                  </Button>
                  {orderChecked && !orderCorrect && (
                    <Button size="sm" variant="ghost" icon="bulb" onClick={() => setShowOrderSolution((p) => !p)}>
                      {showOrderSolution ? "إخفاء الحل" : "اعرض الجملة الصحيحة"}
                    </Button>
                  )}
                </div>

                {orderChecked && (
                  <div className="mt-3.5">
                    <Feedback status={orderCorrect ? "correct" : "incorrect"}>
                      {orderCorrect
                        ? "رائع! رتّبت الكلمات، وأصبحت جملة مفيدة تذكّرنا بالمحافظة على الصلوات الخمس."
                        : "ليست هذه الجملة الصحيحة؛ جرّب أن تبدأ بـ «محافظتي» ثم «على أداء»."}
                    </Feedback>
                  </div>
                )}
                {showOrderSolution && (
                  <div className="mt-3 rounded-xl bg-sand-100 px-4 py-2.5 text-xs font-extrabold text-brand-800">
                    {evaluation.order.solution}
                  </div>
                )}
              </div>
            </article>
          </Reveal>
        </div>

        {/* Completion */}
        <Reveal className="mt-5">
          <div
            className={cn(
              "relative overflow-hidden rounded-[26px] border p-5 sm:p-6",
              allCorrect
                ? "border-gold-400/60 bg-gradient-to-l from-brand-800 via-brand-700 to-brand-600 text-white shadow-lift"
                : "border-brand-100 bg-white/80",
            )}
          >
            {allCorrect ? (
              <>
                <Confetti seed={3} />
                <div className="relative flex flex-col items-center gap-4 text-center sm:flex-row sm:text-right">
                  <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gold-400 text-brand-900 shadow-lg">
                    <Icon name="trophy" className="h-8 w-8" />
                  </span>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold tracking-[0.18em] text-gold-400">ما شاء الله!</p>
                    <h3 className="font-display text-xl font-extrabold">أتممت التقويم بامتياز</h3>
                    <p className="mt-1 text-xs leading-6 text-brand-100">
                      أجبت عن الأنشطة الثلاثة إجابة صحيحة، وأصبحت جاهزًا لبطاقة الإنجاز.
                    </p>
                  </div>
                  <Button variant="gold" size="md" icon="trophy" onClick={onOpenCertificate} className="shrink-0">
                    استعرض بطاقة إنجازك
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-right">
                <span className="relative grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-sand-100 text-gold-600">
                  <StarBurst className="absolute inset-0 h-full w-full opacity-20" />
                  <Icon name="target" className="relative h-6 w-6" />
                </span>
                <div className="flex-1">
                  <h3 className="font-display text-sm font-extrabold text-brand-900 sm:text-base">
                    أكمل الأنشطة الثلاثة لتصل إلى بطاقة الإنجاز
                  </h3>
                  <p className="mt-1 text-[11px] leading-6 text-muted">
                    حصلت على {ar(score)} من ٣ حتى الآن. كل محاولة جديدة فرصة للتعلّم.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {[fillCorrect, hadithCorrect, orderCorrect].map((done, index) => (
                    <span
                      key={index}
                      className={cn(
                        "grid h-8 w-8 place-items-center rounded-full text-[10px] font-extrabold",
                        done ? "bg-brand-600 text-white" : "bg-brand-50 text-brand-400",
                      )}
                    >
                      <Icon name={done ? "check" : "star"} className="h-4 w-4" />
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
