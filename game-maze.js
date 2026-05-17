/* ══════════════════════════════════════════════
   BUNNY MAZE GAME
══════════════════════════════════════════════ */

let mazeCanvas     = null;
let mazeCtx        = null;
let mazeCells      = null;
let mazeRows       = 0;
let mazeCols       = 0;
let mazePlayer     = { r: 0, c: 0 };
let mazeActive     = false;
let mazeWon        = false;
let mazeKeyHandler = null;
let mazeVisited    = null;

const MAZE_SIZES = [
  { rows: 5, cols: 5 },
  { rows: 5, cols: 7 },
  { rows: 7, cols: 7 },
  { rows: 7, cols: 9 },
];

const MAZE_WIN_PHRASES = [
  'BUNNY FOUND HER CARROT!',
  'YUM! CRUNCHY AND DELICIOUS!',
  'BUNNY IS SO HAPPY NOW!',
  'AMAZING BUNNY EXPLORER!',
  'HOORAY! BEST BUNNY EVER!',
  'THAT CARROT LOOKS YUMMY!',
];

function _mazeShuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function _generateMaze(rows, cols) {
  const cells = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      top: true, right: true, bottom: true, left: true, visited: false
    }))
  );

  function carve(r, c) {
    cells[r][c].visited = true;
    for (const [dr, dc, wall, opp] of _mazeShuffle([
      [-1, 0, 'top',    'bottom'],
      [ 0, 1, 'right',  'left'  ],
      [ 1, 0, 'bottom', 'top'   ],
      [ 0,-1, 'left',   'right' ],
    ])) {
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !cells[nr][nc].visited) {
        cells[r][c][wall] = false;
        cells[nr][nc][opp] = false;
        carve(nr, nc);
      }
    }
  }

  carve(0, 0);
  // Open entrance top and exit bottom for clarity
  cells[0][0].top = false;
  cells[rows - 1][cols - 1].bottom = false;
  return cells;
}

function _drawMaze() {
  if (!mazeCtx || !mazeCells) return;
  const ctx = mazeCtx;
  const W = mazeCanvas.width, H = mazeCanvas.height;
  const rows = mazeRows, cols = mazeCols;

  ctx.clearRect(0, 0, W, H);

  const pad  = Math.round(Math.min(W, H) * 0.04);
  const cellW = Math.floor((W - pad * 2) / cols);
  const cellH = Math.floor((H - pad * 2) / rows);
  const ox   = Math.round((W - cellW * cols) / 2);
  const oy   = Math.round((H - cellH * rows) / 2);

  // Visited trail
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (mazeVisited[r][c] && !(r === mazePlayer.r && c === mazePlayer.c)) {
        ctx.fillStyle = 'rgba(255,176,0,0.10)';
        ctx.fillRect(ox + c * cellW + 2, oy + r * cellH + 2, cellW - 4, cellH - 4);
      }
    }
  }

  // Goal glow
  ctx.fillStyle = 'rgba(51,255,51,0.13)';
  ctx.fillRect(ox + (cols-1)*cellW + 2, oy + (rows-1)*cellH + 2, cellW - 4, cellH - 4);

  // Player glow
  ctx.fillStyle = 'rgba(255,176,0,0.22)';
  ctx.fillRect(ox + mazePlayer.c*cellW + 2, oy + mazePlayer.r*cellH + 2, cellW - 4, cellH - 4);

  // Maze walls
  const lw = Math.max(2, Math.round(Math.min(cellW, cellH) * 0.09));
  ctx.strokeStyle = '#ffb000';
  ctx.lineWidth   = lw;
  ctx.lineCap     = 'round';

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = ox + c * cellW, y = oy + r * cellH;
      const cell = mazeCells[r][c];
      ctx.beginPath();
      if (cell.top)    { ctx.moveTo(x,       y);       ctx.lineTo(x+cellW, y);       }
      if (cell.right)  { ctx.moveTo(x+cellW, y);       ctx.lineTo(x+cellW, y+cellH); }
      if (cell.bottom) { ctx.moveTo(x,       y+cellH); ctx.lineTo(x+cellW, y+cellH); }
      if (cell.left)   { ctx.moveTo(x,       y);       ctx.lineTo(x,       y+cellH); }
      ctx.stroke();
    }
  }

  // Emoji rendering
  const ems = Math.round(Math.min(cellW, cellH) * 0.62);
  ctx.font          = `${ems}px serif`;
  ctx.textAlign     = 'center';
  ctx.textBaseline  = 'middle';

  // Carrot at goal
  ctx.fillText('🥕', ox + (cols-1)*cellW + cellW/2, oy + (rows-1)*cellH + cellH/2);

  // Rabbit at player position
  ctx.fillText('🐰', ox + mazePlayer.c*cellW + cellW/2, oy + mazePlayer.r*cellH + cellH/2);
}

