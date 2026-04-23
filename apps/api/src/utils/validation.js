import { DateTime } from "luxon";

export function isValidTimezone(timezone) {
  return DateTime.now().setZone(timezone).isValid;
}

export function normalizeStandupTime(standupTime) {
  const p = String(standupTime).match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  if (!p) {
    return null;
  }
  return `${String(p[1]).padStart(2, "0")}:${p[2]}`;
}

export function isValidCalendarDate(ymd, timeZone = "UTC") {
  const dt = DateTime.fromFormat(ymd, "yyyy-MM-dd", { zone: timeZone });
  return dt.isValid && dt.toFormat("yyyy-MM-dd") === ymd;
}
