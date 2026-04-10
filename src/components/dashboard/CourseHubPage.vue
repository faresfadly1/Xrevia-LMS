<template>
  <section class="course-hub">
    <div class="course-hub__intro">
      <div>
        <div class="course-hub__eyebrow">{{ introEyebrow }}</div>
        <h1 class="course-hub__title">{{ introTitle }}</h1>
        <p class="course-hub__subtitle">{{ introSubtitle }}</p>
      </div>
      <div class="course-hub__badge">{{ roleBadge }}</div>
    </div>

    <div class="course-hub__layout">
      <PanelCard
        class="course-hub__catalog"
        title="Course Directory"
        subtitle="Browse the active courses attached to this portal role."
      >
        <div class="course-hub__catalog-grid">
          <button
            v-for="course in courses"
            :key="course.id"
            type="button"
            :class="['course-hub__catalog-button', { 'is-active': course.id === selectedCourseId }]"
            @click="$emit('select-course', course.id)"
          >
            <CoursePreviewCard
              compact
              :title="course.name"
              :code="course.code || course.teacher || 'Course'"
              :subtitle="courseCatalogSubtitle(course)"
              :badge="courseCatalogBadge(course)"
              :tone="catalogTone"
              :icon="catalogIcon"
              :detail-rows="courseDetailRows(course)"
              :progress="course.progressPercent || 0"
              :progress-label="role === 'student' ? `${Math.round(course.progressPercent || 0)}% completed` : `${course.activeStudents || 0} students`"
              :show-progress="role === 'student'"
            />
          </button>
          <div v-if="!courses.length" class="course-hub__empty">No courses are visible yet. Once the university publishes or assigns courses, they will appear here.</div>
        </div>
      </PanelCard>

      <div class="course-hub__content" v-if="selectedCourse">
        <PanelCard class="course-hub__hero">
          <div class="course-hub__hero-top">
            <div>
              <div class="course-hub__hero-kicker">{{ selectedCourse.code || 'University Course' }}</div>
              <h2 class="course-hub__hero-title">{{ selectedCourse.name }}</h2>
              <p class="course-hub__hero-subtitle">{{ selectedCourse.description || fallbackDescription }}</p>
            </div>
            <div class="course-hub__hero-badges">
              <span v-if="selectedCourse.department" class="hero-chip">{{ selectedCourse.department }}</span>
              <span v-if="selectedCourse.term" class="hero-chip">{{ selectedCourse.term }}</span>
              <span v-if="selectedCourse.status" class="hero-chip">{{ selectedCourse.status }}</span>
            </div>
          </div>

          <div class="course-hub__metric-grid">
            <div class="hero-metric">
              <span>Lessons</span>
              <strong>{{ lessons.length }}</strong>
              <small>{{ role === 'student' ? 'Structured learning units' : 'Editable course content' }}</small>
            </div>
            <div class="hero-metric">
              <span>Assignments</span>
              <strong>{{ assignments.length }}</strong>
              <small>{{ role === 'student' ? 'Assessments to complete' : 'Coursework to manage' }}</small>
            </div>
            <div class="hero-metric">
              <span>{{ role === 'student' ? 'Quizzes' : 'Students' }}</span>
              <strong>{{ role === 'student' ? quizzes.length : studentCount }}</strong>
              <small>{{ role === 'student' ? 'Exam and practice items' : 'Visible learners in this course' }}</small>
            </div>
            <div class="hero-metric">
              <span>{{ role === 'student' ? 'Progress' : 'Pending' }}</span>
              <strong>{{ role === 'student' ? `${Math.round(selectedCourse.progressPercent || 0)}%` : pendingSubmissions }}</strong>
              <small>{{ role === 'student' ? 'Current completion status' : 'Submissions waiting on action' }}</small>
            </div>
          </div>

          <div class="course-hub__action-row">
            <template v-if="role === 'student'">
              <button type="button" class="course-action course-action--primary" @click="primaryStudentLesson && $emit('open-lesson', primaryStudentLesson.id)">
                {{ primaryStudentLesson ? 'Continue Lesson' : 'Open Lessons' }}
              </button>
              <button type="button" class="course-action" @click="$emit('navigate', 'assignments')">Assessments</button>
              <button type="button" class="course-action" @click="$emit('navigate', 'announcements')">Announcements</button>
            </template>
            <template v-else>
              <button type="button" class="course-action course-action--primary" @click="$emit('workspace-action', 'course-settings')">Course Settings</button>
              <button type="button" class="course-action" @click="$emit('workspace-action', 'lesson-builder')">Lesson Builder</button>
              <button type="button" class="course-action" @click="$emit('workspace-action', 'roster')">Roster & Attendance</button>
              <button type="button" class="course-action" @click="$emit('workspace-action', 'gradebook')">Gradebook</button>
            </template>
          </div>
        </PanelCard>

        <div class="course-hub__grid">
          <PanelCard
            v-if="visibility.lessons !== false"
            title="Lessons"
            subtitle="The learning flow, modules, and sessions within this course."
          >
            <div class="course-hub__stack-list">
              <div v-for="lesson in lessons.slice(0, 4)" :key="lesson.id" class="course-hub__list-row">
                <div>
                  <div class="course-hub__list-title">{{ lesson.name }}</div>
                  <div class="course-hub__list-sub">{{ lesson.moduleTitle || lesson.weekLabel || selectedCourse.name }}</div>
                </div>
                <button
                  v-if="role === 'student'"
                  type="button"
                  class="course-hub__inline-link"
                  @click="$emit('open-lesson', lesson.id)"
                >
                  {{ lesson.isCompleted ? 'Review' : 'Open' }}
                </button>
                <span v-else class="course-hub__mini-badge">{{ lesson.sequence }}</span>
              </div>
              <div v-if="!lessons.length" class="course-hub__empty">No lessons are published for this course yet. The next teaching update will appear here.</div>
            </div>
          </PanelCard>

          <PanelCard title="Assessments" subtitle="Assignments, quizzes, and course progress milestones.">
            <div class="course-hub__stack-list">
              <div v-for="assessment in assessmentItems.slice(0, 4)" :key="assessment.id" class="course-hub__list-row">
                <div>
                  <div class="course-hub__list-title">{{ assessment.title }}</div>
                  <div class="course-hub__list-sub">{{ assessment.subtitle }}</div>
                </div>
                <button
                  v-if="role === 'student' && assessment.kind === 'quiz'"
                  type="button"
                  class="course-hub__inline-link"
                  @click="$emit('open-quiz', assessment.sourceId)"
                >
                  Start
                </button>
                <span v-else class="course-hub__mini-badge">{{ assessment.badge }}</span>
              </div>
              <div v-if="!assessmentItems.length" class="course-hub__empty">No assignments or quizzes are active yet. Once assessment work opens, it will appear here.</div>
            </div>
          </PanelCard>

          <PanelCard
            v-if="visibility.announcements !== false"
            title="Announcements"
            subtitle="Key messages and teaching updates for this course."
          >
            <div class="course-hub__stack-list">
              <div v-for="announcement in announcements.slice(0, 4)" :key="announcement.id" class="course-hub__list-row course-hub__list-row--stacked">
                <div>
                  <div class="course-hub__list-title">{{ announcement.title }}</div>
                  <div class="course-hub__list-sub">{{ announcement.date }}</div>
                </div>
                <p class="course-hub__announcement-copy">{{ announcement.message }}</p>
              </div>
              <div v-if="!announcements.length" class="course-hub__empty">No announcements have been published yet. Course updates will appear here once they are posted.</div>
            </div>
          </PanelCard>

          <PanelCard :title="role === 'student' ? 'Schedule & Grades' : 'Course Health'" :subtitle="role === 'student' ? 'What is coming next and how you are performing in this course.' : 'A quick view of what is next and where action is needed.'">
            <div class="course-hub__stack-list">
              <div v-for="item in supportItems.slice(0, 4)" :key="item.id" class="course-hub__list-row">
                <div>
                  <div class="course-hub__list-title">{{ item.title }}</div>
                  <div class="course-hub__list-sub">{{ item.subtitle }}</div>
                </div>
                <span class="course-hub__mini-badge">{{ item.badge }}</span>
              </div>
              <div v-if="!supportItems.length" class="course-hub__empty">This area will show upcoming schedule and grade signals as the course activity grows.</div>
            </div>
          </PanelCard>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from "vue";
