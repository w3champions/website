<template>
  <v-card variant="outlined" class="pa-4 mb-4">
    <div class="text-subtitle-2 mb-2">{{ file.name }}</div>
    <v-alert v-if="error" type="error" class="mb-3">{{ error }}</v-alert>
    <div v-if="loading" role="status">Loading image and frame…</div>
    <div
      class="portrait-viewport"
      tabindex="0"
      aria-label="Portrait crop preview. Drag to position, scroll to zoom. Keyboard: arrows to position, plus and minus to zoom."
      @pointerdown="startDrag"
      @pointermove="moveDrag"
      @pointerup="stopDrag"
      @pointercancel="stopDrag"
      @lostpointercapture="drag = null"
      @wheel="scrollZoom"
      @keydown="adjustWithKeyboard"
    >
      <canvas
        v-show="!keepAnimation"
        ref="canvas"
        class="portrait-preview"
        :class="{ 'portrait-preview-disabled': disabled || loading }"
        :width="PORTRAIT_SIZE"
        :height="PORTRAIT_SIZE"
      ></canvas>
      <template v-if="keepAnimation && source">
        <img :src="sourceURL" :style="animatedStyle" alt="Animated portrait preview" class="portrait-animation" />
        <img v-if="includeFrame" :src="frameUrl" alt="" class="portrait-frame" />
      </template>
    </div>
    <p class="text-caption my-2">Drag to position. Use the slider or scroll to zoom. The 256 × 256 {{ keepAnimation ? 'animated WebP' : 'still WebP' }} is generated on submit.</p>
    <v-slider v-model="zoom" label="Zoom" :min="minimumZoom" :max="4" :step="0.003125" :disabled="disabled || loading" hide-details thumb-label class="portrait-zoom my-3">
      <template v-slot:thumb-label="{ modelValue }">{{ (modelValue * 100).toFixed(1) }}%</template>
    </v-slider>
    <v-checkbox v-if="animationFormat" v-model="keepAnimation" label="Keep animation" :disabled="disabled || loading" hide-details density="compact" />
    <p v-if="encodingStatus" role="status" class="text-caption">{{ encodingStatus }}</p>
    <v-btn
      :variant="includeFrame ? 'tonal' : 'outlined'"
      :aria-pressed="includeFrame"
      :disabled="disabled || loading"
      @click="includeFrame = !includeFrame"
    >
      Standard frame: {{ includeFrame ? "On" : "Off" }}
    </v-btn>
    <v-btn variant="text" :disabled="disabled || loading" @click="reset">Reset crop</v-btn>
  </v-card>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, shallowRef, watch } from "vue";
import { drawPortrait, portraitCrop, PORTRAIT_SIZE, PORTRAIT_MIN_ZOOM } from "@/helpers/portraitCrop";
import { portraitAnimationFormat, type PortraitAnimationFormat } from "@/helpers/portraitAnimation";

const frameUrl = new URL("../../../assets/portraits/standard-frame.png", import.meta.url).href;
const props = defineProps<{ file: File; disabled: boolean; initialFrame?: boolean }>();
const emit = defineEmits<{ prepared: [prepare: (() => Promise<File>) | null] }>();
const canvas = ref<HTMLCanvasElement | null>(null);
const source = shallowRef<HTMLImageElement | null>(null);
const frame = shallowRef<HTMLImageElement | null>(null);
const includeFrame = ref(props.initialFrame ?? true);
const zoom = ref(1);
const minimumZoom = computed(() => includeFrame.value ? PORTRAIT_MIN_ZOOM : 1);
watch(minimumZoom, (minimum) => { zoom.value = Math.max(minimum, zoom.value); });
const x = ref(50);
const y = ref(50);
const loading = ref(true);
const error = ref("");
const sourceURL = ref("");
const animationFormat = ref<PortraitAnimationFormat | null>(null);
const keepAnimation = ref(false);
const encodingStatus = ref("");
const animatedStyle = computed(() => {
  if (!source.value) return {};
  const crop = portraitCrop(source.value.naturalWidth, source.value.naturalHeight, zoom.value, x.value, y.value);
  return {
    width: `${source.value.naturalWidth / crop.side * 100}%`,
    height: `${source.value.naturalHeight / crop.side * 100}%`,
    left: `${-crop.x / crop.side * 100}%`, top: `${-crop.y / crop.side * 100}%`,
  };
});
const drag = ref<{ id: number; x: number; y: number } | null>(null);
let loadVersion = 0;

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not read the image or frame. Please choose a valid JPG, PNG, GIF, APNG or WebP image."));
    image.src = url;
  });
}

watch(() => props.file, async (file) => {
  const version = ++loadVersion;
  emit("prepared", null);
  source.value = null;
  loading.value = true;
  error.value = "";
  reset();
  animationFormat.value = null;
  keepAnimation.value = false;
  if (sourceURL.value) URL.revokeObjectURL(sourceURL.value);
  const url = URL.createObjectURL(file);
  sourceURL.value = url;
  try {
    const [loadedSource, loadedFrame, bytes] = await Promise.all([loadImage(url), loadImage(frameUrl), file.arrayBuffer()]);
    if (version !== loadVersion) return;
    source.value = loadedSource;
    frame.value = loadedFrame;
    animationFormat.value = portraitAnimationFormat(new Uint8Array(bytes));
    keepAnimation.value = !!animationFormat.value;
  } catch (err) {
    if (version === loadVersion) error.value = err instanceof Error ? err.message : "Could not load image.";
  } finally {
    if (version !== loadVersion) URL.revokeObjectURL(url);
    if (version === loadVersion) loading.value = false;
  }
}, { immediate: true });

