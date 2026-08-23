#!/usr/bin/env node
'use strict';
const { PNG } = require('pngjs');
const fs = require('fs');
const path = require('path');

// ─── constants ────────────────────────────────────────────
const W = 48, H = 48;
const PALETTE = {
  '.': [0,0,0,0],
  'K': [43,31,26,255],
  'H': [196,116,74,255],
  'L': [224,148,104,255],
  'D': [143,78,48,255],
  'F': [242,227,200,255],
  'S': [217,194,160,255],
  'B': [107,107,120,255],
  'W': [255,255,255,255],
};

// ─── drawing helpers ──────────────────────────────────────
function grid()  { return Array.from({length:H}, ()=> Array(W).fill('.')); }
function px(g,x,y,c) { if(x>=0&&x<W&&y>=0&&y<H) g[y][x]=c; }
function hline(g,x,y,n,c) { for(let i=0;i<n;i++) px(g,x+i,y,c); }
function rect(g,x,y,w,h,c) { for(let j=0;j<h;j++) hline(g,x,y+j,w,c); }
function fillSpan(g,rows,c) { for(const [y,l,r] of rows) hline(g,l,y,r-l+1,c); }

// ─── shape bounds ─────────────────────────────────────────
// Left ear: tip (13,2), base y=14, x 8‑18   2:1 staircase
const L_EAR = [
  [2,13,13],
  [3,12,14],[4,12,14],
  [5,11,15],[6,11,15],
  [7,10,16],[8,10,16],
  [9,9,17],[10,9,17],[11,9,17],
  [12,8,18],[13,8,18],[14,8,18],
];
// Right ear: tip (34,2), base y=14, x 29‑39
const R_EAR = [
  [2,34,34],
  [3,33,35],[4,33,35],
  [5,32,36],[6,32,36],
  [7,31,37],[8,31,37],
  [9,30,38],[10,30,38],[11,30,38],
  [12,29,39],[13,29,39],[14,29,39],
];

function seq(a,b) { return Array.from({length:b-a+1},(_,i)=>a+i); }

// Hood dome y=8‑34, widest x 6‑41
const DOME = [
  [8,16,31],[9,14,33],[10,12,35],[11,10,37],
  [12,9,38],[13,8,39],[14,7,40],
  ...seq(15,29).map(y=>[y,6,41]),
  [30,7,40],[31,7,40],[32,8,39],[33,9,38],[34,10,37],
];

// Face opening (vertical ellipse) x 15‑32, y 15‑31
const FACE = [
  [15,20,27],
  [16,18,29],
  [17,16,31],
  [18,15,32],
  ...seq(19,27).map(y=>[y,15,32]),
  [28,16,31],
  [29,17,30],
  [30,19,28],
  [31,21,26],
];
const faceSet = new Set();
for (const [y,l,r] of FACE) for (let x=l;x<=r;x++) faceSet.add(y*W+x);

// Body y=34‑47, x 10‑37
const BODY = seq(34,47).map(y=>[y,10,37]);

// ─── outline pass ─────────────────────────────────────────
function outline(g) {
  const marks = [];
  for (let y=0;y<H;y++) for (let x=0;x<W;x++) {
    if (g[y][x]==='.') continue;
    if (x===0||g[y][x-1]==='.'||x===W-1||g[y][x+1]==='.'||
        y===0||g[y-1][x]==='.'||y===H-1||g[y+1][x]==='.') marks.push([x,y]);
  }
  for (const [x,y] of marks) g[y][x]='K';
}

// ─── build base frame ─────────────────────────────────────
function buildBase() {
  const g = grid();

  // 1) ears
  fillSpan(g, L_EAR, 'H');
  fillSpan(g, R_EAR, 'H');

  // 2) hood dome
  fillSpan(g, DOME, 'H');

  // 3) hood shading — L highlight upper-left, D dark bottom + right
  for (let y=0;y<H;y++) for (let x=0;x<W;x++) {
    if (g[y][x]!=='H') continue;
    if (y<=18 && x>=10 && x<=20)        g[y][x]='L';
    else if (y>=28 || (y>=18 && x>=33)) g[y][x]='D';
  }

  // 4) body
  fillSpan(g, BODY, 'B');

  // 5) face opening — F fill, S shadow ring
  for (const [y,l,r] of FACE) hline(g,l,y,r-l+1,'F');
  for (const [y,l,r] of FACE) for (let x=l;x<=r;x++) {
    const nb = [[x-1,y],[x+1,y],[x,y-1],[x,y+1]];
    if (nb.some(([nx,ny])=> !faceSet.has(ny*W+nx))) px(g,x,y,'S');
  }

  // 6) brow — y 17‑18 x 16‑31, arch centre at y 16
  hline(g,16,17,16,'K');
  hline(g,16,18,16,'K');
  hline(g,20,16, 8,'K');            // arch centre

  // 7) eyes — 6×8 each, solid K, 2×2 W highlight top-left
  rect(g,17,19,6,8,'K');  rect(g,25,19,6,8,'K');
  rect(g,17,19,2,2,'W');  rect(g,25,19,2,2,'W');

  // 8) nose — inverted triangle at x 22‑25, y 27‑28
  hline(g,22,27,4,'K');
  hline(g,23,28,2,'K');

  // 9) mouth — w-shape y 28‑29, centred
  px(g,21,29,'K'); px(g,22,28,'K'); px(g,23,28,'K'); px(g,24,29,'K');

  // 10) paws — two 4×3 F blocks at body bottom centre
  rect(g,17,45,4,3,'F');
  rect(g,27,45,4,3,'F');

  // 11) outer outline
  outline(g);

  return g;
}

