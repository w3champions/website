export interface DateObjectUnits {
  year?: number;
  month?: number;
  day?: number;
  hour?: number;
  minute?: number;
  second?: number;
}
export interface DateTimeJSOptions {
  locale?: string;
  timeZone?: string; // maps to Intl.DateTimeFormatOptions.timeZone
}

const _widest_dates_cache = new Map<string, Record<string, DateObjectUnits>>();
const _widest_labels_cache = new Map<string, number>();

function formatDate(dt: Date, format: Intl.DateTimeFormatOptions, opts: DateTimeJSOptions) {
  const fmt = new Intl.DateTimeFormat(opts.locale, { timeZone: opts.timeZone, ...format });
  return fmt.format(dt);
}

function makeDate(units: DateObjectUnits): Date {
  const year = units.year ?? 2024;
  const month = (units.month ?? 12) - 1; // JS Date month is 0-based
  const day = units.day ?? 22;
  const hour = units.hour ?? 23;
  const minute = units.minute ?? 59;
  const second = units.second ?? 59;
  return new Date(year, month, day, hour, minute, second);
}

function _pick_widest_sample(
  ctx: CanvasRenderingContext2D,
  samples: Generator<Date>,
  format: Intl.DateTimeFormatOptions,
  opts: DateTimeJSOptions
) {
  let longest: [Date, number, string?] = [{} as any, 0];

  for (const dt of samples) {
    const text = formatDate(dt, format, opts);
    const width = ctx.measureText(text).width;

    if (width > longest[1]) longest = [dt, width, text];
  }

  return longest[0];
}

// The trick is: widest locals dates depend on months and weeks names only.
// For the time part let's choose the daytime with two digits at each unit. These digits are better contain no narrow 1's.
// Then the widest months (short and long) are found looping thru all 12 months.
// The dates with widest weekdays ((short, long and narrow) are found in 20ths of these months. Then these dates are guaranteed to be the widest
// even if month is rendered as number.
export function find_widest_local_date(
  key: string,
  format: Intl.DateTimeFormatOptions,
  ctx: CanvasRenderingContext2D,
  opts: DateTimeJSOptions
): DateObjectUnits {
  const id = `${format.month}/${format.weekday}`;

  const cached = _widest_dates_cache.get(key);
  if (cached) return cached[id];

  const widest_numeric_date: DateObjectUnits = { year: 2024, month: 12, day: 22, hour: 23, minute: 59, second: 59 };
  const num = makeDate(widest_numeric_date);

  function* months_candidates(base: Date) {
    for (let i = 1; i <= 12; i++) yield new Date(base.getFullYear(), i - 1, base.getDate(), base.getHours(), base.getMinutes(), base.getSeconds());
  }

  const sm = _pick_widest_sample(ctx, months_candidates(num), { month: 'short' }, opts);
  const lm = _pick_widest_sample(ctx, months_candidates(num), { month: 'long' }, opts);

  function* weekdays_candidates(base: Date) {
    for (let i = 22; i < 29; i++) yield new Date(base.getFullYear(), base.getMonth(), i, base.getHours(), base.getMinutes(), base.getSeconds());
  }

  const sm_sw = _pick_widest_sample(ctx, weekdays_candidates(sm), { weekday: 'short' }, opts);
  const sm_lw = _pick_widest_sample(ctx, weekdays_candidates(sm), { weekday: 'long' }, opts);
  const sm_nw = _pick_widest_sample(ctx, weekdays_candidates(sm), { weekday: 'narrow' }, opts);

  const lm_sw = _pick_widest_sample(ctx, weekdays_candidates(lm), { weekday: 'short' }, opts);
  const lm_lw = _pick_widest_sample(ctx, weekdays_candidates(lm), { weekday: 'long' }, opts);
  const lm_nw = _pick_widest_sample(ctx, weekdays_candidates(lm), { weekday: 'narrow' }, opts);

  // ok now form the month/weekday permutations manually.
  // it's simpler than looping
  const perms: Record<string, Date> = {
    'undefined/undefined': num,
    'undefined/short': sm_sw,
    'undefined/long': sm_lw,
    'undefined/narrow': sm_nw,

    'numeric/undefined': num,
    'numeric/short': sm_sw,
    'numeric/long': sm_lw,
    'numeric/narrow': sm_nw,

    '2-digit/undefined': num,
    '2-digit/short': sm_sw,
    '2-digit/long': sm_lw,
    '2-digit/narrow': sm_nw,

    'short/undefined': sm,
    'short/short': sm_sw,
    'short/long': sm_lw,
    'short/narrow': sm_nw,

    'long/undefined': lm,
    'long/short': lm_sw,
    'long/long': lm_lw,
    'long/narrow': lm_nw,
  };

  const result: Record<string, DateObjectUnits> = Object.fromEntries(
    Object.entries(perms).map(([k, v]) => [k, { year: v.getFullYear(), month: v.getMonth() + 1, day: v.getDate(), hour: v.getHours(), minute: v.getMinutes(), second: v.getSeconds() }])
  );

  _widest_dates_cache.set(key, result);

  return result[id];
}

export function measure_max_label_width(
  format: Intl.DateTimeFormatOptions,
  ctx: CanvasRenderingContext2D,
  opts: DateTimeJSOptions
) {
  const format_key = JSON.stringify(format);

  const dt_key = `${opts.locale || 'default'}/${ctx.font}`;
  const label_key = `${dt_key}/${format_key}`;

  const cached = _widest_labels_cache.get(label_key);
  if (cached) return cached;

  const widest_date = find_widest_local_date(dt_key, format, ctx, opts);

  const dt = makeDate(widest_date);
  const label = formatDate(dt, format, opts);
  const res = ctx.measureText(label).width;

  _widest_labels_cache.set(label_key, res);
  return res;
}
