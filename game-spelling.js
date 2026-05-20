/* ══════════════════════════════════════════════
   UNICORN SPELL — 8-bit Canvas Edition
══════════════════════════════════════════════ */

// Virtual canvas resolution (scaled up via CSS for pixel-art look)
const CVW = 240;
const CVH = 90;
const SPX = 2;          // canvas pixels per sprite logical pixel
const GROUND_Y = 60;    // y of ground surface in virtual canvas

// ── Pixel sprite definitions (each char = 1 logical px × SPX) ──────────────
// . = transparent  W = cream-white  Y = gold horn  P = pink mane
// G = dark outline  D = darker body shadow
const UNI_SPR = [
  [  // Frame 0 — legs A
    '............',
    '....YY......',
    '...YWWG.....',
    '..GWWWWG....',
    'PPWWWWWWG...',
    'GGWWWWWWWG..',
    '..GWWWWWWG..',
    '..G.GW.GWG..',
    '....G..G....',
    '............',
  ],
  [  // Frame 1 — legs B
    '............',
    '....YY......',
    '...YWWG.....',
    '..GWWWWG....',
    'PPWWWWWWG...',
    'GGWWWWWWWG..',
    '..GWWWWWWG..',
    '..GG.WGW.G..',
    '..G...G.....',
    '............',
  ],
];

const UNI_CLR = { W:'#f0eeec', Y:'#ffe050', P:'#ff55aa', G:'#1a1a1a', D:'#b8b0a8' };
const UNI_COLS = UNI_SPR[0][0].length;  // 12
const UNI_ROWS = UNI_SPR[0].length;     // 10

// ── Level data ───────────────────────────────────────────────────────────────
const SPELL_LEVELS = [
  { word:'FROG',   emoji:'🐸', stepEmoji:'🍃', endEmoji:'🌊', scene:'CROSS THE ENCHANTED RIVER!',          pathColor:'#00ccff' },
  { word:'OWL',    emoji:'🦉', stepEmoji:'🍄', endEmoji:'🌲', scene:'FLY OVER THE MOONLIT FOREST!',         pathColor:'#ffaa44' },
  { word:'HARE',   emoji:'🐇', stepEmoji:'🌸', endEmoji:'🌻', scene:'HOP THROUGH THE FLOWER MEADOW!',       pathColor:'#ff88cc' },
  { word:'WOLF',   emoji:'🐺', stepEmoji:'🌿', endEmoji:'🌳', scene:"SNEAK PAST THE SLEEPING WOLF!",        pathColor:'#88ff88' },
  { word:'WITCH',  emoji:'🧙', stepEmoji:'🔮', endEmoji:'🏚️',scene:"ESCAPE THE WITCH'S HAUNTED BRIDGE!",  pathColor:'#cc44ff' },
  { word:'EAGLE',  emoji:'🦅', stepEmoji:'⛰️', endEmoji:'☁️', scene:"CLIMB THE EAGLE'S MOUNTAIN!",         pathColor:'#aaccff' },
  { word:'DRAGON', emoji:'🐉', stepEmoji:'🔥', endEmoji:'💎', scene:"CROSS THE DRAGON'S LAVA BRIDGE!",     pathColor:'#ff4444' },
  { word:'FAIRY',  emoji:'🧚', stepEmoji:'🌺', endEmoji:'🌈', scene:'DANCE THROUGH THE FAIRY RING!',        pathColor:'#ff88ff' },
  { word:'MOON',   emoji:'🌙', stepEmoji:'💫', endEmoji:'🌟', scene:'WALK THE MOONBEAM PATH!',              pathColor:'#ccccff' },
  { word:'CASTLE', emoji:'🏰', stepEmoji:'💎', endEmoji:'👸', scene:'REACH THE CASTLE — SAVE THE PRINCESS!',pathColor:'#ffcc00' },
];

