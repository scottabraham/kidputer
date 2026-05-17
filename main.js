/* ══════════════════════════════════
   AUDIO ENGINE
══════════════════════════════════ */
let _ctx = null;
function ctx() {
  if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (_ctx.state === 'suspended') _ctx.resume();
  return _ctx;
}

function playKeyTone(keyLabel) {
  try {
    const c = ctx();
    const osc  = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain); gain.connect(c.destination);

    const code = (keyLabel.charCodeAt ? keyLabel.charCodeAt(0) : 65);
    const freq = 180 + (code % 48) * 16;
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.55, c.currentTime + 0.07);
    gain.gain.setValueAtTime(0.07, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.09);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + 0.1);
  } catch(e){}
}

function playFanfare() {
  try {
    const c = ctx();
    [262,330,392,523,659].forEach((f,i) => {
      const osc = c.createOscillator(), g = c.createGain();
      osc.connect(g); g.connect(c.destination);
      osc.type = 'square';
      const t = c.currentTime + i * 0.09;
      osc.frequency.setValueAtTime(f, t);
      g.gain.setValueAtTime(0.09, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
      osc.start(t); osc.stop(t + 0.16);
    });
  } catch(e){}
}

/* ══════════════════════════════════
   KEY DISPLAY
══════════════════════════════════ */
const keyDisplay = document.getElementById('key-display');

document.addEventListener('keydown', e => {
  const skip = ['Shift','Control','Alt','Meta','CapsLock','Tab','F1','F2','F3','F4','F5','F6','F7','F8','F9','F10','F11','F12'];
  if (skip.includes(e.key)) return;

  const label =
      e.key === ' '           ? 'SPC'
    : e.key === 'Enter'       ? 'ENT'
    : e.key === 'Backspace'   ? '⌫'
    : e.key === 'Delete'      ? 'DEL'
    : e.key === 'Escape'      ? 'ESC'
    : e.key === 'ArrowLeft'   ? '◄'
    : e.key === 'ArrowRight'  ? '►'
    : e.key === 'ArrowUp'     ? '▲'
    : e.key === 'ArrowDown'   ? '▼'
    : e.key.length === 1      ? e.key.toUpperCase()
    : e.key.substring(0,3).toUpperCase();

  playKeyTone(label);
  showKeyBubble(label);
});

function showKeyBubble(label) {
  while (keyDisplay.children.length >= 5) keyDisplay.removeChild(keyDisplay.lastChild);
  const b = document.createElement('div');
  b.className = 'key-bubble';
  b.textContent = label;
  keyDisplay.prepend(b);
  setTimeout(() => { if (b.parentNode) b.remove(); }, 1100);
}

/* ══════════════════════════════════
   BOOT SEQUENCE
══════════════════════════════════ */
const bootLines = [
  { text:'** KIDPUTER SYSTEMS INC. **',           color:'#aaffaa', delay:100  },
  { text:'** MODEL KP-64 — READY TO LEARN! **',   color:'#aaffaa', delay:200  },
  { text:'',                                       color:'#33ff33', delay:300  },
  { text:'KIDPUTER OS VERSION 1.0',               color:'#33ff33', delay:400  },
  { text:'COPYRIGHT 1984 KIDPUTER SYSTEMS',       color:'#1a8a1a', delay:500  },
  { text:'',                                       color:'#33ff33', delay:600  },
  { text:'CHECKING MEMORY...',                    color:'#33ff33', delay:700  },
  { text:'  [████████████████████████] 64K OK!',  color:'#ffb000', delay:1100 },
  { text:'LOADING FUN PROGRAMS...',               color:'#33ff33', delay:1300 },
  { text:'  [████████████████████████] DONE!',    color:'#ffb000', delay:1800 },
  { text:'',                                       color:'#33ff33', delay:1900 },
  { text:'CHECKING GAMES...',                     color:'#33ff33', delay:2000 },
  { text:'  SPELLING BEE .......... LOADED!',     color:'#00ffff', delay:2100 },
  { text:'  NUMBER FUN ........... LOADED!',      color:'#00ffff', delay:2250 },
  { text:'  PIXEL PAINTER ........ LOADED!',      color:'#00ffff', delay:2400 },
  { text:'  BUNNY MAZE ........... LOADED!',      color:'#00ffff', delay:2550 },
  { text:'',                                       color:'#33ff33', delay:2650 },
  { text:'*** ALL SYSTEMS GO! HAVE FUN! ***',     color:'#ff44ff', delay:2750 },
  { text:'',                                       color:'#33ff33', delay:2850 },
  { text:'STARTING KIDPUTER...',                  color:'#33ff33', delay:2950 },
];

const bootEl = document.getElementById('boot-screen');
bootLines.forEach(({ text, color, delay }) => {
  setTimeout(() => {
    const ln = document.createElement('div');
    ln.className = 'boot-line';
    ln.style.color = color;
    ln.style.fontSize = 'clamp(10px,1.8vw,18px)';
    ln.style.lineHeight = '1.55';
    ln.textContent = text;
    bootEl.appendChild(ln);
  }, delay);
});

setTimeout(() => {
  bootEl.style.display = 'none';
  document.getElementById('main-screen').style.display = 'flex';
}, 3400);

/* ══════════════════════════════════
   CLOCK
══════════════════════════════════ */
function updateClock() {
  const now = new Date();
  const el = document.getElementById('clock-display');
  if (el) el.textContent = `TIME: ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
}
setInterval(updateClock, 1000);
updateClock();

/* ══════════════════════════════════
   MENU INTERACTIONS
══════════════════════════════════ */
function addRipple(e, tile) {
  const r = document.createElement('div');
  r.className = 'ripple';
  const sz = Math.max(tile.offsetWidth, tile.offsetHeight);
  r.style.width = r.style.height = sz + 'px';
  const rect = tile.getBoundingClientRect();
  r.style.left = (e.clientX - rect.left - sz/2) + 'px';
  r.style.top  = (e.clientY - rect.top  - sz/2) + 'px';
  tile.appendChild(r);
  setTimeout(() => r.remove(), 400);
}
document.querySelectorAll('.menu-tile').forEach(tile => {
  tile.addEventListener('mousedown', e => addRipple(e, tile));
  tile.addEventListener('keydown',   e => { if (e.key==='Enter'||e.key===' ') tile.click(); });
});

function launchApp(app) {
  if (app === 'numbers') {
    playFanfare();
    document.getElementById('main-screen').style.display = 'none';
    startNumberFun();
  } else if (app === 'drawing') {
    playFanfare();
    document.getElementById('main-screen').style.display = 'none';
    startPixelPainter();
  } else if (app === 'maze') {
    playFanfare();
    document.getElementById('main-screen').style.display = 'none';
    startBunnyMaze();
  } else {
    const names = { spelling:'SPELLING BEE', stories:'STORY TIME' };
    const main = document.getElementById('main-screen');
    main.innerHTML = `
      <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1em;">
        <div style="font-size:clamp(18px,4vw,46px);color:#aaffaa;text-shadow:0 0 10px rgba(0,255,0,0.5);">
          *** ${names[app]||app.toUpperCase()} ***
        </div>
        <div style="font-size:clamp(12px,2vw,22px);color:#33ff33;">COMING SOON!<span class="cursor-blink"></span></div>
        <div style="font-size:clamp(9px,1.5vw,16px);color:#1a8a1a;margin-top:1em;">MORE GAMES ON THE WAY!</div>
        <div style="margin-top:2em;">
          <button onclick="goHome()" style="background:transparent;border:2px solid #33ff33;color:#33ff33;
            font-family:'VT323',monospace;font-size:clamp(14px,2.5vw,26px);padding:0.3em 1.2em;
            cursor:pointer;letter-spacing:2px;text-shadow:0 0 6px rgba(0,255,0,0.5);">[ BACK TO MENU ]</button>
        </div>
      </div>`;
  }
}

function goHome() { location.reload(); }
