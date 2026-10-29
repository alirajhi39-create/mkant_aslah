import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { navItems, type SectionId } from "./content";
import {
  TASK_KEYS,
  TASKS,
  addNewSessionStudent,
  completionPercent,
  completedCount as countCompleted,
  currentStudent,
  decodeSubmission,
  importSubmission,
  loadClassroom,
  saveClassroom,
  submitStudentData,
  updateStudent,
  withCompletion,
  withResult,
  type Classroom,
  type SharedSubmission,
  type StudentSection,
  type TaskKey,
} from "./classroom";
import { CertificateModal, Footer, Header, MobileDock } from "./components/Chrome";
import { Hero } from "./components/Hero";
import { ReadSection } from "./components/ReadSection";
import { ActivitySection } from "./components/ActivitySection";
import { StatusSection } from "./components/StatusSection";
import { Evaluation } from "./components/Evaluation";
import { Objectives } from "./components/Objectives";
import { AudioLibrary } from "./components/AudioPlayer";
import { TeacherPanel } from "./components/TeacherPanel";
import { StudentSubmissionForm } from "./components/StudentSubmissionForm";
import { StudentGate, SubmissionImport } from "./components/StudentGate";
import {
  cloudStudentToSubmission,
  downloadBackupFile,
  exportCloudBackup,
  importCloudBackup,
  renameCloudStudent,
  currentStudentSignature,
  deleteCloudStudents,
  mergeCloudStudents,
  fetchRoster,
  getClassCode,
  getTeacherPassword,
  probeCloud,
  setClassCode,
  syncStudent,
  type CloudStatus,
  type CloudStudent,
} from "./cloud";
import { Icon } from "./components/ui";
import { lesson, teacher } from "./content";
import { restoreBackupToClassroom } from "./classroom";

const SESSION_KEY = "salah-session-started";

