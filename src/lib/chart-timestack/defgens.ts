import type { TickGenerator} from './ticks';
import { DaysTickGenerator, MonoTickGenerator, YearsTickGenerator } from './ticks';


export const HMS: Intl.DateTimeFormatOptions = {
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
};
export const HM: Intl.DateTimeFormatOptions = {
  hour: 'numeric',
  minute: 'numeric',
};
export const MDAY: Intl.DateTimeFormatOptions = {
  day: 'numeric',
};
export const MON: Intl.DateTimeFormatOptions = {
  month: 'short',
};
export const YEAR: Intl.DateTimeFormatOptions = {
  year: 'numeric',
};

export const YMD: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
};
export const YM: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'short',
};
export const MD: Intl.DateTimeFormatOptions = {
  month: 'short',
  day: 'numeric',
};

export const DEF_TICK_GENERATORS: TickGenerator[] = [
  // seconds
  new MonoTickGenerator(
    { second: 1, align: 'second', maj_unit: 'minute', fmt: HMS, maj_fmt: HM },
    { unit: 'day', short_fmt: MD, long_fmt: YMD }
  ),
  new MonoTickGenerator(
    { second: 5, align: 'minute', maj_unit: 'minute', fmt: HMS, maj_fmt: HM },
    { unit: 'day', short_fmt: MD, long_fmt: YMD }
  ),
  new MonoTickGenerator(
    { second: 10, align: 'minute', maj_unit: 'minute', fmt: HMS, maj_fmt: HM },
    { unit: 'day', short_fmt: MD, long_fmt: YMD }
  ),
  new MonoTickGenerator(
    { second: 30, align: 'minute', maj_unit: 'minute', fmt: HMS, maj_fmt: HM },
    { unit: 'day', short_fmt: MD, long_fmt: YMD }
  ),
  // minutes
  new MonoTickGenerator(
    { minute: 1, align: 'minute', maj_unit: 'hour', fmt: HM },
    { unit: 'day', short_fmt: MD, long_fmt: YMD }
  ),
  new MonoTickGenerator(
    { minute: 5, align: 'hour', maj_unit: 'hour', fmt: HM },
    { unit: 'day', short_fmt: MD, long_fmt: YMD }
  ),
  new MonoTickGenerator(
    { minute: 10, align: 'hour', maj_unit: 'hour', fmt: HM },
    { unit: 'day', short_fmt: MD, long_fmt: YMD }
  ),
  new MonoTickGenerator(
    { minute: 15, align: 'hour', maj_unit: 'hour', fmt: HM },
    { unit: 'day', short_fmt: MD, long_fmt: YMD }
  ),
  new MonoTickGenerator(
    { minute: 30, align: 'hour', maj_unit: 'hour', fmt: HM },
    { unit: 'day', short_fmt: MD, long_fmt: YMD }
  ),
  // hours
  new MonoTickGenerator(
    { hour: 1, align: 'hour', maj_unit: 'day', fmt: HM },
    { unit: 'day', short_fmt: MD, long_fmt: YMD }
  ),
  new MonoTickGenerator(
    { hour: 3, align: 'day', maj_unit: 'day', fmt: HM },
    { unit: 'day', short_fmt: MD, long_fmt: YMD }
  ),
  new MonoTickGenerator(
    { hour: 6, align: 'day', maj_unit: 'day', fmt: HM },
    { unit: 'day', short_fmt: MD, long_fmt: YMD }
  ),
  new MonoTickGenerator(
    { hour: 12, align: 'day', maj_unit: 'day', fmt: HM },
    { unit: 'day', short_fmt: MD, long_fmt: YMD }
  ),
  // days
  new MonoTickGenerator(
    { day: 1, align: 'day', maj_unit: 'month', fmt: MDAY },
    { unit: 'month', short_fmt: MON, long_fmt: YM }
  ),
  new DaysTickGenerator({ days: [1, 5, 10, 15, 20, 25], step: 5, fmt: MDAY }, { short_fmt: MON, long_fmt: YM }),
  new DaysTickGenerator({ days: [1, 10, 20], step: 10, fmt: MDAY }, { short_fmt: MON, long_fmt: YM }),
  new DaysTickGenerator({ days: [1, 15], step: 15, fmt: MDAY }, { short_fmt: MON, long_fmt: YM }),
  // months. treats month duration as 30 days in default 'casual' mode
  new MonoTickGenerator({ month: 1, align: 'month', maj_unit: 'year', fmt: MON }, { unit: 'year', short_fmt: YEAR }),
  new MonoTickGenerator({ month: 3, align: 'year', maj_unit: 'year', fmt: MON }, { unit: 'year', short_fmt: YEAR }),
  new MonoTickGenerator({ month: 6, align: 'year', maj_unit: 'year', fmt: MON }, { unit: 'year', short_fmt: YEAR }),
  // years. year duration is 365 days by default
  new YearsTickGenerator(1, { fmt: YEAR }),
  new YearsTickGenerator(5, { fmt: YEAR }),
  new YearsTickGenerator(10, { fmt: YEAR }),
  new YearsTickGenerator(25, { fmt: YEAR }),
  new YearsTickGenerator(50, { fmt: YEAR }),
  new YearsTickGenerator(100, { fmt: YEAR }),
  // fallback )
  new YearsTickGenerator(1000, { fmt: YEAR }),
];
