import { Injectable } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { v4 as uuidv4 } from 'uuid';
import { EncryptDecryptService } from './shared/encrypt-decrypt.service';
import { FormField } from '../models/shared/formField';
import { FormFieldType } from '../models/shared/formField.enum';

@Injectable({
  providedIn: 'root'
})
export class Utility {
  constructor(private encryptService: EncryptDecryptService,
    private datepipe: DatePipe) { }
  public GenerateUUID(): string {
    return uuidv4();
  }
  public getFromGroupData(formGroup: FormGroup, fieldColumns: FormField[][]) {
    let data: any = {};
    fieldColumns.forEach((column: FormField[]) => {
      column.forEach((field: FormField) => {
        const control = formGroup.controls[field.label!] as FormControl;
        data[field.label!] = control.value;
      });
    });
    return data;
  }
  public copyObj(data: any) {
    return JSON.parse(JSON.stringify(data));
  }
  public convertDateTimeToString(data: Date, onlyDate: boolean = false) {
    if (onlyDate) {
      return data ? data.getFullYear() + '-' + this.pad(data.getMonth() + 1) + '-' + this.pad(data.getDate()) : '';
    } else {
      return data ? data.getFullYear() + '-' + this.pad(data.getMonth() + 1) + '-' + this.pad(data.getDate()) + 'T00:00:00.000Z' : '';
    }
  }
  public convertDateObjToString(data: any, onlyDate: boolean = false) {
    if (data) {
      if (data.year && data.year <= 1) {
        return '';
      }
      if (data.year && data.month && data.day) {
        if (onlyDate) {
          return data.year + '-' + this.pad(data.month) + '-' + this.pad(data.day);
        } else {
          return data.year + '-' + this.pad(data.month) + '-' + this.pad(data.day) + 'T00:00:00.000Z';
        }
      }
      return data;
    }
    return '';
  }


  public convertStringToDateObj(data: string) {
    if (!data) return null;
    // 🔒 BC minimum date — ALL known forms
    if (
      data === '0001-01-01' ||
      data === '01-01-01' ||
      data.startsWith('0001-01-01')
    ) {
      return null;
    }
    const date = new Date(data);
    // 🔒 JS safety
    if (isNaN(date.getTime()) || date.getFullYear() <= 1) {
      return null;
    }
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate()
    };
  }


  public sleep(sec: number) {
    const now = new Date().getTime();
    while (new Date().getTime() < now + sec) { /* do nothing */ }
  }
  public search(records: any[], headers: string[], key: string) {
    return records.filter(x => this.matches(x, headers, key));
  }
  public searchLineControlData(searchText: string, lines: any[], controls: FormField[], dropdownControlItems: any): any[] {
    const headers = controls.map(x => x.label);
    let records: any[] = [];
    lines.forEach((setup: any) => {
      let record: any = this.copyObj(setup);
      controls.forEach((control: FormField) => {
        if (control.type === FormFieldType.DropDown) {
          if (control.apiUrl) {
            if (dropdownControlItems[control.label!] && dropdownControlItems[control.label!].length > 0) {
              const item = (dropdownControlItems[control.label!] as any[]).filter((x: any) => x[control.bindValue!] === setup[control.label!])[0];
              if (item) {
                if (control.displayFormat) {
                  record[control.label!] = item['displayValue'];
                } else {
                  record[control.label!] = item[control.bindLabel!];
                }
              }
            }
          } else {
            if (control.items && control.items.length > 0) {
              const item: any = control.items.filter((x: any) => x[control.bindValue!] === setup[control.label!])[0];
              if (item) {
                if (control.displayFormat) {
                  record[control.label!] = item['displayValue'];
                } else {
                  record[control.label!] = item[control.bindLabel!];
                }
              }
            }
          }
        }
      });
      records.push(record);
    });
    records = this.search(records, headers as string[], searchText);
    const indexes: number[] = records.map(x => x.index);
    return lines.filter(x => indexes.includes(x.index));
  }
  public updateObject(source: any, target: any): any {
    const keys = Object.keys(target);
    keys.forEach(key => {
      source[key] = target[key];
    });
    return source;
  }
  public getHeaderControlsData(data: any, controls: FormField[][]) {
    controls.forEach((column: FormField[]) => {
      data = this.getLineControlsData(data, column);
    });
    return data;
  }
  public getLineControlsData(data: any, controls: FormField[]) {
    controls.forEach((control: FormField) => {
      if (data[control.label!] !== undefined && data[control.label!] !== null) {
        if (control.type === FormFieldType.DateTime && data[control.label!]) {
          data[control.label!] = this.convertDateObjToString(data[control.label!], control.dateOnly);
        } else if (control.type === FormFieldType.Number) {
          data[control.label!] = +data[control.label!];
        } else if (control.type === FormFieldType.Checkbox) {
          data[control.label!] = +data[control.label!] ? true : false;
        } else if (control.type === FormFieldType.DropDown && control.mutiple) {
          data[control.label!] = data[control.label!] ? data[control.label!].join(',') : null;
        } else if (control.type === FormFieldType.Password && control.encryptPassword) {
          data[control.label!] = this.encryptService.encrypt(data[control.label!]);
        }
      } else {
        delete data[control.label!];
      }
    });
    return data;
  }
  public setHeaderControlsData(data: any, controls: FormField[][]) {
    controls.forEach((column: FormField[]) => {
      data = this.setLineControlsData(data, column);
    });
    return data;
  }
  public setLineControlsData(data: any, controls: FormField[]) {
    controls.forEach((control: FormField) => {
      if (data[control.label!]) {
        if (control.type === FormFieldType.DateTime
          && data[control.label!] === '0001-01-01') {
          data[control.label!] = null;
        } else if (
          data[control.label!] === '0001-01-01'
          && control.defaultSystemDate
        ) {
          data[control.label!] =
            this.convertStringToDateObj(
              this.datepipe.transform(new Date(), 'yyyy-MM-dd')!
            );
        } else if (control.type === FormFieldType.DateTime
          && data[control.label!]) {
          data[control.label!] =
            this.convertStringToDateObj(data[control.label!]);
        }
      }
      else {
        delete data[control.label!];
      }
    });
    return data;
  }
  public patchObject(source: any, patch: any) {
    Object.keys(patch).forEach(key => {
      source[key] = patch[key];
    });
  }
  public compareObjects(source: any, patch: any) {
    const keys = Object.keys(patch);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (source[key] !== patch[key]) {
        return false;
      }
    }
    return true;
  }
  // public removeLineUnicodeChars(value: string | any) {
  //   value = value.replace('_x002F_', '/');
  //   value = value.replace('_x0020_', ' ');
  //   return value;
  // }
  public removeLineUnicodeChars(value: string | any) {
    if (!value) return value;
    value = value.replace(/_x002F_/g, '/');
    value = value.replace(/_x0020_/g, ' ');
    return value;
  }

  private pad(n: number): string {
    return (n < 10) ? '0' + n : '' + n;
  }
  private matches(data: any, headers: string[], term: string) {
    let result: boolean = false;
    if (term && term !== '') {
      for (let i = 0; i < headers.length; i++) {
        const headerprop: any = headers[i];
        if (typeof data[headerprop] === 'string') {
          result = data[headerprop].toLowerCase().includes(term.toLowerCase());
        } else if (typeof data[headerprop] === 'number') {
          result = (data[headerprop] + '').toLowerCase().includes(term.toLowerCase());
        }
        if (result) break;
      }
    } else {
      result = true;
    }
    return result;
  }
}