// Weather App powered by Open‑Meteo — no API key required
// Features: city search + geolocation, hourly (24h) or 1–5 day forecast, emoji icons, autosave, theme toggle
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
  curTemp: $('#curTemp'),
  curFeels: $('#curFeels'),
  curHum: $('#curHum'),
  curWind: $('#curWind'),
  hourlyWrap: $('#hourlySection'),
  hourly: $('#hourlyForecastDisplay'),
  dailyWrap: $('#dailySection'),
  daily: $('#dailyForecastDisplay')
};

// Theme
(function initTheme(){
  const saved = localStorage.getItem('weather-theme');
  if(saved === 'light') document.documentElement.classList.add('light');
  els.themeToggle.textContent = document.documentElement.classList.contains('light') ? '🌙' : '☀️';
})();
els.themeToggle.addEventListener('click', ()=>{
  const isLight = document.documentElement.classList.toggle('light');
  localStorage.setItem('weather-theme', isLight ? 'light' : 'dark');
  els.themeToggle.textContent = isLight ? '🌙' : '☀️';
});

// Weather code -> emoji + label (Open‑Meteo codes)
const W = {
  0:['☀️','Clear sky'], 1:['🌤️','Mainly clear'], 2:['⛅','Partly cloudy'], 3:['☁️','Overcast'],
  45:['🌫️','Fog'], 48:['🌫️','Depositing rime fog'],
  51:['🌦️','Light drizzle'], 53:['🌦️','Moderate drizzle'], 55:['🌧️','Dense drizzle'],
  56:['🌧️','Freezing drizzle'], 57:['🌧️','Freezing drizzle'],
  61:['🌦️','Slight rain'], 63:['🌧️','Moderate rain'], 65:['🌧️','Heavy rain'],
  66:['🌧️','Freezing rain'], 67:['🌧️','Freezing rain'],
  71:['🌨️','Slight snow'], 73:['🌨️','Moderate snow'], 75:['❄️','Heavy snow'],
  77:['❄️','Snow grains'],
  80:['🌦️','Rain showers'], 81:['🌧️','Rain showers'], 82:['🌧️','Violent rain showers'],
  85:['🌨️','Snow showers'], 86:['🌨️','Heavy snow showers'],
  95:['⛈️','Thunderstorm'], 96:['⛈️','Thunderstorm w/ hail'], 99:['⛈️','Thunderstorm w/ hail']
};

function icon(code){ return (W[code]||['❓','Unknown'])[0]; }
function text(code){ return (W[code]||['❓','Unknown'])[1]; }

function showAlert(msg){
  els.alert.textContent = msg;
  els.alert.classList.remove('hidden');
  clearTimeout(showAlert._t);
  showAlert._t = setTimeout(()=> els.alert.classList.add('hidden'), 4000);
}

function saveState(data){ localStorage.setItem('weather-last', JSON.stringify(data)); }
function loadState(){ try{ return JSON.parse(localStorage.getItem('weather-last')||'{}'); }catch{ return {}; } }

// Fetch helpers
async function geocodeCity(city){
  const url = 'https://geocoding-api.open-meteo.com/v1/search?count=1&language=en&format=json&name=' + encodeURIComponent(city);
  const res = await fetch(url);
  if(!res.ok) throw new Error('Geocoding failed.');
  const data = await res.json();
  if(!data.results || !data.results.length) throw new Error('City not found. Try a different name.');
  const r = data.results[0];
  return { name: r.name, country: r.country, lat: r.latitude, lon: r.longitude, tz: r.timezone };
}

async function fetchForecast(lat, lon, tz){
  const params = new URLSearchParams({
    latitude: lat, longitude: lon, timezone: tz || 'auto',
    current_weather: 'true',
    hourly: 'temperature_2m,apparent_temperature,relativehumidity_2m,wind_speed_10m,weathercode',
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode'
  });
  const url = 'https://api.open-meteo.com/v1/forecast?' + params;
  const res = await fetch(url);
  if(!res.ok) throw new Error('Forecast request failed.');
  return res.json();
}

function fmtTemp(v){ return `${Math.round(v)}°C`; }
function fmtTime(s, opts){ const d = new Date(s); return d.toLocaleString([], opts); }

