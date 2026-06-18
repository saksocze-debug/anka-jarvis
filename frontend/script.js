/* ═══ ANKA script.js v3 ═══
   - Mobil + masaüstü ses tanıma (düzeltilmiş)
   - PC: erkek ses, Telefon: kadın ses (otomatik)
   - CSS bar görselleştirici (canvas yok, mobil uyumlu)
   - Dünya hologramı tıklama efektleri
   - YouTube arama desteği
*/

'use strict';

// ─── State ───────────────────────────────────────────────
const ST = {
  convId:      null,
  settings:    {},
  rate:        0.88,
  pitch:       0.78,
  recognizing: false,
  speaking:    false,
  voices:      [],
  voiceModel:  'auto',   // auto | tr-male | tr-female | en-male | en-female
  barAnim:     null,
  barPhase:    0,
  isMobile:    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
};

// ─── DOM ─────────────────────────────────────────────────
const $  = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);
const ts = () => new Date().toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'});

// ─── API ─────────────────────────────────────────────────
async function api(path, opts = {}) {
  const res = await fetch('/api' + path, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined
  });
  if (!res.ok) throw new Error((await res.json()).error || res.statusText);
  return res.json();
}

// ─── Saat ────────────────────────────────────────────────
function tickClock() {
  const n = new Date();
  $('clock-time').textContent = n.toLocaleTimeString('tr-TR');
  $('clock-date').textContent = n.toLocaleDateString('tr-TR',{weekday:'short',day:'2-digit',month:'short'}).toUpperCase();
}
setInterval(tickClock, 1000);
tickClock();

// ─── Nav ─────────────────────────────────────────────────
$$('.ni').forEach(b => {
  b.addEventListener('click', () => {
    $$('.ni').forEach(x => x.classList.remove('active'));
    $$('.view').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    document.getElementById('view-' + b.dataset.v).classList.add('active');
  });
});

// ─── Parçacıklar ─────────────────────────────────────────
function spawnParticles(n = 8) {
  const wrap = $('ptcl-wrap');
  for (let i = 0; i < n; i++) {
    const el = document.createElement('div');
    el.className = 'pt';
    const sz  = (Math.random() * 6 + 3).toFixed(1);
    const blu = Math.random() > 0.45;
    const clr = blu ? '#00d4ff' : '#ff6600';
    el.style.cssText = `
      width:${sz}px;height:${sz}px;
      left:${20 + Math.random() * 60}%;
      bottom:${15 + Math.random() * 40}%;
      background:${clr};
      box-shadow:0 0 ${parseFloat(sz)*2}px ${clr};
      --d:${(0.6 + Math.random() * 1).toFixed(2)}s;
      animation-delay:${(Math.random() * 0.3).toFixed(2)}s
    `;
    wrap.appendChild(el);
    setTimeout(() => el.remove(), 1800);
  }
}
setInterval(() => spawnParticles(3), 900);

// ─── Hologram tıklama ────────────────────────────────────
const globeWrap = $('globe-wrap');

globeWrap.addEventListener('click', handleGlobeClick);
globeWrap.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    handleGlobeClick();
  }
});

function handleGlobeClick() {
  // Burst efekti
  globeWrap.classList.remove('bursting');
  void globeWrap.offsetWidth; // reflow
  globeWrap.classList.add('bursting');
  setTimeout(() => globeWrap.classList.remove('bursting'), 1100);

  // Parçacıklar
  spawnParticles(18);

  // Ses efekti
  playSonicClick();

  // Mikrofonu başlat
  if (!ST.recognizing) {
    startMic();
  } else {
    stopMic();
  }
}

function playSonicClick() {
  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
    osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.32);
    gain.gain.setValueAtTime(0.28, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
    setTimeout(() => ctx.close(), 600);
  } catch (_) {}
}

// ─── CSS Bar Görselleştirici (Canvas yok, mobil uyumlu) ──
const BAR_COUNT = 28;
let bars = [];

function initBars() {
  const wrap = $('vis-bars');
  if (!wrap) return;
  wrap.innerHTML = '';
  bars = [];
  for (let i = 0; i < BAR_COUNT; i++) {
    const b = document.createElement('div');
    b.className = 'vbar';
    b.style.height = '3px';
    wrap.appendChild(b);
    bars.push(b);
  }
}
initBars();

