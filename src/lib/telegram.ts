interface TgWebApp {
  ready: () => void;
  expand: () => void;
  setHeaderColor?: (c: string) => void;
  setBackgroundColor?: (c: string) => void;
}
declare global {
  interface Window {
    Telegram?: { WebApp?: TgWebApp };
  }
}

/** Loads the Telegram Mini App SDK only when running inside Telegram. */
export function initTelegram() {
  const inTelegram = /Telegram/i.test(navigator.userAgent) || window.location.hash.includes('tgWebAppData');
  if (!inTelegram) return;
  const s = document.createElement('script');
  s.src = 'https://telegram.org/js/telegram-web-app.js';
  s.async = true;
  s.onload = () => {
    const wa = window.Telegram?.WebApp;
    if (!wa) return;
    wa.ready();
    wa.expand();
    try {
      wa.setHeaderColor?.('#09040f');
      wa.setBackgroundColor?.('#09040f');
    } catch {
      /* older clients */
    }
    document.documentElement.classList.add('is-telegram');
  };
  document.head.appendChild(s);
}
