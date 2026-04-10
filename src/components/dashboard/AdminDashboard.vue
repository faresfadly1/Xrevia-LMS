<template>
  <section class="dashboard-view admin-view">
    <div class="dashboard-view__intro">
      <div>
        <div class="dashboard-view__eyebrow">Admin View</div>
        <h1 class="dashboard-view__title">{{ heading }}</h1>
        <p class="dashboard-view__subtitle">{{ subtitle }}</p>
      </div>
      <div class="dashboard-view__badge">University control center</div>
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

    <div class="admin-view__grid">
      <PanelCard
        class="admin-view__analytics"
        eyebrow="Analytics"
        title="Platform Health"
        subtitle="A premium operational snapshot of the university LMS at a glance."
      >
        <div class="admin-view__analytics-grid">
          <div v-for="item in analytics" :key="item.label" class="admin-analytics-card">
            <div class="admin-analytics-card__icon"><i :class="item.icon"></i></div>
            <div class="admin-analytics-card__value">{{ item.value }}</div>
            <div class="admin-analytics-card__label">{{ item.label }}</div>
            <div class="admin-analytics-card__delta">{{ item.delta }}</div>
          </div>
        </div>
      </PanelCard>

      <PanelCard
        title="Recent Registrations"
        subtitle="Recently added students and their academic placement."
        action-label="View all"
        @action="$emit('navigate', 'users')"
      >
        <div class="admin-view__stack-list">
          <div v-for="row in recentRegistrations" :key="row.id" class="admin-list-row">
            <div class="admin-list-row__avatar">{{ row.initials }}</div>
            <div>
              <div class="admin-list-row__title">{{ row.name }}</div>
              <div class="admin-list-row__sub">{{ row.subtitle }}</div>
            </div>
            <span class="admin-list-row__meta">{{ row.meta }}</span>
          </div>
          <div v-if="!recentRegistrations.length" class="dashboard-view__empty">No recent registrations are visible yet. New student accounts will appear here as soon as they are added.</div>
        </div>
      </PanelCard>

      <PanelCard
        title="System Activity"
        subtitle="Recent actions happening across the academic platform."
        action-label="View all"
        @action="$emit('navigate', 'analytics')"
      >
        <div class="admin-view__stack-list">
          <div v-for="item in systemActivity" :key="item.id" class="activity-row">
            <div class="activity-row__status"></div>
            <div>
              <div class="admin-list-row__title">{{ item.title }}</div>
              <div class="admin-list-row__sub">{{ item.subtitle }}</div>
            </div>
            <span class="admin-list-row__meta">{{ item.meta }}</span>
          </div>
          <div v-if="!systemActivity.length" class="dashboard-view__empty">No system events are visible yet. Course updates, submissions, and announcements will surface here automatically.</div>
        </div>
      </PanelCard>

      <PanelCard
        class="admin-view__reports"
        title="Reports Overview"
        subtitle="High-level reporting across enrollment, completion, attendance, and satisfaction."
      >
        <div class="report-bars">
          <div v-for="bar in reportBars" :key="bar.label" class="report-bars__item">
            <div class="report-bars__track">
              <span :style="{ height: `${bar.value}%` }"></span>
            </div>
            <strong>{{ bar.value }}%</strong>
            <small>{{ bar.label }}</small>
          </div>
        </div>
      </PanelCard>

      <PanelCard title="Quick Actions" subtitle="Jump into the main administrative workflows instantly.">
        <div class="admin-actions">
          <button type="button" class="admin-action-btn" @click="$emit('quick-action', 'add-user')">
            <i class="fas fa-user-plus"></i>
            <span>Add New User</span>
          </button>
          <button type="button" class="admin-action-btn" @click="$emit('quick-action', 'create-course')">
            <i class="fas fa-book-medical"></i>
            <span>Create Course</span>
          </button>
          <button type="button" class="admin-action-btn" @click="$emit('quick-action', 'manage-departments')">
            <i class="fas fa-building"></i>
            <span>Manage Departments</span>
          </button>
          <button type="button" class="admin-action-btn" @click="$emit('quick-action', 'generate-report')">
            <i class="fas fa-chart-pie"></i>
            <span>Generate Report</span>
          </button>
        </div>
      </PanelCard>
    </div>
  </section>
