import { InvalidOpeningHoursException } from '../exceptions/restaurant.exceptions';
 
/**
 * Parses "HH:MM" into total minutes from midnight.
 */
export function parseTime(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}
 
/**
 * Validates that opensAt < closesAt and neither value is identical.
 * For overnight shifts (e.g. 22:00–02:00) closesAt can be "00:00"
 * representing midnight — we treat that as 24:00 internally.
 */
export function validateShift(opensAt: string, closesAt: string): void {
  if (closesAt === '00:00') return; // midnight end — valid
 
  const open  = parseTime(opensAt);
  const close = parseTime(closesAt);
 
  if (open >= close) {
    throw new InvalidOpeningHoursException(
      `opensAt (${opensAt}) must be earlier than closesAt (${closesAt}).`,
    );
  }
}
 
/**
 * Checks two shifts for the same day don't overlap.
 * e.g.  shift0: 08:00–14:00, shift1: 15:00–22:00  → valid
 *       shift0: 08:00–16:00, shift1: 14:00–22:00  → overlap error
 */
export function validateNoOverlap(
  shifts: Array<{ opensAt: string; closesAt: string }>,
): void {
  if (shifts.length < 2) return;
 
  const sorted = [...shifts].sort((a, b) => parseTime(a.opensAt) - parseTime(b.opensAt));
 
  for (let i = 0; i < sorted.length - 1; i++) {
    const currentEnd = parseTime(sorted[i].closesAt);
    const nextStart  = parseTime(sorted[i + 1].opensAt);
 
    if (currentEnd > nextStart) {
      throw new InvalidOpeningHoursException(
        `Shift ending at ${sorted[i].closesAt} overlaps with shift starting at ${sorted[i + 1].opensAt}.`,
      );
    }
  }
}
 
/**
 * Returns the current day of week as a Prisma DayOfWeek enum value.
 */
export function getCurrentDayOfWeek(): string {
  const days = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'];
  return days[new Date().getDay()];
}
 
/**
 * Checks whether a restaurant should be open right now based on its opening hours.
 * Returns true if the current time falls within any shift for today.
 */
export function isRestaurantOpenNow(
  hours: Array<{ dayOfWeek: string; opensAt: string; closesAt: string; isClosed: boolean }>,
): boolean {
  const today      = getCurrentDayOfWeek();
  const todayHours = hours.filter((h) => h.dayOfWeek === today && !h.isClosed);
  if (!todayHours.length) return false;
 
  const now     = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
 
  return todayHours.some((h) => {
    const open  = parseTime(h.opensAt);
    const close = h.closesAt === '00:00' ? 24 * 60 : parseTime(h.closesAt);
    return nowMins >= open && nowMins < close;
  });
}