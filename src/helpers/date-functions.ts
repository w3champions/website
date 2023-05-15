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

export const formatTimestampString = (str: timestampString, formatting: string): string => {
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
