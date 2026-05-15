import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { DataSourceConfig } from '../models/data-source-config.model';
import { DataSourceService } from './data-source.service';

@Injectable({
  providedIn: 'root'
})
export class LinePersistenceService {
  constructor(private readonly dataSource: DataSourceService) {}

  saveLineField(
    dataSourceConfig: DataSourceConfig,
    row: Record<string, unknown>,
    changedField: string
  ): Observable<Record<string, unknown> | null> {
    const keyField = String(dataSourceConfig.keyField ?? '').trim();
    if (!keyField.length) {
      return of(null);
    }

    this.ensureClientLineKey(row);

    if (this.isBlockedField(changedField, dataSourceConfig.updateBlockedFields)) {
      return of(null);
    }

    const rowKey = row[keyField];
    if (!this.hasMeaningfulValue(rowKey)) {
      if (row['__creating'] === true) {
        return of(null);
      }

      const createPayload = this.pickAllowed(row, dataSourceConfig.createFields);
      if (!this.hasAllRequiredCreateFields(createPayload, dataSourceConfig.createFields)) {
        return of(null);
      }

      row['__creating'] = true;
      row['__state'] = 'creating';

      return this.dataSource.create(dataSourceConfig, createPayload).pipe(
        map((created) => {
          const createdRecord = this.toRecord(created);
          if (!createdRecord) {
            row['__creating'] = false;
            row['__state'] = 'error';
            return null;
          }

          Object.assign(row, createdRecord);
          row['__creating'] = false;
          row['__state'] = 'saved';
          return createdRecord;
        }),
        catchError(() => {
          row['__creating'] = false;
          row['__state'] = 'error';
          return of(null);
        })
      );
    }

    const updatePayload: Record<string, unknown> = {
      [changedField]: row[changedField]
    };

    return this.dataSource.update(dataSourceConfig, rowKey, updatePayload).pipe(
      map((updated) => {
        const updatedRecord = this.toRecord(updated);
        if (!updatedRecord) {
          row['__state'] = 'error';
          return null;
        }

        Object.assign(row, updatedRecord);
        row['__state'] = 'saved';
        return updatedRecord;
      }),
      catchError(() => {
        row['__state'] = 'error';
        return of(null);
      })
    );
  }

  private pickAllowed(row: Record<string, unknown>, fields?: string[]): Record<string, unknown> {
    if (!fields?.length) {
      return this.stripInternalFields(row);
    }

    return fields.reduce((acc, field) => {
      if (row[field] !== undefined) {
        acc[field] = row[field];
      }
      return acc;
    }, {} as Record<string, unknown>);
  }

  private stripInternalFields(row: Record<string, unknown>): Record<string, unknown> {
    const clone: Record<string, unknown> = { ...row };
    Object.keys(clone).forEach((key) => {
      if (key.startsWith('__')) {
        delete clone[key];
      }
    });

    return clone;
  }

  private isBlockedField(field: string, blocked: string[] = []): boolean {
    return field.startsWith('__') || blocked.includes(field);
  }

  private hasAllRequiredCreateFields(payload: Record<string, unknown>, requiredFields?: string[]): boolean {
    if (!requiredFields?.length) {
      return true;
    }

    return requiredFields.every((field) => this.hasMeaningfulValue(payload[field]));
  }

  private hasMeaningfulValue(value: unknown): boolean {
    if (value === null || value === undefined) {
      return false;
    }

    if (typeof value === 'string') {
      return value.trim().length > 0;
    }

    return true;
  }

  private ensureClientLineKey(row: Record<string, unknown>): void {
    if (this.hasMeaningfulValue(row['__clientLineKey'])) {
      return;
    }

    const randomUUID = globalThis.crypto?.randomUUID?.bind(globalThis.crypto);
    row['__clientLineKey'] = randomUUID ? randomUUID() : `line-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  private toRecord(value: unknown): Record<string, unknown> | null {
    return typeof value === 'object' && value !== null ? value as Record<string, unknown> : null;
  }
}
