import { CustomButton, CustomMenuButton } from "./customButton";
import { FormField } from "./formField";

export interface LineDataConfig {
    title?: string;
    idProp?: string;
    headerPKProp?: string;
    lineFKProp?: string;
    api?: string;
    includeHeaderId?: boolean;
    disableLine?: boolean;
    buttons?: CustomButton[];
    controls?: FormField[];
    calculationControls?: FormField[][];
    showCreate?: boolean;
    showDelete?: boolean;
    defaultLines?: number;
    apiPatchProperties?: string[];
    showExcelExport?: boolean;
    filterByVersionNo?: boolean;
    removeUnicodeCharFields?: string[];
    pageName?: string;
    activityLogsTableCaption?: string;
    showStatusColumn?: boolean;
    statusField?: string;
    statusReasonField?: string;
    showLinePopup?: boolean;
    showLineRegisterEntry?: boolean;
    subPopupFKProp?: string;
    showButtonInfoButton?: boolean;
    showCompareTab?: boolean,
    attachmentDocumentTypeForLines?: string;
    isShowUploaderFile?: boolean;
    menuButton?: CustomMenuButton[];
    isDirectApi?: boolean;
    showLineAttachments?: boolean;          // true = show Entries Documents block in factbox when a line is selected
    lineAttachmentDeletePermission?: boolean; // false = hide Delete button for normal users on line attachments

    /**
     * CROSS-DOCUMENT ATTACHMENT PATTERN
     * -----------------------------------
     * Use when the line's attachments live under a DIFFERENT document No and/or DocumentType
     * than the header. Both fields must be set together.
     *
     * relatedDocumentNoProp → field name on the LINE record whose value is the target document No
     * relatedDocumentType   → BC DocumentType string for that target document
     *
     * Example — Claim Payment line has sourceClaimNo='EMPCL10731',
     *   attachments are under DocumentType='Employee Claim', No='EMPCL10731':
     *     relatedDocumentNoProp: 'sourceClaimNo',
     *     relatedDocumentType: 'Employee Claim',
     *
     * If NOT set → factbox uses lineFKProp + header documentType (normal pattern,
     *   e.g. Posted Purchase Invoice where line attachments are on the same document).
     */
    relatedDocumentNoProp?: string;
    relatedDocumentType?: string;
    /**
     * Field name on the LINE record whose value is the recordLineNo of the related document.
     * Used together with relatedDocumentNoProp for Pattern B (cross-document line attachments).
     * Example — Claim Payment line has sourceLineNo=10000 which is the line number in Employee Claim:
     *     relatedLineNoProp: 'sourceLineNo'
     * If NOT set → recordLineNo defaults to 0 (shows header-level attachments of related document).
     */
    relatedLineNoProp?: string;
    viewLinePopup?: boolean;
}