// Per-level background themes
const BG = [
  { sky:'#071a38', skyB:'#0f2a58', gnd:'#1a4a1a', gndB:'#0f2a10', water:true,   stars:12, accent:'#00ccff' },
  { sky:'#040410', skyB:'#0a0a20', gnd:'#101808', gndB:'#080d04', stars:18,  moon:true,   accent:'#ffaa44' },
  { sky:'#3a6ad4', skyB:'#5a8ae4', gnd:'#208828', gndB:'#145518', clouds:true,             accent:'#ff88cc' },
  { sky:'#100820', skyB:'#1c1030', gnd:'#0a1a0a', gndB:'#050d05', stars:8,   fog:true,    accent:'#88ff88' },
  { sky:'#0d0215', skyB:'#160325', gnd:'#120208', gndB:'#080104', fog:true,  lightning:true,accent:'#cc44ff'},
  { sky:'#1a3060', skyB:'#2a4880', gnd:'#606060', gndB:'#404040', snow:true,               accent:'#aaccff' },
  { sky:'#200505', skyB:'#380808', gnd:'#1a1a1a', gndB:'#0a0a0a', lava:true,               accent:'#ff4444' },
  { sky:'#140520', skyB:'#200830', gnd:'#102008', gndB:'#080d04', stars:20, sparkles:true, accent:'#ff88ff' },
  { sky:'#000008', skyB:'#03030f', gnd:'#080820', gndB:'#040410', stars:25, moon:true, moonbeam:true, accent:'#ccccff' },
  { sky:'#101030', skyB:'#181850', gnd:'#2a1e08', gndB:'#141004', stars:10, castle:true,  accent:'#ffcc00' },
];

// ── Game state ────────────────────────────────────────────────────────────────
let spellingLevel    = 0;
let spellingProgress = 0;
let spellingActive   = false;
let spellingLocked   = false;

// Canvas / animation state
let spellCanvas  = null;
let spellCtx     = null;
let spellAnimId  = null;
let spellUniX    = 8;    // current unicorn x (virtual, centre of sprite)
let spellTargetX = 8;
let spellWalkTimer = 0;
let spellWalkFrame = 0;
let spellWrongTick = 0;

// ── Positions ─────────────────────────────────────────────────────────────────
const STONE_W = 14;
const STONE_H = 7;
const UNI_START_X = 8;
const UNI_END_X   = CVW - 10;

function _stoneX(idx) {
  const n = SPELL_LEVELS[spellingLevel].word.length;
  const margin = 28;
  const span   = CVW - margin * 2;
  return Math.round(margin + (idx + 0.5) * (span / n));
}

// ── Start / Stop ──────────────────────────────────────────────────────────────
function startUnicornSpell() {
  spellingLevel    = 0;
  spellingProgress = 0;
  spellingActive   = true;
  spellingLocked   = false;

  document.getElementById('spelling-screen').style.display = 'flex';
  document.getElementById('spell-transition').style.display = 'none';
  document.getElementById('spell-victory').style.display   = 'none';

  spellCanvas = document.getElementById('spell-canvas');
  spellCanvas.width  = CVW;
  spellCanvas.height = CVH;
  spellCtx = spellCanvas.getContext('2d');
  spellCtx.imageSmoothingEnabled = false;

  spellUniX    = UNI_START_X;
  spellTargetX = UNI_START_X;
  spellWalkTimer = 0;
  spellWalkFrame = 0;
  spellWrongTick = 0;

  renderSpellingUI();
  _startAnimLoop();
}

function stopUnicornSpell() {
  spellingActive = false;
  if (spellAnimId) { cancelAnimationFrame(spellAnimId); spellAnimId = null; }
  document.getElementById('spelling-screen').style.display = 'none';
  document.getElementById('spell-transition').style.display = 'none';
  document.getElementById('spell-victory').style.display   = 'none';
}

// ── Animation loop ─────────────────────────────────────────────────────────────
function _startAnimLoop() {
  if (spellAnimId) cancelAnimationFrame(spellAnimId);
  let prev = 0;
  function tick(ts) {
    const dt = Math.min(ts - prev, 50);
    prev = ts;
    _updateAnim(dt);
    _drawScene();
    spellAnimId = requestAnimationFrame(tick);
  }
  spellAnimId = requestAnimationFrame(tick);
}

function _updateAnim(dt) {
  const dx = spellTargetX - spellUniX;
  if (Math.abs(dx) > 0.4) {
    spellUniX += dx * Math.min(dt * 0.013, 0.28);
    spellWalkTimer += dt;
    if (spellWalkTimer > 170) { spellWalkTimer = 0; spellWalkFrame ^= 1; }
  } else {
    spellUniX = spellTargetX;
    spellWalkFrame = 0;
  }
  if (spellWrongTick > 0) spellWrongTick -= dt;
}

