import { Injectable, signal } from '@angular/core';

const THEME_KEY = 'alices-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly darkMode = signal(this.initialValue());

  readonly isDark = this.darkMode.asReadonly();

  constructor() {
    this.apply(this.darkMode());
  }

  toggle(): void {
    this.darkMode.update((dark) => {
      const next = !dark;
      this.apply(next);
      return next;
    });
  }

  private initialValue(): boolean {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light') {
      return saved === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  private apply(dark: boolean): void {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light');
  }
}
