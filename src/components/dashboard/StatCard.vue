<template>
  <article :class="['stat-widget', `tone-${tone}`]">
    <div class="stat-widget__icon"><i :class="icon"></i></div>
    <div class="stat-widget__content">
      <div class="stat-widget__value">{{ value }}</div>
      <div class="stat-widget__label">{{ label }}</div>
      <div class="stat-widget__sub">{{ sub }}</div>
    </div>
  </article>
</template>

<script setup>
defineProps({
  icon: { type: String, default: 'fas fa-chart-line' },
  label: { type: String, required: true },
  value: { type: [String, Number], required: true },
  sub: { type: String, default: '' },
  tone: { type: String, default: 'blue' },
});
</script>

<style scoped>
.stat-widget {
  min-height: 112px;
  border-radius: 22px;
  padding: 18px 18px 16px;
  display: grid;
  grid-template-columns: 46px 1fr;
  gap: 14px;
  align-items: start;
  border: var(--border-subtle);
  box-shadow: var(--shadow-soft);
}

.stat-widget__icon {
  width: 46px;
  height: 46px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  font-size: 17px;
}

.stat-widget__value {
  font-size: 29px;
  font-weight: 700;
  line-height: 1;
  color: var(--text-primary);
  margin-bottom: 6px;
}

.stat-widget__label {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-secondary);
}

.stat-widget__sub {
  margin-top: 5px;
  font-size: 11px;
  color: var(--text-muted);
  line-height: 1.5;
}

.tone-blue {
  background: linear-gradient(180deg, var(--tone-blue-bg-start) 0%, var(--tone-blue-bg-end) 100%);
}
.tone-blue .stat-widget__icon {
  background: var(--tone-blue-icon-bg);
  color: var(--tone-blue-icon);
}

.tone-cyan {
  background: linear-gradient(180deg, var(--tone-cyan-bg-start) 0%, var(--tone-cyan-bg-end) 100%);
}
.tone-cyan .stat-widget__icon {
  background: var(--tone-cyan-icon-bg);
  color: var(--tone-cyan-icon);
}

.tone-gold {
  background: linear-gradient(180deg, var(--tone-gold-bg-start) 0%, var(--tone-gold-bg-end) 100%);
}
.tone-gold .stat-widget__icon {
  background: var(--tone-gold-icon-bg);
  color: var(--tone-gold-icon);
}

.tone-violet {
  background: linear-gradient(180deg, var(--tone-violet-bg-start) 0%, var(--tone-violet-bg-end) 100%);
}
.tone-violet .stat-widget__icon {
  background: var(--tone-violet-icon-bg);
  color: var(--tone-violet-icon);
}

.tone-green {
  background: linear-gradient(180deg, var(--tone-green-bg-start) 0%, var(--tone-green-bg-end) 100%);
}
.tone-green .stat-widget__icon {
  background: var(--tone-green-icon-bg);
  color: var(--tone-green-icon);
}
</style>
