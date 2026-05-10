import { CustomButton, PopupCommandBarConfig } from "./customButton";
import { FormField } from "./formField";

export interface HeaderDataConfig {
    id?: string;
    idProp?: string;
    api?: string;
    title?: string;
    buttons?: CustomButton[];
    controls?: FormField[][];
    sections?: {
        title: string;
        controls: FormField[][];
        autoPack?: boolean;
    }[];
    autoGenerateField?: string;
    includeUserId?: boolean;
    showComments?: boolean;
    commentDocumentType?: string;
    removeUnicodeCharFields?: string[];
    activityLogsTableCaption?: string;
    patchUserId?: boolean;
    textEditor?: boolean;
    showDimensionButton?: boolean;
    showDimensionInPopup?: boolean;
    commandBar?: PopupCommandBarConfig;
}
