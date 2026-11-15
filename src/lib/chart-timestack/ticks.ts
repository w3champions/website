import type { Tick } from 'chart.js';

import type { DateTimeJSOptions } from './measure';
import { measure_max_label_width } from './measure';

export interface TopTickSpec {
  fmt: Intl.DateTimeFormatOptions;
  maj_fmt?: Intl.DateTimeFormatOptions;
}

export interface BottomTickSpec {
  short_fmt: Intl.DateTimeFormatOptions;
  long_fmt?: Intl.DateTimeFormatOptions;
}

type DateTimeUnit = 'second' | 'minute' | 'hour' | 'day' | 'month' | 'year';
export type DurationLikeObject = Partial<{ year: number; month: number; day: number; hour: number; minute: number; second: number }>;

interface SeqTick {
  dt: Date;
  is_major: boolean;
  with_bottom: boolean;
}

/**
 Base tick generator class.
 Concrete tick generators must implement the *seq method
 */
function formatDate(dt: Date, fmt: Intl.DateTimeFormatOptions, opts: DateTimeJSOptions) {
  return new Intl.DateTimeFormat(opts.locale, { timeZone: opts.timeZone, ...fmt }).format(dt);
}

function startOfUnit(date: Date, unit: DateTimeUnit): Date {
  const d = new Date(date.getTime());
  switch (unit) {
    case 'second':
      d.setMilliseconds(0);
      return d;
    case 'minute':
      d.setSeconds(0, 0);
      return d;
    case 'hour':
      d.setMinutes(0, 0, 0);
      return d;
    case 'day':
      d.setHours(0, 0, 0, 0);
      return d;
    case 'month':
      d.setDate(1);
      d.setHours(0, 0, 0, 0);
      return d;
    case 'year':
      d.setMonth(0, 1);
      d.setHours(0, 0, 0, 0);
      return d;
  }
}

function isStartOf(date: Date, unit: DateTimeUnit): boolean {
  return startOfUnit(date, unit).getTime() === date.getTime();
}

function addDuration(date: Date, step: DurationLikeObject): Date {
  const d = new Date(date.getTime());
  if (step.year) d.setFullYear(d.getFullYear() + step.year);
  if (step.month) d.setMonth(d.getMonth() + step.month);
  if (step.day) d.setDate(d.getDate() + step.day);
  if (step.hour) d.setHours(d.getHours() + step.hour);
  if (step.minute) d.setMinutes(d.getMinutes() + step.minute);
  if (step.second) d.setSeconds(d.getSeconds() + step.second);
  return d;
}

function durationMs(step: DurationLikeObject): number {
  const sec = (step.second ?? 0) + (step.minute ?? 0) * 60 + (step.hour ?? 0) * 3600 + (step.day ?? 0) * 86400 + (step.month ?? 0) * 30 * 86400 + (step.year ?? 0) * 365 * 86400;
  return sec * 1000;
}

export class TickGenerator {
  top: TopTickSpec & { size: number };
  bottom?: BottomTickSpec & { size: number };

  /** Generator yielding (possibly infinite) sequence of _SeqTick-s. It's ok to return the ticks
   * before the 'from'
   */
  *seq(from: Date): Generator<SeqTick> {}

  constructor(top: TopTickSpec & { size: number }, bottom?: BottomTickSpec & { size: number }) {
    this.top = top;
    this.bottom = bottom;
  }

  estimate(range: number, ctx: CanvasRenderingContext2D, opts: DateTimeJSOptions, may_be_long: boolean = true) {
    const top = this.top;
    const bottom = this.bottom;

    const normal = measure_max_label_width(top.fmt, ctx, opts);
    const major = top.maj_fmt ? measure_max_label_width(top.maj_fmt, ctx, opts) : 0;
    const top_est = { nticks: range / top.size, label_width: Math.max(normal, major) };

    let bottom_est;

    if (bottom) {
      const short = measure_max_label_width(bottom.short_fmt, ctx, opts);
      const long = may_be_long && bottom.long_fmt ? measure_max_label_width(bottom.long_fmt, ctx, opts) : 0;

      bottom_est = { nticks: range / bottom.size, label_width: Math.max(short, long) };
    }

    return { top: top_est, bottom: bottom_est };
  }

  format(dt: Date, is_major: boolean, with_bottom: boolean, prefer_long_bottom: boolean, opts: DateTimeJSOptions) {
    const top = formatDate(dt, is_major && this.top.maj_fmt ? this.top.maj_fmt : this.top.fmt, opts);

    if (!with_bottom || !this.bottom) return top;

    const bottom = formatDate(
      dt,
      prefer_long_bottom && this.bottom.long_fmt ? this.bottom.long_fmt : this.bottom.short_fmt,
      opts
    );
    return [top, bottom];
  }

