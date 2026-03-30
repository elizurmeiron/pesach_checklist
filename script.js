// === TOAST ===
let toastTimer = null;
function showToast(html) {
  const t = document.getElementById('toast');
  t.innerHTML = html;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 5000);
}

// === SAFE LOCALSTORAGE ===
const LS_KEY = 'pesach-checklist-v1';
let lsAvailable = false;
try { localStorage.setItem('__test__','1'); localStorage.removeItem('__test__'); lsAvailable = true; } catch(e) {}

function saveState() {
  if (!lsAvailable) return;
  try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch(e) {}
}

function loadState() {
  if (!lsAvailable) return {};
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch(e) { return {}; }
}

// === STATE ===
let state = loadState();

function getKey(el) {
  const list = el.closest('.items-list');
  const section = list.dataset.section;
  const items = list.querySelectorAll('.item');
  const idx = Array.from(items).indexOf(el);
  const cat = list.closest('.category').id;
  return `${section}__${cat}__${idx}`;
}

function toggleItem(el) {
  el.classList.toggle('checked');
  const key = getKey(el);
  state[key] = el.classList.contains('checked');
  saveState();
  updateProgress();
}

function toggleCat(header) {
  header.closest('.category').classList.toggle('collapsed');
}

function toggleAllCats(section) {
  const sec = document.getElementById(`section-${section}`);
  const cats = sec.querySelectorAll('.category');
  const allCollapsed = Array.from(cats).every(c => c.classList.contains('collapsed'));
  cats.forEach(c => c.classList.toggle('collapsed', !allCollapsed));
}

function resetSection(section) {
  const sec = document.getElementById(`section-${section}`);
  sec.querySelectorAll('.item.checked').forEach(el => {
    el.classList.remove('checked');
    delete state[getKey(el)];
  });
  saveState();
  updateProgress();
}

// === GLOBAL RESET MODAL ===
function confirmResetAll() {
  const modal = document.getElementById('resetModal');
  if (modal) modal.classList.add('open');
}

function closeResetModal() {
  const modal = document.getElementById('resetModal');
  if (modal) modal.classList.remove('open');
}

function doResetAll() {
  state = {};
  saveState();
  document.querySelectorAll('.item.checked').forEach(el => el.classList.remove('checked'));
  closeResetModal();
  updateProgress();
  showToast('<strong>✅ אופס!</strong> כל הסימונים נמחקו');
}

// === PRINT ===
function doPrint() {
  try {
    window.print();
    // If print didn't throw but may still be blocked (silent fail), show tip after short delay
    setTimeout(() => {
      showToast('<strong>🖨️ הדפסה</strong> אם חלון ההדפסה לא נפתח — פתח את הקובץ ישירות בדפדפן ולחץ Ctrl+P');
    }, 600);
  } catch(e) {
    showToast('<strong>🖨️ לא ניתן להדפיס מכאן</strong> פתח את הקובץ HTML ישירות בדפדפן ולחץ Ctrl+P — כל הסימונים ישמרו');
  }
}

// === SECTION NAVIGATION ===
function showSection(id) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`section-${id}`).classList.add('active');
  document.getElementById(`tab-${id}`).classList.add('active');
}

// === PROGRESS ===
function updateProgress() {
  ['nikui','bedika','seder','shopping','erev'].forEach(section => {
    const sec = document.getElementById(`section-${section}`);
    if (!sec) return;
    const items = sec.querySelectorAll('.item');
    const done  = sec.querySelectorAll('.item.checked');
    const total = items.length, count = done.length;
    const pct   = total ? Math.round(count / total * 100) : 0;

    const el = id => document.getElementById(id);
    if (el(`prog-${section}-txt`)) el(`prog-${section}-txt`).textContent = `${count} מתוך ${total} פריטים הושלמו`;
    if (el(`bar-${section}`))      el(`bar-${section}`).style.width = `${pct}%`;
    if (el(`pct-${section}`))      el(`pct-${section}`).textContent = `${pct}%`;
    if (el(`ring-${section}`)) {
      const circ = 144.5;
      el(`ring-${section}`).style.strokeDashoffset = circ - (circ * pct / 100);
    }
    const cnt = document.getElementById(`cnt-${section}`);
    if (cnt) {
      cnt.textContent = total - count;
      cnt.className = `tab-count${(total - count) === 0 ? ' done' : ''}`;
    }
    sec.querySelectorAll('.category').forEach(cat => {
      const prog = cat.querySelector('.cat-progress');
      if (prog) {
        const ci = cat.querySelectorAll('.item').length;
        const cd = cat.querySelectorAll('.item.checked').length;
        prog.textContent = `${cd}/${ci}`;
      }
    });
  });
}

// === RESTORE STATE ===
function restoreState() {
  document.querySelectorAll('.item').forEach(el => {
    if (state[getKey(el)]) el.classList.add('checked');
  });
  if (!lsAvailable) {
    showToast('<strong>💾 שמירה מקומית אינה זמינה</strong> פתח את הקובץ ישירות בדפדפן לשמירת ההתקדמות');
  }
}

// === GLOSSARY ===
function openGlossary(entryId) {
  document.getElementById('glossaryOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
  setTimeout(() => {
    document.querySelectorAll('.glossary-entry').forEach(e => e.classList.remove('highlighted'));
    const target = document.getElementById('gentry-' + entryId);
    if (target) { target.classList.add('highlighted'); target.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
  }, 50);
}

function closeGlossary() {
  document.getElementById('glossaryOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

function closeGlossaryOnBg(e) {
  if (e.target === document.getElementById('glossaryOverlay')) closeGlossary();
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeGlossary(); closeResetModal(); }
});

// === INIT ===
restoreState();
updateProgress();
