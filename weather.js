// Weather App — now powered by MET Norway (yr.no)
// City search + geolocation, hourly or 1–5 day forecast, autosave, theme toggle.
import { fetchYrWeather, mpsToKmh } from './yrWeather.js';

const PROXY_URL = 'https://YOUR_WORKER_URL_OR_NETLIFY_FN'; // <- set your deployed proxy here

const $ = (s)=>document.querySelector(s);
const els = {
  themeToggle: $('#themeToggle'),
  form: $('#weatherForm'),
  city: $('#cityInput'),
  type: $('#forecastTypeSelect'),
  useLoc: $('#useLocationBtn'),
  reset: $('#resetBtn'),
  alert: $('#alert'),
  currentWrap: $('#currentWrap'),
  currentIcon: $('#currentIcon'),
  currentTitle: $('#currentTitle'),
  currentSub: $('#currentSub'),
  curTemp: $('#curTemp'), curFeels: $('#curFeels'), curHum: $('#curHum'), curWind: $('#curWind'),
  hourlyWrap: $('#hourlySection'), hourly: $('#hourlyForecastDisplay'),
  dailyWrap: $('#dailySection'), daily: $('#dailyForecastDisplay'),
};

function showAlert(msg){
  els.alert.textContent = msg;
  els.alert.classList.remove('hidden');
  clearTimeout(showAlert._t);
  showAlert._t = setTimeout(()=> els.alert.classList.add('hidden'), 4000);
}

// Theme
(function initTheme(){
  const saved = localStorage.getItem('weather-theme');
  if(saved === 'light'){ document.documentElement.classList.add('light'); els.themeToggle.textContent = '🌙'; }
})();
els.themeToggle.addEventListener('click', ()=>{
  document.documentElement.classList.toggle('light');
  const isLight = document.documentElement.classList.contains('light');
  localStorage.setItem('weather-theme', isLight ? 'light' : 'dark');
  els.themeToggle.textContent = isLight ? '🌙' : '☀️';
});

// Geocoding: keep Open‑Meteo's free geocoder for city -> lat/lon
async function geocodeCity(city){
  const url = 'https://geocoding-api.open-meteo.com/v1/search?count=1&language=en&format=json&name=' + encodeURIComponent(city);
  const res = await fetch(url);
  if(!res.ok) throw new Error('Geocoding failed.');
  const data = await res.json();
  if(!data.results?.length) throw new Error('City not found. Try a different name.');
  const r = data.results[0];
  return { name: r.name, country: r.country, lat: r.latitude, lon: r.longitude };
}

// Fetch forecast via yr.no helper
async function fetchForecast(lat, lon){
  return fetchYrWeather(lat, lon, { proxyUrl: PROXY_URL, hours: 48, days: 7 });
}

// Helpers
function fmtTemp(v){ return `${Math.round(v)}°C`; }
function fmtTime(iso, opts){ const d = new Date(iso); return d.toLocaleString([], opts); }
function setIcon(el, symbolUrl){ el.innerHTML = symbolUrl ? `<img src="${symbolUrl}" alt="" width="56" height="56" style="vertical-align:middle">` : '—'; }

// Rendering
function renderCurrent(meta, data){
  els.currentWrap.classList.remove('hidden');
  const n = data.now;
  setIcon(els.currentIcon, n.symbolUrl);
  els.currentTitle.textContent = meta.label;
  els.currentSub.textContent = `${n.summary || '—'} • ${fmtTime(n.time, {weekday:'short', hour:'2-digit', minute:'2-digit'})}`;
  els.curTemp.textContent = fmtTemp(n.tempC);
  els.curFeels.textContent = '—'; // yr.no doesn't provide "feels like" directly
  els.curHum.textContent = (n.humidityPct!=null) ? `${Math.round(n.humidityPct)}%` : '—';
  const wind = (n.windMps!=null) ? Math.round(mpsToKmh(n.windMps)) + ' km/h' : '—';
  els.curWind.textContent = wind;
}

