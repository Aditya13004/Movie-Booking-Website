// Loads last booking data from sessionStorage and renders confirmation page
(function(){
  function currencyINR(n) {
    try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'INR' }).format(n); } catch { return `₹${n}`; }
  }
  function el(id){ return document.getElementById(id); }

  document.addEventListener('DOMContentLoaded', () => {
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());

    const raw = sessionStorage.getItem('EV_LAST_BOOKING');
    if (!raw) {
      el('cTitle').textContent = 'No recent booking found';
      el('cSub').textContent = 'Return to home to make a booking.';
      return;
    }

    let data;
    try { data = JSON.parse(raw); } catch { data = null; }
    if (!data) return;

    el('cTitle').textContent = `Enjoy the show!`;
    el('cSub').textContent = `${data.movieTitle || ''} — ${data.theatreName || ''}`;

    el('cId').textContent = data.paymentId || data.id || '-';
    el('cMovie').textContent = data.movieTitle || '-';
    el('cTheatre').textContent = data.theatreName || '-';
    el('cShow').textContent = data.showtime || '-';
    el('cTickets').textContent = String(data.ticketCount || (data.seats?.length || 0));
    const seats = (data.seats || []).join(', ');
    el('cSeats').textContent = seats || '-';

    const breakdown = data.breakdown || {};
    el('cTicketsSubtotal').textContent = currencyINR(breakdown.ticketsSubtotal || 0);
    el('cFnbSubtotal').textContent = currencyINR(breakdown.fnbSubtotal || 0);
    el('cDiscount').textContent = `- ${currencyINR(breakdown.discount || 0)}`;
    el('cFee').textContent = currencyINR(breakdown.convenienceFee || 0);
    el('cTax').textContent = currencyINR(breakdown.tax || 0);
    el('cTotal').textContent = currencyINR(breakdown.grandTotal || data.amount || 0);

    el('printBtn')?.addEventListener('click', () => window.print());
  });
})();
