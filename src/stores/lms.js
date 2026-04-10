import { defineStore } from "pinia";
import { buildDemoPayload, cycleStoredDemoRole, demoApi, getStoredDemoRole, isDemoEnvironment, setStoredDemoRole } from "../demoData";

const relName = (value) => (Array.isArray(value) ? value[1] : value);
const relId = (value) => (Array.isArray(value) ? value[0] : value);
const CHOICE_KEYS = ["a", "b", "c", "d"];
const LESSON_STATUS_LABELS = {
  not_started: "Not started",
  in_progress: "In progress",
  completed: "Completed",
};
const ATTENDANCE_STATUS_LABELS = {
  present: "Present",
  late: "Late",
  absent: "Absent",
};

const normalizeNotifications = (value = {}) => ({
  announcements: value.announcements !== false,
  quizzes: value.quizzes !== false,
  progress: value.progress !== false,
});

const normalizeVisibility = (value = {}) => ({
  dashboard: value.dashboard !== false,
  courses: value.courses !== false,
  lessons: value.lessons !== false,
  announcements: value.announcements !== false,
  enrollments: value.enrollments !== false,
  quizzes: value.quizzes !== false,
  questions: value.questions !== false,
  quizResults: value.quizResults !== false && value.quiz_results !== false,
});

let requestId = 0;

const toNumber = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const toTimestamp = (value) => {
  if (!value) {
    return 0;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
};

const computePercentage = (row) => {
  const explicit = toNumber(row.percentage);
  if (explicit !== null) {
    return explicit;
  }

  const score = toNumber(row.score);
  const maxScore = toNumber(row.max_score);
  if (score !== null && maxScore && maxScore > 0) {
    return (score / maxScore) * 100;
  }

  return score;
};

const formatScoreValue = (value) => {
  if (value === undefined || value === null || value === "") {
    return "—";
  }

  const numeric = Number(value);
  return Number.isFinite(numeric) ? `${Math.round(numeric * 10) / 10}%` : String(value);
};

const stripHtml = (value = "") =>
  String(value)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const toEmbedUrl = (url) => {
  if (!url) {
    return "";
  }

  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtube.com")) {
      const videoId = parsed.searchParams.get("v");
      return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
    }
    if (parsed.hostname.includes("youtu.be")) {
      const videoId = parsed.pathname.replace(/^\//, "");
      return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
    }
    if (parsed.hostname.includes("vimeo.com")) {
      const videoId = parsed.pathname.split("/").filter(Boolean)[0];
      return videoId ? `https://player.vimeo.com/video/${videoId}` : "";
    }
  } catch (error) {
    return "";
  }

  return "";
};

const normalizeLessonStatus = (value, progressPercent = 0) => {
  if (value === "completed" || progressPercent >= 100) {
    return "completed";
  }
  if (value === "in_progress" || progressPercent > 0) {
    return "in_progress";
  }
  return "not_started";
};

const rpc = async (model, method, args = [], kwargs = {}) => {
  requestId += 1;
  const response = await fetch("/web/dataset/call_kw", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "call",
      params: {
        model,
        method,
        args,
        kwargs,
      },
      id: requestId,
    }),
  });

  const payload = await response.json();
  if (!response.ok || payload.error) {
    throw new Error(payload.error?.data?.message || payload.error?.message || "RPC request failed.");
  }
  return payload.result;
};

const fieldsGet = (model) => rpc(model, "fields_get", [], {});

const searchRead = async (model, domain, fields) => {
  const available = await fieldsGet(model);
  const safeFields = fields.filter((field) => Object.prototype.hasOwnProperty.call(available || {}, field));
  if (!safeFields.length) {
    return [];
  }

  return rpc(model, "search_read", [domain], {
    fields: safeFields,
    limit: 200,
  });
};

const routeJson = async (url, params = {}) => {
  requestId += 1;
  const response = await fetch(url, {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "call",
      params,
      id: requestId,
    }),
  });

  const payload = await response.json();
  if (!response.ok || payload.error) {
    throw new Error(payload.error?.data?.message || payload.error?.message || "Request failed.");
  }

  return payload.result;
};

const normalizeOptions = (row) =>
  CHOICE_KEYS.map((key) => ({
    key,
    label: key.toUpperCase(),
    text: row[`answer_${key}`] || "",
  })).filter((option) => option.text);