const readSession = () => {
  try {
    return window.localStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
};

const writeSession = (active: boolean) => {
  try {
    if (active) window.localStorage.setItem(SESSION_KEY, "1");
    else window.localStorage.removeItem(SESSION_KEY);
  } catch {
    /* التخزين المحلي غير متاح */
  }
};

const readIncoming = () => {
  try {
    const search = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#\/?/, ""));
    const code = search.get("submission") ?? hash.get("submission");
    return code ? decodeSubmission(code) : null;
  } catch {
    return null;
  }
};

function SubmissionBanner({ shared, onOpen }: { shared: SharedSubmission; onOpen: () => void }) {
  return (
    <div className="no-print relative z-30 bg-gold-400 px-4 py-2 text-brand-900">
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-center gap-2 text-center text-[11px] font-bold sm:justify-between">
        <p className="flex items-center gap-1.5">
          <Icon name="send" className="h-3.5 w-3.5" />
          وصل عمل الطالب «{shared.name}» — الصف {shared.section}
        </p>
        <button
          type="button"
          onClick={onOpen}
          className="rounded-full bg-brand-900 px-3 py-1 text-[10px] font-bold text-white transition hover:bg-brand-800"
        >
          استلام العمل في لوحة المعلم
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [classroom, setClassroom] = useState<Classroom>(loadClassroom);
  const [sessionActive, setSessionActive] = useState(readSession);
  const [gateOpen, setGateOpen] = useState(false);
  const [incoming, setIncoming] = useState<SharedSubmission | null>(readIncoming);
  const [incomingVisible, setIncomingVisible] = useState(Boolean(readIncoming()));
  const [active, setActive] = useState<SectionId>("overview");
  const [certificateOpen, setCertificateOpen] = useState(false);
  const [teacherOpen, setTeacherOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [cloudStatus, setCloudStatus] = useState<CloudStatus>("checking");
  const [cloudProvider, setCloudProvider] = useState<string | null>(null);
  const [cloudError, setCloudError] = useState<string | null>(null);
  const [cloudRoster, setCloudRoster] = useState<CloudStudent[] | null>(null);
  const [classCode, setClassCodeState] = useState(getClassCode);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const syncedSignature = useRef("");

  const activeStudent = currentStudent(classroom);
  const completed = activeStudent.completed;

  useEffect(() => {
    saveClassroom(classroom);
  }, [classroom]);

  useEffect(() => {
    let cancelled = false;
    probeCloud().then((result) => {
      if (cancelled) return;
      setCloudProvider(result.provider || null);
      setCloudStatus(result.configured && result.reachable ? "ready" : result.configured ? "error" : "local");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (cloudStatus !== "ready" || !activeStudent.section) return;
    const signature = currentStudentSignature(activeStudent);
    if (signature === syncedSignature.current) return;
    const timer = window.setTimeout(() => {
      syncStudent(activeStudent).then((result) => {
        if (result.ok) {
          syncedSignature.current = signature;
          setLastSync(new Date().toISOString());
          setCloudError(null);
        } else {
          setCloudError(result.error ?? "SYNC_FAILED");
          setCloudStatus("error");
        }
      });
    }, 900);
    return () => window.clearTimeout(timer);
  }, [activeStudent, cloudStatus]);

  useEffect(() => {
    if (cloudStatus !== "error" || !activeStudent.section) return;
    const timer = window.setInterval(() => {
      syncStudent(activeStudent).then((result) => {
        if (result.ok) {
          setCloudStatus("ready");
          setCloudError(null);
        }
      });
    }, 20000);
    return () => window.clearInterval(timer);
  }, [cloudStatus, activeStudent]);

  const refreshCloudRoster = useCallback(
    async (password: string) => {
      if (cloudStatus === "local") return;
      setRosterLoading(true);
      const result = await fetchRoster(password);
      setRosterLoading(false);
      if (result.ok) {
        setCloudRoster(result.students);
        setCloudStatus("ready");
        setCloudError(null);
      } else {
        setCloudError(result.code ?? result.error);
        if (cloudStatus === "checking") setCloudStatus("local");
      }
    },
    [cloudStatus],
  );

  const changeClassCode = useCallback((value: string) => {
    const next = setClassCode(value);
    setClassCodeState(next);
    setCloudRoster(null);
    syncedSignature.current = "";
  }, []);

  const cloudRosterStudents = useMemo(
    () => (cloudRoster ? mergeCloudStudents(classroom, cloudRoster) : []),
    [cloudRoster, classroom],
  );

  const cloudRosterSubmissions = useMemo(
    () => cloudRosterStudents.filter((student) => student.submittedAt).map(cloudStudentToSubmission),
    [cloudRosterStudents],
  );

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const sections = navItems
      .map((item) => document.getElementById(item.id))
      .filter((section): section is HTMLElement => Boolean(section));

    if (typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActive(visible[0].target.id as SectionId);
      },
      { rootMargin: "-22% 0px -58% 0px", threshold: [0.01, 0.12, 0.3, 0.5] },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  const showGate = gateOpen || !sessionActive;

  const openGate = () => {
    setGateOpen(true);
    setCertificateOpen(false);
    setTimeout(() => {
      document.getElementById("gate-name")?.focus();
    }, 250);
  };

  const startStudent = (name: string, section: Exclude<StudentSection, "">) => {
    setClassroom((previous) => {
      const { classroom: next, student } = addNewSessionStudent(previous, name, section);
      return {
        ...next,
        students: next.students.map((item) =>
          item.id === student.id ? { ...item, name, section, lastActive: new Date().toISOString() } : item,
        ),
      };
    });
    writeSession(true);
    setSessionActive(true);
    setGateOpen(false);
    setIncomingVisible(false);
    setToast(`أهلًا بك ${name}! بدأت رحلتك في درس مكانة الصلاة.`);
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 120);
  };

  const continueStudent = (studentId: string) => {
    setClassroom((previous) => ({ ...previous, activeId: studentId }));
    writeSession(true);
    setSessionActive(true);
    setGateOpen(false);
    setIncomingVisible(false);
    const student = classroom.students.find((item) => item.id === studentId);
    setToast(student ? `مرحبًا بعودتك ${student.name}!` : "تم اختيار الطالب.");
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 120);
  };

  const restartLesson = () => {
    if (!activeStudent.submittedAt && activeStudent.name && activeStudent.section) {
      setClassroom((previous) =>
        submitStudentData(previous, previous.activeId, {
          name: activeStudent.name,
          section: activeStudent.section as Exclude<StudentSection, "">,
        }),
      );
    }
    writeSession(false);
    setSessionActive(false);
    setGateOpen(true);
    setCertificateOpen(false);
    setToast("حُفظ عمل الطالب في سجلّ المعلم، ويمكن لطالب جديد البدء الآن.");
  };

  const onChangeClassroomRestore = useCallback((records: Parameters<typeof restoreBackupToClassroom>[1]) => {
    setClassroom((previous) => restoreBackupToClassroom(previous, records));
    setToast("تمت استعادة بيانات الطلاب من النسخة الاحتياطية.");
  }, []);

  const submitStudent = useCallback((name: string, section: Exclude<StudentSection, "">) => {
    setClassroom((previous) => submitStudentData(previous, previous.activeId, { name, section }));
    setToast("تم إرسال اسمك وصفّك إلى المعلم. أحسنت!");
  }, []);

  const receiveIncoming = (shared: SharedSubmission) => {
    setClassroom((previous) => importSubmission(previous, shared));
    try {
      window.history.replaceState({}, "", window.location.pathname);
    } catch {
      /* لا يسمح المتصفح بتعديل العنوان */
    }
    setIncomingVisible(false);
    setIncoming(null);
    setTeacherOpen(true);
    setToast(`أُضيف عمل الطالب ${shared.name} إلى سجلّ الصف.`);
  };

  const dismissIncoming = () => {
    setIncomingVisible(false);
    setIncoming(null);
    try {
      window.history.replaceState({}, "", window.location.pathname);
    } catch {
      /* لا يسمح المتصفح بتعديل العنوان */
    }
  };

  const completeTask = useCallback(
    (key: TaskKey) => {
      if (activeStudent.completed[key]) return;
      setClassroom((previous) => updateStudent(previous, previous.activeId, (student) => withCompletion(student, key)));
      const nextCompleted = { ...activeStudent.completed, [key]: true };
      const allDone = TASK_KEYS.every((task) => nextCompleted[task]);
      const label = TASKS.find((task) => task.key === key)?.label ?? "المحطة";
      setToast(allDone ? "أكملت المحطات الأربع! أرسل اسمك وصفّك للمعلم لتوثيق إنجازك." : `أحسنت! أُضيفت محطة «${label}» إلى إنجازك.`);
    },
    [activeStudent],
  );

  const recordResult = useCallback((task: TaskKey, correct: boolean) => {
    setClassroom((previous) => updateStudent(previous, previous.activeId, (student) => withResult(student, task, correct)));
  }, []);

  const recordEvaluationScore = useCallback((score: number) => {
    setClassroom((previous) => {
      const student = currentStudent(previous);
      if (!student || student.evaluationScore === score) return previous;
      return updateStudent(previous, student.id, (item) => ({ ...item, evaluationScore: score }));
    });
  }, []);

  const completedCount = countCompleted(activeStudent);
  const progress = completionPercent(activeStudent);
  const completedLabels = useMemo(
    () => TASKS.filter((task) => completed[task.key]).map((task) => task.label),
    [completed],
  );

  return (
    <div dir="rtl" lang="ar" className="min-h-screen">
      <a
        href="#read"
        className="sr-only focus:not-sr-only focus:fixed focus:right-4 focus:top-4 focus:z-[80] focus:rounded-xl focus:bg-brand-800 focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white"
      >
        تخطَّ إلى محتوى الدرس
      </a>

      {incoming && incomingVisible && !showGate ? <SubmissionBanner shared={incoming} onOpen={() => setIncomingVisible(true)} /> : null}

      <Header
        active={active}
        progress={progress}
        completedCount={completedCount}
        total={TASK_KEYS.length}
        studentName={activeStudent.name}
        studentSection={activeStudent.section}
        onOpenCertificate={() => setCertificateOpen(true)}
        onOpenTeacher={() => setTeacherOpen(true)}
        onNewLesson={openGate}
      />

      <main>
        <Hero onOpenCertificate={() => setCertificateOpen(true)} />
        <Objectives />
        <AudioLibrary />
        <ReadSection key={`read-${activeStudent.id}`} onComplete={completeTask} onResult={recordResult} />
        <ActivitySection
          key={`activity-${activeStudent.id}`}
          onComplete={completeTask}
          onResult={recordResult}
          studentId={activeStudent.id}
        />
        <StatusSection key={`status-${activeStudent.id}`} onComplete={completeTask} onResult={recordResult} />
        <Evaluation
          key={`evaluation-${activeStudent.id}`}
          onComplete={completeTask}
          onOpenCertificate={() => setCertificateOpen(true)}
          onEvaluationScore={recordEvaluationScore}
          stationsCompleted={completedCount}
        />
        <StudentSubmissionForm
          key={`submit-${activeStudent.id}`}
          student={activeStudent}
          progress={progress}
          onOpenCertificate={() => setCertificateOpen(true)}
          onSubmit={submitStudent}
          onRestart={restartLesson}
          cloudStatus={cloudStatus}
          cloudError={cloudError}
          classCode={classCode}
        />
      </main>

      <Footer
        onOpenCertificate={() => setCertificateOpen(true)}
        onOpenTeacher={() => setTeacherOpen(true)}
        onNewLesson={openGate}
      />
      <MobileDock active={active} />

      <CertificateModal
        open={certificateOpen}
        onClose={() => setCertificateOpen(false)}
        progress={progress}
        completedLabels={completedLabels}
        studentName={activeStudent.name}
        studentSection={activeStudent.section}
        scoreSource={activeStudent}
      />

      <TeacherPanel
        open={teacherOpen}
        classroom={classroom}
        onChange={setClassroom}
        onClose={() => setTeacherOpen(false)}
        cloud={{
          status: cloudStatus,
          error: cloudError,
          students: cloudRosterStudents,
          submissions: cloudRosterSubmissions,
          classCode,
          loading: rosterLoading,
          lastSync,
          provider: cloudProvider,
          onRefresh: refreshCloudRoster,
          onClassCodeChange: changeClassCode,
          onDelete: async (ids) => {
            const result = await deleteCloudStudents(ids);
            if (result.ok) {
              setCloudRoster((previous) =>
                previous ? previous.filter((student) => !ids.includes(student.id)) : previous,
              );
            }
            return result;
          },
          onDeleteAll: async () => {
            const result = await deleteCloudStudents([], true);
            if (result.ok) setCloudRoster([]);
            return result;
          },
          onRename: async (id, edits) => {
            const result = await renameCloudStudent(id, edits);
            if (result.ok) {
              setCloudRoster((previous) =>
                previous
                  ? previous.map((student) =>
                      student.id === id
                        ? { ...student, ...edits, cloud: true, lastActive: new Date().toISOString() }
                        : student,
                    )
                  : previous,
              );
              setClassroom((previous) => {
                if (!previous.students.some((student) => student.id === id)) return previous;
                return {
                  ...previous,
                  students: previous.students.map((student) =>
                    student.id === id ? { ...student, ...edits } : student,
                  ),
                  submissions: previous.submissions.map((submission) =>
                    submission.studentId === id ? { ...submission, ...edits } : submission,
                  ),
                };
              });
            }
            return result;
          },
          onBackup: async () => {
            const result = await exportCloudBackup();
            if (!result.ok || !result.students) return result;
            downloadBackupFile(result.students, {
              classCode,
              teacher: teacher.name,
              school: teacher.school,
              lesson: lesson.title,
            });
            return { ok: true };
          },
          onRestore: async (records) => {
            const result = await importCloudBackup(records);
            if (result.ok) await refreshCloudRoster(getTeacherPassword() || "");
            return result;
          },
        }}
        onDownloadLocalBackup={() => {
          downloadBackupFile(
            classroom.students.filter(
              (student) => student.name !== "طالب الصف الثالث" && Boolean(student.section),
            ),
            { classCode, teacher: teacher.name, school: teacher.school, lesson: lesson.title },
          );
        }}
        onRestoreLocal={(records) => {
          onChangeClassroomRestore(records);
        }}
        onRequestNewStudent={() => {
          writeSession(false);
          setSessionActive(false);
          setGateOpen(true);
          setTeacherOpen(false);
        }}
      />

      {showGate && (
        <StudentGate
          students={classroom.students}
          activeId={classroom.activeId}
          onStartNew={startStudent}
          onContinue={continueStudent}
          onOpenTeacher={() => setTeacherOpen(true)}
          onClose={sessionActive ? () => setGateOpen(false) : undefined}
        />
      )}

      {incoming && incomingVisible && (
        <SubmissionImport
          shared={incoming}
          onImport={() => receiveIncoming(incoming)}
          onOpenTeacher={() => {
            setIncomingVisible(false);
            setIncoming(null);
            setTeacherOpen(true);
          }}
          onDismiss={dismissIncoming}
        />
      )}

      <div
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed inset-x-0 top-[4.25rem] z-50 flex justify-center px-2.5 sm:top-20 lg:bottom-8 lg:top-auto lg:px-4"
      >
        {toast && (
          <div className="animate-pop flex w-full items-start gap-2 rounded-xl border border-white/20 bg-brand-800 px-2.5 py-2 text-white shadow-[0_18px_40px_-14px_rgba(14,62,59,0.65)] sm:max-w-md sm:items-center sm:gap-3 sm:rounded-2xl sm:px-4 sm:py-3">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gold-400 text-brand-900 sm:h-8 sm:w-8">
              <Icon name="check" className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
            <p className="text-[10px] font-bold leading-5 sm:text-xs sm:leading-6">{toast}</p>
            <button
              type="button"
              onClick={() => setToast(null)}
              aria-label="إغلاق الإشعار"
              className="pointer-events-auto ms-auto grid h-5 w-5 shrink-0 place-items-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white sm:ms-1 sm:h-6 sm:w-6"
            >
              <Icon name="close" className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
