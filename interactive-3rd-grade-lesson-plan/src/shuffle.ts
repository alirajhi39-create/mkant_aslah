/**
 * خلط عشوائي (Fisher–Yates) مع ضمان عدم بقاء الترتيب الأصلي إن أمكن.
 * يُستخدم لخلط خيارات الأسئلة وبنك الكلمات في أنشطة الدرس.
 */
export function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items];
  if (result.length < 2) return result;

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }

  // تجنّب بقاء الترتيب كما هو (مهم حتى لا يظن المعلم أن الخلط لا يعمل).
  const unchanged = result.every((item, index) => item === items[index]);
  if (unchanged) {
    [result[0], result[result.length - 1]] = [result[result.length - 1], result[0]];
  }

  return result;
}

export function shuffleDifferent<T>(items: readonly T[], previous: readonly T[]): T[] {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const next = shuffle(items);
    const same = next.length === previous.length && next.every((item, index) => item === previous[index]);
    if (!same) return next;
  }
  return shuffle(items);
}