</template>

<script setup>
import StatCard from "./StatCard.vue";
import PanelCard from "./PanelCard.vue";

defineProps({
  heading: { type: String, required: true },
  subtitle: { type: String, default: "" },
  stats: { type: Array, default: () => [] },
  analytics: { type: Array, default: () => [] },
  recentRegistrations: { type: Array, default: () => [] },
  systemActivity: { type: Array, default: () => [] },
  reportBars: { type: Array, default: () => [] },
});

defineEmits(["navigate", "quick-action"]);
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
  color: var(--accent-strong, #5F7D68);
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
  color: var(--accent-strong, #5F7D68);
  font-size: 12px;
  font-weight: 700;
}

.dashboard-view__stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.admin-view__grid {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
  gap: 18px;
}

.admin-view__analytics {
  grid-column: 1 / -1;
}

.admin-view__reports {
  min-height: 100%;
}

.admin-view__analytics-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.admin-analytics-card {
  padding: 16px;
  border-radius: 20px;
  background: linear-gradient(180deg, var(--tone-green-bg-start) 0%, var(--tone-green-bg-end) 100%);
  border: var(--border-subtle);
}

.admin-analytics-card__icon {
  width: 44px;
  height: 44px;
  border-radius: 15px;
  display: grid;
  place-items: center;
  background: var(--accent-soft);
  color: var(--accent-strong);
  font-size: 17px;
}

.admin-analytics-card__value {
  margin-top: 14px;
  font-size: 26px;
  font-weight: 700;
  color: var(--text-primary);
}

.admin-analytics-card__label {
  margin-top: 4px;
  font-size: 12px;
  font-weight: 700;
  color: var(--text-secondary);
}

.admin-analytics-card__delta {
  margin-top: 6px;
  font-size: 11px;
  color: var(--accent-strong);
}

.admin-view__stack-list {
  display: grid;
  gap: 12px;
}

.admin-list-row,
.activity-row {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 18px;
  background: var(--surface-muted);
  border: var(--border-subtle);
}

.admin-list-row__avatar {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: var(--accent-soft);
  color: var(--accent-strong);
  font-weight: 800;
  font-size: 13px;
}

.admin-list-row__title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
}

.admin-list-row__sub {
  margin-top: 4px;
  font-size: 12px;
  color: var(--text-secondary);
}

.admin-list-row__meta {
  font-size: 11px;
  color: var(--text-quiet);
  font-weight: 600;
}

.activity-row__status {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: linear-gradient(180deg, var(--accent-tint) 0%, var(--accent-strong) 100%);
  box-shadow: 0 0 0 5px var(--accent-soft);
}

.report-bars {
  height: 100%;
  display: flex;
  align-items: end;
  gap: 18px;
  min-height: 260px;
}

.report-bars__item {
  flex: 1;
  display: grid;
  justify-items: center;
  gap: 10px;
}

.report-bars__track {
  width: 58px;
  height: 180px;
  border-radius: 999px;
  background: var(--surface-quiet);
  display: flex;
  align-items: end;
  padding: 8px;
}

.report-bars__track span {
  width: 100%;
  border-radius: inherit;
  background: linear-gradient(180deg, var(--accent-tint) 0%, var(--accent-strong) 100%);
}

.report-bars__item strong {
  font-size: 16px;
  color: var(--text-primary);
}

.report-bars__item small {
  font-size: 11px;
  color: var(--text-secondary);
  text-align: center;
}

.admin-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.admin-action-btn {
  border: none;
  border-radius: 18px;
  padding: 16px;
  background: linear-gradient(180deg, var(--tone-green-bg-start) 0%, var(--tone-green-bg-end) 100%);
  color: var(--accent-strong);
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: inset 0 0 0 1px var(--accent-border);
}

.admin-action-btn i {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: grid;
  place-items: center;
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
  .admin-view__grid,
  .admin-view__analytics-grid,
  .admin-actions {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 760px) {
  .dashboard-view__intro,
  .dashboard-view__stats,
  .admin-view__grid,
  .admin-view__analytics-grid,
  .admin-actions {
    grid-template-columns: 1fr;
    display: grid;
  }
}
</style>
