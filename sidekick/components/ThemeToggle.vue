<script setup lang="ts">
import { ref, onMounted } from 'vue'

const isDark = ref(false)

function applyTheme(dark: boolean) {
  isDark.value = dark
  if (typeof document !== 'undefined') {
    const html = document.documentElement
    if (dark) {
      html.classList.add('dark')
      html.classList.remove('light')
      try { localStorage.setItem('slidev-color-schema', 'dark') } catch (e) {}
    } else {
      html.classList.remove('dark')
      html.classList.add('light')
      try { localStorage.setItem('slidev-color-schema', 'light') } catch (e) {}
    }
  }
}

function toggleTheme(e: MouseEvent) {
  e.stopPropagation()
  applyTheme(!isDark.value)
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('slidev-color-schema')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const initialDark = stored === 'dark' || (!stored && prefersDark) || document.documentElement.classList.contains('dark')
    applyTheme(initialDark)

    const observer = new MutationObserver(() => {
      const currentDark = document.documentElement.classList.contains('dark')
      if (isDark.value !== currentDark) {
        isDark.value = currentDark
      }
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  }
})
</script>

<template>
  <button
    type="button"
    @click="toggleTheme"
    class="theme-toggle-badge"
    :title="isDark ? 'Switch to Light mode' : 'Switch to Dark mode'"
    :aria-label="isDark ? 'Switch to Light mode' : 'Switch to Dark mode'"
  >
    <!-- Sun Icon (Active in Dark mode) -->
    <svg
      v-if="isDark"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2.2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="icon sun-icon"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>

    <!-- Moon Icon (Active in Light mode) -->
    <svg
      v-else
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2.2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="icon moon-icon"
    >
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>

    <span class="label font-mono">
      {{ isDark ? 'DARK' : 'LIGHT' }}
    </span>
  </button>
</template>

<style scoped>
.theme-toggle-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.32rem 0.75rem;
  border-radius: 9999px;
  background: var(--surface, #ffffff);
  border: 1.5px solid var(--border, #e5e7eb);
  color: var(--ink, #1f2937);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  pointer-events: auto;
  user-select: none;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.theme-toggle-badge:hover {
  transform: translateY(-1px) scale(1.03);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.16);
  border-color: var(--sapphire, #476bff);
}

.theme-toggle-badge:active {
  transform: translateY(0) scale(0.95);
}

.icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.sun-icon {
  color: #fbbf24;
}

.moon-icon {
  color: #4b5563;
}

.label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--ink-dim, #6b7280);
}
</style>
