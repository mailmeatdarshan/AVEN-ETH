<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { LaserPointer } from '@excalidraw/laser-pointer'

const isLaserActive = ref(false)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const cursorPos = ref({ x: -100, y: -100 })
const isInteracting = ref(false)

// Excalidraw ka exact sinusoidal easing function
function easeOut(t: number) {
  return Math.sin((t * Math.PI) / 2)
}

// Laser settings (size 1.5 = ~3px sleek stroke jo peeche se needle-sharp taper hoti hai)
const laserOptions = {
  size: 1.5,
  streamline: 0.45,  // Shaky lines ko smooth curve banata hai
  simplify: 0,
  keepHead: true,
  sizeMapping: (c: any) => {
    const DECAY_TIME = 900 // 0.9s ke andar line dissolve ho jaati hai
    const DECAY_LENGTH = 50
    const t = Math.max(0, 1 - (performance.now() - c.pressure) / DECAY_TIME)
    const l = (DECAY_LENGTH - Math.min(DECAY_LENGTH, c.totalLength - c.currentIndex)) / DECAY_LENGTH
    return Math.min(easeOut(l), easeOut(t))
  },
}

let currentTrail: any = null
let pastTrails: any[] = []
let animFrameId: number | null = null

function toggleLaser() {
  isLaserActive.value = !isLaserActive.value
}

// Mobile Retina/High-DPI screen scaling fix
function resizeCanvas() {
  const el = canvasRef.value
  if (!el) return
  const dpr = window.devicePixelRatio || 1
  const w = window.innerWidth
  const h = window.innerHeight
  el.width = Math.round(w * dpr)
  el.height = Math.round(h * dpr)
  el.style.width = `${w}px`   // CSS size lock karna zaroori hai
  el.style.height = `${h}px`  // warna Retina screen par drawing off-screen chali jaati hai
}

// 60 FPS Render Loop
function renderFrame() {
  const el = canvasRef.value
  if (!el) return
  const ctx = el.getContext('2d')
  if (!ctx) return

  const dpr = window.devicePixelRatio || 1
  ctx.save()
  ctx.clearRect(0, 0, el.width, el.height)
  ctx.scale(dpr, dpr)

  // 1. Purani lines ko fade-out draw karo
  const survivingTrails: any[] = []
  for (const trail of pastTrails) {
    const outline = trail.getStrokeOutline()
    if (outline && outline.length >= 3) {
      survivingTrails.push(trail)
      drawPolygon(ctx, outline, 0.45)
    }
  }
  pastTrails = survivingTrails

  // 2. Jo line abhi ungli/mouse se draw ho rahi hai use draw karo
  if (currentTrail) {
    const outline = currentTrail.getStrokeOutline()
    if (outline && outline.length >= 3) {
      drawPolygon(ctx, outline, 0.55)
    }
  }

  // 3. Glowing Laser Dot (Pointer Head)
  if (cursorPos.value.x >= 0 && cursorPos.value.y >= 0) {
    const cx = cursorPos.value.x
    const cy = cursorPos.value.y
    const pulse = Math.sin(performance.now() / 150) * 1.0

    // Subtle radiant aura
    const auraRadius = Math.max(6, 8.5 + pulse)
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, auraRadius)
    grad.addColorStop(0, 'rgba(255, 34, 85, 0.4)')
    grad.addColorStop(1, 'rgba(255, 34, 85, 0)')

    ctx.beginPath()
    ctx.arc(cx, cy, auraRadius, 0, Math.PI * 2)
    ctx.fillStyle = grad
    ctx.fill()

    // Red laser core
    ctx.beginPath()
    ctx.arc(cx, cy, 3, 0, Math.PI * 2)
    ctx.fillStyle = '#ff2255'
    ctx.shadowColor = 'rgba(255, 34, 85, 0.8)'
    ctx.shadowBlur = 4
    ctx.fill()

    // White center pinpoint
    ctx.beginPath()
    ctx.arc(cx, cy, 1.2, 0, Math.PI * 2)
    ctx.fillStyle = '#ffffff'
    ctx.shadowBlur = 0
    ctx.fill()
  }

  ctx.restore()

  if (isLaserActive.value) {
    animFrameId = requestAnimationFrame(renderFrame)
  }
}

function drawPolygon(ctx: CanvasRenderingContext2D, points: number[][], shadowAlpha: number) {
  ctx.beginPath()
  ctx.moveTo(points[0][0], points[0][1])
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i][0], points[i][1])
  }
  ctx.closePath()
  ctx.fillStyle = '#ff2255'
  ctx.shadowColor = `rgba(255, 34, 85, ${shadowAlpha})`
  ctx.shadowBlur = 4
  ctx.fill()
}

// Unified Interaction Logic
function handleStart(x: number, y: number) {
  cursorPos.value = { x, y }
  isInteracting.value = true
  currentTrail = new LaserPointer(laserOptions)
  currentTrail.addPoint([x, y, performance.now()])
}

function handleMove(x: number, y: number) {
  cursorPos.value = { x, y }
  if (isInteracting.value && currentTrail) {
    currentTrail.addPoint([x, y, performance.now()])
  }
}

function handleEnd() {
  isInteracting.value = false
  if (currentTrail) {
    currentTrail.close()
    currentTrail.options.keepHead = false
    pastTrails.push(currentTrail)
    currentTrail = null
  }
}

