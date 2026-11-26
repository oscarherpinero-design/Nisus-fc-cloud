const firebaseConfig = { apiKey: "AIzaSyCXssxxTsyNBrp6x08dCX9QAPts6mon_1U", authDomain: "nisus-fc.firebaseapp.com", projectId: "nisus-fc", storageBucket: "nisus-fc.firebasestorage.app", messagingSenderId: "1095183265565", appId: "1:1095183265565:web:019161bbd603bba7ccfbf4" };
if (!firebase.apps.length) { firebase.initializeApp(firebaseConfig); }
const db = firebase.firestore();
db.enablePersistence({ synchronizeTabs: true }).catch(() => {});
window.playersPath = `jugadores`; window.matchesPath = `partidos`; window.trainingsPath = `entrenamientos`; window.financesPath = `finanzas`; window.inventoryPath = `utileria`;
window.players = []; window.matches = []; window.trainings = []; window.finances = []; window.inventory = []; window.isReady = false;
window.SECRET_PIN = "2024"; window.isAdmin = localStorage.getItem('nisus_admin') === 'true';
window.currentSeason = 'all'; window.currentFilter = 'all'; let deferredPrompt;
window.generateId = function() { return crypto.randomUUID ? crypto.randomUUID() : 'x-x-4-y-x'.replace(/[xy]/g, c => { var r = Math.random()*16|0; return (c==='x'?r:r&0x3|0x8).toString(16); }); };
window.showToast = function(msg, isError = false) {
const t = document.getElementById('toast'); if(!t) return; document.getElementById('toast-msg').textContent = msg;
t.className = `fixed top-20 right-4 px-5 py-4 rounded-2xl shadow-soft transform transition-all duration-300 z-[80] flex items-center gap-3 ${isError ? 'bg-red-500 text-white' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'}`;
setTimeout(() => t.classList.remove('translate-x-[150%]'), 10); setTimeout(() => t.classList.add('translate-x-[150%]'), 3000);
};
window.toggleMenu = function() { const m = document.getElementById('side-menu'); const o = document.getElementById('side-menu-overlay'); if(m.classList.contains('-translate-x-full')) { m.classList.remove('-translate-x-full'); o.classList.remove('force-hidden'); } else { m.classList.add('-translate-x-full'); o.classList.add('force-hidden'); } };
window.showSection = function(sectionId) {
['dashboard', 'stats', 'players', 'matches', 'attendance', 'finances', 'inventory', 'playerForm', 'matchForm', 'attendanceForm', 'financesForm', 'inventoryForm', 'playerProfile'].forEach(id => { const el = document.getElementById(id); if(el) el.classList.add('hidden'); });
const sec = document.getElementById(sectionId); if(sec) { sec.classList.remove('hidden'); sec.classList.remove('section-fade-in'); void sec.offsetWidth; sec.classList.add('section-fade-in'); }
['dashboard', 'stats', 'players', 'matches', 'attendance', 'finances', 'inventory'].forEach(id => { const s = document.getElementById('nav-side-' + id); if(s) { s.classList.remove('bg-brand-50', 'dark:bg-brand-900/30', 'text-brand-700', 'dark:text-brand-300'); s.classList.add('text-slate-600', 'dark:text-slate-300'); } });
const aS = document.getElementById('nav-side-' + sectionId); if(aS) { aS.classList.add('bg-brand-50', 'dark:bg-brand-900/30', 'text-brand-700', 'dark:text-brand-300'); aS.classList.remove('text-slate-600', 'dark:text-slate-300'); }
const m = document.getElementById('side-menu'); if(m && !m.classList.contains('-translate-x-full')) window.toggleMenu();
if(sectionId === 'players') {
if(typeof window.renderPlayers === 'function') window.renderPlayers();
if(typeof window.renderBirthdaysAvailability === 'function') window.renderBirthdaysAvailability();
}
if(sectionId === 'matches' && typeof window.renderMatches === 'function') window.renderMatches();
if(sectionId === 'attendance' && typeof window.renderTrainings === 'function') window.renderTrainings();
if((sectionId === 'dashboard' || sectionId === 'stats') && typeof window.updateDashboard === 'function') window.updateDashboard();
if(sectionId === 'finances') {
if(!window.currentFinTab && typeof window.switchFinancesTab === 'function') window.switchFinancesTab('resumen');
if(typeof window.renderFinances === 'function') window.renderFinances();
}
if(sectionId === 'inventory' && typeof window.renderInventory === 'function') window.renderInventory();
window.scrollTo(0,0);
};
window.setupPWA = function() {
const manifestStr = JSON.stringify({ name: "NISUS FC", short_name: "NISUS FC", start_url: ".", display: "standalone", background_color: "#0f172a", theme_color: "#082f49", icons: [{ src: "./escudo.png", sizes: "192x192", type: "image/png" }, { src: "./escudo.png", sizes: "512x512", type: "image/png", purpose: "any maskable" }] });
const manifestBlob = new Blob([manifestStr], {type: 'application/json'}); const manifestUrl = URL.createObjectURL(manifestBlob);
const link = document.createElement('link'); link.rel = 'manifest'; link.href = manifestUrl; document.head.appendChild(link);
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredPrompt = e; const btn = document.getElementById('btn-install-pwa'); if (btn) btn.classList.remove('hidden'); });
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(()=>{});
};
window.installPWA = async function() { if (deferredPrompt) { deferredPrompt.prompt(); const { outcome } = await deferredPrompt.userChoice; if (outcome === 'accepted') { deferredPrompt = null; document.getElementById('btn-install-pwa').classList.add('hidden'); } } };
window.toggleDarkMode = function() {
const isDark = document.documentElement.classList.toggle('dark');
localStorage.setItem('nisus_theme', isDark ? 'dark' : 'light');
const label = document.getElementById('theme-label'); const ball = document.getElementById('theme-toggle-ball');
if(label && ball) {
label.innerHTML = isDark ? '<i class="fas fa-moon text-blue-400 mr-2"></i>Modo Oscuro' : '<i class="fas fa-sun text-yellow-500 mr-2"></i>Modo Claro';
if(isDark) { ball.classList.remove('translate-x-0.5'); ball.classList.add('translate-x-5'); } else { ball.classList.remove('translate-x-5'); ball.classList.add('translate-x-0.5'); }
}
if (typeof window.renderKitsPreview === 'function') window.renderKitsPreview();
if (typeof window.renderCashflowChart === 'function') { window.renderCashflowChart(); window.renderExpensesDonutChart(); }
};
window.updateAdminUI = function() {
const btn = document.getElementById('btn-admin');
const inputs = document.querySelectorAll('input:not(#admin-pin):not(#player-search):not(.public-filter), select:not(#player-position-filter):not(#season-filter):not(#season-filter-side):not(#debt-filter):not(.public-filter), textarea');
if (window.isAdmin) {
document.body.classList.remove('read-only'); if(btn) btn.innerHTML = '<i class="fas fa-unlock text-green-400"></i>';
inputs.forEach(el => { el.disabled = false; el.classList.remove('opacity-60', 'cursor-not-allowed'); });
document.querySelectorAll('.admin-only').forEach(el => el.classList.remove('force-hidden'));
} else {
document.body.classList.add('read-only'); if(btn) btn.innerHTML = '<i class="fas fa-lock text-slate-400"></i>';
inputs.forEach(el => { el.disabled = true; el.classList.add('opacity-60', 'cursor-not-allowed'); });
document.querySelectorAll('.admin-only').forEach(el => el.classList.add('force-hidden'));
}
};
window.toggleAdmin = function() {
if(window.isAdmin) { window.isAdmin=false; localStorage.removeItem('nisus_admin'); if(typeof window.clearRate === 'function') window.clearRate(); window.updateAdminUI(); window.showToast("Modo lectura activado"); }
else { document.getElementById('pinModal').classList.remove('hidden'); document.getElementById('admin-pin').value=''; document.getElementById('admin-pin').focus(); }
};
window.closePinModal = function() { document.getElementById('pinModal').classList.add('hidden'); };
window.verifyPin = function() { if(document.getElementById('admin-pin').value === window.SECRET_PIN) { window.isAdmin=true; localStorage.setItem('nisus_admin', 'true'); window.closePinModal(); window.updateAdminUI(); window.showToast("Edición desbloqueada"); } else window.showToast("PIN incorrecto", true); };
window.pendingConfirm = null;
window.showConfirm = function(msg, action) { document.getElementById('confirm-msg').textContent = msg; window.pendingConfirm = action; const m = document.getElementById('confirmModal'); const c = document.getElementById('confirmModalContent'); m.classList.remove('hidden'); setTimeout(() => { c.classList.remove('scale-95', 'opacity-0'); c.classList.add('scale-100', 'opacity-100'); }, 10); };
window.closeConfirm = function() { const m = document.getElementById('confirmModal'); const c = document.getElementById('confirmModalContent'); c.classList.remove('scale-100', 'opacity-100'); c.classList.add('scale-95', 'opacity-0'); setTimeout(() => { m.classList.add('hidden'); window.pendingConfirm = null; }, 200); };
window.executeConfirm = function() { if(window.pendingConfirm) window.pendingConfirm(); window.closeConfirm(); };
window.setFilter = function(f) {
window.currentFilter = f;
['all','f11','f7'].forEach(x=>{
const bT = document.getElementById(`btn-filter-${x}`); if(bT) bT.className = x===f ? "text-xs px-3 sm:text-sm sm:px-4 py-1.5 rounded-lg bg-white dark:bg-brand-600 text-brand-900 dark:text-white font-bold shadow-sm transition" : "text-xs px-3 sm:text-sm sm:px-4 py-1.5 rounded-lg text-brand-100 dark:text-slate-400 hover:text-white transition font-medium";
const bS = document.getElementById(`btn-side-filter-${x}`); if(bS) bS.className = x===f ? "flex-1 py-2 rounded-lg bg-white dark:bg-brand-600 text-slate-900 dark:text-white font-bold shadow-sm transition text-center" : "flex-1 py-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition font-medium text-center";
});
if(!document.getElementById('dashboard').classList.contains('hidden')) window.updateDashboard();
if(!document.getElementById('stats').classList.contains('hidden')) window.updateDashboard();
if(!document.getElementById('players').classList.contains('hidden')) window.renderPlayers();
if(!document.getElementById('matches').classList.contains('hidden')) window.renderMatches();
if(!document.getElementById('finances').classList.contains('hidden')) window.renderFinances();
};
window.setSeasonFilter = function(s) { window.currentSeason = s; const d = document.getElementById('dash-season-label'); if(d) { if(s==='all') d.classList.add('hidden'); else { d.textContent=`(T. ${s})`; d.classList.remove('hidden'); } } const dS = document.getElementById('stats-season-label'); if(dS) { if(s==='all') dS.classList.add('hidden'); else { dS.textContent=`(T. ${s})`; dS.classList.remove('hidden'); } } const sT = document.getElementById('season-filter'); if(sT && sT.value !== s) sT.value = s; const sS = document.getElementById('season-filter-side'); if(sS && sS.value !== s) sS.value = s; window.setFilter(window.currentFilter); };
window.updateSeasonDropdown = function() { const cur = window.currentSeason; const unique = [...new Set(window.matches.map(m => String(m.season||'')).filter(s=>s.trim()!==''))].sort((a,b)=>b.localeCompare(a)); const rS = (id) => { const s = document.getElementById(id); if(!s) return; s.innerHTML = '<option value="all">Todas las Temporadas</option>'; unique.forEach(x => s.innerHTML += `<option value="${x}">T. ${x}</option>`); if(cur==='all'||unique.includes(cur)) s.value = cur; else s.value='all'; }; rS('season-filter'); rS('season-filter-side'); if(cur!=='all' && !unique.includes(cur)) window.currentSeason='all'; };
window.generateKitSVG = function(shirt, accent, short, sock, accent2 = null) {
const cid = 'clip-' + Math.random().toString(36).substr(2, 9); const isDark = document.documentElement.classList.contains('dark');
const isLightKit = (shirt.toLowerCase() === '#ffffff' || shirt.toLowerCase() === '#fff'); const isDarkKit = (shirt.toLowerCase() === '#050505' || shirt.toLowerCase() === '#000' || shirt.toLowerCase() === '#111827');
let strokeColor = 'rgba(0,0,0,0.1)', strokeWidth = '1', shadowFilter = 'drop-shadow(0px 2px 3px rgba(0,0,0,0.15))';
if (isDark) { if (isDarkKit) { strokeColor = 'rgba(255,255,255,0.4)'; strokeWidth = '2.5'; shadowFilter = 'drop-shadow(0px 0px 5px rgba(255,255,255,0.2))'; } } else { if (isLightKit) { strokeColor = 'rgba(0,0,0,0.35)'; strokeWidth = '2.5'; shadowFilter = 'drop-shadow(0px 3px 4px rgba(0,0,0,0.25))'; } }
let extraPaths = '';
if (accent2) { extraPaths += `<rect x="35" y="0" width="30" height="100" fill="${accent}"/><rect x="33" y="0" width="2" height="100" fill="${accent2}"/><rect x="65" y="0" width="2" height="100" fill="${accent2}"/><polygon points="0,0 25,0 25,50 0,50" fill="${accent}"/><polygon points="75,0 100,0 100,50 75,50" fill="${accent}"/><path d="M35 15 Q50 35 65 15 Z" fill="${accent2}"/><polygon points="0,35 25,45 25,55 0,45" fill="${accent2}"/><polygon points="100,35 75,45 75,55 100,45" fill="${accent2}"/><rect x="20" y="75" width="60" height="5" fill="${accent2}"/>`; } else { extraPaths += `<path d="M40 15 C45 25, 55 25, 60 15 Z" fill="${accent}"/>`; }
return `<svg viewBox="0 0 100 120" style="width:100%;height:100%;filter:${shadowFilter};"><defs><clipPath id="${cid}"><path d="M25 15 C35 15, 65 15, 75 15 L90 35 L75 45 L75 80 L25 80 L25 45 L10 35 Z"/></clipPath></defs><path d="M25 15 C35 15, 65 15, 75 15 L90 35 L75 45 L75 80 L25 80 L25 45 L10 35 Z" fill="${shirt}"/><g clip-path="url(#${cid})">${extraPaths}</g><path d="M25 15 C35 15, 65 15, 75 15 L90 35 L75 45 L75 80 L25 80 L25 45 L10 35 Z" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}"/><path d="M25 82 L75 82 L75 105 L53 105 L50 90 L47 105 L25 105 Z" fill="${short}" stroke="${strokeColor}" stroke-width="${strokeWidth}"/><rect x="28" y="108" width="16" height="12" rx="2" fill="${sock}" stroke="${strokeColor}" stroke-width="${strokeWidth}"/><rect x="56" y="108" width="16" height="12" rx="2" fill="${sock}" stroke="${strokeColor}" stroke-width="${strokeWidth}"/></svg>`;
};
window.renderKitsPreview = function() {
const kit = document.getElementById('m-kit')?.value || 'white_blue';
let nS='#ffffff', nA='#0284c7', nSh='#111827', nSo='#111827', nAc2='#111827';
if (kit === 'black') { nS='#050505'; nA='#050505'; nAc2=null; nSh='#050505'; nSo='#050505'; }
const oS = document.getElementById('m-opp-shirt')?.value || '#ff0000', oSh = document.getElementById('m-opp-shorts')?.value || '#ff0000', oSo = document.getElementById('m-opp-socks')?.value || '#ff0000', oGk = document.getElementById('m-opp-gk')?.value || '#00ff00';
const dN = document.getElementById('kit-nisus-outfield'); if(dN) dN.innerHTML = window.generateKitSVG(nS, nA, nSh, nSo, nAc2);
const dNG = document.getElementById('kit-nisus-gk'); if(dNG) dNG.innerHTML = window.generateKitSVG('#eab308', '#050505', '#050505', '#050505');
const dO = document.getElementById('kit-opp-outfield'); if(dO) dO.innerHTML = window.generateKitSVG(oS, oS, oSh, oSo);
const dOG = document.getElementById('kit-opp-gk'); if(dOG) dOG.innerHTML = window.generateKitSVG(oGk, oGk, oGk, oGk);
const lbl = document.getElementById('label-opp-kit'); if(lbl) lbl.textContent = document.getElementById('m-opponent')?.value || 'Rival';
};
window.getDiscipline = function(playerId, tournament) {
if (!tournament || !playerId) return { suspended: false, yellows: 0, suspensionsLeft: 0 };
const tourneyMatches = (window.matches || []).filter(m => m && (m.status === 'finished' || m.status === 'forfait') && typeof m.tournament === 'string' && m.tournament.trim().toLowerCase() === tournament.trim().toLowerCase()).sort((a, b) => new Date(a.date||0) - new Date(b.date||0));
let accYellows = 0; let suspensions = 0;
tourneyMatches.forEach(m => {
if (suspensions > 0) suspensions--;
if (m.events && Array.isArray(m.events)) {
let y = 0, dy = 0, r = 0;
m.events.forEach(e => { if (e && e.playerId === playerId) { if (e.type === 'yellows') y++; if (e.type === 'double_yellow') dy++; if (e.type === 'reds') r++; } });
if (dy > 0) suspensions += 1;
else { accYellows += y; if (accYellows >= 3) { suspensions += Math.floor(accYellows / 3); accYellows = accYellows % 3; } if (r > 0) suspensions += 1; }
}
});
return { suspended: suspensions > 0, yellows: accYellows, suspensionsLeft: suspensions };
};
window.getPlayerArchivedStat = function(player, statKey) {
if(!player) return 0; if(player.isStaff && ['games', 'goals', 'assists', 'cleanSheets', 'mvps', 'penalty', 'freekick'].includes(statKey)) return 0;
let count = 0;
(window.matches || []).forEach(m => {
if (!m || m.status !== 'archived') return;
const lArr = Array.isArray(m.lineup) ? m.lineup : []; const eArr = Array.isArray(m.events) ? m.events : [];
const played = lArr.some(l => l && l.playerId === player.id && l.x !== null) || eArr.some(e => e && e.type === 'sub' && e.playerId === player.id);
if (statKey === 'games' && played && !player.isStaff) count++;
if (statKey === 'cleanSheets' && played && (parseInt(m.goalsThem || 0) === 0)) { const posRaw = player.positions || player.position || []; const pos = Array.isArray(posRaw) ? posRaw : (typeof posRaw === 'string' ? posRaw.split(',') : [posRaw]); if (pos.includes('Portero') && !player.isStaff) count++; }
if (statKey === 'mvps' && m.mvp === player.id && !player.isStaff) count++;
eArr.forEach(ev => { if (ev && ev.playerId === player.id) { if (statKey === 'goals' && (ev.type === 'goals' || ev.type === 'penalty' || ev.type === 'freekick')) count++; else if (statKey === 'reds' && (ev.type === 'reds' || ev.type === 'double_yellow')) count++; else if (statKey === ev.type) count++; } });
}); return count;
};
window.getPlayerStat = function(player, statKey, onlyActive = false) {
if(!player) return 0;
if(player.isStaff && ['games', 'goals', 'assists', 'cleanSheets', 'mvps', 'penalty', 'freekick'].includes(statKey)) return 0;
let count = 0;
(window.matches || []).forEach(m => {
const validStatuses = onlyActive ? ['finished', 'forfait'] : ['finished', 'forfait', 'archived'];
if (!m || !validStatuses.includes(m.status)) return;
if (window.currentSeason !== 'all' && m.season !== window.currentSeason) return;
if (window.currentFilter !== 'all' && m.modality !== window.currentFilter) return;
const lArr = Array.isArray(m.lineup) ? m.lineup : [];
const eArr = Array.isArray(m.events) ? m.events : [];
const played = lArr.some(l => l && l.playerId === player.id && l.x !== null) || eArr.some(e => e && e.type === 'sub' && e.playerId === player.id);
if (statKey === 'games' && played && !player.isStaff) count++;
if (statKey === 'cleanSheets' && played && (m.goalsThem == 0 || m.goalsThem === "0")) {
const posRaw = player.positions || player.position || [];
const pos = Array.isArray(posRaw) ? posRaw : (typeof posRaw === 'string' ? posRaw.split(',') : [posRaw]);
if (pos.includes('Portero') && !player.isStaff) count++;
}
if (statKey === 'mvps' && m.mvp === player.id && !player.isStaff) count++;
eArr.forEach(ev => {
if (ev && ev.playerId === player.id) {
if (statKey === 'goals' && (ev.type === 'goals' || ev.type === 'penalty' || ev.type === 'freekick')) count++;
else if (statKey === 'reds' && (ev.type === 'reds' || ev.type === 'double_yellow')) count++;
else if (statKey === ev.type) count++;
}
});
});
return count;
};
window.toggleReturnDateField = function() { const s = document.getElementById('p-status').value; const c = document.getElementById('p-return-date-container'); if(s==='injured'||s==='absent'||s==='inactive') c.classList.remove('hidden'); else c.classList.add('hidden'); };
window.newPlayer = function() { document.getElementById('player-form').reset(); document.getElementById('p-id').value = ''; document.getElementById('form-title').innerHTML = '<i class="fas fa-user-plus text-brand-500 mr-2"></i>Inscribir Miembro'; document.getElementById('p-image-preview').classList.add('hidden'); document.getElementById('p-image-placeholder').classList.remove('hidden'); document.getElementById('p-image-base64').value = ''; window._pendingPhotoBlob = null; window._removePhotoFlag = false; const overlay = document.getElementById('p-image-overlay'); if(overlay) overlay.classList.remove('flex-show'); const sel = document.getElementById('p-position'); for(let i=0;i<sel.options.length;i++) sel.options[i].selected=false; window.toggleReturnDateField(); const notesInput = document.getElementById('p-status-notes'); if(notesInput) notesInput.value = ''; window._setupPhotoDropzone(); window.showSection('playerForm'); };
window.handleImageUpload = function(e) { const f = e.target.files[0]; if(!f) return; if(!f.type.startsWith('image/')) return window.showToast('Solo imágenes', true); window._compressPlayerImage(f); };
window._compressPlayerImage = function(file) {
const spinner = document.getElementById('p-image-spinner'), preview = document.getElementById('p-image-preview'), placeholder = document.getElementById('p-image-placeholder'), overlay = document.getElementById('p-image-overlay');
if(spinner) spinner.classList.add('flex-show'); const r = new FileReader();
r.onload = function(ev) {
const img = new Image();
img.onload = function() {
const maxDim = 400; let w = img.width, h = img.height;
if (w > h && w > maxDim) { h = Math.round(h * maxDim / w); w = maxDim; } else if (h > maxDim) { w = Math.round(w * maxDim / h); h = maxDim; }
const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const ct = cv.getContext('2d'); ct.imageSmoothingQuality = 'high'; ct.drawImage(img, 0, 0, w, h);
cv.toBlob(function(blob) {
if(!blob) { if(spinner) spinner.classList.remove('flex-show'); return window.showToast('Error al procesar imagen', true); }
window._pendingPhotoBlob = blob; const url = URL.createObjectURL(blob);
preview.src = url; preview.classList.remove('hidden'); placeholder.classList.add('hidden');
if(overlay) overlay.classList.add('flex-show'); if(spinner) spinner.classList.remove('flex-show');
document.getElementById('p-image-base64').value = ''; const hint = document.getElementById('p-photo-hint'); if(hint) hint.textContent = 'Imagen lista. Se subirá al guardar la ficha.';
}, 'image/jpeg', 0.85);
};
img.onerror = function() { if(spinner) spinner.classList.remove('flex-show'); window.showToast('Imagen corrupta', true); }; img.src = ev.target.result;
};
r.readAsDataURL(file);
};
window.removePlayerPhoto = function() {
window._pendingPhotoBlob = null; document.getElementById('p-image-base64').value = ''; document.getElementById('p-image-preview').src = ''; document.getElementById('p-image-preview').classList.add('hidden'); document.getElementById('p-image-placeholder').classList.remove('hidden');
const overlay = document.getElementById('p-image-overlay'); if(overlay) overlay.classList.remove('flex-show');
window._removePhotoFlag = true; const hint = document.getElementById('p-photo-hint'); if(hint) hint.textContent = 'Arrastra una imagen o haz clic.';
};
window._setupPhotoDropzone = function() {
const dz = document.getElementById('p-photo-dropzone'); if(!dz || dz._dropzoneReady) return; dz._dropzoneReady = true;
['dragenter','dragover'].forEach(ev => dz.addEventListener(ev, function(e) { e.preventDefault(); e.stopPropagation(); dz.classList.add('border-brand-500','bg-brand-50','dark:bg-brand-900/20'); }));
['dragleave','drop'].forEach(ev => dz.addEventListener(ev, function(e) { e.preventDefault(); e.stopPropagation(); dz.classList.remove('border-brand-500','bg-brand-50','dark:bg-brand-900/20'); }));
dz.addEventListener('drop', function(e) { const f = e.dataTransfer.files[0]; if(f && f.type.startsWith('image/')) window._compressPlayerImage(f); });
dz.addEventListener('click', function() { if(document.getElementById('p-image-preview').classList.contains('hidden')) document.getElementById('p-image-upload').click(); });
};
window.savePlayer = async function(e) {
e.preventDefault(); if(!window.isAdmin) return window.showToast('Solo Lectura', true);
const btn = document.getElementById('btn-save-player'); btn.disabled=true; btn.textContent="Guardando...";
const id = document.getElementById('p-id').value; const docId = id || window.generateId();
const positions = Array.from(document.getElementById('p-position').selectedOptions).map(o=>o.value);
const pStatus = document.getElementById('p-status').value || 'active';
let returnD = null, statusNotes = '';
if(pStatus === 'injured' || pStatus === 'absent' || pStatus === 'inactive') { returnD = document.getElementById('p-return-date').value || null; statusNotes = document.getElementById('p-status-notes')?.value || ''; }
const oldP = window.players.find(x => x.id === id);
let imageUrl = document.getElementById('p-image-base64').value;
if (window._removePhotoFlag) { imageUrl = ''; try { await firebase.storage().ref(`jugadores/${docId}.jpg`).delete(); } catch(err) {} }
else if (window._pendingPhotoBlob) { try { const ref = firebase.storage().ref(`jugadores/${docId}.jpg`); await ref.put(window._pendingPhotoBlob); imageUrl = await ref.getDownloadURL(); } catch (error) { window.showToast('Error subiendo imagen', true); imageUrl = oldP ? (oldP.image || '') : ''; }
} else if (!imageUrl && oldP && oldP.image && !oldP.image.startsWith('data:image')) { imageUrl = oldP.image; }
const realDebt = typeof window.getPlayerDebts === 'function' ? window.getPlayerDebts(docId).total : 0;
const pData = { id: docId, name: document.getElementById('p-name').value, alias: document.getElementById('p-alias').value, showAlias: document.getElementById('p-show-alias').checked, number: document.getElementById('p-number').value, positions: positions, image: imageUrl, birthdate: document.getElementById('p-birthdate').value, foot: document.getElementById('p-foot').value, status: pStatus, returnDate: returnD, statusNotes: statusNotes, availableF11: document.getElementById('p-avail-f11').checked, availableF7: document.getElementById('p-avail-f7').checked, isStaff: document.getElementById('p-is-staff').checked, debtAmount: Number(realDebt.toFixed(2)), isPaidUp: realDebt <= 0.01 };
try { await db.collection(window.playersPath).doc(docId).set(pData); window._pendingPhotoBlob = null; window._removePhotoFlag = false; window.showToast('Guardado'); window.showSection('players'); } catch(err) { window.showToast('Error', true); } finally { btn.disabled=false; btn.textContent="Guardar Ficha"; }
};
window.editPlayer = function(id) {
const p = window.players.find(x => x.id === id); if(!p) return;
document.getElementById('p-id').value = p.id; document.getElementById('p-name').value = p.name; document.getElementById('p-alias').value = p.alias||''; document.getElementById('p-show-alias').checked = p.showAlias||false; document.getElementById('p-number').value = p.number||''; document.getElementById('p-image-base64').value = p.image||''; document.getElementById('p-birthdate').value = p.birthdate||''; document.getElementById('p-foot').value = p.foot||''; document.getElementById('p-status').value = p.status||'active'; document.getElementById('p-return-date').value = p.returnDate||'';
const notesInput = document.getElementById('p-status-notes'); if(notesInput) notesInput.value = p.statusNotes||'';
document.getElementById('p-avail-f11').checked = p.availableF11; document.getElementById('p-avail-f7').checked = p.availableF7; document.getElementById('p-is-staff').checked = p.isStaff||false; document.getElementById('p-is-paid-up').checked = p.isPaidUp!==false;
const sel = document.getElementById('p-position'); const pos = p.positions||(p.position?[p.position]:[]); for(let i=0;i<sel.options.length;i++) sel.options[i].selected = pos.includes(sel.options[i].value);
if(p.image){ document.getElementById('p-image-preview').src=p.image; document.getElementById('p-image-preview').classList.remove('hidden'); document.getElementById('p-image-placeholder').classList.add('hidden'); const overlay = document.getElementById('p-image-overlay'); if(overlay) overlay.classList.add('flex-show'); } else { document.getElementById('p-image-preview').classList.add('hidden'); document.getElementById('p-image-placeholder').classList.remove('hidden'); const overlay = document.getElementById('p-image-overlay'); if(overlay) overlay.classList.remove('flex-show'); }
window._pendingPhotoBlob = null; window._removePhotoFlag = false; window._setupPhotoDropzone();
document.getElementById('form-title').innerHTML = '<i class="fas fa-user-edit text-brand-500 mr-2"></i>Editar Ficha'; window.toggleReturnDateField(); window.updateAdminUI(); window.showSection('playerForm');
};
window.deletePlayer = function(id) { window.showConfirm('¿Eliminar jugador permanentemente?', async () => { try { await db.collection(window.playersPath).doc(id).delete(); try { await firebase.storage().ref(`jugadores/${id}.jpg`).delete(); } catch(err) {} window.showToast('Eliminado'); } catch(e) { window.showToast('Error', true); } }); };
window.renderPlayers = function() {
const grid = document.getElementById('players-grid'); if(!grid) return; grid.innerHTML = '';
let list = (window.players || []).filter(p => p.status !== 'inactive' || document.getElementById('player-position-filter')?.value === 'inactive');
if(window.currentFilter==='f11') list = list.filter(p => p?.availableF11); else if(window.currentFilter==='f7') list = list.filter(p => p?.availableF7);
const q = (document.getElementById('player-search')?.value || '').trim().toLowerCase();
const posF = document.getElementById('player-position-filter')?.value || '';
if(q) list = list.filter(p => { const n = (p?.name || '').toLowerCase(); const al = (p?.alias || '').toLowerCase(); const num = String(p?.number || ''); return n.includes(q) || al.includes(q) || num === q; });
if(posF) {
if(posF === 'Staff') list = list.filter(p => p?.isStaff);
else if(posF === 'inactive') list = (window.players || []).filter(p => p?.status === 'inactive');
else list = list.filter(p => { const posRaw = p?.positions || p?.position || []; const pos = Array.isArray(posRaw) ? posRaw : (typeof posRaw === 'string' ? posRaw.split(',') : [posRaw]); return pos.includes(posF); });
}
list.sort((a,b) => { if (a?.isStaff && !b?.isStaff) return 1; if (!a?.isStaff && b?.isStaff) return -1; const nA = parseInt(a?.number) || 9999; const nB = parseInt(b?.number) || 9999; if(nA !== nB) return nA - nB; return (a?.name || '').localeCompare(b?.name || ''); });
if(list.length === 0){ grid.innerHTML = `<div class="col-span-full text-center text-slate-500 py-10 bg-white dark:bg-darkcard rounded-2xl border border-slate-200 dark:border-slate-800">No hay registros</div>`; return; }
list.forEach(p => {
if(!p) return;
const games = window.getPlayerStat(p, 'games'), goals = window.getPlayerStat(p, 'goals'), assists = window.getPlayerStat(p, 'assists'), yellows = window.getPlayerStat(p, 'yellows'), reds = window.getPlayerStat(p, 'reds'), mvps = window.getPlayerStat(p, 'mvps'), cleanSheets = window.getPlayerStat(p, 'cleanSheets');
const attendance = (window.trainings || []).filter(t => t?.attendees && Array.isArray(t.attendees) && t.attendees.includes(p.id)).length;
let b=''; const badges = [];
const posRaw = p.positions || p.position || []; const pos = Array.isArray(posRaw) ? posRaw : (typeof posRaw === 'string' ? posRaw.split(',') : [posRaw]);
if(p.availableF11) badges.push('<span class="bg-brand-600 text-white px-1.5 py-0.5 rounded text-[8px] font-black uppercase">F11</span>');
if(p.availableF7) badges.push('<span class="bg-green-600 text-white px-1.5 py-0.5 rounded text-[8px] font-black uppercase">F7</span>');
if(mvps > 0) badges.push(`<span class="bg-yellow-500 text-white px-1.5 py-0.5 rounded text-[8px] font-black uppercase"><i class="fas fa-star"></i> ${mvps}</span>`);
if(pos.includes('Portero') && cleanSheets > 0) badges.push(`<span class="bg-teal-500 text-white px-1.5 py-0.5 rounded text-[8px] font-black uppercase">🛡️ ${cleanSheets}</span>`);
b = badges.join('<span class="text-slate-300 dark:text-slate-600 text-[8px]">·</span> '); if(b) b = `<div class="flex items-center gap-1 flex-wrap">${b}</div>`;
const dData = typeof window.getPlayerDebts === 'function' ? window.getPlayerDebts(p.id) : { total: 0 };
const debtBadge = (dData?.total || 0) > 0.01 ? `<span class="text-red-500 dark:text-red-400 font-black text-[10px] ml-1"><i class="fas fa-exclamation-circle"></i> ${(dData.total).toFixed(2)}</span>` : '<span class="text-green-500 dark:text-green-400 font-black text-[10px] ml-1"><i class="fas fa-check-circle"></i> Al Día</span>';
let sb='', oc=''; const returnDateStr = p.returnDate && typeof p.returnDate === 'string' && p.returnDate.includes('-') ? p.returnDate.split('-').reverse().join('/') : 'Indefinido';
if(p.status==='injured'){ sb=`<span class="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded text-[10px] font-bold border border-red-200 dark:border-red-800/50 block mt-2 text-center w-full"><i class="fas fa-briefcase-medical mr-1"></i> Lesión${p.returnDate?` (Hasta ${returnDateStr})`:''}</span>`; oc='opacity-75 hover:opacity-100'; }
else if(p.status==='suspended'){ sb=`<span class="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded text-[10px] font-bold border border-red-200 dark:border-red-800/50 block mt-2 text-center w-full"><i class="fas fa-ban mr-1"></i> Sanción</span>`; oc='opacity-75 hover:opacity-100'; }
else if(p.status==='absent'){ sb=`<span class="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded text-[10px] font-bold border border-slate-300 dark:border-slate-600 block mt-2 text-center w-full"><i class="fas fa-plane mr-1"></i> Ausente${p.returnDate?` (Hasta ${returnDateStr})`:''}</span>`; oc='opacity-75 hover:opacity-100'; }
else if(p.status==='inactive'){ sb=`<span class="bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded text-[10px] font-bold border border-slate-300 dark:border-slate-700 block mt-2 text-center w-full"><i class="fas fa-pause-circle mr-1"></i> Inactivo / En duda</span>`; oc='opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all'; }
let pb='', sh='';
if(p.isStaff){
pb = `<span class="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-3 py-1 rounded font-bold text-[10px] uppercase tracking-widest"><i class="fas fa-user-tie"></i> Cuerpo Técnico</span>`;
sh = `<div class="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl mb-4 border border-slate-200 dark:border-slate-800"><div class="flex-1"><p class="text-[9px] text-slate-400 font-bold uppercase tracking-widest">ASIST. ENT</p><p class="text-xl font-black text-slate-800 dark:text-slate-200">${attendance}</p></div><div class="flex gap-4"><div class="text-center"><p class="text-[9px]">🟨</p><p class="font-black text-yellow-500">${yellows}</p></div><div class="text-center"><p class="text-[9px]">🟥</p><p class="font-black text-red-500">${reds}</p></div></div></div>`;
} else {
pb = `<span class="bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-white px-2 py-1 rounded font-black text-xs mr-1 shadow-sm">#${p.number||'-'}</span>` + pos.map(x=>`<span class="bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 px-2 py-1 rounded border border-brand-200 dark:border-brand-800/50 font-bold text-[10px] shadow-sm">${x}</span>`).join(' ');
sh = `<div class="grid grid-cols-6 gap-1 text-center bg-slate-50 dark:bg-slate-900/50 p-2 rounded-xl mb-4 border border-slate-200 dark:border-slate-800"><div class="border-r border-slate-200 dark:border-slate-700"><p class="text-[9px] text-slate-400 font-bold uppercase">PJ</p><p class="font-black text-slate-800 dark:text-slate-200">${games}</p></div><div class="border-r border-slate-200 dark:border-slate-700"><p class="text-[9px] text-brand-500 font-bold uppercase">ENT</p><p class="font-black text-brand-600 dark:text-brand-400">${attendance}</p></div><div class="border-r border-slate-200 dark:border-slate-700"><p class="text-[9px] text-slate-400 font-bold uppercase">G</p><p class="font-black text-green-500">${goals}</p></div><div class="border-r border-slate-200 dark:border-slate-700"><p class="text-[9px] text-slate-400 font-bold uppercase">A</p><p class="font-black text-blue-500">${assists}</p></div><div class="border-r border-slate-200 dark:border-slate-700"><p class="text-[9px]">🟨</p><p class="font-black text-yellow-500">${yellows}</p></div><div><p class="text-[9px]">🟥</p><p class="font-black text-red-500">${reds}</p></div></div>`;
}
const validName = (typeof p.name === 'string' && p.name.trim() !== '') ? p.name.trim() : '?';
const ini = validName.charAt(0).toUpperCase();
const img = p.image?`<img src="${p.image}" class="w-16 h-16 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700 shadow-md">`:`<div class="w-16 h-16 rounded-full ${p.isStaff?'bg-purple-100 text-purple-600 dark:bg-purple-900/50':'bg-brand-100 text-brand-600 dark:bg-brand-900/50'} font-black flex items-center justify-center text-2xl border-2 border-slate-200 dark:border-slate-700 shadow-md">${ini}</div>`;
grid.innerHTML += `<div class="bg-white dark:bg-darkcard rounded-2xl shadow-soft dark:shadow-soft-dark border border-slate-200 dark:border-slate-800 p-5 flex flex-col ${oc} relative transition-all hover:-translate-y-1 hover:shadow-lg"><div class="admin-only absolute top-4 right-4 flex gap-2 z-20"><button onclick="window.editPlayer('${p.id}')" class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-brand-500 hover:bg-brand-50 hover:text-brand-600 transition"><i class="fas fa-edit"></i></button><button onclick="window.deletePlayer('${p.id}')" class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-red-400 hover:bg-red-50 hover:text-red-500 transition"><i class="fas fa-trash"></i></button></div><div class="flex items-center gap-4 mb-3 mt-2 cursor-pointer" onclick="window.openPlayerProfile('${p.id}')">${img}<div class="overflow-hidden"><h3 class="font-black text-slate-900 dark:text-white text-lg truncate">${validName === '?' ? 'Sin Nombre' : validName}</h3>${p.alias?`<p class="font-medium italic text-slate-400 text-xs">"${p.alias}"</p>`:''}${b}</div></div><div class="flex items-center justify-between mb-3"><div class="flex flex-wrap gap-1">${pb}</div>${debtBadge}</div>${sb}<div class="mt-auto pt-4">${sh}<button onclick="window.openPlayerProfile('${p.id}')" class="w-full py-2.5 bg-brand-50 dark:bg-brand-900/20 hover:bg-brand-100 dark:hover:bg-brand-900/40 text-brand-700 dark:text-brand-300 rounded-xl text-xs font-bold uppercase tracking-widest transition flex items-center justify-center gap-2"><i class="fas fa-id-card"></i> Ver Perfil</button></div></div>`;
});
};
window.currentPlayer360 = null; window.radarChart360 = null;
window.switchProfileTab = function(tab) {
['rendimiento', 'clinica', 'finanzas', 'ficha'].forEach(t => {
document.getElementById('ptab-' + t).classList.add('hidden');
const btn = document.getElementById('ptab-btn-' + t);
if (btn) { btn.classList.remove('bg-brand-600', 'text-white', 'shadow-sm'); btn.classList.add('text-slate-500'); }
});
document.getElementById('ptab-' + tab).classList.remove('hidden');
const activeBtn = document.getElementById('ptab-btn-' + tab);
if (activeBtn) { activeBtn.classList.remove('text-slate-500'); activeBtn.classList.add('bg-brand-600', 'text-white', 'shadow-sm'); }
};
window.openPlayerProfile = function(id) {
const p = (window.players || []).find(x => x?.id === id); if (!p) return;
window.currentPlayer360 = p;
const validName = (typeof p.name === 'string' && p.name.trim() !== '') ? p.name.trim() : 'Sin Nombre';
const posRaw = Array.isArray(p.positions) && p.positions.length > 0 ? p.positions[0] : (typeof p.positions === 'string' ? p.positions.split(',')[0] : (p.position || 'Jugador'));
const pos = p.isStaff ? 'Cuerpo Técnico' : posRaw;
document.getElementById('pp-name').textContent = validName;
document.getElementById('pp-alias-pos').textContent = p.alias ? `"${p.alias}" · ${pos}` : pos;
let age='--', ft=p.foot ? p.foot.toUpperCase() : 'N/E';
if(p.birthdate && p.birthdate.includes('-')) {
const bd = new Date(p.birthdate.split('-')[0], p.birthdate.split('-')[1]-1, p.birthdate.split('-')[2]), td = new Date();
let ca = td.getFullYear()-bd.getFullYear(); const m = td.getMonth()-bd.getMonth(); if(m<0||(m===0&&td.getDate()<bd.getDate())) ca--;
age = ca+' AÑOS';
}
const ageFootEl = document.getElementById('pp-age-foot');
if (ageFootEl) ageFootEl.innerHTML = `<i class="fas fa-birthday-cake mr-1"></i> ${age} <span class="mx-2 text-slate-300 dark:text-slate-700">|</span> <i class="fas fa-shoe-prints mr-1"></i> Pie: ${ft}`;
const editBtn = document.getElementById('pp-btn-edit');
if (editBtn) {
editBtn.onclick = () => window.editPlayer(p.id);
if (!document.getElementById('pp-actions-wrapper')) {
const wrapper = document.createElement('div'); wrapper.id = 'pp-actions-wrapper';
wrapper.className = 'flex flex-col sm:flex-row gap-2 w-full sm:w-auto mt-6 sm:mt-0 sm:pr-14 shrink-0 relative z-20';
editBtn.parentNode.insertBefore(wrapper, editBtn); wrapper.appendChild(editBtn);
wrapper.insertAdjacentHTML('afterbegin', `<button id="pp-btn-finances-report" class="admin-only bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 hover:text-green-700 dark:text-green-400 text-green-600 dark:text-green-500 px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border border-green-200 dark:border-green-800 shadow-sm"><i class="fas fa-file-invoice-dollar"></i> Finanzas</button>`);
}
const ppFinBtn = document.getElementById('pp-btn-finances-report');
if (ppFinBtn) ppFinBtn.onclick = () => window.openPlayerFinancialReport(p.id);
}
const imgCont = document.getElementById('pp-image-container');
const ini = validName.charAt(0).toUpperCase();
imgCont.innerHTML = p.image ? `<img src="${p.image}" class="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-4 border-white dark:border-slate-800 shadow-lg">` : `<div class="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl ${p.isStaff?'bg-purple-100 text-purple-600':'bg-brand-100 text-brand-600'} font-black flex items-center justify-center text-4xl border-4 border-white dark:border-slate-800 shadow-lg">${ini}</div>`;
const badgesEl = document.getElementById('pp-badges'); badgesEl.innerHTML = '';
if(p.number) badgesEl.innerHTML += `<span class="bg-slate-900 text-white px-3 py-1 rounded-lg text-xs font-black shadow-sm">#${p.number}</span>`;
if(p.availableF11) badgesEl.innerHTML += `<span class="bg-blue-100 text-blue-700 border border-blue-200 px-3 py-1 rounded-lg text-[10px] font-black uppercase">F11</span>`;
if(p.availableF7) badgesEl.innerHTML += `<span class="bg-green-100 text-green-700 border border-green-200 px-3 py-1 rounded-lg text-[10px] font-black uppercase">F7</span>`;
window.renderProfileRendimiento(p); window.renderProfileClinica(p); window.renderProfileFinanzas(p); window.renderProfileFicha(p);
window.switchProfileTab('rendimiento'); window.showSection('playerProfile');
};
window.closePlayerProfile = function() { document.getElementById('playerProfile').classList.add('hidden'); window.showSection('players'); };
window.renderProfileRendimiento = function(p) {
const games = window.getPlayerStat(p, 'games', true);
const goals = window.getPlayerStat(p, 'goals', true);
const assists = window.getPlayerStat(p, 'assists', true);
const mvps = window.getPlayerStat(p, 'mvps', true);
const yellows = window.getPlayerStat(p, 'yellows', true);
const reds = window.getPlayerStat(p, 'reds', true);
const aGames = window.getPlayerArchivedStat(p, 'games');
const aGoals = window.getPlayerArchivedStat(p, 'goals');
const aAssists = window.getPlayerArchivedStat(p, 'assists');
const aMvps = window.getPlayerArchivedStat(p, 'mvps');
const totalTrainings = window.trainings ? window.trainings.length : 0;
const attendance = (window.trainings || []).filter(t => t?.attendees && t.attendees.includes(p.id)).length;
const attPct = totalTrainings > 0 ? Math.round((attendance/totalTrainings)*100) : 0;
let defCleanSheets = 0;
(window.matches || []).forEach(m => {
if (m.status === 'finished') {
const played = (Array.isArray(m.lineup) && m.lineup.some(l => l.playerId === p.id)) || (Array.isArray(m.events) && m.events.some(e => e.type === 'sub' && e.playerId === p.id));
if (played && parseInt(m.goalsThem || 0) === 0) defCleanSheets++;
}
});
document.getElementById('pp-stats-grid').innerHTML = `
<div class="col-span-full mb-1 border-b border-slate-200 dark:border-slate-800 pb-2"><span class="text-xs font-black text-brand-600 dark:text-brand-400 uppercase tracking-widest"><i class="fas fa-play-circle mr-1"></i> Torneo Actual</span></div>
<div class="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-center"><p class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Partidos</p><p class="text-2xl font-black text-slate-800 dark:text-white">${games}</p></div>
<div class="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-center"><p class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Goles</p><p class="text-2xl font-black text-green-500">${goals}</p></div>
<div class="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-center"><p class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Asistencias</p><p class="text-2xl font-black text-blue-500">${assists}</p></div>
<div class="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-center"><p class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Asistencia</p><p class="text-2xl font-black ${attPct>=75?'text-green-500':attPct>=50?'text-yellow-500':'text-red-500'}">${attPct}%</p></div>
<div class="col-span-full mt-4 mb-1 border-b border-slate-200 dark:border-slate-800 pb-2"><span class="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest"><i class="fas fa-archive mr-1"></i> Historial (Torneos Pasados)</span></div>
<div class="bg-slate-100 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-center opacity-80"><p class="text-[9px] font-bold uppercase tracking-widest text-slate-500">Partidos</p><p class="text-lg font-black text-slate-700 dark:text-slate-300">${aGames}</p></div>
<div class="bg-slate-100 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-center opacity-80"><p class="text-[9px] font-bold uppercase tracking-widest text-slate-500">Goles</p><p class="text-lg font-black text-slate-700 dark:text-slate-300">${aGoals}</p></div>
<div class="bg-slate-100 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-center opacity-80"><p class="text-[9px] font-bold uppercase tracking-widest text-slate-500">Asistencias</p><p class="text-lg font-black text-slate-700 dark:text-slate-300">${aAssists}</p></div>
<div class="bg-slate-100 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-center opacity-80"><p class="text-[9px] font-bold uppercase tracking-widest text-slate-500">MVPs</p><p class="text-lg font-black text-slate-700 dark:text-slate-300">${aMvps}</p></div>
`;
if (window.radarChart360) { window.radarChart360.destroy(); window.radarChart360 = null; }
if (typeof Chart !== 'undefined' && document.getElementById('pp-radar-chart')) {
const isDark = document.documentElement.classList.contains('dark'); const textColor = isDark ? '#cbd5e1' : '#64748b';
const scoreAtaque = Math.min(100, (goals / (games || 1)) * 120); const scoreCreacion = Math.min(100, (assists / (games || 1)) * 150); const scoreDefensa = Math.min(100, (defCleanSheets / (games || 1)) * 200); const scoreMVP = Math.min(100, (mvps / (games || 1)) * 400); const scoreDisciplina = Math.max(0, 100 - (yellows * 15) - (reds * 30));
const radarData = p.isStaff ? [10, 10, 10, 10, 10] : [scoreAtaque, scoreCreacion, scoreDefensa, scoreMVP, scoreDisciplina];
window.radarChart360 = new Chart(document.getElementById('pp-radar-chart'), { type: 'radar', data: { labels: ['Ataque', 'Creación', 'Defensa', 'Relevancia (MVP)', 'Disciplina'], datasets: [{ label: 'Nivel', data: radarData, backgroundColor: 'rgba(14, 165, 233, 0.2)', borderColor: '#0ea5e9', pointBackgroundColor: '#0ea5e9', borderWidth: 2 }] }, options: { scales: { r: { angleLines: { color: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }, grid: { color: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }, pointLabels: { color: textColor, font: {size: 10, weight: 'bold'} }, ticks: { display: false, max: 100, min: 0, stepSize: 20 } } }, plugins: { legend: { display: false } }, responsive: true, maintainAspectRatio: false } });
}
const fgEl = document.getElementById('pp-form-guide'); fgEl.innerHTML = '';
const recentMatches = (window.matches || []).filter(m => m.status === 'finished' && Array.isArray(m.lineup) && m.lineup.some(l => l.playerId === p.id)).sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
if(recentMatches.length === 0) fgEl.innerHTML = '<p class="text-sm text-slate-500 italic py-4 text-center">No ha jugado partidos recientes</p>';
recentMatches.forEach(m => {
let us = parseInt(m.goalsUs)||0, them = parseInt(m.goalsThem)||0; let res = us > them ? 'V' : (us < them ? 'D' : 'E'); let col = res === 'V' ? 'bg-green-500' : (res === 'D' ? 'bg-red-500' : 'bg-slate-400');
let evs = ''; (m.events || []).forEach(e => { if(e.playerId === p.id) { if(['goals', 'penalty', 'freekick'].includes(e.type)) evs += '⚽ '; if(e.type === 'assists') evs += '👟 '; if(e.type === 'yellows') evs += '🟨 '; if(e.type === 'reds' || e.type === 'double_yellow') evs += '🟥 '; } });
fgEl.innerHTML += `<div class="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800"><div class="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-xs shadow-sm ${col}">${res}</div><div class="flex-1 min-w-0"><p class="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">vs ${m.opponent}</p><p class="text-[10px] text-slate-400">${new Date(m.date+'T12:00:00').toLocaleDateString('es-ES')}</p></div><div class="text-right text-xs shrink-0">${evs}</div></div>`;
});
};
window.renderProfileClinica = function(p) {
const medEl = document.getElementById('pp-medical-status');
const returnDateStr = p.returnDate && p.returnDate.includes('-') ? p.returnDate.split('-').reverse().join('/') : 'Indefinido';
const notesHtml = p.statusNotes ? `<p class="mt-3 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white/60 dark:bg-black/20 p-2.5 rounded-lg italic">"${p.statusNotes}"</p>` : '';
if(p.status === 'injured') { medEl.innerHTML = `<div class="bg-red-50 dark:bg-red-900/20 p-5 rounded-xl border border-red-200 dark:border-red-800/50 text-center"><i class="fas fa-briefcase-medical text-3xl text-red-500 mb-2"></i><p class="font-black text-red-700 dark:text-red-400">Lesionado</p><p class="text-xs text-red-600 dark:text-red-300 mt-1">Regreso estimado: ${returnDateStr}</p>${notesHtml}</div>`; }
else if(p.status === 'suspended') { medEl.innerHTML = `<div class="bg-orange-50 dark:bg-orange-900/20 p-5 rounded-xl border border-orange-200 dark:border-orange-800/50 text-center"><i class="fas fa-ban text-3xl text-orange-500 mb-2"></i><p class="font-black text-orange-700 dark:text-orange-400">Suspendido</p><p class="text-xs text-orange-600 dark:text-orange-300 mt-1">Sanción disciplinaria</p>${notesHtml}</div>`; }
else if(p.status === 'absent') { medEl.innerHTML = `<div class="bg-slate-100 dark:bg-slate-800/50 p-5 rounded-xl border border-slate-300 dark:border-slate-700 text-center"><i class="fas fa-plane text-3xl text-slate-500 mb-2"></i><p class="font-black text-slate-700 dark:text-slate-300">Ausente</p><p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Regreso estimado: ${returnDateStr}</p>${notesHtml}</div>`; }
else { medEl.innerHTML = `<div class="bg-green-50 dark:bg-green-900/20 p-5 rounded-xl border border-green-200 dark:border-green-800/50 text-center"><i class="fas fa-heartbeat text-3xl text-green-500 mb-2"></i><p class="font-black text-green-700 dark:text-green-400">En Forma Óptima</p><p class="text-xs text-green-600 dark:text-green-300 mt-1">Apto para jugar</p></div>`; }
const discEl = document.getElementById('pp-discipline-list'); discEl.innerHTML = '';
const tournaments = [...new Set((window.matches || []).filter(m => m && (m.status === 'finished' || m.status === 'forfait')).map(m => m.tournament))].filter(Boolean);
tournaments.forEach(t => {
const d = window.getDiscipline(p.id, t);
if(d.yellows > 0 || d.suspended) { discEl.innerHTML += `<div class="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl mb-2 border border-slate-100 dark:border-slate-800"><span class="font-bold text-xs text-slate-700 dark:text-slate-300">${t}</span><div><span class="text-yellow-500 font-black text-xs mr-3">🟨 ${d.yellows}/3</span>${d.suspended ? '<span class="bg-red-500 text-white px-2 py-1 rounded text-[9px] font-black uppercase shadow-sm">Sancionado</span>' : '<span class="bg-green-500 text-white px-2 py-1 rounded text-[9px] font-black uppercase shadow-sm">Ok</span>'}</div></div>`; }
});
if(discEl.innerHTML === '') discEl.innerHTML = '<p class="text-sm text-slate-500 italic text-center py-4">Historial limpio. ¡Buen comportamiento!</p>';
};
window.renderProfileFinanzas = function(p) {
    const dData = typeof window.getPlayerDebts === 'function' ? window.getPlayerDebts(p.id) : { total: 0, debts: [] };
    const mor = typeof window.getMorosityStatus === 'function' ? window.getMorosityStatus(p.id) : { label: 'Deuda', color: 'yellow' };
    const badgeColors = mor.color === 'green'
        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
        : mor.color === 'yellow'
            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';

    const badgeEl = document.getElementById('pp-debt-badge');
    if (badgeEl) {
        badgeEl.className = `px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${badgeColors}`;
        badgeEl.innerHTML = dData.total > 0.01 ? `${mor.label}: $${dData.total.toFixed(2)}` : `<i class="fas fa-check-circle mr-1"></i>Al Día ($0.00)`;
    }

    const listEl = document.getElementById('pp-finances-list');
    if (!listEl) return;
    listEl.innerHTML = '';

    // 1. Deudas pendientes reales (incluye cuotas, multas, cobros manuales y arbitrajes)
    dData.debts.forEach(d => {
        const dStr = (d.date && d.date.includes('-'))
            ? new Date(d.date + 'T12:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
            : 'Saldo pendiente';
        listEl.innerHTML += `
            <tr class="border-b border-slate-100 dark:border-slate-800 last:border-0 bg-red-50/30 dark:bg-red-900/10">
                <td class="py-3 px-2">
                    <p class="text-xs font-bold text-slate-800 dark:text-slate-200">${d.desc}</p>
                    <p class="text-[10px] text-red-500 font-bold uppercase">${dStr} · Por pagar</p>
                </td>
                <td class="py-3 px-2 text-right whitespace-nowrap">
                    <p class="text-sm font-black text-red-600 dark:text-red-400">$${d.amount.toFixed(2)}</p>
                    <span class="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400">Pendiente</span>
                </td>
            </tr>`;
    });

    // 2. Pagos y abonos efectivamente realizados por el jugador
    const paidTxs = (window.finances || [])
        .filter(t => t && t.playerId === p.id && t.type === 'income' && window.getValidCashAmount(t) > 0)
        .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

    paidTxs.forEach(t => {
        const dStr = (t.date && t.date.includes('-'))
            ? new Date(t.date + 'T12:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
            : '';
        const isAbono = t.category === 'Abono a Deuda (Jugador)';
        const title = t.description || t.category || 'Pago';
        listEl.innerHTML += `
            <tr class="border-b border-slate-100 dark:border-slate-800 last:border-0">
                <td class="py-3 px-2">
                    <p class="text-xs font-bold text-slate-700 dark:text-slate-300">${title}</p>
                    <p class="text-[10px] text-slate-400">${dStr} · ${t.category}</p>
                </td>
                <td class="py-3 px-2 text-right whitespace-nowrap">
                    <div class="flex items-center justify-end gap-2">
                        <div>
                            <p class="text-sm font-black text-emerald-600 dark:text-emerald-400">+$${(t.amount || 0).toFixed(2)}</p>
                            <p class="text-[9px] font-bold uppercase text-emerald-600 dark:text-emerald-400">${isAbono ? 'Abonado' : 'Pagado'}</p>
                        </div>
                        <button onclick="window.downloadReceiptFromTx('${t.id}')" class="text-brand-500 hover:text-brand-600 w-7 h-7 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-900/20 transition flex items-center justify-center" title="Descargar Recibo"><i class="fas fa-file-invoice-dollar text-xs"></i></button>
                    </div>
                </td>
            </tr>`;
    });

    if (listEl.innerHTML === '') {
        listEl.innerHTML = '<tr><td class="py-6 text-sm text-slate-500 italic text-center">Sin movimientos financieros registrados</td></tr>';
    }
};
window.renderProfileFicha = function(p) {
const c = document.getElementById('pp-card-container');
const n = (typeof p.name === 'string' && p.name.trim() !== '') ? p.name.trim() : 'N/A';
const a = p.alias ? `<p class="text-sm font-medium italic text-slate-400 mt-1 mb-2">"${p.alias}"</p>` : `<div class="mb-2"></div>`;
const pos = p.isStaff ? 'CT' : String(Array.isArray(p.positions) && p.positions.length > 0 ? p.positions[0] : (p.position || 'N/A')).substring(0,3).toUpperCase();
let fL = window.currentFilter==='all'?'GLOBAL':window.currentFilter.toUpperCase(), sL = window.currentSeason==='all'?'HISTÓRICO':`T. ${window.currentSeason}`;
let age='--', ft=p.foot?p.foot.toUpperCase():'N/E';
if(p.birthdate && p.birthdate.includes('-')) { const bd = new Date(p.birthdate.split('-')[0], p.birthdate.split('-')[1]-1, p.birthdate.split('-')[2]), td = new Date(); let ca = td.getFullYear()-bd.getFullYear(); const m = td.getMonth()-bd.getMonth(); if(m<0||(m===0&&td.getDate()<bd.getDate())) ca--; age = ca+' AÑOS'; }
let fontSize = "1.75rem"; if(n.length > 18) fontSize = "1.25rem"; else if(n.length > 14) fontSize = "1.5rem";
c.innerHTML = `
<div id="pp-card-export-node" class="player-card-export">
<div class="absolute top-5 left-5 text-center"><p class="text-3xl font-black text-yellow-400 leading-none drop-shadow-md">${p.number||'--'}</p><p class="text-[10px] font-black uppercase tracking-widest mt-1 text-slate-300">${pos}</p></div>
<div class="absolute top-5 right-5 opacity-40"><img src="escudo.png" class="w-10 h-10 object-contain drop-shadow" onerror="this.style.display='none'"></div>
<div class="w-28 h-28 rounded-[2rem] border-4 border-slate-600 bg-slate-800 flex items-center justify-center mt-6 mb-4 overflow-hidden shadow-2xl">${p.image?`<img src="${p.image}" class="w-full h-full object-cover">`:`<span class="text-4xl font-black">${n.charAt(0)}</span>`}</div>
<h2 class="font-black uppercase tracking-wide text-center w-full px-4 leading-tight drop-shadow-md" style="font-size:${fontSize}">${n}</h2>
${a}
<div class="flex justify-center gap-3 mt-2 text-[8px] font-black tracking-widest text-slate-400 uppercase"><span class="bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-700 shadow-inner">EDAD: ${age}</span><span class="bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-700 shadow-inner">PIE: ${ft}</span></div>
<div class="w-full border-t border-slate-700 mt-5 pt-3"><p class="text-[8px] text-brand-400 uppercase tracking-widest font-black text-center w-full">ESTADÍSTICAS ${fL} - ${sL}</p></div>
<div class="flex justify-around w-full mt-4 text-center"><div><p class="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Partidos</p><p class="text-2xl font-black">${window.getPlayerStat(p,'games')}</p></div><div><p class="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Goles</p><p class="text-2xl font-black">${window.getPlayerStat(p,'goals')}</p></div><div><p class="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Asist.</p><p class="text-2xl font-black">${window.getPlayerStat(p,'assists')}</p></div></div>
<div class="absolute bottom-3 text-[7px] text-slate-600 font-black tracking-widest uppercase">NISUS FC PREMIUM</div>
</div>`;
document.getElementById('btn-pp-download-card').onclick = function() {
const node = document.getElementById('pp-card-export-node'); const btn = this; btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Generando...';
html2canvas(node, { backgroundColor:null, scale:3, useCORS:true, allowTaint:true }).then(cv => {
const a = document.createElement('a'); a.download=`Ficha_${n.replace(/\s+/g,'_')}.png`; a.href=cv.toDataURL('image/png'); a.click();
btn.innerHTML = '<i class="fas fa-check mr-2"></i>¡Descargado!'; setTimeout(()=>btn.innerHTML='<i class="fas fa-download"></i> Descargar Ficha',2000);
}).catch(e=>{ window.showToast("Error",true); btn.innerHTML='<i class="fas fa-download"></i> Descargar Ficha'; });
};
};
window.switchMatchTab = function(tabName) {
const btnPizarra = document.getElementById('tab-btn-pizarra'), btnEventos = document.getElementById('tab-btn-eventos'), contentPizarra = document.getElementById('tab-content-pizarra'), contentEventos = document.getElementById('tab-content-eventos');
if (tabName === 'pizarra') {
btnPizarra.classList.replace('text-slate-500', 'text-brand-600'); btnPizarra.classList.replace('dark:text-slate-400', 'dark:text-brand-400'); btnPizarra.classList.replace('bg-transparent', 'bg-white'); btnPizarra.classList.replace('dark:bg-transparent', 'dark:bg-slate-800'); btnPizarra.classList.replace('border-transparent', 'border-brand-500');
btnEventos.classList.replace('text-brand-600', 'text-slate-500'); btnEventos.classList.replace('dark:text-brand-400', 'dark:text-slate-400'); btnEventos.classList.replace('bg-white', 'bg-transparent'); btnEventos.classList.replace('dark:bg-slate-800', 'dark:bg-transparent'); btnEventos.classList.replace('border-brand-500', 'border-transparent');
contentPizarra.classList.remove('hidden'); contentPizarra.classList.add('flex'); contentEventos.classList.add('hidden'); window.drawTacticalBoard();
} else {
btnEventos.classList.replace('text-slate-500', 'text-brand-600'); btnEventos.classList.replace('dark:text-slate-400', 'dark:text-brand-400'); btnEventos.classList.replace('bg-transparent', 'bg-white'); btnEventos.classList.replace('dark:bg-transparent', 'dark:bg-slate-800'); btnEventos.classList.replace('border-transparent', 'border-brand-500');
btnPizarra.classList.replace('text-brand-600', 'text-slate-500'); btnPizarra.classList.replace('dark:text-brand-400', 'dark:text-slate-400'); btnPizarra.classList.replace('bg-white', 'bg-transparent'); btnPizarra.classList.replace('dark:bg-slate-800', 'dark:bg-transparent'); btnPizarra.classList.replace('border-brand-500', 'border-transparent');
contentPizarra.classList.add('hidden'); contentPizarra.classList.remove('flex'); contentEventos.classList.remove('hidden');
}
}
window.newMatch = function() {
document.getElementById('match-form').reset(); document.getElementById('m-id').value = ''; document.getElementById('match-form-title').innerHTML = '<i class="fas fa-plus text-brand-500 mr-2"></i>Agendar Partido';
document.getElementById('m-goals-us').value = ''; document.getElementById('m-goals-them').value = ''; document.getElementById('m-mvp').value = ''; document.getElementById('m-captain').value = ''; document.getElementById('m-opp-shirt').value = '#ff0000'; document.getElementById('m-opp-shorts').value = '#ff0000'; document.getElementById('m-opp-socks').value = '#ff0000'; document.getElementById('m-opp-gk').value = '#00ff00'; document.getElementById('m-kit').value = 'white_blue'; document.getElementById('m-modality').value = 'f11';
window.currentLineup = []; window.currentEvents = [];
window.toggleScoreFields(); window.renderCallupList(); window.updateFormationOptions(); window.drawTacticalBoard(); window.renderMatchEvents(); window.renderKitsPreview(); window.switchMatchTab('pizarra'); window.updateAdminUI(); window.showSection('matchForm');
};
window.editMatch = function(id) {
const m = window.matches.find(x => x.id === id); if(!m) return;
document.getElementById('m-id').value = m.id; document.getElementById('m-opponent').value = m.opponent; document.getElementById('m-date').value = m.date; document.getElementById('m-location').value = m.location||''; document.getElementById('m-tournament').value = m.tournament||''; document.getElementById('m-modality').value = m.modality||'f11'; document.getElementById('m-season').value = m.season||''; document.getElementById('m-matchday').value = m.matchday||''; document.getElementById('m-status').value = m.status; document.getElementById('m-kit').value = m.kit||'white_blue'; document.getElementById('m-opp-shirt').value = m.oppColor||'#ff0000'; document.getElementById('m-opp-shorts').value = m.oppShorts||m.oppColor||'#ff0000'; document.getElementById('m-opp-socks').value = m.oppSocks||m.oppColor||'#ff0000'; document.getElementById('m-opp-gk').value = m.oppGk||'#00ff00'; document.getElementById('m-notes').value = m.notes||'';
if(m.status === 'finished') { document.getElementById('m-goals-us').value = m.goalsUs; document.getElementById('m-goals-them').value = m.goalsThem; } else { document.getElementById('m-goals-us').value = ''; document.getElementById('m-goals-them').value = ''; }
window.currentLineup = JSON.parse(JSON.stringify(m.lineup || [])); window.currentEvents = m.events ? JSON.parse(JSON.stringify(m.events)) : [];
document.getElementById('match-form-title').innerHTML = '<i class="fas fa-edit text-brand-500 mr-2"></i>Editar Partido';
window.renderCallupList(); window.toggleScoreFields(); window.updateFormationOptions();
if(m.formation) { const f = document.getElementById('m-formation'); if(f) f.value = m.formation; }
if(m.status==='finished' && m.mvp) document.getElementById('m-mvp').value = m.mvp;
if(m.captain) { const c = document.getElementById('m-captain'); if(c) c.value = m.captain; }
window.drawTacticalBoard(); window.renderMatchEvents(); window.renderKitsPreview(); window.switchMatchTab('pizarra'); window.updateAdminUI(); window.showSection('matchForm');
};
window.saveMatch = async function(e) {
e.preventDefault(); if(!window.isAdmin) return window.showToast('Solo Lectura', true);
const btn = document.getElementById('btn-save-match'); btn.disabled=true; btn.textContent="Guardando...";
const docId = document.getElementById('m-id').value || window.generateId(), s = document.getElementById('m-status').value;
let gU = null, gT = null, mvp = null;
if (s === 'finished') { gU = document.getElementById('m-goals-us').value || 0; gT = document.getElementById('m-goals-them').value || 0; mvp = document.getElementById('m-mvp')?.value || null; } else if (s === 'forfait') { gU = 3; gT = 0; mvp = null; }
const matchEvents = JSON.parse(JSON.stringify(window.currentEvents));
const batch = db.batch(); let multasAplicadas = 0;
matchEvents.forEach(ev => {
if (['yellows', 'double_yellow', 'reds'].includes(ev.type) && !ev.fineApplied) {
const montoMulta = ev.type === 'yellows' ? 1.00 : 3.00; const finId = window.generateId(); const p = window.players.find(x => x.id === ev.playerId);
if (p) {
batch.set(db.collection(window.financesPath).doc(finId), { id: finId, type: 'expense', amount: montoMulta, date: document.getElementById('m-date').value, category: 'Multa Tarjeta', description: `Multa Automática (${ev.type==='yellows'?'Amarilla':'Roja'})`, matchId: docId, playerId: ev.playerId, isPaid: false });
batch.set(db.collection(window.playersPath).doc(ev.playerId), { isPaidUp: false, debtAmount: (p.debtAmount || 0) + montoMulta }, { merge: true });
ev.fineApplied = true; multasAplicadas++;
}
}
});
const nm = { id: docId, opponent: document.getElementById('m-opponent').value, date: document.getElementById('m-date').value, location: document.getElementById('m-location').value, tournament: document.getElementById('m-tournament').value, modality: document.getElementById('m-modality').value, season: document.getElementById('m-season').value, matchday: document.getElementById('m-matchday').value, status: s, kit: document.getElementById('m-kit').value, oppColor: document.getElementById('m-opp-shirt').value, oppShorts: document.getElementById('m-opp-shorts').value, oppSocks: document.getElementById('m-opp-socks').value, oppGk: document.getElementById('m-opp-gk').value, goalsUs: gU, goalsThem: gT, mvp: mvp, captain: document.getElementById('m-captain')?.value||null, formation: document.getElementById('m-formation')?.value||'', notes: document.getElementById('m-notes').value, lineup: JSON.parse(JSON.stringify(window.currentLineup)), events: matchEvents };
batch.set(db.collection(window.matchesPath).doc(docId), nm);
try { await batch.commit(); window.showToast(multasAplicadas > 0 ? `Guardado (${multasAplicadas} multas aplicadas)` : 'Partido Guardado'); window.showSection('matches'); } catch(err) { window.showToast('Error', true); } finally { btn.disabled=false; btn.textContent="Guardar Partido"; }
};
window.deleteMatch = function(id) { window.showConfirm('¿Borrar partido permanentemente?', async () => { try { await db.collection(window.matchesPath).doc(id).delete(); window.showToast('Eliminado'); } catch(e) { window.showToast('Error', true); } }); };
window.toggleScoreFields = () => { const s = document.getElementById('m-status').value, c = document.getElementById('m-score-container'), l = document.getElementById('label-opponent'); if(l) l.textContent = document.getElementById('m-opponent').value || 'Rival'; if(s==='finished') { c.classList.remove('hidden'); window.updateMvpSelect(); } else c.classList.add('hidden'); };
window.renderCallupList = function() {
const list = document.getElementById('m-callup-list'); if(!list) return; list.innerHTML = '';
const m = document.getElementById('m-modality').value, t = document.getElementById('m-tournament').value;
window.players.filter(p => p && (p.status === 'active' || !p.status)).sort((a,b)=>(a.name||'').localeCompare(b.name||'')).forEach(p => {
if(m==='f11' && !p.availableF11) return; if(m==='f7' && !p.availableF7) return;
const isC = (window.currentLineup || []).some(l=>l.playerId===p.id), d = window.getDiscipline(p.id, t);
const bg = d.suspended ? `<span class="bg-red-500 text-white text-[8px] px-1.5 py-0.5 rounded ml-2 font-black shadow-sm">SANC</span>` : (d.yellows > 0 ? `<span class="text-yellow-600 text-[10px] ml-1 font-black shadow-sm" title="${d.yellows} Amarillas">🟨${d.yellows}</span>` : '');
const col = d.suspended ? 'text-red-500 line-through opacity-70' : 'text-slate-700 dark:text-slate-300';
list.innerHTML += `<div class="flex items-center gap-3 bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"><input type="checkbox" id="cb-${p.id}" ${isC?'checked':''} onchange="window.handleCallupChange('${p.id}',this.checked)" class="rounded w-4 h-4 text-brand-600 border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 cursor-pointer"><label for="cb-${p.id}" class="truncate ${col} text-xs font-bold cursor-pointer flex-1">${p.isStaff?'<i class="fas fa-user-tie text-purple-500 mr-1"></i> ':''}${p.number?p.number+'-':''}${p.name} ${bg}</label></div>`;
});
const c = document.getElementById('count-convocados'); if(c) c.textContent = (window.currentLineup || []).length; window.updateEventPlayerSelect(); window.updateMvpSelect(); window.updateCaptainSelect();
};
window.handleModalityChange = () => {
window.updateFormationOptions();
const m = document.getElementById('m-modality').value, mx = m==='f11'?11:7;
window.currentLineup = (window.currentLineup || []).filter(l => {
const p = window.players.find(x=>x.id===l.playerId);
return p && (p.status === 'active' || !p.status) && (m==='f11'?p.availableF11:p.availableF7);
});
let c=0; (window.currentLineup || []).forEach(p => {
const s = window.players.find(x=>x.id===p.playerId)?.isStaff;
if(!s && p.x!==null && p.y!==null) { c++; if(c>mx) {p.x=null;p.y=null;} }
});
window.renderCallupList(); window.drawTacticalBoard();
};
window.handleCallupChange = (id, chk) => { if(!window.isAdmin) return window.showToast('Solo edición', true); if(chk) { if(!window.currentLineup.some(l=>l.playerId===id)) window.currentLineup.push({playerId:id,x:null,y:null}); } else { window.currentLineup = window.currentLineup.filter(l=>l.playerId!==id); const c = document.getElementById('m-captain'); if(c&&c.value===id) c.value=''; } window.drawTacticalBoard(); window.updateEventPlayerSelect(); window.updateMvpSelect(); window.updateCaptainSelect(); const cn = document.getElementById('count-convocados'); if(cn) cn.textContent = window.currentLineup.length; };
window.updateCaptainSelect = () => { const s = document.getElementById('m-captain'); if(!s)return; const cur = s.value; let h='<option value="">Ninguno</option>'; window.players.filter(p=>window.currentLineup.some(l=>l.playerId===p.id)&&!p.isStaff).forEach(p=>h+=`<option value="${p.id}">${p.name}</option>`); s.innerHTML=h; if(window.players.find(p=>p.id===cur)) s.value=cur; };
window.updateMvpSelect = () => { const s = document.getElementById('m-mvp'); if(!s)return; const cur = s.value; let h='<option value="">Ninguno</option>'; const ids=[...new Set([...window.currentLineup.map(l=>l.playerId), ...window.currentEvents.filter(e=>e.type==='sub').map(e=>e.playerId)])]; window.players.filter(p=>ids.includes(p.id)&&!p.isStaff).forEach(p=>h+=`<option value="${p.id}">${p.name}</option>`); s.innerHTML=h; if(window.players.find(p=>p.id===cur)) s.value=cur; };
window.updateEventPlayerSelect = function() { const i = document.getElementById('m-event-player'), o = document.getElementById('m-event-player-out'); if(!i||o===null) return; let hi='<option value="">Jugador/Entra...</option>', ho='<option value="">Sale...</option>'; window.currentLineup.forEach(l => { const p = window.players.find(x=>x.id===l.playerId); if(p){ hi+=`<option value="${p.id}">${p.isStaff?'(CT) ':''}${p.name}</option>`; if(!p.isStaff) ho+=`<option value="${p.id}">${p.name}</option>`; } }); i.innerHTML=hi; o.innerHTML=ho; };
window.toggleSubField = () => { const t = document.getElementById('m-event-type').value, o = document.getElementById('m-event-player-out'); if(t==='sub') o.classList.remove('hidden'); else { o.classList.add('hidden'); o.value=''; } };
window.addMatchEvent = function() {
if(!window.isAdmin) return window.showToast('Solo edición', true);
const m = document.getElementById('m-event-minute').value, pId = document.getElementById('m-event-player').value, type = document.getElementById('m-event-type').value, pOut = document.getElementById('m-event-player-out').value;
if(!pId) return window.showToast('Selecciona jugador', true);
if(window.players.find(x=>x.id===pId)?.isStaff && ['goals','assists','penalty','freekick','sub','saved'].includes(type)) return window.showToast('CT solo tarjetas', true);
if(type==='sub' && (!pOut || pId===pOut)) return window.showToast('Cambio inválido', true);
window.currentEvents.push({ minute:m, playerId:pId, type:type, playerOutId:pOut }); window.renderMatchEvents(); window.updateMvpSelect(); document.getElementById('m-event-minute').value = ''; window.drawTacticalBoard();
};
window.removeMatchEvent = (idx) => { if(!window.isAdmin) return window.showToast('Solo edición', true); window.currentEvents.splice(idx,1); window.renderMatchEvents(); window.updateMvpSelect(); window.drawTacticalBoard(); };
window.renderMatchEvents = function() {
const list = document.getElementById('m-events-list'); if(!list) return; list.innerHTML = '';
if(window.currentEvents.length===0){ list.innerHTML='<p class="text-xs text-slate-400 font-bold italic">Sin eventos registrados</p>'; return; }
const lbl = { goals:'Gol ⚽', penalty:'Penal 🎯', freekick:'Tiro Libre 👟', assists:'Asist. 👟', saved:'Atajado 🧤', yellows:'Amarilla 🟨', double_yellow:'Doble Amarilla 🟨🟥', reds:'Roja 🟥', sub:'Cambio 🔄' };
const col = { goals:'bg-green-500', penalty:'bg-teal-500', freekick:'bg-emerald-500', assists:'bg-blue-500', saved:'bg-purple-500', yellows:'bg-yellow-500 text-slate-900', double_yellow:'bg-orange-500', reds:'bg-red-500', sub:'bg-slate-700' };
window.currentEvents.sort((a,b)=>(parseInt(a.minute)||999)-(parseInt(b.minute)||999)).forEach((ev,idx)=>{
const pIn = window.players.find(x=>x.id===ev.playerId); if(!pIn) return;
let det = ev.type==='sub' ? `<span class="text-green-500 font-bold text-[10px]"><i class="fas fa-arrow-up"></i> ${(pIn.name||'').split(' ')[0]}</span> <span class="text-red-500 font-bold text-[10px] ml-2"><i class="fas fa-arrow-down"></i> ${(window.players.find(x=>x.id===ev.playerOutId)?.name||'?').split(' ')[0]}</span>` : `<span class="font-bold text-slate-700 dark:text-slate-300 text-xs">${pIn.name}</span>`;
list.innerHTML += `<div class="flex justify-between items-center bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm"><div class="flex items-center gap-2">${ev.minute?`<span class="font-mono text-slate-400 font-bold text-xs bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded-lg">${ev.minute}'</span>`:''} ${det} <span class="${col[ev.type]} text-white text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg shadow-sm ml-2">${lbl[ev.type]}</span></div><button type="button" onclick="window.removeMatchEvent(${idx})" class="admin-only text-slate-400 hover:text-red-500 ml-2 w-6 h-6 rounded flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/20 transition"><i class="fas fa-times"></i></button></div>`;
});
};
const posValid = { POR: ['Portero'], DFC: ['Defensa Central', 'Mediocentro Defensivo', 'Lateral Derecho', 'Lateral Izquierdo'], LD: ['Lateral Derecho', 'Carrilero', 'Defensa Central'], LI: ['Lateral Izquierdo', 'Carrilero', 'Defensa Central'], CAR: ['Carrilero', 'Lateral Derecho', 'Lateral Izquierdo', 'Interior'], MCD: ['Mediocentro Defensivo', 'Mediocentro', 'Defensa Central'], MC: ['Mediocentro', 'Mediocentro Defensivo', 'Interior', 'Mediapunta'], MI: ['Interior', 'Extremo Izquierdo', 'Mediocentro', 'Carrilero'], MD: ['Interior', 'Extremo Derecho', 'Mediocentro', 'Carrilero'], MCO: ['Mediapunta', 'Interior', 'Segundo Delantero', 'Mediocentro'], ED: ['Extremo Derecho', 'Segundo Delantero', 'Delantero Centro', 'Interior'], EI: ['Extremo Izquierdo', 'Segundo Delantero', 'Delantero Centro', 'Interior'], DC: ['Delantero Centro', 'Segundo Delantero', 'Extremo Derecho', 'Extremo Izquierdo', 'Mediapunta'] };
const formations = { f11: { "4-4-2": [{x:50,y:90,valid:posValid.POR},{x:20,y:75,valid:posValid.LI},{x:40,y:75,valid:posValid.DFC},{x:60,y:75,valid:posValid.DFC},{x:80,y:75,valid:posValid.LD},{x:20,y:50,valid:posValid.MI},{x:40,y:50,valid:posValid.MC},{x:60,y:50,valid:posValid.MC},{x:80,y:50,valid:posValid.MD},{x:35,y:25,valid:posValid.DC},{x:65,y:25,valid:posValid.DC}], "4-3-3": [{x:50,y:90,valid:posValid.POR},{x:20,y:75,valid:posValid.LI},{x:40,y:75,valid:posValid.DFC},{x:60,y:75,valid:posValid.DFC},{x:80,y:75,valid:posValid.LD},{x:30,y:55,valid:posValid.MC},{x:50,y:55,valid:posValid.MCD},{x:70,y:55,valid:posValid.MC},{x:20,y:25,valid:posValid.EI},{x:50,y:25,valid:posValid.DC},{x:80,y:25,valid:posValid.ED}] }, f7: { "3-2-1": [{x:50,y:90,valid:posValid.POR},{x:25,y:70,valid:posValid.LI},{x:50,y:70,valid:posValid.DFC},{x:75,y:70,valid:posValid.LD},{x:35,y:45,valid:posValid.MC},{x:65,y:45,valid:posValid.MC},{x:50,y:20,valid:posValid.DC}] } };
window.updateFormationOptions = () => { const m = document.getElementById('m-modality').value, s = document.getElementById('m-formation'); if(!s)return; let h='<option value="">Formación Libre</option>'; if(formations[m]) { for(let k in formations[m]) h+=`<option value="${k}">${k}</option>`; } s.innerHTML=h; };
window.applyFormation = function() {
if(!window.isAdmin) return window.showToast('Solo edición', true);
const m = document.getElementById('m-modality').value, fk = document.getElementById('m-formation').value;
if(!fk) { window.drawTacticalBoard(); return; }
const coords = formations[m][fk]; if(!coords) return;
window.currentLineup.forEach(l => { const pO = window.players.find(x=>x.id===l.playerId); if(pO && !pO.isStaff) { l.x = null; l.y = null; } });
let availablePlayers = window.currentLineup.filter(l => { const pO = window.players.find(x=>x.id===l.playerId); return pO && !pO.isStaff; });
let assignedSlots = [];
coords.forEach((slot, index) => {
const matchIndex = availablePlayers.findIndex(l => { const pO = window.players.find(x=>x.id===l.playerId); const pos = Array.isArray(pO.positions) ? pO.positions : (pO.position ? [pO.position] : []); return pos.some(x => slot.valid.includes(x)); });
if (matchIndex !== -1) { const p = availablePlayers[matchIndex]; p.x = slot.x; p.y = slot.y; availablePlayers.splice(matchIndex, 1); assignedSlots.push(index); }
});
coords.forEach((slot, index) => { if (!assignedSlots.includes(index) && availablePlayers.length > 0) { const p = availablePlayers.shift(); p.x = slot.x; p.y = slot.y; } });
window.drawTacticalBoard(); window.showToast(`Formación ${fk} aplicada con éxito`);
};
window.drawTacticalBoard = function() {
const pt = document.getElementById('tactical-pitch'), bc = document.getElementById('tactical-bench'), st = document.getElementById('tactical-staff'); if(!pt||!bc||!st) return;
document.querySelectorAll('.player-token, .formation-slot').forEach(t=>t.remove());
const m = document.getElementById('m-modality').value, mx = m==='f11'?11:7, fk = document.getElementById('m-formation').value; let oP=0;
if(fk && formations[m] && formations[m][fk]) { formations[m][fk].forEach(c => { const s = document.createElement('div'); s.className="formation-slot"; s.style.left=c.x+'%'; s.style.top=c.y+'%'; let lbl='-'; for(let k in posValid){ if(posValid[k]===c.valid){lbl=k;break;} } s.innerHTML=lbl; pt.appendChild(s); }); }
window.currentLineup.forEach(l => {
const p = window.players.find(x=>x.id===l.playerId); if(!p) return;
const tok = document.createElement('div'); tok.className="player-token"; tok.dataset.id=l.playerId;
let cap = (p.id===document.getElementById('m-captain')?.value)?`<div class="captain-armband">C</div>`:'';
let dor = (!p.isStaff&&p.number)?`<div class="dorsal-badge">${p.number}</div>`:'';
let evG=0, evA=0, evC='', evS=0;
window.currentEvents.forEach(e => { if(e.playerId === p.id) { if(['goals', 'penalty', 'freekick'].includes(e.type)) evG++; if(e.type === 'assists') evA++; if(e.type === 'yellows') evC = '🟨'; if(e.type === 'double_yellow' || e.type === 'reds') evC = '🟥'; if(e.type === 'saved') evS++; } });
let ic = '';
if(evG > 0) ic += `<div style="position:absolute; bottom:-6px; left:-6px; font-size:16px; filter:drop-shadow(0 2px 2px rgba(0,0,0,0.8)); z-index:40;">⚽<span style="font-size:8px; font-weight:black; color:white; background:black; border:1px solid white; border-radius:50%; padding:0 4px; position:absolute; right:-5px; bottom:2px;">${evG>1?evG:''}</span></div>`;
if(evA > 0) ic += `<div style="position:absolute; bottom:-6px; right:-6px; font-size:16px; filter:drop-shadow(0 2px 2px rgba(0,0,0,0.8)); z-index:40;">👟<span style="font-size:8px; font-weight:black; color:white; background:black; border:1px solid white; border-radius:50%; padding:0 4px; position:absolute; right:-5px; bottom:2px;">${evA>1?evA:''}</span></div>`;
if(evC !== '') ic += `<div style="position:absolute; top:50%; transform:translateY(-50%); left:-12px; font-size:14px; filter:drop-shadow(0 1px 1px rgba(0,0,0,0.8)); z-index:40;">${evC}</div>`;
if(evS > 0) ic += `<div style="position:absolute; top:50%; transform:translateY(-50%); right:-12px; font-size:14px; filter:drop-shadow(0 1px 1px rgba(0,0,0,0.8)); z-index:40;">🧤</div>`;
if(document.getElementById('m-mvp')?.value === p.id) ic += `<div style="position:absolute; top:-18px; left:50%; transform:translateX(-50%); font-size:20px; filter:drop-shadow(0 2px 4px rgba(0,0,0,0.8)); z-index:50;">🌟</div>`;
const gk = (Array.isArray(p.positions) ? p.positions.includes('Portero') : (p.position === 'Portero')) ? ' 🧤' : '';
let dL = p.showAlias && p.alias ? p.alias : (p.name || 'N/A').split(' ')[0];
const ini = (p.name || '?').charAt(0).toUpperCase();
if (p.isStaff) { tok.style.borderColor = '#9333ea'; tok.innerHTML = (p.image ? `<img src="${p.image}" alt="">` : `<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; background:#f3e8ff; border-radius:50%;"><i class="fas fa-user-tie text-purple-600"></i></div>`) + `<span class="name-label" style="background: rgba(107, 33, 168, 0.9);">${dL}</span>` + ic; }
else { tok.innerHTML = `${dor}${cap}${p.image ? `<img src="${p.image}" alt="">` : ini}<span class="name-label">${dL}${gk}</span>${ic}`; }
tok.onmousedown = window.dragStart; tok.addEventListener('touchstart', window.dragStart, {passive: false});
if(l.x!==null && l.y!==null) { tok.style.left=l.x+'%'; tok.style.top=l.y+'%'; pt.appendChild(tok); if(!p.isStaff) oP++; } else { tok.style.position='relative'; tok.style.transform='none'; tok.style.left='auto'; tok.style.top='auto'; (p.isStaff?st:bc).appendChild(tok); }
});
const b = document.getElementById('pitch-count-badge'); if(b) { b.textContent=`${oP}/${mx} en cancha`; b.className=`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${oP>mx?'bg-red-500 text-white shadow-sm':oP===mx?'bg-green-500 text-white shadow-sm':'text-brand-500 bg-brand-50 dark:bg-brand-900/30'}`; }
};
window.dragStart = function(e) { if(!window.isAdmin) return; window.draggedElement = e.target.closest('.player-token'); if(!window.draggedElement) return; const p = document.getElementById('tactical-pitch'); if(window.draggedElement.parentElement !== p) { window.draggedElement.style.position='absolute'; window.draggedElement.style.transform='translate(-50%, -50%)'; p.appendChild(window.draggedElement); } };
window.dragMove = function(e) { if(!window.draggedElement) return; if(e.type==='touchmove' && e.cancelable) e.preventDefault(); const p = document.getElementById('tactical-pitch'), r = p.getBoundingClientRect(); let cx = e.type.includes('touch')?e.touches[0].clientX:e.clientX, cy = e.type.includes('touch')?e.touches[0].clientY:e.clientY; window.draggedElement.style.left = (((cx - r.left)/r.width)*100)+'%'; window.draggedElement.style.top = (((cy - r.top)/r.height)*100)+'%'; };
window.dragEnd = function(e) { if(!window.draggedElement) return; const p = document.getElementById('tactical-pitch'), r = p.getBoundingClientRect(); let cy = e.type.includes('touch')?e.changedTouches[0].clientY:e.clientY, cx = e.type.includes('touch')?e.changedTouches[0].clientX:e.clientX; const pid = window.draggedElement.dataset.id, idx = window.currentLineup.findIndex(l=>l.playerId===pid), m = document.getElementById('m-modality').value, fk = document.getElementById('m-formation').value;
if(cy > r.bottom + 10) { if(idx>=0) { window.currentLineup[idx].x=null; window.currentLineup[idx].y=null; } }
else {
let nx = ((cx - r.left)/r.width)*100, ny = ((cy - r.top)/r.height)*100;
if(idx>=0) {
const ox = window.currentLineup[idx].x, oy = window.currentLineup[idx].y;
if(fk && formations[m] && formations[m][fk]) {
const coords = formations[m][fk]; let nrst = coords[0], mD = Infinity;
coords.forEach(c => { const d = Math.sqrt(Math.pow(nx-c.x,2)+Math.pow(ny-c.y,2)); if(d<mD){mD=d; nrst=c;} });
const occIdx = window.currentLineup.findIndex(l=>l.x===nrst.x && l.y===nrst.y && l.playerId!==pid);
if(occIdx>=0) { if(ox===null) { window.currentLineup[occIdx].x=null; window.currentLineup[occIdx].y=null; } else { window.currentLineup[occIdx].x=ox; window.currentLineup[occIdx].y=oy; } }
window.currentLineup[idx].x=nrst.x; window.currentLineup[idx].y=nrst.y;
} else { window.currentLineup[idx].x=nx; window.currentLineup[idx].y=ny; }
}
}
window.draggedElement=null; window.drawTacticalBoard();
};
window.exportPitchImage = function() { const p = document.getElementById('tactical-pitch'); if(!p)return; const ob = p.style.borderRadius; p.style.borderRadius='0px'; html2canvas(p, {backgroundColor:'#22c55e', scale:2}).then(c => { const a = document.createElement('a'); a.download = `Alineacion_NISUS_vs_${document.getElementById('m-opponent').value||'Partido'}.png`; a.href = c.toDataURL('image/png'); a.click(); p.style.borderRadius=ob; window.showToast("Pizarra exportada"); }).catch(e => { p.style.borderRadius=ob; window.showToast("Error",true); }); };
window.newAttendance = function() { document.getElementById('attendance-form').reset(); document.getElementById('a-id').value = ''; document.getElementById('a-date').value = new Date().toISOString().split('T')[0]; window.currentAttendees=[]; window.renderAttendanceChecklist(); window.updateAdminUI(); window.showSection('attendanceForm'); };
window.renderAttendanceChecklist = function() {
const c = document.getElementById('a-players-list'); if(!c)return; c.innerHTML='';
window.players.filter(p => p && (p.status === 'active' || !p.status)).sort((a,b)=>(a.name||'').localeCompare(b.name||'')).forEach(p=>{
const ch = (window.currentAttendees || []).includes(p.id)?'checked':'';
c.innerHTML+=`<div class="flex items-center gap-3 bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"><input type="checkbox" id="att-${p.id}" ${ch} onchange="window.handleAttChange('${p.id}',this.checked)" class="rounded w-4 h-4 text-brand-600 bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-600"><label for="att-${p.id}" class="text-sm font-bold flex-1 cursor-pointer text-slate-700 dark:text-slate-300">${p.isStaff?'<i class="fas fa-user-tie text-purple-500 mr-1"></i> ':''}${p.name}</label></div>`;
});
};
window.handleAttChange = (id,chk) => { if(!window.isAdmin) return window.showToast('Solo edición', true); if(chk){if(!window.currentAttendees.includes(id))window.currentAttendees.push(id);}else window.currentAttendees=window.currentAttendees.filter(x=>x!==id); };
window.saveAttendance = async function(e) { e.preventDefault(); if(!window.isAdmin) return window.showToast('Solo edición', true); const docId = document.getElementById('a-id').value||window.generateId(); try { await db.collection(window.trainingsPath).doc(docId).set({ id:docId, date:document.getElementById('a-date').value, location:document.getElementById('a-location').value, notes:document.getElementById('a-notes').value, attendees:window.currentAttendees }); window.showToast('Guardado'); window.showSection('attendance'); } catch(er){window.showToast('Error',true);} };
window.editAttendance = function(id) { const t = window.trainings.find(x=>x.id===id); if(!t)return; document.getElementById('a-id').value=t.id; document.getElementById('a-date').value=t.date; document.getElementById('a-location').value=t.location||''; document.getElementById('a-notes').value=t.notes||''; window.currentAttendees=[...(t.attendees||[])]; window.renderAttendanceChecklist(); window.updateAdminUI(); window.showSection('attendanceForm'); };
window.deleteAttendance = function(id) { window.showConfirm('¿Borrar entreno permanentemente?', async()=>{ try{ await db.collection(window.trainingsPath).doc(id).delete(); window.showToast('Eliminado'); }catch(e){window.showToast('Error',true);} }); };
window.copyAttendanceList = function(id) {
const t = window.trainings.find(x => x.id === id); if (!t) return;
const dateStr = new Date(t.date + 'T12:00:00').toLocaleDateString('es-ES', {weekday: 'long', day: 'numeric', month: 'long'}).toUpperCase();
let msg = `*⚽ ASISTENCIA ENTRENAMIENTO*\n📅 ${dateStr}\n📍 ${t.location || 'Sin ubicación'}\n\n`;
const presentes = [], ausentes = [];
window.players.filter(p => !p.isStaff && (p.status === 'active' || !p.status)).sort((a,b) => (a.name||'').localeCompare(b.name||'')).forEach(p => {
if (t.attendees && t.attendees.includes(p.id)) presentes.push(`✅ ${p.name}`); else ausentes.push(`❌ ${p.name}`);
});
msg += `*PRESENTES (${presentes.length}):*\n`;
if (presentes.length > 0) msg += presentes.join('\n') + '\n\n'; else msg += 'Ninguno\n\n';
msg += `*AUSENTES (${ausentes.length}):*\n`;
if (ausentes.length > 0) msg += ausentes.join('\n'); else msg += 'Ninguno';
navigator.clipboard.writeText(msg).then(() => window.showToast('Lista copiada para WhatsApp')).catch(() => window.showToast('Error al copiar', true));
};
window.renderTrainings = function() {
const u = document.getElementById('attendance-grid-upcoming'), p = document.getElementById('attendance-grid-past'); if(!u || !p) return;
u.innerHTML = ''; p.innerHTML = ''; const td = new Date().toISOString().split('T')[0]; let upcoming = [], past = [];
window.trainings.forEach(t => { if(t.date >= td) upcoming.push(t); else past.push(t); });
upcoming.sort((a,b) => new Date(a.date) - new Date(b.date)); past.sort((a,b) => new Date(b.date) - new Date(a.date));
if(upcoming.length === 0) u.innerHTML = '<div class="col-span-full text-slate-500 text-sm p-4 bg-white dark:bg-darkcard rounded-xl border border-slate-200 dark:border-slate-800">No hay sesiones programadas</div>';
upcoming.forEach(t => {
let loc = ''; if(t.location) loc = t.location.startsWith('http') ? `<a href="${t.location}" target="_blank" class="text-brand-500 hover:text-brand-600 dark:text-brand-400 font-bold hover:underline text-xs mb-4 truncate block"><i class="fas fa-map-marker-alt mr-1"></i> Abrir en Mapa</a>` : `<p class="text-xs text-slate-500 mb-4 truncate"><i class="fas fa-map-marker-alt mr-1"></i> ${t.location}</p>`; else loc = `<p class="text-xs text-slate-500 mb-4 truncate"><i class="fas fa-map-marker-alt mr-1"></i> Sin ubicación</p>`;
const totalPlayers = window.players.filter(pl=>!pl.isStaff && (pl.status === 'active' || !pl.status)).length, attCount = t.attendees?t.attendees.length:0; const attPct = totalPlayers>0?Math.round((attCount/totalPlayers)*100):0; const barColor = attPct>=75?'bg-green-500':attPct>=50?'bg-yellow-500':'bg-red-500';
u.innerHTML += `<div class="bg-white dark:bg-darkcard p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800"><div class="flex justify-between items-center mb-3"><span class="font-black text-brand-600 dark:text-brand-400"><i class="far fa-calendar text-sm mr-1"></i> ${new Date(t.date+'T12:00:00').toLocaleDateString('es-ES', {weekday:'short', day:'numeric', month:'short'})}</span><span class="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold px-2 py-1 rounded"><i class="fas fa-users mr-1"></i>${attCount}/${totalPlayers}</span></div><div class="mb-3"><div class="flex justify-between items-center mb-1"><span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Asistencia</span><span class="text-[10px] font-black ${attPct>=75?'text-green-600':attPct>=50?'text-yellow-600':'text-red-600'}">${attPct}%</span></div><div class="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"><div class="${barColor} h-full rounded-full transition-all" style="width:${attPct}%"></div></div></div>${loc}<div class="flex gap-2"><button onclick="window.editAttendance('${t.id}')" class="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-2 rounded-lg text-xs font-bold transition">Editar</button><button onclick="window.copyAttendanceList('${t.id}')" class="w-10 bg-green-50 hover:bg-green-100 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-600 dark:text-green-400 rounded-lg flex items-center justify-center transition" title="Copiar a WhatsApp"><i class="fab fa-whatsapp"></i></button><button onclick="window.deleteAttendance('${t.id}')" class="admin-only w-10 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg flex items-center justify-center transition"><i class="fas fa-trash"></i></button></div></div>`;
});
if(past.length === 0) p.innerHTML = '<div class="col-span-full text-slate-500 text-sm p-4 bg-white dark:bg-darkcard rounded-xl border border-slate-200 dark:border-slate-800">No hay historial</div>';
past.forEach(t => {
let loc = ''; if(t.location) loc = t.location.startsWith('http') ? `<a href="${t.location}" target="_blank" class="text-brand-500 hover:text-brand-600 dark:text-brand-400 font-bold hover:underline text-xs mb-4 truncate block"><i class="fas fa-map-marker-alt mr-1"></i> Abrir en Mapa</a>` : `<p class="text-xs text-slate-500 mb-4 truncate"><i class="fas fa-map-marker-alt mr-1"></i> ${t.location}</p>`; else loc = `<p class="text-xs text-slate-500 mb-4 truncate"><i class="fas fa-map-marker-alt mr-1"></i> Sin ubicación</p>`;
const totalPlayers = window.players.filter(pl=>!pl.isStaff && (pl.status === 'active' || !pl.status)).length, attCount = t.attendees?t.attendees.length:0; const attPct = totalPlayers>0?Math.round((attCount/totalPlayers)*100):0; const barColor = attPct>=75?'bg-green-500':attPct>=50?'bg-yellow-500':'bg-red-500';
p.innerHTML += `<div class="bg-white dark:bg-darkcard p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 opacity-80 hover:opacity-100 transition"><div class="flex justify-between items-center mb-3"><span class="font-black text-slate-600 dark:text-slate-400"><i class="far fa-check-circle text-sm mr-1"></i> ${new Date(t.date+'T12:00:00').toLocaleDateString('es-ES', {weekday:'short', day:'numeric', month:'short'})}</span><span class="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold px-2 py-1 rounded"><i class="fas fa-users mr-1"></i>${attCount}/${totalPlayers}</span></div><div class="mb-3"><div class="flex justify-between items-center mb-1"><span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Asistencia</span><span class="text-[10px] font-black ${attPct>=75?'text-green-600':attPct>=50?'text-yellow-600':'text-red-600'}">${attPct}%</span></div><div class="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"><div class="${barColor} h-full rounded-full transition-all" style="width:${attPct}%"></div></div></div>${loc}<div class="flex gap-2"><button onclick="window.editAttendance('${t.id}')" class="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 py-2 rounded-lg text-xs font-bold transition">Ver Lista</button><button onclick="window.copyAttendanceList('${t.id}')" class="w-10 bg-green-50 hover:bg-green-100 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-600 dark:text-green-400 rounded-lg flex items-center justify-center transition" title="Copiar a WhatsApp"><i class="fab fa-whatsapp"></i></button></div></div>`;
});
};
const finCategories = { income: ['Cuota Mensual', 'Inscripción', 'Cobro Manual', 'Abono a Deuda (Jugador)', 'Sponsor', 'Otro Ingreso'], expense: ['Arbitraje', 'Cancha', 'Uniformes', 'Materiales', 'Multa Tarjeta', 'Otro Egreso'] };
window.matchesDebtFilter = function(debtItem, filterVal) {
    if (!filterVal || filterVal === 'all') return true;
    if (debtItem.typeKey) return debtItem.typeKey === filterVal;
    const desc = (debtItem.desc || '').toLowerCase();
    if (filterVal === 'mensualidad') return desc.includes('mensual');
    if (filterVal === 'arbitraje') return desc.includes('arbitraje');
    if (filterVal === 'multa') return desc.includes('multa');
    return false;
};

window.getPlayerDebts = function(playerId) {
    let debts = [];
    if (!playerId) return { total: 0, debts };
    const allFin = window.finances || [];

    allFin.forEach(t => {
        if (!t) return;
        if (t.playerId === playerId && t.isPaid === false && (t.type === 'income' || t.category === 'Multa Tarjeta')) {
            const abonos = allFin.filter(x => x && x.category === 'Abono a Deuda (Jugador)' && x.specificDebtId === t.id);
            const totalAbonado = abonos.reduce((sum, x) => sum + (parseFloat(x.amount) || 0), 0);
            const amt = (parseFloat(t.amount) || 0) - totalAbonado;
            if (amt > 0.01) {
                const m = t.matchId ? (window.matches || []).find(x => x && x.id === t.matchId) : null;
                const mTxt = m ? ` (vs ${m.opponent})` : '';
                const rawDesc = t.description || t.category || 'Deuda';
                const lowerAll = `${t.category || ''} ${rawDesc}`.toLowerCase();
                let typeKey = 'otro';
                if (t.category === 'Cuota Mensual' || lowerAll.includes('mensual')) typeKey = 'mensualidad';
                else if (t.category === 'Multa Tarjeta' || lowerAll.includes('multa')) typeKey = 'multa';
                else if (lowerAll.includes('arbitraje')) typeKey = 'arbitraje';

                const prefix = (t.category === 'Multa Tarjeta' && !rawDesc.toLowerCase().includes('multa')) ? 'Multa: ' : '';
                const rateMode = (typeKey === 'multa' || typeKey === 'arbitraje') ? 'eur' : (t.rateMode || (typeKey === 'mensualidad' ? 'usd' : 'eur'));
debts.push({ id: t.id, desc: prefix + rawDesc + mTxt, amount: amt, date: t.date || '', dueDate: t.dueDate || '', typeKey, rateMode });
            }
        }

        if (t.category === 'Arbitraje' && t.matchId) {
            const match = (window.matches || []).find(m => m && m.id === t.matchId);
            if (match && Array.isArray(match.lineup)) {
                const validPlayers = match.lineup.filter(l => {
                    const pObj = (window.players || []).find(x => x && x.id === l.playerId);
                    return pObj && !pObj.isStaff;
                });
                const isCalledUp = validPlayers.some(l => l.playerId === playerId);
                const hasPaid = Array.isArray(t.paidBy) && t.paidBy.includes(playerId);
                if (isCalledUp && !hasPaid && validPlayers.length > 0) {
                    const cuota = (parseFloat(t.amount) || 0) / validPlayers.length;
                    const arbId = 'arb_' + t.id;
                    const abonosArb = allFin.filter(x => x && x.category === 'Abono a Deuda (Jugador)' && x.playerId === playerId && x.specificDebtId === arbId);
                    const abonadoArb = abonosArb.reduce((sum, x) => sum + (parseFloat(x.amount) || 0), 0);
                    const restArb = cuota - abonadoArb;
                    if (restArb > 0.01) {
                        debts.push({ id: arbId, desc: `Cuota Arbitraje: vs ${match.opponent}`, amount: restArb, date: t.date || '', dueDate: '', typeKey: 'arbitraje', rateMode: 'eur' });
                    }
                }
            }
        }
    });

    debts.sort((a, b) => new Date(a.date || '1970-01-01') - new Date(b.date || '1970-01-01'));
    const generalAbonos = allFin
        .filter(x => x && x.category === 'Abono a Deuda (Jugador)' && x.playerId === playerId && !x.specificDebtId)
        .sort((a, b) => new Date(a.date || '1970-01-01') - new Date(b.date || '1970-01-01'));

    generalAbonos.forEach(ab => {
        let rem = parseFloat(ab.amount) || 0;
        const abDate = ab.date || '9999-12-31';
        debts.forEach(d => {
            if (rem <= 0.01 || d.amount <= 0.01) return;
            if (!d.date || d.date <= abDate) {
                const used = Math.min(rem, d.amount);
                d.amount -= used;
                rem -= used;
            }
        });
    });

    debts = debts.filter(d => d.amount > 0.01);
    const total = debts.reduce((sum, d) => sum + d.amount, 0);
    return { total: total > 0.01 ? total : 0, debts };
};

window.syncPlayersDebtFields = async function() {
    if (!window.isAdmin || !window.isReady || window._syncingDebts) return;
    window._syncingDebts = true;
    try {
        const batch = db.batch();
        let count = 0;
        (window.players || []).forEach(p => {
            if (!p || !p.id) return;
            const realTotal = Number(window.getPlayerDebts(p.id).total.toFixed(2));
            const realPaidUp = realTotal <= 0.01;
            const curDebt = parseFloat(p.debtAmount) || 0;
            if (Math.abs(curDebt - realTotal) > 0.01 || Boolean(p.isPaidUp) !== realPaidUp) {
                batch.set(db.collection(window.playersPath).doc(p.id), { debtAmount: realTotal, isPaidUp: realPaidUp }, { merge: true });
                count++;
            }
        });
        if (count > 0) await batch.commit();
    } catch (err) {
        console.error('Error sincronizando saldos:', err);
    } finally {
        window._syncingDebts = false;
    }
};
window.getMorosityStatus = function(playerId) {
    const dData = window.getPlayerDebts(playerId);
    if (dData.total <= 0.01) return { status: 'aldia', label: 'Al Día', color: 'green' };
    const todayStr = new Date().toISOString().split('T')[0];
    let hasVencida = false;
    dData.debts.forEach(d => {
        if (d.typeKey === 'arbitraje' || d.typeKey === 'multa') {
            if (d.date && /^\d{4}-\d{2}-\d{2}$/.test(d.date)) {
                const limitDate = new Date(d.date + 'T12:00:00');
                limitDate.setDate(limitDate.getDate() + 1);
                const limitStr = limitDate.toISOString().split('T')[0];
                if (todayStr > limitStr) hasVencida = true;
            } else {
                hasVencida = true;
            }
        } else if (d.dueDate && /^\d{4}-\d{2}-\d{2}$/.test(d.dueDate)) {
            if (todayStr > d.dueDate) hasVencida = true;
        } else if (d.typeKey === 'mensualidad' && d.date && typeof d.date === 'string') {
            const parts = d.date.split('-');
            if (parts.length === 3 && todayStr > `${parts[0]}-${parts[1]}-25`) hasVencida = true;
        }
    });
    if (hasVencida) return { status: 'mora', label: 'En Mora', color: 'red' };
    return { status: 'plazo', label: 'En Plazo', color: 'yellow' };
};
window.newTransaction = function(type) {
document.getElementById('finances-form').reset(); document.getElementById('f-id').value = ''; document.getElementById('f-type').value = type; document.getElementById('fin-form-title').innerHTML = type === 'income' ? '<i class="fas fa-arrow-down text-green-500 mr-2"></i>Nuevo Ingreso' : '<i class="fas fa-arrow-up text-red-500 mr-2"></i>Nuevo Egreso';
const catSelect = document.getElementById('f-category'); catSelect.innerHTML = ''; finCategories[type].forEach(c => { const o = document.createElement('option'); o.value = c; o.textContent = c; catSelect.appendChild(o); });
document.getElementById('f-date').value = new Date().toISOString().split('T')[0]; document.getElementById('f-match-container').classList.add('hidden'); document.getElementById('f-player-container').classList.add('hidden'); document.getElementById('f-specific-debt-container').classList.add('hidden');
const matchSelect = document.getElementById('f-match'); matchSelect.innerHTML = '<option value="">Selecciona...</option>'; window.matches.sort((a,b) => new Date(b.date) - new Date(a.date)).forEach(m => { const o = document.createElement('option'); o.value = m.id; o.textContent = `${new Date(m.date+'T12:00:00').toLocaleDateString('es-ES',{day:'2-digit',month:'short'})} - vs ${m.opponent}`; matchSelect.appendChild(o); });
window.toggleMatchSelect(); window.updateAdminUI(); window.showSection('financesForm');
};
window.toggleMatchSelect = function() {
    const cat = document.getElementById('f-category').value;
    const mc = document.getElementById('f-match-container');
    const pc = document.getElementById('f-player-container');
    const sdc = document.getElementById('f-specific-debt-container');
    const rc = document.getElementById('f-rate-config-container');
    if (cat === 'Arbitraje' || cat === 'Multa Tarjeta' || cat === 'Cobro Manual') mc.classList.remove('hidden'); else { mc.classList.add('hidden'); document.getElementById('f-match').value = ''; document.getElementById('f-arbitraje-calc').classList.add('hidden'); }
    if (cat === 'Cobro Manual' || cat === 'Multa Tarjeta' || cat === 'Abono a Deuda (Jugador)' || cat === 'Inscripción') { pc.classList.remove('hidden'); window.populateFinPlayerSelect(); } else { pc.classList.add('hidden'); document.getElementById('f-player').value = ''; }
    if (cat === 'Abono a Deuda (Jugador)') { sdc.classList.remove('hidden'); window.populateSpecificDebts(); } else { sdc.classList.add('hidden'); document.getElementById('f-specific-debt').value = ''; }
    if (rc) { if (cat === 'Cobro Manual' || cat === 'Inscripción') rc.classList.remove('hidden'); else rc.classList.add('hidden'); }
    window.calcArbitraje();
};
window.populateFinPlayerSelect = function() { const sel = document.getElementById('f-player'); sel.innerHTML = '<option value="">Selecciona...</option>'; window.players.sort((a,b) => (a.name||'').localeCompare(b.name||'')).forEach(p => { const o = document.createElement('option'); o.value = p.id; o.textContent = p.name; sel.appendChild(o); }); };
window.calcArbitraje = function() {
const cat = document.getElementById('f-category').value, calcDiv = document.getElementById('f-arbitraje-calc');
if (cat !== 'Arbitraje') { calcDiv.classList.add('hidden'); return; }
const matchId = document.getElementById('f-match').value, amount = parseFloat(document.getElementById('f-amount').value) || 0;
if (!matchId || amount <= 0) { calcDiv.classList.add('hidden'); return; }
const match = window.matches.find(m => m.id === matchId); if (!match || !match.lineup) { calcDiv.classList.add('hidden'); return; }
const valid = match.lineup.filter(l => { const p = window.players.find(x => x.id === l.playerId); return p && !p.isStaff; }); if (valid.length === 0) { calcDiv.classList.add('hidden'); return; }
const cuota = amount / valid.length; calcDiv.classList.remove('hidden'); calcDiv.innerHTML = `<p class="text-xs font-bold"><i class="fas fa-users mr-1"></i> ${valid.length} jugadores convocados</p><p class="text-lg font-black text-brand-600 dark:text-brand-400 mt-1">Cuota por jugador: ${cuota.toFixed(2)}</p>`;
};
window.handleAmountInput = function() { window.calcArbitraje(); };
window.populateSpecificDebts = function() {
const playerId = document.getElementById('f-player').value, sel = document.getElementById('f-specific-debt'); sel.innerHTML = '<option value="">Abono general a cuenta</option>'; if (!playerId) return;
window.getPlayerDebts(playerId).debts.forEach(d => { const o = document.createElement('option'); o.value = d.id; o.textContent = `${d.desc.substring(0,35)} - ${d.amount.toFixed(2)}`; sel.appendChild(o); });
};
window.handleSpecificDebtSelect = function() { const debtId = document.getElementById('f-specific-debt').value; if (!debtId) return; const playerId = document.getElementById('f-player').value; const debt = window.getPlayerDebts(playerId).debts.find(d => d.id === debtId); if (debt) document.getElementById('f-amount').value = debt.amount.toFixed(2); };
window.saveTransaction = async function(e) {
    e.preventDefault();
    if (!window.isAdmin) return window.showToast('Solo Lectura', true);
    const btn = document.getElementById('btn-save-fin');
    btn.disabled = true; btn.textContent = "Guardando...";

    const docId = document.getElementById('f-id').value || window.generateId();
    const type = document.getElementById('f-type').value;
    const category = document.getElementById('f-category').value;
    const amount = parseFloat(document.getElementById('f-amount').value);
    const date = document.getElementById('f-date').value;
    const description = document.getElementById('f-desc').value;
    const matchId = document.getElementById('f-match').value || null;
    const playerId = document.getElementById('f-player').value || null;
    const specificDebtId = document.getElementById('f-specific-debt').value || null;

    const batch = db.batch();

    if (category === 'Abono a Deuda (Jugador)' && playerId) {
        const openDebts = window.getPlayerDebts(playerId).debts;
        if (specificDebtId) {
            const target = openDebts.find(d => d.id === specificDebtId);
            const payAmt = target ? Math.min(amount, target.amount) : amount;
            const isFull = target && Math.abs(target.amount - payAmt) < 0.01;
            batch.set(db.collection(window.financesPath).doc(docId), {
                id: docId, type: 'income', amount: Number(payAmt.toFixed(2)), date, category, description, matchId, playerId, specificDebtId
            });
            if (isFull) {
                if (specificDebtId.startsWith('arb_')) {
                    const parentId = specificDebtId.slice(4);
                    const arbTx = (window.finances || []).find(x => x && x.id === parentId);
                    if (arbTx) batch.set(db.collection(window.financesPath).doc(parentId), { paidBy: [...new Set([...(arbTx.paidBy || []), playerId])] }, { merge: true });
                } else {
                    batch.set(db.collection(window.financesPath).doc(specificDebtId), { isPaid: true }, { merge: true });
                }
            }
        } else {
            let rem = amount;
            openDebts.forEach(d => {
                if (rem <= 0.01) return;
                const payHere = Math.min(rem, d.amount);
                const abId = window.generateId();
                const isFull = Math.abs(d.amount - payHere) < 0.01;
                batch.set(db.collection(window.financesPath).doc(abId), {
                    id: abId, type: 'income', amount: Number(payHere.toFixed(2)), date, category, description: `${description} (${d.desc})`, matchId: null, playerId, specificDebtId: d.id
                });
                if (isFull) {
                    if (d.id.startsWith('arb_')) {
                        const parentId = d.id.slice(4);
                        const arbTx = (window.finances || []).find(x => x && x.id === parentId);
                        if (arbTx) batch.set(db.collection(window.financesPath).doc(parentId), { paidBy: [...new Set([...(arbTx.paidBy || []), playerId])] }, { merge: true });
                    } else {
                        batch.set(db.collection(window.financesPath).doc(d.id), { isPaid: true }, { merge: true });
                    }
                }
                rem -= payHere;
            });
            if (rem > 0.01) {
                batch.set(db.collection(window.financesPath).doc(docId), {
                    id: docId, type: 'income', amount: Number(rem.toFixed(2)), date, category: 'Otro Ingreso', description: `${description} (Excedente)`, matchId, playerId
                });
            }
        }
    } else {
        const rateMode = (category === 'Multa Tarjeta' || category === 'Arbitraje') ? 'eur' : (document.getElementById('f-rate-mode')?.value || 'eur');
        const dueDate = (category === 'Cobro Manual' || category === 'Inscripción') ? (document.getElementById('f-due-date')?.value || '') : '';
        const tData = { id: docId, type, amount, date, category, description, matchId, playerId, rateMode, dueDate };
        if (category === 'Cobro Manual' || category === 'Multa Tarjeta') tData.isPaid = false;
        if (category === 'Arbitraje') tData.paidBy = [];
        batch.set(db.collection(window.financesPath).doc(docId), tData);
    }

    try {
        await batch.commit();
        window.showToast('Movimiento guardado');
        window.showSection('finances');
    } catch (err) {
        window.showToast('Error al guardar', true);
    } finally {
        btn.disabled = false; btn.textContent = "Guardar";
    }
};

window.deleteTransaction = function(id) {
    window.showConfirm('¿Eliminar este movimiento?', async () => {
        try {
            const batch = db.batch();
            const t = (window.finances || []).find(x => x && x.id === id);
            if (t && t.category === 'Abono a Deuda (Jugador)' && t.specificDebtId) {
                if (t.specificDebtId.startsWith('arb_')) {
                    const parentId = t.specificDebtId.slice(4);
                    const arbTx = (window.finances || []).find(x => x && x.id === parentId);
                    if (arbTx && Array.isArray(arbTx.paidBy)) {
                        batch.set(db.collection(window.financesPath).doc(parentId), { paidBy: arbTx.paidBy.filter(pid => pid !== t.playerId) }, { merge: true });
                    }
                } else {
                    const parentDebt = (window.finances || []).find(x => x && x.id === t.specificDebtId);
                    if (parentDebt) batch.set(db.collection(window.financesPath).doc(t.specificDebtId), { isPaid: false }, { merge: true });
                }
            }
            batch.delete(db.collection(window.financesPath).doc(id));
            await batch.commit();
            window.showToast('Movimiento eliminado');
        } catch (e) {
            window.showToast('Error', true);
        }
    });
};
window.switchFinancesTab = function(tab) {
window.currentFinTab = tab;
const tabResumen = document.getElementById('fin-tab-resumen'), tabCobros = document.getElementById('fin-tab-cobros');
if(tabResumen) tabResumen.classList.add('hidden'); if(tabCobros) tabCobros.classList.add('hidden');
const baseClass = "flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 ";
const activeClass = baseClass + "bg-brand-600 text-white shadow-sm";
const inactiveClass = baseClass + "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800";
const btnResumen = document.getElementById('fin-tab-btn-resumen'), btnCobros = document.getElementById('fin-tab-btn-cobros');
if(btnResumen) btnResumen.className = inactiveClass; if(btnCobros) btnCobros.className = "admin-only " + inactiveClass;
const activeTab = document.getElementById('fin-tab-' + tab), activeBtn = document.getElementById('fin-tab-btn-' + tab);
if(activeTab) activeTab.classList.remove('hidden'); if(activeBtn) activeBtn.className = (tab === 'cobros' ? "admin-only " : "") + activeClass;
window.renderFinances();
};
window.getValidCashAmount = function(t) {
if (t.type === 'expense') return t.amount || 0;
if (t.type === 'income') {
if (t.isPaid === false) return 0;
if (t.isPaid === true && (t.category === 'Cuota Mensual' || t.category === 'Cobro Manual')) {
const hasAbono = window.finances.some(x => x.category === 'Abono a Deuda (Jugador)' && x.specificDebtId === t.id); if (hasAbono) return 0;
}
return t.amount || 0;
}
return 0;
};
window.monthlyCloseReport = function() {
const now = new Date(); const currentMonth = now.toISOString().slice(0, 7); const monthName = now.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase();
let inc = 0, exp = 0;
window.finances.forEach(t => { if ((t.date || '').startsWith(currentMonth)) { if (t.type === 'income') inc += window.getValidCashAmount(t); else if (t.type === 'expense') exp += window.getValidCashAmount(t); } });
let msg = `*📊 CIERRE DE MES NISUS FC - ${monthName}*\n\n🟩 *Ingresos del mes:* $${inc.toFixed(2)}\n🟥 *Egresos del mes:* $${exp.toFixed(2)}\n💵 *Balance Mensual:* $${(inc - exp).toFixed(2)}\n\n_Balance total histórico en caja:_ *$${document.getElementById('fin-balance').textContent}*\n\n¡Gracias a todos por mantener al club funcionando! ⚽`;
navigator.clipboard.writeText(msg).then(() => window.showToast('Reporte copiado al portapapeles')).catch(() => window.showToast('Error al copiar', true));
};
window.sendDirectWhatsApp = function(playerId) {
if (!window.isAdmin) return window.showToast('Solo administradores', true);
const p = window.players.find(x => x.id === playerId); if (!p) return;
const debtData = window.getPlayerDebts(playerId);
const debtFilter = document.getElementById('debt-filter') ? document.getElementById('debt-filter').value : 'all';
let filteredDebts = debtData.debts;
if (debtFilter !== 'all') {
    filteredDebts = debtData.debts.filter(d => window.matchesDebtFilter(d, debtFilter));
}
const totalFiltered = filteredDebts.reduce((sum, d) => sum + d.amount, 0);
if (totalFiltered <= 0) return window.showToast('Sin deuda en esta categoría', true);
let msg = `Hola ${p.name}, te escribo de NISUS FC ⚽. Tienes un saldo pendiente por un total de *$${totalFiltered.toFixed(2)}*.\n\n*Detalle de tu deuda:*\n`;
filteredDebts.forEach(d => { msg += `• ${d.desc}: $${d.amount.toFixed(2)}\n`; });
msg += `\n¡Gracias por tu apoyo para mantener el club al día!`;
const url = `https://wa.me/?text=${encodeURIComponent(msg)}`; window.open(url, '_blank');
};
window.copyGroupMessage = function() {
if (!window.isAdmin) return window.showToast('Solo el administrador puede usar esta función', true);
const debtFilter = document.getElementById('debt-filter') ? document.getElementById('debt-filter').value : 'all';
let filterName = "Estado de Pagos";
if (debtFilter === 'mensualidad') filterName = "Cuotas Mensuales Pendientes";
if (debtFilter === 'arbitraje') filterName = "Arbitrajes Pendientes";
if (debtFilter === 'multa') filterName = "Multas Disciplinarias";
const enMora = [], enPlazo = [];
window.players.filter(p => !p.isStaff && (p.status === 'active' || !p.status)).sort((a,b) => (a.name||'').localeCompare(b.name||'')).forEach(p => {
const d = window.getPlayerDebts(p.id); let totalFiltered = 0;
if (debtFilter === 'all') { totalFiltered = d.total; }
else {
const filtered = d.debts.filter(x => window.matchesDebtFilter(x, debtFilter));
totalFiltered = filtered.reduce((sum, x) => sum + x.amount, 0);
}
if (totalFiltered > 0.01) {
const mor = window.getMorosityStatus(p.id);
if (mor.status === 'mora') enMora.push(`🔴 ${p.name}: $${totalFiltered.toFixed(2)}`);
else enPlazo.push(`🟡 ${p.name}: $${totalFiltered.toFixed(2)}`);
}
});
let msg = `*NISUS FC - ${filterName}*\n\n`;
if (debtFilter === 'all') msg += '⚠️ _Límite de pago para no entrar en mora: **Día 25** de cada mes._\n\n';
if (enMora.length === 0 && enPlazo.length === 0) { msg += '✅ Todos los jugadores están al día con este concepto. ¡Gracias!'; }
else {
if (enMora.length > 0) msg += '🚨 *LISTA DE COBRO*\n' + enMora.join('\n') + '\n\n';
if (enPlazo.length > 0) msg += '⏳ *EN PLAZO*\n' + enPlazo.join('\n') + '\n\n';
msg += '_Gracias por su compromiso con el equipo._';
}
navigator.clipboard.writeText(msg).then(() => window.showToast('Lista copiada al portapapeles')).catch(() => window.showToast('Error al copiar', true));
};
window.exportFinancesCSV = function() {
if (!window.isAdmin) return window.showToast('Solo administradores pueden exportar', true);
if (!window.finances || window.finances.length === 0) return window.showToast('No hay datos para exportar', true);
let csvContent = "\uFEFF";
csvContent += "ID Movimiento,Fecha,Tipo,Categoría,Descripción,Jugador / Rival,Monto ($),Estado\n";
const sorted = [...window.finances].sort((a,b) => new Date(b.date||0) - new Date(a.date||0));
sorted.forEach(t => {
const id = t.id || ''; const fecha = t.date ? new Date(t.date+'T12:00:00').toLocaleDateString('es-ES') : '';
const tipo = t.type === 'income' ? 'Ingreso' : 'Egreso'; const categoria = `"${t.category || ''}"`; const desc = `"${(t.description || '').replace(/"/g, '""')}"`;
let extra = '""';
if (t.matchId) { const m = (window.matches || []).find(x => x.id === t.matchId); if (m) extra = `"vs ${m.opponent || ''}"`; }
if (t.playerId) { const p = (window.players || []).find(x => x.id === t.playerId); if (p) extra = `"${p.name || ''}"`; }
const validAmt = typeof window.getValidCashAmount === 'function' ? window.getValidCashAmount(t) : 0;
const monto = (t.amount || 0).toFixed(2);
let estado = 'Pagado / Saldado';
if (t.type === 'income' && t.isPaid === false) estado = 'Pendiente de Cobro';
if (t.type === 'income' && validAmt === 0 && t.isPaid !== false) estado = 'Pagado (Saldado con Abonos)';
csvContent += `${id},${fecha},${tipo},${categoria},${desc},${extra},${monto},${estado}\n`;
});
const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
const link = document.createElement("a");
const url = URL.createObjectURL(blob);
link.setAttribute("href", url); link.setAttribute("download", `Tesoreria_NISUS_${new Date().toISOString().split('T')[0]}.csv`);
document.body.appendChild(link); link.click(); document.body.removeChild(link);
window.showToast("Excel descargado correctamente");
};
window.exchangeRateBCV = null;
window.currentExchangeRate = null;

window.updateRateBadge = function(mode, rate) {
    const badge = document.getElementById('rate-status-badge');
    if (!badge) return;
    if (!rate || mode === 'off') {
        badge.textContent = 'Conversión desactivada (Solo USD)';
        badge.className = 'text-[10px] font-bold text-slate-400';
    } else if (mode === 'bcv') {
        badge.textContent = `BCV Oficial activa: ${rate.toFixed(2)} Bs/$`;
        badge.className = 'text-[10px] font-bold text-green-600 dark:text-green-400';
    } else {
        badge.textContent = `Tasa Manual activa: ${rate.toFixed(2)} Bs/$`;
        badge.className = 'text-[10px] font-bold text-amber-600 dark:text-amber-400';
    }
};

window.fetchVenezuelaRates = async function() {
    if (!window.isAdmin) return window.showToast('Solo administradores', true);
    const btnIcon = document.getElementById('bcv-spinner');
    if (btnIcon) btnIcon.classList.add('fa-spin');
    try {
        const response = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
        const data = await response.json();
        const rate = data && parseFloat(data.promedio);
        if (rate && rate > 0) {
            window.currentExchangeRate = rate;
            const inputEl = document.getElementById('custom-rate-input');
            if (inputEl) inputEl.value = rate.toFixed(2);
            window.updateRateBadge('bcv', rate);
            window.showToast(`Tasa BCV aplicada: ${rate.toFixed(2)} Bs`);
            window.renderFinances();
        } else throw new Error("Sin datos de la API");
    } catch (error) {
        window.showToast("Fallo al conectar con BCV. Ingresa la tasa manual.", true);
    } finally {
        if (btnIcon) btnIcon.classList.remove('fa-spin');
    }
};

window.applyCustomRate = function() {
    if (!window.isAdmin) return;
    const inputEl = document.getElementById('custom-rate-input');
    if (!inputEl) return;
    const val = parseFloat(inputEl.value.replace(/[^0-9,.]/g, '').replace(',', '.'));
    if (!isNaN(val) && val > 0) {
        window.currentExchangeRate = val;
        window.updateRateBadge('manual', val);
    } else {
        window.currentExchangeRate = null;
        window.updateRateBadge('off', null);
    }
    window.renderFinances();
};

window.clearRate = function() {
    window.currentExchangeRate = null;
    const input = document.getElementById('custom-rate-input');
    if (input) input.value = '';
    window.updateRateBadge('off', null);
    window.renderFinances();
};

window.initExchangeRate = function() {
    const today = new Date().toISOString().split('T')[0];
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem('nisus_rate_prefs')); } catch (e) {}
    const inputEl = document.getElementById('custom-rate-input');

    if (!saved) {
        window.fetchVenezuelaRates(true);
        return;
    }
    if (saved.mode === 'off') {
        window.currentExchangeRate = null;
        if (inputEl) inputEl.value = '';
        window.updateRateBadge('off', null);
    } else if (saved.mode === 'manual' && saved.rate > 0) {
        window.currentExchangeRate = saved.rate;
        if (inputEl) inputEl.value = Number(saved.rate).toFixed(2);
        window.updateRateBadge('manual', Number(saved.rate));
    } else if (saved.mode === 'bcv') {
        if (saved.rate > 0) {
            window.currentExchangeRate = Number(saved.rate);
            if (inputEl) inputEl.value = Number(saved.rate).toFixed(2);
            window.updateRateBadge('bcv', Number(saved.rate), saved.date === today ? 'Hoy' : saved.date);
        }
        if (saved.date !== today) window.fetchVenezuelaRates(true);
    }
};
window.renderFinances = function() {
if (typeof window.renderFinancesTicker === 'function') window.renderFinancesTicker();
if (typeof window.syncPlayersDebtFields === 'function') window.syncPlayersDebtFields();   
let income = 0, expense = 0;
(window.finances || []).forEach(t => {
if(!t) return;
if (t.type === 'income') income += window.getValidCashAmount(t);
else if (t.type === 'expense') expense += window.getValidCashAmount(t);
});
const balance = income - expense;
const elB = document.getElementById('fin-balance'); if(elB) elB.textContent = `$${balance.toFixed(2)}`;
const elI = document.getElementById('fin-income'); if(elI) elI.textContent = `+$${income.toFixed(2)}`;
const elE = document.getElementById('fin-expense'); if(elE) elE.textContent = `-$${expense.toFixed(2)}`;
const b_bs = document.getElementById('fin-balance-bs'); const i_bs = document.getElementById('fin-income-bs'); const e_bs = document.getElementById('fin-expense-bs');
if (window.currentExchangeRate) {
if(b_bs) b_bs.textContent = `≈ ${(balance * window.currentExchangeRate).toFixed(2)} Bs`;
if(i_bs) i_bs.textContent = `≈ ${(income * window.currentExchangeRate).toFixed(2)} Bs`;
if(e_bs) e_bs.textContent = `≈ ${(expense * window.currentExchangeRate).toFixed(2)} Bs`;
} else {
if(b_bs) b_bs.textContent = ''; if(i_bs) i_bs.textContent = ''; if(e_bs) e_bs.textContent = '';
}
if (window.currentFinTab === 'cobros' && typeof window.renderMonthlyDues === 'function') window.renderMonthlyDues();
const debtorsList = document.getElementById('debtors-list');
if (debtorsList) {
debtorsList.innerHTML = ''; let hasDebtors = false;
const debtFilter = document.getElementById('debt-filter') ? document.getElementById('debt-filter').value : 'all';
(window.players || []).filter(p => p && !p.isStaff && (p.status === 'active' || !p.status)).sort((a,b) => (a?.name||'').localeCompare(b?.name||'')).forEach(p => {
const debtData = window.getPlayerDebts(p.id); let totalDebt = 0;
if (debtFilter === 'all') { totalDebt = debtData.total; }
else {
const filtered = debtData.debts.filter(d => window.matchesDebtFilter(d, debtFilter));
totalDebt = filtered.reduce((sum, d) => sum + d.amount, 0);
}
if (totalDebt > 0.01) {
hasDebtors = true;
const validName = (typeof p.name === 'string' && p.name.trim() !== '') ? p.name.trim() : '?';
const ini = validName.charAt(0).toUpperCase();
const img = p.image ? `<img src="${p.image}" class="w-10 h-10 rounded-full object-cover shadow-sm">` : `<div class="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/50 text-brand-600 font-black flex items-center justify-center shadow-sm">${ini}</div>`;
let bsEquivalent = window.currentExchangeRate ? `<span class="text-[9px] text-slate-400 block mt-0.5">≈ ${(totalDebt * window.currentExchangeRate).toFixed(2)} Bs</span>` : '';
const rowAction = window.isAdmin ? `onclick="window.openPlayerFinancialReport('${p.id}')" class="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer border-b border-slate-100 dark:border-slate-800 last:border-0"` : `class="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 last:border-0"`;
const adminButtons = window.isAdmin ? `<div class="flex items-center gap-2 mt-1"><button onclick="event.stopPropagation(); window.sendDirectWhatsApp('${p.id}')" class="w-6 h-6 rounded bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 flex items-center justify-center transition shadow-sm" title="Enviar recordatorio"><i class="fab fa-whatsapp"></i></button><span class="text-[9px] text-brand-600 dark:text-brand-400 font-bold uppercase cursor-pointer px-2 py-1 bg-brand-50 rounded" onclick="event.stopPropagation(); window.openPaySpecific('${p.id}')">💰 Pagar</span></div>` : ``;
const mor = window.getMorosityStatus(p.id);
const isMora = mor.status === 'mora';
const statusBadge = isMora
    ? `<span class="inline-flex items-center gap-1 px-2 py-0.5 mt-1 rounded text-[8px] font-black uppercase tracking-widest border bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800 shadow-sm"><i class="fas fa-exclamation-triangle"></i> EN MORA</span>`
    : `<span class="inline-flex items-center gap-1 px-2 py-0.5 mt-1 rounded text-[8px] font-black uppercase tracking-widest border bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800 shadow-sm"><i class="fas fa-clock"></i> EN PLAZO</span>`;
const amtColor = isMora ? 'text-red-500' : 'text-amber-500';
debtorsList.innerHTML += `<li ${rowAction}><div class="flex items-center gap-3 w-[60%]">${img}<div class="min-w-0"><p class="font-bold text-sm text-slate-800 dark:text-slate-200 truncate">${validName}</p>${statusBadge}</div></div><div class="text-right shrink-0 flex flex-col items-end gap-1"><p class="font-black text-lg leading-none ${amtColor}">$${totalDebt.toFixed(2)}</p>${bsEquivalent}${adminButtons}</div></li>`;}
});
if (!hasDebtors) debtorsList.innerHTML = '<li class="p-6 text-center text-sm text-slate-500 font-medium">No hay deudas en esta categoría</li>';
}
if (typeof window.renderTransactionsHistory === 'function') window.renderTransactionsHistory();
if (window.currentFinTab === 'resumen' || !window.currentFinTab) {
setTimeout(() => { if (typeof window.renderCashflowChart === 'function') window.renderCashflowChart(); if (typeof window.renderExpensesDonutChart === 'function') window.renderExpensesDonutChart(); }, 150);
}
};
window.renderTransactionsHistory = function() {
    const transList = document.getElementById('transactions-list');
    if (!transList) return;

    const allTx = [...(window.finances || [])].filter(Boolean).sort((a, b) => new Date(b?.date || 0) - new Date(a?.date || 0));

    const monthSel = document.getElementById('tx-month-filter');
    if (monthSel) {
        const curMonth = monthSel.value || 'all';
        const months = [...new Set(allTx.map(t => (t.date || '').slice(0, 7)).filter(m => /^\d{4}-\d{2}$/.test(m)))].sort((a, b) => b.localeCompare(a));
        monthSel.innerHTML = '<option value="all">Todos los meses</option>' + months.map(ym => {
            const lbl = new Date(ym + '-15T12:00:00').toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
            return `<option value="${ym}">${lbl.charAt(0).toUpperCase() + lbl.slice(1)}</option>`;
        }).join('');
        monthSel.value = months.includes(curMonth) ? curMonth : 'all';
    }

    const q = (document.getElementById('tx-search')?.value || '').trim().toLowerCase();
    const typeF = document.getElementById('tx-type-filter')?.value || 'all';
    const monthF = document.getElementById('tx-month-filter')?.value || 'all';

    const filtered = allTx.filter(t => {
        if (monthF !== 'all' && (t.date || '').slice(0, 7) !== monthF) return false;
        const validAmt = typeof window.getValidCashAmount === 'function' ? window.getValidCashAmount(t) : 0;
        if (typeF === 'income' && !(t.type === 'income' && validAmt > 0)) return false;
        if (typeF === 'expense' && t.type !== 'expense') return false;
        if (typeF === 'pending' && t.isPaid !== false) return false;
        if (q) {
            const p = t.playerId ? (window.players || []).find(x => x?.id === t.playerId) : null;
            const m = t.matchId ? (window.matches || []).find(x => x?.id === t.matchId) : null;
            const haystack = `${t.category || ''} ${t.description || ''} ${p?.name || ''} ${p?.alias || ''} ${m?.opponent || ''}`.toLowerCase();
            if (!haystack.includes(q)) return false;
        }
        return true;
    });

    transList.innerHTML = '';
    let fInc = 0, fExp = 0;

    if (filtered.length === 0) {
        transList.innerHTML = '<tr><td colspan="3" class="px-6 py-8 text-center text-sm text-slate-500 font-medium">No se encontraron movimientos con estos filtros</td></tr>';
    } else {
        filtered.forEach(t => {
            const dateVal = t?.date && typeof t.date === 'string' && t.date.includes('-') ? t.date + 'T12:00:00' : new Date().toISOString();
            const dStr = new Date(dateVal).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
            let extra = '';
            if (t?.matchId) { const m = (window.matches || []).find(x => x?.id === t.matchId); if (m) extra = ` vs ${m?.opponent || 'Rival desconocido'}`; }
            if (t?.playerId) { const p = (window.players || []).find(x => x?.id === t.playerId); if (p) extra += ` · ${p?.name || 'Jugador desconocido'}`; }
            const validAmt = typeof window.getValidCashAmount === 'function' ? window.getValidCashAmount(t) : 0;

            if (t.type === 'income') fInc += validAmt;
            else if (t.type === 'expense') fExp += validAmt;

            let displayAmt = '', iconBadge = '';
            if (t?.type === 'expense') {
                displayAmt = `<p class="font-black text-red-600 dark:text-red-400">-$${(t?.amount || 0).toFixed(2)}</p>`;
                iconBadge = `<span class="w-9 h-9 rounded-lg flex items-center justify-center text-sm bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"><i class="fas fa-arrow-up"></i></span>`;
            } else if (t?.isPaid === false) {
                displayAmt = `<p class="font-black text-amber-500" title="Pendiente de Cobro">⏳ $${(t?.amount || 0).toFixed(2)}</p>`;
                iconBadge = `<span class="w-9 h-9 rounded-lg flex items-center justify-center text-sm bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"><i class="fas fa-clock"></i></span>`;
            } else if (validAmt === 0) {
                displayAmt = `<p class="font-black text-slate-400 line-through" title="Saldada (Ver Abono)">$${(t?.amount || 0).toFixed(2)}</p>`;
                iconBadge = `<span class="w-9 h-9 rounded-lg flex items-center justify-center text-sm bg-slate-100 dark:bg-slate-800 text-slate-400"><i class="fas fa-check"></i></span>`;
            } else {
                displayAmt = `<p class="font-black text-green-600 dark:text-green-400">+$${(t?.amount || 0).toFixed(2)}</p>`;
                iconBadge = `<span class="w-9 h-9 rounded-lg flex items-center justify-center text-sm bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"><i class="fas fa-arrow-down"></i></span>`;
            }

            let receiptBtn = '';
            if (t?.type === 'income' && t?.playerId && validAmt > 0) {
                receiptBtn = `<button onclick="window.downloadReceiptFromTx('${t.id}')" class="text-brand-500 hover:text-brand-600 w-8 h-8 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-900/20 transition mr-1" title="Descargar Recibo"><i class="fas fa-file-invoice-dollar"></i></button>`;
            }
            const delCls = window.isAdmin ? '' : 'force-hidden';
            transList.innerHTML += `<tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"><td class="px-6 py-4"><div class="flex items-center gap-3">${iconBadge}<div><p class="font-bold text-sm text-slate-800 dark:text-slate-200">${t?.category || 'Sin categoría'}</p><p class="text-[10px] text-slate-400">${t?.description || ''}${extra}</p></div></div></td><td class="px-6 py-4 text-right whitespace-nowrap">${displayAmt}<p class="text-[10px] text-slate-400">${dStr}</p></td><td class="px-6 py-4 text-right flex items-center justify-end">${receiptBtn}<button onclick="window.deleteTransaction('${t?.id}')" class="admin-only ${delCls} text-slate-400 hover:text-red-500 w-8 h-8 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition" title="Anular"><i class="fas fa-trash"></i></button></td></tr>`;
        });
    }

    const sumEl = document.getElementById('tx-filter-summary');
    if (sumEl) {
        sumEl.innerHTML = `<span>Mostrando ${filtered.length} de ${allTx.length} mov.</span><div class="flex items-center gap-3"><span class="text-green-600 dark:text-green-400">+$${fInc.toFixed(2)}</span><span class="text-red-500">-$${fExp.toFixed(2)}</span><span class="text-slate-800 dark:text-white">Neto: $${(fInc - fExp).toFixed(2)}</span></div>`;
    }
};
window.openPaySpecific = function(playerId) {
if (!window.isAdmin) return window.showToast('Solo los administradores pueden registrar cobros', true);
const p = window.players.find(x => x.id === playerId); if (!p) return;
document.getElementById('pay-spec-name').textContent = p.name;
const list = document.getElementById('pay-spec-list'); const debts = window.getPlayerDebts(playerId);
list.innerHTML = '';
if (debts.debts.length === 0) { list.innerHTML = '<p class="text-center text-sm text-slate-500 py-6">Sin deudas pendientes</p>'; }
else {
debts.debts.forEach(d => {
const dStr = (d.date && d.date.includes('-')) ? new Date(d.date+'T12:00:00').toLocaleDateString('es-ES',{day:'2-digit',month:'short',year:'numeric'}) : 'Saldo acumulado';
list.innerHTML += `<div class="flex justify-between items-center bg-slate-50 dark:bg-slate-800 p-3 rounded-xl mb-2 border border-slate-200 dark:border-slate-700"><div class="flex-1 min-w-0 pr-2"><p class="text-xs font-bold text-slate-700 dark:text-slate-300 truncate" title="${d.desc}">${d.desc}</p><p class="text-[10px] text-slate-400">${dStr}</p></div><div class="flex items-center gap-2 shrink-0"><span class="text-slate-400 font-bold text-xs">$</span><input type="number" id="pay-amt-${d.id}" value="${d.amount.toFixed(2)}" max="${d.amount.toFixed(2)}" step="0.01" class="w-16 sm:w-20 py-1.5 px-2 text-right text-sm font-black text-red-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"><button onclick="window.processSpecificPayment('${playerId}', '${d.id}', ${d.amount})" class="admin-only bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm">Abonar</button></div></div>`;
});
}
document.getElementById('pay-spec-total').textContent = `${debts.total.toFixed(2)}`; document.getElementById('modalPaySpecific').classList.remove('hidden'); window.updateAdminUI();
};
window.processSpecificPayment = function(playerId, debtId, maxAmount) {
const inputEl = document.getElementById(`pay-amt-${debtId}`); if (!inputEl) return;
let payAmount = parseFloat(inputEl.value);
if (isNaN(payAmount) || payAmount <= 0) return window.showToast('Ingresa un monto válido', true);
if (payAmount > maxAmount) { payAmount = maxAmount; inputEl.value = maxAmount.toFixed(2); }
window.paySpecificDebt(playerId, debtId, payAmount, maxAmount);
};
window.paySpecificDebt = async function(playerId, debtId, amount, maxAmount) {
    if (!window.isAdmin) return window.showToast('Solo Lectura', true);
    const isFullPayment = Math.abs(maxAmount - amount) < 0.01;
    const finId = window.generateId();
    const tData = { id: finId, type: 'income', amount: Number(amount.toFixed(2)), date: new Date().toISOString().split('T')[0], category: 'Abono a Deuda (Jugador)', description: isFullPayment ? 'Pago total de deuda' : 'Abono parcial a deuda', playerId: playerId, specificDebtId: debtId };
    const batch = db.batch();
    batch.set(db.collection(window.financesPath).doc(finId), tData);

    if (isFullPayment) {
        if (debtId.startsWith('arb_')) {
            const parentId = debtId.slice(4);
            const arbTx = (window.finances || []).find(x => x && x.id === parentId);
            if (arbTx) batch.set(db.collection(window.financesPath).doc(parentId), { paidBy: [...new Set([...(arbTx.paidBy || []), playerId])] }, { merge: true });
        } else {
            batch.set(db.collection(window.financesPath).doc(debtId), { isPaid: true }, { merge: true });
        }
    }
    try {
        await batch.commit();
        window._lastPaidTx = tData;
        window.showToast(isFullPayment ? 'Deuda saldada' : 'Abono registrado exitosamente');
        window.openPaySpecific(playerId);
        window.renderFinances();
    } catch (e) {
        window.showToast('Error al registrar abono', true);
    }
};