const mapPayloadToStore = (store, payload, fallbackName = "Student") => {
  const student = payload.student || {};
  const viewerMode = payload.viewer_mode || payload.viewerMode || "student";
  const lmsVisibility = payload.lms_visibility || payload.lmsVisibility || {};
  const enrollments = payload.enrollments || [];
  const courses = payload.courses || [];
  const availableStudents = payload.available_students || payload.availableStudents || [];
  const lessons = payload.lessons || [];
  const lessonProgressRows = payload.lesson_progress || payload.lessonProgress || [];
  const announcements = payload.announcements || [];
  const assignments = payload.assignments || [];
  const assignmentSubmissions = payload.assignment_submissions || payload.assignmentSubmissions || [];
  const attendanceSessions = payload.attendance_sessions || payload.attendanceSessions || [];
  const attendanceRecords = payload.attendance_records || payload.attendanceRecords || [];
  const quizzes = payload.quizzes || [];
  const questions = payload.questions || [];
  const quizResults = payload.quiz_results || payload.quizResults || [];
  const quizResultLines = payload.quiz_result_lines || payload.quizResultLines || [];

  const notifications = normalizeNotifications(student.notifications);
  const isStaffViewer = viewerMode === "doctor" || viewerMode === "admin";

  store.viewerMode = viewerMode;
  store.lmsVisibility = normalizeVisibility(lmsVisibility);
  store.availableStudents = availableStudents
    .map((row) => ({
      id: row.id,
      name: row.name || row.login || "Student",
      login: row.login || "",
      email: row.email || "",
      role: row.x_lms_role || "",
      active: row.active !== false,
      createdAt: row.create_date || "",
      updatedAt: row.write_date || "",
      lastLogin: row.login_date || "",
    }))
    .sort((left, right) => left.name.localeCompare(right.name));

  store.student = {
    fullName: student.name || student.fullName || fallbackName,
    program: student.program || "",
    semester: student.semester || "",
    login: student.login || "",
    email: student.email || "",
    phone: student.phone || "",
    timezone: student.timezone || "",
    language: student.language || "",
    lastLogin: student.last_login || student.lastLogin || "",
    avatarUrl: student.avatar_url || student.avatarUrl || "",
    hasAvatar: Boolean(student.avatar_url || student.avatarUrl || student.has_avatar || student.hasAvatar),
    notifications,
  };

  store.enrollments = enrollments.map((row) => ({
    id: row.id,
    studentId: relId(row.student_id),
    studentName: relName(row.student_id) || "",
    courseId: relId(row.course_id),
    course: relName(row.course_id) || "—",
    status: row.status || row.state || "",
    progress: toNumber(row.progress) || 0,
    completedLessons: toNumber(row.x_completed_lessons) || 0,
    totalLessons: toNumber(row.x_total_lessons) || 0,
    lastActivity: row.x_last_activity_on || row.enrolled_on || row.create_date || "",
  }));

  const mappedQuestions = questions.map((row) => ({
    id: row.id,
    quizId: relId(row.quiz_id),
    quiz: relName(row.quiz_id) || row.quiz || "—",
    text: row.question || row.question_text || row.name || row.title || row.text || "Question",
    options: normalizeOptions(row),
    correctAnswer: row.correct_answer || "",
    points: toNumber(row.points) || 1,
  }));

  const questionLookup = new Map(mappedQuestions.map((question) => [question.id, question]));
  const linesByResult = new Map();

  quizResultLines.forEach((row) => {
    const resultId = relId(row.result_id);
    const questionId = relId(row.question_id);
    const question = questionLookup.get(questionId);
    const selectedAnswer = row.selected_answer || "";
    const selectedOption = question?.options?.find((option) => option.key === selectedAnswer);

    const line = {
      id: row.id,
      resultId,
      questionId,
      question: question?.text || relName(row.question_id) || "Question",
      selectedAnswer,
      selectedLabel: selectedAnswer ? selectedAnswer.toUpperCase() : "—",
      selectedText: selectedOption?.text || "",
      isCorrect: Boolean(row.is_correct),
      points: toNumber(row.points) || 0,
      createdAt: row.create_date || "",
    };

    if (!linesByResult.has(resultId)) {
      linesByResult.set(resultId, []);
    }
    linesByResult.get(resultId).push(line);
  });

  const quizCourseLookup = new Map(quizzes.map((row) => [row.id, relId(row.course_id)]));

  const mappedResults = quizResults
    .map((row) => {
      const resultId = row.id;
      const lines = linesByResult.get(resultId) || [];
      const correctCount = lines.filter((line) => line.isCorrect).length;
      const totalCount = lines.length;
      const percentage = computePercentage(row);
      const rawScore = toNumber(row.score);
      const maxScore = toNumber(row.max_score);

      return {
        id: resultId,
        quizId: relId(row.quiz_id),
        courseId: relId(row.course_id) || quizCourseLookup.get(relId(row.quiz_id)) || null,
        quiz: relName(row.quiz_id) || row.quiz || "—",
        studentId: relId(row.student_id),
        studentName: relName(row.student_id) || "",
        score: percentage,
        scoreLabel: formatScoreValue(percentage),
        rawScore,
        maxScore,
        state: row.state || row.status || (row.passed ? "Passed" : "Submitted"),
        passed: Boolean(row.passed),
        date: row.submitted_on || row.date || row.create_date || "",
        lines,
        correctCount,
        totalCount,
      };
    })
    .sort((left, right) => toTimestamp(right.date) - toTimestamp(left.date) || right.id - left.id)
    .map((result, index, all) => {
      const attemptIndex = all.filter((entry) => entry.quizId === result.quizId && toTimestamp(entry.date) >= toTimestamp(result.date)).length;
      return {
        ...result,
        attemptLabel: `Attempt ${attemptIndex}`,
      };
    });

  const resultsByQuiz = mappedResults.reduce((lookup, result) => {
    if (!lookup.has(result.quizId)) {
      lookup.set(result.quizId, []);
    }
    lookup.get(result.quizId).push(result);
    return lookup;
  }, new Map());

  const questionCountByQuiz = mappedQuestions.reduce((counts, question) => {
    counts.set(question.quizId, (counts.get(question.quizId) || 0) + 1);
    return counts;
  }, new Map());

  const progressByLesson = new Map(
    lessonProgressRows.map((row) => {
      const lessonId = relId(row.lesson_id);
      const progressPercent = toNumber(row.progress_percent) || 0;
      const status = normalizeLessonStatus(row.status, progressPercent);
      return [
        lessonId,
        {
          id: row.id,
          lessonId,
          courseId: relId(row.course_id),
          status,
          progressPercent,
          firstOpenedOn: row.first_opened_on || "",
          lastOpenedOn: row.last_opened_on || "",
          completedOn: row.completed_on || "",
        },
      ];
    }),
  );

  store.lessonProgress = Array.from(progressByLesson.values());
  store.questions = mappedQuestions;
  store.quizResults = mappedResults;

  store.lessons = lessons
    .map((row) => {
      const progress = progressByLesson.get(row.id) || {
        lessonId: row.id,
        status: "not_started",
        progressPercent: 0,
        firstOpenedOn: "",
        lastOpenedOn: "",
        completedOn: "",
      };

      return {
        id: row.id,
        name: row.name || row.title || "Lesson",
        courseId: relId(row.course_id),
        course: relName(row.course_id) || row.course || "—",
        sequence: row.sequence ?? "—",
        moduleTitle: row.x_module_title || "",
        weekLabel: row.x_week_label || "",
        topicTitle: row.x_topic_title || "",
        unitTitle: row.x_unit_title || "",
        videoUrl: row.video_url || row.videoUrl || "",
        embedUrl: toEmbedUrl(row.video_url || row.videoUrl || ""),
        externalResourceUrl: row.x_external_resource_url || "",
        content: row.content || "",
        preview: stripHtml(row.content || ""),
        fileName: row.file_filename || "",
        downloadUrl: row.file_url || row.fileUrl || (row.file_filename ? `/web/content/lms.lesson/${row.id}/file?download=1` : ""),
        hasAttachment: Boolean(row.file_filename),
        status: progress.status,
        statusLabel: LESSON_STATUS_LABELS[progress.status] || "Not started",
        progressPercent: progress.progressPercent,
        started: progress.status !== "not_started",
        isCompleted: progress.status === "completed",
        firstOpenedOn: progress.firstOpenedOn,
        lastOpenedOn: progress.lastOpenedOn,
        completedOn: progress.completedOn,
        startedStudentCount: toNumber(row.x_started_student_count) || 0,
        completedStudentCount: toNumber(row.x_completed_student_count) || 0,
        completionRate: toNumber(row.x_completion_rate),
      };
    })
    .sort((left, right) => (Number(left.courseId) - Number(right.courseId)) || (Number(left.sequence) - Number(right.sequence)) || (left.id - right.id));

  const completedLessonsByCourse = store.lessons.reduce((counts, lesson) => {
    if (!lesson.isCompleted) {
      return counts;
    }
    counts.set(lesson.courseId, (counts.get(lesson.courseId) || 0) + 1);
    return counts;
  }, new Map());

  const enrollmentByCourse = new Map(store.enrollments.map((enrollment) => [enrollment.courseId, enrollment]));

  store.courses = courses.map((row) => {
    const enrollment = enrollmentByCourse.get(row.id);
    const averageProgress = toNumber(row.x_average_progress);
    const ownProgress = isStaffViewer ? averageProgress || 0 : toNumber(enrollment?.progress) || 0;
    const totalLessons = toNumber(row.x_total_lessons) || 0;
    const completedEstimate = isStaffViewer
      ? Math.round(((averageProgress || 0) / 100) * totalLessons)
      : enrollment?.completedLessons ?? completedLessonsByCourse.get(row.id) ?? 0;

    return {
      id: row.id,
      name: row.name || "Course",
      description: row.description || "",
      teacher: relName(row.teacher_id) || row.teacher || "—",
      code: row.x_course_code || "",
      department: row.x_department || "",
      term: row.x_term || "",
      status: row.x_status || "",
      coverUrl: row.cover_url || row.coverUrl || "",
      enrolled: store.enrollments.some((enrollmentRow) => enrollmentRow.courseId === row.id),
      isPublished: Boolean(row.x_is_published),
      autoEnroll: Boolean(row.x_auto_enroll),
      totalAssignments: toNumber(row.x_total_assignments) || 0,
      totalLessons,
      totalQuizzes: toNumber(row.x_total_quizzes) || 0,
      announcementCount: toNumber(row.x_total_announcements) || 0,
      totalAttendanceSessions: toNumber(row.x_total_attendance_sessions) || 0,
      attemptCount: toNumber(row.x_quiz_attempt_count) || 0,
      assignmentSubmissionCount: toNumber(row.x_assignment_submission_count) || 0,
      pendingSubmissionCount: toNumber(row.x_pending_submission_count) || 0,
      averagePercentage: toNumber(row.x_average_percentage),
      averageAssignmentPercentage: toNumber(row.x_average_assignment_percentage),
      activeStudents: toNumber(row.x_active_student_count) || 0,
      averageProgress,
      attendanceRate: toNumber(row.x_attendance_rate),
      completionRate: toNumber(row.x_completion_rate),
      progressPercent: ownProgress,
      completedLessons: completedEstimate,
      lastActivity: enrollment?.lastActivity || "",
    };
  });
  const courseNameById = new Map(store.courses.map((course) => [course.id, course.name]));

  store.announcements = announcements
    .map((row) => ({
      id: row.id,
      title: row.title || row.name || "Announcement",
      message: row.message || row.body || "",
      date: row.date || row.create_date || "",
      courseId: relId(row.course_id),
      course: relName(row.course_id) || row.course || "—",
    }))
    .sort((left, right) => toTimestamp(right.date) - toTimestamp(left.date) || right.id - left.id);

  store.quizzes = quizzes.map((row) => {
    const quizId = row.id;
    const results = resultsByQuiz.get(quizId) || [];
    const attemptLimit = toNumber(row.x_attempt_limit) || 0;
    const availableFrom = row.x_available_from || "";
    const deadline = row.x_deadline || row.date || row.create_date || "";
    const availableFuture = Boolean(availableFrom) && toTimestamp(availableFrom) > Date.now();
    const deadlinePassed = Boolean(deadline) && toTimestamp(deadline) > 0 && toTimestamp(deadline) < Date.now();
    const attemptsRemaining = attemptLimit > 0 ? Math.max(attemptLimit - results.length, 0) : null;
    const latestResult = results[0] || null;
    let statusLabel = "Open";
    let closedReason = "";

    if (availableFuture) {
      statusLabel = "Scheduled";
      closedReason = `Opens ${availableFrom}`;
    } else if (deadlinePassed) {
      statusLabel = "Closed";
      closedReason = "Deadline passed";
    } else if (attemptLimit > 0 && attemptsRemaining === 0) {
      statusLabel = "Locked";
      closedReason = "Attempt limit reached";
    } else if (latestResult) {
      statusLabel = "Retake available";
    }

    return {
      id: quizId,
      name: row.name || row.title || "Quiz",
      courseId: relId(row.course_id),
      course: relName(row.course_id) || row.course || "—",
      availableFrom,
      deadline,
      questionCount: questionCountByQuiz.get(quizId) || toNumber(row.total_questions) || 0,
      attemptCount: results.length,
      latestResult,
      attemptLimit,
      attemptsRemaining,
      timeLimitMinutes: toNumber(row.x_time_limit_minutes) || 0,
      showResults: row.x_show_results !== false,
      passPercentage: toNumber(row.x_pass_percentage) || 50,
      weight: toNumber(row.x_weight) || 1,
      availableFuture,
      deadlinePassed,
      averagePercentage: toNumber(row.x_average_percentage),
      classAttempts: toNumber(row.x_attempt_count) || 0,
      passRate: toNumber(row.x_pass_rate),
      statusLabel,
      closedReason,
      canTake: !availableFuture && !deadlinePassed && !(attemptLimit > 0 && attemptsRemaining === 0),
    };
  });

  store.assignmentSubmissions = assignmentSubmissions
    .map((row) => ({
      id: row.id,
      assignmentId: relId(row.assignment_id),
      assignment: relName(row.assignment_id) || "Assignment",
      courseId: relId(row.course_id),
      course: relName(row.course_id) || "—",
      studentId: relId(row.student_id),
      studentName: relName(row.student_id) || "",
      status: row.status || "draft",
      submittedOn: row.submitted_on || row.create_date || "",
      gradedOn: row.graded_on || "",
      score: toNumber(row.score),
      percentage: toNumber(row.percentage),
      feedback: row.feedback || "",
      submittedFileName: row.submitted_filename || "",
      submittedFileUrl: row.submitted_file_url || row.submittedFileUrl || (row.submitted_filename ? `/web/content/lms.assignment.submission/${row.id}/submitted_file?download=1` : ""),
      updatedOn: row.write_date || row.create_date || "",
    }))
    .sort((left, right) => toTimestamp(right.submittedOn || right.updatedOn) - toTimestamp(left.submittedOn || left.updatedOn) || right.id - left.id);

  const submissionsByAssignment = store.assignmentSubmissions.reduce((lookup, submission) => {
    if (!lookup.has(submission.assignmentId)) {
      lookup.set(submission.assignmentId, []);
    }
    lookup.get(submission.assignmentId).push(submission);
    return lookup;
  }, new Map());

  store.assignments = assignments
    .map((row) => {
      const assignmentId = row.id;
      const submissions = submissionsByAssignment.get(assignmentId) || [];
      const ownSubmission = isStaffViewer ? null : submissions[0] || null;
      const dueDate = row.due_date || "";
      const availableFrom = row.available_from || "";
      const availableFuture = Boolean(availableFrom) && toTimestamp(availableFrom) > Date.now();
      const deadlinePassed = Boolean(dueDate) && toTimestamp(dueDate) > 0 && toTimestamp(dueDate) < Date.now();

      return {
        id: assignmentId,
        name: row.name || "Assignment",
        description: row.description || "",
        instructions: row.instructions || row.description || "",
        courseId: relId(row.course_id),
        course: relName(row.course_id) || "—",
        teacher: relName(row.teacher_id) || "",
        dueDate,
        availableFrom,
        availableFuture,
        deadlinePassed,
        allowLate: Boolean(row.allow_late),
        allowResubmission: Boolean(row.allow_resubmission),
        submissionType: row.submission_type || "file_or_text",
        maxScore: toNumber(row.max_score) || 100,
        weight: toNumber(row.weight) || 1,
        isPublished: row.is_published !== false,
        resourceFileName: row.resource_filename || "",
        resourceUrl: row.resource_url || row.resourceUrl || (row.resource_filename ? `/web/content/lms.assignment/${assignmentId}/resource_file?download=1` : ""),
        submissionCount: toNumber(row.submission_count) || submissions.length,
        gradedCount: toNumber(row.graded_count) || submissions.filter((submission) => submission.status === "graded").length,
        pendingCount: toNumber(row.pending_count) || submissions.filter((submission) => ["submitted", "late"].includes(submission.status)).length,
        averagePercentage: toNumber(row.average_percentage),
        ownSubmission,
        submissions,
        canSubmit: !availableFuture && (!deadlinePassed || Boolean(row.allow_late)),
      };
    })
    .sort((left, right) => {
      const leftStamp = toTimestamp(left.dueDate || left.availableFrom);
      const rightStamp = toTimestamp(right.dueDate || right.availableFrom);
      return (leftStamp || Number.MAX_SAFE_INTEGER) - (rightStamp || Number.MAX_SAFE_INTEGER) || left.id - right.id;
    });

  store.attendanceSessions = attendanceSessions
    .map((row) => ({
      id: row.id,
      name: row.name || "Attendance Session",
      courseId: relId(row.course_id),
      course: relName(row.course_id) || "—",
      lessonId: relId(row.lesson_id),
      lesson: relName(row.lesson_id) || "",
      sessionDate: row.session_date || row.create_date || "",
      status: row.status || "draft",
      notes: row.notes || "",
      presentCount: toNumber(row.present_count) || 0,
      lateCount: toNumber(row.late_count) || 0,
      absentCount: toNumber(row.absent_count) || 0,
    }))
    .sort((left, right) => toTimestamp(right.sessionDate) - toTimestamp(left.sessionDate) || right.id - left.id);
  const attendanceSessionMap = new Map(store.attendanceSessions.map((session) => [session.id, session]));

  store.attendanceRecords = attendanceRecords
    .map((row) => {
      const sessionId = relId(row.session_id);
      const sessionMeta = attendanceSessionMap.get(sessionId) || {};
      const status = row.status || "present";
      return {
        id: row.id,
        sessionId,
        session: relName(row.session_id) || sessionMeta.name || "",
        sessionDate: sessionMeta.sessionDate || "",
        sessionStatus: sessionMeta.status || "draft",
        lesson: sessionMeta.lesson || "",
        studentId: relId(row.student_id),
        studentName: relName(row.student_id) || "",
        courseId: relId(row.course_id),
        course: relName(row.course_id) || sessionMeta.course || "—",
        status,
        statusLabel: ATTENDANCE_STATUS_LABELS[status] || "Present",
        note: row.note || "",
        markedOn: row.marked_on || row.create_date || "",
      };
    })
    .sort((left, right) => toTimestamp(right.sessionDate || right.markedOn) - toTimestamp(left.sessionDate || left.markedOn) || right.id - left.id);

  store.calendarEvents = [
    ...store.assignments.map((assignment) => ({
      id: `assignment-${assignment.id}`,
      type: "assignment",
      title: assignment.name,
      subtitle: assignment.course,
      startsAt: assignment.dueDate || assignment.availableFrom,
      courseId: assignment.courseId,
      targetId: assignment.id,
    })),
    ...store.quizzes.map((quiz) => ({
      id: `quiz-${quiz.id}`,
      type: "quiz",
      title: quiz.name,
      subtitle: quiz.course,
      startsAt: quiz.deadline || quiz.availableFrom,
      courseId: quiz.courseId,
      targetId: quiz.id,
    })),
    ...store.attendanceSessions.map((session) => ({
      id: `attendance-${session.id}`,
      type: "attendance",
      title: session.name,
      subtitle: session.course,
      startsAt: session.sessionDate,
      courseId: session.courseId,
      targetId: session.id,
    })),
    ...store.announcements.map((announcement) => ({
      id: `announcement-${announcement.id}`,
      type: "announcement",
      title: announcement.title,
      subtitle: announcement.course,
      startsAt: announcement.date,
      courseId: announcement.courseId,
      targetId: announcement.id,
    })),
  ]
    .filter((event) => event.startsAt)
    .sort((left, right) => toTimestamp(left.startsAt) - toTimestamp(right.startsAt) || String(left.id).localeCompare(String(right.id)));

  if (isStaffViewer) {
    const roster = store.enrollments.map((enrollment) => {
      const quizScores = store.quizResults.filter(
        (result) => result.courseId === enrollment.courseId && result.studentId === enrollment.studentId,
      );
      const assignmentScores = store.assignmentSubmissions.filter(
        (submission) => submission.courseId === enrollment.courseId && submission.studentId === enrollment.studentId && submission.status === "graded",
      );
      const attendanceForStudent = store.attendanceRecords.filter(
        (record) => record.courseId === enrollment.courseId && record.studentId === enrollment.studentId,
      );
      const quizAverage = quizScores.length
        ? quizScores.reduce((sum, row) => sum + (row.score || 0), 0) / quizScores.length
        : null;
      const assignmentAverage = assignmentScores.length
        ? assignmentScores.reduce((sum, row) => sum + (row.percentage || 0), 0) / assignmentScores.length
        : null;
      const overallParts = [quizAverage, assignmentAverage].filter((value) => value !== null);
      const attendanceRate = attendanceForStudent.length
        ? (attendanceForStudent.filter((record) => ["present", "late"].includes(record.status)).length / attendanceForStudent.length) * 100
        : null;
      return {
        id: `${enrollment.courseId}-${enrollment.studentId}`,
        courseId: enrollment.courseId,
        course: enrollment.course,
        studentId: enrollment.studentId,
        studentName: enrollment.studentName,
        quizAverage,
        assignmentAverage,
        overallAverage: overallParts.length ? overallParts.reduce((sum, value) => sum + value, 0) / overallParts.length : null,
        attendanceRate,
        pendingSubmissions: store.assignmentSubmissions.filter(
          (submission) =>
            submission.courseId === enrollment.courseId &&
            submission.studentId === enrollment.studentId &&
            ["submitted", "late"].includes(submission.status),
        ).length,
      };
    });
    store.gradebookRows = roster.sort((left, right) => left.studentName.localeCompare(right.studentName));
  } else {
    store.gradebookRows = [
      ...store.assignmentSubmissions.map((submission) => ({
        id: `assignment-${submission.id}`,
        type: "assignment",
        courseId: submission.courseId,
        course: submission.course,
        title: submission.assignment,
        score: submission.percentage,
        rawScore: submission.score,
        status: submission.status,
        feedback: submission.feedback,
        date: submission.gradedOn || submission.submittedOn,
      })),
      ...store.quizResults.map((result) => ({
        id: `quiz-${result.id}`,
        type: "quiz",
        courseId: result.courseId,
        course: courseNameById.get(result.courseId) || "—",
        title: result.quiz,
        score: result.score,
        rawScore: result.rawScore,
        status: result.state,
        feedback: "",
        date: result.date,
      })),
    ].sort((left, right) => toTimestamp(right.date) - toTimestamp(left.date) || String(right.id).localeCompare(String(left.id)));
  }

  store.notificationsFeed = [
    ...store.announcements.slice(0, 6).map((announcement) => ({
      id: `announcement-${announcement.id}`,
      kind: "announcement",
      title: announcement.title,
      subtitle: announcement.course,
      date: announcement.date,
    })),
    ...store.assignments
      .filter((assignment) => assignment.dueDate)
      .slice(0, 6)
      .map((assignment) => ({
        id: `assignment-${assignment.id}`,
        kind: "assignment",
        title: assignment.name,
        subtitle: `Due ${assignment.course}`,
        date: assignment.dueDate,
      })),
  ]
    .sort((left, right) => toTimestamp(right.date) - toTimestamp(left.date) || String(right.id).localeCompare(String(left.id)))
    .slice(0, 8);
};

