import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from '../lib/motion';

interface Props {
  count?: number;
  /** 0–1, overall brightness */
  intensity?: number;
  paused?: boolean;
  className?: string;
}

interface P {
  x: number;
  y: number;
  r: number;
  vy: number;
  vx: number;
  phase: number;
  warm: boolean;
}

function makeSprite(color: string): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = c.height = 48;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(24, 24, 0, 24, 24, 24);
  grad.addColorStop(0, color);
  grad.addColorStop(0.25, color.replace(/[\d.]+\)$/, '0.55)'));
  grad.addColorStop(1, color.replace(/[\d.]+\)$/, '0)'));
  g.fillStyle = grad;
  g.fillRect(0, 0, 48, 48);
  return c;
}

/** Drifting ember particles on a single canvas. Cheap: sprites, no blur filters, DPR capped. */
export default function Embers({ count, intensity = 1, paused = false, className }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || prefersReducedMotion()) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const warm = makeSprite('rgba(255,120,60,1)');
    const gold = makeSprite('rgba(244,207,134,1)');
    let w = 0;
    let h = 0;
    let raf = 0;
    let last = performance.now();
    const n = count ?? (window.innerWidth < 640 ? 34 : 64);
    const ps: P[] = [];

    const spawn = (initial: boolean): P => ({
      x: Math.random() * w,
      y: initial ? Math.random() * h : h + 10,
      r: 3 + Math.random() * 7,
      vy: 10 + Math.random() * 28,
      vx: (Math.random() - 0.5) * 10,
      phase: Math.random() * Math.PI * 2,
      warm: Math.random() > 0.35,
    });

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (ps.length === 0) for (let i = 0; i < n; i++) ps.push(spawn(true));
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (pausedRef.current || document.hidden) return;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < ps.length; i++) {
        const p = ps[i];
        p.y -= p.vy * dt;
        p.x += (p.vx + Math.sin(now / 1600 + p.phase) * 8) * dt;
        if (p.y < -20) ps[i] = spawn(false);
        const life = Math.max(0, Math.min(1, p.y / h));
        ctx.globalAlpha = (0.15 + 0.55 * life) * (0.6 + 0.4 * Math.sin(now / 700 + p.phase)) * intensity;
        const s = p.r * 2;
        ctx.drawImage(p.warm ? warm : gold, p.x - p.r, p.y - p.r, s, s);
      }
      ctx.globalAlpha = 1;
    };

    resize();
    window.addEventListener('resize', resize);
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [count, intensity]);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