window.forgiveSpecificDebt = function(playerId, debtId, amount) {
    if (!window.isAdmin) return window.showToast('Solo Lectura', true);
    window.showConfirm('¿Anular esta deuda permanentemente?', async () => {
        const batch = db.batch();
        try {
            if (debtId.startsWith('arb_')) {
                const parentId = debtId.slice(4);
                const arbTx = (window.finances || []).find(x => x && x.id === parentId);
                if (arbTx) batch.set(db.collection(window.financesPath).doc(parentId), { paidBy: [...new Set([...(arbTx.paidBy || []), playerId])] }, { merge: true });
            } else {
                const tx = (window.finances || []).find(x => x && x.id === debtId);
                if (tx) {
                    const abonos = (window.finances || []).filter(x => x && x.category === 'Abono a Deuda (Jugador)' && x.specificDebtId === debtId);
                    const abonado = abonos.reduce((s, x) => s + (parseFloat(x.amount) || 0), 0);
                    if (abonado > 0.01) {
                        batch.set(db.collection(window.financesPath).doc(debtId), { isPaid: true, amount: Number(abonado.toFixed(2)), description: `${tx.description || tx.category} (Resto condonado)` }, { merge: true });
                    } else {
                        batch.delete(db.collection(window.financesPath).doc(debtId));
                    }
                }
            }
            await batch.commit();
            window.showToast('Deuda anulada');
            window.openPaySpecific(playerId);
            window.renderFinances();
        } catch (e) {
            window.showToast('Error al anular', true);
        }
    });
};
window.downloadReceiptFromTx = function(txId) {
const tx = window.finances.find(t => t.id === txId) || window._lastPaidTx;
if (!tx || !tx.playerId) return window.showToast('Solo aplica para cobros a jugadores', true);
const p = window.players.find(x => x.id === tx.playerId); if (!p) return;
const dateStr = new Date(tx.date+'T12:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase();
document.getElementById('receipt-player').textContent = p.name;
document.getElementById('receipt-concept').textContent = tx.description || tx.category;
document.getElementById('receipt-amount').textContent = `$${tx.amount.toFixed(2)}`;
document.getElementById('receipt-date').textContent = `FECHA: ${dateStr}`;
document.getElementById('receipt-id').textContent = `REF: ${tx.id.substring(0,8).toUpperCase()}`;
const node = document.getElementById('receipt-template'); node.style.left = '0px'; node.style.zIndex = '-50'; window.showToast('Generando recibo...');
setTimeout(() => {
html2canvas(node, { backgroundColor: null, scale: 3, useCORS: true }).then(cv => {
const a = document.createElement('a'); a.download = `Recibo_NISUS_${(p.name||'').replace(/\s+/g, '_')}_${dateStr.replace(/\s+/g, '')}.png`;
a.href = cv.toDataURL('image/png'); a.click(); node.style.left = '-9999px';
}).catch(e => { node.style.left = '-9999px'; window.showToast('Error al generar', true); });
}, 500);
};
window.renderMonthlyDues = function() {
const grid = document.getElementById('monthly-dues-grid'); if (!grid) return;
const monthInput = document.getElementById('dues-month'); if (monthInput && !monthInput.value) monthInput.value = new Date().toISOString().slice(0, 7);
const month = monthInput ? monthInput.value : new Date().toISOString().slice(0, 7);
const amountInput = document.getElementById('dues-amount'), amount = amountInput ? (parseFloat(amountInput.value) || 0) : 0;
const activePlayers = window.players.filter(p => !p.isStaff && (p.status === 'active' || !p.status)).sort((a,b) => (a.name||'').localeCompare(b.name||''));
grid.innerHTML = ''; if (activePlayers.length === 0) { grid.innerHTML = '<p class="col-span-full text-center text-sm text-slate-500 py-6">No hay jugadores en el plantel</p>'; return; }
activePlayers.forEach(p => {
const tx = window.finances.find(t => t.category === 'Cuota Mensual' && t.duesMonth === month && t.playerId === p.id), paid = tx && tx.isPaid;
const img = p.image ? `<img src="${p.image}" class="w-9 h-9 rounded-full object-cover">` : `<div class="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-900/50 text-brand-600 font-black flex items-center justify-center text-xs">${(p.name || '?').charAt(0).toUpperCase()}</div>`;
let statusBadge;
if (paid) { statusBadge = '<span class="text-[10px] font-black text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded uppercase">Pagada</span>'; }
else if (tx) { statusBadge = '<span class="text-[10px] font-black text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 rounded uppercase">Pendiente</span>'; }
else { statusBadge = `<label class="flex items-center gap-1.5 cursor-pointer bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded w-fit border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition"><input type="checkbox" class="dues-charge-cb rounded text-brand-600 w-3.5 h-3.5 cursor-pointer bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600" value="${p.id}" checked><span class="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">Cobrar</span></label>`; }
let actionBtn = '';
if (tx) {
let btnPagar = !paid ? `<button onclick="window.markDuesPaid('${tx.id}','${p.id}')" class="admin-only bg-green-500 hover:bg-green-600 text-white px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition flex items-center gap-1 shadow-sm"><i class="fas fa-check"></i> Pagada</button>` : '';
actionBtn = `<div class="flex items-center justify-end gap-1.5">${btnPagar}<button onclick="window.deleteTransaction('${tx.id}')" class="admin-only bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 w-8 h-8 rounded-lg text-sm font-bold transition flex items-center justify-center border border-red-100 dark:border-red-800/30 shadow-sm" title="Anular cobro"><i class="fas fa-trash-alt"></i></button></div>`;
}
grid.innerHTML += `<div class="flex items-center justify-between gap-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-800"><div class="flex items-center gap-2.5 min-w-0"><div class="shrink-0">${img}</div><div class="min-w-0"><p class="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">${p.name}</p><div class="mt-0.5">${statusBadge}</div></div></div><div class="shrink-0">${actionBtn}</div></div>`;
});
const summaryEl = document.getElementById('dues-summary');
if (summaryEl) {
const charged = activePlayers.filter(p => window.finances.find(t => t.category === 'Cuota Mensual' && t.duesMonth === month && t.playerId === p.id)).length;
const paidCount = activePlayers.filter(p => { const t = window.finances.find(t => t.category === 'Cuota Mensual' && t.duesMonth === month && t.playerId === p.id); return t && t.isPaid; }).length;
summaryEl.textContent = `${paidCount}/${activePlayers.length} pagadas · ${charged} cobradas`;
}
};
window.chargeMonthlyDues = async function() {
    if (!window.isAdmin) return window.showToast('Solo Lectura', true);
    const month = document.getElementById('dues-month').value, amount = parseFloat(document.getElementById('dues-amount').value);
    const dueDate = document.getElementById('dues-due-date')?.value || '';
    if (!month) return window.showToast('Selecciona un mes', true); if (!amount || amount <= 0) return window.showToast('Ingresa un monto válido', true);
    const checkboxes = document.querySelectorAll('.dues-charge-cb:checked'); if (checkboxes.length === 0) return window.showToast('Selecciona al menos un jugador para cobrar', true);
    const toChargeIds = Array.from(checkboxes).map(cb => cb.value), toCharge = window.players.filter(p => toChargeIds.includes(p.id));
    const batch = db.batch(), dateStr = month + '-01';
    toCharge.forEach(p => {
        const id = window.generateId();
        batch.set(db.collection(window.financesPath).doc(id), { id, type: 'income', amount, date: dateStr, dueDate, rateMode: 'usd', category: 'Cuota Mensual', description: 'Cuota mensual ' + month, playerId: p.id, duesMonth: month, isPaid: false });
        batch.set(db.collection(window.playersPath).doc(p.id), { debtAmount: (p.debtAmount || 0) + amount, isPaidUp: false }, { merge: true });
    });
    try { await batch.commit(); window.showToast(`Cuotas generadas para ${toCharge.length} jugador(es)`); } catch(e) { window.showToast('Error al cobrar', true); }
};

window.updateMonthlyDuesDeadline = async function() {
    if (!window.isAdmin) return window.showToast('Solo Lectura', true);
    const month = document.getElementById('dues-month')?.value;
    const dueDate = document.getElementById('dues-due-date')?.value || '';
    if (!month || !dueDate) return window.showToast('Selecciona el mes y la fecha límite', true);
    const targets = (window.finances || []).filter(t => t && t.category === 'Cuota Mensual' && t.duesMonth === month);
    if (targets.length === 0) return window.showToast('No hay cuotas generadas para ese mes todavía', true);
    const batch = db.batch();
    targets.forEach(t => batch.set(db.collection(window.financesPath).doc(t.id), { dueDate, rateMode: 'usd' }, { merge: true }));
    try {
        await batch.commit();
        window.showToast(`Fecha límite actualizada (${dueDate}) para ${targets.length} cuota(s)`);
    } catch (e) {
        window.showToast('Error al actualizar fecha límite', true);
    }
};
window.markDuesPaid = async function(txId, playerId) {
    if (!window.isAdmin) return window.showToast('Solo Lectura', true);
    const tx = (window.finances || []).find(t => t && t.id === txId);
    if (!tx) return;
    const abonos = (window.finances || []).filter(x => x && x.category === 'Abono a Deuda (Jugador)' && x.specificDebtId === txId);
    const abonado = abonos.reduce((s, x) => s + (parseFloat(x.amount) || 0), 0);
    const batch = db.batch();
    if (abonado > 0.01) {
        const rest = Math.max(0, (parseFloat(tx.amount) || 0) - abonado);
        if (rest > 0.01) {
            const finId = window.generateId();
            batch.set(db.collection(window.financesPath).doc(finId), {
                id: finId, type: 'income', amount: Number(rest.toFixed(2)), date: new Date().toISOString().split('T')[0], category: 'Abono a Deuda (Jugador)', description: `Saldo cuota mensual ${tx.duesMonth || ''}`.trim(), playerId, specificDebtId: txId
            });
        }
    }
    batch.set(db.collection(window.financesPath).doc(txId), { isPaid: true }, { merge: true });
    try {
        await batch.commit();
        window.showToast('Cuota marcada como pagada');
    } catch (e) {
        window.showToast('Error', true);
    }
};
window.cashflowCharts = [];
window.renderCashflowChart = function() {
if (typeof Chart === 'undefined') { setTimeout(window.renderCashflowChart, 300); return; }
if (window.cashflowCharts.length > 0) { window.cashflowCharts.forEach(c => c.destroy()); }
window.cashflowCharts = [];
const now = new Date(); const labels = [], incomeData = [], expenseData = [];
for (let i = 5; i >= 0; i--) {
const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
const ym = d.toISOString().slice(0, 7);
const monthLabel = d.toLocaleDateString('es-ES', { month: 'short' });
labels.push(monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1));
let inc = 0, exp = 0;
window.finances.forEach(t => {
const tMonth = (t.date || '').slice(0, 7);
if (tMonth === ym) { if (t.type === 'income') inc += window.getValidCashAmount(t); else if (t.type === 'expense') exp += window.getValidCashAmount(t); }
});
incomeData.push(inc); expenseData.push(exp);
}
const isDark = document.documentElement.classList.contains('dark');
const textColor = isDark ? '#94a3b8' : '#64748b', gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
const chartConfig = { type: 'bar', data: { labels, datasets: [{ label: 'Ingresos reales', data: incomeData, backgroundColor: '#22c55e', borderRadius: 6 }, { label: 'Egresos', data: expenseData, backgroundColor: '#ef4444', borderRadius: 6 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: textColor, font: {size: 10, weight: 'bold'} } } }, scales: { y: { beginAtZero: true, grid: { color: gridColor }, ticks: {color: textColor} }, x: { grid: { display: false }, ticks: {color: textColor} } } } };
['cashflow-chart-dash', 'cashflow-chart-fin'].forEach(id => { const canvas = document.getElementById(id); if (canvas) window.cashflowCharts.push(new Chart(canvas, chartConfig)); });
};
window.donutCharts = [];
window.renderExpensesDonutChart = function() {
if (typeof Chart === 'undefined') { setTimeout(window.renderExpensesDonutChart, 300); return; }
if (window.donutCharts.length > 0) { window.donutCharts.forEach(c => c.destroy()); }
window.donutCharts = [];
const expenseCategories = {};
window.finances.forEach(t => { if (t.type === 'expense') { const amt = window.getValidCashAmount(t); if (amt > 0) expenseCategories[t.category] = (expenseCategories[t.category] || 0) + amt; } });
const labels = Object.keys(expenseCategories), data = Object.values(expenseCategories);
const bgColors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'];
const isDark = document.documentElement.classList.contains('dark'), textColor = isDark ? '#94a3b8' : '#64748b';
const chartConfig = { type: 'doughnut', data: { labels: labels.length ? labels : ['Sin egresos registrados'], datasets: [{ data: data.length ? data : [1], backgroundColor: data.length ? bgColors : [isDark ? '#334155' : '#e2e8f0'], borderWidth: 0, hoverOffset: 6 }] }, options: { responsive: true, maintainAspectRatio: false, cutout: '75%', plugins: { legend: { position: 'bottom', labels: { color: textColor, font: {size: 10, weight: 'bold'}, boxWidth: 12 } } } } };
['expenses-donut-chart-dash', 'expenses-donut-chart-fin'].forEach(id => { const canvas = document.getElementById(id); if (canvas) window.donutCharts.push(new Chart(canvas, chartConfig)); });
};
window.renderMatches = function() {
if (typeof window.renderMatchesTicker === 'function') window.renderMatchesTicker();
const grid = document.getElementById('matches-grid'); if(!grid) return; grid.innerHTML = '';
let list = (window.matches || []).filter(m => m && m.status !== 'archived'); if(window.currentFilter !== 'all') list = list.filter(m => m.modality === window.currentFilter); if(window.currentSeason !== 'all') list = list.filter(m => m.season === window.currentSeason);
list.sort((a,b) => new Date(b.date) - new Date(a.date));
if(list.length === 0) { grid.innerHTML = '<div class="col-span-full text-center py-10 text-slate-500 bg-white dark:bg-darkcard rounded-2xl border border-slate-200 dark:border-slate-800">No hay partidos registrados</div>'; return; }
list.forEach(m => {
const dStr = new Date(m.date+'T12:00:00').toLocaleDateString('es-ES', { weekday:'short', day:'numeric', month:'short' }); const isF11 = m.modality === 'f11';
const tBadge = `<span class="text-[9px] font-black px-2 py-1 rounded-lg shadow-sm ${isF11?'bg-blue-500 text-white':'bg-green-500 text-white'}">F${isF11?11:7}</span> <span class="text-[9px] font-bold px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 ml-1"><i class="fas fa-trophy mr-1 text-slate-400"></i>${m.tournament||'Amistoso'}</span>`;
const sBadge = m.season ? `<span class="text-[9px] font-bold px-2 py-1 rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 ml-1">T.${m.season}</span>` : '';
const kBadge = m.kit==='white_blue' ? `<span class="text-[9px] font-bold px-2 py-1 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm ml-1"><i class="fas fa-tshirt text-blue-500"></i> B/A</span>` : `<span class="text-[9px] font-bold px-2 py-1 rounded-lg bg-slate-900 text-white shadow-sm ml-1"><i class="fas fa-tshirt text-slate-400"></i> Negra</span>`;
let stat='', scor='', btn='', resBorder='';
if(m.status==='pending') { stat=`<span class="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-500 text-[10px] font-black tracking-widest uppercase px-2 py-1 rounded-lg"><i class="far fa-clock mr-1"></i>Por Jugar</span>`; scor=`<div class="text-3xl font-black text-slate-200 dark:text-slate-800 italic">VS</div>`; }
else if (m.status==='forfait') { stat=`<span class="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-[10px] font-black tracking-widest uppercase px-2 py-1 rounded-lg"><i class="fas fa-gavel mr-1"></i>Forfait</span>`; scor=`<div class="flex items-center gap-4"><span class="text-4xl font-black text-green-500">3</span><span class="text-slate-300 dark:text-slate-700 font-bold">-</span><span class="text-4xl font-black text-slate-800 dark:text-slate-400">0</span></div>`; resBorder='border-green-300 dark:border-green-700/50 bg-green-50/50 dark:bg-green-900/10'; btn=`<button onclick="window.exportMatchResult('${m.id}')" class="mt-2 w-full py-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-xl text-xs font-bold transition flex justify-center items-center gap-2"><i class="fas fa-share-alt"></i> Compartir Resultado</button>`; }
else { stat=`<span class="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-black tracking-widest uppercase px-2 py-1 rounded-lg"><i class="fas fa-check mr-1"></i>Final</span>`; let col = 'text-slate-500'; const usI=parseInt(m.goalsUs), thI=parseInt(m.goalsThem); if(usI>thI){ col='text-green-500'; resBorder='border-green-300 dark:border-green-700/50 bg-green-50/50 dark:bg-green-900/10'; } else if(usI<thI){ col='text-red-500'; resBorder='border-red-300 dark:border-red-700/50 bg-red-50/50 dark:bg-red-900/10'; } else { col='text-amber-500'; resBorder='border-amber-300 dark:border-amber-700/50 bg-amber-50/50 dark:bg-amber-900/10'; } scor=`<div class="flex items-center gap-4"><span class="text-4xl font-black ${col}">${m.goalsUs}</span><span class="text-slate-300 dark:text-slate-700 font-bold">-</span><span class="text-4xl font-black text-slate-800 dark:text-slate-200">${m.goalsThem}</span></div>`; btn=`<button onclick="window.exportMatchResult('${m.id}')" class="mt-2 w-full py-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-xl text-xs font-bold transition flex justify-center items-center gap-2"><i class="fas fa-share-alt"></i> Compartir Resultado</button>`; }
let evs='';
if(m.events && m.events.length>0 && m.status !== 'forfait') {
const g = m.events.filter(e=>['goals','penalty','freekick'].includes(e.type));
if(g.length>0) evs += `<p class="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-3 text-center"><i class="fas fa-futbol text-green-500 mr-1"></i> ` + g.map(x=>{ const p = window.players.find(y=>y.id===x.playerId); return (p?(p.name||'').split(' ')[0]:'?') + (x.type==='penalty'?' 🎯':x.type==='freekick'?' 👟':''); }).join(', ') + `</p>`;
}
if(m.status==='finished'&&m.mvp) { const p=window.players.find(x=>x.id===m.mvp); if(p) evs+=`<p class="text-[10px] font-black tracking-widest uppercase text-yellow-600 dark:text-yellow-500 mt-2 text-center bg-yellow-50 dark:bg-yellow-900/10 inline-block px-3 py-1 rounded-full"><i class="fas fa-star mr-1"></i>MVP: ${(p.name||'').split(' ')[0]}</p>`; }
let loc=''; if(m.location) loc=m.location.startsWith('http')?`<a href="${m.location}" target="_blank" class="text-brand-500 hover:underline flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-widest mt-1"><i class="fas fa-map-marker-alt"></i> Ver Mapa</a>`:`<p class="text-slate-400 flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-widest mt-1"><i class="fas fa-map-marker-alt"></i> ${m.location.substring(0,25)}</p>`;
let nS='#ffffff', nA='#0284c7', nSh='#111827', nSo='#111827', nAc2='#111827'; if (m.kit === 'black') { nS='#050505'; nA='#050505'; nAc2=null; nSh='#050505'; nSo='#050505'; }
grid.innerHTML += `
<div class="bg-white dark:bg-darkcard rounded-2xl shadow-soft dark:shadow-soft-dark border border-slate-200 dark:border-slate-800 p-6 flex flex-col transition-all hover:-translate-y-1 hover:shadow-lg">
<div class="flex justify-between items-start mb-5"><div class="flex flex-wrap items-center gap-1">${stat} ${tBadge} ${sBadge} ${kBadge}</div><div class="admin-only flex gap-2"><button onclick="window.editMatch('${m.id}')" class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-brand-500 hover:bg-brand-50 hover:text-brand-600 transition"><i class="fas fa-edit"></i></button><button onclick="window.deleteMatch('${m.id}')" class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-red-400 hover:bg-red-50 hover:text-red-500 transition"><i class="fas fa-trash"></i></button></div></div>
<div class="flex flex-col items-center justify-center py-4 mb-4 border-y border-slate-100 dark:border-slate-800 ${resBorder}">
<div class="text-center mb-5"><p class="text-[11px] text-slate-500 font-black tracking-widest uppercase">${dStr}</p>${loc}</div>
<div class="flex items-center justify-between w-full">
<div class="text-center w-1/3 flex flex-col items-center"><div class="w-12 h-16 mb-2">${window.generateKitSVG(nS,nA,nSh,nSo,nAc2)}</div><p class="font-black text-slate-900 dark:text-white text-[10px] uppercase tracking-widest">NISUS</p></div>
<div class="w-1/3 flex justify-center">${scor}</div>
<div class="text-center w-1/3 flex flex-col items-center"><div class="w-12 h-16 mb-2">${window.generateKitSVG(m.oppColor||'#ff0000', m.oppColor||'#ff0000', m.oppShorts||m.oppColor||'#ff0000', m.oppSocks||m.oppColor||'#ff0000')}</div><p class="font-black text-slate-900 dark:text-white text-[10px] uppercase tracking-widest truncate w-full" title="${m.opponent}">${m.opponent}</p></div>
</div>
<div class="text-center mt-2">${evs}</div>
</div>
${btn}<button onclick="window.editMatch('${m.id}')" class="mt-2 w-full py-2.5 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition flex justify-center items-center gap-2 border border-slate-200 dark:border-slate-700"><i class="fas fa-list-ul"></i> Detalles</button>
</div>`;
});
};
window.renderBirthdaysAvailability = function() {
const allPlayers = (window.players || []).filter(p => p && !p.isStaff);
const bEl = document.getElementById('birthdays-strip');
if(bEl) {
    const today = new Date(); today.setHours(0,0,0,0); const ty = today.getFullYear();
    const upcoming = allPlayers.filter(p => p.birthdate && typeof p.birthdate === 'string' && p.birthdate.includes('-')).map(p => {
        const parts = p.birthdate.split('-'); const bm = parseInt(parts[1])-1, bd = parseInt(parts[2]);
        let next = new Date(ty, bm, bd);
        if (next < today) next = new Date(ty+1, bm, bd);
        const dCalc = Math.round((next - today) / (1000*60*60*24));
        return { p, dCalc, next };
    }).sort((a,b) => a.dCalc - b.dCalc).slice(0, 8);

    if (upcoming.length === 0) {
        bEl.innerHTML = '<span class="px-4 text-xs text-slate-400 italic font-medium">Sin fechas de nacimiento registradas en el plantel</span>';
    } else {
        const items = upcoming.map(item => {
            const validName = (typeof item.p.name === 'string' && item.p.name.trim() !== '') ? item.p.name.trim() : 'Jugador';
            const dStr = item.next.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
            const tag = item.dCalc === 0
                ? `<span class="bg-pink-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase animate-pulse">🎉 ¡Hoy!</span>`
                : `<span class="text-[10px] font-bold text-slate-400">(en ${item.dCalc}d)</span>`;
            return `<div onclick="window.openPlayerProfile('${item.p.id}')" class="inline-flex items-center gap-2 px-5 text-xs cursor-pointer hover:opacity-75 transition"><span>🎂</span><span class="font-bold text-slate-800 dark:text-slate-200">${validName}</span><span class="font-black text-pink-500">${dStr}</span>${tag}<span class="text-slate-300 dark:text-slate-700 ml-3">•</span></div>`;
        });
        bEl.innerHTML = window.buildSmoothTicker(items, 4);
    }
}
const aEl = document.getElementById('availability-strip');
if(aEl) {
    const statusMap = {
        injured: { lbl:'Lesión', icon:'fa-briefcase-medical', col:'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/50' },
        suspended: { lbl:'Sanción', icon:'fa-gavel', col:'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800/50' },
        absent: { lbl:'Ausente', icon:'fa-plane', col:'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600' }
    };
    const inactiveCount = allPlayers.filter(p => p.status === 'inactive').length;
    const otherUnavailable = allPlayers.filter(p => p.status && p.status !== 'active' && p.status !== 'inactive');
    const activeCount = allPlayers.length - inactiveCount - otherUnavailable.length;

    aEl.innerHTML = `<div class="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-3 py-2 rounded-xl border border-green-200 dark:border-green-800/50 font-bold text-xs"><i class="fas fa-check-circle"></i> ${activeCount} disponibles</div>`;

    if (inactiveCount > 0) {
        aEl.innerHTML += `<div onclick="document.getElementById('player-position-filter').value='inactive'; window.renderPlayers();" class="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs cursor-pointer hover:opacity-80 transition" title="Ver jugadores inactivos"><i class="fas fa-pause-circle"></i> ${inactiveCount} ${inactiveCount === 1 ? 'inactivo' : 'inactivos'}</div>`;
    }

    if (otherUnavailable.length === 0 && inactiveCount === 0) {
        aEl.innerHTML += `<p class="text-sm text-slate-500 dark:text-slate-400 italic font-medium self-center">Plantel completo</p>`;
    } else {
        otherUnavailable.sort((a,b) => (a.name||'').localeCompare(b.name||'')).forEach(p => {
            const validName = (typeof p.name === 'string' && p.name.trim() !== '') ? p.name.trim() : '?';
            const s = statusMap[p.status] || statusMap.absent;
            const ret = p.returnDate && typeof p.returnDate === 'string' && p.returnDate.includes('-') ? ` <span class="opacity-70">· hasta ${p.returnDate.split('-').reverse().join('/')}</span>` : '';
            aEl.innerHTML += `<div class="flex items-center gap-1.5 ${s.col} px-3 py-2 rounded-xl border font-bold text-xs"><i class="fas ${s.icon}"></i> ${validName} <span class="opacity-70 font-medium">${s.lbl}</span>${ret}</div>`;
        });
    }
}
};
window.updateDashboard = function() {
let list = window.matches; if(window.currentFilter !== 'all') list = list.filter(m => m.modality === window.currentFilter); if(window.currentSeason !== 'all') list = list.filter(m => m.season === window.currentSeason);
list.sort((a,b) => new Date(b.date) - new Date(a.date));
const nx = list.filter(m => m.status === 'pending').sort((a,b) => new Date(a.date) - new Date(b.date))[0];
const btn = document.getElementById('btn-tactics-next');
if (nx) {
document.getElementById('next-match-vs').textContent = nx.opponent;
let loc=''; if(nx.location) loc=nx.location.startsWith('http')?`<a href="${nx.location}" target="_blank" class="text-white hover:text-brand-100 flex items-center justify-center gap-1 mt-2 text-xs bg-white/10 px-3 py-1 rounded-full w-fit mx-auto"><i class="fas fa-map-marker-alt"></i> Mapa</a>`:`<p class="text-brand-100/70 flex items-center justify-center gap-1 mt-2 text-[10px] uppercase tracking-widest"><i class="fas fa-map-marker-alt"></i> ${nx.location}</p>`;
document.getElementById('next-match-date').innerHTML = new Date(nx.date+'T12:00:00').toLocaleDateString('es-ES', {weekday:'long',day:'numeric',month:'long'}) + loc;
document.getElementById('next-match-type').innerHTML = `<i class="fas fa-trophy mr-1"></i> ${nx.tournament}`;
btn.classList.remove('hidden'); btn.onclick = () => window.editMatch(nx.id);
} else { document.getElementById('next-match-vs').textContent = "Sin partidos"; document.getElementById('next-match-date').textContent = "Programa un encuentro"; document.getElementById('next-match-type').innerHTML = `-`; btn.classList.add('hidden'); }
const fin = list.filter(m => ['finished', 'forfait', 'archived'].includes(m.status)).slice(0, 3); const rD = document.getElementById('latest-results');
if(rD) {
rD.innerHTML = '';
if(fin.length===0) rD.innerHTML='<p class="text-sm text-slate-500 dark:text-slate-400 italic font-medium">No hay resultados.</p>';
else fin.forEach(m => {
let rC='E', col='bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'; if(parseInt(m.goalsUs)>parseInt(m.goalsThem)){rC='V'; col='bg-green-500 text-white shadow-sm shadow-green-500/30';} else if(parseInt(m.goalsUs)<parseInt(m.goalsThem)){rC='D'; col='bg-red-500 text-white shadow-sm shadow-red-500/30';}
rD.innerHTML += `<div class="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer border border-slate-100 dark:border-slate-800 transition" onclick="window.editMatch('${m.id}')"><div class="flex items-center gap-3"><span class="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${col}">${rC}</span><span class="text-xs font-bold text-slate-800 dark:text-slate-200">vs ${m.opponent} <span class="text-[8px] font-black px-1.5 py-0.5 rounded shadow-sm ml-1 ${m.modality==='f11'?'bg-blue-500 text-white':'bg-green-500 text-white'}">F${m.modality==='f11'?11:7}</span></span></div><span class="font-black text-slate-900 dark:text-white text-base">${m.goalsUs} - ${m.goalsThem}</span></div>`;
});
}
if (typeof window.renderBirthdaysAvailability === 'function') {
window.renderBirthdaysAvailability();
}
let tG=0, tA=0, pL = (window.players || []).filter(p => p && !p.isStaff && (p.status === 'active' || !p.status));
if(window.currentFilter==='f11') pL = pL.filter(p=>p.availableF11);
if(window.currentFilter==='f7') pL = pL.filter(p=>p.availableF7);
let aG = 0; list.forEach(m => { if(m.status === 'forfait') aG += 3; });
pL.forEach(p => { tG += window.getPlayerStat(p, 'goals'); tA += window.getPlayerStat(p, 'assists'); });
const eTG = document.getElementById('stat-total-goals'); if(eTG) eTG.textContent = tG + aG;
const eTA = document.getElementById('stat-total-assists'); if(eTA) eTA.textContent = tA;
let tCS=0, maxGames=0, ironMan="--";
pL.forEach(p => {
const g = window.getPlayerStat(p, 'games');
if(g > maxGames) { maxGames = g; ironMan = (p.showAlias && p.alias) ? p.alias : (p.name || 'N/A').split(' ')[0]; }
tCS += window.getPlayerStat(p, 'cleanSheets');
});
const eTGm = document.getElementById('stat-total-games');
if(eTGm) { if(eTGm.previousElementSibling) eTGm.previousElementSibling.textContent = "MÁS PARTIDOS (JUGADOR)"; eTGm.innerHTML = `${maxGames} <span class="text-sm font-bold text-brand-500 ml-1 truncate">${ironMan}</span>`; }
const eTCS = document.getElementById('stat-total-cleansheets'); if(eTCS) eTCS.textContent = tCS;
const rL = (arr, k, el) => {
const d = document.getElementById(el); if(!d)return; d.innerHTML='';
arr.forEach((p,i) => {
const v = window.getPlayerStat(p, k); if(v===0)return;
const validName = (typeof p.name === 'string' && p.name.trim() !== '') ? p.name.trim() : '?';
const img = p.image?`<img src="${p.image}" class="w-8 h-8 rounded-full object-cover shadow-sm">`:`<div class="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/50 text-brand-600 font-black flex items-center justify-center text-xs shadow-sm">${validName.charAt(0).toUpperCase()}</div>`;
d.innerHTML+=`<tr class="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition"><td class="px-6 py-3 w-10 text-slate-400 font-black">${i+1}</td><td class="px-6 py-3 flex items-center gap-3">${img} <span class="font-bold text-xs text-slate-800 dark:text-slate-200">${validName}</span></td><td class="px-6 py-3 text-right font-black text-lg text-slate-900 dark:text-white">${v}</td></tr>`;
});
if(d.innerHTML==='') d.innerHTML='<tr><td colspan="3" class="px-6 py-5 text-center text-sm text-slate-500 font-medium">Sin registros</td></tr>';
};
rL([...pL].sort((a,b)=>window.getPlayerStat(b, 'goals')-window.getPlayerStat(a, 'goals')).slice(0,4), 'goals', 'top-scorers-list');
rL([...pL].sort((a,b)=>window.getPlayerStat(b, 'assists')-window.getPlayerStat(a, 'assists')).slice(0,4), 'assists', 'top-assists-list');
rL([...pL].sort((a,b)=>window.getPlayerStat(b, 'goals')-window.getPlayerStat(a, 'goals')).slice(0,5), 'goals', 'stats-scorers-list');
rL([...pL].sort((a,b)=>window.getPlayerStat(b, 'assists')-window.getPlayerStat(a, 'assists')).slice(0,5), 'assists', 'stats-assists-list');
rL([...pL].sort((a,b)=>window.getPlayerStat(b, 'games')-window.getPlayerStat(a, 'games')).slice(0,5), 'games', 'stats-games-list');
let w=0, d=0, l=0, gf=0, ga=0;
list.forEach(m => {
if(['finished', 'forfait', 'archived'].includes(m.status)){
if(m.status==='forfait'){ w++; gf+=3; return; }
const us=parseInt(m.goalsUs)||0, them=parseInt(m.goalsThem)||0; gf+=us; ga+=them;
if(us>them)w++; else if(us<them)l++; else d++;
}
});
const total=w+d+l;
const eW=document.getElementById('perf-wins'),eD=document.getElementById('perf-draws'),eL=document.getElementById('perf-losses');
if(eW)eW.textContent=w; if(eD)eD.textContent=d; if(eL)eL.textContent=l;
const eGF=document.getElementById('perf-gf'),eGA=document.getElementById('perf-ga'),ePP=document.getElementById('perf-played'),ePT=document.getElementById('perf-points');
if(eGF)eGF.textContent=gf; if(eGA)eGA.textContent=ga; if(ePP)ePP.textContent=total; if(ePT)ePT.textContent=(w*3+d);
const donut=document.getElementById('perf-donut');
if(donut){
const wDeg=total>0?(w/total)*360:0, dDeg=total>0?(d/total)*360:0, lDeg=total>0?(l/total)*360:0;
donut.style.background=`conic-gradient(#10b981 0deg ${wDeg}deg, #64748b ${wDeg}deg ${wDeg+dDeg}deg, #ef4444 ${wDeg+dDeg}deg ${wDeg+dDeg+lDeg}deg, #e2e8f0 ${wDeg+dDeg+lDeg}deg 360deg)`;
const ePct=document.getElementById('perf-win-pct'); if(ePct)ePct.textContent=total>0?Math.round((w/total)*100)+'%':'0%';
}
const formEl=document.getElementById('perf-form');
if(formEl){
const recent=list.filter(m=>['finished', 'forfait', 'archived'].includes(m.status)).slice(0,5); formEl.innerHTML='';
if(recent.length===0)formEl.innerHTML='<p class="text-xs text-slate-400 italic">Sin partidos jugados</p>';
else recent.forEach(m=>{
let r='E',col='bg-slate-400 text-white';
if(m.status==='forfait'||parseInt(m.goalsUs)>parseInt(m.goalsThem)){r='V';col='bg-green-500 text-white';}
else if(parseInt(m.goalsUs)<parseInt(m.goalsThem)){r='D';col='bg-red-500 text-white';}
formEl.innerHTML+=`<span class="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black ${col}">${r}</span>`;
});
}
const mvpEl=document.getElementById('mvp-card-content');
if(mvpEl){
const mvpList=[...pL].filter(p=>!p.isStaff).map(p=>{
const g = window.getPlayerStat(p, 'goals'), a = window.getPlayerStat(p, 'assists'), gp = window.getPlayerStat(p, 'games'), m = window.getPlayerStat(p, 'mvps');
return {p, score: g*2 + a + gp + m*3, g, a, gp, m};
}).sort((x,y)=>y.score-x.score);
if(mvpList.length>0&&mvpList[0].score>0){
const t=mvpList[0];
const validName = (typeof t.p.name === 'string' && t.p.name.trim() !== '') ? t.p.name.trim() : '?';
const img=t.p.image?`<img src="${t.p.image}" class="w-16 h-16 rounded-full object-cover border-2 border-white/30 shadow-lg">`:`<div class="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-black text-white border-2 border-white/30">${validName.charAt(0).toUpperCase()}</div>`;
const name=t.p.alias&&t.p.showAlias?t.p.alias:validName;
mvpEl.innerHTML=`${img}<div><p class="text-white font-black text-xl leading-tight">${name}</p><p class="text-white/80 text-xs font-bold">${t.p.positions&&t.p.positions.length?t.p.positions[0]:'Jugador'}</p></div>`;
const sEl=document.getElementById('mvp-stats'); if(sEl)sEl.innerHTML=`<div class="bg-white/15 rounded-lg p-2 text-center"><p class="text-white/70 text-[9px] font-bold uppercase">PJ</p><p class="text-white font-black text-lg">${t.gp}</p></div><div class="bg-white/15 rounded-lg p-2 text-center"><p class="text-white/70 text-[9px] font-bold uppercase">Goles</p><p class="text-white font-black text-lg">${t.g}</p></div><div class="bg-white/15 rounded-lg p-2 text-center"><p class="text-white/70 text-[9px] font-bold uppercase">Asis.</p><p class="text-white font-black text-lg">${t.a}</p></div><div class="bg-white/15 rounded-lg p-2 text-center"><p class="text-white/70 text-[9px] font-bold uppercase">MVP</p><p class="text-white font-black text-lg">${t.m}</p></div>`;
} else {
mvpEl.innerHTML=`<div class="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-black text-white border-2 border-white/30"><i class="fas fa-trophy"></i></div><div><p class="text-white font-black text-xl leading-tight">Sin datos</p><p class="text-white/80 text-xs font-bold">Registra partidos</p></div>`;
const sEl=document.getElementById('mvp-stats'); if(sEl)sEl.innerHTML='';
}
}
const rankEl=document.getElementById('attendance-ranking');
if(rankEl){
const totalTrainings=window.trainings?window.trainings.length:0;
if(totalTrainings===0){ rankEl.innerHTML='<p class="text-sm text-slate-500 italic text-center py-6">No hay sesiones registradas</p>'; }
else {
const ranked=[...pL].filter(p=>!p.isStaff).map(p=>{ const attended=window.trainings.filter(t=>t.attendees&&t.attendees.includes(p.id)).length; return {p,attended,pct:Math.round((attended/totalTrainings)*100)}; }).sort((a,b)=>b.pct-a.pct||b.attended-a.attended).slice(0,5);
rankEl.innerHTML=ranked.map((r,i)=>{
const validName = (typeof r.p.name === 'string' && r.p.name.trim() !== '') ? r.p.name.trim() : '?';
const img=r.p.image?`<img src="${r.p.image}" class="w-9 h-9 rounded-full object-cover">`:`<div class="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-900/50 text-brand-600 font-black flex items-center justify-center text-xs">${validName.charAt(0).toUpperCase()}</div>`;
const barColor=r.pct>=75?'bg-green-500':r.pct>=50?'bg-yellow-500':'bg-red-500';
const medal=i===0?'text-yellow-500':i===1?'text-slate-400':i===2?'text-orange-400':'text-slate-300';
return `<div class="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900/50 transition"><span class="w-5 text-center font-black ${medal}"><i class="fas ${i<3?'fa-medal':'fa-hashtag'} text-sm"></i></span>${img}<div class="flex-1 min-w-0"><div class="flex justify-between items-center mb-1"><span class="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">${validName}</span><span class="text-[10px] font-black text-slate-500 ml-2">${r.attended}/${totalTrainings}</span></div><div class="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"><div class="${barColor} h-full rounded-full transition-all" style="width:${r.pct}%"></div></div></div><span class="font-black text-sm ${r.pct>=75?'text-green-600':r.pct>=50?'text-yellow-600':'text-red-600'}">${r.pct}%</span></div>`;
}).join('');
}
}
setTimeout(() => {
    if (typeof window.renderCashflowChart === 'function') window.renderCashflowChart();
    if (typeof window.renderExpensesDonutChart === 'function') window.renderExpensesDonutChart();
    if (typeof window.initComparatorSelects === 'function') window.initComparatorSelects();
}, 400);
};
window.checkAutoActivations = async function() {
if (!window.isAdmin) return; const t = new Date().toISOString().split('T')[0]; const u = [];
window.players.forEach(p => { if ((p.status === 'injured' || p.status === 'absent' || p.status === 'inactive') && p.returnDate && t >= p.returnDate) u.push(db.collection(window.playersPath).doc(p.id).set({ status: 'active', returnDate: null }, { merge: true })); });
if (u.length > 0) { try { await Promise.all(u); window.showToast(`Se activaron automáticamente ${u.length} jugador(es)`); } catch (e) { console.error(e); } }
};
function debounceRender(func, wait = 150) {
    let timeout;
    return function(...args) { clearTimeout(timeout); timeout = setTimeout(() => func.apply(this, args), wait); };
}
const safeUpdateDashboard = debounceRender(() => { if(!document.getElementById('dashboard').classList.contains('hidden') || !document.getElementById('stats').classList.contains('hidden')) window.updateDashboard(); });
const safeRenderPlayers = debounceRender(() => { if(!document.getElementById('players').classList.contains('hidden')) { window.renderPlayers(); window.renderBirthdaysAvailability(); } });
const safeRenderMatches = debounceRender(() => { if(!document.getElementById('matches').classList.contains('hidden')) { window.renderMatches(); if(typeof window.renderArchivedMatches === 'function') window.renderArchivedMatches(); } });
const safeRenderTrainings = debounceRender(() => { if(!document.getElementById('attendance').classList.contains('hidden')) window.renderTrainings(); });
const safeRenderFinances = debounceRender(() => { if(!document.getElementById('finances').classList.contains('hidden')) window.renderFinances(); });
const safeRenderInventory = debounceRender(() => { if(!document.getElementById('inventory').classList.contains('hidden')) window.renderInventory(); });

