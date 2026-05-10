export class UnicodeNormalizer {

  static normalize(value: any): any {
    if (value === null || value === undefined) {
      return value;
    }

    // String → decode BC unicode
    if (typeof value === 'string') {
      return value
        .replace(/_x0020_/g, ' ')
        .replace(/_x002F_/g, '/')
        .replace(/_x002D_/g, '-')
        .replace(/_x002E_/g, '.')
        .replace(/_x0028_/g, '(')
        .replace(/_x0029_/g, ')');
    }

    // Array → loop
    if (Array.isArray(value)) {
      return value.map(v => this.normalize(v));
    }

    // Object → recursive
    if (typeof value === 'object') {
      Object.keys(value).forEach(key => {
        value[key] = this.normalize(value[key]);
      });
      return value;
    }

    return value;
  }
}
