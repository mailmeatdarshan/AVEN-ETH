<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from "vue"
import rough from "roughjs"

const props = withDefaults(defineProps<{ stage?: number }>(), { stage: 0 })

const container = ref<HTMLElement | null>(null)
const svgEl = ref<SVGSVGElement | null>(null)

const STAGES = [
  {
    color: "#476BFF",
    fill: "rgba(71, 107, 255, 0.04)",
    tag: "STEP 1 · CLIENT DEPOSIT",
    tagColor: "#1E40AF",
    title: "1. Lock & Fund Escrow",
    points: [
      "Upfront Deposit: Client transfers USDC into non-custodial smart vault.",
      "0% Protocol Fee: 100% of client budget reserved strictly for developer.",
      "Deterministic ID: keccak256 hash binds client, freelancer & timestamp.",
    ],
  },
  {
    color: "#D97706",
    fill: "rgba(217, 119, 6, 0.04)",
    tag: "STEP 2 · CONTINUOUS STREAM",
    tagColor: "#92400E",
    title: "2. Stream & 75% Safety Cap",
    points: [
      "Per-Second Flow: 10¹⁸ Wei precision streams earnings in real time.",
      "75% Liquidity: Developer withdraws up to 75% for continuous cashflow.",
      "25% Collateral Locked: Last 25% held in escrow until milestone review.",
    ],
  },
  {
    color: "#8B5CF6",
    fill: "rgba(139, 92, 246, 0.04)",
    tag: "STEP 3 · FINAL APPROVAL",
    tagColor: "#5B21B6",
    title: "3. Signoff & EAS Attestation",
    points: [
      "Client Signoff: Client reviews deliverable & triggers milestone completion.",
      "Collateral Release: Smart contract transfers remaining 25% to freelancer.",
      "EAS Attestation: Mints immutable on-chain developer credibility score.",
    ],
  },
  {
    color: "#059669",
    fill: "rgba(5, 150, 105, 0.05)",
    tag: "PROTOCOL LIFECYCLE",
    tagColor: "#047857",
    title: "Autonomous & Non-Custodial",
    points: [
      "Full Lifecycle: Fund → Stream → Attest in 3 autonomous functions.",
      "Zero Middleman: Zero custody fees, zero payment delays.",
      "Battle-Tested: 30/30 automated Foundry tests passing.",
    ],
  },
]

function currentData() {
  const s = props.stage ?? 0
  if (s >= STAGES.length) return STAGES[STAGES.length - 1]
  return STAGES[s]
}

function draw() {
  const svg = svgEl.value
  const el = container.value
  if (!svg || !el) return
  const w = el.clientWidth
  const h = el.clientHeight
  if (!w || !h) return

  svg.setAttribute("viewBox", `0 0 ${w} ${h}`)
  while (svg.firstChild) svg.removeChild(svg.firstChild)

  const data = currentData()
  const rc = rough.svg(svg)

  svg.appendChild(
    rc.rectangle(4, 4, w - 8, h - 8, {
      roughness: 1.8,
      bowing: 1.8,
      strokeWidth: 2.2,
      stroke: data.color,
      fill: data.fill,
      fillStyle: "solid",
    })
  )

  svg.appendChild(
    rc.line(18, 54, Math.min(w - 20, 260), 52, {
      roughness: 1.6,
      bowing: 1.5,
      strokeWidth: 2.2,
      stroke: data.color,
    })
  )
}

let ro: ResizeObserver
onMounted(() => {
  nextTick(draw)
  ro = new ResizeObserver(() => draw())
  if (container.value) ro.observe(container.value)
})
onUnmounted(() => ro?.disconnect())
watch(() => props.stage, () => nextTick(draw))
</script>

<template>
  <div ref="container" class="rough-note-wrap">
    <svg ref="svgEl" class="rough-svg" />
    <div class="rough-content">
      <div class="rough-tag" :style="{ color: currentData().tagColor }">
        {{ currentData().tag }}
      </div>
      <h3 class="rough-title" :style="{ color: currentData().color }">
        {{ currentData().title }}
      </h3>
      <ul class="rough-points">
        <li v-for="(pt, idx) in currentData().points" :key="idx">
          <span class="point-bullet">✏️</span>
          <span>{{ pt }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.rough-note-wrap {
  position: relative;
  width: 100%;
  min-height: 260px;
  padding: 1.2rem 1.4rem;
  border-radius: 12px;
  background: #FFFFFF;
}

.rough-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.rough-content {
  position: relative;
  z-index: 2;
  font-family: 'Kalam', cursive;
}

.rough-tag {
  font-family: 'Geist Mono', monospace;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin-bottom: 0.25rem;
}

.rough-title {
  font-family: 'Kalam', cursive;
  font-size: 1.32rem;
  font-weight: 700;
  line-height: 1.15;
  margin-bottom: 0.85rem;
}

.rough-points {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.rough-points li {
  display: flex;
  align-items: flex-start;
  gap: 0.55rem;
  font-family: 'Kalam', cursive;
  font-size: 1.02rem;
  line-height: 1.38;
  color: #292524;
}

.point-bullet {
  font-size: 0.88rem;
  line-height: 1.5;
  flex-shrink: 0;
}
</style>
