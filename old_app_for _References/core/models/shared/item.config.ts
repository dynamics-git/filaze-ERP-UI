import { Type } from "@angular/core";

import { CalculationSectionConfig } from "./calculation-section.config";
import { HeaderDataConfig } from "./header-data.config";
import { InformationSectionConfig } from "./information-section.config";
import { LineDataConfig } from "./line-data.config";

export interface SubLineSectionConfig {
    key: string;
    title?: string;
    component?: Type<any>;
    config?: LineDataConfig;
    position?: 'beforeMainLines' | 'afterMainLines';
    disabled?: boolean;
    inputs?: Record<string, any>;
}

export interface ItemConfig {
    title?: string;
    description?: string;   // optional one-line context shown right-aligned in the topbar
    recordId?: string;
    recordTitle?: string;
    headerConfig?: HeaderDataConfig;
    lineConfig?: LineDataConfig;
    subLineSections?: SubLineSectionConfig[];
    calculationSectionConfig?: CalculationSectionConfig;
    informationSectionConfig?: InformationSectionConfig;
    autoSave?: boolean;
    returnUrl?: string;
    subPopupHeaderConfig?: HeaderDataConfig;
    subPopupLineConfig?: LineDataConfig;
    hideSubPopupHeader?: boolean;
    hideSubPopupCalculation?: boolean;
    hasNoHeaderApi?:boolean;
    isDirectApi?:boolean;
    getPopupCloseResponse?:boolean;
    validateOnLineDelete?: (lines: any[]) => Promise<{ allowed: boolean; message?: string }>;
}
