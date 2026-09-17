<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'

const isStreaming = ref(false)
const seconds = ref(0)
const withdrawn = ref(0)
const totalBudget = 500 // 500 USDC
const duration = 3600 // 1 hour

let timer: any = null

function toggleStream() {
  isStreaming.value = !isStreaming.value
  if (isStreaming.value) {
    timer = setInterval(() => {
      seconds.value += 1
      if (seconds.value >= duration) {
        clearInterval(timer)
        isStreaming.value = false
      }
    }, 100) // Fast 10x simulation
  } else {
    clearInterval(timer)
  }
}

function resetStream() {
  isStreaming.value = false
  clearInterval(timer)
  seconds.value = 0
  withdrawn.value = 0
}

const accrued = computed(() => {
  return Number(Math.min((seconds.value / duration) * totalBudget, totalBudget).toFixed(4))
})

const maxCap = computed(() => {
  return Number((totalBudget * 0.75).toFixed(2))
})

const claimable = computed(() => {
  const cap = Math.min(accrued.value, maxCap.value)
  return Number(Math.max(0, cap - withdrawn.value).toFixed(4))
})

function claim() {
  if (claimable.value > 0) {
    withdrawn.value += claimable.value
    withdrawn.value = Number(withdrawn.value.toFixed(4))
  }
}

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <div class="p-4 rounded-xl border border-cyan-500/40 bg-black/60 backdrop-blur text-left font-sans shadow-2xl">
    <div class="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
      <div class="flex items-center gap-2">
        <span class="w-2.5 h-2.5 rounded-full" :class="isStreaming ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'"></span>
        <span class="text-xs font-mono font-bold text-gray-200">
          {{ isStreaming ? 'STREAMING ACTIVE (10x Time Warp)' : 'STREAM STANDBY' }}
        </span>
      </div>
      <div class="flex items-center gap-1.5 text-xs font-mono px-2.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
        <img src="/usdc.svg" class="w-3.5 h-3.5 inline-block" alt="USDC" />
        <span>Vault: {{ totalBudget }} USDC</span>
      </div>
    </div>

    <!-- Counters -->
    <div class="grid grid-cols-3 gap-3 mb-3 text-center">
      <div class="p-2 rounded-lg bg-white/5 border border-white/10">
        <div class="text-[10px] text-gray-400 uppercase tracking-wider font-mono">Total Accrued</div>
        <div class="text-lg font-black font-mono text-cyan-400">{{ accrued.toFixed(4) }}</div>
        <div class="text-[10px] text-gray-500">of 500 USDC</div>
      </div>

      <div class="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30">
        <div class="text-[10px] text-emerald-300 uppercase tracking-wider font-mono">Claimable (75% Cap)</div>
        <div class="text-lg font-black font-mono text-emerald-400">{{ claimable.toFixed(4) }}</div>
        <div class="text-[10px] text-emerald-500">Max Cap: 375.00</div>
      </div>

      <div class="p-2 rounded-lg bg-purple-950/40 border border-purple-500/30">
        <div class="text-[10px] text-purple-300 uppercase tracking-wider font-mono">Settled to Wallet</div>
        <div class="text-lg font-black font-mono text-purple-400">{{ withdrawn.toFixed(4) }}</div>
        <div class="text-[10px] text-purple-500">Withdrawn</div>
      </div>
    </div>

    <!-- Progress Bar -->
    <div class="w-full bg-white/10 rounded-full h-2 mb-3 overflow-hidden flex">
      <div class="bg-purple-500 h-2 transition-all duration-150" :style="{ width: `${(withdrawn / totalBudget) * 100}%` }"></div>
      <div class="bg-emerald-400 h-2 transition-all duration-150" :style="{ width: `${(claimable / totalBudget) * 100}%` }"></div>
      <div class="bg-amber-400/40 h-2" :style="{ width: `${25}%` }" title="25% Client Quality Collateral"></div>
    </div>
    <div class="flex justify-between text-[10px] text-gray-400 font-mono mb-4">
      <span>Withdrawn: {{ ((withdrawn / totalBudget) * 100).toFixed(1) }}%</span>
      <span class="text-emerald-300 font-semibold">Available: {{ ((claimable / totalBudget) * 100).toFixed(1) }}%</span>
      <span class="text-amber-300">25% Quality Collateral (Locked)</span>
    </div>

    <!-- Action Buttons -->
    <div class="flex gap-2">
      <button
        @click="toggleStream"
        class="flex-1 py-1.5 px-3 rounded-lg text-xs font-bold text-white transition flex items-center justify-center gap-1.5"
        :class="isStreaming ? 'bg-amber-600 hover:bg-amber-500' : 'bg-cyan-600 hover:bg-cyan-500'"
      >
        <div v-if="isStreaming" class="i-carbon:pause-filled inline-block" />
        <div v-else class="i-carbon:play-filled inline-block" />
        <span>{{ isStreaming ? 'Pause Streaming' : 'Start Stream' }}</span>
      </button>
      <button
        @click="claim"
        :disabled="claimable <= 0"
        class="py-1.5 px-4 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1.5"
      >
        <div class="i-carbon:download inline-block" />
        <span>Claim to Wallet</span>
      </button>
      <button
        @click="resetStream"
        class="py-1.5 px-3 rounded-lg text-xs font-medium text-gray-300 bg-white/10 hover:bg-white/20 transition flex items-center gap-1"
      >
        <div class="i-carbon:reset inline-block" />
        <span>Reset</span>
      </button>
    </div>
  </div>
</template>
