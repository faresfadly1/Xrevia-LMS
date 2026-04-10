<template>
  <div class="demo-login" :class="`demo-login--${themeMode}`">
    <div class="demo-login__panel">
      <header class="demo-login__header">
        <div class="demo-login__brand">
          <img :src="logoUrl" alt="Xrevia University" class="demo-login__logo" />
          <div>
            <div class="demo-login__title">XREVIA UNIVERSITY</div>
            <div class="demo-login__subtitle">Interactive LMS Demo</div>
          </div>
        </div>

        <button type="button" class="demo-login__theme" @click="$emit('toggle-theme')">
          <i :class="themeMode === 'dark' ? 'fas fa-sun' : 'far fa-moon'"></i>
          <span>{{ themeMode === "dark" ? "Light mode" : "Dark mode" }}</span>
        </button>
      </header>

      <section class="demo-login__hero">
        <div>
          <p class="demo-login__eyebrow">Role-Based Access</p>
          <h1>Choose a university account and we’ll open the right LMS experience.</h1>
          <p class="demo-login__copy">
            This GitHub Pages version is a self-contained demo, so logout returns you here and you can jump between student,
            teacher, and admin users anytime.
          </p>
        </div>
        <div class="demo-login__pill">No backend login required</div>
      </section>

      <div class="demo-login__groups">
        <section v-for="group in accountGroups" :key="group.key" class="demo-login__group">
          <div class="demo-login__group-head">
            <div>
              <p class="demo-login__group-label">{{ group.label }}</p>
              <h2>{{ group.heading }}</h2>
            </div>
            <span>{{ group.accounts.length }} account{{ group.accounts.length === 1 ? "" : "s" }}</span>
          </div>

          <div class="demo-login__grid">
            <button
              v-for="account in group.accounts"
              :key="account.id"
              type="button"
              class="demo-login__card"
              :disabled="submitting"
              @click="$emit('login', account.id)"
            >
              <div class="demo-login__card-top">
                <div class="demo-login__avatar">
                  <img v-if="account.avatarUrl" :src="account.avatarUrl" :alt="account.name" />
                  <span v-else>{{ account.initials }}</span>
                </div>
                <div class="demo-login__meta">
                  <strong>{{ account.name }}</strong>
                  <small>{{ account.roleLabel }}</small>
                </div>
                <span class="demo-login__badge">{{ account.badge }}</span>
              </div>

              <p class="demo-login__summary">{{ account.summary }}</p>
              <p class="demo-login__email">{{ account.email }}</p>

              <div class="demo-login__cta">
                <span>{{ submitting ? "Opening..." : "Enter dashboard" }}</span>
                <i class="fas fa-arrow-right"></i>
              </div>
            </button>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import logoUrl from "../assets/logo.png";

const props = defineProps({
  accounts: {
    type: Array,
    default: () => [],
  },
  submitting: {
    type: Boolean,
    default: false,
  },
  themeMode: {
    type: String,
    default: "light",
  },
});

defineEmits(["login", "toggle-theme"]);

const ACCOUNT_GROUPS = [
  { key: "student", label: "Student View", heading: "Student Accounts" },
  { key: "teacher", label: "Teacher View", heading: "Faculty Accounts" },
  { key: "admin", label: "Admin View", heading: "Administrative Accounts" },
];

const accountGroups = computed(() =>
  ACCOUNT_GROUPS.map((group) => ({
    ...group,
    accounts: props.accounts.filter((account) => account.role === group.key),
  })).filter((group) => group.accounts.length),
);
</script>

<style scoped>
.demo-login {
  min-height: 100vh;
  padding: 36px;
  background:
    radial-gradient(circle at top left, rgba(89, 112, 141, 0.12), transparent 32%),
    radial-gradient(circle at top right, rgba(160, 122, 61, 0.12), transparent 24%),
    linear-gradient(180deg, #f7f5f1 0%, #faf8f4 100%);
  color: #2b2b2b;
}

.demo-login--dark {
  background:
    radial-gradient(circle at top left, rgba(92, 124, 167, 0.18), transparent 28%),
    radial-gradient(circle at top right, rgba(176, 138, 71, 0.16), transparent 22%),
    linear-gradient(180deg, #151311 0%, #1d1a17 100%);
  color: #f6efe3;
}

.demo-login__panel {
  max-width: 1240px;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 32px;
  box-shadow: 0 28px 70px rgba(30, 26, 23, 0.12);
  backdrop-filter: blur(24px);
  padding: 28px;
}

.demo-login--dark .demo-login__panel {
  background: rgba(28, 24, 20, 0.92);
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: 0 32px 80px rgba(0, 0, 0, 0.34);
}

.demo-login__header,
.demo-login__hero,
.demo-login__group-head,
.demo-login__card-top,
.demo-login__cta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.demo-login__brand {
  display: flex;
  align-items: center;
  gap: 14px;
}

.demo-login__logo {
  width: 54px;
  height: 54px;
  border-radius: 16px;
  object-fit: cover;
  box-shadow: 0 10px 24px rgba(11, 29, 54, 0.18);
}

.demo-login__title {
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.demo-login__subtitle,
.demo-login__copy,
.demo-login__summary,
.demo-login__email,
.demo-login__group-head span,
.demo-login__meta small {
  color: #7a766f;
}

.demo-login--dark .demo-login__subtitle,
.demo-login--dark .demo-login__copy,
.demo-login--dark .demo-login__summary,
.demo-login--dark .demo-login__email,
.demo-login--dark .demo-login__group-head span,
.demo-login--dark .demo-login__meta small {
  color: #c0b8ad;
}

.demo-login__theme {
  border: 1px solid rgba(49, 78, 110, 0.14);
  background: rgba(255, 255, 255, 0.8);
  color: #314e6e;
  border-radius: 999px;
  padding: 10px 14px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  cursor: pointer;
}

.demo-login--dark .demo-login__theme {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.08);
  color: #f6efe3;
}

.demo-login__hero {
  margin-top: 28px;
  padding: 24px 26px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.94), rgba(252, 251, 248, 0.94));
  border: 1px solid rgba(49, 78, 110, 0.08);
  border-radius: 28px;
  align-items: flex-start;
}

