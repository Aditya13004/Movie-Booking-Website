/*
  Eventura Frontend App
  - Fetch now-playing movies from TMDB
  - Movie detail with languages/subtitles
  - Mock showtimes
  - Seat selection with wheelchair accessibility
  - Mock payment flow
*/

const state = {
  movies: [],
  selectedMovie: null,
  selectedShowtime: null,
  selectedSeats: new Set(),
  seatLayout: null,
  ticketPrice: 250,
  currency: 'INR',
  selectedTheatreName: null,
  fnbItems: [
    { id: 'popcorn', name: 'Popcorn', price: 150 },
    { id: 'coke', name: 'Coke', price: 80 },
    { id: 'nachos', name: 'Nachos', price: 180 },
    { id: 'coffee', name: 'Coffee', price: 120 }
  ],
  fnbCart: {}, // id -> qty
  promoCode: '',
  discount: 0,
  fees: { conveniencePerTicket: 20, taxRate: 0.18 },
};

const el = (id) => document.getElementById(id);
const moviesGrid = el('moviesGrid');
const movieDetail = el('movieDetail');
const detailPoster = el('detailPoster');
const detailTitle = el('detailTitle');
const detailOverview = el('detailOverview');
const detailRuntime = el('detailRuntime');
const detailRelease = el('detailRelease');
const detailRating = el('detailRating');
const audioLanguages = el('audioLanguages');
const subtitleLanguages = el('subtitleLanguages');
const showtimeList = el('showtimeList');
const seatMap = el('seatMap');
const theatreCity = document.getElementById('theatreCity');
const theatreList = document.getElementById('theatreList');
const summaryMovie = el('summaryMovie');
const summaryShowtime = el('summaryShowtime');
const summarySeats = el('summarySeats');
const summaryTickets = el('summaryTickets');
const summaryPrice = el('summaryPrice');
const proceedToPay = el('proceedToPay');

const paymentModal = el('paymentModal');
const paymentForm = el('paymentForm');
const closePayment = el('closePayment');
const payAmount = document.getElementById('payAmount');
const cardFields = document.getElementById('cardFields');
const upiRow = document.getElementById('upiRow');
const netbankingRow = document.getElementById('netbankingRow');
const walletRow = document.getElementById('walletRow');
const successModal = document.getElementById('successModal');
const closeSuccess = document.getElementById('closeSuccess');
const doneSuccess = document.getElementById('doneSuccess');

// F&B and offers elements
const fnbGrid = document.getElementById('fnbGrid');
const promoCodeInput = document.getElementById('promoCodeInput');
const applyPromoBtn = document.getElementById('applyPromoBtn');
const offersToggle = document.getElementById('offersToggle');
const offersList = document.getElementById('offersList');
const ticketsSubtotalEl = document.getElementById('ticketsSubtotal');
const fnbSubtotalEl = document.getElementById('fnbSubtotal');
const discountAmountEl = document.getElementById('discountAmount');
const convenienceFeeEl = document.getElementById('convenienceFee');
const taxAmountEl = document.getElementById('taxAmount');
const grandTotalEl = document.getElementById('grandTotal');
const clearSelectionBtn = document.getElementById('clearSelection');

const languageFilter = el('languageFilter');
const regionFilter = el('regionFilter');
const backToList = el('backToList');
const cityModal = document.getElementById('cityModal');
const closeCity = document.getElementById('closeCity');
const cityList = document.getElementById('cityList');
const citySearch = document.getElementById('citySearch');
const locationBtn = document.getElementById('locationBtn');
const currentCity = document.getElementById('currentCity');

const CDN_IMG = 'https://image.tmdb.org/t/p/w500';

function currency(amount) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: state.currency }).format(amount);
}

function renderFnbGrid() {
  if (!fnbGrid) return;
  fnbGrid.innerHTML = state.fnbItems.map(item => {
    const qty = state.fnbCart[item.id] || 0;
    return `
      <div class="fnb-item" data-id="${item.id}">
        <div class="fnb-title">${item.name}</div>
        <div class="fnb-price">${currency(item.price)}</div>
        <div class="qty">
          <button type="button" class="ghost" data-action="dec">-</button>
          <span class="count">${qty}</span>
          <button type="button" data-action="inc">+</button>
        </div>
      </div>
    `;
  }).join('');
}

