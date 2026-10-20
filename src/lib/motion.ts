import { INTRO_COOLDOWN_MS, INTRO_KEY } from '../config';

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function shouldPlayIntro(): boolean {
  if (prefersReducedMotion()) return false;
  try {
    const last = Number(localStorage.getItem(INTRO_KEY) ?? 0);
    return !last || Date.now() - last > INTRO_COOLDOWN_MS;
  } catch {
    return true;
  }
}

export function markIntroSeen() {
  try {
    localStorage.setItem(INTRO_KEY, String(Date.now()));
  } catch {
    /* storage unavailable */
  }
}

export function resetIntro() {
  try {
    localStorage.removeItem(INTRO_KEY);
  } catch {
    /* storage unavailable */
  }
}