import PanelCard from "./PanelCard.vue";
import CoursePreviewCard from "./CoursePreviewCard.vue";

const props = defineProps({
  role: { type: String, default: "student" },
  courses: { type: Array, default: () => [] },
  selectedCourseId: { type: [String, Number, null], default: null },
  selectedCourse: { type: Object, default: null },
  lessons: { type: Array, default: () => [] },
  assignments: { type: Array, default: () => [] },
  quizzes: { type: Array, default: () => [] },
  announcements: { type: Array, default: () => [] },
  calendarEvents: { type: Array, default: () => [] },
  gradebookRows: { type: Array, default: () => [] },
  visibility: { type: Object, default: () => ({}) },
  studentCount: { type: Number, default: 0 },
  pendingSubmissions: { type: Number, default: 0 },
});

defineEmits(["select-course", "open-lesson", "open-quiz", "navigate", "workspace-action"]);

const catalogTone = computed(() => {
  if (props.role === "teacher") return "violet";
  if (props.role === "admin") return "green";
  return "blue";
});

const catalogIcon = computed(() => {
  if (props.role === "teacher") return "fas fa-chalkboard-teacher";
  if (props.role === "admin") return "fas fa-building-columns";
  return "fas fa-book-open";
});

const introEyebrow = computed(() => {
  if (props.role === "teacher") return "Teaching Hub";
  if (props.role === "admin") return "Academic Operations";
  return "Course Hub";
});