function computeTotals() {
  const seatsCount = Array.from(state.selectedSeats).length;
  const ticketsSubtotal = seatsCount * state.ticketPrice;
  const fnbSubtotal = Object.entries(state.fnbCart).reduce((sum, [id, q]) => {
    const item = state.fnbItems.find(i => i.id === id);
    return sum + (item ? item.price * q : 0);
  }, 0);

  // Discount rules
  let discount = 0;
  if (state.promoCode === 'MOVIE10') {
    discount = Math.round(ticketsSubtotal * 0.10);
  } else if (state.promoCode === 'FIRST50') {
    discount = 50;
  }
  // cap discount not to exceed subtotal
  discount = Math.min(discount, ticketsSubtotal + fnbSubtotal);

  const convenienceFee = seatsCount * state.fees.conveniencePerTicket;
  const taxable = Math.max(0, ticketsSubtotal + fnbSubtotal + convenienceFee - discount);
  const tax = Math.round(taxable * state.fees.taxRate);
  const grandTotal = taxable + tax;

  return { seatsCount, ticketsSubtotal, fnbSubtotal, discount, convenienceFee, tax, grandTotal };
}

function tmdbUrl(path, params = {}) {
  const usp = new URLSearchParams({ api_key: CONFIG.TMDB_API_KEY, ...params });
  return `https://api.themoviedb.org/3${path}?${usp.toString()}`;
}

async function fetchNowPlaying(region) {
  const url = tmdbUrl('/movie/now_playing', { language: 'en-US', region, page: 1 });
  try {
    const res = await fetch(url);
    if (!res.ok) {
      if (res.status === 401) {
        throw new Error('Invalid API key - please update TMDB_API_KEY in config.js');
      } else if (res.status === 404) {
        throw new Error('API endpoint not found');
      } else {
        throw new Error(`API request failed with status ${res.status}`);
      }
    }
    const data = await res.json();
    return data.results || [];
  } catch (error) {
    if (error.message.includes('fetch')) {
      throw new Error('Network error - unable to reach TMDB API. Check your internet connection.');
    }
    throw error;
  }
}

async function fetchMovieDetails(movieId) {
  const url = tmdbUrl(`/movie/${movieId}`, { language: 'en-US', append_to_response: 'release_dates,translations' });
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch movie details');
  return res.json();
}

async function fetchMovieWatchProviders(movieId) {
  const url = tmdbUrl(`/movie/${movieId}/watch/providers`);
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json();
}

function renderMovies(movies) {
  moviesGrid.innerHTML = '';
  movies.forEach((m) => {
    const card = document.createElement('div');
    card.className = 'movie-card';
    const lang = m.original_language ? m.original_language.toUpperCase() : 'N/A';
    const city = (document.getElementById('currentCity')?.textContent || 'Mumbai');
    card.innerHTML = `
      <img src="${m.poster_path ? CDN_IMG + m.poster_path : ''}" alt="${m.title}" />
      <div class="mc-body">
        <div class="mc-title" title="${m.title}">${m.title}</div>
        <div class="mc-meta"><span>${lang}</span><span>⭐ ${m.vote_average?.toFixed(1) ?? '-'}</span></div>
        <div class="mc-actions">
          <button data-id="${m.id}" class="view-btn">View</button>
          <a class="book-btn" href="theatres.html?movieId=${m.id}&title=${encodeURIComponent(m.title)}&city=${encodeURIComponent(city)}">Book</a>
        </div>
      </div>
    `;
    moviesGrid.appendChild(card);
  });

  moviesGrid.querySelectorAll('.view-btn').forEach((btn) => {
    btn.addEventListener('click', () => openMovieDetail(Number(btn.dataset.id)));
  });
}

function populateLanguageFilter(movies) {
  const langs = Array.from(new Set(movies.map((m) => (m.original_language || '').toUpperCase()).filter(Boolean))).sort();
  languageFilter.innerHTML = '<option value="">All Languages</option>' +
    langs.map((l) => `<option value="${l}">${l}</option>`).join('');
}

async function loadNowPlaying() {
  try {
    moviesGrid.innerHTML = '<div class="mc-meta">Loading…</div>';
    const region = (regionFilter?.value) || 'IN';
    const movies = await fetchNowPlaying(region);
    state.movies = movies;
    populateLanguageFilter(movies);
    const filtered = filterMovies();
    renderMovies(filtered);
  } catch (e) {
    console.error('Failed to load movies:', e);
    let errorMsg = 'Failed to load movies. ';
    if (e.message.includes('fetch')) {
      errorMsg += 'Network error - check your internet connection.';
    } else if (e.message.includes('API key')) {
      errorMsg += 'Invalid API key. Get a new one at https://www.themoviedb.org/';
    } else {
      errorMsg += 'Error: ' + e.message;
    }
    moviesGrid.innerHTML = `<div class="mc-meta">${errorMsg}</div>`;
  }
}

