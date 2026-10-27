# نشر درس «مكانة الصلاة» وتغيير قاعدة البيانات

## ⚠️ حل مشكلة Vercel الشائعة
إذا ظهر في سجل البناء:

> A Serverless Function has an invalid name: "interactive-3rd-grade-lesson-plan (1)/api/class/[code]/delete.js".
> They must be less than 128 characters long and must not contain any space.

فالسبب أن **جذر المشروع على Vercel** يحتوي مجلدًا أبًا في اسمه مسافة أو قوسان، فيصبح هذا النص جزءًا من اسم دالة الخادم.
الحل بأحد الخيارين:

**الخيار الأول (المفضّل): اجعل ملفات المشروع في جذر المستودع**
- افتح المستودع على GitHub، وانقل محتويات المجلد إلى الجذر مباشرة، بحيث ترى `package.json` في الصفحة الأولى.
- يجب ألا يبقى المجلد القديم `interactive-3rd-grade-lesson-plan (1)` داخل المستودع.
- أعد النشر.

**الخيار الثاني: اضبط Root Directory**
1. في Vercel: **Project → Settings → General → Root Directory**.
2. اختر المجلد الداخلي الذي يحتوي `package.json` و`api`.
3. إن كان اسمه يحتوي مسافة أو أقواسًا، أعد تسميته أولًا في GitHub إلى اسم بسيط بلا مسافات، مثل `salah-lesson`.
4. أعد النشر (Redeploy).

كما تم تبسيط مسارات الدوال إلى ملفات مباشرة داخل `api/`:
`/api/health` و`/api/student` و`/api/roster` و`/api/delete` و`/api/migrate`
بدل مسارات ذات أقواس، ونُقلت الملفات المساعدة إلى `server/`
(`server/store.js` و`server/redis.js`) حتى لا تُحسب كدوال منفصلة.

قبل الرفع نفّذ:

```bash
node tools/preflight.mjs
```

وسيطبع المسارات ويحذّر من أي اسم مجلد يحتوي مسافة أو قوسين.

للتحقق السريع: افتح `https://موقعك/api/health`؛ يجب أن يعيد JSON يحتوي `"ok": true`.

---

## الفكرة
الواجهة والمراحل وتقدّم الطلاب كلها كما هي؛ التغيير الوحيد هو **مكان حفظ السجل المشترك**.
طبقة التخزين في `api/_store.js` تدعم ثلاثة مزوّدين، ويُختار المزوّد تلقائيًا حسب متغيّرات البيئة:

| المزوّد | المتغيّرات المطلوبة | إنشاء الجدول |
| --- | --- | --- |
| **Supabase** (موصى به) | `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` | نفّذ `database/supabase.sql` |
| **Neon / PostgreSQL** | `DATABASE_URL` | تلقائيًا (أو `database/postgres.sql`) |
| Upstash Redis (قديم) | `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` أو `KV_REST_API_URL` + `KV_REST_API_TOKEN` | تلقائيًا |

للتحقق من المزوّد النشط: افتح `/api/health`.
يمكن فرض مزوّد معيّن عند وجود أكثر من واحد: `STORAGE_PROVIDER=supabase` أو `postgres` أو `redis`.

> إذا كنت لا تريد السجل المشترك نهائيًا: احذف متغيرات البيئة كلها.
> سيبقى الدرس يعمل ويحفظ تقدّم كل طالب في متصفحه، وتظهر في نهاية الدرس رسالة توضح ذلك.

---

