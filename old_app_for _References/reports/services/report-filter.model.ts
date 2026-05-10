export interface ReportFilterField {
  key: string;
  type: 'date' | 'select' | 'text' | 'number';
  label?: string;
  apiField: string;
  operator?: 'eq' | 'ge' | 'le' | 'contains';
  placeholder?: string;
  options?: { label: string; value: any; type?: 'number' | 'string' }[];
  defaultValue?: any;
}