function animateBars() {
  if (!$('vis-wrap').classList.contains('show')) {
    ST.barAnim = requestAnimationFrame(animateBars);
    return;
  }
  ST.barPhase += 0.15;
  const p = ST.barPhase;
  bars.forEach((b, i) => {
    const h = Math.abs(Math.sin((i * 0.35) + p)) * 34
            + Math.abs(Math.sin((i * 0.18) + p * 1.3)) * 14
            + Math.random() * 6;
    b.style.height = Math.max(2, Math.min(44, h)).toFixed(0) + 'px';
    const ratio = h / 44;
    const r  = Math.round(255 * (1 - ratio) + 0  * ratio);
    const g  = Math.round(100 * (1 - ratio) + 212 * ratio);
    const bv = Math.round(0   * (1 - ratio) + 255 * ratio);
    b.style.background = `rgb(${r},${g},${bv})`;
    b.style.boxShadow  = `0 0 5px rgb(${r},${g},${bv})`;
  });
  ST.barAnim = requestAnimationFrame(animateBars);
}

function showVisualizer() {
  $('vis-wrap').classList.add('show');
  if (!ST.barAnim) animateBars();
}
function hideVisualizer() {
  $('vis-wrap').classList.remove('show');
}

// ─── Durum metni ─────────────────────────────────────────
function setStatus(txt, active = false) {
  const el = $('globe-status');
  el.textContent = txt;
  el.classList.toggle('active', active);
}

// ─── TTS — Ses Seçimi ────────────────────────────────────
function loadVoices() {
  const vs = window.speechSynthesis.getVoices();
  if (vs.length) ST.voices = vs;
}

if ('speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = loadVoices;
  setTimeout(loadVoices, 300);
  setTimeout(loadVoices, 1000);
  setTimeout(loadVoices, 2500);
}

function selectVoice() {
  const voices = ST.voices;
  if (!voices.length) return null;

  const model = ST.voiceModel;

  // Otomatik: PC → erkek, Mobil → kadın
  if (model === 'auto') {
    return ST.isMobile ? findVoice('tr', 'female') || findVoice('tr', null)
                       : findVoice('tr', 'male')   || findVoice('tr', null);
  }

  const [lang, gender] = model.split('-'); // 'tr','male' gibi
  return findVoice(lang, gender) || null;
}

function findVoice(lang, gender) {
  const voices = ST.voices;
  const MALE_KW   = ['male','man','david','mark','james','paul','george','erkek'];
  const FEMALE_KW = ['female','woman','girl','zira','susan','eva','hazel','karen','kadın'];

  // Dil eşleşmesi
  const langMap = { tr: 'tr', en: 'en' };
  const prefix  = langMap[lang] || lang;
  let pool = voices.filter(v => v.lang.toLowerCase().startsWith(prefix));
  if (!pool.length) pool = voices; // fallback: hepsi

  if (gender === 'male') {
    const m = pool.find(v => MALE_KW.some(k => v.name.toLowerCase().includes(k)));
    if (m) return m;
    // Son çare: dişi anahtar kelimesi olmayan ilk ses
    return pool.find(v => !FEMALE_KW.some(k => v.name.toLowerCase().includes(k))) || pool[0];
  }
  if (gender === 'female') {
    const f = pool.find(v => FEMALE_KW.some(k => v.name.toLowerCase().includes(k)));
    if (f) return f;
    return pool[pool.length - 1] || null;
  }
  return pool[0] || null;
}

function speak(text) {
  if (!('speechSynthesis' in window) || !text) return;

  // Önceki konuşmayı durdur
  window.speechSynthesis.cancel();

  // Kısa gecikme — özellikle mobilde cancel'dan hemen sonra speak çalışmayabiliyor
  setTimeout(() => {
    const utt  = new SpeechSynthesisUtterance(text);
    const voice = selectVoice();
    if (voice) utt.voice = voice;
    utt.lang   = 'tr-TR';
    utt.rate   = ST.rate;
    utt.pitch  = ST.pitch;
    utt.volume = 1.0;

    utt.onstart = () => {
      ST.speaking = true;
      setStatus('Konuşuyor…');
    };
    utt.onend = () => {
      ST.speaking = false;
      setStatus('Hazır');
    };
    utt.onerror = () => {
      ST.speaking = false;
      setStatus('Hazır');
    };

    // iOS Safari fix: kısa sessizlik ekleme
    if (/iPhone|iPad/i.test(navigator.userAgent)) {
      const silence = new SpeechSynthesisUtterance(' ');
      silence.volume = 0;
      window.speechSynthesis.speak(silence);
    }

    window.speechSynthesis.speak(utt);

    // iOS 'ölü konuşma' hatası için keepalive
    const keepAlive = setInterval(() => {
      if (!window.speechSynthesis.speaking) { clearInterval(keepAlive); return; }
      window.speechSynthesis.pause();
      window.speechSynthesis.resume();
    }, 10000);
    utt.onend   = () => { clearInterval(keepAlive); ST.speaking = false; setStatus('Hazır'); };
    utt.onerror = () => { clearInterval(keepAlive); ST.speaking = false; setStatus('Hazır'); };
  }, 80);
}