const introTitle = computed(() => {
  if (props.role === "teacher") return "One polished place to lead every course.";
  if (props.role === "admin") return "Course oversight across the university.";
  return "Everything you need for each course, clearly organized.";
});

const introSubtitle = computed(() => {
  if (props.role === "teacher") return "Open a course to shape content, assessments, attendance, and announcements in the same premium workflow.";
  if (props.role === "admin") return "Monitor course quality, structure, and readiness with a modern academic control layer.";
  return "Browse lessons, assignments, announcements, schedules, and grades with the same calm academic design language.";
});

const roleBadge = computed(() => {
  if (props.role === "teacher") return "Professor";
  if (props.role === "admin") return "Administrator";
  return "Student";
});

const fallbackDescription = computed(() => {
  if (props.role === "teacher") return "Design a structured, academic learning flow with clear lessons, assessments, and student touchpoints.";
  if (props.role === "admin") return "Maintain consistency, course quality, and operational clarity across the full teaching portfolio.";
  return "Review lessons, stay on top of assessments, and move through the course with confidence.";
});

const primaryStudentLesson = computed(() => props.lessons.find((lesson) => !lesson.isCompleted) || props.lessons[0] || null);

const assessmentItems = computed(() => {
  const assignmentItems = props.assignments.map((assignment) => ({
    id: `assignment-${assignment.id}`,
    kind: "assignment",
    sourceId: assignment.id,
    title: assignment.name,
    subtitle: assignment.dueDate ? `Due ${assignment.dueDate}` : assignment.course,
    badge: assignment.pendingCount ? `${assignment.pendingCount} pending` : "Assignment",
  }));
  const quizItems = props.quizzes.map((quiz) => ({
    id: `quiz-${quiz.id}`,
    kind: "quiz",
    sourceId: quiz.id,
    title: quiz.name,
    subtitle: quiz.deadline ? `Deadline ${quiz.deadline}` : quiz.course,
    badge: quiz.attemptCount ? `${quiz.attemptCount} attempts` : "Quiz",
  }));
  return [...assignmentItems, ...quizItems];
});

const supportItems = computed(() => {
  const schedule = props.calendarEvents.map((event) => ({
    id: `event-${event.id}`,
    title: event.title,
    subtitle: event.subtitle,
    badge: event.type,
  }));
  const grades = props.gradebookRows.map((row) => ({
    id: `grade-${row.id}`,
    title: row.title || row.studentName,
    subtitle: row.feedback || row.course || "Gradebook item",
    badge: row.scoreLabel || (row.overallAverage !== null && row.overallAverage !== undefined ? `${Math.round(row.overallAverage)}%` : "View"),
  }));
  return [...schedule, ...grades];
});

const courseCatalogSubtitle = (course) => {
  if (props.role === "teacher") return `${course.activeStudents || 0} students`;
  if (props.role === "admin") return course.teacher || "Assigned instructor";
  return course.teacher || "Course instructor";
};

const courseCatalogBadge = (course) => {
  if (props.role === "student") return course.progressPercent ? `${Math.round(course.progressPercent)}%` : "Open";
  if (props.role === "admin") return course.department || "Department";
  return course.code || "Course";
};