function setupRealtimeListeners() {
    const el = document.getElementById('next-match-date');
    if (el) el.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Conectando datos...';

    const sId = window.generateId();
    const pRef = db.collection('sistema').doc('presencia_' + sId);
    setInterval(() => { if(document.visibilityState === 'visible') pRef.set({ lastSeen: Date.now() }).catch(()=>{}); }, 30000);
    pRef.set({ lastSeen: Date.now() }).catch(()=>{});
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') pRef.delete().catch(()=>{}); else pRef.set({ lastSeen: Date.now() }).catch(()=>{}); });
    window.addEventListener('beforeunload', () => pRef.delete().catch(()=>{}));

    db.collection('sistema').onSnapshot((s) => {
        let o = 0; const n = Date.now();
        s.forEach(d => { if(d.id.startsWith('presencia_')) { if (n - d.data().lastSeen < 120000) o++; else d.ref.delete().catch(()=>{}); } });
        const c = document.getElementById('online-count'); if(c) c.textContent = Math.max(1, o);
    });

    const loaded = { p: false, m: false, t: false, f: false, i: false };
    const checkInitialReady = () => {
        if (!window.isReady && loaded.p && loaded.m && loaded.t && loaded.f && loaded.i) {
            window.isReady = true;
            window.updateSeasonDropdown();
            window.checkAutoActivations();
            window.showSection('dashboard');
        }
    };

    db.collection(window.playersPath).onSnapshot((s) => {
        window.players = []; s.forEach(d => window.players.push({ ...d.data(), id: d.id }));
        loaded.p = true;
        if (!window.isReady) { checkInitialReady(); return; }
        window.checkAutoActivations(); safeRenderPlayers(); safeUpdateDashboard(); safeRenderFinances();
        if(!document.getElementById('matchForm').classList.contains('hidden')) window.renderCallupList();
        if(!document.getElementById('attendanceForm').classList.contains('hidden')) window.renderAttendanceChecklist();
    });

    db.collection(window.matchesPath).onSnapshot((s) => {
        window.matches = []; s.forEach(d => window.matches.push({ ...d.data(), id: d.id }));
        loaded.m = true;
        if (!window.isReady) { checkInitialReady(); return; }
        window.updateSeasonDropdown(); safeRenderMatches(); safeUpdateDashboard(); safeRenderPlayers(); safeRenderFinances();
    });

    db.collection(window.trainingsPath).onSnapshot((s) => {
        window.trainings = []; s.forEach(d => window.trainings.push({ ...d.data(), id: d.id }));
        loaded.t = true;
        if (!window.isReady) { checkInitialReady(); return; }
        safeRenderTrainings(); safeRenderPlayers(); safeUpdateDashboard();
    });

    db.collection(window.financesPath).onSnapshot((s) => {
        window.finances = []; s.forEach(d => window.finances.push({ ...d.data(), id: d.id }));
        loaded.f = true;
        if (!window.isReady) { checkInitialReady(); return; }
        safeRenderFinances();
    });

    db.collection(window.inventoryPath).onSnapshot((s) => {
        window.inventory = []; s.forEach(d => window.inventory.push({ ...d.data(), id: d.id }));
        loaded.i = true;
        if (!window.isReady) { checkInitialReady(); return; }
        safeRenderInventory();
    });

    db.collection('pagos_reportados').onSnapshot((s) => {
        window.paymentReports = [];
        s.forEach(d => window.paymentReports.push({ ...d.data(), id: d.id }));
        if (typeof window.renderPendingPaymentReports === 'function') window.renderPendingPaymentReports();
    });
}
window.newInventoryItem = function() {
document.getElementById('inventory-form').reset();
document.getElementById('inv-id').value = '';
window.updateAdminUI(); window.showSection('inventoryForm');
};
window.editInventoryItem = function(id) {
const item = window.inventory.find(x => x.id === id); if(!item) return;
document.getElementById('inv-id').value = item.id;
document.getElementById('inv-name').value = item.name;
document.getElementById('inv-category').value = item.category || 'Balones';
document.getElementById('inv-total').value = item.total || 0;
document.getElementById('inv-lost').value = item.lost || 0;
document.getElementById('inv-notes').value = item.notes || '';
window.updateAdminUI(); window.showSection('inventoryForm');
};
window.saveInventoryItem = async function(e) {
e.preventDefault(); if(!window.isAdmin) return window.showToast('Solo Lectura', true);
const btn = document.getElementById('btn-save-inv'); btn.disabled = true; btn.textContent = "Guardando...";
const id = document.getElementById('inv-id').value || window.generateId();
const data = {
id: id,
name: document.getElementById('inv-name').value,
category: document.getElementById('inv-category').value,
total: parseInt(document.getElementById('inv-total').value) || 0,
lost: parseInt(document.getElementById('inv-lost').value) || 0,
notes: document.getElementById('inv-notes').value,
lastUpdated: new Date().toISOString().split('T')[0]
};
try {
await db.collection(window.inventoryPath).doc(id).set(data);
window.showToast('Material guardado'); window.showSection('inventory');
} catch(err) { window.showToast('Error', true); }
finally { btn.disabled = false; btn.textContent = "Guardar"; }
};
window.deleteInventoryItem = function(id) {
window.showConfirm('¿Eliminar material permanentemente?', async () => {
try { await db.collection(window.inventoryPath).doc(id).delete(); window.showToast('Eliminado'); }
catch(e) { window.showToast('Error', true); }
});
};
window.renderInventory = function() {
const grid = document.getElementById('inventory-grid'); if(!grid) return; grid.innerHTML = '';
const icons = { 'Balones': 'fa-futbol text-slate-800 dark:text-white', 'Petos': 'fa-tshirt text-brand-500', 'Conos': 'fa-exclamation-triangle text-orange-500', 'Médico': 'fa-medkit text-red-500', 'Otro': 'fa-box-open text-slate-500' };
if(window.inventory.length === 0) { grid.innerHTML = '<div class="col-span-full text-center text-slate-500 py-10 bg-white dark:bg-darkcard rounded-2xl border border-slate-200 dark:border-slate-800">No hay utilería registrada</div>'; return; }
window.inventory.sort((a,b) => a.category.localeCompare(b.category)).forEach(i => {
const stock = (i.total || 0) - (i.lost || 0);
const stockColor = stock === 0 ? 'text-red-500' : (stock < (i.total/2) ? 'text-orange-500' : 'text-green-500');
const icon = icons[i.category] || icons['Otro'];
grid.innerHTML += `
<div class="bg-white dark:bg-darkcard rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 relative transition-all hover:shadow-soft">
<div class="admin-only absolute top-4 right-4 flex gap-2">
<button onclick="window.editInventoryItem('${i.id}')" class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-brand-500 hover:bg-brand-50 transition"><i class="fas fa-edit text-xs"></i></button>
<button onclick="window.deleteInventoryItem('${i.id}')" class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-red-400 hover:bg-red-50 transition"><i class="fas fa-trash text-xs"></i></button>
</div>
<div class="flex items-center gap-3 mb-4"><div class="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl"><i class="fas ${icon}"></i></div><div class="pr-12"><h3 class="font-black text-slate-900 dark:text-white leading-tight">${i.name}</h3><p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">${i.category}</p></div></div>
<div class="grid grid-cols-3 gap-2 text-center bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 border border-slate-100 dark:border-slate-800">
<div><p class="text-[9px] font-bold uppercase text-slate-400">Total</p><p class="font-black text-lg text-slate-700 dark:text-slate-300 leading-none mt-1">${i.total}</p></div>
<div class="border-l border-slate-200 dark:border-slate-700"><p class="text-[9px] font-bold uppercase text-slate-400">Pérdida</p><p class="font-black text-lg text-red-500 leading-none mt-1">${i.lost}</p></div>
<div class="border-l border-slate-200 dark:border-slate-700"><p class="text-[9px] font-bold uppercase text-slate-400">Stock</p><p class="font-black text-lg ${stockColor} leading-none mt-1">${stock}</p></div>
</div>
${i.notes ? `<p class="mt-3 text-[11px] font-medium text-slate-500 italic bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">"${i.notes}"</p>` : ''}
</div>`;
});
};
window.exportMatchResult = function(id) {
    const m = (window.matches || []).find(x => x.id === id);
    if (!m) return;
    const container = document.getElementById('result-render-container');
    const modal = document.getElementById('modalMatchResult');
    if (!container || !modal) return;

    const us = m.status === 'forfait' ? 3 : (parseInt(m.goalsUs) || 0);
    const them = m.status === 'forfait' ? 0 : (parseInt(m.goalsThem) || 0);
    const dStr = m.date ? new Date(m.date + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase() : '';
    const scorers = (m.events || []).filter(e => ['goals', 'penalty', 'freekick'].includes(e.type)).map(e => {
        const p = (window.players || []).find(x => x.id === e.playerId);
        return `⚽ ${p ? (p.showAlias && p.alias ? p.alias : p.name.split(' ')[0]) : 'Gol'}${e.minute ? ` (${e.minute}')` : ''}`;
    }).join(' · ');

    container.innerHTML = `
        <div id="match-result-node" class="match-result-export">
            <p class="text-[10px] font-black uppercase tracking-[0.25em] text-brand-200 mb-1">${m.tournament || 'PARTIDO OFICIAL'}</p>
            <p class="text-[9px] font-bold text-white/60 uppercase tracking-widest mb-6">${dStr} · FÚTBOL ${m.modality === 'f7' ? '7' : '11'}</p>
            <div class="flex items-center justify-between w-full px-2 mb-6">
                <div class="flex flex-col items-center w-1/3">
                    <div class="w-16 h-16 rounded-full bg-white p-1 shadow-lg mb-2 flex items-center justify-center overflow-hidden">
                        <img src="escudo.png" class="w-full h-full object-cover" onerror="this.style.display='none'">
                    </div>
                    <span class="font-black text-xs uppercase tracking-wider text-center">NISUS FC</span>
                </div>
                <div class="flex items-center gap-3 w-1/3 justify-center">
                    <span class="text-5xl font-black">${us}</span>
                    <span class="text-2xl font-bold text-white/40">-</span>
                    <span class="text-5xl font-black">${them}</span>
                </div>
                <div class="flex flex-col items-center w-1/3">
                    <div class="w-16 h-16 rounded-full bg-white/15 border-2 border-white/30 shadow-lg mb-2 flex items-center justify-center text-2xl font-black">
                        ${(m.opponent || 'R').charAt(0).toUpperCase()}
                    </div>
                    <span class="font-black text-xs uppercase tracking-wider text-center truncate w-full">${m.opponent || 'Rival'}</span>
                </div>
            </div>
            ${m.status === 'forfait' ? `<p class="text-[10px] font-black uppercase tracking-widest bg-white/15 px-3 py-1 rounded-full">Victoria por Forfait</p>` : ''}
            ${scorers ? `<p class="text-[10px] font-bold text-brand-100 text-center leading-relaxed px-4">${scorers}</p>` : ''}
            <p class="absolute bottom-4 text-[8px] font-black tracking-[0.3em] text-white/40 uppercase">RESULTADO FINAL · NISUS FC</p>
        </div>`;

    modal.classList.remove('hidden');
    document.getElementById('btn-download-result').onclick = function() {
        const node = document.getElementById('match-result-node');
        const btn = this;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generando...';
        html2canvas(node, { backgroundColor: null, scale: 3, useCORS: true }).then(cv => {
            const a = document.createElement('a');
            a.download = `Resultado_NISUS_vs_${(m.opponent || 'Rival').replace(/\s+/g, '_')}.png`;
            a.href = cv.toDataURL('image/png');
            a.click();
            btn.innerHTML = '<i class="fas fa-share-alt"></i> Compartir Resultado';
        }).catch(() => {
            window.showToast('Error al generar imagen', true);
            btn.innerHTML = '<i class="fas fa-share-alt"></i> Compartir Resultado';
        });
    };
};

window.openPlayerFinancialReport = function(playerId) {
    if (!window.isAdmin) return window.showToast('Solo administradores', true);
    const p = (window.players || []).find(x => x.id === playerId);
    if (!p) return;

    const dData = window.getPlayerDebts(playerId);
    const paidTxs = (window.finances || []).filter(t => t.playerId === playerId && t.type === 'income' && window.getValidCashAmount(t) > 0);
    const totalPaid = paidTxs.reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);

    document.getElementById('pf-player-name').textContent = p.name;
    document.getElementById('pf-debt').textContent = `$${dData.total.toFixed(2)}`;
    document.getElementById('pf-paid').textContent = `$${totalPaid.toFixed(2)}`;

    const listEl = document.getElementById('pf-transactions-list');
    listEl.innerHTML = '';

    dData.debts.forEach(d => {
        const dStr = (d.date && d.date.includes('-')) ? new Date(d.date + 'T12:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Pendiente';
        listEl.innerHTML += `
            <li class="px-5 py-3.5 flex justify-between items-center bg-red-50/40 dark:bg-red-900/10">
                <div class="pr-3 min-w-0">
                    <p class="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">${d.desc}</p>
                    <p class="text-[10px] text-red-500 font-bold uppercase">${dStr} · Por Pagar</p>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                    <span class="font-black text-sm text-red-600 dark:text-red-400">$${d.amount.toFixed(2)}</span>
                    <button onclick="window.forgiveSpecificDebt('${p.id}', '${d.id}', ${d.amount}); document.getElementById('modal-player-finances').classList.add('hidden');" class="text-slate-400 hover:text-red-500 text-xs p-1" title="Anular deuda"><i class="fas fa-trash-alt"></i></button>
                </div>
            </li>`;
    });

    paidTxs.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)).forEach(t => {
        const dStr = (t.date && t.date.includes('-')) ? new Date(t.date + 'T12:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
        listEl.innerHTML += `
            <li class="px-5 py-3.5 flex justify-between items-center">
                <div class="pr-3 min-w-0">
                    <p class="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">${t.description || t.category}</p>
                    <p class="text-[10px] text-slate-400">${dStr} · Pagado</p>
                </div>
                <span class="font-black text-sm text-green-600 dark:text-green-400">+$${(t.amount || 0).toFixed(2)}</span>
            </li>`;
    });

    if (listEl.innerHTML === '') {
        listEl.innerHTML = '<li class="p-6 text-center text-sm text-slate-500 italic">Sin movimientos registrados para este jugador</li>';
    }

    const btnWa = document.getElementById('pf-btn-wa');
    const btnPay = document.getElementById('pf-btn-pay');
    if (dData.total > 0.01) {
        btnWa.classList.remove('hidden'); btnWa.classList.add('flex');
        btnPay.classList.remove('hidden'); btnPay.classList.add('flex');
        btnWa.onclick = () => window.sendDirectWhatsApp(p.id);
        btnPay.onclick = () => {
            document.getElementById('modal-player-finances').classList.add('hidden');
            window.openPaySpecific(p.id);
        };
    } else {
        btnWa.classList.add('hidden'); btnWa.classList.remove('flex');
        btnPay.classList.add('hidden'); btnPay.classList.remove('flex');
    }

    document.getElementById('modal-player-finances').classList.remove('hidden');
};

window.switchMatchesTab = function(tab) {
    const vActive = document.getElementById('view-active-matches');
    const vArch = document.getElementById('view-archived-matches');
    const bActive = document.getElementById('btn-tab-active');
    const bArch = document.getElementById('btn-tab-archived');
    const activeCls = "flex-1 sm:flex-none px-5 py-2.5 rounded-lg text-xs font-black transition bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm";
    const inactiveCls = "flex-1 sm:flex-none px-5 py-2.5 rounded-lg text-xs font-black transition text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200";

    if (tab === 'archived') {
        vActive.classList.add('hidden'); vArch.classList.remove('hidden');
        bActive.className = inactiveCls; bArch.className = activeCls;
        window.renderArchivedMatches();
    } else {
        vArch.classList.add('hidden'); vActive.classList.remove('hidden');
        bArch.className = inactiveCls; bActive.className = activeCls;
        window.renderMatches();
    }
};

window.renderArchivedMatches = function() {
    const container = document.getElementById('archived-tournaments-list');
    if (!container) return;
    const archived = (window.matches || []).filter(m => m && m.status === 'archived');
    if (archived.length === 0) {
        container.innerHTML = '<div class="col-span-full text-center py-10 text-slate-500 bg-white dark:bg-darkcard rounded-2xl border border-slate-200 dark:border-slate-800">No hay torneos cerrados todavía</div>';
        return;
    }

    const groups = {};
    archived.forEach(m => {
        const key = (m.tournament || 'Torneo Sin Nombre').trim();
        if (!groups[key]) groups[key] = [];
        groups[key].push(m);
    });

    container.innerHTML = '';
    Object.keys(groups).forEach(tName => {
        const ms = groups[tName];
        let w = 0, d = 0, l = 0, gf = 0, ga = 0;
        ms.forEach(m => {
            const us = parseInt(m.goalsUs) || 0, them = parseInt(m.goalsThem) || 0;
            gf += us; ga += them;
            if (us > them) w++; else if (us < them) l++; else d++;
        });
        container.innerHTML += `
            <div class="bg-white dark:bg-darkcard rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-soft">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <span class="text-[9px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-500 px-2.5 py-1 rounded-lg"><i class="fas fa-archive mr-1"></i>Archivado</span>
                        <h3 class="text-lg font-black text-slate-900 dark:text-white mt-2">${tName}</h3>
                    </div>
                    <span class="text-xs font-black text-brand-600 dark:text-brand-400">${ms.length} PJ</span>
                </div>
                <div class="grid grid-cols-4 gap-2 text-center bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div><p class="text-[9px] font-bold text-slate-400">V</p><p class="font-black text-green-500">${w}</p></div>
                    <div><p class="text-[9px] font-bold text-slate-400">E</p><p class="font-black text-slate-500">${d}</p></div>
                    <div><p class="text-[9px] font-bold text-slate-400">D</p><p class="font-black text-red-500">${l}</p></div>
                    <div><p class="text-[9px] font-bold text-slate-400">GF/GC</p><p class="font-black text-slate-700 dark:text-slate-200">${gf}:${ga}</p></div>
                </div>
            </div>`;
    });
};

window.openArchiveCompetition = function() {
    if (!window.isAdmin) return window.showToast('Solo Lectura', true);
    const activeTourneys = [...new Set((window.matches || []).filter(m => m && m.status !== 'archived' && m.tournament).map(m => m.tournament.trim()))];
    if (activeTourneys.length === 0) return window.showToast('No hay torneos activos para cerrar', true);

    const sel = document.getElementById('comp-archive-select');
    sel.innerHTML = activeTourneys.map(t => `<option value="${t}">${t}</option>`).join('');
    document.getElementById('modal-archive-comp').classList.remove('hidden');
};

window.confirmArchiveCompetition = async function() {
    if (!window.isAdmin) return;
    const tName = document.getElementById('comp-archive-select').value;
    if (!tName) return;
    const toArchive = (window.matches || []).filter(m => m && m.status !== 'archived' && (m.tournament || '').trim() === tName);
    if (toArchive.length === 0) return;

    const btn = document.getElementById('btn-archive-comp');
    btn.disabled = true;
    try {
        const batch = db.batch();
        toArchive.forEach(m => {
            const goalsUs = m.status === 'forfait' ? 3 : (m.goalsUs ?? 0);
            const goalsThem = m.status === 'forfait' ? 0 : (m.goalsThem ?? 0);
            batch.update(db.collection(window.matchesPath).doc(m.id), { status: 'archived', goalsUs, goalsThem });
        });
        await batch.commit();
        document.getElementById('modal-archive-comp').classList.add('hidden');
        window.showToast(`Torneo "${tName}" archivado (${toArchive.length} partidos)`);
        window.switchMatchesTab('archived');
    } catch (e) {
        window.showToast('Error al archivar torneo', true);
    } finally {
        btn.disabled = false;
    }
};

window.openSeasonCloseModal = function() {
    if (!window.isAdmin) return window.showToast('Solo Lectura', true);
    const activeMatches = (window.matches || []).filter(m => m && m.status !== 'archived');
    if (activeMatches.length === 0) return window.showToast('No hay partidos activos para archivar', true);

    const finished = activeMatches.filter(m => m.status === 'finished' || m.status === 'forfait').length;
    document.getElementById('season-close-name').value = '';
    document.getElementById('season-close-summary').innerHTML = `
        <p class="font-bold text-purple-800 dark:text-purple-300"><i class="fas fa-futbol mr-1"></i> Partidos a archivar: ${activeMatches.length}</p>
        <p class="text-xs text-purple-600 dark:text-purple-400 mt-1">Finalizados: ${finished} · Pendientes: ${activeMatches.length - finished}</p>`;
    document.getElementById('modalSeasonClose').classList.remove('hidden');
};

window.executeSeasonClose = async function() {
    if (!window.isAdmin) return;
    const seasonName = document.getElementById('season-close-name').value.trim();
    if (!seasonName) return window.showToast('Ingresa el nombre oficial de la temporada', true);

    const activeMatches = (window.matches || []).filter(m => m && m.status !== 'archived');
    const btn = document.getElementById('btn-confirm-season');
    btn.disabled = true;
    try {
        const batch = db.batch();
        activeMatches.forEach(m => {
            batch.update(db.collection(window.matchesPath).doc(m.id), {
                status: 'archived',
                season: m.season || seasonName
            });
        });
        await batch.commit();
        document.getElementById('modalSeasonClose').classList.add('hidden');
        window.showToast(`Temporada "${seasonName}" archivada con éxito`);
    } catch (e) {
        window.showToast('Error al cerrar temporada', true);
    } finally {
        btn.disabled = false;
    }
};

window.clearFinancialHistory = function() {
    if (!window.isAdmin) return window.showToast('Solo administradores', true);
    if (!window.finances || window.finances.length === 0) return window.showToast('El historial ya está vacío', true);

    window.showConfirm('¿Borrar TODO el historial financiero y dejar las deudas en $0.00? Esta acción no se puede deshacer.', async () => {
        try {
            const batch = db.batch();
            window.finances.forEach(t => batch.delete(db.collection(window.financesPath).doc(t.id)));
            window.players.forEach(p => batch.set(db.collection(window.playersPath).doc(p.id), { debtAmount: 0, isPaidUp: true }, { merge: true }));
            await batch.commit();
            window.showToast('Historial financiero reiniciado');
        } catch (e) {
            window.showToast('Error al limpiar historial', true);
        }
    });
};

window.migrarFotosAStorage = async function() {
    if (!window.isAdmin) return window.showToast('Solo administradores', true);
    const pending = (window.players || []).filter(p => p && typeof p.image === 'string' && p.image.startsWith('data:image'));
    if (pending.length === 0) return window.showToast('Todas las fotos ya están optimizadas en la nube');

    const btn = document.getElementById('btn-migrar-fotos');
    if (btn) { btn.disabled = true; btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Migrando (0/${pending.length})...`; }

    let migrated = 0;
    for (const p of pending) {
        try {
            const res = await fetch(p.image);
            const blob = await res.blob();
            const ref = firebase.storage().ref(`jugadores/${p.id}.jpg`);
            await ref.put(blob);
            const url = await ref.getDownloadURL();
            await db.collection(window.playersPath).doc(p.id).update({ image: url });
            migrated++;
            if (btn) btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Migrando (${migrated}/${pending.length})...`;
        } catch (err) {
            console.error('Error migrando foto de', p.name, err);
        }
    }
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Migrar Fotos'; }
    window.showToast(`Se migraron ${migrated} foto(s) a Firebase Storage`);
};
window.buildSmoothTicker = function(itemsHtmlArray, speedPerItem = 4) {
    if (!itemsHtmlArray || itemsHtmlArray.length === 0) return '';
    const reps = Math.max(1, Math.ceil(6 / itemsHtmlArray.length));
    let half = '';
    for (let i = 0; i < reps; i++) half += itemsHtmlArray.join('');
    const duration = Math.max(18, itemsHtmlArray.length * reps * speedPerItem);
    return `<div class="ticker-track" style="--ticker-speed: ${duration}s;">${half}${half}</div>`;
};

