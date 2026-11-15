import type { Chart, Plugin } from "chart.js";
import { resyncPointer } from "@/components/common/charts/timelineCrosshair";

/** chartjs-plugin-zoom adds these to the instance. */
type Pannable = Chart & { pan?: (delta: { x?: number; y?: number }, scales?: unknown, transition?: string) => void };

const handlers = new WeakMap<Chart, (event: WheelEvent) => void>();

/**
 * Sends horizontal wheel movement to panning instead of zooming.
 *
 * chartjs-plugin-zoom treats any wheel event as a zoom, so a sideways scroll —
 * a trackpad swipe or a tilt wheel — zooms out whichever way it is pushed.
 * Sideways obviously means "look further along", so it pans, and only vertical
 * wheel movement is left to zoom.
 *
 * Registered on the capture phase so it can stop the zoom plugin's own listener
 * from also seeing the event.
 */
export const timelineWheelPanPlugin: Plugin<"line"> = {
  id: "timelineWheelPan",

  afterInit(chart) {
    const canvas = chart.canvas;
    if (!canvas) return;

    const onWheel = (event: WheelEvent): void => {
      if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return; // Leave vertical to the zoom plugin.

      const pan = (chart as Pannable).pan;
      if (!pan) return;

      event.preventDefault();
      event.stopImmediatePropagation();

      // Pushing right should advance the view, which means moving the content
      // the other way.
      pan.call(chart, { x: -event.deltaX }, undefined, "none");
      resyncPointer(chart);
    };

    canvas.addEventListener("wheel", onWheel, { capture: true, passive: false });
    handlers.set(chart, onWheel);
  },

  afterDestroy(chart) {
    const onWheel = handlers.get(chart);
    if (onWheel && chart.canvas) {
      chart.canvas.removeEventListener("wheel", onWheel, { capture: true });
      handlers.delete(chart);
    }
  },
};
