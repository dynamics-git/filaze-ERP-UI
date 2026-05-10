// export interface FilterField {
//     field: string;
//     label?: string;
//     type: 'date' | 'dropdown' | 'text' | 'number';
//     operator?: 'eq' | 'ge' | 'le' | 'contains';
//     placeholder?: string;
//     options?: { label: string; value: any; type?: 'number' | 'string' }[];
//     defaultValue?: any;
// }


export interface FilterField {
  field: string;
  label: string;
  type: 'text' | 'date' | 'number' | 'select' | 'dropdown';
  operator?: 'eq' | 'ge' | 'le' | 'contains';
  placeholder?: string;
  options?: { value: any; label: string }[];
  defaultValue?: any;
  apiUrl?: string;
  valueField?: string;
  labelField?: string;
}