import { Injectable } from '@angular/core';
import { DataSourceConfig } from '../models/data-source-config.model';
import { EntityContractService } from './entity-contract.service';

@Injectable({
  providedIn: 'root'
})
export class EntryRecordService {
  constructor(private readonly contractService: EntityContractService) {}

  resolveRecordId(record: Record<string, unknown>, config?: DataSourceConfig): unknown {
    const contractCandidates = this.contractService.getDeleteKeyCandidates(config);
    const keyCandidates: string[] = [];

    keyCandidates.push(...contractCandidates);
 
    if (config?.keyField) {
      keyCandidates.push(config.keyField);
    }

    keyCandidates.push('Id', 'id', 'SystemId', 'systemId');

    if (!contractCandidates.length) {
      if (config?.documentNoField) {
        keyCandidates.push(config.documentNoField);
      }

      keyCandidates.push('Number', 'No');
    }

    for (const key of keyCandidates) {
      const value = this.readFieldValue(record, key);
      if (value !== null && value !== undefined && value !== '') {
        return value;
      }
    }

    return null;
  }

  private readFieldValue(record: Record<string, unknown>, field: string): unknown {
    if (field in record) {
      return record[field];
    }

    const lower = field.toLowerCase();
    const matched = Object.keys(record).find((key) => key.toLowerCase() === lower);
    return matched ? record[matched] : undefined;
  }
}
