export interface SortEvent {
    column: string;
    direction: SortDirection;
}

export type SortDirection = 'asc' | 'desc' | '';