const courseDetailRows = (course) => {
  if (props.role === "student") {
    return [
      { label: "Lessons", value: course.totalLessons || 0 },
      { label: "Assignments", value: course.totalAssignments || 0 },
    ];
  }
  return [
    { label: "Students", value: course.activeStudents || 0 },
    { label: "Quizzes", value: course.totalQuizzes || 0 },
  ];
};
</script>

<style scoped>
.course-hub {
  display: grid;
  gap: 22px;
}

.course-hub__intro {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.course-hub__eyebrow {
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--accent-strong, #496A8A);
}

.course-hub__title {
  margin: 10px 0 0;
  font-size: 34px;
  line-height: 1.05;
  letter-spacing: -0.04em;
  color: var(--text-primary);
}

.course-hub__subtitle {
  margin: 10px 0 0;
  font-size: 14px;
  color: var(--text-secondary);
  max-width: 720px;
}

.course-hub__badge {
  padding: 10px 14px;
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--accent-strong, #496A8A);
  font-size: 12px;
  font-weight: 700;
}

.course-hub__layout {
  display: grid;
  grid-template-columns: minmax(280px, 340px) minmax(0, 1fr);
  gap: 18px;
}

.course-hub__catalog-grid {
  display: grid;
  gap: 12px;
}

.course-hub__catalog-button {
  padding: 0;
  border: none;
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.course-hub__catalog-button.is-active {
  transform: translateY(-1px);
}

.course-hub__content {
  display: grid;
  gap: 18px;
}

.course-hub__hero-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 18px;
}

.course-hub__hero-kicker {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text-quiet);
}

.course-hub__hero-title {
  margin: 8px 0 0;
  font-size: 30px;
  line-height: 1.08;
  letter-spacing: -0.04em;
  color: var(--text-primary);
}

.course-hub__hero-subtitle {
  margin: 10px 0 0;
  font-size: 14px;
  line-height: 1.7;
  color: var(--text-secondary);
}

.course-hub__hero-badges {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
}

.hero-chip,
.course-hub__mini-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 12px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  background: var(--accent-soft);
  color: var(--accent-strong);
}

.course-hub__metric-grid {
  margin-top: 18px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.hero-metric {
  padding: 16px;
  border-radius: 20px;
  background: var(--surface-muted);
  border: var(--border-subtle);
}

.hero-metric span {
  display: block;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-quiet);
}

.hero-metric strong {
  display: block;
  margin-top: 10px;
  font-size: 28px;
  color: var(--text-primary);
}

.hero-metric small {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.55;
}

.course-hub__action-row {
  margin-top: 18px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.course-action {
  border: none;
  border-radius: 16px;
  padding: 12px 16px;
  background: var(--accent-soft);
  color: var(--accent-strong);
  font-weight: 700;
  cursor: pointer;
}

.course-action--primary {
  background: var(--accent-strong, #496A8A);
  color: #fffaf4;
}

.course-hub__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.course-hub__stack-list {
  display: grid;
  gap: 12px;
}

.course-hub__list-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border-radius: 18px;
  background: var(--surface-muted);
  border: var(--border-subtle);
}

.course-hub__list-row--stacked {
  align-items: flex-start;
}

.course-hub__list-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
}

.course-hub__list-sub {
  margin-top: 4px;
  font-size: 12px;
  color: var(--text-secondary);
}

.course-hub__inline-link {
  border: none;
  background: transparent;
  color: var(--accent-strong, #496A8A);
  font-weight: 700;
  cursor: pointer;
}

.course-hub__announcement-copy {
  margin: 6px 0 0;
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.65;
}

.course-hub__empty {
  padding: 16px;
  border-radius: 18px;
  background: var(--surface-muted);
  color: var(--text-muted);
  font-size: 13px;
}

@media (max-width: 1200px) {
  .course-hub__layout,
  .course-hub__grid,
  .course-hub__metric-grid {
    grid-template-columns: 1fr 1fr;
  }

  .course-hub__catalog {
    grid-column: 1 / -1;
  }
}

@media (max-width: 760px) {
  .course-hub__intro,
  .course-hub__layout,
  .course-hub__grid,
  .course-hub__metric-grid {
    grid-template-columns: 1fr;
    display: grid;
  }

  .course-hub__hero-top {
    flex-direction: column;
  }
}
</style>
