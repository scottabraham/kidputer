/* ══════════════════════════════════════════════
   NUMBER FUN GAME
══════════════════════════════════════════════ */

function playCorrectSound() {
  try {
    const c = ctx();
    [523,659,784,1047].forEach((f,i) => {
      const osc = c.createOscillator(), g = c.createGain();
      osc.connect(g); g.connect(c.destination);
      osc.type = 'square';
      const t = c.currentTime + i * 0.11;
      osc.frequency.setValueAtTime(f, t);
      g.gain.setValueAtTime(0.11, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc.start(t); osc.stop(t + 0.2);
    });
  } catch(e){}
}

function playWrongSound() {
  try {
    const c = ctx();
    [380, 270].forEach((f,i) => {
      const osc = c.createOscillator(), g = c.createGain();
      osc.connect(g); g.connect(c.destination);
      osc.type = 'sawtooth';
      const t = c.currentTime + i * 0.17;
      osc.frequency.setValueAtTime(f, t);
      g.gain.setValueAtTime(0.08, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      osc.start(t); osc.stop(t + 0.24);
    });
  } catch(e){}
}

const EMOJI_POOLS = [
  ['🐶','🐱','🐸','🐧','🦊','🐻','🐼','🐨','🦁','🐯'],
  ['🍎','🍊','🍋','🍇','🍓','🍉','🍌','🍒','🍑','🫐'],
  ['⭐','🌙','☀️','🌈','⚡','❄️','🔥','💧','🌺','🍀'],
  ['🚀','🛸','👾','🤖','🎮','🎲','🎯','🏆','💎','🎪'],
];

const CORRECT_MSGS = [
  ['🎉','AMAZING!'],['⭐','BRILLIANT!'],['🏆','YOU ROCK!'],
  ['🌟','SUPER STAR!'],['🎊','FANTASTIC!'],['👏','GREAT JOB!'],
  ['🚀','GENIUS!'],['💥','PERFECT!'],['🦄','MAGICAL!'],['🔥','ON FIRE!'],
];
const WRONG_MSGS = [
  ['😬','SO CLOSE!'],['🤔','NEARLY THERE!'],['💪','KEEP GOING!'],
  ['😅','ALMOST!'],['🌟','YOU CAN DO IT!'],
];

let G = { score:0, streak:0, stars:0, q:null, locked:false };

function generateQ() {
  const maxA = Math.min(2 + Math.floor(G.score / 30), 8);
  const a = 1 + Math.floor(Math.random() * maxA);
  const maxB = Math.min(2 + Math.floor(G.score / 30), 9 - a);
  const b = 1 + Math.floor(Math.random() * maxB);
  const pool = EMOJI_POOLS[Math.floor(Math.random() * EMOJI_POOLS.length)];
  const idxA = Math.floor(Math.random() * pool.length);
  let idxB = Math.floor(Math.random() * pool.length);
  while (idxB === idxA) idxB = Math.floor(Math.random() * pool.length);
  G.q = { a, b, answer: a + b, emojiA: pool[idxA], emojiB: pool[idxB] };
}

function buildNumpad() {
  const pad = document.getElementById('numpad');
  pad.innerHTML = '';
  for (let i = 1; i <= 9; i++) {
    const btn = makeNumBtn(String(i), false, () => numpadPress(String(i)));
    pad.appendChild(btn);
  }
  pad.appendChild(makeNumBtn('0', true, () => numpadPress('0')));
  pad.appendChild(makeNumBtn('⌫', false, () => {
    if (G.locked) return;
    const inp = document.getElementById('answer-input');
    inp.value = inp.value.slice(0,-1);
    playKeyTone('⌫'); showKeyBubble('⌫');
  }));
  const ok = makeNumBtn('✓', false, checkAnswer);
  ok.style.color = '#00ffff'; ok.style.borderColor = 'rgba(0,255,255,0.5)';
  ok.style.textShadow = '0 0 6px rgba(0,255,255,0.5)';
  pad.appendChild(ok);
}

function makeNumBtn(label, wide, fn) {
  const btn = document.createElement('button');
  btn.className = 'numpad-btn' + (wide ? ' wide' : '');
  btn.textContent = label;
  btn.addEventListener('pointerdown', () => {
    btn.classList.add('pressed');
    fn();
  });
  btn.addEventListener('pointerup', () => btn.classList.remove('pressed'));
  btn.addEventListener('pointercancel', () => btn.classList.remove('pressed'));
  return btn;
}

function numpadPress(digit, withSound = true) {
  if (G.locked) return;
  const inp = document.getElementById('answer-input');
  if (inp.value.length < 2) inp.value += digit;
  if (withSound) { playKeyTone(digit); showKeyBubble(digit); }
}

function renderQ() {
  const q = G.q;
  const row = document.getElementById('emoji-row');
  row.innerHTML = '';

  const gA = document.createElement('div');
  gA.className = 'emoji-group';
  for (let i = 0; i < q.a; i++) {
    const em = document.createElement('span');
    em.className = 'q-emoji';
    em.style.animationDelay = (i * 0.07) + 's';
    em.textContent = q.emojiA;
    gA.appendChild(em);
  }
  row.appendChild(gA);

  const plus = document.createElement('span');
  plus.className = 'eq-plus'; plus.textContent = '+';
  row.appendChild(plus);

  const gB = document.createElement('div');
  gB.className = 'emoji-group';
  for (let i = 0; i < q.b; i++) {
    const em = document.createElement('span');
    em.className = 'q-emoji';
    em.style.animationDelay = (q.a * 0.07 + 0.12 + i * 0.07) + 's';
    em.textContent = q.emojiB;
    gB.appendChild(em);
  }
  row.appendChild(gB);

  document.getElementById('q-text').textContent = `${q.a}  +  ${q.b}  =  ?`;
  document.getElementById('q-label').textContent = 'HOW MUCH IS...';

  const inp = document.getElementById('answer-input');
  inp.value = '';
  setTimeout(() => inp.focus(), 60);
}

function checkAnswer() {
  if (G.locked) return;
  const inp = document.getElementById('answer-input');
  const val = parseInt(inp.value, 10);
  if (isNaN(val)) { playWrongSound(); return; }

  G.locked = true;

  if (val === G.q.answer) {
    G.score += 10 + G.streak * 3;
    G.streak++;
    G.stars++;
    document.getElementById('score-val').textContent  = G.score;
    document.getElementById('streak-val').textContent = G.streak;

    const pip = document.createElement('span');
    pip.className = 'star-pip';
    pip.textContent = ['⭐','🌟','💫'][Math.floor(Math.random()*3)];
    document.getElementById('star-strip').appendChild(pip);

    playCorrectSound();
    const [emoji, msg] = CORRECT_MSGS[Math.floor(Math.random()*CORRECT_MSGS.length)];
    showFeedback(true, emoji, msg);
    spawnConfetti();
    spawnStars();

    setTimeout(() => {
      hideFeedback();
      G.locked = false;
      generateQ();
      renderQ();
    }, 1600);

  } else {
    G.streak = 0;
    document.getElementById('streak-val').textContent = 0;
    playWrongSound();
    const [emoji, msg] = WRONG_MSGS[Math.floor(Math.random()*WRONG_MSGS.length)];
    showFeedback(false, emoji, msg);

    const crt = document.getElementById('main-crt');
    crt.classList.remove('shaking'); void crt.offsetWidth;
    crt.classList.add('shaking');
    setTimeout(() => crt.classList.remove('shaking'), 400);

    setTimeout(() => {
      hideFeedback();
      G.locked = false;
      inp.value = '';
      setTimeout(() => inp.focus(), 60);
    }, 950);
  }
}

function showFeedback(correct, emoji, text) {
  const f = document.getElementById('feedback-flash');
  f.className = 'feedback-flash ' + (correct ? 'correct' : 'wrong');
  document.getElementById('flash-emoji').textContent = emoji;
  const ft = document.getElementById('flash-text');
  ft.textContent = text;
  ft.style.color = correct ? '#aaffaa' : '#ff9944';
  ft.style.textShadow = correct ? '0 0 14px rgba(0,255,0,0.7)' : '0 0 14px rgba(255,150,68,0.7)';
}

function hideFeedback() {
  document.getElementById('feedback-flash').className = 'feedback-flash';
}

function spawnConfetti() {
  const scr = document.getElementById('main-crt');
  const cols = ['#33ff33','#ffb000','#00ffff','#ff44ff','#aaffaa','#ff4444','#ffffff'];
  for (let i = 0; i < 32; i++) {
    const p = document.createElement('div');
    p.className = 'confetti-piece';
    p.style.left = (Math.random()*100) + '%';
    p.style.top  = '-12px';
    p.style.background = cols[Math.floor(Math.random()*cols.length)];
    p.style.animationDuration = (0.9 + Math.random()*1.3) + 's';
    p.style.animationDelay = (Math.random()*0.5) + 's';
    p.style.transform = `rotate(${Math.random()*360}deg)`;
    p.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
    scr.appendChild(p);
    setTimeout(() => p.remove(), 2500);
  }
}

function spawnStars() {
  const scr = document.getElementById('main-crt');
  const glyphs = ['⭐','🌟','💫','✨','🎉'];
  for (let i = 0; i < 10; i++) {
    const s = document.createElement('div');
    s.className = 'star-burst';
    s.textContent = glyphs[Math.floor(Math.random()*glyphs.length)];
    s.style.left = (15 + Math.random()*70) + '%';
    s.style.top  = (15 + Math.random()*65) + '%';
    const angle = Math.random() * 2 * Math.PI;
    const dist  = 50 + Math.random() * 110;
    s.style.setProperty('--dx', Math.cos(angle)*dist + 'px');
    s.style.setProperty('--dy', Math.sin(angle)*dist + 'px');
    s.style.animationDelay    = (Math.random()*0.2) + 's';
    s.style.animationDuration = (0.7 + Math.random()*0.6) + 's';
    scr.appendChild(s);
    setTimeout(() => s.remove(), 1600);
  }
}

function startNumberFun() {
  G = { score:0, streak:0, stars:0, q:null, locked:false };
  document.getElementById('score-val').textContent  = 0;
  document.getElementById('streak-val').textContent = 0;
  document.getElementById('star-strip').innerHTML = '';

  document.getElementById('game-screen').style.display = 'flex';

  buildNumpad();
  generateQ();
  renderQ();

}
