import { Injectable, inject } from '@angular/core';
import { EntryDialogConfig } from '../models/entry-dialog-config.model';
import { LineColumnConfig } from '../models/line-config.model';
import { LineMasterRegistry } from './line-master.service';
import { MasterDataService } from './master-data.service';
import { ErpRuntimeValueMapperService } from './erp-runtime-value-mapper.service';

@Injectable({
  providedIn: 'root',
})
export class RunModalOptionsResolverService {
  private readonly masterData = inject(MasterDataService);
  private readonly valueMapper = inject(ErpRuntimeValueMapperService);

  async runJobsInBatches(jobs: Array<() => Promise<void>>, batchSize: number): Promise<void> {
    if (!jobs.length) {
      return;
    }

    const size = Math.max(1, Math.floor(batchSize));
    for (let index = 0; index < jobs.length; index += size) {
      await Promise.all(jobs.slice(index, index + size).map((job) => job()));
    }
  }

  buildLineTypeMasterEndpointMap(
    entryDialogConfig: EntryDialogConfig,
  ): Record<string, string[]> {
    const typeColumn = this.resolveLineTypeColumn(entryDialogConfig);
    const endpointMap: Record<string, string[]> = {};

    for (const option of typeColumn?.options ?? []) {
      const type = this.toText(option.value).trim();
      const endpoints = this.resolveApiEndpoints(option.api);
      if (type.length && endpoints.length) {
        endpointMap[type] = endpoints;
      }
    }

    return endpointMap;
  }

  buildLineMasterRegistry(
    masters: Record<string, Record<string, unknown>[]>,
    entryDialogConfig?: EntryDialogConfig,
  ): LineMasterRegistry {
    const dynamicRegistry = this.buildDynamicLineMasterRegistry(
      masters,
      entryDialogConfig,
    );
    if (dynamicRegistry) {
      return dynamicRegistry;
    }

    return {
      defaultType: '',
      emptyType: ' ',
      byType: {},
    };
  }

  buildDynamicLineMasterRegistry(
    masters: Record<string, Record<string, unknown>[]>,
    entryDialogConfig: EntryDialogConfig | undefined,
  ): LineMasterRegistry | undefined {
    const typeColumn = entryDialogConfig ? this.resolveLineTypeColumn(entryDialogConfig) : undefined;
    const typeOptions = typeColumn?.options ?? [];
    const byType: LineMasterRegistry['byType'] = {};

    for (const option of typeOptions) {
      const type = this.toText(option.value);
      if (!type.length) {
        continue;
      }

      byType[type] = {
        options: this.buildConfiguredOptions(
          masters[type],
          entryDialogConfig ? this.resolveLineMasterValueColumn(entryDialogConfig) : undefined,
        ),
        records: masters[type] ?? [],
      };
    }

    if (!Object.keys(byType).length) {
      return undefined;
    }

    return {
      defaultType: this.toText(typeOptions[0]?.value) || ' ',
      emptyType: ' ',
      byType,
    };
  }

  buildLineOptionFieldMap(
    entryDialogConfig: EntryDialogConfig,
    masters: Record<string, Record<string, unknown>[]>,
  ): Record<string, Array<{ label: string; value: unknown }>> {
    const result: Record<string, Array<{ label: string; value: unknown }>> = {};

    for (const column of entryDialogConfig.lineColumns ?? []) {
      const field = this.toText(column.field ?? column.id).trim();
      const optionsKey = this.toText(
        column.optionsDataKey ?? (field ? `__options_${field}` : ''),
      ).trim();
      if (!optionsKey.length) {
        continue;
      }

      const endpoints = this.resolveApiEndpoints(column.api ?? column.optionsEndpoints);
      if (endpoints.length) {
        result[optionsKey] = this.buildConfiguredOptions(
          masters[optionsKey],
          column,
        );
      }
    }

    return result;
  }

  buildConfiguredOptions(
    records: unknown,
    column?: { valueField?: string | string[]; labelField?: string | string[] },
  ): Array<{ label: string; value: unknown }> {
    const valueFields = this.resolveConfiguredFields(column?.valueField);
    const labelFields = this.resolveConfiguredFields(column?.labelField);

    return this.masterData.toSelectOptions(records, valueFields, labelFields);
  }

  resolveLineNumberOptionFieldKey(entryDialogConfig: EntryDialogConfig): string {
    const numberColumn = this.resolveLineMasterValueColumn(entryDialogConfig);

    if (numberColumn) {
      const field = this.toText(numberColumn.field ?? numberColumn.id).trim();
      const optionsKey = this.toText(
        numberColumn.optionsDataKey ?? (field ? `__options_${field}` : ''),
      ).trim();
      if (optionsKey.length) {
        return optionsKey;
      }
    }
    return '';
  }

  resolveLineTypeColumn(entryDialogConfig: EntryDialogConfig): LineColumnConfig | undefined {
    return (entryDialogConfig.lineColumns ?? []).find((column) =>
      (column.options ?? []).some((option) => this.resolveApiEndpoints(option.api).length > 0),
    );
  }

  resolveLineTypeField(entryDialogConfig: EntryDialogConfig): string {
    const column = this.resolveLineTypeColumn(entryDialogConfig);
    return this.toText(column?.field ?? column?.id).trim();
  }

  resolveLineMasterValueColumn(entryDialogConfig: EntryDialogConfig): LineColumnConfig | undefined {
    return (entryDialogConfig.lineColumns ?? []).find((column) => Boolean(column.fill));
  }

  private resolveConfiguredFields(source: string | string[] | undefined): string[] {
    return this.valueMapper.resolveConfiguredFields(source);
  }

  private resolveApiEndpoints(source: unknown): string[] {
    return this.valueMapper.resolveApiEndpoints(source);
  }

  private toText(value: unknown): string {
    return this.valueMapper.toText(value);
  }
}