// ─── Speech Recognition ──────────────────────────────────
let SREngine = null;

function buildRecognition() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return null;

  const r = new SR();
  r.lang = 'tr-TR';
  r.continuous = false;
  r.interimResults = false;
  r.maxAlternatives = 1;

  r.onstart = () => {
    ST.recognizing = true;
    $('mic-btn').classList.add('on');
    globeWrap.classList.add('listening');
    setStatus('Dinliyorum…', true);
    showVisualizer();
    $('status-lbl').textContent = 'DİNLİYOR';
  };

  r.onresult = e => {
    const text = e.results[0]?.[0]?.transcript?.trim();
    if (text) {
      $('chat-in').value = text;
      sendMessage(text);
    }
  };

  r.onerror = e => {
    console.warn('[SR] hata:', e.error);
    stopListeningUI();
    if (e.error === 'not-allowed') {
      setStatus('Mikrofon izni gerekli');
    } else if (e.error === 'no-speech') {
      setStatus('Ses algılanamadı');
    } else {
      setStatus('Hazır');
    }
  };

  r.onend = () => {
    // onresult'tan sonra da tetiklenir — sadece UI'ı kapat
    stopListeningUI();
  };

  return r;
}

function stopListeningUI() {
  ST.recognizing = false;
  $('mic-btn').classList.remove('on');
  globeWrap.classList.remove('listening');
  hideVisualizer();
  $('status-lbl').textContent = 'AKTİF';
  if (!ST.speaking) setStatus('Hazır');
}

function startMic() {
  // TTS konuşuyorsa durdur
  if (ST.speaking) {
    window.speechSynthesis.cancel();
    ST.speaking = false;
  }

  // Her seferinde taze bir recognition nesnesi oluştur (mobil uyumluluğu için)
  SREngine = buildRecognition();

  if (!SREngine) {
    alert('Tarayıcınız sesli komut desteklemiyor. Lütfen Chrome kullanın.');
    return;
  }

  try {
    SREngine.start();
  } catch (e) {
    console.warn('[SR] start hatası:', e.message);
    stopListeningUI();
  }
}

function stopMic() {
  if (SREngine) {
    try { SREngine.stop(); } catch (_) {}
    SREngine = null;
  }
  stopListeningUI();
}

$('mic-btn').addEventListener('click', () => {
  if (ST.recognizing) stopMic();
  else startMic();
});

// ─── YouTube ─────────────────────────────────────────────
function handleYouTube(text) {
  const pats = [
    /youtube(?:'?[dD][aA]|'?[dD][eE])?\s+(.+?)\s*(?:aç|çal|oynat|göster|bul)/i,
    /(.+?)\s+(?:şarkısını?|klibini?|videosunu?)\s+(?:youtube'?(?:[dD][aA]|[dD][eE])?\s*)?(?:aç|çal|oynat)/i,
    /(.+?)\s+(?:aç|çal|oynat)\s+youtube/i,
    /youtube'?[dD][aA]\s+(.+?)\s+(?:aç|ara|bul|oynat)/i
  ];
  for (const p of pats) {
    const m = text.match(p);
    if (m) {
      const q   = m[1].trim();
      const url = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q);
      window.open(url, '_blank');
      return `"${q}" için YouTube'da arama açıldı! 🎵`;
    }
  }
  if (/youtube/i.test(text)) {
    const q = text.replace(/youtube[^\w]*/i,'').replace(/aç|çal|oynat|göster|bul/gi,'').trim();
    if (q.length > 1) {
      window.open('https://www.youtube.com/results?search_query=' + encodeURIComponent(q), '_blank');
      return `"${q}" YouTube'da aranıyor! 🎵`;
    }
    window.open('https://www.youtube.com', '_blank');
    return 'YouTube açıldı!';
  }
  return null;
}