function renderHourly(data){
  const rows = data.hourly.slice(0,24).map(h => {
    const t = fmtTime(h.time, {hour:'2-digit', minute:'2-digit'});
    const ico = h.symbolUrl ? `<img src="${h.symbolUrl}" alt="" width="28" height="28">` : '—';
    const wind = (h.windMps!=null) ? Math.round(mpsToKmh(h.windMps)) + ' km/h' : '—';
    const precip = (h.precipitationMm!=null) ? h.precipitationMm.toFixed(1)+'mm' : '—';
    return `<div class="forecast-card">
      <div class="time">${t}</div>
      <div class="ico">${ico}</div>
      <div class="temp">${fmtTemp(h.tempC)}</div>
      <div class="muted small">${wind} · ${precip}</div>
    </div>`;
  }).join('');
  els.hourly.innerHTML = rows;
}

function renderDaily(data, days){
  const rows = data.daily.slice(0, days).map(d => {
    const ico = d.symbolUrl ? `<img src="${d.symbolUrl}" alt="" width="28" height="28">` : '—';
    return `<div class="forecast-card">
      <div class="time">${d.date}</div>
      <div class="ico">${ico}</div>
      <div class="temp">${fmtTemp(d.minC)} / ${fmtTemp(d.maxC)}</div>
      <div class="muted small">${(d.precipitationMm??0).toFixed(1)} mm</div>
    </div>`;
  }).join('');
  els.daily.innerHTML = rows;
}

// Search handlers
async function searchByCity(city, kind){
  if(!city.trim()) return showAlert('Type a city name.');
  try{
    els.hourly.innerHTML = els.daily.innerHTML = '';
    const geo = await geocodeCity(city);
    const data = await fetchForecast(geo.lat, geo.lon);
    const meta = { label: `${geo.name}, ${geo.country}` };
    if(kind === 'hourly'){ els.dailyWrap.classList.add('hidden'); els.hourlyWrap.classList.remove('hidden'); renderCurrent(meta, data); renderHourly(data); }
    else { els.hourlyWrap.classList.add('hidden'); els.dailyWrap.classList.remove('hidden'); renderCurrent(meta, data); renderDaily(data, Number(kind)); }
    saveState({city: geo.name, country: geo.country, lat: geo.lat, lon: geo.lon, kind});
  }catch(e){ console.error(e); showAlert(e.message||'Search failed.'); }
}

async function searchByCoords(lat, lon, kind){
  try{
    els.hourly.innerHTML = els.daily.innerHTML = '';
    const data = await fetchForecast(lat, lon);
    const meta = { label: `Lat ${lat.toFixed(2)}, Lon ${lon.toFixed(2)}` };
    if(kind === 'hourly'){ els.dailyWrap.classList.add('hidden'); els.hourlyWrap.classList.remove('hidden'); renderCurrent(meta, data); renderHourly(data); }
    else { els.hourlyWrap.classList.add('hidden'); els.dailyWrap.classList.remove('hidden'); renderCurrent(meta, data); renderDaily(data, Number(kind)); }
    saveState({ lat, lon, kind });
  }catch(e){ console.error(e); showAlert(e.message||'Search failed.'); }
}

// Persist
function saveState(obj){ localStorage.setItem('weather-last', JSON.stringify(obj)); }
function loadState(){ try{ return JSON.parse(localStorage.getItem('weather-last')||'{}'); }catch{ return {}; } }

// Events
els.form.addEventListener('submit', (e)=>{
  e.preventDefault();
  const city = els.city.value.trim();
  const kind = els.type.value;
  searchByCity(city, kind);
});
els.useLoc.addEventListener('click', ()=>{
  if(!navigator.geolocation) return showAlert('Geolocation not supported.');
  navigator.geolocation.getCurrentPosition(
    (pos)=> searchByCoords(pos.coords.latitude, pos.coords.longitude, els.type.value),
    ()=> showAlert('Could not get your location.')
  );
});
els.reset.addEventListener('click', ()=>{
  els.city.value = '';
  els.currentWrap.classList.add('hidden');
  els.hourly.innerHTML = '';
  els.daily.innerHTML = '';
  els.hourlyWrap.classList.remove('hidden');
  els.dailyWrap.classList.add('hidden');
});
window.addEventListener('keydown', (e)=>{ if((e.ctrlKey||e.metaKey) && e.key==='Enter') els.form.requestSubmit(); });

// Resume last
(function initFromSaved(){
  const s = loadState();
  if(s.city){ searchByCity(s.city, s.kind || 'hourly'); return; }
  if(s.lat && s.lon){ searchByCoords(s.lat, s.lon, s.kind || 'hourly'); }
})();
