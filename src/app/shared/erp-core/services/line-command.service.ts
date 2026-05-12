import { Injectable } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ErpLineDeletePlan {
  targetRows: Record<string, unknown>[];
  remainingRows: Record<string, unknown>[];
  persistedIds: unknown[];
  selectedIndexes: number[];
}

@Injectable({
  providedIn: 'root'
})
export class LineCommandService {
  planDeleteRequest(options: {
    lineRows: Record<string, unknown>[];
    payload: unknown;
    activeRow?: Record<string, unknown>;
    selectedIndexes?: number[];
    idFields?: string[];
  }): ErpLineDeletePlan {
    const lineRows = options.lineRows ?? [];
    const payloadSelectedIndexes = this.resolvePayloadSelectedIndexes(options.payload);
    const selectedIndexes = payloadSelectedIndexes.length ? payloadSelectedIndexes : (options.selectedIndexes ?? []);

    let targetRows: Record<string, unknown>[] = [];
    if (selectedIndexes.length) {
      const indexSet = new Set(selectedIndexes.filter((index) => index >= 0 && index < lineRows.length));
      targetRows = lineRows.filter((_row, index) => indexSet.has(index));
    } else {
      const payloadRow = this.resolvePayloadRow(options.payload);
      const targetRow = payloadRow ?? options.activeRow ?? lineRows[lineRows.length - 1];
      if (targetRow) {
        targetRows = [targetRow];
      }
    }

    const remainingRows = lineRows.filter((row) => !targetRows.includes(row));
    const persistedIds = this.resolvePersistedIds(targetRows, options.idFields ?? ['Id', 'id']);

    return {
      targetRows,
      remainingRows,
      persistedIds,
      selectedIndexes: [...new Set(selectedIndexes)].sort((a, b) => a - b)
    };
  }

  executePersistedDeletes(
    persistedIds: unknown[],
    deleteById: (id: unknown) => Observable<unknown>
  ): Observable<void> {
    if (!persistedIds.length) {
      return of(void 0);
    }

    return forkJoin(persistedIds.map((id) => deleteById(id))).pipe(map(() => void 0));
  }

  private resolvePayloadSelectedIndexes(payload: unknown): number[] {
    if (!this.isRecord(payload)) {
      return [];
    }

    const selectedIndexes = payload['selectedIndexes'];
    if (!Array.isArray(selectedIndexes)) {
      return [];
    }

    const normalized = selectedIndexes
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value >= 0);

    return [...new Set(normalized)].sort((a, b) => a - b);
  }

  private resolvePayloadRow(payload: unknown): Record<string, unknown> | undefined {
    if (!this.isRecord(payload)) {
      return undefined;
    }

    const row = payload['row'];
    return this.isRecord(row) ? row : undefined;
  }

  private resolvePersistedIds(rows: Record<string, unknown>[], idFields: string[]): unknown[] {
    const ids = rows
      .map((row) => {
        for (const field of idFields) {
          const value = row[field];
          if (value !== undefined && value !== null && String(value).trim().length > 0) {
            return value;
          }
        }

        return undefined;
      })
      .filter((value) => value !== undefined && value !== null && String(value).trim().length > 0) as unknown[];

    const seen = new Set<string>();
    const unique: unknown[] = [];

    for (const id of ids) {
      const key = String(id).trim();
      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      unique.push(id);
    }

    return unique;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }
}
