import { Icon, Reveal, type IconName } from "./ui";

const objectives: { text: string; icon: IconName }[] = [
  { text: "يقرأ الأحاديث النبوية الواردة في الدرس قراءة سليمة.", icon: "book" },
  { text: "يحدّد ترتيب الصلاة بين أركان الإسلام الخمسة.", icon: "shahada" },
  { text: "يستنتج جزاء المحافظة على الصلوات الخمس.", icon: "trophy" },
  { text: "يكمل الفراغات ويرتّب الكلمات لتكوين جملة مفيدة.", icon: "pen" },
];

const plan = [
  { label: "التهيئة", time: "٢ د", icon: "bulb" as IconName, note: "سؤال محفّز عن أول ما يُحاسب عليه العبد." },
  { label: "العرض", time: "٦ د", icon: "book" as IconName, note: "قراءة الأحاديث واستخراج الفوائد." },
  { label: "التطبيق", time: "٤ د", icon: "users" as IconName, note: "فكر – ناقش – شارك مع الزميل." },
  { label: "التقويم", time: "٥ د", icon: "check" as IconName, note: "أنشطة تفاعلية وتغذية راجعة فورية." },
];

export function Objectives() {
  return (
    <section aria-labelledby="objectives-title" className="relative pb-2">
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-[26px] border border-brand-100 bg-white/85 p-5 shadow-soft sm:p-7">
            <div className="pointer-events-none absolute -left-10 -top-10 h-32 w-32 rounded-full bg-sand-100" aria-hidden="true" />
            <div className="relative grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
              <div>
                <div className="mb-4 flex items-center gap-2.5">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-700 text-white">
                    <Icon name="target" className="h-4.5 w-4.5" />
                  </span>
                  <div>
                    <p className="text-[10px] font-bold tracking-wider text-brand-500">بنية الدرس</p>
                    <h2 id="objectives-title" className="font-display text-base font-extrabold text-brand-900">
                      أهداف رحلتنا التعليمية
                    </h2>
                  </div>
                </div>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {objectives.map((objective, index) => (
                    <li
                      key={objective.text}
                      className="flex items-start gap-2.5 rounded-xl border border-brand-50 bg-brand-50/40 p-2.5"
                    >
                      <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white text-[10px] font-extrabold text-brand-600 shadow-sm">
                        {index + 1}
                      </span>
                      <span className="text-[11px] font-bold leading-6 text-brand-800">{objective.text}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {[
                    { label: "القراءة الجهرية", icon: "book" as IconName },
                    { label: "فكر – ناقش – شارك", icon: "users" as IconName },
                    { label: "الخريطة الذهنية", icon: "compass" as IconName },
                    { label: "التغذية الراجعة الفورية", icon: "check" as IconName },
                  ].map((strategy) => (
                    <span
                      key={strategy.label}
                      className="inline-flex items-center gap-1.5 rounded-full border border-gold-400/30 bg-sand-100 px-2.5 py-1 text-[10px] font-bold text-gold-600"
                    >
                      <Icon name={strategy.icon} className="h-3 w-3" />
                      {strategy.label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-brand-100 bg-sand-50/70 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-display text-xs font-extrabold text-brand-900">توزيع زمن الحصة</h3>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-muted">
                    <Icon name="clock" className="h-3 w-3" />
                    ١٧ دقيقة
                  </span>
                </div>
                <ol className="space-y-2">
                  {plan.map((item) => (
                    <li key={item.label} className="flex items-center gap-2.5">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white text-brand-600 shadow-sm">
                        <Icon name={item.icon} className="h-3.5 w-3.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[11px] font-extrabold text-brand-900">{item.label}</p>
                          <span className="rounded-full bg-brand-100 px-1.5 py-0.5 text-[9px] font-bold text-brand-700">
                            {item.time}
                          </span>
                        </div>
                        <p className="truncate text-[9px] font-medium text-muted">{item.note}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
