import { activityHadith, evaluation, firstHadith, statusSection } from "./content";

/**
 * مواضع الملفات الصوتية في الدرس.
 * ضع الملفات داخل: src/assets/audio
 * الأسماء المقترحة (يمكن استخدام mp3 أو m4a أو ogg أو wav):
 *   00-intro.mp3
 *   01-pillars.mp3
 *   02-first-account.mp3
 *   03-best-deeds.mp3
 *   04-guardian.mp3
 * عند وجود الملف يستخدمه الدرس تلقائيًا، وإلا يعمل الاستماع الآلي.
 */

export type AudioTrackId = "intro" | "pillars" | "first-account" | "best-deeds" | "guardian";

export type LessonTrack = {
  id: AudioTrackId;
  order: string;
  title: string;
  section: string;
  description: string;
  filename: string;
  text: string;
};

export type ResolvedTrack = LessonTrack & {
  src: string | null;
  source: "recording" | "tts";
};

export const lessonTracks: LessonTrack[] = [
  {
    id: "intro",
    order: "٠٠",
    title: "مقدمة الدرس",
    section: "البداية",
    description: "ترحيب قصير وتوجيه لتلاميذ الصف الثالث الابتدائي.",
    filename: "00-intro",
    text:
      "أهلًا بك في درس مكانة الصلاة للصف الثالث الابتدائي. في هذه الرحلة نقرأ الأحاديث النبوية، ونكتشف مكانة الصلاة، ثم نطبّق ما تعلمناه في الأنشطة والتقويم.",
  },
  {
    id: "pillars",
    order: "٠١",
    title: "حديث أركان الإسلام",
    section: "أقرأ وأجيب",
    description: "حديث ابن عمر رضي الله عنه عن أركان الإسلام الخمسة.",
    filename: "01-pillars",
    text: `${firstHadith.narrator} ${firstHadith.text}`,
  },
  {
    id: "first-account",
    order: "٠٢",
    title: "أول ما يُحاسبُ عليه العبد",
    section: "نشاط الحديث",
    description: "حديث «إنَّ أوَّلَ ما يُحاسَبُ به العبدُ يومَ القيامةِ من عملِه صلاتُه».",
    filename: "02-first-account",
    text: `${activityHadith.narrator} ${activityHadith.text}`,
  },
  {
    id: "best-deeds",
    order: "٠٣",
    title: "أحبُّ الأعمالِ إلى الله",
    section: "مكانة الصلاة",
    description: "حديث ابن مسعود رضي الله عنه: «الصلاةُ على وقتِها».",
    filename: "03-best-deeds",
    text: `${statusSection.hadithNarrator} ${statusSection.hadithText}`,
  },
  {
    id: "guardian",
    order: "٠٤",
    title: "جزاء المحافظة على الصلوات",
    section: "التقويم",
    description: "حديث عبادة بن الصامت رضي الله عنه عن الصلوات الخمس.",
    filename: "04-guardian",
    text: `${evaluation.hadith.narrator} ${evaluation.hadith.text}`,
  },
];

const recordings = import.meta.glob<string>("./assets/audio/*.{mp3,m4a,ogg,wav,aac}", {
  eager: true,
  query: "?inline",
  import: "default",
});

const normalize = (value: string) =>
  value
    .split("/")
    .pop()!
    .toLowerCase()
    .replace(/\.[^.]+$/, "")
    .replace(/[\s_]+/g, "-");

const aliases: Record<AudioTrackId, string[]> = {
  intro: ["00-intro", "intro"],
  pillars: ["01-pillars", "pillars"],
  "first-account": ["02-first-account", "first-account"],
  "best-deeds": ["03-best-deeds", "best-deeds"],
  guardian: ["04-guardian", "guardian"],
};

function findRecording(track: LessonTrack) {
  const keys = aliases[track.id];
  const found = Object.entries(recordings).find(([path]) => {
    const base = normalize(path);
    const short = base.replace(/^\d+[-_]*/, "");
    return keys.some((key) => base === key || short === key.replace(/^\d+[-_]*/, ""));
  });
  return found ? found[1] : null;
}

export const resolvedTracks: ResolvedTrack[] = lessonTracks.map((track) => {
  const src = findRecording(track);
  return {
    ...track,
    src,
    source: src ? "recording" : "tts",
  };
});

export function getTrack(id: AudioTrackId): ResolvedTrack {
  return resolvedTracks.find((track) => track.id === id) ?? resolvedTracks[0];
}

export const recordedCount = resolvedTracks.filter((track) => track.source === "recording").length;
export const totalTracks = resolvedTracks.length;

export const audioFolderHint = "src/assets/audio";