// ─── variant frames ───────────────────────────────────────
function buildIdle1() {
  const base = buildBase();
  const g = grid();
  // keep ear tips (rows 0‑2)
  for (let y=0;y<=2;y++) g[y]=[...base[y]];
  // duplicate row 3 for stretch
  g[3]=[...base[3]];
  // shift rows 3+ down by 1
  for (let y=3;y<H-1;y++) g[y+1]=[...base[y]];
  return g;
}

function buildBlink() {
  const g = buildBase();
  // clear eye area
  for (let y=19;y<=26;y++) { hline(g,17,y,6,'F'); hline(g,25,y,6,'F'); }
  // closed-eye dashes at y 22‑23
  hline(g,17,22,6,'K'); hline(g,17,23,6,'K');
  hline(g,25,22,6,'K'); hline(g,25,23,6,'K');
  return g;
}

// ─── PNG helpers ──────────────────────────────────────────
function gridToPng(g, scale) {
  const pw=W*scale, ph=H*scale;
  const png=new PNG({width:pw,height:ph});
  for (let y=0;y<H;y++) for (let x=0;x<W;x++) {
    const c=PALETTE[g[y][x]]||PALETTE['.'];
    for (let sy=0;sy<scale;sy++) for (let sx=0;sx<scale;sx++) {
      const i=((y*scale+sy)*pw+(x*scale+sx))*4;
      png.data[i]=c[0]; png.data[i+1]=c[1]; png.data[i+2]=c[2]; png.data[i+3]=c[3];
    }
  }
  return PNG.sync.write(png);
}

function sheetPng(grids, scale) {
  const sw=W*grids.length*scale, sh=H*scale;
  const png=new PNG({width:sw,height:sh});
  for (let f=0;f<grids.length;f++) {
    const g=grids[f];
    for (let y=0;y<H;y++) for (let x=0;x<W;x++) {
      const c=PALETTE[g[y][x]]||PALETTE['.'];
      for (let sy=0;sy<scale;sy++) for (let sx=0;sx<scale;sx++) {
        const i=((y*scale+sy)*sw+((f*W+x)*scale+sx))*4;
        png.data[i]=c[0]; png.data[i+1]=c[1]; png.data[i+2]=c[2]; png.data[i+3]=c[3];
      }
    }
  }
  return PNG.sync.write(png);
}

// ─── print grid to terminal ───────────────────────────────
function printGrid(g, label) {
  console.log(`\n=== ${label} (${W}×${H}) ===`);
  for (let y=0;y<H;y++) console.log(g[y].join(''));
}

// ─── main ─────────────────────────────────────────────────
const outDir = path.join(__dirname,'..','assets','sprites');
fs.mkdirSync(outDir,{recursive:true});

const idle0 = buildBase();
const idle1 = buildIdle1();
const blink = buildBlink();

// print grids
printGrid(idle0, 'frame_idle_0');
printGrid(idle1, 'frame_idle_1');
printGrid(blink, 'frame_blink');

// write 1× (48×48) individual frames
fs.writeFileSync(path.join(outDir,'idle0_48.png'), gridToPng(idle0,1));
fs.writeFileSync(path.join(outDir,'idle1_48.png'), gridToPng(idle1,1));
fs.writeFileSync(path.join(outDir,'blink_48.png'), gridToPng(blink,1));

// write 8× (384×384) individual frames
fs.writeFileSync(path.join(outDir,'idle0_384.png'), gridToPng(idle0,8));
fs.writeFileSync(path.join(outDir,'idle1_384.png'), gridToPng(idle1,8));
fs.writeFileSync(path.join(outDir,'blink_384.png'), gridToPng(blink,8));

// write sprite sheets (1× and 8×)
const frames = [idle0, idle1, blink];
fs.writeFileSync(path.join(outDir,'sheet_48.png'), sheetPng(frames,1));
fs.writeFileSync(path.join(outDir,'sheet_384.png'), sheetPng(frames,8));

console.log(`\n✓ wrote ${8} PNGs to ${outDir}`);