// ── Key handler ───────────────────────────────────────────────────────────────
function spellingKeyPress(letter) {
  if (!spellingActive || spellingLocked) return;
  const word = SPELL_LEVELS[spellingLevel].word;

  if (letter === word[spellingProgress]) {
    spellingProgress++;
    playCorrectStepSound();
    _updateTargetX();
    renderWordBlanks();

    if (spellingProgress === word.length) {
      spellingLocked = true;
      setTimeout(() => {
        if (spellingLevel < SPELL_LEVELS.length - 1) {
          spellingLevel++;
          spellingProgress = 0;
          showLevelTransition();
        } else {
          showSpellingVictory();
        }
      }, 1300);
    } else {
      updateSpellHint();
    }
  } else {
    playWrongSound();
    spellWrongTick = 350;
    // Flash the word-blank row
    const wd = document.getElementById('spell-word-display');
    wd.classList.remove('spell-wrong-flash');
    void wd.offsetWidth;
    wd.classList.add('spell-wrong-flash');
    setTimeout(() => wd.classList.remove('spell-wrong-flash'), 400);
  }
}

function _updateTargetX() {
  const word = SPELL_LEVELS[spellingLevel].word;
  if (spellingProgress < word.length) {
    spellTargetX = _stoneX(spellingProgress);
  } else {
    spellTargetX = UNI_END_X;
  }
}

// ── UI rendering (DOM) ────────────────────────────────────────────────────────
function renderSpellingUI() {
  const lvl = SPELL_LEVELS[spellingLevel];
  document.getElementById('spell-level-num').textContent = spellingLevel + 1;
  document.getElementById('spell-scene').textContent     = lvl.scene;
  document.getElementById('spell-emoji-big').textContent = lvl.emoji;
  renderJourneyBar();
  renderWordBlanks();
  updateSpellHint();
  spellUniX    = UNI_START_X;
  spellTargetX = UNI_START_X;
}

function renderSpellingLevel() { renderSpellingUI(); }

function updateSpellHint() {
  const remaining = SPELL_LEVELS[spellingLevel].word.length - spellingProgress;
  const hint = document.getElementById('spell-hint');
  if (spellingProgress === 0) {
    hint.textContent = 'PRESS THE LETTERS TO SPELL THE WORD!';
  } else if (remaining === 1) {
    hint.textContent = 'ONE MORE LETTER — YOU CAN DO IT!';
  } else {
    hint.textContent = `GREAT!  ${remaining} MORE LETTERS TO GO!`;
  }
}

function renderJourneyBar() {
  const bar = document.getElementById('spell-journey-bar');
  bar.innerHTML = '';
  for (let i = 0; i < SPELL_LEVELS.length; i++) {
    const dot = document.createElement('div');
    if      (i < spellingLevel)  { dot.className = 'journey-dot done';    dot.textContent = '✓'; }
    else if (i === spellingLevel) { dot.className = 'journey-dot current'; dot.textContent = '🦄'; }
    else                          { dot.className = 'journey-dot';         dot.textContent = String(i + 1); }
    bar.appendChild(dot);
  }
  const castle = document.createElement('div');
  castle.className = 'journey-castle';
  castle.textContent = '🏰';
  bar.appendChild(castle);
}

function renderWordBlanks() {
  const display = document.getElementById('spell-word-display');
  display.innerHTML = '';
  const word = SPELL_LEVELS[spellingLevel].word;
  for (let i = 0; i < word.length; i++) {
    const tile = document.createElement('div');
    tile.className = 'spell-letter-tile';
    if      (i < spellingProgress)  { tile.classList.add('filled');  tile.textContent = word[i]; }
    else if (i === spellingProgress) { tile.classList.add('current'); tile.textContent = '_'; }
    else                             { tile.textContent = '_'; }
    display.appendChild(tile);
  }
}

