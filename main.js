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
   STATE
══════════════════════════════════ */
// 'off' | 'booting' | 'menu' | 'numbers' | 'drawing' | 'maze' | 'coming-soon'
let appState = 'off';
let menuFocusIndex = 0;

/* ══════════════════════════════════
   HOLD-KEY POWER CONTROL
══════════════════════════════════ */
const HOLD_ON_MS  = 1400;
const HOLD_OFF_MS = 1800;
let _holdKey     = null;
let _holdTimer   = null;
let _holdRafId   = null;
let _holdStart   = 0;

function _startHold(key) {
  if (_holdKey === key) return;
  _cancelHold();
  _holdKey   = key;
  _holdStart = performance.now();

  if (key === '1') {
    document.getElementById('power-btn').classList.add('holding-on');
    _holdTimer = setTimeout(() => { _cancelHold(); bootUp(); }, HOLD_ON_MS);
  } else if (key === '0') {
    const prompt = document.getElementById('poweroff-prompt');
    const bar    = document.getElementById('poweroff-bar');
    prompt.classList.add('visible');
    bar.style.transition = `width ${HOLD_OFF_MS}ms linear`;
    bar.style.width = '0%';
    requestAnimationFrame(() => { bar.style.width = '100%'; });
    _holdTimer = setTimeout(() => { _cancelHold(); _executeShutdown(); }, HOLD_OFF_MS);
  }
}

function _cancelHold() {
  if (_holdTimer) { clearTimeout(_holdTimer); _holdTimer = null; }
  _holdKey = null;
  document.getElementById('power-btn').classList.remove('holding-on');
  const prompt = document.getElementById('poweroff-prompt');
  const bar    = document.getElementById('poweroff-bar');
  prompt.classList.remove('visible');
  bar.style.transition = 'none';
  bar.style.width = '0%';
}

function _executeShutdown() {
  const prevState = appState;
  if (prevState === 'numbers')  document.getElementById('game-screen').style.display    = 'none';
  if (prevState === 'spelling') stopUnicornSpell();
  if (prevState === 'drawing')  { stopPixelPainter(); document.getElementById('drawing-screen').style.display = 'none'; }
  if (prevState === 'maze')     { stopBunnyMaze(); document.getElementById('maze-screen').style.display = 'none'; document.getElementById('maze-win-overlay').style.display = 'none'; }
  if (prevState === 'coming-soon') document.getElementById('coming-screen').style.display = 'none';
  if (prevState === 'menu')    document.getElementById('main-screen').style.display     = 'none';

  appState = 'booting';
  const bootEl = document.getElementById('boot-screen');
  bootEl.innerHTML = '';
  bootEl.style.display = 'flex';

  const lines = [
    { text:'SAVING PROGRESS...', color:'#33ff33', delay:0   },
    { text:'CLOSING PROGRAMS...',color:'#33ff33', delay:400 },
    { text:'GOODBYE! 👋',        color:'#aaffaa', delay:800 },
  ];
  lines.forEach(({ text, color, delay }) => {
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
    bootEl.innerHTML = '';
    document.getElementById('power-btn').classList.remove('on');
    document.getElementById('off-screen').style.display = 'flex';
    appState = 'off';
  }, 1400);
}

/* ══════════════════════════════════
   KEY DISPLAY
══════════════════════════════════ */
const keyDisplay = document.getElementById('key-display');

const SKIP_KEYS = new Set([
  'Shift','Control','Alt','Meta','CapsLock','Tab','Escape',
  'F1','F2','F3','F4','F5','F6','F7','F8','F9','F10','F11','F12'
]);

function labelForKey(key) {
  if (key === ' ')          return 'SPC';
  if (key === 'Enter')      return 'ENT';
  if (key === 'Backspace')  return '⌫';
  if (key === 'Delete')     return 'DEL';
  if (key === 'ArrowLeft')  return '◄';
  if (key === 'ArrowRight') return '►';
  if (key === 'ArrowUp')    return '▲';
  if (key === 'ArrowDown')  return '▼';
  if (key.length === 1)     return key.toUpperCase();
  return key.substring(0, 3).toUpperCase();
}

function showKeyBubble(label) {
  while (keyDisplay.children.length >= 5) keyDisplay.removeChild(keyDisplay.lastChild);
  const b = document.createElement('div');
  b.className = 'key-bubble';
  b.textContent = label;
  keyDisplay.prepend(b);
  setTimeout(() => { if (b.parentNode) b.remove(); }, 1100);
}

document.addEventListener('keydown', e => {
  if (SKIP_KEYS.has(e.key) || e.repeat) return;
  const label = labelForKey(e.key);
  playKeyTone(label);
  showKeyBubble(label);

  // Hold [0] to power off (not during number input where 0 is a digit)
  if (e.key === '0' && appState !== 'off' && appState !== 'booting' && appState !== 'numbers') {
    _startHold('0');
    return;
  }

  switch (appState) {
    case 'off':
      if (e.key === '1') _startHold('1');
      break;
    case 'booting':
      break;
    case 'menu':        handleMenuKey(e);      break;
    case 'numbers':     handleNumbersKey(e);   break;
    case 'drawing':     handleDrawingKey(e);   break;
    case 'maze':        handleMazeKey(e);      break;
    case 'spelling':    handleSpellingKey(e);  break;
    case 'coming-soon': goHome();              break;
  }
});

document.addEventListener('keyup', e => {
  if (e.key === _holdKey) _cancelHold();
});