function mazeMove(dir) {
  if (!mazeActive || mazeWon) return;
  const { r, c } = mazePlayer;
  const cell = mazeCells[r][c];
  let nr = r, nc = c;

  if (dir === 'up'    && !cell.top)    nr--;
  if (dir === 'right' && !cell.right)  nc++;
  if (dir === 'down'  && !cell.bottom) nr++;
  if (dir === 'left'  && !cell.left)   nc--;

  if (nr !== r || nc !== c) {
    mazePlayer = { r: nr, c: nc };
    mazeVisited[nr][nc] = true;
    playKeyTone(dir[0]);
    _drawMaze();

    if (nr === mazeRows - 1 && nc === mazeCols - 1) {
      mazeWon = true;
      setTimeout(_showMazeWin, 400);
    }
  }
}

function _showMazeWin() {
  playFanfare();
  const phrase = MAZE_WIN_PHRASES[Math.floor(Math.random() * MAZE_WIN_PHRASES.length)];
  document.getElementById('maze-win-phrase').textContent = phrase;
  document.getElementById('maze-win-overlay').style.display = 'flex';
  spawnConfetti();
  spawnConfetti(); // extra celebration for a 5-year-old!
}

function mazePlayAgain() {
  document.getElementById('maze-win-overlay').style.display = 'none';
  mazeWon = false;

  const size = MAZE_SIZES[Math.floor(Math.random() * MAZE_SIZES.length)];
  mazeRows   = size.rows;
  mazeCols   = size.cols;
  mazeCells  = _generateMaze(mazeRows, mazeCols);
  mazePlayer = { r: 0, c: 0 };
  mazeVisited = Array.from({ length: mazeRows }, () => Array(mazeCols).fill(false));
  mazeVisited[0][0] = true;

  _drawMaze();
}

function startBunnyMaze() {
  mazeActive = true;
  mazeWon    = false;

  document.getElementById('maze-screen').style.display     = 'flex';
  document.getElementById('maze-win-overlay').style.display = 'none';

  mazeCanvas = document.getElementById('maze-canvas');
  mazeCtx    = null;

  const size = MAZE_SIZES[Math.floor(Math.random() * MAZE_SIZES.length)];
  mazeRows   = size.rows;
  mazeCols   = size.cols;
  mazeCells  = _generateMaze(mazeRows, mazeCols);
  mazePlayer = { r: 0, c: 0 };
  mazeVisited = Array.from({ length: mazeRows }, () => Array(mazeCols).fill(false));
  mazeVisited[0][0] = true;

  const ro = new ResizeObserver(entries => {
    for (const entry of entries) {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) {
        mazeCanvas.width  = Math.round(width);
        mazeCanvas.height = Math.round(height);
        mazeCtx = mazeCanvas.getContext('2d');
        _drawMaze();
        ro.disconnect();
      }
    }
  });
  ro.observe(mazeCanvas);

  mazeKeyHandler = e => {
    if (!mazeActive) return;
    const map = {
      ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
      w: 'up', s: 'down', a: 'left', d: 'right',
    };
    if (map[e.key]) { e.preventDefault(); mazeMove(map[e.key]); }
  };
  document.addEventListener('keydown', mazeKeyHandler);
}

function stopBunnyMaze() {
  mazeActive = false;
  if (mazeKeyHandler) {
    document.removeEventListener('keydown', mazeKeyHandler);
    mazeKeyHandler = null;
  }
}
