// Telegram WebApp SDK helpers
export const tg = () => (typeof window !== 'undefined' ? (window as any).Telegram?.WebApp : null);

export const initTelegram = () => {
  const app = tg();
  if (app) {
    app.ready();
    app.expand();
  }
};

export const getTgInitData = () => tg()?.initData || '';
export const getTgUser = () => tg()?.initDataUnsafe?.user || null;