window.renderFinancesTicker = function() {
    const el = document.getElementById('finances-ticker');
    if (!el) return;
    const debtors = [];
    (window.players || []).filter(p => p && !p.isStaff && (p.status === 'active' || !p.status)).forEach(p => {
        const d = window.getPlayerDebts(p.id);
        if (d.total > 0.01) debtors.push({ id: p.id, name: (p.name || 'Jugador').trim(), total: d.total });
    });
    debtors.sort((a, b) => b.total - a.total);

    if (debtors.length === 0) {
        el.innerHTML = `<span class="px-4 text-xs font-bold text-green-600 dark:text-green-400"><i class="fas fa-check-circle mr-1"></i> Todo el plantel está solvente y al día</span>`;
        return;
    }

    const items = debtors.map(d => {
        const bsTxt = window.currentExchangeRate ? ` <span class="text-[10px] text-slate-400 font-medium">(≈ ${(d.total * window.currentExchangeRate).toFixed(2)} Bs)</span>` : '';
        const clickAttr = window.isAdmin ? `onclick="window.openPaySpecific('${d.id}')" class="inline-flex items-center gap-2 px-5 text-xs cursor-pointer hover:opacity-75 transition"` : `class="inline-flex items-center gap-2 px-5 text-xs"`;
        return `<div ${clickAttr}><span class="w-2 h-2 rounded-full bg-red-500"></span><span class="font-bold text-slate-700 dark:text-slate-200">${d.name}:</span><span class="font-black text-red-600 dark:text-red-400">$${d.total.toFixed(2)}</span>${bsTxt}<span class="text-slate-300 dark:text-slate-700 ml-3">•</span></div>`;
    });
    el.innerHTML = window.buildSmoothTicker(items, 4);
};

