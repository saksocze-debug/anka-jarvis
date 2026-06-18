// ANKA script.js — Türkçe, kalın erkek sesi, hologram efektleri
const API = '/api';
const socket = io();

const S = {
  convId: null,
  settings: { ai_name:'ANKA', personality:'Güler Yüzlü' },
  rate: 0.88,
  pitch: 0.75,
  recognizing: false,
  voices: [],
  animId: null,
  botAnimId: null,
  audioCtx: null,
  analyser: null,
  micStream: null,
  dataArr: null
};

// ─── Yardımcılar ───────────────────────────────────────
const $ = s => document.querySelector(s);
const ts = () => new Date().toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'});
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

async function api(path, opts={}) {
  const r = await fetch(API+path, {
    headers:{'Content-Type':'application/json'},
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined
  });
  if (!r.ok) throw new Error((await r.json()).error || r.statusText);
  return r.json();
}

// ─── Saat ──────────────────────────────────────────────
function tick() {
  const n = new Date();
  $('#clock-time').textContent = n.toLocaleTimeString('tr-TR');
  $('#clock-date').textContent = n.toLocaleDateString('tr-TR',{weekday:'short',day:'2-digit',month:'short'}).toUpperCase();
}
setInterval(tick,1000); tick();

// ─── Nav ───────────────────────────────────────────────
document.querySelectorAll('.nav-btn').forEach(b => {
  b.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(x=>x.classList.remove('active'));
    document.querySelectorAll('.view').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    const v = b.dataset.view;
    $(`#view-${v}`).classList.add('active');
    if (v==='notes') loadNotes();
    if (v==='settings') loadSettings();
  });
});

// ─── Parçacıklar ───────────────────────────────────────
function spawnParticles(n=6) {
  const c = $('#particles');
  for (let i=0;i<n;i++) {
    const p = document.createElement('div');
    p.className='ptcl';
    const sz = Math.random()*7+3;
    const blue = Math.random()>.45;
    p.style.cssText=`width:${sz}px;height:${sz}px;left:${25+Math.random()*50}%;bottom:${20+Math.random()*30}%;background:${blue?'#00d4ff':'#ff6600'};box-shadow:0 0 ${sz*2}px ${blue?'#00d4ff':'#ff6600'};--d:${.7+Math.random()*1.1}s;animation-delay:${Math.random()*.4}s`;
    c.appendChild(p);
    setTimeout(()=>p.remove(),2000);
  }
}
setInterval(()=>spawnParticles(4),700);

// ─── Hologram tıklama efekti ───────────────────────────
const phoenixWrap = $('#phoenix-wrap');
phoenixWrap.addEventListener('click', () => {
  // Efekt burst
  phoenixWrap.classList.add('clicked');
  spawnParticles(20);
  // Özel ses efekti (Web Audio)
  playClickSound();
  // "Dinliyorum" efekti + mikrofon başlat
  setTimeout(()=>phoenixWrap.classList.remove('clicked'),800);
  if (!S.recognizing) startMic();
});

