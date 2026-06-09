import { Duration, format, getUnixTime, intervalToDuration, parseJSON } from "date-fns";
import { timestampString } from "@/store/types";

export const formatSecondsToDuration = (seconds: number): string => {
  const duration: Duration = intervalToDuration({ start: 0, end: seconds * 1000 });
  let result: string = duration.minutes?.toString().padStart(2, "0") + ":" + duration.seconds?.toString().padStart(2, "0");
  if (duration.hours !== undefined && 0 < duration.hours) {
    result = duration.hours.toString() + ":" + result;
  }
  return result;
};

export const formatDateToDateWeekday = (d: Date): string => {
  return format(d, "yyyy-MM-dd p");
};

export const formatTimestampStringToUnixTime = (str: timestampString): number => {
  return getUnixTime(parseJSON(str));
};

export const formatTimestampStringToDate = (str: timestampString): string => {
  return format(parseJSON(str), "dd-MMM-yyyy");
};

export const formatTimestampStringToDateTime = (str: timestampString): string => {
  return format(parseJSON(str), "dd-MMM-yyyy HH:mm");
};

export const formatTimestampStringToRelativeTime = (str: timestampString, locale?: string): string => {
  const secondsFromNow = (parseJSON(str).getTime() - Date.now()) / 1000;
  const ranges: Array<{ maxSeconds: number; divisor: number; unit: Intl.RelativeTimeFormatUnit }> = [
    { maxSeconds: 45, divisor: 1, unit: "second" },
    { maxSeconds: 45 * 60, divisor: 60, unit: "minute" },
    { maxSeconds: 22 * 60 * 60, divisor: 60 * 60, unit: "hour" },
    { maxSeconds: 26 * 24 * 60 * 60, divisor: 24 * 60 * 60, unit: "day" },
    { maxSeconds: 45 * 24 * 60 * 60, divisor: 7 * 24 * 60 * 60, unit: "week" },
    { maxSeconds: 320 * 24 * 60 * 60, divisor: 30 * 24 * 60 * 60, unit: "month" },
    { maxSeconds: Number.POSITIVE_INFINITY, divisor: 365 * 24 * 60 * 60, unit: "year" },
  ];
  const range = ranges.find((candidate) => Math.abs(secondsFromNow) < candidate.maxSeconds) ?? ranges[ranges.length - 1];

  return new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(
    Math.round(secondsFromNow / range.divisor),
    range.unit,
  );
};

export const formatTimestampString = (str: timestampString | Date, formatting: string): string => {
  return format(parseJSON(str), formatting);
};

// Converts a date string formatted as "yyyy-MM-dd" to 'yyyy-MM-ddTHH:mm:ss.SSSZ", where the time is the current UTC time.
// Example: "2023-05-15" becomes "2023-05-15T19:39:49.603Z"
export const dateToCurrentTimeDate = (endDateString: string): string => {
  if (!endDateString) return "";
  const endDate = new Date(endDateString);
  const now = new Date();
  now.setDate(endDate.getDate());
  now.setMonth(endDate.getMonth());
  now.setFullYear(endDate.getFullYear());
  return now.toISOString();
};
