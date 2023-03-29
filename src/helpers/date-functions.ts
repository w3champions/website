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
