/**
 * Make a human-friendly timestamp string from the given Date instance.
 * @param date
 * @returns {string}
 */
export function readableTimestamp(date) {
  const pad = (digits, n) => n.toString().padStart(digits, "0");
  return [
    date.getFullYear(),
    pad(2, date.getMonth() + 1),
    pad(2, date.getDate()),
    pad(2, date.getHours()),
    pad(2, date.getMinutes()),
    pad(2, date.getSeconds()),
  ].join("");
}
