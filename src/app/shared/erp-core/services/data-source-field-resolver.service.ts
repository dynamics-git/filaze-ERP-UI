import { Injectable } from '@angular/core';
import { DataSourceConfig } from '../models/data-source-config.model';

@Injectable({
  providedIn: 'root',
})
export class DataSourceFieldResolverService {
  resolveParentKeyField(dataSource?: DataSourceConfig): string {
    return this.toText(dataSource?.parentKeyField).trim();
  }

  resolveHeaderDocumentNoField(dataSource?: DataSourceConfig): string {
    return this.toText(
      dataSource?.documentNoField
      ?? dataSource?.contextDocumentNoField,
    ).trim();
  }

  private toText(value: unknown): string {
    return value === null || value === undefined ? '' : String(value);
  }
}