/* ══════════════════════════════════
   POWER & BOOT
══════════════════════════════════ */
const BOOT_LINES = [
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

function bootUp() {
  if (appState !== 'off') return;
  appState = 'booting';

  document.getElementById('off-screen').style.display = 'none';
  document.getElementById('power-btn').classList.add('on');

  const bootEl = document.getElementById('boot-screen');
  bootEl.innerHTML = '';
  bootEl.style.display = 'flex';

  BOOT_LINES.forEach(({ text, color, delay }) => {
    setTimeout(() => {
      if (appState !== 'booting') return;
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
    showMenu();
  }, 3400);
}

/* ══════════════════════════════════
   CLOCK
══════════════════════════════════ */
function updateClock() {
  const now = new Date();
  const el = document.getElementById('clock-display');
  if (el) el.textContent =
    `TIME: ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
}
setInterval(updateClock, 1000);
updateClock();

/* ══════════════════════════════════
   MENU KEY HANDLER
══════════════════════════════════ */
function handleMenuKey(e) {
  if (e.key === '1') { launchApp('spelling'); return; }
  if (e.key === '2') { launchApp('numbers');  return; }
  if (e.key === '3') { launchApp('drawing');  return; }
  if (e.key === '4') { launchApp('maze');     return; }

  const tiles = document.querySelectorAll('.menu-tile');
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
    e.preventDefault();
    menuFocusIndex = (menuFocusIndex + 1) % tiles.length;
    tiles[menuFocusIndex].focus();
  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
    e.preventDefault();
    menuFocusIndex = (menuFocusIndex - 1 + tiles.length) % tiles.length;
    tiles[menuFocusIndex].focus();
  } else if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    tiles[menuFocusIndex].click();
  }
}

/* ══════════════════════════════════
   NUMBERS KEY HANDLER
══════════════════════════════════ */
function handleNumbersKey(e) {
  if (e.key === 'x' || e.key === 'X') { goHome(); return; }
  if (G.locked) return;
  if (e.key >= '0' && e.key <= '9') {
    e.preventDefault();
    numpadPress(e.key, false);
  } else if (e.key === 'Backspace') {
    e.preventDefault();
    const inp = document.getElementById('answer-input');
    inp.value = inp.value.slice(0, -1);
  } else if (e.key === 'Enter') {
    e.preventDefault();
    checkAnswer();
  }
}

/* ══════════════════════════════════
   DRAWING KEY HANDLER
══════════════════════════════════ */
function handleDrawingKey(e) {
  if (e.key === 'x' || e.key === 'X') { goHome(); return; }
  if (e.key === 'c' || e.key === 'C') { clearCanvas(); return; }
  if (!paintCanvas || !drawingActive) return;
  paintBlob(
    20 + Math.random() * (paintCanvas.width  - 40),
    20 + Math.random() * (paintCanvas.height - 40)
  );
}

/* ══════════════════════════════════
   SPELLING KEY HANDLER
══════════════════════════════════ */
function handleSpellingKey(e) {
  if (e.key === 'x' || e.key === 'X') { goHome(); return; }
  if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
    e.preventDefault();
    spellingKeyPress(e.key.toUpperCase());
  }
}

/* ══════════════════════════════════
   MAZE KEY HANDLER
══════════════════════════════════ */
function handleMazeKey(e) {
  if (e.key === 'x' || e.key === 'X') { goHome(); return; }
  if (mazeWon) {
    e.preventDefault();
    mazePlayAgain();
    return;
  }
  const map = {
    ArrowUp:'up', ArrowDown:'down', ArrowLeft:'left', ArrowRight:'right',
    w:'up', W:'up', s:'down', S:'down', a:'left', A:'left', d:'right', D:'right',
  };
  if (map[e.key]) { e.preventDefault(); mazeMove(map[e.key]); }
}

/* ══════════════════════════════════
   MENU INTERACTIONS
══════════════════════════════════ */
function showMenu() {
  appState = 'menu';
  menuFocusIndex = 0;
  document.getElementById('main-screen').style.display = 'flex';
}

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
});

function launchApp(app) {
  document.getElementById('main-screen').style.display = 'none';

  if (app === 'spelling') {
    appState = 'spelling';
    playFanfare();
    startUnicornSpell();
  } else if (app === 'numbers') {
    appState = 'numbers';
    playFanfare();
    startNumberFun();
  } else if (app === 'drawing') {
    appState = 'drawing';
    playFanfare();
    startPixelPainter();
  } else if (app === 'maze') {
    appState = 'maze';
    playFanfare();
    startBunnyMaze();
  } else {
    appState = 'coming-soon';
    const names = { spelling:'SPELLING BEE', stories:'STORY TIME' };
    const title = document.getElementById('coming-title');
    if (title) title.textContent = `*** ${names[app] || app.toUpperCase()} ***`;
    document.getElementById('coming-screen').style.display = 'flex';
  }
}

function goHome() {
  if (appState === 'numbers') {
    document.getElementById('game-screen').style.display = 'none';
  } else if (appState === 'spelling') {
    stopUnicornSpell();
  } else if (appState === 'drawing') {
    stopPixelPainter();
    document.getElementById('drawing-screen').style.display = 'none';
  } else if (appState === 'maze') {
    stopBunnyMaze();
    document.getElementById('maze-screen').style.display = 'none';
    document.getElementById('maze-win-overlay').style.display = 'none';
  } else if (appState === 'coming-soon') {
    document.getElementById('coming-screen').style.display = 'none';
  }
  showMenu();
}