function filterMovies() {
  const lang = (languageFilter.value || '').toLowerCase();
  if (!lang) return state.movies;
  return state.movies.filter((m) => (m.original_language || '').toLowerCase() === lang);
}

function mockShowtimes() {
  const times = ['10:15 AM', '12:45 PM', '03:30 PM', '06:10 PM', '09:00 PM'];
  const today = new Date();
  return times.map((t, i) => ({ id: `${today.toDateString()}-${i}`, label: t }));
}

function generateSeatLayout() {
  // 10 rows x 14 columns with an aisle in the middle
  const rows = 10; const cols = 14; const aisleAfter = 7;
  const reserved = new Set();
  // randomly block ~15% seats
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (Math.random() < 0.15) reserved.add(`${r}-${c}`);
    }
  }
  // wheelchair friendly spots on row 1 and 2 near aisle
  const wheelchair = new Set([`1-${aisleAfter-1}`, `1-${aisleAfter}`, `2-${aisleAfter-1}`, `2-${aisleAfter}`]);
  return { rows, cols, aisleAfter, reserved, wheelchair };
}

function renderShowtimes() {
  const shows = mockShowtimes();
  showtimeList.innerHTML = '';
  shows.forEach((s) => {
    const btn = document.createElement('button');
    btn.className = 'showtime';
    btn.textContent = s.label;
    btn.addEventListener('click', () => {
      state.selectedShowtime = s;
      document.querySelectorAll('.showtime').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.selectedSeats.clear();
      state.seatLayout = generateSeatLayout();
      renderSeatMap();
      updateSummary();
    });
    showtimeList.appendChild(btn);
  });
}

function renderSeatMap() {
  const layout = state.seatLayout || generateSeatLayout();
  state.seatLayout = layout;
  seatMap.innerHTML = '';
  seatMap.style.gridTemplateRows = `repeat(${layout.rows}, auto)`;
  
  for (let r = 0; r < layout.rows; r++) {
    const rowContainer = document.createElement('div');
    rowContainer.className = 'seat-row-label';
    
    // Row label
    const rowLabel = document.createElement('div');
    rowLabel.className = 'row-label';
    rowLabel.textContent = String.fromCharCode(65 + r);
    rowContainer.appendChild(rowLabel);
    
    const rowEl = document.createElement('div');
    rowEl.className = 'seat-row';
    
    for (let c = 0; c < layout.cols; c++) {
      if (c === layout.aisleAfter) {
        const aisle = document.createElement('div');
        aisle.className = 'aisle';
        aisle.textContent = '|';
        rowEl.appendChild(aisle);
      }
      const id = `${r}-${c}`;
      const seat = document.createElement('button');
      seat.type = 'button';
      seat.className = 'seat';
      
      // Add base available class
      if (!layout.reserved.has(id)) seat.classList.add('available');
      
      if (layout.wheelchair.has(id)) seat.classList.add('wheelchair');
      if (layout.reserved.has(id)) seat.classList.add('reserved');
      if (state.selectedSeats.has(id)) seat.classList.add('selected');
      
      seat.textContent = (c + 1);
      seat.setAttribute('aria-label', `Row ${String.fromCharCode(65 + r)} Seat ${c + 1}`);
      seat.disabled = layout.reserved.has(id);
      seat.addEventListener('click', () => toggleSeat(id));
      rowEl.appendChild(seat);
    }
    
    rowContainer.appendChild(rowEl);
    seatMap.appendChild(rowContainer);
  }
}

function toggleSeat(id) {
  if (state.selectedSeats.has(id)) {
    state.selectedSeats.delete(id);
  } else {
    state.selectedSeats.add(id);
  }
  renderSeatMap();
  updateSummary();
}

