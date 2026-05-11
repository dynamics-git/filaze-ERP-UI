export class UnicodeNormalizer {
  static normalize<T>(value: T): T {
    if (value === null || value === undefined) {
      return value;
    }

    if (typeof value === 'string') {
      return value.replace(/_x([0-9a-fA-F]{4})_/g, (_match, code: string) =>
        String.fromCharCode(Number.parseInt(code, 16))
      ) as T;
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.normalize(item)) as T;
    }

    if (typeof value === 'object') {
      return Object.entries(value).reduce<Record<string, unknown>>((result, [key, item]) => {
        result[key] = this.normalize(item);
        return result;
      }, {}) as T;
    }

    return value;
  }
}