function renderCurrent(meta, data){
  els.currentWrap.classList.remove('hidden');
  const cw = data.current_weather;
  const hum = data.hourly?.relativehumidity_2m?.[0];
  const feels = data.hourly?.apparent_temperature?.[0];
  els.currentIcon.textContent = icon(cw.weathercode);
  els.currentTitle.textContent = `${meta.label}`;
  els.currentSub.textContent = `${text(cw.weathercode)} • ${fmtTime(cw.time, {weekday:'short', hour:'2-digit', minute:'2-digit'})}`;
  els.curTemp.textContent = fmtTemp(cw.temperature);
  els.curFeels.textContent = feels!=null ? fmtTemp(feels) : '—';
  els.curHum.textContent = hum!=null ? `${hum}%` : '—';
  els.curWind.textContent = cw.windspeed!=null ? `${Math.round(cw.windspeed)} km/h` : '—';
}

function renderHourly(data){
  const H = data.hourly;
  if(!H) return;
  const now = Date.now();
  const items = [];
  for(let i=0;i<H.time.length;i++){
    const t = new Date(H.time[i]).getTime();
    if(t < now) continue;
    const label = fmtTime(H.time[i], {hour:'2-digit', minute:'2-digit'});
    items.push(`<div class="forecast-card">
      <div class="time">${label}</div>
      <span class="ico">${icon(H.weathercode[i])}</span>
      <div class="temp">${fmtTemp(H.temperature_2m[i])}</div>
      <div class="desc">${text(H.weathercode[i])}</div>
    </div>`);
    if(items.length>=24) break;
  }
  els.hourly.innerHTML = items.join('');
}

function renderDaily(data, days){
  const D = data.daily;
  if(!D) return;
  const items = [];
  for(let i=0;i<Math.min(days, D.time.length);i++){
    const label = fmtTime(D.time[i], {weekday:'short', month:'short', day:'numeric'});
    items.push(`<div class="forecast-card">
      <div class="time">${label}</div>
      <span class="ico">${icon(D.weathercode[i])}</span>
      <div class="temp">${Math.round(D.temperature_2m_min[i])}° / ${Math.round(D.temperature_2m_max[i])}°</div>
      <div class="desc">Rain: ${D.precipitation_probability_max[i] ?? 0}%</div>
    </div>`);
  }
  els.daily.innerHTML = items.join('');
}

async function searchByCity(city, type){
  if(!city){ showAlert('Please enter a city.'); return; }
  try{
    const geo = await geocodeCity(city);
    const label = `${geo.name}, ${geo.country}`;
    const data = await fetchForecast(geo.lat, geo.lon, geo.tz);
    renderCurrent({label}, data);
    if(type==='hourly'){
      els.hourlyWrap.classList.remove('hidden');
      els.dailyWrap.classList.add('hidden');
      renderHourly(data);
    }else{
      els.dailyWrap.classList.remove('hidden');
      els.hourlyWrap.classList.add('hidden');
      renderDaily(data, parseInt(type,10));
    }
    saveState({city, type});
  }catch(e){
    showAlert(e.message || 'Search failed.');
  }
}

async function searchByCoords(lat, lon, type){
  try{
    const data = await fetchForecast(lat, lon, 'auto');
    renderCurrent({label:'Your location'}, data);
    if(type==='hourly'){
      els.hourlyWrap.classList.remove('hidden');
      els.dailyWrap.classList.add('hidden');
      renderHourly(data);
    }else{
      els.dailyWrap.classList.remove('hidden');
      els.hourlyWrap.classList.add('hidden');
      renderDaily(data, parseInt(type,10));
    }
    saveState({geo:{lat,lon}, type});
  }catch(e){ showAlert(e.message || 'Location lookup failed.'); }
}

// Events
els.form.addEventListener('submit', (e)=>{
  e.preventDefault();
  searchByCity(els.city.value.trim(), els.type.value);
});
els.useLoc.addEventListener('click', ()=>{
  if(!navigator.geolocation){ showAlert('Geolocation not supported.'); return; }
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

// Restore last search
(function restore(){
  const st = loadState();
  if(st.type) els.type.value = st.type;
  if(st.city){
    els.city.value = st.city;
    searchByCity(st.city, st.type || 'hourly');
  }else if(st.geo){
    searchByCoords(st.geo.lat, st.geo.lon, st.type || 'hourly');
  }
})();
