/* ══════════════════════════════════════════════
   UNICORN SPELL GAME
══════════════════════════════════════════════ */

const SPELL_LEVELS = [
  { word:'FROG',   emoji:'🐸', scene:'CROSS THE ENCHANTED RIVER!',         stepEmoji:'🍃', endEmoji:'🌊', pathColor:'#00ccff', pathName:'LILY PAD RIVER'    },
  { word:'OWL',    emoji:'🦉', scene:'FLY OVER THE MOONLIT FOREST!',       stepEmoji:'🍄', endEmoji:'🌲', pathColor:'#ffaa44', pathName:'MUSHROOM PATH'      },
  { word:'HARE',   emoji:'🐇', scene:'HOP THROUGH THE FLOWER MEADOW!',     stepEmoji:'🌸', endEmoji:'🌻', pathColor:'#ff88cc', pathName:'FLOWER MEADOW'      },
  { word:'WOLF',   emoji:'🐺', scene:'SNEAK PAST THE SLEEPING WOLF!',      stepEmoji:'🌿', endEmoji:'🌳', pathColor:'#88ff88', pathName:'WOLF\'S WOOD'        },
  { word:'WITCH',  emoji:'🧙', scene:"ESCAPE THE WITCH'S HAUNTED BRIDGE!", stepEmoji:'🔮', endEmoji:'🏚️', pathColor:'#cc44ff', pathName:'HAUNTED HOLLOW'     },
  { word:'EAGLE',  emoji:'🦅', scene:"CLIMB THE EAGLE'S MOUNTAIN!",        stepEmoji:'⛰️', endEmoji:'☁️', pathColor:'#aaccff', pathName:'EAGLE\'S PEAK'      },
  { word:'DRAGON', emoji:'🐉', scene:"CROSS THE DRAGON'S LAVA BRIDGE!",    stepEmoji:'🔥', endEmoji:'💎', pathColor:'#ff4444', pathName:'DRAGON\'S LAIR'     },
  { word:'FAIRY',  emoji:'🧚', scene:'DANCE THROUGH THE FAIRY RING!',      stepEmoji:'🌺', endEmoji:'🌈', pathColor:'#ff88ff', pathName:'FAIRY GLADE'        },
  { word:'MOON',   emoji:'🌙', scene:'WALK THE MOONBEAM PATH TO THE STARS!',stepEmoji:'💫', endEmoji:'🌟', pathColor:'#ccccff', pathName:'MOONBEAM BRIDGE'    },
  { word:'CASTLE', emoji:'🏰', scene:'REACH THE CASTLE — SAVE THE PRINCESS!',stepEmoji:'💎', endEmoji:'👸', pathColor:'#ffcc00', pathName:'ROYAL APPROACH'    },
];

let spellingLevel    = 0;
let spellingProgress = 0;
let spellingActive   = false;
let spellingLocked   = false;

function startUnicornSpell() {
  spellingLevel    = 0;
  spellingProgress = 0;
  spellingActive   = true;
  spellingLocked   = false;

  const screen = document.getElementById('spelling-screen');
  screen.style.display = 'flex';
  document.getElementById('spell-transition').style.display = 'none';
  document.getElementById('spell-victory').style.display = 'none';

  renderSpellingLevel();
}

function spellingKeyPress(letter) {
  if (!spellingActive || spellingLocked) return;
  const word = SPELL_LEVELS[spellingLevel].word;

  if (letter === word[spellingProgress]) {
    spellingProgress++;
    playCorrectStepSound();
    renderSpellingPath();
    renderWordBlanks();

    if (spellingProgress === word.length) {
      spellingLocked = true;
      // Unicorn reaches the end — render with unicorn at end position
      setTimeout(() => {
        if (spellingLevel < SPELL_LEVELS.length - 1) {
          spellingLevel++;
          spellingProgress = 0;
          showLevelTransition();
        } else {
          showSpellingVictory();
        }
      }, 1200);
    } else {
      updateSpellHint();
    }
  } else {
    playWrongSound();
    shakeSpellingPath();
    shakeWordBlanks();
  }
}

function renderSpellingLevel() {
  const level = SPELL_LEVELS[spellingLevel];
  document.getElementById('spell-level-num').textContent = spellingLevel + 1;
  document.getElementById('spell-scene').textContent     = level.scene;
  document.getElementById('spell-emoji-big').textContent = level.emoji;
  renderJourneyBar();
  renderSpellingPath();
  renderWordBlanks();
  updateSpellHint();
}

function updateSpellHint() {
  const level = SPELL_LEVELS[spellingLevel];
  const remaining = level.word.length - spellingProgress;
  const hint = document.getElementById('spell-hint');
  if (spellingProgress === 0) {
    hint.textContent = 'WHAT IS THIS? PRESS THE LETTERS TO SPELL IT!';
  } else if (remaining > 0) {
    hint.textContent = remaining === 1
      ? 'ONE MORE LETTER! YOU CAN DO IT!'
      : `GREAT! ${remaining} MORE LETTERS TO GO!`;
  }
}