watch([canvas, source, frame, zoom, x, y, includeFrame], () => {
  if (!canvas.value || !source.value || !frame.value) return;
  try {
    drawPortrait(canvas.value, source.value, includeFrame.value ? frame.value : null, zoom.value, x.value, y.value);
    error.value = "";
    emit("prepared", exportPortrait);
  } catch (err) {
    emit("prepared", null);
    error.value = err instanceof Error ? err.message : "Could not prepare portrait.";
  }
}, { flush: "post" });

async function exportPortrait(): Promise<File> {
  if (animationFormat.value && source.value) {
    const { exportAnimatedPortrait } = await import("@/services/AnimatedPortraitService");
    return await exportAnimatedPortrait(props.file, animationFormat.value,
      portraitCrop(source.value.naturalWidth, source.value.naturalHeight, zoom.value, x.value, y.value),
      includeFrame.value ? frameUrl : null, (message) => { encodingStatus.value = message; }, keepAnimation.value);
  }
  if (!canvas.value || !source.value || !frame.value) throw new Error("The portrait preview is not ready.");
  const { exportStillPortrait } = await import("@/services/StillPortraitService");
  return await exportStillPortrait(canvas.value);
}

function scrollZoom(event: WheelEvent): void {
  if (props.disabled || loading.value) return;
  event.preventDefault();
  const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? PORTRAIT_SIZE : 1);
  zoom.value = Math.max(minimumZoom.value, Math.min(4, zoom.value * Math.exp(-delta * 0.002)));
}

function adjustWithKeyboard(event: KeyboardEvent): void {
  if (props.disabled || loading.value) return;
  switch (event.key) {
    case "ArrowLeft": x.value = Math.max(0, x.value - 2); break;
    case "ArrowRight": x.value = Math.min(100, x.value + 2); break;
    case "ArrowUp": y.value = Math.max(0, y.value - 2); break;
    case "ArrowDown": y.value = Math.min(100, y.value + 2); break;
    case "+":
    case "=": zoom.value = Math.min(4, zoom.value + 0.1); break;
    case "-": zoom.value = Math.max(minimumZoom.value, zoom.value - 0.1); break;
    default: return;
  }
  event.preventDefault();
}

function reset(): void {
  zoom.value = 1;
  x.value = 50;
  y.value = 50;
  drag.value = null;
}

function startDrag(event: PointerEvent): void {
  if (props.disabled || loading.value || !canvas.value || event.button !== 0) return;
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  drag.value = { id: event.pointerId, x: event.clientX, y: event.clientY };
}

function moveDrag(event: PointerEvent): void {
  if (!drag.value || drag.value.id !== event.pointerId || !canvas.value || !source.value || props.disabled) return;
  const crop = portraitCrop(source.value.naturalWidth, source.value.naturalHeight, zoom.value, x.value, y.value);
  const scale = crop.side / (event.currentTarget as HTMLElement).getBoundingClientRect().width;
  const horizontalRange = source.value.naturalWidth - crop.side;
  const verticalRange = source.value.naturalHeight - crop.side;
  if (Math.abs(horizontalRange) > 0.001) x.value = Math.max(0, Math.min(100, x.value - (event.clientX - drag.value.x) * scale / horizontalRange * 100));
  if (Math.abs(verticalRange) > 0.001) y.value = Math.max(0, Math.min(100, y.value - (event.clientY - drag.value.y) * scale / verticalRange * 100));
  drag.value = { id: event.pointerId, x: event.clientX, y: event.clientY };
}

function stopDrag(event: PointerEvent): void {
  if (drag.value?.id !== event.pointerId) return;
  drag.value = null;
  const target = event.currentTarget as HTMLElement;
  if (target.hasPointerCapture(event.pointerId)) target.releasePointerCapture(event.pointerId);
}

onBeforeUnmount(() => {
  ++loadVersion;
  if (sourceURL.value) URL.revokeObjectURL(sourceURL.value);
});
</script>

<style scoped>
.portrait-zoom {
  width: 100%;
  max-width: 380px;
}
.portrait-viewport {
  width: 256px;
  max-width: 100%;
  aspect-ratio: 1;
  position: relative;
  overflow: hidden;
  touch-action: none;
  cursor: grab;
  background: #000;
}
.portrait-animation {
  position: absolute;
  max-width: none;
  pointer-events: none;
}
.portrait-frame {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
.portrait-preview {
  display: block;
  width: 256px;
  max-width: 100%;
  height: auto;
  touch-action: none;
  cursor: grab;
  background: #000;
}
.portrait-preview:active {
  cursor: grabbing;
}
.portrait-preview-disabled {
  cursor: default;
}
</style>