function playClickSound() {
  try {
    const ctx = new (window.AudioContext||window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type='sine';
    osc.frequency.setValueAtTime(440,ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880,ctx.currentTime+.1);
    osc.frequency.exponentialRampToValueAtTime(220,ctx.currentTime+.3);
    gain.gain.setValueAtTime(.3,ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime+.4);
    setTimeout(()=>ctx.close(),500);
  } catch(e){}
}

// ─── Ses görselleştiricisi ─────────────────────────────
async function startVisualizer() {
  try {
    S.micStream = await navigator.mediaDevices.getUserMedia({audio:true});
    S.audioCtx = new (window.AudioContext||window.webkitAudioContext)();
    const src = S.audioCtx.createMediaStreamSource(S.micStream);
    S.analyser = S.audioCtx.createAnalyser();
    S.analyser.fftSize = 64;
    src.connect(S.analyser);
    S.dataArr = new Uint8Array(S.analyser.frequencyBinCount);
  } catch(e) { S.analyser = null; }
  $('#bottom-vis').classList.add('show');
  drawBottom();
}

function stopVisualizer() {
  if (S.botAnimId) cancelAnimationFrame(S.botAnimId);
  if (S.micStream) S.micStream.getTracks().forEach(t=>t.stop());
  if (S.audioCtx) S.audioCtx.close();
  S.audioCtx=null; S.analyser=null; S.micStream=null;
  $('#bottom-vis').classList.remove('show');
  const c=$('#vis-canvas');
  c.getContext('2d').clearRect(0,0,c.width,c.height);
}

function drawBottom() {
  const canvas=$('#vis-canvas');
  const ctx=canvas.getContext('2d');
  const W=canvas.width, H=canvas.height;
  let phase=0;

  function draw() {
    S.botAnimId=requestAnimationFrame(draw);
    let bars;
    if (S.analyser) {
      S.analyser.getByteFrequencyData(S.dataArr);
      bars=Array.from(S.dataArr.slice(0,36));
    } else {
      bars=Array.from({length:36},(_,i)=>Math.abs(Math.sin((i+phase)*.38))*180+Math.random()*50);
    }
    phase+=.12;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle='rgba(0,3,10,0.5)';
    ctx.fillRect(0,0,W,H);
    // Izgara
    ctx.strokeStyle='rgba(0,212,255,0.06)';
    ctx.lineWidth=.5;
    for(let x=0;x<W;x+=25){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke()}
    for(let y=0;y<H;y+=17){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}
    // Barlar
    const bw=W/bars.length;
    bars.forEach((v,i)=>{
      const h=(v/255)*(H*.82);
      const cx=i*bw+bw/2;
      const g=ctx.createLinearGradient(0,H/2-h/2,0,H/2+h/2);
      g.addColorStop(0,'rgba(0,212,255,.9)');
      g.addColorStop(.5,'rgba(255,102,0,.75)');
      g.addColorStop(1,'rgba(0,212,255,.9)');
      ctx.fillStyle=g;
      ctx.shadowBlur=8; ctx.shadowColor='#00d4ff';
      ctx.fillRect(cx-bw*.28,H/2-h/2,bw*.56,h);
    });
    ctx.shadowBlur=0;
    // Merkez çizgi
    ctx.strokeStyle='rgba(0,212,255,0.2)';
    ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(0,H/2);ctx.lineTo(W,H/2);ctx.stroke();
  }
  draw();
}

// ─── Durum güncelleyici ────────────────────────────────
function setState(text, active=false) {
  const el=$('#state-text');
  el.textContent=text;
  el.classList.toggle('active',active);
}

// ─── TTS — Kalın erkek sesi ────────────────────────────
function loadVoices() {
  S.voices = speechSynthesis.getVoices();
}
if ('speechSynthesis' in window) {
  speechSynthesis.onvoiceschanged=loadVoices;
  setTimeout(loadVoices,600);
}

function getMaleVoice() {
  // Önce Türkçe erkek sesini ara
  const trMaleKW=['erkek','male','man','david','mark','türkçe'];
  const trVoices=S.voices.filter(v=>v.lang.startsWith('tr'));
  if (trVoices.length) {
    const m=trVoices.find(v=>trMaleKW.some(k=>v.name.toLowerCase().includes(k)));
    if (m) return m;
    // Türkçe ses var ama erkek bulunamadı — ilkini al
    return trVoices[0];
  }
  // Türkçe yoksa İngilizce erkek
  const enVoices=S.voices.filter(v=>v.lang.startsWith('en'));
  const enMale=enVoices.find(v=>['male','man','david','mark','james','paul','george'].some(k=>v.name.toLowerCase().includes(k)));
  if (enMale) return enMale;
  return S.voices[0]||null;
}

function speak(text) {
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance(text);
  const v=getMaleVoice();
  if (v) u.voice=v;
  u.lang='tr-TR';
  u.rate=S.rate;
  u.pitch=S.pitch; // 0.75 = kalın erkek sesi
  u.volume=1;
  speechSynthesis.speak(u);
}

// ─── YouTube açma ──────────────────────────────────────
function handleYouTube(message) {
  const patterns=[
    /youtube(?:'?da|'?de|'?den)?\s+(.+?)\s+(?:aç|çal|oynat|göster)/i,
    /(.+?)\s+(?:şarkısını?|videosunu?|klibini?)\s+(?:youtube'?da\s+)?(?:aç|çal|oynat)/i,
    /(.+?)\s+(?:aç|çal)\s+youtube/i
  ];
  for (const p of patterns) {
    const m=message.match(p);
    if (m) {
      const q=encodeURIComponent(m[1].trim());
      const url=`https://www.youtube.com/results?search_query=${q}`;
      window.open(url,'_blank');
      return `"${m[1].trim()}" için YouTube'da arama açıldı! 🎵`;
    }
  }
  // Genel "youtube aç" veya link içeriyorsa
  if (/youtube/i.test(message)) {
    const q=message.replace(/youtube[^\w]*/i,'').replace(/aç|çal|oynat|göster/gi,'').trim();
    if (q.length>1) {
      window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`,'_blank');
      return `"${q}" YouTube'da aranıyor! 🎵`;
    }
    window.open('https://www.youtube.com','_blank');
    return 'YouTube açıldı!';
  }
  return null;
}

// ─── Chat ──────────────────────────────────────────────
const msgs=$('#messages');
const input=$('#chat-input');

function addMsg(role,content) {
  const d=document.createElement('div');
  d.className=`msg ${role==='user'?'user':'bot'}`;
  d.innerHTML=`<div>${esc(content)}</div><div class="ts">${ts()}</div>`;
  msgs.appendChild(d);
  msgs.scrollTop=msgs.scrollHeight;
  return d;
}

function addTyping() {
  const d=document.createElement('div');
  d.className='msg bot';
  d.innerHTML='<div class="typing-dots"><span></span><span></span><span></span></div>';
  msgs.appendChild(d);
  msgs.scrollTop=msgs.scrollHeight;
  return d;
}

async function send() {
  const text=input.value.trim();
  if (!text) return;
  input.value='';
  addMsg('user',text);
  setState('Düşünüyor...',true);

  // YouTube kontrolü
  const ytReply=handleYouTube(text);
  if (ytReply) {
    setTimeout(()=>{
      addMsg('bot',ytReply);
      speak(ytReply);
      setState('Hazır');
    },300);
    return;
  }

  const typing=addTyping();
  try {
    const data=await api('/chat',{method:'POST',body:{conversationId:S.convId,message:text}});
    S.convId=data.conversationId;
    typing.remove();
    addMsg('bot',data.reply);
    speak(data.reply);
    setState('Hazır');
  } catch(e) {
    typing.remove();
    const err=`Bağlantı hatası: ${e.message}`;
    addMsg('bot',err);
    setState('Hata',false);
  }
}

$('#send-btn').addEventListener('click',send);
input.addEventListener('keydown',e=>{if(e.key==='Enter')send()});

// ─── Mikrofon / Sesli komut ────────────────────────────
const micBtn=$('#mic-btn');
let recognition=null;

if ('webkitSpeechRecognition' in window||'SpeechRecognition' in window) {
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  recognition=new SR();
  recognition.lang='tr-TR';
  recognition.continuous=false;
  recognition.interimResults=false;

  recognition.onstart=()=>{
    S.recognizing=true;
    micBtn.classList.add('on');
    phoenixWrap.classList.add('listening','active');
    setState('Dinliyorum...',true);
    startVisualizer();
    spawnParticles(12);
  };
  recognition.onend=()=>{
    S.recognizing=false;
    micBtn.classList.remove('on');
    phoenixWrap.classList.remove('listening','active');
    setState('Hazır');
    stopVisualizer();
  };
  recognition.onerror=e=>{
    S.recognizing=false;
    micBtn.classList.remove('on');
    phoenixWrap.classList.remove('listening','active');
    setState('Mikrofon hatası: '+e.error);
    stopVisualizer();
  };
  recognition.onresult=e=>{
    const t=e.results[0][0].transcript;
    input.value=t;
    send();
  };
}

function startMic() {
  if (!recognition) { alert('Tarayıcınız sesli komutu desteklemiyor.'); return; }
  if (S.recognizing) { recognition.stop(); return; }
  recognition.start();
}

micBtn.addEventListener('click',startMic);

// ─── Ayarlar ───────────────────────────────────────────
function loadSettings() {
  $('#set-name').value=S.settings.ai_name||'ANKA';
  $('#voice-rate').value=S.rate;
  $('#rate-label').textContent=`Hız: ${S.rate}x`;
  $('#voice-pitch').value=S.pitch;
  $('#pitch-label').textContent=`Ton: ${S.pitch}x (Kalın erkek sesi)`;
  document.querySelectorAll('.pers-btn').forEach(b=>{
    b.classList.toggle('active',b.dataset.v===S.settings.personality);
  });
}

document.querySelectorAll('.pers-btn').forEach(b=>{
  b.addEventListener('click',()=>{
    document.querySelectorAll('.pers-btn').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
  });
});

$('#voice-rate').addEventListener('input',e=>{
  S.rate=parseFloat(e.target.value);
  $('#rate-label').textContent=`Hız: ${S.rate.toFixed(2)}x`;
});
$('#voice-pitch').addEventListener('input',e=>{
  S.pitch=parseFloat(e.target.value);
  $('#pitch-label').textContent=`Ton: ${S.pitch.toFixed(2)}x (${S.pitch<0.85?'Kalın erkek sesi':'Normal'})`;
});

$('#save-settings').addEventListener('click',()=>{
  const name=$('#set-name').value.trim()||'ANKA';
  const pers=document.querySelector('.pers-btn.active')?.dataset.v||'Güler Yüzlü';
  S.settings={ai_name:name,personality:pers};
  api('/settings',{method:'PUT',body:{ai_name:name,personality:pers,language:'tr'}})
    .then(()=>setState('Ayarlar kaydedildi!',true))
    .catch(()=>{});
  setTimeout(()=>setState('Hazır'),2000);
});

$('#test-voice').addEventListener('click',()=>{
  speak(`Merhaba! Ben ${S.settings.ai_name||'Anka'}. Size nasıl yardımcı olabilirim?`);
});

// ─── Notlar ────────────────────────────────────────────
async function loadNotes() {
  const s=$('#note-search').value.trim();
  const list=await api('/notes'+(s?`?search=${encodeURIComponent(s)}`:''));
  $('#notes-list').innerHTML=list.map(n=>`
    <div class="note-card">
      <button class="note-del" onclick="delNote(${n.id})">✕</button>
      <h4>${esc(n.title)}</h4>
      <p>${esc(n.content)}</p>
    </div>
  `).join('')||'<p style="color:var(--muted)">Henüz not yok.</p>';
}

window.delNote=async id=>{
  if (!confirm('Silinsin mi?')) return;
  await api(`/notes/${id}`,{method:'DELETE'});
  loadNotes();
};

$('#note-new').addEventListener('click',async()=>{
  const title=prompt('Başlık:'); if(!title) return;
  const content=prompt('İçerik:'); if(!content) return;
  await api('/notes',{method:'POST',body:{title,content,category:'Genel'}});
  loadNotes();
});
$('#note-search').addEventListener('input',()=>loadNotes());

// ─── Socket ────────────────────────────────────────────
socket.on('connect',()=>{
  socket.emit('device:register',{name:navigator.platform||'Web',type:'Web'});
});
setInterval(()=>socket.emit('device:heartbeat'),15000);

// ─── Başlangıç ─────────────────────────────────────────
api('/settings').then(d=>{ S.settings=d; }).catch(()=>{});
setState('Merhaba! Size nasıl yardımcı olabilirim?');

// Başlangıçta karşılama sesi (kısa gecikmeyle)
setTimeout(()=>{
  speak(`Merhaba! Ben Anka. Emirlerinizi bekliyorum.`);
},1500);
