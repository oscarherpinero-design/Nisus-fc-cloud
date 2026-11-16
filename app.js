/* -----------------------------------------------------
   CONFIGURACIÓN PRINCIPAL DE FIREBASE
------------------------------------------------------ */
const firebaseConfig = { apiKey: "AIzaSyCXssxxTsyNBrp6x08dCX9QAPts6mon_1U", authDomain: "nisus-fc.firebaseapp.com", projectId: "nisus-fc", storageBucket: "nisus-fc.firebasestorage.app", messagingSenderId: "1095183265565", appId: "1:1095183265565:web:019161bbd603bba7ccfbf4" };

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// Activar Persistencia Offline
db.enablePersistence({ synchronizeTabs: true }).catch(() => {});

window.playersPath = `jugadores`; window.matchesPath = `partidos`; window.trainingsPath = `entrenamientos`; window.financesPath = `finanzas`;
window.players = []; window.matches = []; window.trainings = []; window.finances = []; window.isReady = false;
window.SECRET_PIN = "2024"; window.isAdmin = localStorage.getItem('nisus_admin') === 'true';
window.currentSeason = 'all'; window.currentFilter = 'all'; let deferredPrompt;

window.generateId = function() { return crypto.randomUUID ? crypto.randomUUID() : 'x-x-4-y-x'.replace(/[xy]/g, c => { var r = Math.random()*16|0; return (c==='x'?r:r&0x3|0x8).toString(16); }); };

/* -----------------------------------------------------
   LÓGICA CORE, NAVEGACIÓN Y UTILIDADES
------------------------------------------------------ */
window.showToast = function(msg, isError = false) {
    const t = document.getElementById('toast'); if(!t) return; document.getElementById('toast-msg').textContent = msg;
    t.className = `fixed top-20 right-4 px-5 py-4 rounded-2xl shadow-soft transform transition-all duration-300 z-[80] flex items-center gap-3 ${isError ? 'bg-red-500 text-white' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'}`;
    setTimeout(() => t.classList.remove('translate-x-[150%]'), 10); setTimeout(() => t.classList.add('translate-x-[150%]'), 3000);
};

window.toggleMenu = function() { const m = document.getElementById('side-menu'); const o = document.getElementById('side-menu-overlay'); if(m.classList.contains('-translate-x-full')) { m.classList.remove('-translate-x-full'); o.classList.remove('force-hidden'); } else { m.classList.add('-translate-x-full'); o.classList.add('force-hidden'); } };

window.showSection = function(sectionId) {
    ['dashboard', 'stats', 'players', 'matches', 'attendance', 'finances', 'playerForm', 'matchForm', 'attendanceForm', 'financesForm', 'playerProfile'].forEach(id => { const el = document.getElementById(id); if(el) el.classList.add('hidden'); });
    const sec = document.getElementById(sectionId); if(sec) { sec.classList.remove('hidden'); sec.classList.remove('section-fade-in'); void sec.offsetWidth; sec.classList.add('section-fade-in'); }
    ['dashboard', 'stats', 'players', 'matches', 'attendance', 'finances'].forEach(id => { const s = document.getElementById('nav-side-' + id); if(s) { s.classList.remove('bg-brand-50', 'dark:bg-brand-900/30', 'text-brand-700', 'dark:text-brand-300'); s.classList.add('text-slate-600', 'dark:text-slate-300'); } });
    const aS = document.getElementById('nav-side-' + sectionId); if(aS) { aS.classList.add('bg-brand-50', 'dark:bg-brand-900/30', 'text-brand-700', 'dark:text-brand-300'); aS.classList.remove('text-slate-600', 'dark:text-slate-300'); }
    const m = document.getElementById('side-menu'); if(m && !m.classList.contains('-translate-x-full')) window.toggleMenu();
    
    if(sectionId === 'players') { window.renderPlayers(); window.renderBirthdaysAvailability(); } 
    if(sectionId === 'matches') window.renderMatches(); 
    if(sectionId === 'attendance') window.renderTrainings(); 
    if(sectionId === 'dashboard' || sectionId === 'stats') window.updateDashboard(); 
    if(sectionId === 'finances') { if(!window.currentFinTab) window.switchFinancesTab('resumen'); window.renderFinances(); }
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
    const inputs = document.querySelectorAll('input:not(#admin-pin):not(#player-search), select:not(#player-position-filter):not(#season-filter):not(#season-filter-side), textarea');
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
    if(window.isAdmin) { window.isAdmin=false; localStorage.removeItem('nisus_admin'); window.updateAdminUI(); window.showToast("Modo lectura activado"); } 
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

/* -----------------------------------------------------
   DISEÑO Y KITS
------------------------------------------------------ */
window.generateKitSVG = function(shirt, accent, short, sock, accent2 = null) {
    const cid = 'clip-' + Math.random().toString(36).substr(2, 9); const isDark = document.documentElement.classList.contains('dark');
    const isLightKit = (shirt.toLowerCase() === '#ffffff' || shirt.toLowerCase() === '#fff'); const isDarkKit = (shirt.toLowerCase() === '#050505' || shirt.toLowerCase() === '#000' || shirt.toLowerCase() === '#111827');
    let strokeColor = 'rgba(0,0,0,0.1)', strokeWidth = '1', shadowFilter = 'drop-shadow(0px 2px 3px rgba(0,0,0,0.15))';
    if (isDark) { if (isDarkKit) { strokeColor = 'rgba(255,255,255,0.4)'; strokeWidth = '2.5'; shadowFilter = 'drop-shadow(0px 0px 5px rgba(255,255,255,0.2))'; } } else { if (isLightKit) { strokeColor = 'rgba(0,0,0,0.35)'; strokeWidth = '2.5'; shadowFilter = 'drop-shadow(0px 3px 4px rgba(0,0,0,0.25))'; } }
    let extraPaths = '';
    if (accent2) {
        extraPaths += `<rect x="35" y="0" width="30" height="100" fill="${accent}"/><rect x="33" y="0" width="2" height="100" fill="${accent2}"/><rect x="65" y="0" width="2" height="100" fill="${accent2}"/><polygon points="0,0 25,0 25,50 0,50" fill="${accent}"/><polygon points="75,0 100,0 100,50 75,50" fill="${accent}"/><path d="M35 15 Q50 35 65 15 Z" fill="${accent2}"/><polygon points="0,35 25,45 25,55 0,45" fill="${accent2}"/><polygon points="100,35 75,45 75,55 100,45" fill="${accent2}"/><rect x="20" y="75" width="60" height="5" fill="${accent2}"/>`;
    } else { extraPaths += `<path d="M40 15 C45 25, 55 25, 60 15 Z" fill="${accent}"/>`; }

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

/* -----------------------------------------------------
   ESTADÍSTICAS Y CÁLCULOS
------------------------------------------------------ */
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
        const lArr = Array.isArray(m.lineup) ? m.lineup : [];
        const eArr = Array.isArray(m.events) ? m.events : [];
        const played = lArr.some(l => l && l.playerId === player.id && l.x !== null) || eArr.some(e => e && e.type === 'sub' && e.playerId === player.id);
        
        if (statKey === 'games' && played && !player.isStaff) count++;
        if (statKey === 'cleanSheets' && played && (parseInt(m.goalsThem || 0) === 0)) { 
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
    }); return count;
};

window.getPlayerStat = function(player, statKey) {
    if(!player) return 0; if(player.isStaff && ['games', 'goals', 'assists', 'cleanSheets', 'mvps', 'penalty', 'freekick'].includes(statKey)) return 0;
    let count = 0;
    (window.matches || []).forEach(m => {
        if (!m || m.status !== 'finished') return; 
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
    }); return count;
};