// ── Transitions ────────────────────────────────────────────────────────────────
function showLevelTransition() {
  const prev    = SPELL_LEVELS[spellingLevel - 1];
  const overlay = document.getElementById('spell-transition');
  document.getElementById('spell-transition-word').textContent =
    `✓  ${prev.word}  ${prev.emoji}`;
  document.getElementById('spell-transition-next').textContent =
    `LEVEL ${spellingLevel + 1}  →  ${SPELL_LEVELS[spellingLevel].scene}`;
  overlay.style.display = 'flex';
  playFanfare();
  spawnConfetti();

  setTimeout(() => {
    overlay.style.display = 'none';
    spellingLocked = false;
    renderSpellingUI();
  }, 2200);
}

function showSpellingVictory() {
  playFanfare();
  spawnConfetti(); spawnConfetti();
  document.getElementById('spell-victory').style.display = 'flex';
  setTimeout(() => spawnConfetti(), 700);
  setTimeout(() => spawnConfetti(), 1400);
}

// ── Canvas scene drawing ───────────────────────────────────────────────────────
function _drawScene() {
  if (!spellCtx) return;
  const ctx  = spellCtx;
  const lvl  = SPELL_LEVELS[spellingLevel];
  const bg   = BG[spellingLevel];
  const word = lvl.word;
  const now  = Date.now();

  ctx.clearRect(0, 0, CVW, CVH);

  _drawBg(ctx, bg, now);

  // Stepping stones
  for (let i = 0; i < word.length; i++) {
    _drawStone(ctx, _stoneX(i), GROUND_Y, i, word, bg, now);
  }

  // Goal marker
  _drawGoal(ctx, UNI_END_X, GROUND_Y - 5, lvl, now);

  // Unicorn (with wrong-answer shake)
  const shakeX = spellWrongTick > 0
    ? Math.round(Math.sin(spellWrongTick * 0.08) * 2.5) : 0;
  _drawUnicorn(ctx, Math.round(spellUniX) + shakeX, GROUND_Y, spellWalkFrame, now);
}

