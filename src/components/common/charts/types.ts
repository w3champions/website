export type TimelinePoint = {
  /** Epoch milliseconds. */
  x: number;
  y: number;
};

export type TimelineSeries = {
  key: string;
  label: string;
  color: string;
  /** Defaults to the first configured axis. */
  yAxisID?: string;
  /** Must be ordered by x ascending. */
  points: TimelinePoint[];
  /** Overrides the client-side maximum. Use for a server-computed peak that
   * excludes points recorded while the player was still calibrating. */
  peak?: TimelinePoint;
  format?: (value: number) => string;
  /** Shown instead of the colour swatch in the legend, e.g. a race icon. */
  icon?: string;
};

export type TimelineAxis = {
  id: string;
  title?: string;
  position?: "left" | "right";
  beginAtZero?: boolean;
  /** Smallest span the axis will show. Without one, zooming in rescales to
   * whatever is visible and turns a handful of points into dramatic swings. */
  minRange?: number;
};

/** A vertical reference line, e.g. where one season gives way to the next. */
export type TimelineMarker = {
  /** Epoch milliseconds. */
  x: number;
  label?: string;
};

export type TimelineRangePreset = {
  key: string;
  label: string;
  /** Months back from the newest data point; omit for the full range. */
  months?: number;
  default?: boolean;
};
