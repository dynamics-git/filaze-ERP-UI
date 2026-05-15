import { Injectable } from '@angular/core';
import { DataSourceConfig } from '../models/data-source-config.model';
import { EntityContractService } from './entity-contract.service';

@Injectable({
  providedIn: 'root'
})
export class EntryRecordService {
  constructor(private readonly contractService: EntityContractService) {}

  resolveRecordId(record: Record<string, unknown>, config?: DataSourceConfig): unknown {
    const keyCandidates: string[] = [];

    keyCandidates.push(...this.contractService.getDeleteKeyCandidates(config));
 
    if (config?.keyField) {
      keyCandidates.push(config.keyField);
    }

    keyCandidates.push('SystemId', 'systemId', 'Id', 'id');

    if (config?.documentNoField) {
      keyCandidates.push(config.documentNoField);
    }

    keyCandidates.push('Number', 'No');

    for (const key of keyCandidates) {
      if (!(key in record)) {
        continue;
      }

      const value = record[key];
      if (value !== null && value !== undefined && value !== '') {
        return value;
      }
    }

    return null;
  }
}
