import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UtilityService {
  generateUUID(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }

    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (value) => {
      const random = Math.floor(Math.random() * 16);
      const variant = value === 'x' ? random : (random & 0x3) | 0x8;
      return variant.toString(16);
    });
  }

  copyObj<T>(value: T): T {
    return JSON.parse(JSON.stringify(value)) as T;
  }

  convertDateTimeToString(value?: Date | string | null): string {
    if (!value) {
      return '';
    }

    const date = value instanceof Date ? value : new Date(value);
    return `${date.getFullYear()}-${this.pad(date.getMonth() + 1)}-${this.pad(date.getDate())} ${this.pad(date.getHours())}:${this.pad(date.getMinutes())}:${this.pad(date.getSeconds())}`;
  }

  convertDateObjToString(value?: Date | string | null): string {
    if (!value) {
      return '';
    }

    const date = value instanceof Date ? value : new Date(value);
    return `${date.getFullYear()}-${this.pad(date.getMonth() + 1)}-${this.pad(date.getDate())}`;
  }

  convertStringToDateObj(value?: string | null): Date | undefined {
    if (!value) {
      return undefined;
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }

  updateObject<T extends Record<string, unknown>>(source: T, changes: Partial<T>): T {
    return {
      ...source,
      ...changes
    };
  }

  patchObject<T extends Record<string, unknown>>(source: T, changes: Partial<T>): T {
    Object.entries(changes).forEach(([key, value]) => {
      source[key as keyof T] = value as T[keyof T];
    });

    return source;
  }

  compareObjects(first: unknown, second: unknown): boolean {
    return JSON.stringify(first) === JSON.stringify(second);
  }

  removeLineUnicodeChars(value: string): string {
    return value.replace(/[\u2028\u2029]/g, '');
  }

  search<T extends Record<string, unknown>>(items: T[], searchText: string, fields: string[]): T[] {
    const term = searchText.trim().toLowerCase();

    if (!term) {
      return items;
    }

    return items.filter((item) => fields.some((field) => this.matches(item[field], term)));
  }

  private matches(value: unknown, term: string): boolean {
    return String(value ?? '').toLowerCase().includes(term);
  }

  private pad(value: number): string {
    return String(value).padStart(2, '0');
  }
}