// ── Background ─────────────────────────────────────────────────────────────────
function _drawBg(ctx, bg, now) {
  // Sky (two-tone)
  ctx.fillStyle = bg.sky;
  ctx.fillRect(0, 0, CVW, GROUND_Y);
  ctx.fillStyle = bg.skyB;
  ctx.fillRect(0, Math.round(GROUND_Y * 0.55), CVW, Math.round(GROUND_Y * 0.45));

  // Stars
  if (bg.stars) {
    for (let i = 0; i < bg.stars; i++) {
      const sx  = (i * 41 + 13) % CVW;
      const sy  = (i * 29 + 5)  % Math.round(GROUND_Y * 0.75);
      const bri = 0.4 + 0.6 * Math.sin(now * 0.001 + i);
      ctx.fillStyle = `rgba(255,255,255,${bri.toFixed(2)})`;
      ctx.fillRect(sx, sy, 1, 1);
      if (i % 4 === 0) ctx.fillRect(sx + 1, sy, 1, 1);
    }
  }

  // Moon
  if (bg.moon || bg.moonbeam) {
    ctx.fillStyle = '#ffffcc';
    _circle(ctx, Math.round(CVW * 0.82), 10, 7);
    ctx.fillStyle = bg.sky;
    _circle(ctx, Math.round(CVW * 0.82) + 3, 9, 6);
  }

  // Moon beam
  if (bg.moonbeam) {
    ctx.fillStyle = 'rgba(200,210,255,0.07)';
    ctx.fillRect(Math.round(CVW * 0.78), 0, 16, GROUND_Y);
  }

  // Clouds
  if (bg.clouds) {
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    const cx = ((now * 0.008) % (CVW + 30)) - 15;
    _cloud(ctx, cx, 12);
    _cloud(ctx, (cx + 80) % (CVW + 30) - 15, 18);
    _cloud(ctx, (cx + 150) % (CVW + 30) - 15, 8);
  }

  // Fog
  if (bg.fog) {
    ctx.fillStyle = 'rgba(50,15,60,0.38)';
    ctx.fillRect(0, Math.round(GROUND_Y * 0.35), CVW, Math.round(GROUND_Y * 0.6));
  }

  // Lightning flash
  if (bg.lightning && Math.floor(now / 3000) % 7 === 0) {
    ctx.fillStyle = 'rgba(200,150,255,0.15)';
    ctx.fillRect(0, 0, CVW, GROUND_Y);
  }

  // Snow on ground
  if (bg.snow) {
    ctx.fillStyle = '#d0e8ff';
    ctx.fillRect(0, GROUND_Y, CVW, CVH - GROUND_Y);
    ctx.fillStyle = '#e8f4ff';
    ctx.fillRect(0, GROUND_Y, CVW, 2);
    // Ground hills
    ctx.fillStyle = '#c0d8ff';
    ctx.fillRect(0, GROUND_Y + 8, CVW, CVH - GROUND_Y - 8);
    return; // skip normal ground
  }

  // Lava pit
  if (bg.lava) {
    ctx.fillStyle = bg.gnd;
    ctx.fillRect(0, GROUND_Y, CVW, CVH - GROUND_Y);
    // Lava glow
    const glow = 0.12 + 0.08 * Math.sin(now * 0.002);
    ctx.fillStyle = `rgba(255,80,0,${glow.toFixed(2)})`;
    ctx.fillRect(0, GROUND_Y - 6, CVW, CVH);
    // Lava surface
    ctx.fillStyle = '#cc2200';
    ctx.fillRect(0, GROUND_Y - 2, CVW, 6);
    ctx.fillStyle = '#ff6600';
    for (let lx = 0; lx < CVW; lx += 14) {
      const wave = Math.round(Math.sin(now * 0.003 + lx * 0.1) * 1.5);
      ctx.fillRect(lx, GROUND_Y - 2 + wave, 8, 2);
    }
    return;
  }

  // Water (river)
  if (bg.water) {
    ctx.fillStyle = '#0033aa';
    ctx.fillRect(0, GROUND_Y - 5, CVW, 12);
    const rip = Math.round((now * 0.02) % 20);
    ctx.fillStyle = 'rgba(100,160,255,0.35)';
    for (let rx = 0; rx < CVW + 20; rx += 20) {
      ctx.fillRect((rx - rip + CVW) % CVW, GROUND_Y - 2, 9, 1);
    }
  }

  // Sparkles (fairy)
  if (bg.sparkles) {
    for (let i = 0; i < 8; i++) {
      const sx   = (i * 53 + Math.round(now * 0.03)) % CVW;
      const sy   = (i * 31 + Math.round(now * 0.02)) % GROUND_Y;
      const alph = 0.3 + 0.7 * Math.abs(Math.sin(now * 0.004 + i));
      ctx.fillStyle = `rgba(255,180,255,${alph.toFixed(2)})`;
      ctx.fillRect(sx, sy, 1, 1);
    }
  }

  // Castle silhouette (level 9)
  if (bg.castle) {
    ctx.fillStyle = 'rgba(20,15,40,0.7)';
    const castleX = CVW - 35;
    // Tower blocks
    ctx.fillRect(castleX, 10, 10, 35);
    ctx.fillRect(castleX + 14, 18, 10, 27);
    ctx.fillRect(castleX - 6, 22, 8, 23);
    // Battlements
    for (let b = 0; b < 3; b++) {
      ctx.fillRect(castleX + b * 3, 8, 2, 4);
    }
    for (let b = 0; b < 3; b++) {
      ctx.fillRect(castleX + 14 + b * 3, 16, 2, 4);
    }
  }

  // Normal ground
  ctx.fillStyle = bg.gnd;
  ctx.fillRect(0, GROUND_Y, CVW, CVH - GROUND_Y);
  ctx.fillStyle = bg.gndB;
  ctx.fillRect(0, GROUND_Y + 4, CVW, CVH - GROUND_Y - 4);
  // Ground highlight line
  ctx.fillStyle = 'rgba(255,255,255,0.07)';
  ctx.fillRect(0, GROUND_Y, CVW, 1);
}

function _cloud(ctx, cx, cy) {
  ctx.fillRect(cx,     cy + 2, 18, 4);
  ctx.fillRect(cx + 3, cy,     12, 2);
  ctx.fillRect(cx + 5, cy - 1,  8, 2);
}

function _circle(ctx, cx, cy, r) {
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
}

