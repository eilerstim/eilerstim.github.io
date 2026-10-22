// Guesses where the visitor is from their time zone, without asking for their location.
// Precise enough for sunrise and sunset (usually within a few minutes); nothing leaves the browser.
import zones from './zones.js';
import { HOME } from './sun.js';

export function guessPlace() {
  let zone = '';
  try { zone = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch { /* ignore */ }
  const hit = zones[zone];
  if (hit) {
    const city = zone.split('/').pop().replace(/_/g, ' ');
    return { lat: hit[0], lon: hit[1], name: city, zone, guessed: true };
  }
  // Unknown or fixed-offset zone: longitude from the UTC offset, latitude from the home base.
  const offsetHours = -new Date().getTimezoneOffset() / 60;
  if (!zone || /^(UTC|GMT|Etc\/)/.test(zone)) {
    return { lat: HOME.lat, lon: Math.max(-180, Math.min(180, offsetHours * 15)), name: zone || 'UTC', zone, guessed: false };
  }
  return { ...HOME, zone, guessed: false };
}
