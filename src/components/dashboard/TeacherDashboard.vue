<template>
  <section class="dashboard-view teacher-view">
    <div class="dashboard-view__intro">
      <div>
        <div class="dashboard-view__eyebrow">Teacher View</div>
        <h1 class="dashboard-view__title">{{ greeting }}</h1>
        <p class="dashboard-view__subtitle">{{ subtitle }}</p>
      </div>
      <div class="dashboard-view__badge">Course activity in motion</div>
    </div>

    <div class="dashboard-view__stats">
      <StatCard
        v-for="stat in stats"
        :key="stat.label"
        :icon="stat.icon"
        :label="stat.label"
        :value="stat.value"
        :sub="stat.sub"
        :tone="stat.tone"
      />
    </div>

    <div class="teacher-view__grid">
      <PanelCard
        class="teacher-view__courses"
        eyebrow="Teaching Portfolio"
        title="My Courses"
        subtitle="A quick snapshot of the courses, cohorts, and teaching load you are managing."
        action-label="View all"
        @action="$emit('navigate', 'courses')"
      >
        <div class="teacher-view__course-grid">
          <button
            v-for="course in courses"
            :key="course.id"
            type="button"
            class="teacher-view__course-button"
            @click="$emit('open-course', course.id)"
          >
            <CoursePreviewCard
              compact
              :title="course.title"
              :code="course.code"
              :subtitle="course.subtitle"
              :badge="course.badge"
              :tone="course.tone"
              :icon="course.icon"
              :detail-rows="course.detailRows"
              :show-progress="false"
            />
          </button>
          <div v-if="!courses.length" class="dashboard-view__empty">No courses are assigned to you yet. Once a course is linked, this teaching workspace will populate here.</div>
        </div>
      </PanelCard>

      <PanelCard
        title="Pending Assignments"
        subtitle="See what still needs grading or instructor review."
        action-label="Open gradebook"
        @action="$emit('quick-action', 'create-assignment')"
      >
        <div class="teacher-view__table">
          <div v-for="row in pendingAssignments" :key="row.id" class="teacher-view__table-row">
            <div>
              <div class="teacher-view__table-title">{{ row.title }}</div>
              <div class="teacher-view__table-sub">{{ row.subtitle }}</div>
            </div>
            <div class="teacher-view__table-metrics">
              <span>{{ row.submitted }} Submitted</span>
              <strong>{{ row.pending }} Pending</strong>
            </div>
          </div>
          <div v-if="!pendingAssignments.length" class="dashboard-view__empty">Everything submitted so far has been reviewed. New student work will appear here automatically.</div>
        </div>
      </PanelCard>

      <PanelCard
        title="Class Performance"
        subtitle="Monitor academic momentum across your active teaching load."
      >
        <div v-if="chartDots.length" class="teacher-view__chart-wrap">
          <svg viewBox="0 0 320 150" class="teacher-view__chart" role="img" aria-label="Class performance trend">
            <path class="teacher-view__chart-grid" d="M10 20 H310 M10 75 H310 M10 130 H310" />
            <path :d="chartPath" class="teacher-view__chart-line" />
            <circle v-for="point in chartDots" :key="point.key" :cx="point.x" :cy="point.y" r="4" class="teacher-view__chart-dot" />
          </svg>
          <div class="teacher-view__chart-summary">
            <div>
              <span>Average grade</span>
              <strong>{{ averagePerformance }}</strong>
            </div>
            <div>
              <span>Trend</span>
              <strong>{{ performanceDelta }}</strong>
            </div>
          </div>
        </div>
        <div v-else class="dashboard-view__empty">Publish at least one graded quiz or assignment to unlock the class performance trend.</div>
      </PanelCard>

      <PanelCard
        title="Today's Schedule"
        subtitle="Lectures, labs, office hours, and class activities lined up for you."
      >
        <div class="dashboard-view__stack-list compact-list">
          <div v-for="item in schedule" :key="item.id" class="stack-item stack-item--calendar">
            <div class="stack-item__time">{{ item.time }}</div>
            <div>
              <div class="stack-item__title">{{ item.title }}</div>
              <div class="stack-item__sub">{{ item.subtitle }}</div>
            </div>
          </div>
          <div v-if="!schedule.length" class="dashboard-view__empty">No teaching sessions are scheduled right now. Upcoming lectures and attendance checkpoints will appear here.</div>
        </div>
      </PanelCard>

      <PanelCard class="teacher-view__actions" title="Quick Actions" subtitle="Handle the main teaching tasks from one polished command strip.">
        <div class="teacher-view__action-grid">
          <button type="button" class="teacher-view__action-btn" @click="$emit('quick-action', 'upload-material')">
            <i class="fas fa-upload"></i>
            <span>Upload Material</span>
          </button>
          <button type="button" class="teacher-view__action-btn" @click="$emit('quick-action', 'create-assignment')">
            <i class="fas fa-file-signature"></i>
            <span>Create Assignment</span>
          </button>
          <button type="button" class="teacher-view__action-btn" @click="$emit('quick-action', 'take-attendance')">
            <i class="fas fa-user-check"></i>
            <span>Take Attendance</span>
          </button>
          <button type="button" class="teacher-view__action-btn" @click="$emit('quick-action', 'create-quiz')">
            <i class="fas fa-clipboard-check"></i>
            <span>Create Quiz</span>
          </button>
        </div>
      </PanelCard>
    </div>
  </section>
</template>

