// Taken from https://github.com/jkmnt/chartjs-scale-timestack
// License: MIT
// Modified to replace 'luxon' library usage with the native
// Date object instead to avoid an additional dependency.
// Modified to register the scale on CartesianScaleTypeRegistry rather than
// ScaleTypeRegistry, so 'timestack' type-checks as an x axis on a line chart.

import type { TimestackScaleOptions } from './scale';

import { Chart } from 'chart.js';
import { TimestackScale } from './scale';

declare module 'chart.js' {
  export interface CartesianScaleTypeRegistry {
    timestack: {
      options: TimestackScaleOptions;
    };
  }
}

Chart.register(TimestackScale);

export type { TimestackScaleOptions } from './scale';
export { TimestackScale, DEF_TOOLTIP_FORMAT } from './scale';
export { TickGenerator, DaysTickGenerator, YearsTickGenerator } from './ticks';
export { DEF_TICK_GENERATORS, HM, HMS, MD, MDAY, MON, YEAR, YM, YMD } from './defgens';
