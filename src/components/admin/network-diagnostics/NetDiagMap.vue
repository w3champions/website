<template>
  <div ref="mapElement" class="netdiag-map" role="img" :aria-label="description"></div>
</template>

<script lang="ts" setup>
import "leaflet/dist/leaflet.css";
import { circleMarker, layerGroup, type LayerGroup, map as createMap, type Map as LeafletMap, tileLayer } from "leaflet";
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { type ColorBucket, type MapPoint, tooltipElement } from "./fleet";

const props = defineProps<{ points: MapPoint[]; colors: Record<ColorBucket, string>; description: string }>();

// OSM tile usage policy: attribution is required; keep request volume low (admin-only page).
const OSM_TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const OSM_ATTRIBUTION = "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors";
const OSM_MAX_ZOOM = 19;
const WORLD_CENTER: [number, number] = [30, 10];
const WORLD_ZOOM = 2;
const FIT_MAX_ZOOM = 6;
const FIT_PADDING_PX = 24;
const DOT_RADIUS_PX = 5;
const DOT_FILL_OPACITY = 0.75;

const mapElement = ref<HTMLElement | null>(null);
let leafletMap: LeafletMap | null = null;
let dots: LayerGroup | null = null;
let resizeObserver: ResizeObserver | null = null;

// circleMarker only: vector dots need none of Leaflet's marker images, so Vite has no assets to resolve.
function draw(): void {
  if (leafletMap === null || dots === null) return;
  dots.clearLayers();
  for (const point of props.points) {
    const color = props.colors[point.bucket];
    circleMarker([point.lat, point.lon], { radius: DOT_RADIUS_PX, color, weight: 1, fillColor: color, fillOpacity: DOT_FILL_OPACITY })
      .bindTooltip(tooltipElement(document, point.label))
      .addTo(dots);
  }
  if (props.points.length > 0) {
    leafletMap.fitBounds(props.points.map((point): [number, number] => [point.lat, point.lon]), { padding: [FIT_PADDING_PX, FIT_PADDING_PX], maxZoom: FIT_MAX_ZOOM });
  } else {
    leafletMap.setView(WORLD_CENTER, WORLD_ZOOM);
  }
}

onMounted(() => {
  if (mapElement.value === null) return;
  leafletMap = createMap(mapElement.value, { worldCopyJump: true }).setView(WORLD_CENTER, WORLD_ZOOM);
  tileLayer(OSM_TILES, { maxZoom: OSM_MAX_ZOOM, attribution: OSM_ATTRIBUTION }).addTo(leafletMap);
  dots = layerGroup().addTo(leafletMap);
  // Leaflet measures its container once; the drawer and breakpoints resize it later.
  resizeObserver = new ResizeObserver(() => leafletMap?.invalidateSize());
  resizeObserver.observe(mapElement.value);
  draw();
});

watch(() => [props.points, props.colors], draw);

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  resizeObserver = null;
  leafletMap?.remove();
  leafletMap = null;
  dots = null;
});
</script>

<style scoped>
.netdiag-map {
  height: 420px;
  width: 100%;
  border-radius: 4px;
  /* Leaflet panes use z-index 400-1000; keep them below Vuetify's drawer and overlays. */
  isolation: isolate;
}
</style>
