import { Injectable } from '@angular/core';
import { DataSourceConfig } from '../models/data-source-config.model';

@Injectable({
  providedIn: 'root',
})
export class DataSourceFieldResolverService {
  resolveParentKeyField(dataSource?: DataSourceConfig): string {
    return this.toText(dataSource?.parentKeyField ?? dataSource?.lineFKProp).trim();
  }

  resolveHeaderDocumentNoField(dataSource?: DataSourceConfig): string {
    return this.toText(
      dataSource?.documentNoField
      ?? dataSource?.headerPKProp
      ?? dataSource?.contextDocumentNoField,
    ).trim();
  }

  private toText(value: unknown): string {
    return value === null || value === undefined ? '' : String(value);
  }
}