// ── Stepping stones ────────────────────────────────────────────────────────────
function _drawStone(ctx, cx, groundY, idx, word, bg, now) {
  const done   = idx < spellingProgress;
  const active = idx === spellingProgress;
  const x = cx - Math.round(STONE_W / 2);
  const y = groundY - STONE_H;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(x + 1, y + STONE_H, STONE_W, 2);

  if (done) {
    // Completed — dark green stone + letter
    ctx.fillStyle = '#1a4a1a';
    ctx.fillRect(x, y, STONE_W, STONE_H);
    ctx.fillStyle = '#2a7a2a';
    ctx.fillRect(x, y, STONE_W, 1);
    ctx.fillStyle = '#99ffaa';
    ctx.font = `bold ${STONE_H}px "VT323",monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(word[idx], cx, y + 1);
  } else if (active) {
    const pulse = 0.5 + 0.5 * Math.sin(now * 0.006);
    // Active stone — glowing
    ctx.fillStyle = bg.lava ? '#3a1a00' : '#0a2a0a';
    ctx.fillRect(x, y, STONE_W, STONE_H);
    // Pixel-art border using fillRect
    ctx.fillStyle = bg.accent;
    ctx.globalAlpha = 0.5 + 0.5 * pulse;
    ctx.fillRect(x, y, STONE_W, 1);
    ctx.fillRect(x, y + STONE_H - 1, STONE_W, 1);
    ctx.fillRect(x, y, 1, STONE_H);
    ctx.fillRect(x + STONE_W - 1, y, 1, STONE_H);
    ctx.globalAlpha = 1;
    // Obstacle emoji very small
    ctx.font = `${STONE_H - 1}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(SPELL_LEVELS[spellingLevel].stepEmoji, cx, y);
  } else {
    // Future — dim stone
    ctx.fillStyle = '#0f1a0f';
    ctx.fillRect(x, y, STONE_W, STONE_H);
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fillRect(x, y, STONE_W, 1);
    ctx.font = `${STONE_H - 1}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.globalAlpha = 0.45;
    ctx.fillText(SPELL_LEVELS[spellingLevel].stepEmoji, cx, y);
    ctx.globalAlpha = 1;
  }
}

// ── Goal marker ────────────────────────────────────────────────────────────────
function _drawGoal(ctx, cx, y, lvl, now) {
  const reached = spellingProgress >= lvl.word.length;
  ctx.font = '12px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (reached) {
    const sc = 1 + 0.12 * Math.sin(now * 0.005);
    ctx.save();
    ctx.translate(cx, y);
    ctx.scale(sc, sc);
    ctx.fillText(lvl.endEmoji, 0, 0);
    ctx.restore();
  } else {
    ctx.globalAlpha = 0.55;
    ctx.fillText(lvl.endEmoji, cx, y);
    ctx.globalAlpha = 1;
  }
}

// ── Unicorn sprite ─────────────────────────────────────────────────────────────
function _drawUnicorn(ctx, cx, groundY, frame, now) {
  const spr  = UNI_SPR[frame];
  const drawX = cx - Math.round(UNI_COLS * SPX / 2);
  const bob   = Math.round(Math.sin(now * 0.004) * 1.2);
  const drawY = groundY - UNI_ROWS * SPX + bob;

  for (let r = 0; r < UNI_ROWS; r++) {
    const row = spr[r];
    for (let c = 0; c < row.length; c++) {
      const ch = row[c];
      if (ch === '.') continue;
      const col = UNI_CLR[ch];
      if (!col) continue;
      ctx.fillStyle = col;
      ctx.fillRect(drawX + c * SPX, drawY + r * SPX, SPX, SPX);
    }
  }
}

// ── Sounds ─────────────────────────────────────────────────────────────────────
function playCorrectStepSound() {
  try {
    const c = ctx();
    const scale = [523, 587, 659, 698, 784, 880, 988, 1047];
    const note  = scale[spellingProgress % scale.length];
    const osc = c.createOscillator(), g = c.createGain();
    osc.connect(g); g.connect(c.destination);
    osc.type = 'square';
    osc.frequency.setValueAtTime(note, c.currentTime);
    g.gain.setValueAtTime(0.09, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.14);
    osc.start(c.currentTime); osc.stop(c.currentTime + 0.16);
  } catch(e){}
}
