import { FormField } from "./formField";
import { TableHeader } from "./tableHeader";

export interface ListTableConfig {
    title: string;
    description?: string;
    pageName: string;
    headers: TableHeader[];
    controls: FormField[];
    api?: string;
    idProp?: string;
    pagination?: {
        pageSize: number;
        pageSizeOptions?: number[];
    };
    sortable?: boolean;
    filterable?: boolean;
    showActions?: boolean;
    enableCache?: boolean;
    selctionType?: string; // 'single', 'multiple'
    headerApiFilterField?: string;
    headerApiOrderByField?: string;
    filterByUserCompanyResCenter?: boolean;
    removeUnicodeCharFields?: string[];
    showCreate?: boolean;
    showEdit?: boolean;
    showDelete?: boolean;
    showSearch?: boolean;
    showSaveButton?: boolean;
    showCancelButton?: boolean;
    filters?: CustomDataFilter[];
    filterFields?: TableField[];
}

export interface CustomDataFilter {
    field?: string;
    operator?: string;
    value?: string;
}

export interface TableField {
    field: string;
    label: string;
    type: "text" | "date" | "number" | "select" | "dropdown";
    options?: { value: any; label: string }[];
    apiUrl?: string;
    valueField?: string;
    labelField?: string;
}