export const useLmsStore = defineStore("lms", {
  state: () => ({
    activePage: "dashboard",
    loading: false,
    error: null,
    student: {
      fullName: "Student",
      program: "",
      semester: "",
      login: "",
      email: "",
      phone: "",
      timezone: "",
      language: "",
      lastLogin: "",
      avatarUrl: "",
      hasAvatar: false,
      notifications: {
        announcements: true,
        quizzes: true,
        progress: true,
      },
    },
    viewerMode: "student",
    environmentMode: isDemoEnvironment() ? "demo" : "odoo",
    demoRole: getStoredDemoRole(),
    courses: [],
    lessons: [],
    lessonProgress: [],
    announcements: [],
    assignments: [],
    assignmentSubmissions: [],
    attendanceSessions: [],
    attendanceRecords: [],
    enrollments: [],
    quizzes: [],
    questions: [],
    quizResults: [],
    calendarEvents: [],
    gradebookRows: [],
    notificationsFeed: [],
    availableStudents: [],
    lmsVisibility: normalizeVisibility(),
    navSections: [
      {
        title: "Academic",
        items: [
          { label: "Dashboard", key: "dashboard", icon: "fas fa-th-large" },
          { label: "Courses", key: "courses", icon: "fas fa-layer-group" },
          { label: "Lessons", key: "lessons", icon: "fas fa-book-open" },
          { label: "Announcements", key: "announcements", icon: "fas fa-bullhorn" },
          { label: "Enrollments", key: "enrollments", icon: "fas fa-user-check" },
          { label: "Quizzes", key: "quizzes", icon: "fas fa-clipboard-list" },
          { label: "Questions", key: "questions", icon: "fas fa-question-circle" },
          { label: "Quiz Results", key: "quiz-results", icon: "fas fa-chart-bar" },
        ],
      },
      {
        title: "Settings",
        items: [
          { label: "Account Settings", key: "account", icon: "fas fa-user-cog" },
          { label: "Logout", key: "logout", icon: "fas fa-sign-out-alt" },
        ],
      },
    ],
  }),
  actions: {
    refreshDemo() {
      const payload = buildDemoPayload(this.demoRole);
      mapPayloadToStore(this, payload, payload?.student?.name || this.student.fullName);
      return payload;
    },

    async setDemoRole(role) {
      if (this.environmentMode !== "demo") return this.viewerMode;
      this.demoRole = setStoredDemoRole(role);
      this.activePage = "dashboard";
      this.error = null;
      this.refreshDemo();
      return this.viewerMode;
    },

    async cycleDemoRole() {
      if (this.environmentMode !== "demo") return this.viewerMode;
      this.demoRole = cycleStoredDemoRole(this.demoRole);
      this.activePage = "dashboard";
      this.error = null;
      this.refreshDemo();
      return this.viewerMode;
    },

    runDemoMutation(callback, reload = true) {
      const result = callback();
      if (reload) {
        this.refreshDemo();
      }
      return result;
    },

    async load() {
      this.loading = true;
      this.error = null;

      try {
        if (this.environmentMode === "demo") {
          this.refreshDemo();
          return;
        }
        const bootstrapResponse = await fetch("/lms/api/live_bootstrap", {
          credentials: "same-origin",
        });
        const bootstrapType = bootstrapResponse.headers.get("content-type") || "";

        if (bootstrapType.includes("application/json")) {
          const bootstrapPayload = await bootstrapResponse.json();
          if (!bootstrapResponse.ok) {
            throw new Error(bootstrapPayload.message || "Please log in to view LMS data.");
          }
          mapPayloadToStore(this, bootstrapPayload, this.student.fullName);
          return;
        }

        const sessionResponse = await fetch("/web/session/get_session_info", {
          credentials: "same-origin",
        });
        const session = await sessionResponse.json();

        if (!session?.uid) {
          throw new Error("Please log in to view LMS data.");
        }

        const userRows = await rpc("res.users", "read", [[session.uid], ["name", "login", "tz", "lang"]]);
        const userRow = userRows?.[0] || {};
        const studentIds = [session.uid];

        const enrollmentsByUser = await searchRead(
          "lms.enrollment",
          [["student_id", "in", studentIds]],
          ["id", "student_id", "course_id", "status", "progress", "enrolled_on", "x_completed_lessons", "x_total_lessons", "x_last_activity_on"],
        );

        const courses = await searchRead(
          "lms.course",
          [["x_is_published", "=", true]],
          [
            "id",
            "name",
            "description",
            "teacher_id",
            "x_total_lessons",
            "x_total_quizzes",
            "x_total_announcements",
            "x_quiz_attempt_count",
            "x_average_percentage",
            "x_active_student_count",
            "x_average_progress",
            "x_attendance_rate",
            "x_completion_rate",
          ],
        );
        const courseIds = courses.map((row) => row.id).filter(Boolean);

        const lessons = courseIds.length
          ? await searchRead(
              "lms.lesson",
              [["course_id", "in", courseIds]],
              [
                "id",
                "name",
                "course_id",
                "sequence",
                "video_url",
                "content",
                "file_filename",
                "x_started_student_count",
                "x_completed_student_count",
                "x_completion_rate",
              ],
            )
          : [];
        const lessonIds = lessons.map((row) => row.id).filter(Boolean);

        const lessonProgress = lessonIds.length
          ? await searchRead(
              "lms.lesson.progress",
              [["student_id", "in", studentIds], ["lesson_id", "in", lessonIds]],
              ["id", "student_id", "lesson_id", "course_id", "status", "progress_percent", "first_opened_on", "last_opened_on", "completed_on"],
            )
          : [];

        const announcements = courseIds.length
          ? await searchRead(
              "lms.announcement",
              [["course_id", "in", courseIds]],
              ["id", "course_id", "title", "message", "date", "create_date"],
            )
          : [];

        const quizzes = courseIds.length
          ? await searchRead(
              "lms.quiz",
              [["course_id", "in", courseIds]],
              [
                "id",
                "course_id",
                "name",
                "x_attempt_limit",
                "x_deadline",
                "x_attempt_count",
                "x_average_percentage",
                "x_pass_rate",
                "total_questions",
              ],
            )
          : [];

        const quizIds = quizzes.map((row) => row.id).filter(Boolean);

        const questions = quizIds.length
          ? await searchRead(
              "lms.question",
              [["quiz_id", "in", quizIds]],
              ["id", "quiz_id", "question_text", "answer_a", "answer_b", "answer_c", "answer_d", "points"],
            )
          : [];

        const quizResults = await searchRead(
          "lms.quiz.result",
          [["student_id", "in", studentIds]],
          ["id", "quiz_id", "score", "max_score", "percentage", "passed", "submitted_on", "create_date"],
        );

        const resultIds = quizResults.map((row) => row.id).filter(Boolean);
        const quizResultLines = resultIds.length
          ? await searchRead(
              "lms.quiz.result.line",
              [["result_id", "in", resultIds]],
              ["id", "result_id", "question_id", "selected_answer", "is_correct", "points", "create_date"],
            )
          : [];

        mapPayloadToStore(
          this,
          {
            student: {
              name: userRow.name || this.student.fullName,
              login: userRow.login || session.username || this.student.login,
              email: this.student.email,
              phone: this.student.phone,
              timezone: userRow.tz || session.user_context?.tz || this.student.timezone,
              language: userRow.lang || session.user_context?.lang || this.student.language,
              avatar_url: this.student.avatarUrl,
              has_avatar: this.student.hasAvatar,
              notifications: this.student.notifications,
            },
            enrollments: enrollmentsByUser,
            courses,
            lessons,
            lesson_progress: lessonProgress,
            announcements,
            quizzes,
            questions,
            quiz_results: quizResults,
            quiz_result_lines: quizResultLines,
          },
          userRow.name || this.student.fullName,
        );
      } catch (error) {
        this.error = error?.message || "Failed to load LMS data.";
      } finally {
        this.loading = false;
      }
    },

    async trackLesson(lessonId, action = "open", progressPercent = null) {
      if (this.environmentMode === "demo") {
        return this.runDemoMutation(() => demoApi.trackLesson(this.demoRole, lessonId, action, progressPercent));
      }
      const payload = await routeJson("/lms/api/track_lesson", {
        lesson_id: lessonId,
        action,
        progress_percent: progressPercent,
      });
      await this.load();
      return payload;
    },

    async updateProfile(profile) {
      if (this.environmentMode === "demo") {
        return this.runDemoMutation(() => demoApi.updateProfile(this.demoRole, profile));
      }
      const payload = await routeJson("/lms/api/update_profile", {
        full_name: profile.fullName,
        email: profile.email,
        phone: profile.phone,
        notifications: profile.notifications || this.student.notifications,
      });
      if (payload?.student) {
        this.student = {
          ...this.student,
          fullName: payload.student.name || this.student.fullName,
          login: payload.student.login || this.student.login,
          email: payload.student.email || "",
          phone: payload.student.phone || "",
          timezone: payload.student.timezone || this.student.timezone,
          language: payload.student.language || this.student.language,
          lastLogin: payload.student.last_login || this.student.lastLogin,
          avatarUrl: payload.student.avatar_url || payload.student.avatarUrl || this.student.avatarUrl,
          hasAvatar: Boolean(payload.student.avatar_url || payload.student.avatarUrl || payload.student.has_avatar || payload.student.hasAvatar),
          notifications: normalizeNotifications(payload.student.notifications || this.student.notifications),
        };
      }
      return payload;
    },

    async updateAvatar(imageBase64, clear = false) {
      if (this.environmentMode === "demo") {
        return this.runDemoMutation(() => demoApi.updateAvatar(this.demoRole, imageBase64, clear));
      }
      const payload = await routeJson("/lms/api/update_avatar", {
        image_base64: imageBase64,
        clear,
      });
      if (payload?.student) {
        this.student = {
          ...this.student,
          fullName: payload.student.name || this.student.fullName,
          login: payload.student.login || this.student.login,
          email: payload.student.email || this.student.email,
          phone: payload.student.phone || this.student.phone,
          timezone: payload.student.timezone || this.student.timezone,
          language: payload.student.language || this.student.language,
          lastLogin: payload.student.last_login || this.student.lastLogin,
          avatarUrl: payload.student.avatar_url || payload.student.avatarUrl || "",
          hasAvatar: Boolean(payload.student.avatar_url || payload.student.avatarUrl || payload.student.has_avatar || payload.student.hasAvatar),
          notifications: normalizeNotifications(payload.student.notifications || this.student.notifications),
        };
      }
      return payload;
    },

    async changePassword(currentPassword, newPassword) {
      if (this.environmentMode === "demo") {
        return this.runDemoMutation(() => demoApi.changePassword(this.demoRole, currentPassword, newPassword));
      }
      return routeJson("/lms/api/change_password", {
        current_password: currentPassword,
        new_password: newPassword,
      });
    },

    async saveCourse(courseId, values) {
      if (this.environmentMode === "demo") {
        return this.runDemoMutation(() => demoApi.saveCourse(this.demoRole, courseId, values));
      }
      await rpc("lms.course", "write", [[courseId], values]);
      await this.load();
    },
    async createLesson(values) {
      if (this.environmentMode === "demo") {
        return this.runDemoMutation(() => demoApi.createLesson(this.demoRole, values));
      }
      await rpc("lms.lesson", "create", [values]);
      await this.load();
    },
    async updateLesson(lessonId, values) {
      if (this.environmentMode === "demo") {
        return this.runDemoMutation(() => demoApi.updateLesson(this.demoRole, lessonId, values));
      }
      await rpc("lms.lesson", "write", [[lessonId], values]);
      await this.load();
    },
    async deleteLesson(lessonId) {
      if (this.environmentMode === "demo") {
        return this.runDemoMutation(() => demoApi.deleteLesson(this.demoRole, lessonId));
      }
      await rpc("lms.lesson", "unlink", [[lessonId]]);
      await this.load();
    },
    async createAnnouncement(values) {
      if (this.environmentMode === "demo") {
        return this.runDemoMutation(() => demoApi.createAnnouncement(this.demoRole, values));
      }
      await rpc("lms.announcement", "create", [values]);
      await this.load();
    },
    async updateAnnouncement(announcementId, values) {
      if (this.environmentMode === "demo") {
        return this.runDemoMutation(() => demoApi.updateAnnouncement(this.demoRole, announcementId, values));
      }
      await rpc("lms.announcement", "write", [[announcementId], values]);
      await this.load();
    },
    async deleteAnnouncement(announcementId) {
      if (this.environmentMode === "demo") {
        return this.runDemoMutation(() => demoApi.deleteAnnouncement(this.demoRole, announcementId));
      }
      await rpc("lms.announcement", "unlink", [[announcementId]]);
      await this.load();
    },
    async createQuiz(values) {
      if (this.environmentMode === "demo") {
        return this.runDemoMutation(() => demoApi.createQuiz(this.demoRole, values));
      }
      await rpc("lms.quiz", "create", [values]);
      await this.load();
    },
    async updateQuiz(quizId, values) {
      if (this.environmentMode === "demo") {
        return this.runDemoMutation(() => demoApi.updateQuiz(this.demoRole, quizId, values));
      }
      await rpc("lms.quiz", "write", [[quizId], values]);
      await this.load();
    },
    async deleteQuiz(quizId) {
      if (this.environmentMode === "demo") {
        return this.runDemoMutation(() => demoApi.deleteQuiz(this.demoRole, quizId));
      }
      await rpc("lms.quiz", "unlink", [[quizId]]);
      await this.load();
    },
    async createQuestion(values) {
      if (this.environmentMode === "demo") {
        return this.runDemoMutation(() => demoApi.createQuestion(this.demoRole, values));
      }
      await rpc("lms.question", "create", [values]);
      await this.load();
    },
    async updateQuestion(questionId, values) {
      if (this.environmentMode === "demo") {
        return this.runDemoMutation(() => demoApi.updateQuestion(this.demoRole, questionId, values));
      }
      await rpc("lms.question", "write", [[questionId], values]);
      await this.load();
    },
    async deleteQuestion(questionId) {
      if (this.environmentMode === "demo") {
        return this.runDemoMutation(() => demoApi.deleteQuestion(this.demoRole, questionId));
      }
      await rpc("lms.question", "unlink", [[questionId]]);
      await this.load();
    },
    async createEnrollment(values) {
      if (this.environmentMode === "demo") {
        return this.runDemoMutation(() => demoApi.createEnrollment(this.demoRole, values));
      }
      await rpc("lms.enrollment", "create", [values]);
      await this.load();
    },
    async deleteEnrollment(enrollmentId) {
      if (this.environmentMode === "demo") {
        return this.runDemoMutation(() => demoApi.deleteEnrollment(this.demoRole, enrollmentId));
      }
      await rpc("lms.enrollment", "unlink", [[enrollmentId]]);
      await this.load();
    },
    async saveAssignment(courseId, values, assignmentId = null) {
      if (this.environmentMode === "demo") {
        return this.runDemoMutation(() => demoApi.saveAssignment(this.demoRole, courseId, values, assignmentId));
      }
      const payload = await routeJson("/lms/api/doctor/save_assignment", {
        course_id: courseId,
        assignment_id: assignmentId,
        values,
      });
      await this.load();
      return payload;
    },

    async deleteAssignment(assignmentId) {
      if (this.environmentMode === "demo") {
        return this.runDemoMutation(() => demoApi.deleteAssignment(this.demoRole, assignmentId));
      }
      await rpc("lms.assignment", "unlink", [[assignmentId]]);
      await this.load();
    },
    async submitAssignment(assignmentId, submission) {
      if (this.environmentMode === "demo") {
        return this.runDemoMutation(() => demoApi.submitAssignment(this.demoRole, assignmentId, submission));
      }
      const payload = await routeJson("/lms/api/submit_assignment", {
        assignment_id: assignmentId,
        submission_text: submission.submissionText || "",
        file_base64: submission.fileBase64 || "",
        file_name: submission.fileName || "",
      });
      await this.load();
      return payload;
    },

    async gradeAssignment(submissionId, values) {
      if (this.environmentMode === "demo") {
        return this.runDemoMutation(() => demoApi.gradeAssignment(this.demoRole, submissionId, values));
      }
      const payload = await routeJson("/lms/api/doctor/grade_assignment", {
        submission_id: submissionId,
        score: values.score,
        feedback: values.feedback || "",
        status: values.status || "graded",
      });
      await this.load();
      return payload;
    },

    async createAttendanceSession(values) {
      if (this.environmentMode === "demo") {
        return this.runDemoMutation(() => demoApi.createAttendanceSession(this.demoRole, values));
      }
      const payload = await routeJson("/lms/api/doctor/create_attendance_session", {
        course_id: values.courseId,
        name: values.name,
        session_date: values.sessionDate,
        lesson_id: values.lessonId || null,
        notes: values.notes || "",
      });
      await this.load();
      return payload;
    },

    async saveAttendance(sessionId, records, closeSession = false) {
      if (this.environmentMode === "demo") {
        return this.runDemoMutation(() => demoApi.saveAttendance(this.demoRole, sessionId, records, closeSession));
      }
      const payload = await routeJson("/lms/api/doctor/save_attendance", {
        session_id: sessionId,
        records,
        close_session: closeSession,
      });
      await this.load();
      return payload;
    },

    async reopenAttendanceSession(sessionId) {
      if (this.environmentMode === "demo") {
        return this.runDemoMutation(() => demoApi.reopenAttendanceSession(this.demoRole, sessionId));
      }
      const payload = await routeJson("/lms/api/doctor/reopen_attendance", {
        session_id: sessionId,
      });
      await this.load();
      return payload;
    },

    async deleteAttendanceSession(sessionId) {
      if (this.environmentMode === "demo") {
        return this.runDemoMutation(() => demoApi.deleteAttendanceSession(this.demoRole, sessionId));
      }
      await rpc("lms.attendance.session", "unlink", [[sessionId]]);
      await this.load();
    },
    async submitQuiz(quizId, answers) {
      if (this.environmentMode === "demo") {
        return this.runDemoMutation(() => demoApi.submitQuiz(this.demoRole, quizId, answers));
      }
      const payload = await routeJson("/lms/api/submit_quiz", {
        quiz_id: quizId,
        answers,
      });
      await this.load();
      return payload;
    },
  },
});
