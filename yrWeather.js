// yrWeather.js
// Drop-in fetcher for MET Norway (yr.no) Locationforecast 2.0 API.
// Browsers can't set required 'User-Agent', so call this THROUGH a tiny proxy (Worker/Function).
// Docs: https://api.met.no/doc/TermsOfService
const API_URL = (lat, lon) =>
  `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`;

function symbolToIconUrl(symbolCode){ return symbolCode ? `https://api.met.no/images/weathericons/svg/${symbolCode}.svg` : null; }
function safeNum(x){ return (typeof x === "number" && isFinite(x)) ? x : null; }
function pickSymbolAndPrecip(entry){
  if (!entry?.data) return { symbol: null, summary: null, precip: null };
  const n1 = entry.data.next_1_hours, n6 = entry.data.next_6_hours, n12 = entry.data.next_12_hours;
  const block = n1 || n6 || n12 || null;
  const symbol = block?.summary?.symbol_code || null;
  const summary = symbol ? symbol.replace(/_/g, " ") : null;
  const precip = block?.details?.precipitation_amount ?? null;
  return { symbol, summary, precip };
}

export async function fetchYrWeather(lat, lon, { fetchImpl = fetch, hours = 48, days = 7, proxyUrl = null } = {}){
  if (lat == null || lon == null) throw new Error("lat/lon required");
  const url = proxyUrl ? `${proxyUrl}?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}` : API_URL(lat, lon);
  const headers = proxyUrl ? {} : { "Accept": "application/json" };
  const res = await fetchImpl(url, { headers });
  if (!res.ok) throw new Error(`yr.no API error ${res.status}`);
  const json = await res.json();
  const ts = json?.properties?.timeseries || [];
  if (!ts.length) throw new Error("yr.no: empty timeseries");

  const first = ts[0];
  const nowD = first?.data?.instant?.details || {};
  const { symbol: nSym, summary: nSum, precip: nP } = pickSymbolAndPrecip(first);
  const now = {
    time: first?.time || null,
    tempC: safeNum(nowD.air_temperature),
    windMps: safeNum(nowD.wind_speed),
    humidityPct: safeNum(nowD.relative_humidity),
    pressureHpa: safeNum(nowD.air_pressure_at_sea_level),
    precipitationMm: safeNum(nP),
    symbol: nSym, summary: nSum, symbolUrl: symbolToIconUrl(nSym)
  };

  const hourly = ts.slice(0, Math.min(hours, ts.length)).map(entry => {
    const d = entry?.data?.instant?.details || {};
    const { symbol, precip } = pickSymbolAndPrecip(entry);
    return {
      time: entry?.time || null,
      tempC: safeNum(d.air_temperature),
      windMps: safeNum(d.wind_speed),
      precipitationMm: safeNum(precip),
      symbol, symbolUrl: symbolToIconUrl(symbol)
    };
  });

  const byDate = new Map();
  for (const entry of ts){
    const iso = entry?.time; if(!iso) continue;
    const date = iso.slice(0,10);
    const d = entry?.data?.instant?.details || {};
    const t = safeNum(d.air_temperature);
    const { symbol, precip } = pickSymbolAndPrecip(entry);
    if(!byDate.has(date)){
      byDate.set(date, { date, minC: t, maxC: t, precipitationMm: safeNum(precip) ?? 0, symbol });
    }else{
      const x = byDate.get(date);
      x.minC = (x.minC==null)? t : Math.min(x.minC, t ?? x.minC);
      x.maxC = (x.maxC==null)? t : Math.max(x.maxC, t ?? x.maxC);
      x.precipitationMm += safeNum(precip) ?? 0;
    }
  }
  const daily = Array.from(byDate.values()).slice(0, days).map(d => ({
    date: d.date, minC: safeNum(d.minC), maxC: safeNum(d.maxC),
    precipitationMm: safeNum(d.precipitationMm), symbol: d.symbol, symbolUrl: symbolToIconUrl(d.symbol)
  }));

  return { source: "yr.no", fetchedAt: new Date().toISOString(), now, hourly, daily, raw: json };
}

export function mpsToKmh(mps){ return (typeof mps === "number" && isFinite(mps)) ? (mps*3.6) : null; }
export function cToF(c){ return (typeof c === "number" && isFinite(c)) ? (c*9/5+32) : null; }
