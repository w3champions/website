import { Chart, type ChartEvent, type ChartType, Interaction, type InteractionItem, type InteractionModeFunction, type Plugin, Tooltip, type TooltipPositionerFunction } from "chart.js";
import { getRelativePosition } from "chart.js/helpers";

declare module "chart.js" {
  interface InteractionModeMap {
    steppedIndex: InteractionModeFunction;
  }

  interface TooltipPositionerMap {
    crosshair: TooltipPositionerFunction<ChartType>;
  }
}

/**
 * Anchors the tooltip to the pointer rather than to the nearest element. With
 * the steppedIndex mode the "nearest" element can be weeks to the left of the
 * pointer, which drags the tooltip away from the crosshair it describes.
 */
Tooltip.positioners.crosshair = (_items, eventPosition) => eventPosition;

export type TimelineCrosshairOptions = {
  enabled?: boolean;
  color?: string;
  width?: number;
  dash?: number[];
  /** Draw a dot where the crosshair intersects each series. */
  drawIntersections?: boolean;
  intersectionRadius?: number;
};

const DEFAULTS: Required<TimelineCrosshairOptions> = {
  enabled: true,
  color: "rgba(150, 150, 150, 0.8)",
  width: 1,
  dash: [4, 4],
  drawIntersections: true,
  intersectionRadius: 4,
};

// The pointer's pixel position per chart. Kept outside the chart instance so it
// survives re-renders without polluting the chart config.
const pointer = new WeakMap<Chart, { x: number; y: number } | null>();

/**
 * Returns the value each series holds at the pointer's x position: for every
 * visible dataset, the last point at or before the pointer.
 *
 * This is the correct readout for a stepped series, where a value persists
 * until the next recorded point. The built-in "index" mode can't do this
 * because it assumes every dataset shares one label array, which per-race MMR
 * series do not.
 */
const steppedIndex: InteractionModeFunction = (chart, e, _options, useFinalPosition) => {
  const position = getRelativePosition(e, chart);
  const items: InteractionItem[] = [];

  for (let datasetIndex = 0; datasetIndex < chart.data.datasets.length; datasetIndex++) {
    if (!chart.isDatasetVisible(datasetIndex)) continue;

    const points = chart.getDatasetMeta(datasetIndex).data;
    if (!points.length) continue;

    // Points are ordered by x ascending, so binary search for the last one at
    // or before the pointer. Compare in pixel space to avoid reaching into the
    // chart's internal parsed data.
    let low = 0;
    let high = points.length - 1;
    let found = -1;
    while (low <= high) {
      const mid = (low + high) >> 1;
      if (points[mid].getProps(["x"], useFinalPosition).x <= position.x) {
        found = mid;
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    if (found === -1) continue; // Pointer is before this series starts.
    items.push({ element: points[found], datasetIndex, index: found });
  }

  return items;
};

Interaction.modes.steppedIndex = steppedIndex;

/**
 * Re-resolves the readout at the pointer's current position.
 *
 * Panning and zooming slide the data underneath a stationary pointer, but
 * Chart.js only recomputes active elements in response to input events. Without
 * this the tooltip and intersection dots keep reporting whatever sat under the
 * cursor when the gesture began. Call it from the zoom plugin's hooks.
 */
export const resyncPointer = (chart: Chart): void => {
  const position = pointer.get(chart);
  if (!position) return;

  const event = { type: "mousemove", ...position, native: null } as unknown as ChartEvent;
  const items = steppedIndex(chart, event, { axis: "x", includeInvisible: false, intersect: false }, false);

  chart.tooltip?.setActiveElements(items, position);
  chart.setActiveElements(items);
  chart.render();
};

export const timelineCrosshairPlugin: Plugin<"line"> = {
  id: "timelineCrosshair",

  // beforeEvent, not afterEvent, so the position is already current for
  // anything the tooltip plugin does in its own afterEvent hook.
  beforeEvent(chart, args) {
    const previous = pointer.get(chart) ?? null;
    const { event, inChartArea } = args;

    let next = previous;
    if (event.type === "mouseout" || !inChartArea) {
      next = null;
    } else if (event.type === "mousemove" && event.x != null && event.y != null) {
      next = { x: event.x, y: event.y };
    }

    if (next?.x !== previous?.x || next?.y !== previous?.y) {
      pointer.set(chart, next);
      args.changed = true; // Repaint so the line tracks the pointer.
    }

    return true; // beforeEvent is cancelable; never cancel.
  },

  afterDatasetsDraw(chart, _args, pluginOptions) {
    const options = { ...DEFAULTS, ...(pluginOptions as TimelineCrosshairOptions) };
    if (!options.enabled) return;

    const x = pointer.get(chart)?.x;
    if (x == null) return;

    const { ctx, chartArea } = chart;
    if (x < chartArea.left || x > chartArea.right) return;

    ctx.save();

    ctx.beginPath();
    ctx.setLineDash(options.dash);
    ctx.lineWidth = options.width;
    ctx.strokeStyle = options.color;
    ctx.moveTo(x, chartArea.top);
    ctx.lineTo(x, chartArea.bottom);
    ctx.stroke();

    if (options.drawIntersections) {
      ctx.setLineDash([]);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = options.color;
      for (const item of chart.tooltip?.getActiveElements() ?? []) {
        const dataset = chart.data.datasets[item.datasetIndex];
        ctx.beginPath();
        ctx.fillStyle = (dataset.borderColor as string) ?? options.color;
        // The dot sits at the pointer, not at the point that supplied the
        // value, because a stepped series holds that value across the gap.
        ctx.arc(x, item.element.y, options.intersectionRadius, 0, Math.PI * 2);
        ctx.fill();
        // Ringed, or a dot in the series colour disappears into its own line.
        ctx.stroke();
      }
    }

    ctx.restore();
  },
};
