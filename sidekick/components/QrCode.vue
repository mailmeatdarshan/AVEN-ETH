<script setup lang="ts">
import { computed } from "vue"
import qrcode from "qrcode-generator"

const props = withDefaults(defineProps<{
  url: string
  size?: number
  caption?: string
}>(), { size: 120 })

const QUIET = 4
const INK = "#2B2620"

const qr = computed(() => {
  const c = qrcode(0, "M")
  c.addData(props.url)
  c.make()
  return c
})

const count = computed(() => qr.value.getModuleCount())
const span = computed(() => count.value + QUIET * 2)

const path = computed(() => {
  const c = qr.value, n = count.value
  let d = ""
  for (let r = 0; r < n; r++) {
    for (let col = 0; col < n; col++) {
      if (c.isDark(r, col)) d += `M${col + QUIET} ${r + QUIET}h1v1h-1z`
    }
  }
  return d
})
</script>

<template>
  <div class="qr">
    <svg :viewBox="`0 0 ${span} ${span}`" :width="size" :height="size" shape-rendering="crispEdges">
      <rect :width="span" :height="span" fill="#fff" />
      <path :d="path" :fill="INK" />
    </svg>
    <span v-if="caption" class="qr-cap">{{ caption }}</span>
  </div>
</template>

<style scoped>
.qr { display: inline-flex; flex-direction: column; align-items: center; gap: 0.45rem; }
.qr svg {
  display: block; border-radius: 8px;
  border: 1px solid var(--border, #E7E0D4);
  background: #fff;
}
.qr-cap {
  font-size: 0.7rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.09em; color: var(--ink-dim, #7A7165);
}
</style>
