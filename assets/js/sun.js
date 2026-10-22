// Solar position and sunrise/sunset for a fixed place (NOAA solar calculator equations).
// The page shows the sky as it is right now at HOME, so the sun rises and sets with the real times.
export const HOME = { lat: 47.3769, lon: 8.5417, name: 'Zürich' };

const rad = (d) => (d * Math.PI) / 180;
const deg = (r) => (r * 180) / Math.PI;

function params(date) {
  const jd = date.getTime() / 86400000 + 2440587.5;
  const jc = (jd - 2451545) / 36525;
  const L0 = (280.46646 + jc * (36000.76983 + jc * 0.0003032)) % 360;
  const M = 357.52911 + jc * (35999.05029 - 0.0001537 * jc);
  const e = 0.016708634 - jc * (0.000042037 + 0.0000001267 * jc);
  const C = Math.sin(rad(M)) * (1.914602 - jc * (0.004817 + 0.000014 * jc)) + Math.sin(rad(2 * M)) * (0.019993 - 0.000101 * jc) + Math.sin(rad(3 * M)) * 0.000289;
  const trueLong = L0 + C;
  const omega = 125.04 - 1934.136 * jc;
  const appLong = trueLong - 0.00569 - 0.00478 * Math.sin(rad(omega));
  const meanObliq = 23 + (26 + (21.448 - jc * (46.815 + jc * (0.00059 - jc * 0.001813))) / 60) / 60;
  const obliq = meanObliq + 0.00256 * Math.cos(rad(omega));
  const decl = deg(Math.asin(Math.sin(rad(obliq)) * Math.sin(rad(appLong))));
  const y = Math.tan(rad(obliq / 2)) ** 2;
  const eqTime = 4 * deg(y * Math.sin(2 * rad(L0)) - 2 * e * Math.sin(rad(M)) + 4 * e * y * Math.sin(rad(M)) * Math.cos(2 * rad(L0)) - 0.5 * y * y * Math.sin(4 * rad(L0)) - 1.25 * e * e * Math.sin(2 * rad(M)));
  return { decl, eqTime };
}

// Minutes after UTC midnight at which the sun reaches `zenith` degrees (90.833 = sunrise/sunset, 96 = civil dawn/dusk).
function crossing(date, lat, lon, zenith) {
  const { decl, eqTime } = params(date);
  const cosHA = Math.cos(rad(zenith)) / (Math.cos(rad(lat)) * Math.cos(rad(decl))) - Math.tan(rad(lat)) * Math.tan(rad(decl));
  if (cosHA > 1) return null; // sun never rises that high (polar night)
  if (cosHA < -1) return 'always'; // sun never sets (midnight sun)
  const ha = deg(Math.acos(cosHA));
  const noon = 720 - 4 * lon - eqTime;
  return { rise: noon - 4 * ha, set: noon + 4 * ha, noon };
}

function utcMidnight(date) { return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())); }
const at = (midnight, minutes) => new Date(midnight.getTime() + minutes * 60000);

export function solar(date = new Date(), { lat, lon } = HOME) {
  const midnight = utcMidnight(date);
  const noonDate = at(midnight, 720);
  const day = crossing(noonDate, lat, lon, 90.833);
  const civil = crossing(noonDate, lat, lon, 96);
  const { decl, eqTime } = params(date);
  const minutes = (date.getTime() - midnight.getTime()) / 60000;
  const tst = (minutes + eqTime + 4 * lon + 1440) % 1440;
  const ha = tst / 4 < 0 ? tst / 4 + 180 : tst / 4 - 180;
  const zenith = deg(Math.acos(Math.sin(rad(lat)) * Math.sin(rad(decl)) + Math.cos(rad(lat)) * Math.cos(rad(decl)) * Math.cos(rad(ha))));
  const elevation = 90 - zenith;
  const noonElevation = 90 - Math.abs(lat - decl);
  const times = (c) => (c && c !== 'always' ? { rise: at(midnight, c.rise), set: at(midnight, c.set) } : null);
  return {
    elevation, noonElevation, decl,
    sunrise: times(day)?.rise ?? null, sunset: times(day)?.set ?? null,
    dawn: times(civil)?.rise ?? null, dusk: times(civil)?.set ?? null,
    noon: day && day !== 'always' ? at(midnight, day.noon) : null,
    polar: day === null ? 'night' : day === 'always' ? 'day' : null,
  };
}

// Phase of the day at `date`, and where to draw the sun or moon (x in %, y 0..1 above the horizon).
const MIN = 60000;
export function skyState(date = new Date(), home = HOME) {
  const s = solar(date, home);
  let phase;
  if (s.polar === 'night') phase = 'night';
  else if (s.polar === 'day') phase = 'day';
  else if (!s.dawn || date < s.dawn || date > s.dusk) phase = 'night';
  else if (date < new Date(s.sunrise.getTime() + 75 * MIN)) phase = 'morning';
  else if (date > new Date(s.sunset.getTime() - 75 * MIN)) phase = 'evening';
  else phase = 'day';

  let x = 50, y = 0.8;
  if (phase === 'night') {
    // the moon crosses the sky between dusk and the next dawn
    const dusk = s.dusk && date >= s.dusk ? s.dusk : new Date((s.dusk || date).getTime() - 24 * 60 * MIN);
    const nextDawn = new Date(dusk.getTime() + 24 * 60 * MIN - ((s.dusk?.getTime() ?? 0) - (s.dawn?.getTime() ?? 0)));
    const f = Math.min(1, Math.max(0, (date - dusk) / Math.max(1, nextDawn - dusk)));
    x = 8 + f * 84;
    y = Math.sin(Math.PI * f) * 0.85;
  } else if (s.sunrise && s.sunset) {
    const f = (date - s.sunrise) / (s.sunset - s.sunrise);
    x = 8 + Math.min(1.08, Math.max(-0.08, f)) * 84;
    y = Math.min(1, Math.max(0, s.elevation / 66)); // 66° is the highest the sun gets in Switzerland
  }
  return { phase, x, y, solar: s };
}

// Fixed positions used when the visitor picks a phase by hand.
export const MANUAL = {
  morning: { x: 14, y: 0.2 },
  day: { x: 52, y: 0.85 },
  evening: { x: 86, y: 0.18 },
  night: { x: 68, y: 0.75 },
};
