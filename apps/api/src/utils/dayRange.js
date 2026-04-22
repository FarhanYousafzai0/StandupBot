import { DateTime } from "luxon";

/**
 * Calendar YYYY-MM-DD in the given IANA timezone for an instant in time.
 * @param {Date} utcDate
 * @param {string} timeZone
 * @returns {string}
 */
export function dayKeyForInstant(utcDate, timeZone) {
  return DateTime.fromJSDate(utcDate, { zone: "utc" })
    .setZone(timeZone)
    .toFormat("yyyy-MM-dd");
}

/**
 * Today's calendar date (YYYY-MM-DD) in the user's zone (wall clock "today").
 * @param {string} timeZone
 * @returns {string}
 */
export function getTodayYmdInZone(timeZone) {
  return DateTime.now().setZone(timeZone).toFormat("yyyy-MM-dd");
}

/**
 * [start, end] UTC `Date` bounds for that entire calendar day in `timeZone`.
 * @param {string} ymd - `YYYY-MM-DD`
 * @param {string} timeZone
 * @returns {{ start: Date, end: Date }}
 */
export function getUtcRangeForUserDay(ymd, timeZone) {
  const start = DateTime.fromFormat(ymd, "yyyy-MM-dd", { zone: timeZone })
    .startOf("day")
    .toUTC();
  const end = DateTime.fromFormat(ymd, "yyyy-MM-dd", { zone: timeZone })
    .endOf("day")
    .toUTC();
  if (!start.isValid || !end.isValid) {
    throw new Error(`Invalid date or timezone: ${ymd} / ${timeZone}`);
  }
  return { start: start.toJSDate(), end: end.toJSDate() };
}

/**
 * True when the user’s `standupTime` (e.g. "17:00") falls in the same 15-min wall-clock
 * quarter as "now" in their timezone (used by the auto-draft job).
 * @param {string} timeZone
 * @param {string} standupTime
 */
export function isUserInCurrentStandupQuarter(timeZone, standupTime) {
  const now = DateTime.now().setZone(timeZone);
  const p = String(standupTime).match(/^(\d{1,2}):(\d{2})$/);
  if (!p) {
    return false;
  }
  const standM = parseInt(p[1], 10) * 60 + parseInt(p[2], 10);
  const nowM = now.hour * 60 + now.minute;
  return Math.floor(standM / 15) === Math.floor(nowM / 15);
}