.demo-login--dark .demo-login__hero {
  background: linear-gradient(135deg, rgba(34, 29, 25, 0.98), rgba(28, 24, 20, 0.96));
  border-color: rgba(255, 255, 255, 0.06);
}

.demo-login__eyebrow,
.demo-login__group-label {
  margin: 0 0 10px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #8a6a38;
}

.demo-login h1,
.demo-login h2 {
  margin: 0;
}

.demo-login h1 {
  max-width: 680px;
  font-size: clamp(2rem, 4vw, 3rem);
  line-height: 1.08;
}

.demo-login__copy {
  max-width: 640px;
  margin: 14px 0 0;
  font-size: 15px;
  line-height: 1.6;
}

.demo-login__pill,
.demo-login__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 700;
}

.demo-login__pill {
  background: rgba(11, 29, 54, 0.06);
  color: #314e6e;
  white-space: nowrap;
}

.demo-login--dark .demo-login__pill {
  background: rgba(255, 255, 255, 0.06);
  color: #f1e4c8;
}

.demo-login__groups {
  margin-top: 28px;
  display: grid;
  gap: 22px;
}

.demo-login__group {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(49, 78, 110, 0.08);
  border-radius: 28px;
  padding: 22px;
}

.demo-login--dark .demo-login__group {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.05);
}

.demo-login__grid {
  margin-top: 18px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.demo-login__card {
  width: 100%;
  border: 1px solid rgba(49, 78, 110, 0.1);
  background: linear-gradient(180deg, #ffffff 0%, #fcfbf8 100%);
  border-radius: 24px;
  padding: 18px;
  text-align: left;
  cursor: pointer;
  display: grid;
  gap: 14px;
  box-shadow: 0 16px 34px rgba(20, 44, 77, 0.08);
}

.demo-login__card:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 22px 42px rgba(20, 44, 77, 0.12);
  border-color: rgba(49, 78, 110, 0.22);
}

.demo-login__card:disabled {
  cursor: progress;
  opacity: 0.7;
}

.demo-login--dark .demo-login__card {
  background: linear-gradient(180deg, rgba(41, 35, 30, 0.98) 0%, rgba(30, 26, 22, 0.98) 100%);
  border-color: rgba(255, 255, 255, 0.06);
  box-shadow: 0 22px 44px rgba(0, 0, 0, 0.24);
}

.demo-login__avatar {
  width: 46px;
  height: 46px;
  border-radius: 16px;
  background: rgba(11, 29, 54, 0.1);
  color: #0b1d36;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  overflow: hidden;
  flex: 0 0 auto;
}

.demo-login__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.demo-login--dark .demo-login__avatar {
  background: rgba(255, 255, 255, 0.08);
  color: #f6efe3;
}

.demo-login__meta {
  display: grid;
  gap: 4px;
  min-width: 0;
  flex: 1;
}

.demo-login__meta strong {
  font-size: 16px;
}

.demo-login__badge {
  background: rgba(95, 125, 104, 0.1);
  color: #5f7d68;
  max-width: 128px;
  text-align: center;
}

.demo-login--dark .demo-login__badge {
  background: rgba(176, 138, 71, 0.12);
  color: #f1d7a4;
}

.demo-login__summary,
.demo-login__email {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
}

.demo-login__email {
  font-weight: 600;
}

.demo-login__cta {
  color: #314e6e;
  font-size: 13px;
  font-weight: 700;
}

.demo-login--dark .demo-login__cta {
  color: #f1d7a4;
}

@media (max-width: 900px) {
  .demo-login {
    padding: 18px;
  }

  .demo-login__panel {
    padding: 18px;
    border-radius: 24px;
  }

  .demo-login__header,
  .demo-login__hero,
  .demo-login__group-head,
  .demo-login__card-top {
    flex-direction: column;
    align-items: flex-start;
  }

  .demo-login__badge,
  .demo-login__pill {
    white-space: normal;
  }
}
</style>
