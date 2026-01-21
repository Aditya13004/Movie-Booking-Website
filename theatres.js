const thEl = (id) => document.getElementById(id);
const movieTitle = thEl('movieTitle');
const cityName = thEl('cityName');
const theatreList = thEl('theatreList');

const CITY_TO_COORDS = window.CITY_COORDS_IN || {};

function parseQuery() {
  const usp = new URLSearchParams(location.search);
  return {
    movieId: usp.get('movieId'),
    movieTitle: usp.get('title'),
    city: usp.get('city') || 'Mumbai',
  };
}

function withProxy(url) {
  const p = (CONFIG.PROXY_URL || '').replace(/\/$/, '');
  return p ? `${p}/${url.replace(/^https?:\/\//,'')}` : url;
}

async function fetchMovieGluCinemas(lat, lon) {
  const base = (CONFIG.PROXY_URL || CONFIG.MOVIEGLU_BASE_URL).replace(/\/$/, '');
  const url = CONFIG.PROXY_URL ? `${base}/cinemasNearby/` : withProxy(`${base}/cinemasNearby/`);
  const now = new Date();
  const headers = {
    'x-api-key': CONFIG.THEATRES_API_KEY,
    'client': CONFIG.MOVIEGLU_CLIENT,
    'territory': CONFIG.MOVIEGLU_TERRITORY,
    'api-version': CONFIG.MOVIEGLU_API_VERSION,
    'device-datetime': now.toISOString(),
    'geolocation': `${lat};${lon}`,
    'accept': 'application/json'
  };
  if (CONFIG.MOVIEGLU_AUTH) headers['authorization'] = CONFIG.MOVIEGLU_AUTH;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`MovieGlu cinemas error: ${res.status}`);
  const data = await res.json();
  return data.cinemas || [];
}

async function fetchMovieGluShowtimes(cinemaId, dateISO) {
  const base = (CONFIG.PROXY_URL || CONFIG.MOVIEGLU_BASE_URL).replace(/\/$/, '');
  const path = `/cinemaShowTimes/?cinema_id=${encodeURIComponent(cinemaId)}&date=${encodeURIComponent(dateISO)}`;
  const url = CONFIG.PROXY_URL ? `${base}${path}` : withProxy(`${base}${path}`);
  const now = new Date();
  const headers = {
    'x-api-key': CONFIG.THEATRES_API_KEY,
    'client': CONFIG.MOVIEGLU_CLIENT,
    'territory': CONFIG.MOVIEGLU_TERRITORY,
    'api-version': CONFIG.MOVIEGLU_API_VERSION,
    'device-datetime': now.toISOString(),
    'accept': 'application/json'
  };
  if (CONFIG.MOVIEGLU_AUTH) headers['authorization'] = CONFIG.MOVIEGLU_AUTH;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`MovieGlu showtimes error: ${res.status}`);
  const data = await res.json();
  return data.films || [];
}

function getMockTheatres(city) {
  const base = [
    { id: 't1', name: 'Eventura Cinemas - Downtown', address: 'Central Mall', wheelchair: true },
    { id: 't2', name: 'Galaxy Multiplex', address: 'High Street', wheelchair: true },
    { id: 't3', name: 'CineStar Premium', address: 'Tech Park', wheelchair: false },
    { id: 't4', name: 'GrandTalkies', address: 'Old City', wheelchair: true },
  ];
  return base.map((t, i) => ({ ...t, id: `${t.id}-${(city||'IN').toLowerCase().replace(/\s+/g,'-')}-${i}` }));
}

async function loadTheatres() {
  const q = parseQuery();
  movieTitle.textContent = `Theatres for ${q.movieTitle || ''}`;
  cityName.textContent = q.city;
  const coords = CITY_TO_COORDS[q.city] || CITY_TO_COORDS['Mumbai'];
  let cinemas = [];
  try {
    cinemas = await fetchMovieGluCinemas(coords.lat, coords.lon);
  } catch (e) {
    cinemas = getMockTheatres(q.city);
  }
  const theatres = cinemas.map((c, idx) => ({
    id: c.cinema_id ? String(c.cinema_id) : (c.id || String(idx)),
    name: c.cinema_name || c.name,
    address: c.address || '',
    wheelchair: Boolean(c.wheelchair_access || true),
  }));

  const today = new Date().toISOString().slice(0,10);
  theatreList.innerHTML = '<div class="mc-meta">Loading showtimes…</div>';

  // Fetch showtimes in parallel (capped to avoid rate limits)
  const limited = theatres.slice(0, 15);
  const results = await Promise.all(limited.map(async (t) => {
    try {
      const films = await fetchMovieGluShowtimes(t.id, today);
      const film = films.find(f => (f.film_name || '').toLowerCase().includes((q.movieTitle||'').toLowerCase()));
      const times = (film?.showings?.Standard?.times || film?.times || []).map((ti) => ({
        label: ti.start_time || ti.time || '',
        format: ti.format || ti.screen_type || ti.attributes?.join(', ') || '',
      }));
      return { theatre: t, times };
    } catch (e) {
      return { theatre: t, times: [] };
    }
  }));

  theatreList.innerHTML = results.map(({ theatre: t, times }) => {
    const hasTimes = times && times.length;
    const chips = hasTimes ? times.map((ti) => {
      const label = ti.label;
      const fmt = ti.format ? ` <span class=\"tag\">${ti.format}</span>` : '';
      return `<a class=\"showtime\" href=\"seating.html?theatreId=${encodeURIComponent(t.id)}&theatre=${encodeURIComponent(t.name)}&movieId=${encodeURIComponent(q.movieId)}&title=${encodeURIComponent(q.movieTitle)}&time=${encodeURIComponent(label)}\">${label}${fmt} · ₹250</a>`;
    }).join('') : ['10:15 AM','12:45 PM','03:30 PM','06:10 PM','09:00 PM'].map((label) => {
      return `<a class=\"showtime\" href=\"seating.html?theatreId=${encodeURIComponent(t.id)}&theatre=${encodeURIComponent(t.name)}&movieId=${encodeURIComponent(q.movieId)}&title=${encodeURIComponent(q.movieTitle)}&time=${encodeURIComponent(label)}\">${label} · ₹250</a>`
    }).join('');

    return `
    <div class=\"theatre-card\" data-id=\"${t.id}\"> 
      <div class=\"theatre-header\">
        <div>
          <div class=\"theatre-name\">${t.name}</div>
          <div class=\"theatre-meta\">${t.address}</div>
        </div>
        <div class=\"wc-note\">${t.wheelchair ? '♿ Wheelchair accessible' : ''}</div>
      </div>
      <div class=\"theatre-showtimes\">${chips}</div>
    </div>`;
  }).join('');
}

document.addEventListener('DOMContentLoaded', loadTheatres);


