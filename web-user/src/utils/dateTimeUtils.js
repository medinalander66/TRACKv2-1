// Builds a correct UTC ISO string from LOCAL wall-clock date+time parts.
// Using the Date constructor's numeric-args form (not string parsing) avoids
// any ambiguity — the browser always treats numeric args as local time, then
// .toISOString() converts that exact instant to UTC for storage.
export function buildLocalDateTimeISO(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hours, minutes] = timeStr.split(":").map(Number);
  const dt = new Date(year, month - 1, day, hours, minutes, 0, 0);
  return dt.toISOString();
}

// Splits a stored UTC datetime string back into LOCAL date/time parts,
// for populating <input type="date"> / <input type="time"> fields correctly.
export function splitISOToLocalParts(isoString) {
  if (!isoString) return { date: "", time: "" };
  const d = new Date(isoString);
  const pad = (n) => String(n).padStart(2, "0");
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return { date, time };
}