function renderJourneyBar() {
  const bar = document.getElementById('spell-journey-bar');
  bar.innerHTML = '';
  for (let i = 0; i < SPELL_LEVELS.length; i++) {
    const dot = document.createElement('div');
    if (i < spellingLevel) {
      dot.className = 'journey-dot done';
      dot.textContent = '✓';
    } else if (i === spellingLevel) {
      dot.className = 'journey-dot current';
      dot.textContent = '🦄';
    } else {
      dot.className = 'journey-dot';
      dot.textContent = String(i + 1);
    }
    bar.appendChild(dot);
  }
  const castle = document.createElement('div');
  castle.className = 'journey-castle';
  castle.textContent = '🏰';
  bar.appendChild(castle);
}

function renderSpellingPath() {
  const path  = document.getElementById('spell-path');
  const level = SPELL_LEVELS[spellingLevel];
  const word  = level.word;

  path.style.setProperty('--path-color', level.pathColor);
  path.innerHTML = '';

  for (let i = 0; i < word.length; i++) {
    const stepEl = document.createElement('div');
    stepEl.className = 'spell-step';

    if (i < spellingProgress) {
      stepEl.classList.add('spell-step-done');
    } else if (i === spellingProgress) {
      stepEl.classList.add('spell-step-active');
      const uni = document.createElement('div');
      uni.className = 'spell-unicorn';
      uni.textContent = '🦄';
      stepEl.appendChild(uni);
    } else {
      stepEl.classList.add('spell-step-future');
    }

    const inner = document.createElement('div');
    inner.className = 'spell-step-inner';
    inner.textContent = i < spellingProgress ? word[i] : level.stepEmoji;
    stepEl.appendChild(inner);
    path.appendChild(stepEl);
  }

  // End marker — unicorn arrives here when word is complete
  const endEl = document.createElement('div');
  endEl.className = 'spell-step spell-end-marker';
  if (spellingProgress === word.length) {
    endEl.classList.add('spell-step-active');
    const uni = document.createElement('div');
    uni.className = 'spell-unicorn spell-unicorn-arrived';
    uni.textContent = '🦄';
    endEl.appendChild(uni);
  }
  const endInner = document.createElement('div');
  endInner.className = 'spell-step-inner';
  endInner.textContent = level.endEmoji;
  endEl.appendChild(endInner);
  path.appendChild(endEl);
}

function renderWordBlanks() {
  const display = document.getElementById('spell-word-display');
  display.innerHTML = '';
  const word = SPELL_LEVELS[spellingLevel].word;

  for (let i = 0; i < word.length; i++) {
    const tile = document.createElement('div');
    tile.className = 'spell-letter-tile';
    if (i < spellingProgress) {
      tile.classList.add('filled');
      tile.textContent = word[i];
    } else if (i === spellingProgress) {
      tile.classList.add('current');
      tile.textContent = '_';
    } else {
      tile.textContent = '_';
    }
    display.appendChild(tile);
  }
}

function shakeSpellingPath() {
  const path = document.getElementById('spell-path');
  path.classList.remove('spell-shake');
  void path.offsetWidth;
  path.classList.add('spell-shake');
  setTimeout(() => path.classList.remove('spell-shake'), 400);
}

function shakeWordBlanks() {
  const display = document.getElementById('spell-word-display');
  display.classList.remove('spell-wrong-flash');
  void display.offsetWidth;
  display.classList.add('spell-wrong-flash');
  setTimeout(() => display.classList.remove('spell-wrong-flash'), 400);
}

function showLevelTransition() {
  const prev    = SPELL_LEVELS[spellingLevel - 1];
  const overlay = document.getElementById('spell-transition');
  document.getElementById('spell-transition-word').textContent =
    `✓  ${prev.word}  ${prev.emoji}`;
  document.getElementById('spell-transition-next').textContent =
    `LEVEL ${spellingLevel + 1} →  ${SPELL_LEVELS[spellingLevel].scene}`;
  overlay.style.display = 'flex';
  playFanfare();
  spawnConfetti();

  setTimeout(() => {
    overlay.style.display = 'none';
    spellingLocked = false;
    renderSpellingLevel();
  }, 2200);
}

function showSpellingVictory() {
  playFanfare();
  spawnConfetti();
  spawnConfetti();
  document.getElementById('spell-victory').style.display = 'flex';
  setTimeout(() => spawnConfetti(), 700);
  setTimeout(() => spawnConfetti(), 1400);
}

function playCorrectStepSound() {
  try {
    const c = ctx();
    const scale   = [523, 587, 659, 698, 784, 880, 988, 1047];
    const note    = scale[spellingProgress % scale.length];
    const osc = c.createOscillator(), g = c.createGain();
    osc.connect(g); g.connect(c.destination);
    osc.type = 'square';
    osc.frequency.setValueAtTime(note, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(note * 1.04, c.currentTime + 0.07);
    g.gain.setValueAtTime(0.09, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.13);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + 0.15);
  } catch(e){}
}

function stopUnicornSpell() {
  spellingActive = false;
  document.getElementById('spelling-screen').style.display = 'none';
  document.getElementById('spell-transition').style.display = 'none';
  document.getElementById('spell-victory').style.display = 'none';
}