<script setup>
import { computed } from "vue";
import StatCard from "./StatCard.vue";
import PanelCard from "./PanelCard.vue";
import CoursePreviewCard from "./CoursePreviewCard.vue";

const props = defineProps({
  greeting: { type: String, required: true },
  subtitle: { type: String, default: "" },
  stats: { type: Array, default: () => [] },
  courses: { type: Array, default: () => [] },
  pendingAssignments: { type: Array, default: () => [] },
  performancePoints: { type: Array, default: () => [] },
  averagePerformance: { type: String, default: "—" },
  performanceDelta: { type: String, default: "—" },
  schedule: { type: Array, default: () => [] },
});

defineEmits(["navigate", "open-course", "quick-action"]);

const normalizedPoints = computed(() => {
  return props.performancePoints.filter((point) => Number.isFinite(Number(point.value)));
});

const chartDots = computed(() => {
  const usable = normalizedPoints.value;
  const max = Math.max(...usable.map((point) => Number(point.value) || 0), 100);
  return usable.map((point, index) => {
    const x = 18 + (index * (284 / Math.max(usable.length - 1, 1)));
    const y = 128 - ((Number(point.value) || 0) / max) * 96;
    return { key: `${point.label}-${index}`, x, y };
  });
});

const chartPath = computed(() => chartDots.value.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" "));
</script>

<style scoped>
.dashboard-view {
  display: grid;
  gap: 22px;
}

.dashboard-view__intro {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.dashboard-view__eyebrow {
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--accent-strong, #A07A3D);
}

.dashboard-view__title {
  margin: 10px 0 0;
  font-size: 34px;
  line-height: 1.05;
  letter-spacing: -0.04em;
  color: var(--text-primary);
}

.dashboard-view__subtitle {
  margin: 10px 0 0;
  font-size: 14px;
  color: var(--text-secondary);
}

.dashboard-view__badge {
  padding: 10px 14px;
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--accent-strong, #A07A3D);
  font-size: 12px;
  font-weight: 700;
}

.dashboard-view__stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.teacher-view__grid {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
  gap: 18px;
}

.teacher-view__courses,
.teacher-view__actions {
  grid-column: 1 / -1;
}

.teacher-view__course-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.teacher-view__course-button {
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
}

.teacher-view__table {
  display: grid;
  gap: 12px;
}

.teacher-view__table-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border-radius: 18px;
  background: var(--surface-muted);
  border: var(--border-subtle);
}

.teacher-view__table-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
}

.teacher-view__table-sub {
  margin-top: 4px;
  font-size: 12px;
  color: var(--text-secondary);
}

.teacher-view__table-metrics {
  display: grid;
  gap: 4px;
  justify-items: end;
  font-size: 11px;
  color: var(--text-secondary);
}

.teacher-view__table-metrics strong {
  color: var(--accent-strong);
  font-size: 13px;
}

.teacher-view__chart-wrap {
  display: grid;
  gap: 14px;
}

.teacher-view__chart {
  width: 100%;
  height: auto;
}

.teacher-view__chart-grid {
  fill: none;
  stroke: var(--chart-grid);
  stroke-width: 1;
}

.teacher-view__chart-line {
  fill: none;
  stroke: var(--accent-strong, #A07A3D);
  stroke-width: 4;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.teacher-view__chart-dot {
  fill: var(--surface-card);
  stroke: var(--accent-strong, #A07A3D);
  stroke-width: 3;
}

.teacher-view__chart-summary {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.teacher-view__chart-summary span {
  display: block;
  font-size: 11px;
  color: var(--text-quiet);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.teacher-view__chart-summary strong {
  display: block;
  margin-top: 6px;
  font-size: 26px;
  color: var(--text-primary);
}

.dashboard-view__stack-list {
  display: grid;
  gap: 12px;
}

.stack-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border-radius: 18px;
  background: var(--surface-muted);
  border: var(--border-subtle);
}

.stack-item--soft,
.stack-item--calendar {
  align-items: flex-start;
}

.stack-item__title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
}

.stack-item__sub {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.55;
  color: var(--text-secondary);
}

.stack-item__meta,
.stack-item__time {
  font-size: 11px;
  color: var(--text-quiet);
  font-weight: 600;
}

.teacher-view__action-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.teacher-view__action-btn {
  border: none;
  border-radius: 18px;
  padding: 16px;
  background: linear-gradient(180deg, var(--tone-gold-bg-start) 0%, var(--tone-gold-bg-end) 100%);
  color: var(--accent-strong);
  display: grid;
  justify-items: center;
  gap: 10px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: inset 0 0 0 1px var(--accent-border);
}

.teacher-view__action-btn i {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 14px;
  background: var(--accent-soft);
}

.dashboard-view__empty {
  padding: 16px;
  border-radius: 18px;
  background: var(--surface-muted);
  color: var(--text-muted);
  font-size: 13px;
}

@media (max-width: 1200px) {
  .dashboard-view__stats,
  .teacher-view__grid,
  .teacher-view__course-grid,
  .teacher-view__action-grid {
    grid-template-columns: 1fr 1fr;
  }

  .teacher-view__courses,
  .teacher-view__actions {
    grid-column: auto;
  }
}

@media (max-width: 760px) {
  .dashboard-view__intro,
  .dashboard-view__stats,
  .teacher-view__grid,
  .teacher-view__course-grid,
  .teacher-view__action-grid {
    grid-template-columns: 1fr;
    display: grid;
  }
}
</style>