// ─── Chat ─────────────────────────────────────────────────
const msgBox   = $('messages');
const chatInput = $('chat-in');

function addMsg(role, content) {
  const el = document.createElement('div');
  el.className = `msg ${role}`;
  const text = document.createElement('div');
  text.textContent = content;
  const time = document.createElement('span');
  time.className = 'msg-ts';
  time.textContent = ts();
  el.appendChild(text);
  el.appendChild(time);
  msgBox.appendChild(el);
  msgBox.scrollTop = msgBox.scrollHeight;
  return el;
}

function addTyping() {
  const el = document.createElement('div');
  el.className = 'msg bot typing-msg';
  el.innerHTML = '<span></span><span></span><span></span>';
  msgBox.appendChild(el);
  msgBox.scrollTop = msgBox.scrollHeight;
  return el;
}

async function sendMessage(text) {
  text = (text || chatInput.value).trim();
  if (!text) return;
  chatInput.value = '';
  addMsg('user', text);
  setStatus('Düşünüyor…', true);

  // YouTube kontrolü
  const ytReply = handleYouTube(text);
  if (ytReply) {
    addMsg('bot', ytReply);
    speak(ytReply);
    setStatus('Hazır');
    return;
  }

  const typing = addTyping();

  try {
    const data = await api('/chat', {
      method: 'POST',
      body:   { conversationId: ST.convId, message: text }
    });
    ST.convId = data.conversationId;
    typing.remove();
    addMsg('bot', data.reply);
    speak(data.reply);
    setStatus('Hazır');
  } catch (e) {
    typing.remove();
    const err = `Hata: ${e.message}`;
    addMsg('err', err);
    setStatus('Bağlantı hatası');
    setTimeout(() => setStatus('Hazır'), 3000);
  }
}

$('send-btn').addEventListener('click', () => sendMessage());
chatInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// ─── Notlar ──────────────────────────────────────────────
let noteEditId = null;

async function loadNotes() {
  const s     = ($('note-s')?.value || '').trim();
  const list  = await api('/notes' + (s ? '?search=' + encodeURIComponent(s) : ''));
  const wrap  = $('notes-list');
  if (!wrap) return;
  wrap.innerHTML = list.length
    ? list.map(n => `
        <div class="nc" data-id="${n.id}" style="border-top-color:${n.color||'#00d4ff'}">
          <span class="ncat">${esc(n.category)}</span>
          <h4>${esc(n.title)}</h4>
          <p>${esc(n.content)}</p>
          <div class="nc-act">
            <button class="nc-btn del" onclick="delNote(${n.id})">✕ Sil</button>
          </div>
        </div>`).join('')
    : '<p style="color:var(--mut);font-size:12px;padding:8px">Henüz not yok.</p>';
}

window.delNote = async id => {
  if (!confirm('Silinsin mi?')) return;
  await api(`/notes/${id}`, { method: 'DELETE' });
  loadNotes();
};

function showNoteForm(show) {
  const f = $('note-form');
  if (f) f.hidden = !show;
  if (show) { $('nf-title')?.focus(); }
}

$('note-add')?.addEventListener('click', () => {
  noteEditId = null;
  if ($('nf-title')) $('nf-title').value = '';
  if ($('nf-body'))  $('nf-body').value  = '';
  if ($('nf-cat'))   $('nf-cat').value   = 'Genel';
  showNoteForm(true);
});
$('nf-cancel')?.addEventListener('click', () => showNoteForm(false));
$('nf-save')?.addEventListener('click', async () => {
  const title = $('nf-title')?.value.trim();
  const body  = $('nf-body')?.value.trim();
  if (!title || !body) { alert('Başlık ve içerik zorunlu.'); return; }
  await api('/notes', {
    method: 'POST',
    body:   { title, content: body, category: $('nf-cat')?.value || 'Genel' }
  });
  showNoteForm(false);
  loadNotes();
});
$('note-s')?.addEventListener('input', () => loadNotes());