## الخيار ١: Supabase (الأسهل والموصى به)
1. أنشئ حسابًا على [supabase.com](https://supabase.com) ثم **New project** (الخطة المجانية تكفي).
2. من **SQL Editor → New query** نفّذ محتوى `database/supabase.sql` ثم **Run**.
3. من **Project Settings → API** انسخ:
   - **Project URL** → ضعه في `SUPABASE_URL`
   - **service_role key** → ضعه في `SUPABASE_SERVICE_ROLE_KEY`
4. في Vercel: **Settings → Environment Variables** أضف المتغيّرين.
5. اضغط **Deployments → Redeploy**.
6. افتح `/api/health` وتأكد من `"provider":"Supabase"` و`"reachable":true`.

> لا تضع `service_role` في الواجهة أو في مستودع GitHub؛ تُستخدم فقط داخل دوال Vercel.

---

## الخيار ٢: Neon / PostgreSQL
1. أنشئ قاعدة على [neon.tech](https://neon.tech) (مجانية) أو استخدم أي PostgreSQL متوافق.
2. انسخ **Connection string** (مع `sslmode=require`).
3. أضفه في Vercel باسم `DATABASE_URL`.
4. أعد النشر. سينشئ التطبيق جدول `salah_students` تلقائيًا عند أول عملية.
5. افتح `/api/health` وتأكد من `"provider":"PostgreSQL (Neon)"`.

> يعمل عبر HTTP الخاص بـ Neon، ولا يحتاج اتصال TCP دائم.

---

## الخيار ٣: Upstash Redis (الوضع القديم)
1. من Vercel: **Storage / Marketplace → Upstash Redis → Connect Project**.
2. أعد النشر. المتغيّرات `KV_REST_API_URL` و`KV_REST_API_TOKEN` تُضاف تلقائيًا.

---

## ترحيل بيانات السجل القديم (اختياري)
إذا كان لديك طلاب مسجّلون في Upstash وتريد نقلهم إلى Supabase/Postgres:

1. أضف متغيّرات المزوّد الجديد **مع الإبقاء** على متغيّرات Redis.
2. أعد النشر.
3. نفّذ من جهازك:

```bash
curl -X POST https://YOUR-SITE.vercel.app/api/migrate \
  -H "Content-Type: application/json" \
  -d '{"password":"139613","classCode":"SALAH-3-1"}'
```

تظهر النتيجة: `{"ok":true,"migrated":6,...}`. بعد التأكد يمكنك حذف متغيّرات Redis.

> حتى بدون ترحيل، تقدّم كل طالب محفوظ في متصفحه وسيُرسل تلقائيًا إلى القاعدة الجديدة عند فتحه الدرس مرة أخرى.

---

## متغيّرات إضافية
| المتغيّر | الوظيفة |
| --- | --- |
| `TEACHER_PASSWORD` | كلمة سر لوحة المعلم (الافتراضية `139613`) |
| `STORAGE_PROVIDER` | فرض مزوّد محدد عند إعداد أكثر من واحد |

بدون متغيّر `TEACHER_PASSWORD` تبقى الكلمة `139613`. غيّرها في بيئة الإنتاج وشاركها مع المعلم فقط.

---

## النشر
1. ارفع المشروع إلى GitHub.
2. [vercel.com](https://vercel.com) → **Add New → Project** → اختر المستودع.
3. Vercel يكتشف Vite تلقائيًا، وملف `vercel.json` يضبط البناء.
4. أضف متغيّرات قاعدة البيانات، ثم **Deploy**.

```bash
npm i -g vercel
vercel
vercel --prod
```

## استكشاف الأخطاء
| الرسالة | الحل |
| --- | --- |
| `SHARED_STORAGE_NOT_CONFIGURED` | لم تُضف متغيّرات أي مزوّد، أو لم تُعد النشر. |
| `STORAGE_UNAVAILABLE` | تحقق من صلاحية الرابط/المفتاح ومن تنفيذ SQL في Supabase. |
| `INVALID_TEACHER_PASSWORD` | كلمة السر المدخلة لا تطابق `TEACHER_PASSWORD`. |
| `SUPABASE_401/403` | استخدم `service_role` لا `anon`. |
| `SUPABASE_404` | لم يُنفّذ `database/supabase.sql` أو اسم الجدول مختلف. |

## ملاحظات
- أسماء الطلاب وتقدّمهم تُحفظ في قاعدتك الخاصة فقط.
- لا يحتاج المشروع إلى متغيّرات أخرى للصور أو الأصوات؛ كلها مضمّنة.
- السجل المشترك اختياري؛ الواجهة تعمل بالكامل بدونه.
