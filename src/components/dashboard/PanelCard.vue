<template>
  <section class="panel-card">
    <header v-if="title || subtitle || actionLabel || $slots.header" class="panel-card__header">
      <slot name="header">
        <div>
          <div v-if="eyebrow" class="panel-card__eyebrow">{{ eyebrow }}</div>
          <h3 v-if="title" class="panel-card__title">{{ title }}</h3>
          <p v-if="subtitle" class="panel-card__subtitle">{{ subtitle }}</p>
        </div>
        <button v-if="actionLabel" class="panel-card__action" type="button" @click="$emit('action')">
          {{ actionLabel }}
        </button>
      </slot>
    </header>
    <div class="panel-card__body">
      <slot />
    </div>
  </section>
</template>

<script setup>
defineEmits(['action']);
defineProps({
  eyebrow: { type: String, default: '' },
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  actionLabel: { type: String, default: '' },
});
</script>

<style scoped>
.panel-card {
  background: var(--surface-card);
  border-radius: 24px;
  border: var(--border-subtle);
  box-shadow: var(--shadow-soft);
  padding: 20px 20px 18px;
}

.panel-card__header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 16px;
}

.panel-card__eyebrow {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 6px;
}

.panel-card__title {
  margin: 0;
  font-size: 17px;
  line-height: 1.2;
  font-weight: 700;
  color: var(--text-primary);
}

.panel-card__subtitle {
  margin: 6px 0 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--text-muted);
}

.panel-card__action {
  border: none;
  background: transparent;
  color: var(--accent-strong, #496A8A);
  font-weight: 600;
  font-size: 12px;
  cursor: pointer;
  padding: 0;
}

.panel-card__body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
</style>
