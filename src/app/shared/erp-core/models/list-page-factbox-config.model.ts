import { FactboxSectionConfig } from './factbox-config.model';

export interface ListPageFactboxBindingConfig {
  titleField?: string;
  titleFallbackFields?: string[];
  summaryField?: string;
  summaryFallbackFields?: string[];
  summaryType?: 'text' | 'number' | 'date' | 'currency';
}

export interface ListPageFactboxConfig {
  id?: string;
  label?: string;
  title?: string;
  subtitle?: string;
  enabled?: boolean;
  width?: string;
  defaultSectionId?: string;
  binding?: ListPageFactboxBindingConfig;
  sections?: FactboxSectionConfig[];
}
