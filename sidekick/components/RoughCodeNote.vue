<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from "vue"
import rough from "roughjs"

const props = withDefaults(defineProps<{ stage?: number }>(), { stage: 0 })

const container = ref<HTMLElement | null>(null)
const svgEl = ref<SVGSVGElement | null>(null)

const STAGES = [
  {
    // Stage 0: All lines / Overview
    color: "#476BFF",
    fill: "rgba(71, 107, 255, 0.04)",
    tag: "OVERVIEW · PULL MODEL",
    tagColor: "#1E40AF",
    title: "claimStream Architecture",
    points: [
      "Developer Pull Model: Freelancer triggers claims on demand without client intervention.",
      "75% Dynamic Safety Cap: Max 75% unlocked during active development phase.",
      "Atomic Security: Enforces OpenZeppelin reentrancy guard & strict CEI pattern.",
    ],
  },
  {
    // Stage 1 (Click 1: Lines 2-5)
    color: "#D97706",
    fill: "rgba(217, 119, 6, 0.04)",
    tag: "LINES 2–5 · ACCESS & MUTEX",
    tagColor: "#92400E",
    title: "1. Access Control & Mutex",
    points: [
      "onlyFreelancer(id): Restricts withdrawals strictly to the verified developer.",
      "nonReentrant: OpenZeppelin mutex prevents recursive siphon attacks.",
      "Zero Unauthorized Access: Rejects any caller whose address doesn't match the stream.",
    ],
  },
  {
    // Stage 2 (Click 2: Lines 7-8)
    color: "#059669",
    fill: "rgba(5, 150, 105, 0.04)",
    tag: "LINES 7–8 · FLOW ACCRUAL",
    tagColor: "#047857",
    title: "2. Real-Time Wei Accrual",
    points: [
      "calculateEarned(id): Computes accrued earnings down to the second via 10¹⁸ Wei.",
      "Pause-Aware: Skips paused intervals so clients pay only for active work.",
      "Zero-Dust Precision: Integer math prevents EVM division truncation loss.",
    ],
  },
  {
    // Stage 3 (Click 3: Lines 10-16)
    color: "#476BFF",
    fill: "rgba(71, 107, 255, 0.04)",
    tag: "LINES 10–16 · 75% SAFETY CAP",
    tagColor: "#1E40AF",
    title: "3. Dynamic Safety Cap Invariant",
    points: [
      "75% Cap Invariant: While active, max withdrawal is capped at 75% of total budget.",
      "25% Collateral Escrow: Last 25% remains locked until final client signoff.",
      "Anti-Abandonment: Solves Web3 streaming dilemma — devs can't drain 100% and ghost.",
    ],
  },
  {
    // Stage 4 (Click 4: Lines 18-20)
    color: "#8B5CF6",
    fill: "rgba(139, 92, 246, 0.04)",
    tag: "LINES 18–20 · CEI SETTLEMENT",
    tagColor: "#5B21B6",
    title: "4. CEI Pattern & Settlement",
    points: [
      "State Before Transfer: Increments s.withdrawn before calling external token contract.",
      "safeTransfer: Pull settlement transfers USDC directly to developer wallet.",
      "StreamClaimed Event: Emits on-chain log for instant subgraph indexing.",
    ],
  },
  {
    // Stage 5+: Complete summary
    color: "#059669",
    fill: "rgba(5, 150, 105, 0.05)",
    tag: "PROTOCOL INVARIANT VERIFIED",
    tagColor: "#047857",
    title: "Formally Verified Invariants",
    points: [
      "Bounded Accrual: Withdrawn amount strictly ≤ min(earned, cap) at all times.",
      "Zero Stranded Assets: Final approval or cancellation settles 100% of budget.",
      "Battle-Tested: 30/30 automated Foundry unit & invariant tests passing.",
    ],
  },
]

function currentStageData() {
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

  const data = currentStageData()
  const rc = rough.svg(svg)

  // Sketchy border around the card
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

  // Hand-drawn underline under title
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
      <div class="rough-tag" :style="{ color: currentStageData().tagColor }">
        {{ currentStageData().tag }}
      </div>
      <h3 class="rough-title" :style="{ color: currentStageData().color }">
        {{ currentStageData().title }}
      </h3>
      <ul class="rough-points">
        <li v-for="(pt, idx) in currentStageData().points" :key="idx">
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