  create(from: Date, to: Date, prefer_long_bottom: (dt: Date) => boolean, opts: DateTimeJSOptions): Tick[] {
    const ticks: Tick[] = [];

    for (const { dt, is_major, with_bottom } of this.seq(from)) {
      if (dt < from) continue;
      if (dt >= to) break;
      ticks.push({
        value: dt.getTime(),
        major: is_major,
        label: this.format(dt, is_major, with_bottom, prefer_long_bottom(dt), opts),
      });
    }

    return ticks;
  }

  create_floating(dt: Date, pos: 'left' | 'right', prefer_long_bottom: (dt: Date) => boolean, opts: DateTimeJSOptions) {
    const bottom = this.bottom;
    const fmt = bottom ? (prefer_long_bottom(dt) && bottom.long_fmt ? bottom.long_fmt : bottom.short_fmt) : undefined;
    const text = fmt ? formatDate(dt, fmt, opts) : '';

    return { value: dt.getTime(), label: ['', text] };
  }

  // Convenience method to apply some global changes to formats.
  // Intended to override hour12, numeric => 2-digit etc
  patch_formats(patch: Intl.DateTimeFormatOptions) {
    function apply(dst: any) {
      for (const e of Object.entries(patch)) {
        const k = e[0];
        const v = e[1];
        if (k === 'hour12' && dst.hour) dst.hour12 = v;
        if (dst[k]) dst[k] = e[1];
      }
    }

    apply(this.top.fmt);
    this.top.maj_fmt && apply(this.top.maj_fmt);
    this.bottom?.short_fmt && apply(this.bottom.short_fmt);
    this.bottom?.long_fmt && apply(this.bottom.long_fmt);
  }
}

export class MonoTickGenerator extends TickGenerator {
  step: DurationLikeObject;
  align: DateTimeUnit;
  bottom_unit?: DateTimeUnit;
  maj_unit?: DateTimeUnit;

  constructor(
    top: TopTickSpec & DurationLikeObject & { align: DateTimeUnit; maj_unit?: DateTimeUnit },
    bottom: (BottomTickSpec & { unit: DateTimeUnit }) | undefined
  ) {
    const { fmt, maj_fmt, align, maj_unit, ...top_duration } = top;
    super(
      {
        fmt,
        maj_fmt,
        size: durationMs(top_duration),
      },
      bottom && {
        ...bottom,
        size: durationMs({ [bottom.unit]: 1 } as any),
      }
    );

    this.step = top_duration;
    this.bottom_unit = bottom?.unit;
    this.align = align;
    this.maj_unit = maj_unit;
  }

  *seq(from: Date) {
    let dt = startOfUnit(from, this.align);
    while (true) {
      const with_bottom = this.bottom_unit ? isStartOf(dt, this.bottom_unit) : false;
      const is_major = this.maj_unit ? isStartOf(dt, this.maj_unit) : false;
      yield { dt, is_major, with_bottom };
      dt = addDuration(dt, this.step);
    }
  }
}

export class DaysTickGenerator extends TickGenerator {
  days: number[];
  maj_days: number[];
  bottom_days: number[];

  constructor(
    top: TopTickSpec & { days: number[]; step: number; maj_days?: number[] },
    bottom?: BottomTickSpec & { days?: number[] }
  ) {
    super(
      {
        ...top,
        size: top.step * 86400 * 1000,
      },
      bottom && {
        ...bottom,
        size: 30 * 86400 * 1000,
      }
    );

    this.days = top.days;
    this.maj_days = top.maj_days ?? [1];
    this.bottom_days = bottom ? bottom.days ?? [1] : [];
  }

  *seq(from: Date) {
    let mdt = startOfUnit(from, 'month');
    while (true) {
      for (const day of this.days) {
        const dt = new Date(mdt.getFullYear(), mdt.getMonth(), day, mdt.getHours(), mdt.getMinutes(), mdt.getSeconds());
        const is_major = this.maj_days.includes(day);
        const with_bottom = this.bottom_days.includes(day);
        yield { dt, is_major, with_bottom };
      }
      mdt = addDuration(mdt, { month: 1 });
    }
  }
}

export class YearsTickGenerator extends TickGenerator {
  by_years: number;

  constructor(by_years: number, top: TopTickSpec) {
    super({
      ...top,
      size: by_years * 365 * 86400 * 1000,
    });
    this.by_years = by_years;
  }

  *seq(from: Date) {
    const start = (Math.floor(from.getFullYear() / this.by_years)) * this.by_years;
    let dt = startOfUnit(from, 'year');
    dt.setFullYear(start);

    while (true) {
      yield { dt, is_major: false, with_bottom: false };
      dt = addDuration(dt, { year: this.by_years });
    }
  }
}