/* -----------------------------------------------------
   GESTIÓN DE JUGADORES
------------------------------------------------------ */
window.toggleReturnDateField = function() { const s = document.getElementById('p-status').value; const c = document.getElementById('p-return-date-container'); if(s==='injured'||s==='absent'||s==='inactive') c.classList.remove('hidden'); else c.classList.add('hidden'); };
window.newPlayer = function() { document.getElementById('player-form').reset(); document.getElementById('p-id').value = ''; document.getElementById('form-title').innerHTML = '<i class="fas fa-user-plus text-brand-500 mr-2"></i>Inscribir Miembro'; document.getElementById('p-image-preview').classList.add('hidden'); document.getElementById('p-image-placeholder').classList.remove('hidden'); document.getElementById('p-image-base64').value = ''; window._pendingPhotoBlob = null; window._removePhotoFlag = false; const overlay = document.getElementById('p-image-overlay'); if(overlay) overlay.classList.remove('flex-show'); const sel = document.getElementById('p-position'); for(let i=0;i<sel.options.length;i++) sel.options[i].selected=false; window.toggleReturnDateField(); const notesInput = document.getElementById('p-status-notes'); if(notesInput) notesInput.value = ''; window._setupPhotoDropzone(); window.showSection('playerForm'); };
window.handleImageUpload = function(e) { const f = e.target.files[0]; if(!f) return; if(!f.type.startsWith('image/')) return window.showToast('Solo imágenes', true); window._compressPlayerImage(f); };
window._compressPlayerImage = function(file) {
    const spinner = document.getElementById('p-image-spinner'), preview = document.getElementById('p-image-preview'), placeholder = document.getElementById('p-image-placeholder'), overlay = document.getElementById('p-image-overlay');
    if(spinner) spinner.classList.add('flex-show');
    const r = new FileReader();
    r.onload = function(ev) {
        const img = new Image();
        img.onload = function() {
            const maxDim = 400; let w = img.width, h = img.height;
            if (w > h && w > maxDim) { h = Math.round(h * maxDim / w); w = maxDim; } else if (h > maxDim) { w = Math.round(w * maxDim / h); h = maxDim; }
            const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
            const ct = cv.getContext('2d'); ct.imageSmoothingQuality = 'high'; ct.drawImage(img, 0, 0, w, h);
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
    if(pStatus === 'injured' || pStatus === 'absent' || pStatus === 'inactive') { 
        returnD = document.getElementById('p-return-date').value || null; 
        statusNotes = document.getElementById('p-status-notes')?.value || '';
    }
    const oldP = window.players.find(x => x.id === id);
    let imageUrl = document.getElementById('p-image-base64').value;
    if (window._removePhotoFlag) { imageUrl = ''; try { await firebase.storage().ref(`jugadores/${docId}.jpg`).delete(); } catch(err) {} } 
    else if (window._pendingPhotoBlob) { try { const ref = firebase.storage().ref(`jugadores/${docId}.jpg`); await ref.put(window._pendingPhotoBlob); imageUrl = await ref.getDownloadURL(); } catch (error) { window.showToast('Error subiendo imagen', true); imageUrl = oldP ? (oldP.image || '') : ''; }
    } else if (!imageUrl && oldP && oldP.image && !oldP.image.startsWith('data:image')) { imageUrl = oldP.image; }
    
    const pData = { id: docId, name: document.getElementById('p-name').value, alias: document.getElementById('p-alias').value, showAlias: document.getElementById('p-show-alias').checked, number: document.getElementById('p-number').value, positions: positions, image: imageUrl, birthdate: document.getElementById('p-birthdate').value, foot: document.getElementById('p-foot').value, status: pStatus, returnDate: returnD, statusNotes: statusNotes, availableF11: document.getElementById('p-avail-f11').checked, availableF7: document.getElementById('p-avail-f7').checked, isStaff: document.getElementById('p-is-staff').checked, isPaidUp: document.getElementById('p-is-paid-up').checked };
    if(oldP && oldP.debtAmount !== undefined) pData.debtAmount = oldP.debtAmount;
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
window.migrarFotosAStorage = async function() {
    if (!window.isAdmin) return window.showToast('Debes ser administrador', true);
    const jugadoresConBase64 = window.players.filter(p => p.image && p.image.startsWith('data:image'));
    if (jugadoresConBase64.length === 0) return window.showToast('No hay fotos antiguas para migrar.');
    window.showConfirm(`Se encontraron ${jugadoresConBase64.length} fotos antiguas. ¿Subirlas al Storage?`, async () => {
        const btn = document.getElementById('btn-migrar-fotos'); if(btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Migrando...'; }
        let migradas = 0;
        for (const p of jugadoresConBase64) {
            try { const res = await fetch(p.image); const blob = await res.blob(); const ref = firebase.storage().ref(`jugadores/${p.id}.jpg`); await ref.put(blob); const url = await ref.getDownloadURL(); await db.collection(window.playersPath).doc(p.id).update({ image: url }); migradas++; } catch(e) {}
        }
        window.showToast(`Migración lista: ${migradas} fotos subidas.`); if(btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-check-circle mr-2"></i> Listo'; btn.classList.replace('bg-orange-500', 'bg-green-500'); }
    });
};

window.renderPlayers = function() {
    const grid = document.getElementById('players-grid'); if(!grid) return; grid.innerHTML = '';
    let list = window.players || []; 
    if(window.currentFilter==='f11') list = list.filter(p => p?.availableF11); 
    else if(window.currentFilter==='f7') list = list.filter(p => p?.availableF7);
    
    const q = (document.getElementById('player-search')?.value || '').trim().toLowerCase();
    const posF = document.getElementById('player-position-filter')?.value || '';
    
    if(q) list = list.filter(p => { 
        const n = (p?.name || '').toLowerCase(); 
        const al = (p?.alias || '').toLowerCase(); 
        const num = String(p?.number || ''); 
        return n.includes(q) || al.includes(q) || num === q; 
    });
    
    if(posF) { 
        if(posF === 'Staff') list = list.filter(p => p?.isStaff); 
        else list = list.filter(p => { 
            const posRaw = p?.positions || p?.position || []; 
            const pos = Array.isArray(posRaw) ? posRaw : (typeof posRaw === 'string' ? posRaw.split(',') : [posRaw]); 
            return pos.includes(posF); 
        }); 
    }
    
    list.sort((a,b) => { 
        if (a?.isStaff && !b?.isStaff) return 1; 
        if (!a?.isStaff && b?.isStaff) return -1; 
        const nA = parseInt(a?.number) || 9999; 
        const nB = parseInt(b?.number) || 9999; 
        if(nA !== nB) return nA - nB; 
        return (a?.name || '').localeCompare(b?.name || ''); 
    });
    
    if(list.length === 0){ grid.innerHTML = `<div class="col-span-full text-center text-slate-500 py-10 bg-white dark:bg-darkcard rounded-2xl border border-slate-200 dark:border-slate-800">No hay registros</div>`; return; }

    list.forEach(p => {
        if(!p) return; 
        const games = window.getPlayerStat(p, 'games'), goals = window.getPlayerStat(p, 'goals'), assists = window.getPlayerStat(p, 'assists'), yellows = window.getPlayerStat(p, 'yellows'), reds = window.getPlayerStat(p, 'reds'), mvps = window.getPlayerStat(p, 'mvps'), cleanSheets = window.getPlayerStat(p, 'cleanSheets');
        const attendance = (window.trainings || []).filter(t => t?.attendees && Array.isArray(t.attendees) && t.attendees.includes(p.id)).length;
        let b=''; const badges = [];
        
        const posRaw = p.positions || p.position || [];
        const pos = Array.isArray(posRaw) ? posRaw : (typeof posRaw === 'string' ? posRaw.split(',') : [posRaw]);
        
        if(p.availableF11) badges.push('<span class="bg-brand-600 text-white px-1.5 py-0.5 rounded text-[8px] font-black uppercase">F11</span>');
        if(p.availableF7) badges.push('<span class="bg-green-600 text-white px-1.5 py-0.5 rounded text-[8px] font-black uppercase">F7</span>');
        if(mvps > 0) badges.push(`<span class="bg-yellow-500 text-white px-1.5 py-0.5 rounded text-[8px] font-black uppercase"><i class="fas fa-star"></i> ${mvps}</span>`);
        if(pos.includes('Portero') && cleanSheets > 0) badges.push(`<span class="bg-teal-500 text-white px-1.5 py-0.5 rounded text-[8px] font-black uppercase">🛡️ ${cleanSheets}</span>`);
        b = badges.join('<span class="text-slate-300 dark:text-slate-600 text-[8px]">·</span> '); if(b) b = `<div class="flex items-center gap-1 flex-wrap">${b}</div>`;
        
        const dData = typeof window.getPlayerDebts === 'function' ? window.getPlayerDebts(p.id) : { total: 0 };
        const debtBadge = (dData?.total || 0) > 0.01 ? `<span class="text-red-500 dark:text-red-400 font-black text-[10px] ml-1"><i class="fas fa-exclamation-circle"></i> ${(dData.total).toFixed(2)}</span>` : '<span class="text-green-500 dark:text-green-400 font-black text-[10px] ml-1"><i class="fas fa-check-circle"></i> Al Día</span>';

        let sb='', oc='';
        const returnDateStr = p.returnDate && typeof p.returnDate === 'string' && p.returnDate.includes('-') ? p.returnDate.split('-').reverse().join('/') : 'Indefinido';
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

window.currentPlayer360 = null;
window.radarChart360 = null;

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
        let ca = td.getFullYear()-bd.getFullYear(); 
        const m = td.getMonth()-bd.getMonth(); 
        if(m<0||(m===0&&td.getDate()<bd.getDate())) ca--; 
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
    imgCont.innerHTML = p.image 
        ? `<img src="${p.image}" class="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-4 border-white dark:border-slate-800 shadow-lg">`
        : `<div class="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl ${p.isStaff?'bg-purple-100 text-purple-600':'bg-brand-100 text-brand-600'} font-black flex items-center justify-center text-4xl border-4 border-white dark:border-slate-800 shadow-lg">${ini}</div>`;
    
    const badgesEl = document.getElementById('pp-badges'); badgesEl.innerHTML = '';
    if(p.number) badgesEl.innerHTML += `<span class="bg-slate-900 text-white px-3 py-1 rounded-lg text-xs font-black shadow-sm">#${p.number}</span>`;
    if(p.availableF11) badgesEl.innerHTML += `<span class="bg-blue-100 text-blue-700 border border-blue-200 px-3 py-1 rounded-lg text-[10px] font-black uppercase">F11</span>`;
    if(p.availableF7) badgesEl.innerHTML += `<span class="bg-green-100 text-green-700 border border-green-200 px-3 py-1 rounded-lg text-[10px] font-black uppercase">F7</span>`;
    
    window.renderProfileRendimiento(p); window.renderProfileClinica(p); window.renderProfileFinanzas(p); window.renderProfileFicha(p);
    window.switchProfileTab('rendimiento'); window.showSection('playerProfile');
};

window.closePlayerProfile = function() { document.getElementById('playerProfile').classList.add('hidden'); window.showSection('players'); };

window.renderProfileRendimiento = function(p) {
    const games = window.getPlayerStat(p, 'games'); const goals = window.getPlayerStat(p, 'goals'); const assists = window.getPlayerStat(p, 'assists'); const mvps = window.getPlayerStat(p, 'mvps'); const yellows = window.getPlayerStat(p, 'yellows'); const reds = window.getPlayerStat(p, 'reds');
    const aGames = window.getPlayerArchivedStat(p, 'games'); const aGoals = window.getPlayerArchivedStat(p, 'goals'); const aAssists = window.getPlayerArchivedStat(p, 'assists'); const aMvps = window.getPlayerArchivedStat(p, 'mvps');
    
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
    
    if(p.status === 'injured') {
        medEl.innerHTML = `<div class="bg-red-50 dark:bg-red-900/20 p-5 rounded-xl border border-red-200 dark:border-red-800/50 text-center"><i class="fas fa-briefcase-medical text-3xl text-red-500 mb-2"></i><p class="font-black text-red-700 dark:text-red-400">Lesionado</p><p class="text-xs text-red-600 dark:text-red-300 mt-1">Regreso estimado: ${returnDateStr}</p>${notesHtml}</div>`;
    } else if(p.status === 'suspended') {
        medEl.innerHTML = `<div class="bg-orange-50 dark:bg-orange-900/20 p-5 rounded-xl border border-orange-200 dark:border-orange-800/50 text-center"><i class="fas fa-ban text-3xl text-orange-500 mb-2"></i><p class="font-black text-orange-700 dark:text-orange-400">Suspendido</p><p class="text-xs text-orange-600 dark:text-orange-300 mt-1">Sanción disciplinaria</p>${notesHtml}</div>`;
    } else if(p.status === 'absent') {
        medEl.innerHTML = `<div class="bg-slate-100 dark:bg-slate-800/50 p-5 rounded-xl border border-slate-300 dark:border-slate-700 text-center"><i class="fas fa-plane text-3xl text-slate-500 mb-2"></i><p class="font-black text-slate-700 dark:text-slate-300">Ausente</p><p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Regreso estimado: ${returnDateStr}</p>${notesHtml}</div>`;
    } else {
        medEl.innerHTML = `<div class="bg-green-50 dark:bg-green-900/20 p-5 rounded-xl border border-green-200 dark:border-green-800/50 text-center"><i class="fas fa-heartbeat text-3xl text-green-500 mb-2"></i><p class="font-black text-green-700 dark:text-green-400">En Forma Óptima</p><p class="text-xs text-green-600 dark:text-green-300 mt-1">Apto para jugar</p></div>`;
    }

    const discEl = document.getElementById('pp-discipline-list'); discEl.innerHTML = '';
    const tournaments = [...new Set((window.matches || []).filter(m => m && (m.status === 'finished' || m.status === 'forfait')).map(m => m.tournament))].filter(Boolean);
    
    tournaments.forEach(t => {
        const d = window.getDiscipline(p.id, t);
        if(d.yellows > 0 || d.suspended) {
            discEl.innerHTML += `<div class="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl mb-2 border border-slate-100 dark:border-slate-800"><span class="font-bold text-xs text-slate-700 dark:text-slate-300">${t}</span><div><span class="text-yellow-500 font-black text-xs mr-3">🟨 ${d.yellows}/3</span>${d.suspended ? '<span class="bg-red-500 text-white px-2 py-1 rounded text-[9px] font-black uppercase shadow-sm">Sancionado</span>' : '<span class="bg-green-500 text-white px-2 py-1 rounded text-[9px] font-black uppercase shadow-sm">Ok</span>'}</div></div>`;
        }
    });
    if(discEl.innerHTML === '') discEl.innerHTML = '<p class="text-sm text-slate-500 italic text-center py-4">Historial limpio. ¡Buen comportamiento!</p>';
};

window.renderProfileFinanzas = function(p) {
    const dData = typeof window.getPlayerDebts === 'function' ? window.getPlayerDebts(p.id) : { total: 0, debts: [] };
    const mor = typeof window.getMorosityStatus === 'function' ? window.getMorosityStatus(p.id) : { label: 'Deuda', color: 'yellow' };
    
    const badgeColors = mor.color === 'green' ? 'bg-green-100 text-green-700' : mor.color === 'yellow' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700';
    document.getElementById('pp-debt-badge').className = `px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${badgeColors}`;
    document.getElementById('pp-debt-badge').innerHTML = `${mor.label}: $${dData.total.toFixed(2)}`;

    const listEl = document.getElementById('pp-finances-list'); listEl.innerHTML = '';
    const myTxs = (window.finances || []).filter(t => t.playerId === p.id).sort((a,b) => new Date(b.date||0) - new Date(a.date||0)).slice(0,10);
    
    if(myTxs.length === 0) listEl.innerHTML = '<tr><td class="py-4 text-sm text-slate-500 italic text-center">Sin movimientos financieros</td></tr>';
    myTxs.forEach(t => {
        const dStr = new Date((t.date||'')+'T12:00:00').toLocaleDateString('es-ES', {day:'2-digit', month:'short'});
        const validAmt = typeof window.getValidCashAmount === 'function' ? window.getValidCashAmount(t) : 0;
        let estado = '', color = '';
        if (t.isPaid === false) { estado = 'Pendiente'; color = 'text-amber-500'; }
        else if (t.category === 'Abono a Deuda (Jugador)') { estado = 'Abono'; color = 'text-green-500'; }
        else { estado = 'Pagado'; color = 'text-slate-400'; }
        
        listEl.innerHTML += `<tr class="border-b border-slate-100 dark:border-slate-800 last:border-0"><td class="py-3"><p class="text-xs font-bold text-slate-800 dark:text-slate-200">${t.category}</p><p class="text-[10px] text-slate-400">${dStr}</p></td><td class="py-3 text-right"><p class="text-sm font-black ${color}">$${(t.amount||0).toFixed(2)}</p><p class="text-[9px] font-bold uppercase ${color}">${estado}</p></td></tr>`;
    });
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

/* -----------------------------------------------------
   PARTIDOS, PIZARRA Y ALINEACIONES
------------------------------------------------------ */
const posValid = { POR: ['Portero'], DFC: ['Defensa Central', 'Mediocentro Defensivo', 'Lateral Derecho', 'Lateral Izquierdo'], LD: ['Lateral Derecho', 'Carrilero', 'Defensa Central'], LI: ['Lateral Izquierdo', 'Carrilero', 'Defensa Central'], CAR: ['Carrilero', 'Lateral Derecho', 'Lateral Izquierdo', 'Interior'], MCD: ['Mediocentro Defensivo', 'Mediocentro', 'Defensa Central'], MC: ['Mediocentro', 'Mediocentro Defensivo', 'Interior', 'Mediapunta'], MI: ['Interior', 'Extremo Izquierdo', 'Mediocentro', 'Carrilero'], MD: ['Interior', 'Extremo Derecho', 'Mediocentro', 'Carrilero'], MCO: ['Mediapunta', 'Interior', 'Segundo Delantero', 'Mediocentro'], ED: ['Extremo Derecho', 'Segundo Delantero', 'Delantero Centro', 'Interior'], EI: ['Extremo Izquierdo', 'Segundo Delantero', 'Delantero Centro', 'Interior'], DC: ['Delantero Centro', 'Segundo Delantero', 'Extremo Derecho', 'Extremo Izquierdo', 'Mediapunta'] };
const formations = {
    f11: { "4-4-2": [{x:50,y:90,valid:posValid.POR},{x:20,y:75,valid:posValid.LI},{x:40,y:75,valid:posValid.DFC},{x:60,y:75,valid:posValid.DFC},{x:80,y:75,valid:posValid.LD},{x:20,y:50,valid:posValid.MI},{x:40,y:50,valid:posValid.MC},{x:60,y:50,valid:posValid.MC},{x:80,y:50,valid:posValid.MD},{x:35,y:25,valid:posValid.DC},{x:65,y:25,valid:posValid.DC}], "4-3-3": [{x:50,y:90,valid:posValid.POR},{x:20,y:75,valid:posValid.LI},{x:40,y:75,valid:posValid.DFC},{x:60,y:75,valid:posValid.DFC},{x:80,y:75,valid:posValid.LD},{x:30,y:55,valid:posValid.MC},{x:50,y:55,valid:posValid.MCD},{x:70,y:55,valid:posValid.MC},{x:20,y:25,valid:posValid.EI},{x:50,y:25,valid:posValid.DC},{x:80,y:25,valid:posValid.ED}], "4-2-3-1": [{x:50,y:90,valid:posValid.POR},{x:15,y:75,valid:posValid.LI},{x:35,y:75,valid:posValid.DFC},{x:65,y:75,valid:posValid.DFC},{x:85,y:75,valid:posValid.LD},{x:35,y:60,valid:posValid.MCD},{x:65,y:60,valid:posValid.MCD},{x:20,y:40,valid:posValid.MI},{x:50,y:40,valid:posValid.MCO},{x:80,y:40,valid:posValid.MD},{x:50,y:20,valid:posValid.DC}], "4-1-4-1": [{x:50,y:90,valid:posValid.POR},{x:15,y:75,valid:posValid.LI},{x:35,y:75,valid:posValid.DFC},{x:65,y:75,valid:posValid.DFC},{x:85,y:75,valid:posValid.LD},{x:50,y:60,valid:posValid.MCD},{x:15,y:45,valid:posValid.MI},{x:35,y:45,valid:posValid.MC},{x:65,y:45,valid:posValid.MC},{x:85,y:45,valid:posValid.MD},{x:50,y:20,valid:posValid.DC}], "4-5-1": [{x:50,y:90,valid:posValid.POR},{x:15,y:75,valid:posValid.LI},{x:35,y:75,valid:posValid.DFC},{x:65,y:75,valid:posValid.DFC},{x:85,y:75,valid:posValid.LD},{x:15,y:50,valid:posValid.MI},{x:35,y:50,valid:posValid.MC},{x:50,y:50,valid:posValid.MCD},{x:65,y:50,valid:posValid.MC},{x:85,y:50,valid:posValid.MD},{x:50,y:25,valid:posValid.DC}], "3-5-2": [{x:50,y:90,valid:posValid.POR},{x:30,y:75,valid:posValid.DFC},{x:50,y:75,valid:posValid.DFC},{x:70,y:75,valid:posValid.DFC},{x:15,y:50,valid:posValid.CAR},{x:35,y:50,valid:posValid.MC},{x:50,y:50,valid:posValid.MCD},{x:65,y:50,valid:posValid.MC},{x:85,y:50,valid:posValid.CAR},{x:35,y:25,valid:posValid.DC},{x:65,y:25,valid:posValid.DC}], "3-4-3": [{x:50,y:90,valid:posValid.POR},{x:30,y:75,valid:posValid.DFC},{x:50,y:75,valid:posValid.DFC},{x:70,y:75,valid:posValid.DFC},{x:15,y:50,valid:posValid.MI},{x:35,y:50,valid:posValid.MC},{x:65,y:50,valid:posValid.MC},{x:85,y:50,valid:posValid.MD},{x:25,y:25,valid:posValid.EI},{x:50,y:25,valid:posValid.DC},{x:75,y:25,valid:posValid.ED}], "5-3-2": [{x:50,y:90,valid:posValid.POR},{x:15,y:75,valid:posValid.CAR},{x:30,y:80,valid:posValid.DFC},{x:50,y:80,valid:posValid.DFC},{x:70,y:80,valid:posValid.DFC},{x:85,y:75,valid:posValid.CAR},{x:35,y:55,valid:posValid.MC},{x:50,y:55,valid:posValid.MCD},{x:65,y:55,valid:posValid.MC},{x:35,y:25,valid:posValid.DC},{x:65,y:25,valid:posValid.DC}] },
    f7: { "3-2-1": [{x:50,y:90,valid:posValid.POR},{x:25,y:70,valid:posValid.LI},{x:50,y:70,valid:posValid.DFC},{x:75,y:70,valid:posValid.LD},{x:35,y:45,valid:posValid.MC},{x:65,y:45,valid:posValid.MC},{x:50,y:20,valid:posValid.DC}], "3-1-2": [{x:50,y:90,valid:posValid.POR},{x:25,y:70,valid:posValid.LI},{x:50,y:70,valid:posValid.DFC},{x:75,y:70,valid:posValid.LD},{x:50,y:45,valid:posValid.MCD},{x:35,y:20,valid:posValid.DC},{x:65,y:20,valid:posValid.DC}], "2-3-1": [{x:50,y:90,valid:posValid.POR},{x:35,y:70,valid:posValid.DFC},{x:65,y:70,valid:posValid.DFC},{x:20,y:45,valid:posValid.MI},{x:50,y:45,valid:posValid.MC},{x:80,y:45,valid:posValid.MD},{x:50,y:20,valid:posValid.DC}], "2-2-2": [{x:50,y:90,valid:posValid.POR},{x:35,y:75,valid:posValid.DFC},{x:65,y:75,valid:posValid.DFC},{x:30,y:45,valid:posValid.MC},{x:70,y:45,valid:posValid.MC},{x:35,y:20,valid:posValid.DC},{x:65,y:20,valid:posValid.DC}], "1-3-2": [{x:50,y:90,valid:posValid.POR},{x:50,y:75,valid:posValid.DFC},{x:20,y:50,valid:posValid.MI},{x:50,y:50,valid:posValid.MC},{x:80,y:50,valid:posValid.MD},{x:35,y:25,valid:posValid.DC},{x:65,y:25,valid:posValid.DC}], "1-4-1": [{x:50,y:90,valid:posValid.POR},{x:50,y:75,valid:posValid.DFC},{x:15,y:45,valid:posValid.MI},{x:35,y:45,valid:posValid.MC},{x:65,y:45,valid:posValid.MC},{x:85,y:45,valid:posValid.MD},{x:50,y:20,valid:posValid.DC}] }
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
window.updateFormationOptions = () => { const m = document.getElementById('m-modality').value, s = document.getElementById('m-formation'); if(!s)return; let h='<option value="">Formación Libre</option>'; for(let k in formations[m]) h+=`<option value="${k}">${k}</option>`; s.innerHTML=h; };

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
    window.currentLineup = (window.currentLineup || []).filter(l => { const p = window.players.find(x=>x.id===l.playerId); return p && (p.status === 'active' || !p.status) && (m==='f11'?p.availableF11:p.availableF7); }); 
    let c=0; (window.currentLineup || []).forEach(p => { const s = window.players.find(x=>x.id===p.playerId)?.isStaff; if(!s && p.x!==null && p.y!==null) { c++; if(c>mx) {p.x=null;p.y=null;} } }); 
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
            if(fk && formations[m][fk]) {
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

window.renderMatches = function() {
    const grid = document.getElementById('matches-grid'); if(!grid) return; grid.innerHTML = '';
    let list = window.matches; if(window.currentFilter !== 'all') list = list.filter(m => m.modality === window.currentFilter); if(window.currentSeason !== 'all') list = list.filter(m => m.season === window.currentSeason);
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

window.exportMatchResult = function(matchId) {
    const m = window.matches.find(x => x.id === matchId); if(!m) return;
    const c = document.getElementById('result-render-container');
    const tLbl = `FÚTBOL ${m.modality==='f11'?'11':'7'} | ${m.tournament}`; const dStr = new Date(m.date+'T12:00:00').toLocaleDateString('es-ES', {day:'2-digit',month:'long',year:'numeric'}).toUpperCase();
    let rCol = '#94a3b8', rTxt = 'EMPATE'; if(parseInt(m.goalsUs)>parseInt(m.goalsThem)) { rCol='#22c55e'; rTxt='VICTORIA'; } else if(parseInt(m.goalsUs)<parseInt(m.goalsThem)) { rCol='#ef4444'; rTxt='DERROTA'; }
    
    let evH = ''; 
    if(m.status === 'forfait') evH = `<div class="mt-6 bg-purple-900/40 border border-purple-500/30 px-6 py-3 rounded-xl text-center backdrop-blur-sm"><p class="text-xs text-purple-300 font-black tracking-widest uppercase"><i class="fas fa-gavel mr-2"></i>Victoria Administrativa (Forfait)</p></div>`;
    else {
        if(m.events) { const g = m.events.filter(e=>['goals','penalty','freekick'].includes(e.type)); if(g.length>0) evH += `<div class="mt-5 text-center"><p class="text-[8px] text-slate-400 uppercase tracking-widest font-black mb-1.5">Goleadores</p><p class="text-sm text-white font-bold"><i class="fas fa-futbol text-green-400 mr-2 drop-shadow"></i>` + g.map(x=>{ const p = window.players.find(y=>y.id===x.playerId); return (p?(p.name||'').split(' ')[0]:'?') + (x.type==='penalty'?' 🎯':x.type==='freekick'?' 👟':''); }).join(', ') + `</p></div>`; }
        if(m.mvp) { const p=window.players.find(x=>x.id===m.mvp); if(p) evH+=`<div class="mt-4 text-center bg-yellow-500/10 border border-yellow-500/20 px-6 py-2 rounded-2xl"><p class="text-[8px] text-yellow-500/70 uppercase tracking-widest font-black mb-1">MVP del Partido</p><p class="text-lg text-yellow-400 font-black uppercase"><i class="fas fa-star mr-2 drop-shadow"></i>${(p.name||'').split(' ')[0]}</p></div>`; }
    }
    
    let nS='#ffffff', nA='#0284c7', nSh='#111827', nSo='#111827', nAc2='#111827'; if(m.kit==='black'){nS='#050505'; nA='#050505'; nAc2=null; nSh='#050505'; nSo='#050505';}
    
    c.innerHTML = `
        <div id="match-result-node" class="match-result-export">
            <img src="escudo.png" onerror="this.style.display='none'" class="absolute opacity-[0.05] w-72 h-72 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <div class="z-10 w-full flex flex-col items-center">
                <p class="text-[9px] font-black tracking-widest text-brand-300 mb-1 drop-shadow">${tLbl}</p><p class="text-[10px] font-bold text-slate-300 mb-6 tracking-widest">${dStr}</p>
                <p class="text-[10px] font-black tracking-widest mb-3 drop-shadow" style="color:${rCol}">${rTxt}</p>
                <div class="flex items-center justify-center gap-6 mb-2 w-full px-4">
                    <div class="flex flex-col items-center w-24"><div class="w-14 h-20 mb-3 drop-shadow-lg">${window.generateKitSVG(nS,nA,nSh,nSo,nAc2)}</div><p class="text-base font-black uppercase text-white w-full text-center drop-shadow">NISUS</p></div>
                    <div class="flex items-center justify-center gap-3 bg-slate-900/60 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10 shadow-xl shrink-0"><span class="text-4xl font-black text-white drop-shadow">${m.goalsUs}</span><span class="text-xl font-black text-slate-500">-</span><span class="text-4xl font-black text-white drop-shadow">${m.goalsThem}</span></div>
                    <div class="flex flex-col items-center w-24"><div class="w-14 h-20 mb-3 drop-shadow-lg">${window.generateKitSVG(m.oppColor||'#ff0000', m.oppColor||'#ff0000', m.oppShorts||m.oppColor||'#ff0000', m.oppSocks||m.oppColor||'#ff0000')}</div><p class="text-base font-black uppercase text-slate-300 w-full text-center truncate drop-shadow">${m.opponent.substring(0,10)}</p></div>
                </div>
                ${evH}
                <div class="absolute bottom-4 text-[7px] text-brand-200/50 font-black tracking-widest uppercase">NISUS FC PREMIUM</div>
            </div>
        </div>`;
    document.getElementById('modalMatchResult').classList.remove('hidden');
    document.getElementById('btn-download-result').onclick = function() {
        const node = document.getElementById('match-result-node'); const btn = this; btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Generando...';
        html2canvas(node, { backgroundColor:'#082f49', scale:3, useCORS:true, allowTaint:true }).then(cv => { const a = document.createElement('a'); a.download=`Resultado_NISUS_vs_${m.opponent.replace(/\s+/g,'_')}.png`; a.href=cv.toDataURL('image/png'); a.click(); btn.innerHTML = '<i class="fas fa-check mr-2"></i>¡Descargado!'; setTimeout(()=>btn.innerHTML='<i class="fas fa-share-alt mr-2"></i>Compartir Resultado',2000); }).catch(e=>{ window.showToast("Error",true); btn.innerHTML='<i class="fas fa-share-alt mr-2"></i>Compartir Resultado'; });
    };
};

window.openSeasonCloseModal = function() {
    if (!window.isAdmin) return window.showToast('Solo administradores', true);
    
    const unassignedMatches = (window.matches || []).filter(m => !m.season || m.season.trim() === '' || m.season === 'all');
    if (unassignedMatches.length === 0) {
        return window.showToast('No hay partidos sin temporada para archivar', true);
    }

    const finishedMatches = unassignedMatches.filter(m => m.status === 'finished' || m.status === 'forfait');
    
    let w = 0, d = 0, l = 0, gf = 0, gc = 0;
    finishedMatches.forEach(m => {
        if (m.status === 'forfait') { w++; gf+=3; }
        else {
            const us = parseInt(m.goalsUs)||0, them = parseInt(m.goalsThem)||0;
            gf += us; gc += them;
            if (us > them) w++; else if (us < them) l++; else d++;
        }
    });

    const summaryEl = document.getElementById('season-close-summary');
    if (summaryEl) {
        summaryEl.innerHTML = `
            <p class="font-black text-purple-700 dark:text-purple-400 mb-3 uppercase tracking-widest text-[10px]">Resumen a archivar:</p>
            <ul class="space-y-2 text-slate-700 dark:text-slate-300 font-bold text-xs">
                <li><i class="fas fa-futbol text-slate-400 mr-2 w-4"></i> ${unassignedMatches.length} partidos totales (${w}V - ${d}E - ${l}D)</li>
                <li><i class="fas fa-bullseye text-slate-400 mr-2 w-4"></i> ${gf} Goles a favor / ${gc} Goles en contra</li>
                <li class="mt-2 pt-2 border-t border-purple-200 dark:border-purple-800/50 text-purple-600 dark:text-purple-400 italic">⚠️ Las finanzas y deudas no se borran, se mantienen continuas.</li>
            </ul>
        `;
    }
    
    document.getElementById('season-close-name').value = '';
    document.getElementById('modalSeasonClose').classList.remove('hidden');
};

window.executeSeasonClose = async function() {
    if (!window.isAdmin) return window.showToast('Solo administradores', true);
    const name = document.getElementById('season-close-name').value.trim();
    if (!name) return window.showToast('Ingresa un nombre para la temporada', true);

    const btn = document.getElementById('btn-confirm-season');
    btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Archivando...';

    const unassignedMatches = (window.matches || []).filter(m => !m.season || m.season.trim() === '' || m.season === 'all');
    const batch = db.batch();

    unassignedMatches.forEach(m => {
        const ref = db.collection(window.matchesPath).doc(m.id);
        batch.update(ref, { season: name });
    });

    try {
        await batch.commit();
        window.showToast('¡Temporada archivada con éxito!');
        document.getElementById('modalSeasonClose').classList.add('hidden');
        window.currentSeason = 'all'; 
        window.updateSeasonDropdown();
        window.setSeasonFilter('all');
    } catch(e) {
        window.showToast('Error al archivar la temporada', true);
    } finally {
        btn.disabled = false; btn.innerHTML = '<i class="fas fa-archive"></i> Archivar Temporada';
    }
};

window.openArchiveCompetition = function() {
    if (!window.isAdmin) {
        if (typeof window.showToast === 'function') window.showToast('Solo administradores', true);
        return;
    }
    
    const comps = [...new Set((window.matches || [])
        .filter(m => (m.status === 'finished' || m.status === 'forfait') && m.tournament)
        .map(m => m.tournament))];
        
    const select = document.getElementById('comp-archive-select');
    if (!select) return;
    
    select.innerHTML = '<option value="">-- Selecciona un torneo --</option>';
    comps.forEach(c => { select.innerHTML += `<option value="${c}">${c}</option>`; });
    if (comps.length === 0) select.innerHTML = '<option value="">No hay torneos activos para cerrar</option>';
    
    const modal = document.getElementById('modal-archive-comp');
    if (!modal) return;
    
    modal.classList.remove('hidden');
};

window.confirmArchiveCompetition = async function() {
    if (!window.isAdmin) return;
    const comp = document.getElementById('comp-archive-select').value;
    if (!comp) return window.showToast('Debes seleccionar un torneo', true);
    
    if (!confirm(`¿Confirmas que deseas cerrar definitivamente la competición "${comp}"?\n\nSus estadísticas desaparecerán del rendimiento actual.`)) return;
    
    const btn = document.getElementById('btn-archive-comp');
    btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
    
    try {
        const matchesToArchive = window.matches.filter(m => m.tournament === comp && (m.status === 'finished' || m.status === 'forfait'));
        const batch = db.batch(); 
        
        matchesToArchive.forEach(m => {
            const ref = db.collection(window.matchesPath || 'matches').doc(m.id);
            batch.update(ref, { status: 'archived' });
        });
        
        await batch.commit();
        window.showToast(`¡El torneo "${comp}" ha sido cerrado con éxito!`);
        document.getElementById('modal-archive-comp').classList.add('hidden');
        
        if (typeof window.renderMatches === 'function') window.renderMatches();
        if (typeof window.renderPlayers === 'function') window.renderPlayers();
        if (typeof window.updateDashboard === 'function') window.updateDashboard();
        
    } catch (error) {
        window.showToast('Hubo un error', true);
    } finally {
        btn.disabled = false; btn.innerHTML = '<i class="fas fa-check-circle"></i> Archivar';
    }
};

window.switchMatchesTab = function(tab) {
    const activeBtn = document.getElementById('btn-tab-active');
    const archBtn = document.getElementById('btn-tab-archived');
    const activeView = document.getElementById('view-active-matches');
    const archView = document.getElementById('view-archived-matches');

    if (!activeBtn || !archBtn) return;

    if (tab === 'active') {
        activeBtn.className = "flex-1 sm:flex-none px-5 py-2.5 rounded-lg text-xs font-black transition bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm";
        archBtn.className = "flex-1 sm:flex-none px-5 py-2.5 rounded-lg text-xs font-black transition text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200";
        if(activeView) activeView.classList.remove('hidden');
        if(archView) archView.classList.add('hidden');
    } else {
        archBtn.className = "flex-1 sm:flex-none px-5 py-2.5 rounded-lg text-xs font-black transition bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm";
        activeBtn.className = "flex-1 sm:flex-none px-5 py-2.5 rounded-lg text-xs font-black transition text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200";
        if(archView) archView.classList.remove('hidden');
        if(activeView) activeView.classList.add('hidden');
        window.renderArchivedTournaments();
    }
};

window.renderArchivedTournaments = function() {
    const container = document.getElementById('archived-tournaments-list');
    if (!container) return;
    container.innerHTML = '';

    const archivedMatches = (window.matches || []).filter(m => m.status === 'archived' && m.tournament);
    
    if (archivedMatches.length === 0) {
        container.innerHTML = '<div class="col-span-full py-12 text-center text-slate-500 font-medium bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800"><i class="fas fa-folder-open text-3xl mb-3 text-slate-300 dark:text-slate-700 block"></i> No hay torneos cerrados aún.</div>';
        return;
    }

    const tourneys = {};
    archivedMatches.forEach(m => {
        if (!tourneys[m.tournament]) tourneys[m.tournament] = { pj:0, pg:0, pe:0, pp:0, gf:0, gc:0 };
        tourneys[m.tournament].pj++;
        
        const us = parseInt(m.goalsUs)||0;
        const them = parseInt(m.goalsThem)||0;
        tourneys[m.tournament].gf += us;
        tourneys[m.tournament].gc += them;
        
        if (us > them) tourneys[m.tournament].pg++;
        else if (us < them) tourneys[m.tournament].pp++;
        else tourneys[m.tournament].pe++;
    });

    Object.keys(tourneys).forEach(name => {
        const t = tourneys[name];
        const pts = (t.pg * 3) + (t.pe * 1);
        const df = t.gf - t.gc;
        
        container.innerHTML += `
            <div class="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:shadow-md transition">
                <div class="absolute top-0 right-0 w-24 h-24 bg-brand-50 dark:bg-brand-900/20 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
                
                <h4 class="font-black text-slate-800 dark:text-white text-lg mb-4 flex items-start gap-2">
                    <i class="fas fa-trophy text-orange-500 mt-1"></i> 
                    <span class="leading-tight">${name} <span class="block text-[9px] text-slate-400 tracking-widest uppercase mt-1">Torneo Cerrado</span></span>
                </h4>
                
                <div class="grid grid-cols-4 gap-2 text-center mb-4">
                    <div class="bg-slate-50 dark:bg-slate-800/50 rounded-xl py-2.5 border border-slate-100 dark:border-slate-800">
                        <p class="text-[9px] font-bold text-slate-400 uppercase">PJ</p>
                        <p class="font-black text-lg text-slate-700 dark:text-slate-300">${t.pj}</p>
                    </div>
                    <div class="bg-green-50 dark:bg-green-900/20 rounded-xl py-2.5 border border-green-100 dark:border-green-900/30">
                        <p class="text-[9px] font-bold text-green-600/70 dark:text-green-500/70 uppercase">PG</p>
                        <p class="font-black text-lg text-green-600 dark:text-green-500">${t.pg}</p>
                    </div>
                    <div class="bg-slate-50 dark:bg-slate-800/50 rounded-xl py-2.5 border border-slate-100 dark:border-slate-800">
                        <p class="text-[9px] font-bold text-slate-400 uppercase">PE</p>
                        <p class="font-black text-lg text-slate-500">${t.pe}</p>
                    </div>
                    <div class="bg-red-50 dark:bg-red-900/20 rounded-xl py-2.5 border border-red-100 dark:border-red-900/30">
                        <p class="text-[9px] font-bold text-red-600/70 dark:text-red-500/70 uppercase">PP</p>
                        <p class="font-black text-lg text-red-600 dark:text-red-500">${t.pp}</p>
                    </div>
                </div>
                
                <div class="flex justify-between items-center text-xs font-bold bg-slate-100 dark:bg-slate-800 px-4 py-3 rounded-xl">
                    <span class="text-slate-500 dark:text-slate-400">GF: ${t.gf} <span class="mx-1 opacity-50">|</span> GC: ${t.gc} <span class="mx-1 opacity-50">|</span> DIF: <span class="${df > 0 ? 'text-green-500' : (df < 0 ? 'text-red-500' : '')}">${df > 0 ? '+'+df : df}</span></span>
                    <span class="text-brand-600 dark:text-brand-400 text-sm bg-brand-50 dark:bg-brand-900/30 px-2 py-1 rounded-lg">PTS: ${pts}</span>
                </div>
            </div>
        `;
    });
};

/* -----------------------------------------------------
   INICIALIZACIÓN Y OPTIMIZACIÓN DE RENDIMIENTO
------------------------------------------------------ */
// ==========================================
// DASHBOARD Y GRÁFICOS (RESTAURADO)
// ==========================================
window.renderBirthdaysAvailability = function() {
    const allPlayers = (window.players || []).filter(p => p && !p.isStaff); 
    const bEl = document.getElementById('birthdays-strip');
    if(bEl) {
        const today = new Date(); const ty = today.getFullYear();
        const upcoming = allPlayers.filter(p => p.birthdate && typeof p.birthdate === 'string' && p.birthdate.includes('-')).map(p => {
            const parts = p.birthdate.split('-'); const bm = parseInt(parts[1])-1, bd = parseInt(parts[2]);
            let next = new Date(ty, bm, bd);
            const days = Math.ceil((next - today) / (1000*60*60*24));
            if (days < 0) { next = new Date(ty+1, bm, bd); }
            const dCalc = Math.ceil((next - today) / (1000*60*60*24));
            return { p, dCalc, next };
        }).sort((a,b)=>a.dCalc-b.dCalc).slice(0,6);
        
        bEl.innerHTML = '';
        if(upcoming.length===0) bEl.innerHTML='<p class="text-sm text-slate-500 dark:text-slate-400 italic font-medium py-2 px-1">Sin fechas de nacimiento registradas</p>';
        else upcoming.forEach(item => {
            const p = item.p; 
            const validName = (typeof p.name === 'string' && p.name.trim() !== '') ? p.name.trim() : '?';
            const ini = validName.charAt(0).toUpperCase();
            const img = p.image ? `<img src="${p.image}" class="w-10 h-10 rounded-full object-cover">` : `<div class="w-10 h-10 rounded-full bg-pink-100 dark:bg-pink-900/30 text-pink-600 font-black flex items-center justify-center text-xs">${ini}</div>`;
            const dStr = item.next.toLocaleDateString('es-ES', {day:'numeric', month:'short'}); const isToday = item.dCalc === 0;
            const badge = isToday ? `<span class="bg-pink-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider">¡Hoy!</span>` : `<span class="text-[10px] font-bold text-slate-400">${item.dCalc}d</span>`;
            bEl.innerHTML += `<div class="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl p-2.5 border border-slate-100 dark:border-slate-800 shrink-0 min-w-[180px] ${isToday?'ring-2 ring-pink-400':''}"><div class="relative">${img}${isToday?'<div class="absolute -top-1 -right-1 text-sm">🎂</div>':''}</div><div class="flex-1 min-w-0"><p class="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">${validName}</p><div class="flex items-center gap-2 mt-0.5"><span class="text-[10px] font-bold text-pink-500">${dStr}</span>${badge}</div></div></div>`;
        });
    }

    const aEl = document.getElementById('availability-strip');
    if(aEl) {
        const statusMap = { injured: { lbl:'Lesión', icon:'fa-briefcase-medical', col:'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/50' }, suspended: { lbl:'Sanción', icon:'fa-gavel', col:'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800/50' }, absent: { lbl:'Ausente', icon:'fa-plane', col:'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600' }, inactive: { lbl:'Inactivo', icon:'fa-pause-circle', col:'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-700' } };
        const unavailable = allPlayers.filter(p => p.status && p.status !== 'active');
        const activeCount = allPlayers.length - unavailable.length;
        aEl.innerHTML = '';
        aEl.innerHTML += `<div class="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-3 py-2 rounded-xl border border-green-200 dark:border-green-800/50 font-bold text-xs"><i class="fas fa-check-circle"></i> ${activeCount} disponibles</div>`;
        if(unavailable.length === 0) { aEl.innerHTML += `<p class="text-sm text-slate-500 dark:text-slate-400 italic font-medium self-center">Plantel completo</p>`; } 
        else { 
            unavailable.sort((a,b)=>((a.name||'').localeCompare(b.name||''))).forEach(p => { 
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
    
    window.renderBirthdaysAvailability();

    let tG=0, tA=0, pL = window.players.filter(p=>!p.isStaff); if(window.currentFilter==='f11') pL = pL.filter(p=>p.availableF11); if(window.currentFilter==='f7') pL = pL.filter(p=>p.availableF7);
    let aG = 0; list.forEach(m => { if(m.status === 'forfait') aG += 3; });
    pL.forEach(p => { tG += window.getPlayerStat(p,'goals') + window.getPlayerArchivedStat(p, 'goals'); tA += window.getPlayerStat(p,'assists') + window.getPlayerArchivedStat(p, 'assists'); });
    
    const eTG = document.getElementById('stat-total-goals'); if(eTG) eTG.textContent = tG + aG;
    const eTA = document.getElementById('stat-total-assists'); if(eTA) eTA.textContent = tA;
    
    let tCS=0, maxGames=0, ironMan="--";
    pL.forEach(p => { 
        const g = window.getPlayerStat(p,'games') + window.getPlayerArchivedStat(p, 'games');
        if(g > maxGames) { maxGames = g; ironMan = (p.showAlias && p.alias) ? p.alias : (p.name || 'N/A').split(' ')[0]; }
        tCS += window.getPlayerStat(p,'cleanSheets') + window.getPlayerArchivedStat(p, 'cleanSheets'); 
    });
    
    const eTGm = document.getElementById('stat-total-games'); 
    if(eTGm) { if(eTGm.previousElementSibling) eTGm.previousElementSibling.textContent = "MÁS PARTIDOS (JUGADOR)"; eTGm.innerHTML = `${maxGames} <span class="text-sm font-bold text-brand-500 ml-1 truncate">${ironMan}</span>`; }
    const eTCS = document.getElementById('stat-total-cleansheets'); if(eTCS) eTCS.textContent = tCS;
    
    const getCombinedStat = (p, stat) => window.getPlayerStat(p, stat) + window.getPlayerArchivedStat(p, stat);

    const rL = (arr, k, el) => {
        const d = document.getElementById(el); if(!d)return; d.innerHTML='';
        arr.forEach((p,i) => { 
            const v = getCombinedStat(p, k); if(v===0)return; 
            const validName = (typeof p.name === 'string' && p.name.trim() !== '') ? p.name.trim() : '?';
            const img = p.image?`<img src="${p.image}" class="w-8 h-8 rounded-full object-cover shadow-sm">`:`<div class="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/50 text-brand-600 font-black flex items-center justify-center text-xs shadow-sm">${validName.charAt(0).toUpperCase()}</div>`; 
            d.innerHTML+=`<tr class="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition"><td class="px-6 py-3 w-10 text-slate-400 font-black">${i+1}</td><td class="px-6 py-3 flex items-center gap-3">${img} <span class="font-bold text-xs text-slate-800 dark:text-slate-200">${validName}</span></td><td class="px-6 py-3 text-right font-black text-lg text-slate-900 dark:text-white">${v}</td></tr>`; 
        });
        if(d.innerHTML==='') d.innerHTML='<tr><td colspan="3" class="px-6 py-5 text-center text-sm text-slate-500 font-medium">Sin registros</td></tr>';
    };
    
    rL([...pL].sort((a,b)=>getCombinedStat(b,'goals')-getCombinedStat(a,'goals')).slice(0,4), 'goals', 'top-scorers-list');
    rL([...pL].sort((a,b)=>getCombinedStat(b,'assists')-getCombinedStat(a,'assists')).slice(0,4), 'assists', 'top-assists-list');
    rL([...pL].sort((a,b)=>getCombinedStat(b,'goals')-getCombinedStat(a,'goals')).slice(0,5), 'goals', 'stats-scorers-list');
    rL([...pL].sort((a,b)=>getCombinedStat(b,'assists')-getCombinedStat(a,'assists')).slice(0,5), 'assists', 'stats-assists-list');
    rL([...pL].sort((a,b)=>getCombinedStat(b,'games')-getCombinedStat(a,'games')).slice(0,5), 'games', 'stats-games-list');

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
            const g = getCombinedStat(p,'goals'), a = getCombinedStat(p,'assists'), gp = getCombinedStat(p,'games'), m = getCombinedStat(p,'mvps'); 
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
    
    setTimeout(() => { if (typeof window.renderCashflowChart === 'function') window.renderCashflowChart(); if (typeof window.renderExpensesDonutChart === 'function') window.renderExpensesDonutChart(); }, 150);
};

window.cashflowCharts = [];
window.renderCashflowChart = function() {
    if (window.cashflowCharts.length > 0) { window.cashflowCharts.forEach(c => c.destroy()); }
    window.cashflowCharts = [];
    if (typeof Chart === 'undefined') return;

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

    const chartConfig = {
        type: 'bar',
        data: { labels, datasets: [{ label: 'Ingresos reales', data: incomeData, backgroundColor: '#22c55e', borderRadius: 6 }, { label: 'Egresos', data: expenseData, backgroundColor: '#ef4444', borderRadius: 6 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: textColor, font: {size: 10, weight: 'bold'} } } }, scales: { y: { beginAtZero: true, grid: { color: gridColor }, ticks: {color: textColor} }, x: { grid: { display: false }, ticks: {color: textColor} } } }
    };

    ['cashflow-chart-dash', 'cashflow-chart-fin'].forEach(id => {
        const canvas = document.getElementById(id);
        if (canvas) window.cashflowCharts.push(new Chart(canvas, chartConfig));
    });
};

window.donutCharts = [];
window.renderExpensesDonutChart = function() {
    if (window.donutCharts.length > 0) { window.donutCharts.forEach(c => c.destroy()); }
    window.donutCharts = [];
    if (typeof Chart === 'undefined') return;
    
    const expenseCategories = {};
    window.finances.forEach(t => {
        if (t.type === 'expense') {
            const amt = window.getValidCashAmount(t);
            if (amt > 0) expenseCategories[t.category] = (expenseCategories[t.category] || 0) + amt;
        }
    });

    const labels = Object.keys(expenseCategories), data = Object.values(expenseCategories);
    const bgColors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'];
    const isDark = document.documentElement.classList.contains('dark'), textColor = isDark ? '#94a3b8' : '#64748b';
    
    const chartConfig = {
        type: 'doughnut',
        data: { labels: labels.length ? labels : ['Sin egresos registrados'], datasets: [{ data: data.length ? data : [1], backgroundColor: data.length ? bgColors : [isDark ? '#334155' : '#e2e8f0'], borderWidth: 0, hoverOffset: 6 }] },
        options: { responsive: true, maintainAspectRatio: false, cutout: '75%', plugins: { legend: { position: 'bottom', labels: { color: textColor, font: {size: 10, weight: 'bold'}, boxWidth: 12 } } } }
    };

    ['expenses-donut-chart-dash', 'expenses-donut-chart-fin'].forEach(id => {
        const canvas = document.getElementById(id);
        if (canvas) window.donutCharts.push(new Chart(canvas, chartConfig));
    });
};
window.checkAutoActivations = async function() {
    if (!window.isAdmin) return; const t = new Date().toISOString().split('T')[0]; const u = [];
    window.players.forEach(p => { if ((p.status === 'injured' || p.status === 'absent' || p.status === 'inactive') && p.returnDate && t >= p.returnDate) u.push(db.collection(window.playersPath).doc(p.id).set({ status: 'active', returnDate: null }, { merge: true })); });
    if (u.length > 0) { try { await Promise.all(u); window.showToast(`Se activaron automáticamente ${u.length} jugador(es)`); } catch (e) { console.error(e); } }
};

async function loadInitialData() {
    const el = document.getElementById('next-match-date'); if(el) el.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Descargando datos...';
    try {
        const [p, m, t, f] = await Promise.all([ db.collection(window.playersPath).get(), db.collection(window.matchesPath).get(), db.collection(window.trainingsPath).get(), db.collection(window.financesPath).get() ]);
        window.players=[]; p.forEach(d=>window.players.push({...d.data(), id:d.id}));
        window.matches=[]; m.forEach(d=>window.matches.push({...d.data(), id:d.id}));
        window.trainings=[]; t.forEach(d=>window.trainings.push({...d.data(), id:d.id}));
        window.finances=[]; f.forEach(d=>window.finances.push({...d.data(), id:d.id}));
        window.isReady = true; window.updateSeasonDropdown(); window.checkAutoActivations();
        window.showSection('dashboard');
        if(el) el.innerHTML = '<i class="fas fa-check-circle mr-2 text-green-400"></i> Datos listos';
    } catch(e) { if(el) el.innerHTML = '<i class="fas fa-exclamation-triangle mr-2 text-red-400"></i> Error de conexión'; console.error(e); }
}

function debounceRender(func, wait = 150) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

const safeUpdateDashboard = debounceRender(() => { if(!document.getElementById('dashboard').classList.contains('hidden') || !document.getElementById('stats').classList.contains('hidden')) window.updateDashboard(); });
const safeRenderPlayers = debounceRender(() => { if(!document.getElementById('players').classList.contains('hidden')) { window.renderPlayers(); window.renderBirthdaysAvailability(); } });
const safeRenderMatches = debounceRender(() => { if(!document.getElementById('matches').classList.contains('hidden')) window.renderMatches(); });
const safeRenderTrainings = debounceRender(() => { if(!document.getElementById('attendance').classList.contains('hidden')) window.renderTrainings(); });
const safeRenderFinances = debounceRender(() => { if(!document.getElementById('finances').classList.contains('hidden')) window.renderFinances(); });

function setupRealtimeListeners() {
    const sId = window.generateId(); const pRef = db.collection('sistema').doc('presencia_' + sId);
    setInterval(() => { if(document.visibilityState === 'visible') pRef.set({ lastSeen: Date.now() }).catch(()=>{}); }, 30000);
    pRef.set({ lastSeen: Date.now() });
    
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') pRef.delete().catch(()=>{}); else pRef.set({ lastSeen: Date.now() }).catch(()=>{}); });
    window.addEventListener('beforeunload', () => pRef.delete());
    
    db.collection('sistema').onSnapshot((s) => {
        let o = 0; const n = Date.now();
        s.forEach(d => { if(d.id.startsWith('presencia_')) { if (n - d.data().lastSeen < 120000) o++; else d.ref.delete(); } });
        const c = document.getElementById('online-count'); if(c) c.textContent = o;
    });

    db.collection(window.playersPath).onSnapshot((s) => { 
        if(!window.isReady) return; 
        window.players = []; s.forEach(d => window.players.push({ ...d.data(), id: d.id })); 
        window.checkAutoActivations(); 
        safeRenderPlayers(); safeUpdateDashboard(); safeRenderFinances();
        if(!document.getElementById('matchForm').classList.contains('hidden')) window.renderCallupList(); 
        if(!document.getElementById('attendanceForm').classList.contains('hidden')) window.renderAttendanceChecklist(); 
    });
    
    db.collection(window.matchesPath).onSnapshot((s) => { 
        if(!window.isReady) return; 
        window.matches = []; s.forEach(d => window.matches.push({ ...d.data(), id: d.id })); 
        window.updateSeasonDropdown(); 
        safeRenderMatches(); safeUpdateDashboard(); safeRenderPlayers(); safeRenderFinances(); 
    });
    
    db.collection(window.trainingsPath).onSnapshot((s) => { 
        if(!window.isReady) return; 
        window.trainings = []; s.forEach(d => window.trainings.push({ ...d.data(), id: d.id })); 
        safeRenderTrainings(); safeRenderPlayers(); safeUpdateDashboard(); 
    });
    
    db.collection(window.financesPath).onSnapshot((s) => { 
        if(!window.isReady) return; 
        window.finances = []; s.forEach(d => window.finances.push({ ...d.data(), id: d.id })); 
        safeRenderFinances(); 
    });
}

window.initApp = async function() { 
    if(window.appInitialized) return; window.appInitialized = true;
    
    await loadInitialData(); 
    setupRealtimeListeners(); 
    window.setupPWA(); 
    window.updateAdminUI(); 
    document.addEventListener('mousemove', window.dragMove); 
    document.addEventListener('mouseup', window.dragEnd); 
    const p = document.getElementById('tactical-pitch'); 
    if(p) { p.addEventListener('touchmove', window.dragMove, {passive: false}); p.addEventListener('touchend', window.dragEnd); } 
};

if (document.readyState === 'loading') { 
    document.addEventListener('DOMContentLoaded', window.initApp); 
} else { 
    window.initApp(); 
}
