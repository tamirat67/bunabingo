// Telegram WebApp helpers
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string;
        initDataUnsafe: { user?: { id: number; first_name: string; username?: string; last_name?: string } };
        ready: () => void;
        expand: () => void;
        close: () => void;
        showAlert: (msg: string, cb?: () => void) => void;
        showConfirm: (msg: string, cb: (ok: boolean) => void) => void;
        MainButton: { setText(t: string): void; show(): void; hide(): void; onClick(fn: () => void): void; };
        HapticFeedback: { notificationOccurred(type: 'error'|'success'|'warning'): void; impactOccurred(style: 'light'|'medium'|'heavy'): void };
        colorScheme: 'light' | 'dark';
        themeParams: Record<string, string>;
        isExpanded: boolean;
      };
    };
  }
}

export const tg = () => (typeof window !== 'undefined' ? window.Telegram?.WebApp : null);

export const getTgInitData = (): string => tg()?.initData ?? '';

export const getTgUser = () => tg()?.initDataUnsafe?.user ?? null;

export function initTelegram() {
  const app = tg();
  if (!app) return;
  app.ready();
  app.expand();
}

export function haptic(type: 'success' | 'error' | 'warning' | 'click') {
  const app = tg();
  if (!app) return;
  if (type === 'click') app.HapticFeedback.impactOccurred('light');
  else app.HapticFeedback.notificationOccurred(type);
}
