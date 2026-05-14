import { FactboxSectionConfig } from './factbox-config.model';

export interface ListFactPanelBindingConfig {
  labelField?: string;
  labelFallbackFields?: string[];
  titleField?: string;
  titleFallbackFields?: string[];
  subtitleField?: string;
  subtitleFallbackFields?: string[];
  summaryField?: string;
  summaryFallbackFields?: string[];
  summaryType?: 'text' | 'number' | 'date' | 'currency';
}

export interface ListFactPanelConfig {
  id?: string;
  label?: string;
  title?: string;
  subtitle?: string;
  enabled?: boolean;
  width?: string;
  defaultSectionId?: string;
  binding?: ListFactPanelBindingConfig;
  sections?: FactboxSectionConfig[];
}

export type ListPageFactboxBindingConfig = ListFactPanelBindingConfig;
export type ListPageFactboxConfig = ListFactPanelConfig;