function updateSummary() {
  summaryMovie.textContent = state.selectedMovie ? state.selectedMovie.title : '-';
  summaryShowtime.textContent = state.selectedShowtime ? state.selectedShowtime.label : '-';
  const seats = Array.from(state.selectedSeats).map((id) => {
    const [r, c] = id.split('-').map(Number);
    return String.fromCharCode(65 + r) + (c + 1);
  });
  summarySeats.textContent = seats.join(', ') || '-';
  summaryTickets.textContent = String(seats.length);

  const totals = computeTotals();
  summaryPrice.textContent = currency(totals.ticketsSubtotal);
  if (ticketsSubtotalEl) ticketsSubtotalEl.textContent = currency(totals.ticketsSubtotal);
  if (fnbSubtotalEl) fnbSubtotalEl.textContent = currency(totals.fnbSubtotal);
  if (discountAmountEl) discountAmountEl.textContent = `- ${currency(totals.discount)}`;
  if (convenienceFeeEl) convenienceFeeEl.textContent = currency(totals.convenienceFee);
  if (taxAmountEl) taxAmountEl.textContent = currency(totals.tax);
  if (grandTotalEl) grandTotalEl.textContent = currency(totals.grandTotal);
  if (payAmount) payAmount.textContent = String(totals.grandTotal);

  // Enable Proceed to Pay as soon as at least one seat is selected
  // (align behavior with seating.html flow)
  proceedToPay.disabled = seats.length === 0;
}

async function openMovieDetail(movieId) {
  const movie = state.movies.find((m) => m.id === movieId);
  state.selectedMovie = movie || null;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  movieDetail.classList.remove('hidden');
  detailPoster.src = movie?.poster_path ? CDN_IMG + movie.poster_path : '';
  detailTitle.textContent = movie?.title || '';
  detailOverview.textContent = 'Loading details…';
  detailRuntime.textContent = '';
  detailRelease.textContent = '';
  detailRating.textContent = '';
  audioLanguages.innerHTML = '';
  subtitleLanguages.innerHTML = '';
  renderShowtimes();
  renderTheatres();
  state.selectedShowtime = null;
  state.selectedSeats.clear();
  seatMap.innerHTML = '';
  updateSummary();

  try {
    const details = await fetchMovieDetails(movieId);
    detailOverview.textContent = details.overview || movie?.overview || '';
    detailRuntime.textContent = details.runtime ? `${details.runtime} min` : '';
    detailRelease.textContent = details.release_date ? new Date(details.release_date).toLocaleDateString() : '';
    detailRating.textContent = details.vote_average ? `⭐ ${details.vote_average.toFixed(1)}` : '';

    const translations = details.translations?.translations || [];
    const audioLangs = new Set(translations.map((t) => (t.iso_639_1 || '').toUpperCase()).filter(Boolean));
    audioLanguages.innerHTML = Array.from(audioLangs).map((l) => `<span class="chip">${l}</span>`).join('') || '<span class="mc-meta">N/A</span>';

    // Subtitles: approximate using spoken_languages + common locales
    const subs = new Set(
      (details.spoken_languages || []).map((l) => (l.iso_639_1 || '').toUpperCase()).filter(Boolean)
    );
    ;['EN','ES','FR','DE','HI','TA','TE','JA','KO','ZH'].forEach((c) => subs.add(c));
    subtitleLanguages.innerHTML = Array.from(subs).map((l) => `<span class="chip">${l}</span>`).join('');
  } catch (e) {
    detailOverview.textContent = 'Failed to load details.';
    console.error(e);
  }
}

function closeDetail() {
  movieDetail.classList.add('hidden');
  state.selectedMovie = null;
  state.selectedShowtime = null;
  state.selectedSeats.clear();
  updateSummary();
}

function openPayment() {
  paymentModal.classList.remove('hidden');
}
function closePaymentModal() {
  paymentModal.classList.add('hidden');
}

function showSuccessPopup(booking) {
  try {
    const format = (n) => new Intl.NumberFormat(undefined, { style: 'currency', currency: state.currency }).format(n);
    document.getElementById('sId').textContent = booking.paymentId || booking.id || '-';
    document.getElementById('sMovie').textContent = booking.movieTitle || '-';
    document.getElementById('sTheatre').textContent = booking.theatreName || '-';
    document.getElementById('sShow').textContent = booking.showtime || '-';
    document.getElementById('sSeats').textContent = (booking.seats || []).join(', ') || '-';
    const b = booking.breakdown || {};
    document.getElementById('sTicketsSubtotal').textContent = format(b.ticketsSubtotal || 0);
    document.getElementById('sFnbSubtotal').textContent = format(b.fnbSubtotal || 0);
    document.getElementById('sDiscount').textContent = `- ${format(b.discount || 0)}`;
    document.getElementById('sFee').textContent = format(b.convenienceFee || 0);
    document.getElementById('sTax').textContent = format(b.tax || 0);
    document.getElementById('sTotal').textContent = format(b.grandTotal || booking.amount || 0);
  } catch {}
  closePaymentModal();
  successModal?.classList.remove('hidden');
}

