#!/usr/bin/env node
'use strict';
const { PNG } = require('pngjs');
const fs = require('fs');
const path = require('path');

const W = 48, H = 48;

// ─── palette (brighter, closer to reference) ──────────────
const PAL = {
  '.': [0,0,0,0],
  'K': [30,30,30,255],       // outline / eye black
  'B': [85,85,155,255],      // blue suit main
  'D': [65,65,125,255],      // blue suit shadow
  'L': [110,110,185,255],    // blue suit highlight
  'F': [240,220,185,255],    // face / skin cream
  'S': [215,195,160,255],    // skin shadow
  'W': [255,255,255,255],    // eye highlight
  'N': [40,38,35,255],       // nose
  'T': [70,70,135,255],      // tail
  'R': [180,130,80,255],     // brown snout
};

// ─── helpers ──────────────────────────────────────────────
function empty() { return Array.from({length:H}, ()=>Array(W).fill('.')); }
function px(g,x,y,c) { if(x>=0&&x<W&&y>=0&&y<H) g[y][x]=c; }
function hl(g,x,y,n,c) { for(let i=0;i<n;i++) px(g,x+i,y,c); }
function rect(g,x,y,w,h,c) { for(let j=0;j<h;j++) hl(g,x,y+j,w,c); }

function circle(g,cx,cy,r,c) {
  for(let y=cy-r;y<=cy+r;y++) for(let x=cx-r;x<=cx+r;x++) {
    if((x-cx)*(x-cx)+(y-cy)*(y-cy) <= r*r) px(g,x,y,c);
  }
}
function ellipse(g,cx,cy,rx,ry,c) {
  for(let y=cy-ry;y<=cy+ry;y++) for(let x=cx-rx;x<=cx+rx;x++) {
    const dx=(x-cx)/rx, dy=(y-cy)/ry;
    if(dx*dx+dy*dy <= 1) px(g,x,y,c);
  }
}

function outline(g) {
  const marks=[];
  for(let y=0;y<H;y++) for(let x=0;x<W;x++) {
    if(g[y][x]==='.') continue;
    if([[x-1,y],[x+1,y],[x,y-1],[x,y+1]].some(([ax,ay])=>
      ax<0||ax>=W||ay<0||ay>=H||g[ay][ax]==='.'))
      marks.push([x,y]);
  }
  for(const [x,y] of marks) g[y][x]='K';
}

// ─── build Felyne ─────────────────────────────────────────
function buildBase() {
  const g = empty();
  const cx = 24; // centre x

  // ── EARS (narrow, no side overhang) ──
  for(let y=1;y<=11;y++) {
    const spread = Math.floor((y-1)*0.7);
    hl(g, 13-spread, y, 1+spread*2, 'B');
    hl(g, 34-spread, y, 1+spread*2, 'B');
  }
  for(let y=4;y<=9;y++) {
    const spread = Math.max(0, Math.floor((y-3)*0.5));
    hl(g, 13-spread+1, y, Math.max(1, spread*2-1), 'L');
    hl(g, 34-spread+1, y, Math.max(1, spread*2-1), 'L');
  }

  // ── HOOD (large dome) ──
  ellipse(g, cx, 18, 15, 13, 'B');

  // Clip ear pixels that protrude beyond hood silhouette
  for(let y=16;y>=0;y--) {
    let curL=W, curR=-1, belowL=W, belowR=-1;
    for(let x=0;x<W;x++) {
      if(g[y][x]!=='.') { if(x<curL) curL=x; if(x>curR) curR=x; }
      if(g[y+1][x]!=='.') { if(x<belowL) belowL=x; if(x>belowR) belowR=x; }
    }
    if(belowL>=W) continue;
    for(let x=curL;x<Math.min(belowL,curR+1);x++) g[y][x]='.';
    for(let x=Math.max(belowR+1,curL);x<=curR;x++) g[y][x]='.';
  }

  // Hood shading
  for(let y=6;y<=28;y++) for(let x=0;x<W;x++) {
    if(g[y][x]==='B' && x>=cx+4) g[y][x]='D';
    if(g[y][x]==='B' && y<=13 && x<=cx-4) g[y][x]='L';
  }

  // ── FACE (cream oval opening in hood) ──
  ellipse(g, cx, 20, 9, 9, 'F');

  // Shadow ring around face edge
  for(let y=11;y<=29;y++) for(let x=15;x<=33;x++) {
    if(g[y][x]!=='F') continue;
    if([[x-1,y],[x+1,y],[x,y-1],[x,y+1]].some(([ax,ay])=>{
      if(ay<0||ay>=H||ax<0||ax>=W) return false;
      return 'BDL'.includes(g[ay][ax]);
    })) px(g,x,y,'S');
  }

  // ── BROWN SNOUT (under eyes and mouth) ──
  circle(g, 24, 22, 4, 'R');

  // ── EYES — black with crescent whites ──
  circle(g, 20, 19, 3, 'K');
  px(g, 17, 19, 'W'); px(g, 18, 20, 'W'); px(g, 19, 20, 'W');
  px(g, 18, 21, 'W'); px(g, 19, 21, 'W');

  circle(g, 28, 19, 3, 'K');
  px(g, 31, 19, 'W'); px(g, 29, 20, 'W'); px(g, 30, 20, 'W');
  px(g, 29, 21, 'W'); px(g, 30, 21, 'W');

  // ── MOUTH (ω shape) ──
  px(g, 21, 23, 'K');
  px(g, 22, 24, 'K'); px(g, 23, 24, 'K');
  px(g, 24, 23, 'K');
  px(g, 25, 24, 'K'); px(g, 26, 24, 'K');
  px(g, 27, 23, 'K');

  // ── BODY (blue suit) ──
  ellipse(g, cx, 37, 10, 8, 'B');
  // Shadow on right side of body
  for(let y=30;y<=45;y++) for(let x=cx+3;x<=35;x++) {
    if(g[y][x]==='B') g[y][x]='D';
  }

  // (no belly — covered by suit)

  // ── HANDS (round balls, key feature!) ──
  circle(g, 12, 34, 3, 'F');   // left
  circle(g, 36, 34, 3, 'F');   // right
  // Hand shadow bottom
  for(let y=35;y<=37;y++) {
    if(g[y][10]==='F') px(g,10,y,'S');
    if(g[y][11]==='F') px(g,11,y,'S');
    if(g[y][37]==='F') px(g,37,y,'S');
    if(g[y][38]==='F') px(g,38,y,'S');
  }

  // ── FEET ──
  ellipse(g, 20, 44, 3, 2, 'F');
  ellipse(g, 28, 44, 3, 2, 'F');

  // ── OUTLINE ──
  outline(g);

  return g;
}

