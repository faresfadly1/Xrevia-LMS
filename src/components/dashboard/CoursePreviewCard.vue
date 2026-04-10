<template>
  <article :class="['course-preview', compact ? 'compact' : '', `tone-${tone}`]">
    <div class="course-preview__banner">
      <div class="course-preview__icon"><i :class="icon"></i></div>
      <span class="course-preview__badge">{{ badge }}</span>
    </div>
    <div class="course-preview__content">
      <div class="course-preview__meta">{{ code }}</div>
      <h4 class="course-preview__title">{{ title }}</h4>
      <p class="course-preview__subtitle">{{ subtitle }}</p>
      <div v-if="detailRows.length" class="course-preview__details">
        <div v-for="row in detailRows" :key="row.label" class="course-preview__detail">
          <span>{{ row.label }}</span>
          <strong>{{ row.value }}</strong>
        </div>
      </div>
      <div v-if="showProgress" class="course-preview__progress">
        <div class="course-preview__progress-bar"><span :style="{ width: `${Math.max(0, Math.min(progress, 100))}%` }"></span></div>
        <div class="course-preview__progress-text">{{ progressLabel }}</div>
      </div>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  title: { type: String, required: true },
  code: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  badge: { type: String, default: '' },
  tone: { type: String, default: 'blue' },
  icon: { type: String, default: 'fas fa-book-open' },
  detailRows: { type: Array, default: () => [] },
  progress: { type: Number, default: 0 },
  progressLabel: { type: String, default: '' },
  showProgress: { type: Boolean, default: true },
  compact: { type: Boolean, default: false },
});

const progress = computed(() => Number(props.progress) || 0);
</script>

<style scoped>
.course-preview {
  background: var(--surface-card);
  border: var(--border-subtle);
  border-radius: 24px;
  overflow: hidden;
  box-shadow: var(--shadow-soft);
}

.course-preview__banner {
  min-height: 92px;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.course-preview__icon {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: var(--overlay-icon-bg);
  color: #ffffff;
  font-size: 18px;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.14);
}

.course-preview__badge {
  padding: 7px 12px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  color: #ffffff;
  background: var(--overlay-badge-bg);
  backdrop-filter: blur(6px);
}

.course-preview__content {
  padding: 18px 18px 20px;
}

.course-preview__meta {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 8px;
}

.course-preview__title {
  margin: 0;
  font-size: 18px;
  line-height: 1.25;
  font-weight: 700;
  color: var(--text-primary);
}

.course-preview__subtitle {
  margin: 8px 0 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--text-secondary);
}

.course-preview__details {
  display: grid;
  gap: 8px;
  margin-top: 16px;
}

.course-preview__detail {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 12px;
  color: var(--text-secondary);
}

.course-preview__detail strong {
  color: var(--text-primary);
  font-weight: 600;
}

.course-preview__progress {
  margin-top: 18px;
}

.course-preview__progress-bar {
  height: 8px;
  border-radius: 999px;
  background: var(--surface-quiet);
  overflow: hidden;
}

.course-preview__progress-bar span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--accent-strong, #496A8A), var(--accent-tint, #6f88a1));
}

.course-preview__progress-text {
  margin-top: 9px;
  font-size: 11px;
  color: var(--text-muted);
}

.compact .course-preview__banner {
  min-height: 76px;
  padding: 14px;
}

.compact .course-preview__content {
  padding: 16px 16px 18px;
}

.compact .course-preview__title {
  font-size: 15px;
}

.tone-blue .course-preview__banner {
  background: linear-gradient(135deg, var(--course-blue-start) 0%, var(--course-blue-end) 100%);
}

.tone-violet .course-preview__banner {
  background: linear-gradient(135deg, var(--course-violet-start) 0%, var(--course-violet-end) 100%);
}

.tone-green .course-preview__banner {
  background: linear-gradient(135deg, var(--course-green-start) 0%, var(--course-green-end) 100%);
}

.tone-gold .course-preview__banner {
  background: linear-gradient(135deg, var(--course-gold-start) 0%, var(--course-gold-end) 100%);
}
</style>
