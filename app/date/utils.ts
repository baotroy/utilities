import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);

enum TimestampUnit {
  SECOND = "second",
  MINUTE = "minute",
  HOUR = "hour",
  DAY = "day",
  WEEK = "week",
  MONTH = "month",
  YEAR = "year",
}

type TimestampDifferenceType = {
  second: number;
  minute: number;
  hour: number;
  day: number;
  week: number;
  month: number;
  year: number;
};
type NearestUnitType = { value: number; unit: string; past: boolean };

export const getCurrent = (): number => Math.floor(Date.now() / 1000);
export const getTimestampUnit = (timestamp?: number): string => {
  if (!timestamp) return "";
  const s =
    timestamp.toString().length > 20
      ? timestamp.toString().substring(0, 20)
      : timestamp.toString();

  if (s.length >= 17) {
    return "nanoseconds (1 billionth of a second)"; // Very unlikely in standard JavaScript
  } else if (s.length >= 15) {
    return "microseconds (1/1,000,000 second)"; // Likely custom implementation, not standard JavaScript
  } else if (s.length >= 12) {
    return "milliseconds"; // Timestamp is in milliseconds
  }
  return "seconds"; // Timestamp is in seconds
};

const dateDiff = (timestamp: number): TimestampDifferenceType => {
  const s = formatString(timestamp.toString());
  const now = dayjs();
  const then = dayjs(parseInt(s));
  return {
    second: then.diff(now, TimestampUnit.SECOND, true),
    minute: then.diff(now, TimestampUnit.MINUTE, true),
    hour: then.diff(now, TimestampUnit.HOUR, true),
    day: then.diff(now, TimestampUnit.DAY, true),
    week: then.diff(now, TimestampUnit.WEEK, true),
    month: then.diff(now, TimestampUnit.MONTH, true),
    year: then.diff(now, TimestampUnit.YEAR, true),
  };
};

const formatString = (str: string): string => {
  if (str.length > 13) {
    return str.slice(0, 13);
  } else {
    return str.padEnd(13, "0");
  }
};

const convertSecondsToNearestUnit = (
  differences: TimestampDifferenceType
): NearestUnitType => {
  const units = Object.keys(differences).reverse() as Array<
    keyof TimestampDifferenceType
  >;

  for (const unit of units) {
    const past = differences[unit] < 0;
    const value = Math.abs(Math.round(differences[unit]));
    if (Math.abs(differences[unit]) < 1) {
      continue;
    }
    return { value, unit, past };
  }
  return { value: 0, unit: TimestampUnit.SECOND, past: false };
};

export const getRelativeTime = (timestamp?: number): string => {
  if (!timestamp) return "";
  const { value, unit, past } = convertSecondsToNearestUnit(
    dateDiff(timestamp)
  );

  let message = "";

  if (unit === TimestampUnit.SECOND) {
    message = "a few seconds";
  } else if (unit === TimestampUnit.MINUTE) {
    message = `${value} minute${value > 1 ? "s" : ""}`;
  } else if (unit === TimestampUnit.HOUR) {
    message = `${value} hour${value > 1 ? "s" : ""}`;
  } else if (unit === TimestampUnit.DAY) {
    message = `${value} day${value > 1 ? "s" : ""}`;
  } else if (unit === TimestampUnit.WEEK) {
    message = `${value} week${value > 1 ? "s" : ""}`;
  } else if (unit === TimestampUnit.MONTH) {
    message = `${value} month${value > 1 ? "s" : ""}`;
  } else if (unit === TimestampUnit.YEAR) {
    message = `${value} year${value > 1 ? "s" : ""}`;
  }

  return past ? `${message} ago` : `in ${message}`;
};

export const dateFormat = (timestamp?: number, utc = false): string => {
  if (!timestamp) return "";
  return utc
    ? dayjs(parseInt(formatString(timestamp.toString())))
      .utc()
      .format("dddd, MMMM D, YYYY h:mm:ss A")
    : dayjs(parseInt(formatString(timestamp.toString()))).format("dddd, MMMM D, YYYY h:mm:ss A");
};

export const createTimeUnix = (dateStr: string, utc = false): number => {
  return utc ? dayjs.utc(dateStr).unix() : dayjs(dateStr).unix();
}

export const getTimezoneOffsetFormat = () => {
  const now = new Date();
  const offsetInMinutes = now.getTimezoneOffset();

  // Convert offset to hours and minutes
  const hoursOffset = Math.floor(Math.abs(offsetInMinutes) / 60);
  const minutesOffset = Math.abs(offsetInMinutes) % 60;
  const offsetSign = offsetInMinutes > 0 ? "-" : "+";

  return `GMT${offsetSign}${hoursOffset
    .toString()
    .padStart(2, "0")}:${minutesOffset.toString().padStart(2, "0")}`;
};