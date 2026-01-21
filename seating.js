const sEl = (id) => document.getElementById(id);
const theatreName = sEl('theatreName');
const seatMap = sEl('seatMap');
const movieName = sEl('movieName');
const showTime = sEl('showTime');
const summarySeats = sEl('summarySeats');
const summaryTickets = sEl('summaryTickets');
const summaryPrice = sEl('summaryPrice');
const proceedToPay = sEl('proceedToPay');
const paymentModal = document.getElementById('paymentModal');
const paymentForm = document.getElementById('paymentForm');
const closePayment = document.getElementById('closePayment');
const payAmount = document.getElementById('payAmount');
const cardFields = document.getElementById('cardFields');
const upiRow = document.getElementById('upiRow');
const netbankingRow = document.getElementById('netbankingRow');
const walletRow = document.getElementById('walletRow');
const clearSelectionBtn = document.getElementById('clearSelection');
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

const state = {
  selectedSeats: new Set(),
  seatLayout: null,
  ticketPrice: 250,
  currency: 'INR',
  fnbItems: [
    { id: 'popcorn', name: 'Popcorn', price: 150 },
    { id: 'coke', name: 'Coke', price: 80 },
    { id: 'nachos', name: 'Nachos', price: 180 },
    { id: 'coffee', name: 'Coffee', price: 120 }
  ],
  fnbCart: {},
  promoCode: '',
  fees: { conveniencePerTicket: 20, taxRate: 0.18 },
};

function parseQuery() {
  const usp = new URLSearchParams(location.search);
  return {
    theatreId: usp.get('theatreId'),
    theatre: usp.get('theatre'),
    movieId: usp.get('movieId'),
    title: usp.get('title'),
    time: usp.get('time'),
  };
}

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
  let discount = 0;
  if (state.promoCode === 'MOVIE10') discount = Math.round(ticketsSubtotal * 0.10);
  else if (state.promoCode === 'FIRST50') discount = 50;
  discount = Math.min(discount, ticketsSubtotal + fnbSubtotal);
  const convenienceFee = seatsCount * state.fees.conveniencePerTicket;
  const taxable = Math.max(0, ticketsSubtotal + fnbSubtotal + convenienceFee - discount);
  const tax = Math.round(taxable * state.fees.taxRate);
  const grandTotal = taxable + tax;
  return { seatsCount, ticketsSubtotal, fnbSubtotal, discount, convenienceFee, tax, grandTotal };
}

function generateSeatLayout() {
  const rows = 10; const cols = 14; const aisleAfter = 7;
  const reserved = new Set();
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (Math.random() < 0.15) reserved.add(`${r}-${c}`);
    }
  }
  const wheelchair = new Set([`1-${aisleAfter-1}`, `1-${aisleAfter}`, `2-${aisleAfter-1}`, `2-${aisleAfter}`]);
  return { rows, cols, aisleAfter, reserved, wheelchair };
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
  if (state.selectedSeats.has(id)) state.selectedSeats.delete(id); else state.selectedSeats.add(id);
  renderSeatMap();
  updateSummary();
}

function updateSummary() {
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
  proceedToPay.disabled = seats.length === 0;
}

function openPayment() { renderFnbGrid(); paymentModal.classList.remove('hidden'); }
function closePay() { paymentModal.classList.add('hidden'); }

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
  closePay();
  successModal?.classList.remove('hidden');
}

closeSuccess?.addEventListener('click', () => successModal?.classList.add('hidden'));

doneSuccess?.addEventListener('click', () => successModal?.classList.add('hidden'));

paymentForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const pm = (document.querySelector('input[name=\"pm\"]:checked')?.value) || 'card';
  const q = parseQuery();
  const seatsArr = Array.from(state.selectedSeats).map((id) => {
    const [r, c] = id.split('-').map(Number);
    return String.fromCharCode(65 + r) + (c + 1);
  });
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
    const upiId = document.getElementById('upiId')?.value.trim();
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
    const payload = {
      ...paymentData,
      movieTitle: q.title,
      theatreName: q.theatre,
      showtime: q.time,
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
      const seatsArrFB = Array.from(state.selectedSeats).map((id) => {
        const [r, c] = id.split('-').map(Number);
        return String.fromCharCode(65 + r) + (c + 1);
      });
      const totalsFB = computeTotals();
      const booking = {
        id: `pay_local_${Math.random().toString(36).slice(2)}`,
        paymentId: `pay_local_${Date.now()}`,
        movieTitle: q.title,
        theatreName: q.theatre,
        showtime: q.time,
        seats: seatsArrFB,
        ticketCount: seatsArrFB.length,
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
closePayment?.addEventListener('click', closePay);
proceedToPay?.addEventListener('click', openPayment);
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

document.addEventListener('DOMContentLoaded', () => {
  const q = parseQuery();
  theatreName.textContent = `${q.theatre}`;
  movieName.textContent = q.title || '';
  showTime.textContent = q.time || '';
  state.currency = (CONFIG.MOVIEGLU_TERRITORY || 'IN') === 'IN' ? 'INR' : 'USD';
  state.ticketPrice = state.currency === 'INR' ? 250 : 10;
  state.seatLayout = generateSeatLayout();
  renderSeatMap();
  updateSummary();
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
      document.querySelectorAll('.payment-method-card').forEach(card => card.classList.remove('active'));
      r.closest('.payment-method-card')?.classList.add('active');
      if (cardFields) cardFields.style.display = val === 'card' ? '' : 'none';
      if (upiRow) upiRow.style.display = val === 'upi' ? '' : 'none';
      if (netbankingRow) netbankingRow.style.display = val === 'netbanking' ? '' : 'none';
      if (walletRow) walletRow.style.display = val === 'wallet' ? '' : 'none';
      updatePaymentRequirements(val);
    });
  });

  // Initialize required attributes for the default selected method
  const initPm = (document.querySelector('input[name="pm"]:checked')?.value) || 'card';
  updatePaymentRequirements(initPm);

  renderFnbGrid();

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
});


