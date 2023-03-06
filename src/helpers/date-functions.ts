import { Duration, intervalToDuration } from "date-fns";

export const formatSecondsToDuration = (seconds: number): string => {
  const duration: Duration = intervalToDuration({ start: 0, end: seconds * 1000 });
  let result: string = duration.minutes?.toString().padStart(2, "0") + ":" + duration.seconds?.toString().padStart(2, "0");
  if (duration.hours !== undefined && 0 < duration.hours) {
    result = duration.hours.toString() + ":" + result;
  }
  return result;
};