// ─── Ayarlar ─────────────────────────────────────────────
async function loadSettings() {
  try {
    ST.settings = await api('/settings');
    if ($('s-name'))  $('s-name').value = ST.settings.ai_name || 'ANKA';
    if ($('s-rate'))  { $('s-rate').value = ST.settings.voice_rate || '0.88'; $('rv').textContent = parseFloat($('s-rate').value).toFixed(2) + 'x'; }
    if ($('s-pitch')) { $('s-pitch').value = ST.settings.voice_pitch || '0.78'; $('pv').textContent = parseFloat($('s-pitch').value).toFixed(2) + 'x'; }
    ST.rate  = parseFloat(ST.settings.voice_rate  || '0.88');
    ST.pitch = parseFloat(ST.settings.voice_pitch || '0.78');

    $$('.pb').forEach(b => b.classList.toggle('active', b.dataset.p === ST.settings.personality));

    const vm = ST.settings.voice_model || 'auto';
    ST.voiceModel = vm;
    $$('.vb').forEach(b => b.classList.toggle('active', b.dataset.vm === vm));
  } catch (_) {}
}

$('s-rate')?.addEventListener('input', e => {
  ST.rate = parseFloat(e.target.value);
  if ($('rv')) $('rv').textContent = ST.rate.toFixed(2) + 'x';
});
$('s-pitch')?.addEventListener('input', e => {
  ST.pitch = parseFloat(e.target.value);
  if ($('pv')) $('pv').textContent = ST.pitch.toFixed(2) + 'x';
});

$$('.pb').forEach(b => b.addEventListener('click', () => {
  $$('.pb').forEach(x => x.classList.remove('active'));
  b.classList.add('active');
}));

$$('.vb').forEach(b => b.addEventListener('click', () => {
  $$('.vb').forEach(x => x.classList.remove('active'));
  b.classList.add('active');
  ST.voiceModel = b.dataset.vm;
}));

$('test-v')?.addEventListener('click', () => {
  speak(`Merhaba! Ben ${ST.settings.ai_name || 'ANKA'}. Emirlerinizi bekliyorum.`);
});

$('s-save')?.addEventListener('click', async () => {
  const name  = $('s-name')?.value.trim() || 'ANKA';
  const pers  = document.querySelector('.pb.active')?.dataset.p || 'Güler Yüzlü';
  const vm    = document.querySelector('.vb.active')?.dataset.vm || 'auto';
  ST.voiceModel = vm;
  try {
    ST.settings = await api('/settings', {
      method: 'PUT',
      body:   { ai_name: name, personality: pers, language: 'tr', voice_rate: String(ST.rate), voice_pitch: String(ST.pitch), voice_model: vm }
    });
    setStatus('Ayarlar kaydedildi!', true);
    setTimeout(() => setStatus('Hazır'), 2200);
  } catch (e) {
    alert('Kayıt hatası: ' + e.message);
  }
});

$('exp-btn')?.addEventListener('click', async () => {
  try {
    const data = await api('/memory/export');
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `anka-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (e) { alert('Dışa aktarma hatası.'); }
});

$('clr-btn')?.addEventListener('click', async () => {
  if (!confirm('Tüm uzun süreli hafıza silinecek. Emin misin?')) return;
  await api('/memory', { method: 'DELETE' });
  alert('Hafıza temizlendi.');
});

// ─── Socket ──────────────────────────────────────────────
const socket = (typeof io !== 'undefined') ? io() : null;
if (socket) {
  socket.on('connect', () => {
    socket.emit('device:register', {
      name: navigator.platform || 'Web',
      type: ST.isMobile ? 'Mobil' : 'Masaüstü'
    });
  });
  setInterval(() => socket.emit('device:heartbeat'), 15000);
}

// ─── Yardımcı ────────────────────────────────────────────
function esc(s) {
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ─── Başlangıç ───────────────────────────────────────────
loadSettings();
loadNotes();

// Karşılama mesajı (mobilde ses için kullanıcı etkileşimi gerekiyor, bu yüzden 2sn bekle)
setTimeout(() => {
  const name = ST.settings.ai_name || 'ANKA';
  setStatus(`${name} hazır. Tıklayın veya yazın.`);
  // Masaüstünde karşılama sesi, mobilde ilk etkileşime bırak
  if (!ST.isMobile) {
    speak(`Merhaba! Ben ${name}. Nasıl yardımcı olabilirim?`);
  }
}, 1200);

// Bar animasyonu başlat (arka planda çalışır, yalnızca vis gösterilince güncellenir)
animateBars();