// Pointer Events (Desktop + Stylus)
function onPointerDown(e: PointerEvent) {
  e.preventDefault()
  if (canvasRef.value && e.pointerId) {
    try { canvasRef.value.setPointerCapture(e.pointerId) } catch (_) {}
  }
  handleStart(e.clientX, e.clientY)
}

function onPointerMove(e: PointerEvent) {
  e.preventDefault()
  handleMove(e.clientX, e.clientY)
}

function onPointerUp(e: PointerEvent) {
  e.preventDefault()
  if (canvasRef.value && e.pointerId) {
    try { canvasRef.value.releasePointerCapture(e.pointerId) } catch (_) {}
  }
  handleEnd()
}

// Touch Events (Mobile Phone fix: { passive: false } prevents page scroll/swipe)
function onTouchStart(e: TouchEvent) {
  e.preventDefault()
  if (e.touches && e.touches.length > 0) {
    handleStart(e.touches[0].clientX, e.touches[0].clientY)
  }
}

function onTouchMove(e: TouchEvent) {
  e.preventDefault()
  if (e.touches && e.touches.length > 0) {
    handleMove(e.touches[0].clientX, e.touches[0].clientY)
  }
}

function onTouchEnd(e: TouchEvent) {
  e.preventDefault()
  handleEnd()
}

function attachListeners() {
  const el = canvasRef.value
  if (!el) return
  el.addEventListener('pointerdown', onPointerDown)
  el.addEventListener('pointermove', onPointerMove)
  el.addEventListener('pointerup', onPointerUp)
  el.addEventListener('pointercancel', onPointerUp)

  el.addEventListener('touchstart', onTouchStart, { passive: false })
  el.addEventListener('touchmove', onTouchMove, { passive: false })
  el.addEventListener('touchend', onTouchEnd, { passive: false })
  el.addEventListener('touchcancel', onTouchEnd, { passive: false })
}

function removeListeners() {
  const el = canvasRef.value
  if (!el) return
  el.removeEventListener('pointerdown', onPointerDown)
  el.removeEventListener('pointermove', onPointerMove)
  el.removeEventListener('pointerup', onPointerUp)
  el.removeEventListener('pointercancel', onPointerUp)

  el.removeEventListener('touchstart', onTouchStart)
  el.removeEventListener('touchmove', onTouchMove)
  el.removeEventListener('touchend', onTouchEnd)
  el.removeEventListener('touchcancel', onTouchEnd)
}

function onKeyDown(e: KeyboardEvent) {
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
  if (e.key === 'l' || e.key === 'L') toggleLaser()
  else if (e.key === 'Escape' && isLaserActive.value) isLaserActive.value = false
}

watch(isLaserActive, (active) => {
  if (active) {
    nextTick(() => {
      resizeCanvas()
      attachListeners()
      animFrameId = requestAnimationFrame(renderFrame)
    })
  } else {
    removeListeners()
    if (animFrameId) {
      cancelAnimationFrame(animFrameId)
      animFrameId = null
    }
    currentTrail = null
    pastTrails = []
    cursorPos.value = { x: -100, y: -100 }
    if (canvasRef.value) {
      const ctx = canvasRef.value.getContext('2d')
      if (ctx) ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height)
    }
  }
})

onMounted(() => {
  window.addEventListener('resize', resizeCanvas)
  window.addEventListener('orientationchange', resizeCanvas)
  window.addEventListener('keydown', onKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeCanvas)
  window.removeEventListener('orientationchange', resizeCanvas)
  window.removeEventListener('keydown', onKeyDown)
  removeListeners()
  if (animFrameId) cancelAnimationFrame(animFrameId)
})
</script>

<template>
  <div class="w-1px opacity-10 bg-current m-1 lg:m-2" />

  <!-- Bottom Bar Button -->
  <button
    class="slidev-icon-btn transition-colors relative"
    :class="{ 'active text-rose-600 bg-rose-100': isLaserActive }"
    title="Laser Pointer [L]"
    @click="toggleLaser"
  >
    <!-- Excalidraw Laser Tool Icon -->
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <g transform="rotate(45 12 12)">
        <path d="m9.6 13.7 7.8-7.8a2.3 2.3 0 0 0-3.3-3.3L6.3 10.4 8 12l1.6 1.7Z" />
        <path d="m13.2 3.4 3.4 3.4M10 10l2-2M5 15l3-3M2.2 17.9l1-1M5.5 19l-.2-1.4M2.4 11.9l.9 1.1M8.4 17.3l-1.2-.8M1 14.7l1.4.1" />
      </g>
    </svg>
    <span v-if="isLaserActive" class="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
  </button>

  <!-- Fullscreen Laser Canvas -->
  <Teleport to="body">
    <canvas
      v-show="isLaserActive"
      ref="canvasRef"
      style="
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        z-index: 8500 !important;
        cursor: crosshair;
        touch-action: none !important;
        user-select: none !important;
        -webkit-user-select: none !important;
      "
    />
  </Teleport>
</template>

<style>
/* Bottom navigation bar laser canvas ke upar click-friendly rehna chahiye */
.slidev-slide-container > div:has(nav),
nav.flex.flex-col {
  position: relative !important;
  z-index: 9999 !important;
  pointer-events: auto !important;
}
</style>