// ─── animation variants ───────────────────────────────────
function shiftY(g, dy) {
  const e = Array(W).fill('.');
  return Array.from({length:H}, (_,y)=> {
    const s=y-dy; return s>=0&&s<H ? [...g[s]] : [...e];
  });
}

function buildBlink() {
  const g = buildBase();
  // Clear eyes, draw closed lines
  circle(g, 20, 19, 3, 'F');
  circle(g, 28, 19, 3, 'F');
  hl(g, 18, 19, 5, 'K'); hl(g, 18, 20, 5, 'K');
  hl(g, 26, 19, 5, 'K'); hl(g, 26, 20, 5, 'K');
  return g;
}

function buildWave() {
  const g = buildBase();
  // Raise left hand
  circle(g, 12, 34, 3, 'B');  // cover old hand
  outline(g);
  // Draw raised hand
  circle(g, 13, 28, 3, 'F');
  // Re-outline around new hand
  for(let y=25;y<=31;y++) for(let x=10;x<=16;x++) {
    if(g[y][x]==='.') continue;
    if([[x-1,y],[x+1,y],[x,y-1],[x,y+1]].some(([ax,ay])=>
      ax<0||ax>=W||ay<0||ay>=H||g[ay][ax]==='.'))
      px(g,x,y,'K');
  }
  return g;
}

// ─── PNG rendering ────────────────────────────────────────
function gridToPng(g, scale) {
  const pw=W*scale, ph=H*scale;
  const png=new PNG({width:pw,height:ph});
  for(let y=0;y<H;y++) for(let x=0;x<W;x++) {
    const c=PAL[g[y][x]]||PAL['.'];
    for(let sy=0;sy<scale;sy++) for(let sx=0;sx<scale;sx++) {
      const i=((y*scale+sy)*pw+(x*scale+sx))*4;
      png.data[i]=c[0]; png.data[i+1]=c[1]; png.data[i+2]=c[2]; png.data[i+3]=c[3];
    }
  }
  return PNG.sync.write(png);
}

function printGrid(g, label) {
  console.log(`\n=== ${label} ===`);
  for(let y=0;y<H;y++) console.log(g[y].join(''));
}

// ─── main ─────────────────────────────────────────────────
const outDir = path.join(__dirname,'..','assets','sprites');
fs.mkdirSync(outDir,{recursive:true});

const base = buildBase();
const idle1 = shiftY(base, 1);
const idle2 = shiftY(base, -1);
const blink = buildBlink();
const wave = buildWave();

printGrid(base, 'base');

const frames = { base, idle1, idle2, blink, wave };
for(const [name, g] of Object.entries(frames)) {
  fs.writeFileSync(path.join(outDir, `felyne_${name}_48.png`), gridToPng(g, 1));
  fs.writeFileSync(path.join(outDir, `felyne_${name}_384.png`), gridToPng(g, 8));
}

console.log(`\n✓ wrote ${Object.keys(frames).length * 2} PNGs to ${outDir}`);