closeSuccess?.addEventListener('click', () => successModal?.classList.add('hidden'));

doneSuccess?.addEventListener('click', () => successModal?.classList.add('hidden'));

paymentForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const seatsArr = Array.from(state.selectedSeats).map((id) => {
    const [r, c] = id.split('-').map(Number);
    return String.fromCharCode(65 + r) + (c + 1);
  });
  const pm = (document.querySelector('input[name="pm"]:checked')?.value) || 'card';
  const totals = computeTotals();
  
  // Validate payment method specific fields
  let paymentData = { method: pm, amount: totals.grandTotal, currency: state.currency };
  
  if (pm === 'card') {
    const cardNumber = document.getElementById('cardNumber').value.trim();
    const expiry = document.getElementById('expiry').value.trim();
    const cvc = document.getElementById('cvc').value.trim();
    if (!cardNumber || !expiry || !cvc) {
      alert('Please fill all card details');
      return;
    }
    paymentData.meta = { cardNumber, expiry, cvc };
  } else if (pm === 'upi') {
    const upiId = document.getElementById('upiId').value.trim();
    if (!upiId) { 
      alert('Please enter your UPI ID'); 
      return; 
    }
    if (!upiId.includes('@')) {
      alert('Please enter a valid UPI ID (e.g., user@paytm)');
      return;
    }
    paymentData.meta = { upiId };
  } else if (pm === 'netbanking') {
    const bank = document.getElementById('bankSelect').value;
    if (!bank) {
      alert('Please select your bank');
      return;
    }
    paymentData.meta = { bank };
  } else if (pm === 'wallet') {
    const wallet = document.getElementById('walletSelect').value;
    if (!wallet) {
      alert('Please select your wallet');
      return;
    }
    paymentData.meta = { wallet };
  }

  // Disable pay button during processing
  const payBtn = document.getElementById('payNow');
  payBtn.disabled = true;
  payBtn.textContent = 'Processing...';

  try {
    // Attach booking context
    const payload = {
      ...paymentData,
      movieTitle: state.selectedMovie?.title,
      theatreName: state.selectedTheatreName || document.querySelector('.theatre-name')?.textContent || '',
      showtime: state.selectedShowtime?.label || '',
      seats: seatsArr,
      meta: {
        ...(paymentData.meta || {}),
        fnbCart: state.fnbCart,
        promoCode: state.promoCode,
        breakdown: computeTotals(),
      }
    };

    // Prefer working endpoints; handle file:// and http(s) robustly
    const endpoints = [];
    const isHttp = window.location.protocol === 'http:' || window.location.protocol === 'https:';
    if (isHttp) endpoints.push('/api/payments/create');
    endpoints.push('http://localhost:4000/api/payments/create');

    let response;
    let lastErr;
    for (const url of endpoints) {
      try {
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (response && (response.ok || response.status)) break;
      } catch (e) {
        lastErr = e;
      }
    }
    if (!response) throw lastErr || new Error('No payment endpoint reachable');

    const result = await response.json();

    if (response.ok) {
      // Persist and show success popup
      const booking = {
        id: result.id,
        paymentId: result.id,
        movieTitle: payload.movieTitle,
        theatreName: payload.theatreName,
        showtime: payload.showtime,
        seats: seatsArr,
        ticketCount: seatsArr.length,
        breakdown: computeTotals(),
        amount: payload.amount
      };
      try { sessionStorage.setItem('EV_LAST_BOOKING', JSON.stringify(booking)); } catch {}
      showSuccessPopup(booking);
    } else {
      alert(`Payment Failed: ${result.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Payment error:', error);
    // Demo fallback: if backend unreachable, simulate a successful payment so user can proceed
    try {
      const seatsArrFallback = Array.from(state.selectedSeats).map((id) => {
        const [r, c] = id.split('-').map(Number);
        return String.fromCharCode(65 + r) + (c + 1);
      });
      const totalsFB = computeTotals();
      const booking = {
        id: `pay_local_${Math.random().toString(36).slice(2)}`,
        paymentId: `pay_local_${Date.now()}`,
        movieTitle: state.selectedMovie?.title,
        theatreName: state.selectedTheatreName || document.querySelector('.theatre-name')?.textContent || '',
        showtime: state.selectedShowtime?.label || '',
        seats: seatsArrFallback,
        ticketCount: seatsArrFallback.length,
        breakdown: totalsFB,
        amount: totalsFB.grandTotal
      };
      try { sessionStorage.setItem('EV_LAST_BOOKING', JSON.stringify(booking)); } catch {}
      showSuccessPopup(booking);
    } catch (e) {
      alert('Payment processing failed. Please check your connection and try again.');
    }
  } finally {
    payBtn.disabled = false;
    try {
      const gt = computeTotals().grandTotal;
      const payAmtSpan = document.getElementById('payAmount');
      if (payAmtSpan) {
        payAmtSpan.textContent = String(gt);
      } else {
        payBtn.textContent = `Pay ₹${gt}`;
      }
    } catch {
      payBtn.textContent = 'Pay';
    }
  }
});

closePayment?.addEventListener('click', closePaymentModal);
proceedToPay?.addEventListener('click', () => { renderFnbGrid(); openPayment(); });
backToList?.addEventListener('click', closeDetail);
clearSelectionBtn?.addEventListener('click', () => { state.selectedSeats.clear(); renderSeatMap(); updateSummary(); });

// F&B qty handlers
fnbGrid?.addEventListener('click', (e) => {
  const target = e.target;
  if (!target.closest) return;
  const itemEl = target.closest('.fnb-item');
  if (!itemEl) return;
  const id = itemEl.getAttribute('data-id');
  if (target.getAttribute('data-action') === 'inc') {
    state.fnbCart[id] = (state.fnbCart[id] || 0) + 1;
  } else if (target.getAttribute('data-action') === 'dec') {
    state.fnbCart[id] = Math.max(0, (state.fnbCart[id] || 0) - 1);
  }
  renderFnbGrid();
  updateSummary();
});

applyPromoBtn?.addEventListener('click', () => {
  const code = (promoCodeInput?.value || '').trim().toUpperCase();
  if (['MOVIE10','FIRST50'].includes(code)) {
    state.promoCode = code;
  } else {
    state.promoCode = '';
    alert('Invalid promo code. Try MOVIE10 or FIRST50.');
  }
  updateSummary();
});

offersToggle?.addEventListener('click', () => {
  offersList?.classList.toggle('hidden');
});

languageFilter?.addEventListener('change', () => renderMovies(filterMovies()));
regionFilter?.addEventListener('change', loadNowPlaying);

// Footer year and UI wiring
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('year').textContent = String(new Date().getFullYear());

  // Search wiring
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');
  function performSearch() {
    const q = (searchInput?.value || '').trim().toLowerCase();
    if (!q) { renderMovies(filterMovies()); return; }
    const matches = state.movies.filter(m => (m.title || '').toLowerCase().includes(q));
    if (matches.length) {
      renderMovies(matches);
    } else {
      moviesGrid.innerHTML = '<div class="mc-meta">No movies found for your search.</div>';
    }
  }
  searchBtn?.addEventListener('click', performSearch);
  searchInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter') performSearch(); });

  // Toggle payment fields by method
  // Toggle UI and required attributes by payment method
  function setReq(id, req) { const el = document.getElementById(id); if (el) el.required = !!req; }
  function updatePaymentRequirements(val) {
    setReq('cardNumber', val === 'card');
    setReq('expiry', val === 'card');
    setReq('cvc', val === 'card');
    setReq('upiId', val === 'upi');
    setReq('bankSelect', val === 'netbanking');
    setReq('walletSelect', val === 'wallet');
  }

  document.querySelectorAll('input[name="pm"]').forEach(r => {
    r.addEventListener('change', () => {
      const val = r.value;
      // Update visual selection
      document.querySelectorAll('.payment-method-card').forEach(card => {
        card.classList.remove('active');
      });
      r.closest('.payment-method-card')?.classList.add('active');
      
      // Show/hide appropriate fields
      if (cardFields) cardFields.style.display = val === 'card' ? '' : 'none';
      if (upiRow) upiRow.style.display = val === 'upi' ? '' : 'none';
      if (netbankingRow) netbankingRow.style.display = val === 'netbanking' ? '' : 'none';
      if (walletRow) walletRow.style.display = val === 'wallet' ? '' : 'none';

      // Update required attributes
      updatePaymentRequirements(val);
    });
  });

  // Initialize required attributes for the default selected method
  const initPm = (document.querySelector('input[name="pm"]:checked')?.value) || 'card';
  updatePaymentRequirements(initPm);

  // Payment input masks
  function attachPaymentInputMasks() {
    const card = document.getElementById('cardNumber');
    const exp = document.getElementById('expiry');
    const cvc = document.getElementById('cvc');

    card?.addEventListener('input', () => {
      let v = card.value.replace(/\D/g, '').slice(0, 19);
      v = v.replace(/(.{4})/g, '$1 ').trim();
      card.value = v;
    });
    exp?.addEventListener('input', () => {
      let v = exp.value.replace(/\D/g, '').slice(0, 4);
      if (v.length >= 3) v = v.slice(0,2) + '/' + v.slice(2);
      exp.value = v;
    });
    cvc?.addEventListener('input', () => {
      cvc.value = cvc.value.replace(/\D/g, '').slice(0, 4);
    });
  }
  attachPaymentInputMasks();

  // Auth state
  const signInBtn = document.getElementById('signInBtn');
  function refreshAuthUI() {
    const token = localStorage.getItem('EV_AUTH_TOKEN');
    if (token) {
      signInBtn.textContent = 'Sign Out';
    } else {
      signInBtn.textContent = 'Sign In';
    }
  }
  signInBtn?.addEventListener('click', () => {
    const token = localStorage.getItem('EV_AUTH_TOKEN');
    if (token) {
      localStorage.removeItem('EV_AUTH_TOKEN');
      refreshAuthUI();
    } else {
      window.location.href = 'signin.html';
    }
  });
  refreshAuthUI();
});

// Kickoff
loadNowPlaying();

// Smooth scroll to theatres when booking
document.addEventListener('click', (e) => {
  const t = e.target;
  if (t && t.classList && t.classList.contains('book-btn')) {
    setTimeout(() => {
      document.querySelector('.theatres')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 250);
  }
});

// City selection (India)
const INDIA_CITIES = (window.INDIA_CITIES_FULL || ['Mumbai','Delhi']).sort();

function openCityModal() {
  cityModal.classList.remove('hidden');
  renderCityList('');
}
function closeCityModal() {
  cityModal.classList.add('hidden');
}
function renderCityList(filter) {
  const q = (filter || '').toLowerCase();
  const list = INDIA_CITIES.filter(c => c.toLowerCase().includes(q));
  cityList.innerHTML = list.map(c => `<button type="button" class="chip">${c}</button>`).join('');
  cityList.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => selectCity(btn.textContent));
  });
}
function selectCity(city) {
  currentCity.textContent = city;
  // Movies by city still use region IN in TMDB; cinemas differ per provider
  regionFilter.value = 'IN';
  state.currency = 'INR';
  state.ticketPrice = 250;
  closeCityModal();
  loadNowPlaying();
  renderTheatres();
}

locationBtn?.addEventListener('click', openCityModal);
closeCity?.addEventListener('click', closeCityModal);
citySearch?.addEventListener('input', (e) => renderCityList(e.target.value));

// Mock theatre data and rendering
function getMockTheatres(city) {
  const base = [
    { id: 't1', name: 'Eventura Cinemas - Downtown', address: 'Central Mall', wheelchair: true },
    { id: 't2', name: 'Galaxy Multiplex', address: 'High Street', wheelchair: true },
    { id: 't3', name: 'CineStar Premium', address: 'Tech Park', wheelchair: false },
    { id: 't4', name: 'GrandTalkies', address: 'Old City', wheelchair: true },
  ];
  return base.map((t, i) => ({ ...t, id: `${t.id}-${(city||'IN').toLowerCase().replace(/\s+/g,'-')}-${i}` }));
}

function renderTheatres() {
  const city = currentCity?.textContent && currentCity.textContent !== 'Select City' ? currentCity.textContent : 'Your City';
  if (theatreCity) theatreCity.textContent = city;
  renderCinemasForCity(city).then((theatres) => {
    theatreList.innerHTML = theatres.map((t) => `
    <div class="theatre-card" data-id="${t.id}">
      <div class="theatre-header">
        <div>
          <div class="theatre-name">${t.name}</div>
          <div class="theatre-meta">${t.address}</div>
        </div>
        <div class="wc-note">${t.wheelchair ? '♿ Wheelchair accessible' : ''}</div>
      </div>
      <div class="theatre-tags">
        ${['2D','3D','IMAX 2D','IMAX 3D','Recliner'].filter(()=> Math.random()>.5).map(f => `<span class=\"tag\">${f}</span>`).join('')}
      </div>
      <div class="theatre-showtimes">
        ${mockShowtimes().map((s) => `<button type=\"button\" class=\"showtime\" data-theatre=\"${t.id}\" data-time=\"${s.id}\">${s.label} · ${currency(state.ticketPrice)}</button>`).join('')}
      </div>
    </div>
  `).join('');

    theatreList.querySelectorAll('.showtime').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.theatre-showtimes .showtime').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const theatreId = btn.getAttribute('data-theatre');
        const timeId = btn.getAttribute('data-time');
        const card = btn.closest('.theatre-card');
        const theName = card?.querySelector('.theatre-name')?.textContent || '';
        state.selectedTheatreName = theName;
        // set selected showtime context combining theatre + time
        state.selectedShowtime = { id: `${theatreId}-${timeId}`, label: btn.textContent, theatreId };
        state.selectedSeats.clear();
        state.seatLayout = generateSeatLayoutForTheatre(theatreId);
        renderSeatMap();
        updateSummary();
      });
    });
  });
}

function generateSeatLayoutForTheatre(theatreId) {
  // Slightly vary layout by theatre
  const base = generateSeatLayout();
  if (theatreId.includes('t3')) {
    base.rows = 8; base.cols = 12; base.aisleAfter = 6;
  } else if (theatreId.includes('t4')) {
    base.rows = 12; base.cols = 16; base.aisleAfter = 8;
  }
  return base;
}

// Provider: real cinemas via MovieGlu if configured; fallback to mock
const CITY_TO_COORDS = {
  'Mumbai': { lat: 19.076, lon: 72.8777 },
  'Delhi': { lat: 28.6139, lon: 77.209 },
  'Bengaluru': { lat: 12.9716, lon: 77.5946 },
  'Hyderabad': { lat: 17.385, lon: 78.4867 },
  'Ahmedabad': { lat: 23.0225, lon: 72.5714 },
  'Chennai': { lat: 13.0827, lon: 80.2707 },
  'Kolkata': { lat: 22.5726, lon: 88.3639 },
  'Pune': { lat: 18.5204, lon: 73.8567 },
  'Jaipur': { lat: 26.9124, lon: 75.7873 },
  'Gurugram': { lat: 28.4595, lon: 77.0266 },
};

async function renderCinemasForCity(city) {
  try {
    if (CONFIG.THEATRES_API_PROVIDER === 'movieglu' && CONFIG.THEATRES_API_KEY && CONFIG.MOVIEGLU_BASE_URL) {
      const coords = CITY_TO_COORDS[city] || CITY_TO_COORDS['Mumbai'];
      const cinemas = await fetchMovieGluCinemas(coords.lat, coords.lon);
      if (Array.isArray(cinemas) && cinemas.length) {
        return cinemas.map((c, idx) => ({
          id: `mg-${c.cinema_id || idx}`,
          name: c.cinema_name || c.name || 'Cinema',
          address: `${c.address || ''}`.trim(),
          wheelchair: Boolean(c.wheelchair_access || true),
        }));
      }
    }
  } catch (e) {
    console.warn('MovieGlu failed, using mock cinemas', e);
  }
  return getMockTheatres(city);
}

async function fetchMovieGluCinemas(lat, lon) {
  const base = CONFIG.MOVIEGLU_BASE_URL.replace(/\/$/, '');
  const url = `${base}/cinemasNearby/`;
  const now = new Date();
  const headers = {
    'x-api-key': CONFIG.THEATRES_API_KEY,
    'client': CONFIG.MOVIEGLU_CLIENT || '',
    'territory': CONFIG.MOVIEGLU_TERRITORY || 'IN',
    'api-version': CONFIG.MOVIEGLU_API_VERSION || 'v200',
    'device-datetime': now.toISOString(),
    'geolocation': `${lat};${lon}`,
  };
  // Some MovieGlu accounts require Authorization: Basic <token>. Use if provided
  if (CONFIG.MOVIEGLU_AUTH) headers['authorization'] = CONFIG.MOVIEGLU_AUTH;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`MovieGlu cinemas error: ${res.status}`);
  const data = await res.json();
  // MovieGlu returns { cinemas: [...] }
  return data.cinemas || data || [];
}