window.renderMatchesTicker = function() {
    const el = document.getElementById('matches-ticker');
    if (!el) return;
    let pending = (window.matches || []).filter(m => m && m.status === 'pending');
    if (window.currentFilter !== 'all') pending = pending.filter(m => m.modality === window.currentFilter);
    pending.sort((a, b) => new Date(a.date) - new Date(b.date));

    const nx = pending[0];
    if (!nx) {
        el.innerHTML = `<span class="px-4 text-xs font-bold text-brand-100 dark:text-slate-400 italic">No hay próximos partidos agendados en esta modalidad</span>`;
        return;
    }

    const dStr = nx.date ? new Date(nx.date + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' }).toUpperCase() : 'FECHA POR DEFINIR';
    const mod = nx.modality === 'f7' ? 'Fútbol 7' : 'Fútbol 11';
    const kit = nx.kit === 'black' ? 'Uniforme Negro' : 'Uniforme Blanco/Azul';
    const loc = nx.location ? (nx.location.startsWith('http') ? 'Ubicación con Mapa' : nx.location) : 'Cancha por confirmar';

    const segment = `<div onclick="window.editMatch('${nx.id}')" class="inline-flex items-center gap-3 px-6 text-xs cursor-pointer hover:opacity-85 transition"><span class="font-black text-amber-300 uppercase tracking-wide">VS ${nx.opponent}</span><span class="text-white/40">|</span><span class="font-bold"><i class="far fa-calendar-alt mr-1 text-brand-300"></i>${dStr}</span><span class="text-white/40">|</span><span class="font-bold"><i class="fas fa-trophy mr-1 text-amber-300"></i>${nx.tournament || 'Amistoso'} (${mod})</span><span class="text-white/40">|</span><span class="font-medium text-brand-100"><i class="fas fa-tshirt mr-1"></i>${kit}</span><span class="text-white/40">|</span><span class="font-medium text-brand-100"><i class="fas fa-map-marker-alt mr-1"></i>${loc}</span><span class="text-amber-400 ml-4">⚡</span></div>`;
    el.innerHTML = window.buildSmoothTicker([segment], 7);
};
window.initApp = async function() {
if(window.appInitialized) return; window.appInitialized = true;
if (typeof loadInitialData === 'function') await loadInitialData();
if (typeof setupRealtimeListeners === 'function') setupRealtimeListeners();
if (typeof window.setupPWA === 'function') window.setupPWA();
if (typeof window.updateAdminUI === 'function') window.updateAdminUI();
document.addEventListener('mousemove', window.dragMove);
document.addEventListener('mouseup', window.dragEnd);
const p = document.getElementById('tactical-pitch');
if(p) { p.addEventListener('touchmove', window.dragMove, {passive: false}); p.addEventListener('touchend', window.dragEnd); }
};
window.paymentReports = window.paymentReports || [];
window.PAGO_MOVIL_INFO = {
    banco: 'Banesco (0134)',
    telefono: '0414-3330273',
    titularId: 'V-2766412'
};
window._pendingProofBlob = null;

    window.bcvRatesCache = { usd: null, eur: null, fetchedAt: 0 };
window._lastReportBsCalc = { bsAmount: 0, label: '' };

window.fetchDualBCVRates = async function() {
    const now = Date.now();
    if (window.bcvRatesCache.usd && window.bcvRatesCache.eur && (now - window.bcvRatesCache.fetchedAt < 1800000)) {
        return window.bcvRatesCache;
    }
    try {
        const [resUsd, resEur] = await Promise.all([
            fetch('https://ve.dolarapi.com/v1/dolares/oficial'),
            fetch('https://ve.dolarapi.com/v1/euros/oficial')
        ]);
        const dUsd = await resUsd.json();
        const dEur = await resEur.json();
        const usd = parseFloat(dUsd?.promedio) || null;
        const eur = parseFloat(dEur?.promedio) || null;
        if (usd || eur) {
            window.bcvRatesCache = { usd, eur, fetchedAt: now };
        }
    } catch (e) {
        console.error('Error consultando tasas BCV:', e);
    }
    return window.bcvRatesCache;
};

window.getEffectiveDebtRateType = function(debt) {
    if (!debt) return 'eur';
    if (debt.typeKey === 'arbitraje' || debt.typeKey === 'multa') return 'eur';
    const baseMode = debt.rateMode || (debt.typeKey === 'mensualidad' ? 'usd' : 'eur');
    if (baseMode === 'eur') return 'eur';
    const todayStr = new Date().toISOString().split('T')[0];
    if (debt.dueDate && /^\d{4}-\d{2}-\d{2}$/.test(debt.dueDate)) {
        return todayStr > debt.dueDate ? 'eur' : 'usd';
    }
    if (debt.typeKey === 'mensualidad' && debt.date && typeof debt.date === 'string') {
        const parts = debt.date.split('-');
        if (parts.length === 3 && todayStr > `${parts[0]}-${parts[1]}-25`) return 'eur';
    }
    return 'usd';
};

window.updateReportBsPreview = function() {
    const method = document.getElementById('rp-method')?.value || 'Pago Móvil';
    const bsEl = document.getElementById('rp-bs-amount');
    const infoEl = document.getElementById('rp-bs-rate-info');
    if (!bsEl || !infoEl || method !== 'Pago Móvil') return;

    const amount = parseFloat(document.getElementById('rp-amount')?.value) || 0;
    const playerId = document.getElementById('rp-player')?.value || '';
    const debtId = document.getElementById('rp-debt')?.value || '';
    const { usd, eur } = window.bcvRatesCache;

    if (!usd && !eur) {
        bsEl.textContent = 'Tasa no disponible';
        infoEl.textContent = 'No se pudo consultar el BCV ahora';
        window._lastReportBsCalc = { bsAmount: 0, label: '' };
        return;
    }
    if (amount <= 0) {
        bsEl.textContent = '0,00 Bs';
        infoEl.textContent = `BCV $: ${usd ? usd.toFixed(2) : '--'} · BCV €: ${eur ? eur.toFixed(2) : '--'}`;
        window._lastReportBsCalc = { bsAmount: 0, label: '' };
        return;
    }

    const dData = playerId ? window.getPlayerDebts(playerId) : { debts: [] };
    let totalBs = 0;
    let label = '';

    if (debtId) {
        const target = dData.debts.find(d => d.id === debtId);
        const rType = window.getEffectiveDebtRateType(target);
        const rate = rType === 'usd' ? (usd || eur) : (eur || usd);
        totalBs = amount * rate;
        label = rType === 'usd' ? `Tasa BCV Dólar ($): ${rate.toFixed(2)} Bs` : `Tasa BCV Euro (€): ${rate.toFixed(2)} Bs`;
    } else if (dData.debts.length > 0) {
        let rem = amount;
        let usedUsd = false, usedEur = false;
        dData.debts.forEach(d => {
            if (rem <= 0.01) return;
            const part = Math.min(rem, d.amount);
            const rType = window.getEffectiveDebtRateType(d);
            const rate = rType === 'usd' ? (usd || eur) : (eur || usd);
            totalBs += part * rate;
            if (rType === 'usd') usedUsd = true; else usedEur = true;
            rem -= part;
        });
        if (rem > 0.01) {
            const rate = eur || usd;
            totalBs += rem * rate;
            usedEur = true;
        }
        if (usedUsd && usedEur) label = `Mixto (BCV $ ${(usd||0).toFixed(2)} / BCV € ${(eur||0).toFixed(2)})`;
        else if (usedUsd) label = `Tasa BCV Dólar ($): ${(usd||0).toFixed(2)} Bs`;
        else label = `Tasa BCV Euro (€): ${(eur||0).toFixed(2)} Bs`;
    } else {
        const rate = eur || usd;
        totalBs = amount * rate;
        label = `Tasa BCV Euro (€): ${rate.toFixed(2)} Bs`;
    }

    window._lastReportBsCalc = { bsAmount: Number(totalBs.toFixed(2)), label };
    bsEl.textContent = `${totalBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs`;
    infoEl.textContent = label;
};

window.copyReportBsAmount = function() {
    const val = window._lastReportBsCalc?.bsAmount || 0;
    if (val <= 0) return window.showToast('Selecciona tu deuda primero', true);
    navigator.clipboard.writeText(val.toFixed(2))
        .then(() => window.showToast(`Monto copiado: ${val.toFixed(2)} Bs`))
        .catch(() => window.showToast('No se pudo copiar', true));
};

window.togglePaymentMethodFields = function() {
    const method = document.getElementById('rp-method')?.value || 'Efectivo ($)';
    const pmInfo = document.getElementById('rp-pm-info');
    const refWrap = document.getElementById('rp-ref-container');
    const refInput = document.getElementById('rp-ref');
    const proofInput = document.getElementById('rp-proof-file');
    const proofLabel = document.getElementById('rp-proof-label');

    if (method === 'Pago Móvil') {
        if (pmInfo) pmInfo.classList.remove('hidden');
        if (refWrap) refWrap.classList.remove('hidden');
        if (refInput) refInput.required = true;
        if (proofInput) proofInput.required = true;
        if (proofLabel) proofLabel.textContent = 'Comprobante (Imagen) *';
        window.updateReportBsPreview();
    } else {
        if (pmInfo) pmInfo.classList.add('hidden');
        if (refWrap) refWrap.classList.add('hidden');
        if (refInput) { refInput.required = false; refInput.value = ''; }
        if (proofInput) proofInput.required = false;
        if (proofLabel) proofLabel.textContent = 'Comprobante (Opcional en Efectivo)';
    }
};

window.copyPagoMovilData = function() {
    const info = window.PAGO_MOVIL_INFO;
    const txt = `Pago Móvil NISUS FC\nBanco: ${info.banco}\nTeléfono: ${info.telefono}\nCI/RIF: ${info.titularId}`;
    navigator.clipboard.writeText(txt)
        .then(() => window.showToast('Datos de Pago Móvil copiados'))
        .catch(() => window.showToast('No se pudo copiar', true));
};

window.handleProofImageChange = function(e) {
    const file = e.target.files?.[0];
    const wrap = document.getElementById('rp-proof-preview-wrap');
    const img = document.getElementById('rp-proof-preview');
    window._pendingProofBlob = null;
    if (!file) { if (wrap) wrap.classList.add('hidden'); return; }
    if (!file.type.startsWith('image/')) { e.target.value = ''; if (wrap) wrap.classList.add('hidden'); return window.showToast('Solo se permiten imágenes', true); }
    const reader = new FileReader();
    reader.onload = function(ev) {
        const im = new Image();
        im.onload = function() {
            const maxDim = 900; let w = im.width, h = im.height;
            if (w > h && w > maxDim) { h = Math.round(h * maxDim / w); w = maxDim; }
            else if (h > maxDim) { w = Math.round(w * maxDim / h); h = maxDim; }
            const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
            const ct = cv.getContext('2d'); ct.imageSmoothingQuality = 'high'; ct.drawImage(im, 0, 0, w, h);
            cv.toBlob(function(blob) {
                if (!blob) return window.showToast('Error al procesar comprobante', true);
                window._pendingProofBlob = blob;
                if (img) img.src = URL.createObjectURL(blob);
                if (wrap) wrap.classList.remove('hidden');
            }, 'image/jpeg', 0.8);
        };
        im.onerror = () => window.showToast('Imagen no válida', true);
        im.src = ev.target.result;
    };
    reader.readAsDataURL(file);
};

window.openReportPaymentModal = function() {
    const form = document.getElementById('report-payment-form');
    if (form) form.reset();
    window._pendingProofBlob = null;
    const wrap = document.getElementById('rp-proof-preview-wrap');
    if (wrap) wrap.classList.add('hidden');

    const bEl = document.getElementById('pm-bank'), phEl = document.getElementById('pm-phone'), idEl = document.getElementById('pm-id');
    if (bEl) bEl.textContent = window.PAGO_MOVIL_INFO.banco;
    if (phEl) phEl.textContent = window.PAGO_MOVIL_INFO.telefono;
    if (idEl) idEl.textContent = window.PAGO_MOVIL_INFO.titularId;

    const sel = document.getElementById('rp-player');
    if (!sel) return;

    const list = (window.players || [])
        .filter(p => p && !p.isStaff && (p.status === 'active' || !p.status))
        .map(p => ({ p, total: window.getPlayerDebts(p.id).total }))
        .filter(item => item.total > 0.01)
        .sort((a, b) => (a.p.name || '').localeCompare(b.p.name || ''));

    if (list.length === 0) {
        sel.innerHTML = '<option value="">Todos los jugadores están al día</option>';
    } else {
        sel.innerHTML = '<option value="">Selecciona tu nombre...</option>' + list.map(({ p, total }) =>
            `<option value="${p.id}">${p.name} (Debe: $${total.toFixed(2)})</option>`
        ).join('');
    }

    document.getElementById('rp-debt').innerHTML = '<option value="">Selecciona primero tu nombre</option>';
    document.getElementById('rp-amount').value = '';
    document.getElementById('rp-method').value = 'Pago Móvil';
    window.togglePaymentMethodFields();
    document.getElementById('modal-report-payment').classList.remove('hidden');
    window.fetchDualBCVRates().then(() => window.updateReportBsPreview());
};

window.handleReportPlayerChange = function() {
    const playerId = document.getElementById('rp-player').value;
    const debtSel = document.getElementById('rp-debt');
    const amtInput = document.getElementById('rp-amount');
    if (!playerId) {
        debtSel.innerHTML = '<option value="">Selecciona primero tu nombre</option>';
        amtInput.value = '';
        window.updateReportBsPreview();
        return;
    }
    const dData = window.getPlayerDebts(playerId);
    if (dData.debts.length === 0) {
        debtSel.innerHTML = '<option value="">Pago por adelantado / Colaboración</option>';
        amtInput.value = '';
    } else {
        debtSel.innerHTML = `<option value="">Abono general a mi cuenta (Total: $${dData.total.toFixed(2)})</option>` +
            dData.debts.map(d => {
                const tag = window.getEffectiveDebtRateType(d) === 'usd' ? 'BCV $' : 'BCV €';
                return `<option value="${d.id}">${d.desc} - $${d.amount.toFixed(2)} (${tag})</option>`;
            }).join('');
        amtInput.value = dData.total.toFixed(2);
    }
    window.updateReportBsPreview();
};

window.handleReportDebtChange = function() {
    const playerId = document.getElementById('rp-player').value;
    const debtId = document.getElementById('rp-debt').value;
    const amtInput = document.getElementById('rp-amount');
    if (!playerId) return;
    const dData = window.getPlayerDebts(playerId);
    if (!debtId) {
        if (dData.total > 0.01) amtInput.value = dData.total.toFixed(2);
    } else {
        const found = dData.debts.find(d => d.id === debtId);
        if (found) amtInput.value = found.amount.toFixed(2);
    }
    window.updateReportBsPreview();
};

window.submitPaymentReport = async function(e) {
    e.preventDefault();
    const playerId = document.getElementById('rp-player').value;
    const p = (window.players || []).find(x => x && x.id === playerId);
    if (!p) return window.showToast('Selecciona tu nombre', true);

    const amount = parseFloat(document.getElementById('rp-amount').value);
    if (isNaN(amount) || amount <= 0) return window.showToast('Ingresa un monto válido en USD', true);

    const method = document.getElementById('rp-method').value;
    const reference = (document.getElementById('rp-ref')?.value || '').trim();
    if (method === 'Pago Móvil' && !reference) return window.showToast('Ingresa el número de referencia del Pago Móvil', true);
    if (method === 'Pago Móvil' && !window._pendingProofBlob) return window.showToast('Adjunta la imagen del comprobante', true);

    const debtSel = document.getElementById('rp-debt');
    const specificDebtId = debtSel.value || '';
    const debtLabel = specificDebtId ? debtSel.options[debtSel.selectedIndex].text.split(' - $')[0] : 'Abono general a cuenta';

    const btn = document.getElementById('btn-submit-report');
    btn.disabled = true; btn.textContent = 'Enviando...';

    const id = window.generateId();
    let proofUrl = '';
    if (window._pendingProofBlob) {
        try {
            if (typeof firebase !== 'undefined' && typeof firebase.storage === 'function') {
                const ref = firebase.storage().ref(`comprobantes_pagos/${id}.jpg`);
                await ref.put(window._pendingProofBlob);
                proofUrl = await ref.getDownloadURL();
            } else {
                proofUrl = await new Promise((resolve, reject) => {
                    const fr = new FileReader();
                    fr.onload = () => resolve(fr.result);
                    fr.onerror = reject;
                    fr.readAsDataURL(window._pendingProofBlob);
                });
            }
        } catch (upErr) {
            btn.disabled = false; btn.innerHTML = '<i class="fas fa-check"></i> Enviar Pago';
            return window.showToast('No se pudo subir el comprobante', true);
        }
    }

    const bsInfo = method === 'Pago Móvil' && window._lastReportBsCalc?.bsAmount > 0
        ? `${window._lastReportBsCalc.bsAmount.toFixed(2)} Bs (${window._lastReportBsCalc.label})`
        : '';

    const reportData = {
        id, playerId: p.id, playerName: p.name, amount: Number(amount.toFixed(2)),
        specificDebtId, debtLabel, method,
        reference: method === 'Pago Móvil' ? reference : 'Efectivo',
        bsInfo, proofUrl,
        date: new Date().toISOString().split('T')[0], createdAt: Date.now(), status: 'pending'
    };

    try {
        await db.collection('pagos_reportados').doc(id).set(reportData);
        window._pendingProofBlob = null;
        document.getElementById('modal-report-payment').classList.add('hidden');
        window.showToast('¡Pago enviado! El administrador lo revisará pronto.');
    } catch (err) {
        window.showToast('Error al enviar el pago', true);
    } finally {
        btn.disabled = false; btn.innerHTML = '<i class="fas fa-check"></i> Enviar Pago';
    }
};

window.renderPendingPaymentReports = function() {
    const reports = (window.paymentReports || []).filter(r => r && r.status === 'pending').sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    const badge = document.getElementById('nav-fin-badge');
    const panel = document.getElementById('pending-reports-panel');
    const countEl = document.getElementById('pending-reports-count');
    const listEl = document.getElementById('pending-reports-list');

    if (badge) {
        badge.textContent = reports.length;
        if (reports.length > 0) badge.classList.remove('hidden');
        else badge.classList.add('hidden');
    }
    if (!panel || !listEl) return;

    if (reports.length === 0) {
        panel.classList.add('hidden');
        listEl.innerHTML = '';
        return;
    }

    panel.classList.remove('hidden');
    if (countEl) countEl.textContent = reports.length;

    listEl.innerHTML = reports.map(r => {
        const dStr = r.date && r.date.includes('-') ? new Date(r.date + 'T12:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : 'Hoy';
        const refTxt = r.method === 'Pago Móvil' ? ` · Ref: <strong>${r.reference || 'N/A'}</strong>` : '';
        const proofHtml = r.proofUrl
            ? `<a href="${r.proofUrl}" target="_blank" rel="noopener noreferrer" class="mt-2 inline-flex items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-brand-700 dark:text-brand-300 px-3 py-1.5 rounded-lg text-[11px] font-bold transition"><i class="fas fa-image"></i> Ver comprobante</a>`
            : '';
        return `
            <div class="bg-white dark:bg-darkcard rounded-xl p-4 border border-amber-200 dark:border-slate-700 shadow-sm flex flex-col justify-between gap-3">
                <div class="flex justify-between items-start gap-2">
                    <div class="min-w-0">
                        <p class="font-black text-slate-900 dark:text-white text-sm truncate">${r.playerName || 'Jugador'}</p>
                        <p class="text-[11px] font-bold text-brand-600 dark:text-brand-400 truncate">${r.debtLabel || 'Abono a cuenta'}</p>
                        <p class="text-[11px] text-slate-500 mt-1"><span class="font-bold text-slate-700 dark:text-slate-300">${r.method || 'Efectivo ($)'}</span>${refTxt} · <span class="text-[10px] text-slate-400">${dStr}</span></p>
                        ${proofHtml}
                    </div>
                    <span class="font-black text-lg text-emerald-600 dark:text-emerald-400 shrink-0">$${Number(r.amount || 0).toFixed(2)}</span>
                </div>
                <div class="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button type="button" onclick="window.approvePaymentReport('${r.id}')" class="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"><i class="fas fa-check"></i> Aprobar</button>
                    <button type="button" onclick="window.rejectPaymentReport('${r.id}')" class="px-3 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 text-red-500 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1" title="Rechazar"><i class="fas fa-times"></i> Rechazar</button>
                </div>
            </div>`;
    }).join('');
};

window.approvePaymentReport = async function(reportId) {
    if (!window.isAdmin) return window.showToast('Solo administradores', true);
    const r = (window.paymentReports || []).find(x => x && x.id === reportId);
    if (!r) return;

    const batch = db.batch();
    const txDate = r.date || new Date().toISOString().split('T')[0];
    const refTag = r.method === 'Pago Móvil' ? `[Pago Móvil · Ref: ${r.reference || 'N/A'}]` : `[Efectivo ($)]`;
    const openDebts = window.getPlayerDebts(r.playerId).debts;
    let rem = parseFloat(r.amount) || 0;
    let lastTx = null;

    const applyToDebt = (debtObj) => {
        if (rem <= 0.01 || !debtObj) return;
        const payHere = Math.min(rem, debtObj.amount);
        const isFull = Math.abs(debtObj.amount - payHere) < 0.01;
        const finId = window.generateId();
        const txObj = {
            id: finId,
            type: 'income',
            amount: Number(payHere.toFixed(2)),
            date: txDate,
            category: 'Abono a Deuda (Jugador)',
            description: `${isFull ? 'Pago' : 'Abono'}: ${debtObj.desc} ${refTag}`,
            matchId: null,
            playerId: r.playerId,
            specificDebtId: debtObj.id
        };
        batch.set(db.collection(window.financesPath).doc(finId), txObj);
        lastTx = txObj;

        if (isFull) {
            if (debtObj.id.startsWith('arb_')) {
                const parentId = debtObj.id.slice(4);
                const arbTx = (window.finances || []).find(x => x && x.id === parentId);
                if (arbTx) batch.set(db.collection(window.financesPath).doc(parentId), { paidBy: [...new Set([...(arbTx.paidBy || []), r.playerId])] }, { merge: true });
            } else {
                batch.set(db.collection(window.financesPath).doc(debtObj.id), { isPaid: true }, { merge: true });
            }
        }
        rem -= payHere;
    };

    if (r.specificDebtId) {
        const target = openDebts.find(d => d.id === r.specificDebtId);
        if (target) applyToDebt(target);
        openDebts.filter(d => d.id !== r.specificDebtId).forEach(d => applyToDebt(d));
    } else {
        openDebts.forEach(d => applyToDebt(d));
    }

    if (rem > 0.01) {
        const extraId = window.generateId();
        const extraTx = {
            id: extraId,
            type: 'income',
            amount: Number(rem.toFixed(2)),
            date: txDate,
            category: 'Otro Ingreso',
            description: `Pago adelantado / Excedente ${refTag}`,
            matchId: null,
            playerId: r.playerId
        };
        batch.set(db.collection(window.financesPath).doc(extraId), extraTx);
        lastTx = extraTx;
    }

    batch.delete(db.collection('pagos_reportados').doc(r.id));

    try {
        await batch.commit();
        if (lastTx) window._lastPaidTx = lastTx;
        window.showToast(`Pago de ${r.playerName} aprobado y sumado a caja`);
    } catch (err) {
        window.showToast('Error al aprobar el pago', true);
    }
};

window.rejectPaymentReport = function(reportId) {
    if (!window.isAdmin) return window.showToast('Solo administradores', true);
    window.showConfirm('¿Rechazar y descartar este pago?', async () => {
        try {
            const r = (window.paymentReports || []).find(x => x && x.id === reportId);
            if (r?.proofUrl && r.proofUrl.includes('firebasestorage') && typeof firebase !== 'undefined' && typeof firebase.storage === 'function') {
                try { await firebase.storage().ref(`comprobantes_pagos/${reportId}.jpg`).delete(); } catch (_) {}
            }
            await db.collection('pagos_reportados').doc(reportId).delete();
            window.showToast('Pago rechazado');
        } catch (err) {
            window.showToast('Error al rechazar', true);
        }
    });
};
window.cmpRadarChart = null;

window.initComparatorSelects = function() {
    const selA = document.getElementById('cmp-player-a');
    const selB = document.getElementById('cmp-player-b');
    if (!selA || !selB) return;

    let list = (window.players || []).filter(p => p && !p.isStaff && (p.status === 'active' || !p.status));
    if (window.currentFilter === 'f11') list = list.filter(p => p.availableF11);
    if (window.currentFilter === 'f7') list = list.filter(p => p.availableF7);
    list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    if (list.length < 2) {
        selA.innerHTML = '<option value="">Faltan jugadores</option>';
        selB.innerHTML = '<option value="">Faltan jugadores</option>';
        const bars = document.getElementById('cmp-stats-bars');
        if (bars) bars.innerHTML = '<p class="text-sm text-slate-400 italic text-center py-6">Se necesitan al menos 2 jugadores activos para comparar</p>';
        return;
    }

    const prevA = selA.value;
    const prevB = selB.value;
    const opts = list.map(p => `<option value="${p.id}">${p.number ? '#' + p.number + ' ' : ''}${p.name}</option>`).join('');
    selA.innerHTML = opts;
    selB.innerHTML = opts;

    selA.value = list.some(p => p.id === prevA) ? prevA : list[0].id;
    selB.value = (list.some(p => p.id === prevB) && prevB !== selA.value) ? prevB : list[1].id;
    window.renderPlayerComparator();
};

window.renderPlayerComparator = function() {
    const idA = document.getElementById('cmp-player-a')?.value;
    const idB = document.getElementById('cmp-player-b')?.value;
    const barsEl = document.getElementById('cmp-stats-bars');
    if (!idA || !idB || !barsEl) return;

    const pA = (window.players || []).find(p => p && p.id === idA);
    const pB = (window.players || []).find(p => p && p.id === idB);
    if (!pA || !pB) return;

    const totalTr = (window.trainings || []).length;
    const getMetrics = (p) => {
        const games = window.getPlayerStat(p, 'games');
        const goals = window.getPlayerStat(p, 'goals');
        const assists = window.getPlayerStat(p, 'assists');
        const mvps = window.getPlayerStat(p, 'mvps');
        const yellows = window.getPlayerStat(p, 'yellows');
        const reds = window.getPlayerStat(p, 'reds');
        const att = (window.trainings || []).filter(t => t?.attendees && t.attendees.includes(p.id)).length;
        const attPct = totalTr > 0 ? Math.round((att / totalTr) * 100) : 0;
        return { games, goals, assists, mvps, yellows, reds, attPct };
    };

    const mA = getMetrics(pA);
    const mB = getMetrics(pB);
    const nameA = (pA.showAlias && pA.alias) ? pA.alias : (pA.name || 'A').split(' ')[0];
    const nameB = (pB.showAlias && pB.alias) ? pB.alias : (pB.name || 'B').split(' ')[0];

    const rows = [
        { label: 'Partidos Jugados', a: mA.games, b: mB.games, suffix: '' },
        { label: 'Goles', a: mA.goals, b: mB.goals, suffix: '' },
        { label: 'Asistencias', a: mA.assists, b: mB.assists, suffix: '' },
        { label: 'Premios MVP', a: mA.mvps, b: mB.mvps, suffix: '' },
        { label: 'Asistencia Entrenos', a: mA.attPct, b: mB.attPct, suffix: '%' },
        { label: 'Tarjetas (🟨/🟥)', a: mA.yellows + mA.reds, b: mB.yellows + mB.reds, suffix: '', lowerBetter: true }
    ];

    barsEl.innerHTML = `
        <div class="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800 text-xs font-black uppercase tracking-wider">
            <span class="text-sky-600 dark:text-sky-400 truncate max-w-[45%]"><i class="fas fa-circle text-[8px] mr-1.5"></i>${nameA}</span>
            <span class="text-amber-600 dark:text-amber-400 truncate max-w-[45%] text-right">${nameB}<i class="fas fa-circle text-[8px] ml-1.5"></i></span>
        </div>` + rows.map(r => {
            const max = Math.max(r.a, r.b, 1);
            const pctA = Math.round((r.a / max) * 100);
            const pctB = Math.round((r.b / max) * 100);
            const winA = r.lowerBetter ? (r.a < r.b) : (r.a > r.b);
            const winB = r.lowerBetter ? (r.b < r.a) : (r.b > r.a);
            return `
                <div>
                    <div class="flex justify-between items-center text-xs mb-1">
                        <span class="font-black ${winA ? 'text-sky-600 dark:text-sky-400' : 'text-slate-500'}">${r.a}${r.suffix}</span>
                        <span class="text-[10px] font-bold uppercase tracking-widest text-slate-400">${r.label}</span>
                        <span class="font-black ${winB ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500'}">${r.b}${r.suffix}</span>
                    </div>
                    <div class="grid grid-cols-2 gap-1.5 h-2">
                        <div class="bg-slate-100 dark:bg-slate-800 rounded-l-full overflow-hidden flex justify-end">
                            <div class="bg-sky-500 h-full rounded-l-full transition-all duration-300" style="width:${pctA}%"></div>
                        </div>
                        <div class="bg-slate-100 dark:bg-slate-800 rounded-r-full overflow-hidden">
                            <div class="bg-amber-500 h-full rounded-r-full transition-all duration-300" style="width:${pctB}%"></div>
                        </div>
                    </div>
                </div>`;
        }).join('');

    if (window.cmpRadarChart) { window.cmpRadarChart.destroy(); window.cmpRadarChart = null; }
    const canvas = document.getElementById('cmp-radar-chart');
    if (typeof Chart !== 'undefined' && canvas) {
        const isDark = document.documentElement.classList.contains('dark');
        const textColor = isDark ? '#cbd5e1' : '#64748b';
        const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
        const toRadar = (m) => [
            Math.min(100, (m.goals / (m.games || 1)) * 120),
            Math.min(100, (m.assists / (m.games || 1)) * 150),
            Math.min(100, m.attPct),
            Math.min(100, (m.mvps / (m.games || 1)) * 400),
            Math.max(0, 100 - (m.yellows * 15) - (m.reds * 30))
        ];
        window.cmpRadarChart = new Chart(canvas, {
            type: 'radar',
            data: {
                labels: ['Goleo', 'Creación', 'Compromiso', 'MVP', 'Disciplina'],
                datasets: [
                    { label: nameA, data: toRadar(mA), backgroundColor: 'rgba(14, 165, 233, 0.22)', borderColor: '#0ea5e9', pointBackgroundColor: '#0ea5e9', borderWidth: 2 },
                    { label: nameB, data: toRadar(mB), backgroundColor: 'rgba(245, 158, 11, 0.22)', borderColor: '#f59e0b', pointBackgroundColor: '#f59e0b', borderWidth: 2 }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        angleLines: { color: gridColor },
                        grid: { color: gridColor },
                        pointLabels: { color: textColor, font: { size: 10, weight: 'bold' } },
                        ticks: { display: false, max: 100, min: 0, stepSize: 20 }
                    }
                },
                plugins: {
                    legend: { position: 'bottom', labels: { color: textColor, font: { size: 11, weight: 'bold' }, boxWidth: 12 } }
                }
            }
        });
    }
};
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.initApp);
} else {
    window.initApp();
}
