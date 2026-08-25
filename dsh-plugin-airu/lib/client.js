// Airu (Felyne) floating pet — DSH browser client
// Renders a pixel-art Felyne on a canvas, mounted via portal on document.body

window.__ModuleLoader__.load({
  id: 'dsh-plugin-airu',
  factory: (require) => {
    const React = require('react');
    const ReactDOM = require('react-dom');
    const { createElement: h, useRef, useEffect, useState, useCallback } = React;

    // ─── Palette ─────────────────────────────────────────
    const PAL = {
      '.': [0,0,0,0],
      'K': [30,30,30,255],
      'B': [85,85,155,255],
      'D': [65,65,125,255],
      'L': [110,110,185,255],
      'F': [240,220,185,255],
      'S': [215,195,160,255],
      'W': [255,255,255,255],
      'N': [40,38,35,255],
      'T': [70,70,135,255],
      'R': [180,130,80,255],
    };

    const FW = 48, FH = 48;

    // ─── Drawing helpers ─────────────────────────────────
    function empty() { return Array.from({length:FH}, ()=>Array(FW).fill('.')); }
    function px(g,x,y,c) { if(x>=0&&x<FW&&y>=0&&y<FH) g[y][x]=c; }
    function hl(g,x,y,n,c) { for(let i=0;i<n;i++) px(g,x+i,y,c); }
    function rect(g,x,y,w,h,c) { for(let j=0;j<h;j++) hl(g,x,y+j,w,c); }
    function circle(g,cx,cy,r,c) {
      for(let y=cy-r;y<=cy+r;y++) for(let x=cx-r;x<=cx+r;x++)
        if((x-cx)*(x-cx)+(y-cy)*(y-cy)<=r*r) px(g,x,y,c);
    }
    function ellipse(g,cx,cy,rx,ry,c) {
      for(let y=cy-ry;y<=cy+ry;y++) for(let x=cx-rx;x<=cx+rx;x++) {
        const dx=(x-cx)/rx, dy=(y-cy)/ry;
        if(dx*dx+dy*dy<=1) px(g,x,y,c);
      }
    }
    function outline(g) {
      const marks=[];
      for(let y=0;y<FH;y++) for(let x=0;x<FW;x++) {
        if(g[y][x]==='.') continue;
        if([[x-1,y],[x+1,y],[x,y-1],[x,y+1]].some(([ax,ay])=>
          ax<0||ax>=FW||ay<0||ay>=FH||g[ay][ax]==='.'))
          marks.push([x,y]);
      }
      for(const [x,y] of marks) g[y][x]='K';
    }
    function shiftY(g,dy) {
      const e=Array(FW).fill('.');
      return Array.from({length:FH},(_,y)=>{
        const s=y-dy; return s>=0&&s<FH?[...g[s]]:[...e];
      });
    }

    // ─── Build Felyne ────────────────────────────────────
    function buildBase() {
      const g = empty();
      const cx = 24;

      // Ears
      for(let y=1;y<=11;y++) {
        const spread=Math.floor((y-1)*0.7);
        hl(g,13-spread,y,1+spread*2,'B');
        hl(g,34-spread,y,1+spread*2,'B');
      }
      for(let y=4;y<=9;y++) {
        const spread=Math.max(0,Math.floor((y-3)*0.5));
        hl(g,13-spread+1,y,Math.max(1,spread*2-1),'L');
        hl(g,34-spread+1,y,Math.max(1,spread*2-1),'L');
      }

      // Hood
      ellipse(g,cx,18,15,13,'B');

      // Clip ear protrusions
      for(let y=16;y>=0;y--) {
        let curL=FW,curR=-1,belowL=FW,belowR=-1;
        for(let x=0;x<FW;x++) {
          if(g[y][x]!=='.') { if(x<curL) curL=x; if(x>curR) curR=x; }
          if(g[y+1][x]!=='.') { if(x<belowL) belowL=x; if(x>belowR) belowR=x; }
        }
        if(belowL>=FW) continue;
        for(let x=curL;x<Math.min(belowL,curR+1);x++) g[y][x]='.';
        for(let x=Math.max(belowR+1,curL);x<=curR;x++) g[y][x]='.';
      }

      // Hood shading
      for(let y=6;y<=28;y++) for(let x=0;x<FW;x++) {
        if(g[y][x]==='B'&&x>=cx+4) g[y][x]='D';
        if(g[y][x]==='B'&&y<=13&&x<=cx-4) g[y][x]='L';
      }

      // Face
      ellipse(g,cx,20,9,9,'F');
      for(let y=11;y<=29;y++) for(let x=15;x<=33;x++) {
        if(g[y][x]!=='F') continue;
        if([[x-1,y],[x+1,y],[x,y-1],[x,y+1]].some(([ax,ay])=>{
          if(ay<0||ay>=FH||ax<0||ax>=FW) return false;
          return 'BDL'.includes(g[ay][ax]);
        })) px(g,x,y,'S');
      }

      // Brown snout
      circle(g,24,22,4,'R');

      // Eyes — crescent whites
      circle(g,20,19,3,'K');
      px(g,17,19,'W'); px(g,18,20,'W'); px(g,19,20,'W');
      px(g,18,21,'W'); px(g,19,21,'W');
      circle(g,28,19,3,'K');
      px(g,31,19,'W'); px(g,29,20,'W'); px(g,30,20,'W');
      px(g,29,21,'W'); px(g,30,21,'W');

      // Mouth (ω)
      px(g,21,23,'K'); px(g,22,24,'K'); px(g,23,24,'K');
      px(g,24,23,'K'); px(g,25,24,'K'); px(g,26,24,'K');
      px(g,27,23,'K');

      // Body
      ellipse(g,cx,37,10,8,'B');
      for(let y=30;y<=45;y++) for(let x=cx+3;x<=35;x++) {
        if(g[y][x]==='B') g[y][x]='D';
      }

      // Hands
      circle(g,12,34,3,'F');
      circle(g,36,34,3,'F');
      for(let y=35;y<=37;y++) {
        if(g[y]&&g[y][10]==='F') px(g,10,y,'S');
        if(g[y]&&g[y][11]==='F') px(g,11,y,'S');
        if(g[y]&&g[y][37]==='F') px(g,37,y,'S');
        if(g[y]&&g[y][38]==='F') px(g,38,y,'S');
      }

      // Feet
      ellipse(g,20,44,3,2,'F');
      ellipse(g,28,44,3,2,'F');

      outline(g);
      return g;
    }

    function buildBlink() {
      const g = buildBase();
      circle(g,20,19,3,'F');
      circle(g,28,19,3,'F');
      hl(g,18,19,5,'K'); hl(g,18,20,5,'K');
      hl(g,26,19,5,'K'); hl(g,26,20,5,'K');
      return g;
    }

    function buildWave() {
      const g = buildBase();
      circle(g,12,34,3,'B');
      outline(g);
      circle(g,13,28,3,'F');
      for(let y=25;y<=31;y++) for(let x=10;x<=16;x++) {
        if(g[y][x]==='.') continue;
        if([[x-1,y],[x+1,y],[x,y-1],[x,y+1]].some(([ax,ay])=>
          ax<0||ax>=FW||ay<0||ay>=FH||g[ay][ax]==='.'))
          px(g,x,y,'K');
      }
      return g;
    }

    function gridToImageData(g) {
      const d = new Uint8ClampedArray(FW*FH*4);
      for(let y=0;y<FH;y++) for(let x=0;x<FW;x++) {
        const c = PAL[g[y][x]]||PAL['.'];
        const i=(y*FW+x)*4;
        d[i]=c[0]; d[i+1]=c[1]; d[i+2]=c[2]; d[i+3]=c[3];
      }
      return new ImageData(d,FW,FH);
    }

    // ─── Precompute sprite frames ────────────────────────
    const base = buildBase();
    const SPRITES = {
      idle: { frames: [base, shiftY(base,1), base, shiftY(base,-1)].map(gridToImageData), fps: 3 },
      talk: { frames: [buildWave(), base].map(gridToImageData), fps: 4 },
      sleep: { frames: [buildBlink(), shiftY(buildBlink(),1)].map(gridToImageData), fps: 2 },
    };

    // ─── AiruPet React component ─────────────────────────
    function AiruPet() {
      const canvasRef = useRef(null);
      const [pos, setPos] = useState({ x: 40, y: 40 });
      const [dragging, setDragging] = useState(false);
      const dragOffset = useRef({ x: 0, y: 0 });
      const stateRef = useRef('idle');
      const frameRef = useRef(0);
      const animRef = useRef(0);
      const lastTimeRef = useRef(0);
      const scale = 3;

      // Poll pet state from host
      useEffect(() => {
        let alive = true;
        async function poll() {
          while (alive) {
            try {
              const r = await fetch('/api/pet/state');
              const d = await r.json();
              stateRef.current = d.state || 'idle';
              if (d.x >= 0 && d.y >= 0 && !dragging) {
                setPos({ x: d.x, y: d.y });
              }
            } catch { /* ignore */ }
            await new Promise(r => setTimeout(r, 2000));
          }
        }
        poll();
        return () => { alive = false; };
      }, [dragging]);

      // Animation loop
      useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        function loop(time) {
          animRef.current = requestAnimationFrame(loop);
          const sprite = SPRITES[stateRef.current] || SPRITES.idle;
          const interval = 1000 / sprite.fps;
          if (time - lastTimeRef.current >= interval) {
            lastTimeRef.current = time;
            frameRef.current = (frameRef.current + 1) % sprite.frames.length;
            const frame = sprite.frames[frameRef.current];
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const tmp = new OffscreenCanvas(FW, FH);
            const tctx = tmp.getContext('2d');
            tctx.putImageData(frame, 0, 0);
            ctx.drawImage(tmp, 0, 0, canvas.width, canvas.height);
          }
        }
        animRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(animRef.current);
      }, []);

      // Drag handlers
      const onMouseDown = useCallback((e) => {
        setDragging(true);
        dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
      }, [pos]);

      useEffect(() => {
        if (!dragging) return;
        function onMove(e) {
          setPos({ x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y });
        }
        function onUp() {
          setDragging(false);
          // Persist position
          fetch('/api/pet/set-config', {
            method: 'POST',
            body: JSON.stringify(pos),
          }).catch(() => {});
        }
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        return () => {
          window.removeEventListener('mousemove', onMove);
          window.removeEventListener('mouseup', onUp);
        };
      }, [dragging, pos]);

      const petEl = h('div', {
        style: {
          position: 'fixed',
          left: pos.x + 'px',
          bottom: pos.y + 'px',
          zIndex: 99999,
          cursor: dragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          pointerEvents: 'auto',
        },
        onMouseDown,
      }, h('canvas', {
        ref: canvasRef,
        width: FW * scale,
        height: FH * scale,
        style: { imageRendering: 'pixelated' },
      }));

      return ReactDOM.createPortal(petEl, document.body);
    }

    // ─── Plugin entry ────────────────────────────────────
    return {
      inject: [],
      apply(ctx) {
        // Mount the pet component as a persistent portal
        const container = document.createElement('div');
        container.id = 'airu-pet-root';
        document.body.appendChild(container);

        const root = ReactDOM.createRoot
          ? ReactDOM.createRoot(container)
          : null;

        if (root) {
          root.render(h(AiruPet));
        } else {
          ReactDOM.render(h(AiruPet), container);
        }

        // Cleanup on unload
        ctx.effect(() => {
          return () => {
            if (root) root.unmount();
            else ReactDOM.unmountComponentAtNode(container);
            container.remove();
          };
        }, 'airu-pet: unmount');
      },
    };
  },
});
