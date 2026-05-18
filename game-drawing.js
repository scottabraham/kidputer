/* ══════════════════════════════════════════════
   PIXEL PAINTER GAME
══════════════════════════════════════════════ */

const PAINT_COLORS = [
  '#33ff33','#aaffaa','#00ff88','#00ff44',
  '#ffb000','#ffdd44','#ff8800','#ffcc00',
  '#00ffff','#44ddff','#00bbff','#88ffff',
  '#ff44ff','#ff88ff','#cc00ff','#ff00aa',
  '#ff4444','#ff6644','#ffaa44','#ff2266',
  '#4488ff','#8844ff','#44ffcc','#6666ff',
  '#ffffff','#ffffaa','#ffaaff','#aaffff',
];

let paintCanvas      = null;
let paintCtx         = null;
let blobCount        = 0;
let drawingActive    = false;
let _drawKeyHandler  = null;

function _randomColor() {
  return PAINT_COLORS[Math.floor(Math.random() * PAINT_COLORS.length)];
}

function _drawStar(ctx, spikes, outer, inner) {
  const step = Math.PI / spikes;
  let rot = -(Math.PI / 2);
  ctx.moveTo(Math.cos(rot) * outer, Math.sin(rot) * outer);
  for (let i = 0; i < spikes; i++) {
    rot += step;
    ctx.lineTo(Math.cos(rot) * inner, Math.sin(rot) * inner);
    rot += step;
    ctx.lineTo(Math.cos(rot) * outer, Math.sin(rot) * outer);
  }
  ctx.closePath();
}

function _drawBlob(ctx, r) {
  const n    = 7 + Math.floor(Math.random() * 4);
  const step = (Math.PI * 2) / n;
  const radii = Array.from({length: n + 1}, () => r * (0.55 + Math.random() * 0.9));
  ctx.moveTo(radii[0], 0);
  for (let i = 0; i < n; i++) {
    const a0 = i * step, a1 = (i + 1) * step;
    ctx.bezierCurveTo(
      radii[i]   * Math.cos(a0 + step * 0.35), radii[i]   * Math.sin(a0 + step * 0.35),
      radii[i+1] * Math.cos(a1 - step * 0.35), radii[i+1] * Math.sin(a1 - step * 0.35),
      radii[i+1] * Math.cos(a1),               radii[i+1] * Math.sin(a1)
    );
  }
  ctx.closePath();
}

function _drawSplat(ctx, r) {
  const spikes = 9 + Math.floor(Math.random() * 7);
  const step   = (Math.PI * 2) / spikes;
  for (let i = 0; i < spikes; i++) {
    const a  = i * step;
    const sr = r * (0.5 + Math.random() * 0.9);
    const ma = a - step / 2;
    const mr = r * (0.15 + Math.random() * 0.2);
    if (i === 0) ctx.moveTo(sr * Math.cos(a), sr * Math.sin(a));
    else ctx.quadraticCurveTo(mr * Math.cos(ma), mr * Math.sin(ma), sr * Math.cos(a), sr * Math.sin(a));
  }
  ctx.closePath();
}

function paintBlob(x, y) {
  if (!paintCtx) return;

  const SHAPES = ['circle','ellipse','rect','triangle','star5','star4','blob','splat','diamond','hexagon'];
  const shape  = SHAPES[Math.floor(Math.random() * SHAPES.length)];
  const size   = 18 + Math.random() * 68;
  const color  = _randomColor();
  const r      = size / 2;

  paintCtx.save();
  paintCtx.globalAlpha = 0.65 + Math.random() * 0.35;
  paintCtx.fillStyle   = color;
  paintCtx.shadowColor = color;
  paintCtx.shadowBlur  = 8 + Math.random() * 16;
  paintCtx.translate(x, y);
  paintCtx.rotate(Math.random() * Math.PI * 2);
  paintCtx.beginPath();

  switch (shape) {
    case 'circle':
      paintCtx.arc(0, 0, r, 0, Math.PI * 2);
      break;
    case 'ellipse':
      paintCtx.ellipse(0, 0, r, r * (0.3 + Math.random() * 0.45), 0, 0, Math.PI * 2);
      break;
    case 'rect': {
      const w = size * (0.6 + Math.random() * 0.6), h = size * (0.6 + Math.random() * 0.6);
      paintCtx.rect(-w / 2, -h / 2, w, h);
      break;
    }
    case 'triangle':
      for (let i = 0; i < 3; i++) {
        const a = (i * 2 * Math.PI / 3) - Math.PI / 2;
        if (i === 0) paintCtx.moveTo(r * Math.cos(a), r * Math.sin(a));
        else         paintCtx.lineTo(r * Math.cos(a), r * Math.sin(a));
      }
      paintCtx.closePath();
      break;
    case 'star5':
      _drawStar(paintCtx, 5, r, r * 0.42);
      break;
    case 'star4':
      _drawStar(paintCtx, 4, r, r * 0.38);
      break;
    case 'blob':
      _drawBlob(paintCtx, r);
      break;
    case 'splat':
      _drawSplat(paintCtx, r);
      break;
    case 'diamond':
      paintCtx.moveTo(0, -r);
      paintCtx.lineTo(r * 0.55, 0);
      paintCtx.lineTo(0, r);
      paintCtx.lineTo(-r * 0.55, 0);
      paintCtx.closePath();
      break;
    case 'hexagon':
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i - Math.PI / 6;
        if (i === 0) paintCtx.moveTo(r * Math.cos(a), r * Math.sin(a));
        else         paintCtx.lineTo(r * Math.cos(a), r * Math.sin(a));
      }
      paintCtx.closePath();
      break;
  }

  paintCtx.fill();
  paintCtx.restore();

  blobCount++;
  const el = document.getElementById('blob-count');
  if (el) el.textContent = blobCount;
}

function clearCanvas() {
  if (!paintCtx || !paintCanvas) return;
  paintCtx.clearRect(0, 0, paintCanvas.width, paintCanvas.height);
  blobCount = 0;
  const el = document.getElementById('blob-count');
  if (el) el.textContent = 0;
  playKeyTone('C');
}

function startPixelPainter() {
  drawingActive = true;
  blobCount     = 0;

  document.getElementById('drawing-screen').style.display = 'flex';

  paintCanvas = document.getElementById('paint-canvas');
  paintCtx    = null;

  const ro = new ResizeObserver(entries => {
    for (const entry of entries) {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) {
        paintCanvas.width  = Math.round(width);
        paintCanvas.height = Math.round(height);
        paintCtx = paintCanvas.getContext('2d');
        ro.disconnect();
      }
    }
  });
  ro.observe(paintCanvas);

  paintCanvas.addEventListener('click', e => {
    if (!drawingActive) return;
    const rect   = paintCanvas.getBoundingClientRect();
    const scaleX = paintCanvas.width  / rect.width;
    const scaleY = paintCanvas.height / rect.height;
    paintBlob((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY);
  });

  paintCanvas.addEventListener('touchstart', e => {
    if (!drawingActive) return;
    e.preventDefault();
    const rect   = paintCanvas.getBoundingClientRect();
    const scaleX = paintCanvas.width  / rect.width;
    const scaleY = paintCanvas.height / rect.height;
    Array.from(e.changedTouches).forEach(t => {
      paintBlob((t.clientX - rect.left) * scaleX, (t.clientY - rect.top) * scaleY);
    });
  }, { passive: false });
}

function stopPixelPainter() {
  drawingActive = false;
  if (_drawKeyHandler) {
    document.removeEventListener('keydown', _drawKeyHandler);
    _drawKeyHandler = null;
  }
}
