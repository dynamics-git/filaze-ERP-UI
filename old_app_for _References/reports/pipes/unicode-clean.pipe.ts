import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  standalone: false,
  name: 'unicodeClean'
})
export class UnicodeCleanPipe implements PipeTransform {

  transform(value: any): any {
    if (typeof value !== 'string') {
      return value;
    }

    return value
      .replace(/_x0020_/g, ' ')
      .replace(/_x002F_/g, '/')
      .replace(/_x002D_/g, '-');
  }
}
