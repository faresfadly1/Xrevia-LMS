<template>
  <section class="dashboard-view student-view">
    <div class="dashboard-view__intro">
      <div>
        <div class="dashboard-view__eyebrow">Student View</div>
        <h1 class="dashboard-view__title">{{ greeting }}</h1>
      </div>
    </div>

    <div class="dashboard-view__grid">
      <PanelCard
        class="panel-span-2"
        eyebrow="Learning Dashboard"
        title="My Courses"
        subtitle="Track your current subjects, progress, and next actions from one place."
        action-label="View all"
        @action="$emit('navigate', 'courses')"
      >
        <div class="dashboard-view__course-grid">
          <button
            v-for="course in courses"
            :key="course.id"
            type="button"
            class="dashboard-view__course-button"
            @click="$emit('open-course', course.id)"
          >
            <CoursePreviewCard
              :title="course.title"
              :code="course.code"
              :subtitle="course.subtitle"
              :badge="course.badge"
              :tone="course.tone"
              :icon="course.icon"
              :detail-rows="course.detailRows"
              :progress="course.progress"
              :progress-label="course.progressLabel"
            />
          </button>
          <div v-if="!courses.length" class="dashboard-view__empty">No courses are active for you yet. Once you are enrolled, your learning hub will appear here.</div>
        </div>
      </PanelCard>

      <PanelCard
        title="To Do"
        subtitle="Stay ahead of your nearest academic deadlines."
        action-label="Open tasks"
        @action="$emit('navigate', 'assignments')"
      >
        <div class="dashboard-view__stack-list">
          <div v-for="task in todoItems" :key="task.id" class="stack-item">
            <div>
              <div class="stack-item__title">{{ task.title }}</div>
              <div class="stack-item__sub">{{ task.subtitle }}</div>
            </div>
            <span :class="['badge-pill', `badge-pill--${task.badgeTone || 'neutral'}`]">{{ task.badge }}</span>
          </div>
          <div v-if="!todoItems.length" class="dashboard-view__empty">Nothing urgent is due right now. Open your courses to keep momentum going.</div>
        </div>
      </PanelCard>

      <PanelCard
        title="Announcements"
        subtitle="Recent updates from your instructors and courses."
        action-label="View all"
        @action="$emit('navigate', 'announcements')"
      >
        <div class="dashboard-view__stack-list">
          <div v-for="announcement in announcements" :key="announcement.id" class="stack-item stack-item--soft">
            <div>
              <div class="stack-item__title">{{ announcement.title }}</div>
              <div class="stack-item__sub">{{ announcement.subtitle }}</div>
            </div>
            <span class="stack-item__meta">{{ announcement.date }}</span>
          </div>
          <div v-if="!announcements.length" class="dashboard-view__empty">No announcements are posted right now. New course updates will appear here automatically.</div>
        </div>
      </PanelCard>

      <PanelCard
        title="Calendar"
        subtitle="Your upcoming sessions and academic touchpoints."
        action-label="Open calendar"
        @action="$emit('navigate', 'calendar')"
      >
        <div class="calendar-strip">
          <div v-for="day in weekStrip" :key="`${day.label}-${day.number}`" :class="['calendar-strip__day', { 'is-active': day.active }]">
            <span>{{ day.label }}</span>
            <strong>{{ day.number }}</strong>
          </div>
        </div>
        <div class="dashboard-view__stack-list compact-list">
          <div v-for="event in calendarEvents" :key="event.id" class="stack-item stack-item--calendar">
            <div class="stack-item__time">{{ event.time }}</div>
            <div>
              <div class="stack-item__title">{{ event.title }}</div>
              <div class="stack-item__sub">{{ event.subtitle }}</div>
            </div>
          </div>
          <div v-if="!calendarEvents.length" class="dashboard-view__empty">No calendar items are scheduled yet. New lectures, deadlines, and sessions will show up here.</div>
        </div>
      </PanelCard>

      <PanelCard
        title="Progress"
        subtitle="A quick view of completed, active, and pending learning items."
      >
        <ProgressDonut
          :center-value="progressCenter"
          center-label="Overall Progress"
          :segments="progressSegments"
        />
      </PanelCard>
    </div>
  </section>
</template>

<script setup>
import { computed } from "vue";
import PanelCard from "./PanelCard.vue";
import CoursePreviewCard from "./CoursePreviewCard.vue";
import ProgressDonut from "./ProgressDonut.vue";

const props = defineProps({
  greeting: { type: String, required: true },
  courses: { type: Array, default: () => [] },
  todoItems: { type: Array, default: () => [] },
  announcements: { type: Array, default: () => [] },
  calendarEvents: { type: Array, default: () => [] },
  progressValue: { type: Number, default: 0 },
  progressSegments: { type: Array, default: () => [] },
});

defineEmits(["navigate", "open-course"]);

const progressCenter = computed(() => `${Math.round(Number(props.progressValue) || 0)}%`);

const weekStrip = computed(() => {
  const today = new Date();
  const anchor = props.calendarEvents[0]?.rawDate ? new Date(props.calendarEvents[0].rawDate) : today;
  const start = new Date(today);
  start.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return {
      label: day.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 3),
      number: day.getDate(),
      active: day.toDateString() === anchor.toDateString(),
    };
  });
});
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
  color: var(--accent-strong, #496A8A);
}

.dashboard-view__title {
  margin: 10px 0 0;
  font-size: 34px;
  line-height: 1.05;
  letter-spacing: -0.04em;
  color: var(--text-primary);
}

.dashboard-view__grid {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(0, 1fr);
  gap: 18px;
}

.panel-span-2 {
  grid-row: span 2;
}

.dashboard-view__course-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.dashboard-view__course-button {
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
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

.stack-item__time {
  min-width: 56px;
}

.badge-pill {
  padding: 8px 12px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}

.badge-pill--urgent {
  background: var(--status-danger-bg);
  color: var(--status-danger-text);
}

.badge-pill--soon {
  background: var(--status-warning-bg);
  color: var(--status-warning-text);
}

.badge-pill--calm {
  background: var(--status-success-bg);
  color: var(--status-success-text);
}

.badge-pill--neutral {
  background: var(--status-neutral-bg);
  color: var(--status-neutral-text);
}

.calendar-strip {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 14px;
}

.calendar-strip__day {
  padding: 12px 10px;
  border-radius: 18px;
  text-align: center;
  background: var(--surface-muted);
  border: var(--border-subtle);
}

.calendar-strip__day span {
  display: block;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-quiet);
}

.calendar-strip__day strong {
  display: block;
  margin-top: 8px;
  font-size: 16px;
  color: var(--text-primary);
}

.calendar-strip__day.is-active {
  background: var(--accent-soft);
  border-color: var(--accent-border);
}

.dashboard-view__empty {
  padding: 16px;
  border-radius: 18px;
  background: var(--surface-muted);
  color: var(--text-muted);
  font-size: 13px;
}

.compact-list .stack-item {
  padding-block: 12px;
}

@media (max-width: 1200px) {
  .dashboard-view__stats,
  .dashboard-view__course-grid,
  .dashboard-view__grid {
    grid-template-columns: 1fr 1fr;
  }

  .panel-span-2 {
    grid-column: 1 / -1;
    grid-row: auto;
  }
}

@media (max-width: 760px) {
  .dashboard-view__intro,
  .dashboard-view__stats,
  .dashboard-view__grid,
  .dashboard-view__course-grid {
    grid-template-columns: 1fr;
    display: grid;
  }

  .calendar-strip {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
</style>
