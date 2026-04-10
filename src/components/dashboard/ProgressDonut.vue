<template>
  <div class="progress-donut-wrap">
    <div class="progress-donut" :style="{ background: donutBackground }">
      <div class="progress-donut__inner">
        <strong>{{ centerValue }}</strong>
        <span>{{ centerLabel }}</span>
      </div>
    </div>
    <div class="progress-donut__legend">
      <div v-for="segment in segments" :key="segment.label" class="progress-donut__legend-row">
        <span class="progress-donut__dot" :style="{ background: segment.color }"></span>
        <span>{{ segment.label }}</span>
        <strong>{{ segment.value }}</strong>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  centerValue: { type: String, default: '0%' },
  centerLabel: { type: String, default: 'Overall Progress' },
  segments: {
    type: Array,
    default: () => [],
  },
});

const donutBackground = computed(() => {
  const total = props.segments.reduce((sum, segment) => sum + (Number(segment.value) || 0), 0);
  if (!total) {
    return 'conic-gradient(var(--surface-quiet) 0deg 360deg)';
  }
  let cursor = 0;
  const parts = props.segments.map((segment) => {
    const portion = ((Number(segment.value) || 0) / total) * 360;
    const start = cursor;
    const end = cursor + portion;
    cursor = end;
    return `${segment.color} ${start}deg ${end}deg`;
  });
  return `conic-gradient(${parts.join(', ')})`;
});
</script>

<style scoped>
.progress-donut-wrap {
  display: grid;
  grid-template-columns: 168px 1fr;
  gap: 18px;
  align-items: center;
}

.progress-donut {
  width: 168px;
  height: 168px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  padding: 14px;
}

.progress-donut__inner {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: var(--surface-card);
  display: grid;
  place-items: center;
  text-align: center;
  box-shadow: inset 0 0 0 1px rgba(122, 118, 111, 0.12);
}

.progress-donut__inner strong {
  display: block;
  font-size: 32px;
  color: var(--text-primary);
  line-height: 1;
}

.progress-donut__inner span {
  margin-top: 4px;
  font-size: 11px;
  color: var(--text-muted);
}

.progress-donut__legend {
  display: grid;
  gap: 12px;
}

.progress-donut__legend-row {
  display: grid;
  grid-template-columns: 12px 1fr auto;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: var(--text-secondary);
}

.progress-donut__legend-row strong {
  color: var(--text-primary);
}

.progress-donut__dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

@media (max-width: 880px) {
  .progress-donut-wrap {
    grid-template-columns: 1fr;
    justify-items: center;
  }
}
</style>
