<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from "vue"
import rough from "roughjs"

defineProps<{ kicker?: string; title: string; art?: string }>()

const svgEl = ref<SVGSVGElement | null>(null)
const titleEl = ref<HTMLElement | null>(null)

const SAPPHIRE = "#476BFF", MINT = "#53DFA9"
const RULE_H = 24

function draw() {
  const svg = svgEl.value, t = titleEl.value
  if (!svg || !t) return
  const w = t.offsetWidth
  if (!w) return
  svg.setAttribute("viewBox", `0 0 ${w} ${RULE_H}`)
  svg.style.width = w + "px"
  while (svg.firstChild) svg.removeChild(svg.firstChild)
  const rc = rough.svg(svg)
  svg.appendChild(rc.line(3, 9, w - 4, 7, {
    roughness: 1.9, bowing: 2.2, strokeWidth: 4, stroke: SAPPHIRE,
  }))
  svg.appendChild(rc.line(12, 17, w * 0.64, 15, {
    roughness: 2.2, bowing: 3, strokeWidth: 2.4, stroke: MINT,
  }))
}

let ro: ResizeObserver
onMounted(() => {
  nextTick(draw)
  ro = new ResizeObserver(() => draw())
  if (titleEl.value) ro.observe(titleEl.value)
})
onUnmounted(() => ro?.disconnect())
</script>

<template>
  <div class="sc">
    <div class="sc-body">
      <div v-if="kicker" class="sc-kicker">{{ kicker }}</div>
      <h1 ref="titleEl" class="sc-title">{{ title }}</h1>
      <svg ref="svgEl" class="sc-rule" :height="RULE_H" />
      <div v-if="$slots.default" class="sc-teaser"><slot /></div>
    </div>
    <img v-if="art" :src="art" class="sc-art" />
  </div>
</template>

<style scoped>
.sc {
  display: flex; align-items: center; justify-content: center; gap: 3rem;
  width: 100%;
}
.sc-body { text-align: left; }

.sc-kicker {
  font-family: "Geist Mono", monospace; font-size: 0.85rem; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.16em;
  color: var(--sapphire, #476BFF); margin-bottom: 0.9rem;
}
.sc-title {
  display: inline-block;
  font-family: "Source Serif 4", Georgia, serif;
  font-size: 3.1rem; line-height: 1.06; margin: 0;
  max-width: 17ch; color: var(--ink, #2B2620);
}
.sc-rule { display: block; margin-top: 0.35rem; overflow: visible; }

.sc-teaser { margin-top: 1.9rem; }
.sc-teaser:empty { display: none; }

.sc-art { width: 200px; height: auto; flex-shrink: 0; opacity: 0.92; }
</style>
