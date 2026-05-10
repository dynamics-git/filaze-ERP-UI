import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy, ViewChild, TemplateRef, NgModuleRef, HostListener, ElementRef, Type } from '@angular/core';
import { FormGroup, FormBuilder, FormControl, Validators, FormArray } from '@angular/forms';
import { forkJoin, Observable, of, Subscription } from 'rxjs';
import { Subject, debounceTime } from 'rxjs';
import { DatePipe } from '@angular/common';
import { catchError, take } from 'rxjs/operators';

import { ToastrService } from 'ngx-toastr';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { InformationDetailSecctionType } from '../../../core/models/shared/information-section.enum';
import { ItemConfig, SubLineSectionConfig } from '../../../core/models/shared/item.config';
import { EventDataModel, SectionType } from '../../../core/models/shared/eventDataModel';
import { FormDataModel } from '../../../core/models/shared/formDataModel';
import { CustomButtonEvent } from '../../../core/models/shared/customButtonEvent';
import { AddLineEvent } from '../../../core/models/shared/add-line-event';
import { RestService } from '../../../core/services/rest.service';
import { Utility } from '../../../core/services/utility.service';
import { EncryptDecryptService } from '../../../core/services/shared/encrypt-decrypt.service';
import { SessionService } from '../../../core/services/session.service';
import { AddItemService } from '../../../core/services/shared/add-item.service';
import { ExcelExportService } from '../../../core/services/shared/excel-export.service';
import { FormField } from '../../../core/models/shared/formField';
import { FormFieldType } from '../../../core/models/shared/formField.enum';
import { ControlDataModel } from '../../../core/models/shared/controlDataModel';
import { CustomButton, PopupBuiltInActionKey, PopupCommandBarConfig, PopupCommandGroup } from '../../../core/models/shared/customButton';
import { DocumentCommentsPopupComponent } from '../document-comments-popup/document-comments-popup.component';
import { DataTableService } from '../../../core/services/shared/data-table.service'
import { AddItemSubPopupComponent } from '../add-item-sub-popup/add-item-sub-popup.component';
import { SelectedItemService } from '../../../core/services/shared/selected-item.service';
import { FormDataService } from '../../../core/services/shared/form-data.service';
import { ApprovalSetupAddItemSubPopupComponent } from '../../../features/ApprovalSetup/shared/components/approval-setup-add-item-sub-popup/approval-setup-add-item-sub-popup.component';
import { DataTableConfig } from '../../../core/models/shared/dataTableConfig';
import { ArchivedPurchaseQuoteHeader, ArchivedPurchaseQuoteLine } from '../../../features/Purchase/archived-purchase-quote/archived-purchase-quote.config';
import { PurchaseOrderHeader, PurchaseOrderLine, PurchaseOrderCalculation } from '../../../features/Purchase/purchase-order/purchase-order.config';
import { PurchaseRequisitionHeader, PurchaseRequisitionLine, PurchaseRequisitionCalculation } from '../../../features/Purchase/purchase-requisition/purchase-requisition.config';
import { CustomSharedService } from '../../../core/services/shared/custom-shared.service';
import { AttachmentsComponent } from '../attachments/attachments.component';
import { SummaryFieldConfig } from '../summary/summary.config';
import { ButtonPermission } from '../../../core/models/shared/buttonPermission.model';
import { MenuItems } from '../../../layout/shell/navigation/menu-items';
import { SelectedRowIndexService } from '../../../core/services/shared/selected-row-index.service';
import { UnifiedDialogService } from '../../../core/services/shared/unified-dialog.service';


const PrimaryWhite = '#ffffff';
const SecondaryGrey = '#ccc';

type PopupCommandMenuKey = 'Process' | 'Approval' | 'Review' | 'More';

interface PopupCommandAction {
  key: string;
  label: string;
  icon?: string;
  disabled?: boolean;
  source: 'builtin' | 'custom';
  group?: PopupCommandGroup;
  isPrimary: boolean;
  order: number;
  button?: CustomButton;
  actionName?: PopupBuiltInActionKey;
}

@Component({
  standalone: false,
  selector: 'add-item-popup',
  templateUrl: './add-item-popup.component.html',
  styleUrls: ['./add-item-popup.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddItemPopupComponent implements OnInit, OnDestroy {

  id!: string;
  lineData: any[] = [];
  lineErrors: Record<number, string> = {};
  pendingReverts = new Map<number, any>();
  update: boolean = false;
  headerReady: boolean = false;
  showLineSection: boolean = false;
  lineReady: boolean = false;
  headerFormGroup!: FormGroup;
  lineFormGroup!: FormGroup;
  calculationFormGroup!: FormGroup;
  checkLineAll: boolean = false;
  selectedLines: number[] = [];
  saving: boolean = false;
  get isStatusSaving(): boolean {
    return this.saving || this.lineSavingRows.size > 0;
  }
  showEditButton: boolean = true;
  justCalledPostApi: boolean = false;
  pendingPatchData: any;
  showInformationButton: boolean = false;
  showInformationTabs: boolean = false;
  activeTab: string = 'logEntries';
  copyHeaderPKProp!: string;
  page: number = 0;
  pageSize: number = 25;
  lazyloading: boolean = false;
  showMoreButton: boolean = false;
  activeCommandMenu: PopupCommandMenuKey | null = null;
  viewModeEnableControls: string[] = [];
  firstSectionOpen = true;
  isDisableDimensionButton: boolean = false;
  isDisableDimensionInPopup: boolean = false;
  private lastReturnedCount = 0;
  badgePulse: boolean = false;
  flashRows: Set<number> = new Set();
  exceededLines: (string | number)[] = [];
  isDisableAddButtonLine: boolean = false;
  isDisableDeleteButtonLine: boolean = false;
  disableSequential: boolean[] = [];
  disableParallel: boolean[] = [];
  suspendHeaderAutoSave: boolean = false;
  documentData!: any;
  documentType!: string;
  private permissionMap = new Map<string, ButtonPermission>();
  private lineSavingRows = new Set<number>();
  private pendingAutoGenerateOnFirstInteraction: boolean = false;
  private lastPopupCommandKey: string | null = null;
  private lastPopupCommandAt = 0;


  @Input() recordLineNo!: number;

  drawerLocked = false;
  date: any = this.datepipe.transform(new Date(), 'dd/MM/yyyy');

  public informationDetailSecctionType = InformationDetailSecctionType;
  summaryFields?: SummaryFieldConfig[];
  summaryLineFields?: SummaryFieldConfig[];
  protected enableOrDisableAllControlsSubscription!: Subscription;
  protected disableAllControlsExceptSomeSubscription!: Subscription;
  protected callPatchApiSubscription!: Subscription;
  protected patchLineDataSubscription!: Subscription;
  protected showLoaderSubscription!: Subscription;
  protected dropdownApiLoaderSubscription!: Subscription;
  protected popupRefreshLineDataSubscription!: Subscription;
  protected popupUncheckLineDataSubscription!: Subscription;
  protected updateLineControlDataSubscription!: Subscription;
  protected updateLineMultipleControlsDataSubscription!: Subscription;
  protected disableLineControlSubscription!: Subscription;
  protected closePopupSubscription!: Subscription;
  protected refreshDataSubscription!: Subscription;
  protected refreshDrawerSubpopupDataSubscription!: Subscription;
  protected drawerLockSubscription!: Subscription;
  protected isDisableAddButtonLineSubscription!: Subscription;
  protected isDisableDeleteButtonLineSubscription!: Subscription;
  protected showOnSequentialButtonSubscription!: Subscription;
  protected showOnParallelButtonSubscription!: Subscription;
  protected addHeaderButtonsSubscription!: Subscription;
  protected addLineButtonsSubscription!: Subscription;
  protected isShowDimensionButtonSubscription!: Subscription;
  protected isShowDimensionInPopupSubscription!: Subscription;
  private reloadHeaderByIdSub!: Subscription;
  protected suspendHeaderAutoSaveSubscription!: Subscription;
  protected forceLeaveHeaderControlSubscription!: Subscription;
  protected customButtonResponseSubscription!: Subscription;
  protected hideLineControlsListSubscription!: Subscription;
  protected getLineAttachmentSubscription!: Subscription;

  private dropdownApiLoadingCount: number = 0;
  public dropdownApiLoading: boolean = false;

  get overlayLoading(): boolean {
    return this.loading || this.dropdownApiLoading;
  }
  @Input() linkMode: boolean = false;
  @Input() headerFilter!: string;
  @Input() headerData: any;
  @Input() itemConfig!: ItemConfig;
  @Input() viewMode: boolean = false;
  @Input() editPermission: boolean = true;
  @Input() loading!: boolean;
  @Input() closeAfterCreate: boolean = false;
  @Input() deferAutoGenerateCreate: boolean = false;
  @Input() fileDeleteApi!: string;
  @Input() fileUrlProp!: string;
  // Set by openModulePopup: the childModalDepth$ value AT WHICH this popup was opened.
  // Used to suppress showLoader$ bleed from grandchild popups without affecting this popup's own loader.
  openedAtDepth: number = 0;
  @Output() popupLoaded = new EventEmitter<any>();
  @Output() popupAddNewPostResponse = new EventEmitter<any>();
  @Output() changeEvent = new EventEmitter<EventDataModel>();
  @Output() leaveEvent = new EventEmitter<FormDataModel>();
  @Output() buttonClickEvent = new EventEmitter<CustomButtonEvent>();
  @Output() addLineEvent = new EventEmitter<AddLineEvent>();
  @Output() drawerStateChange = new EventEmitter<any>();
  @Output() dropdownOpend = new EventEmitter<any>();
  // @Output() customButtonEvent = new EventEmitter<any>();
  @Output() lineSelected = new EventEmitter<number>();
  @Output() drawerOpen = new EventEmitter<number>();
  @Output() drawerClosed = new EventEmitter<number>();
  selectedRowIndex: number = 0;

  sectionStates: boolean[] = [];
  isFullscreen = false;
  groupedControls: Record<string, any[]> = {};
  packedSectionRows: FormField[][][] = [];
  // === NEW AUTO-SAVE SUPPORT ===
  private headerPendingChanges: any = {};
  private linePendingChanges: Map<number, any> = new Map();

  // === SMOOTH SAVING INDICATOR ===
  private savingTimeout: any;
  private lastNewRowIndex: number | null = null;
  pendingNewLineIndex: number | null = null;
  private setSaving(value: boolean) {
    clearTimeout(this.savingTimeout);
    if (value) {
      this.saving = true;
      this.cdr.detectChanges();
    } else {
      this.savingTimeout = setTimeout(() => {
        this.saving = false;
        this.cdr.detectChanges();
      }, 800);
    }
  }

  private updateDropdownOverlayState(isLoading: boolean) {
    if (isLoading) {
      this.dropdownApiLoadingCount += 1;
    } else {
      this.dropdownApiLoadingCount = Math.max(0, this.dropdownApiLoadingCount - 1);
    }

    const nextState = this.dropdownApiLoadingCount > 0;
    if (this.dropdownApiLoading !== nextState) {
      this.dropdownApiLoading = nextState;
      this.cdr.detectChanges();
    }
  }

  constructor(
    private fb: FormBuilder,
    public activeModal: NgbActiveModal,
    private toastr: ToastrService,
    private restService: RestService,
    private utility: Utility,
    private cdr: ChangeDetectorRef,
    private encryptService: EncryptDecryptService,
    private sessionService: SessionService,
    private addItemService: AddItemService,
    private excelExportService: ExcelExportService,
    private datepipe: DatePipe,
    private modal: NgbModal,
    private dataTableService: DataTableService,
    private selectedItemService: SelectedItemService,
    private formDataService: FormDataService,
    private customSharedService: CustomSharedService,
    private dialogService: UnifiedDialogService,
    private selectedRowIndexService: SelectedRowIndexService,
    private hostElement: ElementRef<HTMLElement>
  ) { }

  @HostListener('document:mousedown', ['$event'])
  onDocumentInteraction(event: MouseEvent) {
    const target = event.target as Node | null;
    if (!target) {
      return;
    }

    if (this.hostElement.nativeElement.contains(target) && this.shouldCreateDraftFromInteraction(target)) {
      this.ensureAutoGeneratedDraftOnFirstInteraction();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement | null;
    if (!target) {
      return;
    }

    if (target.closest('.pr-popup-command-menu')) {
      return;
    }

    this.closeActiveCommandMenu();
  }

  @ViewChild('customLoadingTemplate', { static: false }) customLoadingTemplate!: TemplateRef<any>;
  @ViewChild(AttachmentsComponent) drawerAttachmentsRef?: AttachmentsComponent;

  public primaryColour = PrimaryWhite;
  public secondaryColour = SecondaryGrey;
  public coloursEnabled = false;
  public loadingTemplate!: TemplateRef<any>;

  public configlode: any = {
    primaryColour: this.primaryColour,
    secondaryColour: this.secondaryColour,
    tertiaryColour: this.primaryColour,
    backdropBorderRadius: '3px'
  };


  ngOnInit() {
    queueMicrotask(() => this.syncDocumentModalSize());

    this.buildPackedSectionRows();
    this.groupControls();
    if (this.lineData?.length) {
      // this.selectRow(0);
      this.resetSelectedRowIndex();
    }
    //TMY Subhankar/03.12.2025/ For hasNoHeaderApi
    if (this.itemConfig.hasNoHeaderApi === true) {
      this.itemConfig.headerConfig = this.itemConfig.headerConfig || {};
      this.itemConfig.headerConfig.sections = this.itemConfig.headerConfig.sections || [];
      this.itemConfig.headerConfig.buttons = this.itemConfig.headerConfig.buttons || [];
      this.itemConfig.lineConfig = this.itemConfig.lineConfig || {};

      this.headerData = this.headerData || {};
      if (this.itemConfig.headerConfig.sections.length > 0) {
        this.prepareHeaderControls();
        this.populateHeaderControls(this.headerData);
      }

      this.headerReady = true;
      if (this.itemConfig.lineConfig.api) {
        this.getLineData(); // getLineData will emit popupLoaded when lines are ready
        this.showLineSection = true;
      } else {
        this.showLineSection = false;
        this.lineReady = true;
        this.popupLoaded.emit({
          header: this.headerData,
          line: []
        });
      }

      return;
    }
    //TMY Subhankar/03.12.2025/ For hasNoHeaderApi end


    if (this.itemConfig.autoSave === undefined || this.itemConfig.autoSave === null) {
      this.itemConfig.autoSave = true;
    }

    if (this.itemConfig.lineConfig) {
      this.showLineSection = true;

      if (this.itemConfig.lineConfig.disableLine === undefined || this.itemConfig.lineConfig.disableLine === null) {
        this.itemConfig.lineConfig.disableLine = false;
      }

      if (this.itemConfig.lineConfig.showCreate === undefined || this.itemConfig.lineConfig.showCreate === null) {
        this.itemConfig.lineConfig.showCreate = true;
      }

      if (this.itemConfig.lineConfig.showDelete === undefined || this.itemConfig.lineConfig.showDelete === null) {
        this.itemConfig.lineConfig.showDelete = true;
      }
      if (this.itemConfig.lineConfig.defaultLines === undefined || this.itemConfig.lineConfig.defaultLines === null) {
        this.itemConfig.lineConfig.defaultLines = 2;
      }
      if (this.itemConfig.lineConfig.showLineAttachments === undefined || this.itemConfig.lineConfig.showLineAttachments === null) {
        this.itemConfig.lineConfig.showLineAttachments = false;
      }
      // if (this.itemConfig.headerConfig!.patchUserId === undefined || this.itemConfig.headerConfig!.patchUserId === null) {
      //   this.itemConfig.headerConfig!.patchUserId = true;
      // }
      if (this.itemConfig.headerConfig && this.itemConfig.headerConfig!.patchUserId === undefined || this.itemConfig.headerConfig!.patchUserId === null) {
        this.itemConfig.headerConfig!.patchUserId = true;
      }
      //  this.itemConfig?.headerConfig?.buttons && (this.itemConfig.headerConfig.buttons = this.itemConfig.headerConfig.buttons.map(b => ({ ...b, isEnable: b.isEnable !== false })));
      this.itemConfig?.headerConfig?.buttons?.forEach((b: any) => { b.isEnable ??= true; b.isVisible ??= true; });
      this.itemConfig?.lineConfig?.buttons?.forEach((b: any) => { b.isEnable ??= true; b.isVisible ??= true; });
      this.isDisableAddButtonLineSubscription = this.addItemService.isDisableAddButtonLine$.subscribe((data: boolean) => {
        this.isDisableAddButtonLine = data;
      });
      this.isDisableDeleteButtonLineSubscription = this.addItemService.isDisableDeleteButtonLine$.subscribe((data: boolean) => {
        this.isDisableDeleteButtonLine = data;
      });
      this.refreshDataSubscription = this.addItemService.refreshData$.subscribe((data: boolean) => {
        this.refreshData();
      });
      this.customButtonResponseSubscription = this.addItemService.customButtonResponse$.subscribe((data: boolean) => {
        this.customButtonResponse(data);
      });
      this.isShowDimensionButtonSubscription = this.addItemService.isDisableDimensionButton$.subscribe((data: boolean) => {
        this.isDisableDimensionButton = data;
      });
      this.isShowDimensionInPopupSubscription = this.addItemService.isDisableDimensionInPopup$.subscribe((data: boolean) => {
        this.isDisableDimensionInPopup = data;
      });
      this.getLineAttachmentSubscription = this.addItemService.getLineAttachment$.subscribe(() => {
        if (this.drawerAttachmentsRef) {
          this.drawerAttachmentsRef.getAttachments(this.drawerAttachmentsRef._documentNo);
        }
      });

      this.addHeaderButtonsSubscription =
        this.addItemService.addHeaderButtons$.subscribe((buttons: any[]) => {
          if (!buttons?.length) return;

          const existingButtons = this.itemConfig?.headerConfig?.buttons ?? [];

          const incomingMap = new Map(buttons.map(b => [b.name, b]));

          const mergedButtons = [
            ...existingButtons.map(btn =>
              incomingMap.has(btn.name)
                ? { ...btn, ...incomingMap.get(btn.name) }
                : btn
            ),
            ...buttons.filter(b => !existingButtons.some(e => e.name === b.name))
          ].map(b => ({
            ...b,
            isEnable: b.isEnable !== false,
            isVisible: b.hasOwnProperty('isVisible') ? b.isVisible : false
          }));
          this.itemConfig!.headerConfig!.buttons = mergedButtons;
          this.cdr.detectChanges();
        });

      this.addLineButtonsSubscription =
        this.addItemService.addLineButtons$.subscribe((buttons: any[]) => {
          if (!buttons?.length) return;

          const existingButtons = this.itemConfig?.lineConfig?.buttons ?? [];

          const incomingMap = new Map(buttons.map(b => [b.name, b]));

          const mergedButtons = [
            ...existingButtons.map(btn =>
              incomingMap.has(btn.name)
                ? { ...btn, ...incomingMap.get(btn.name) }
                : btn
            ),
            ...buttons.filter(b =>
              !existingButtons.some(e => e.name === b.name)
            )
          ].map(b => ({
            ...b,
            isEnable: b.isEnable !== false,
            isVisible: b.hasOwnProperty('isVisible') ? b.isVisible : false
          }));

          this.itemConfig!.lineConfig!.buttons = mergedButtons;

          this.cdr.detectChanges();
        });


      this.lineFormGroup = this.fb.group({
        items: new FormArray([])
      });
    }

    if (this.itemConfig.informationSectionConfig) {
      this.showInformationButton = true;
      this.showInformationTabs = true;
    }

    if (this.itemConfig.calculationSectionConfig) {
      let group: any = {};
      for (let i = 0; i < this.itemConfig.calculationSectionConfig.controls!.length; i++) {
        const column: FormField[] = this.itemConfig.calculationSectionConfig.controls![i];
        for (let j = 0; j < column.length; j++) {
          const control: FormField = column[j];
          let validators: any[] = [];
          if (control.required) {
            validators.push(Validators.required);
          }
          if (control.type === FormFieldType.Email) {
            validators.push(Validators.email);
          }
          group[control.label!] = new FormControl(null, validators);
        }
      }
      group.items = new FormArray([]);
      this.calculationFormGroup = this.fb.group(group);
    }

    // if (!this.itemConfig.headerConfig!.removeUnicodeCharFields) {
    //   this.itemConfig.headerConfig!.removeUnicodeCharFields = [];
    // }

    // if (this.itemConfig.lineConfig && !this.itemConfig.lineConfig.removeUnicodeCharFields) {
    //   this.itemConfig.lineConfig.removeUnicodeCharFields = [];
    // }


    if (!this.itemConfig?.headerConfig?.removeUnicodeCharFields) {
      this.itemConfig.headerConfig = this.itemConfig.headerConfig || {};
      this.itemConfig.headerConfig.removeUnicodeCharFields = [];
    }

    if (!this.itemConfig?.lineConfig?.removeUnicodeCharFields) {
      if (this.itemConfig.lineConfig) {
        this.itemConfig.lineConfig.removeUnicodeCharFields = [];
      }
    }

    this.copyHeaderPKProp = '';
    if (this.itemConfig.headerConfig!.id === 'copy') {
      this.viewMode = false;
      this.update = false;
      this.copyHeaderData(this.headerFilter);

    } else if (this.itemConfig.headerConfig!.id === 'add') {
      this.headerData = this.getHeaderInitialData(); // TMY Subhankar/28.11.25/ To add initialValue value in payload
      //this.headerData = {};
      this.lineData = [];
      this.justCalledPostApi = false;
      this.pendingPatchData = undefined;
      this.createFormGroup();
      if (this.showLineSection) {
        for (var i = 0; i < this.itemConfig.lineConfig!.defaultLines!; i++) {
          this.lineData.push(this.getLineInitialData());
        }
        this.generateItemsFormArray(this.lineData);
      }

      this.popupLoaded.emit({
        header: this.headerData,
        line: []
      });

      this.update = false;
      this.viewMode = false;
      this.headerData.CreatedBy = this.sessionService.UserId;
      this.headerData.UserId = this.sessionService.UserId;
      this.headerData.Company = this.sessionService.CompanyName;
      this.headerData.CompanyId = this.sessionService.Company;
      // this.headerData.PortalResponsibilityCentre = this.sessionService.DefaultResponsibilityCenter;
      this.headerData.PortalResponsibilityCentre = this.sessionService.ResponsibilityCenter?.PortalResponsibilityCentre;
      if (this.itemConfig.headerConfig!.includeUserId) {
        this.headerData.UserId = this.sessionService.UserId;
      }

      this.pendingAutoGenerateOnFirstInteraction =
        !!this.itemConfig.headerConfig!.autoGenerateField && !this.deferAutoGenerateCreate;
      this.headerReady = true;
      this.cdr.detectChanges();

    } else {
      this.update = true;
      if (this.linkMode) {
        this.viewMode = true;
        this.showEditButton = false;
        this.loadButtonPermissions();
      } else {
        this.viewMode = false;
      }

      this.headerData = this.headerData || {};
      this.createFormGroup();

      const hasHeaderFilter = !!this.headerFilter?.trim?.();
      const shouldFetchHeaderInLinkMode = !!this.linkMode && !!this.itemConfig.headerConfig?.api && hasHeaderFilter;

      if (shouldFetchHeaderInLinkMode) {
        this.getHeaderData(this.headerFilter);
      }

      // Use prefilled header data when no filter is available (prevents api+undefined)
      // or when the filter uses $filter (lookup detail path where API may not support it).
      const hasPrefilledHeaderData =
        Object.keys(this.headerData).length > 0 &&
        (!hasHeaderFilter || !!this.headerFilter?.includes('$filter'));
      if (!shouldFetchHeaderInLinkMode && hasPrefilledHeaderData) {
        this.headerData = this.removeUnicodeChars(this.headerData);
        this.headerFormGroup.patchValue(
          this.utility.setHeaderControlsData(this.headerData, this.itemConfig.headerConfig!.controls!)
        );
        this.headerReady = true;

        if (this.showLineSection) {
          this.id = this.headerData[this.itemConfig.lineConfig!.headerPKProp!];
          if (this.id) {
            this.getLineData();
          } else {
            this.lineData = [];
            this.generateItemsFormArray(this.lineData);
            this.popupLoaded.emit({
              header: this.headerData,
              line: []
            });
          }
        } else {
          this.popupLoaded.emit({
            header: this.headerData,
            line: []
          });
        }

        this.cdr.detectChanges();
      } else if (!shouldFetchHeaderInLinkMode) {
        if (this.itemConfig.headerConfig?.api && hasHeaderFilter) {
          this.getHeaderData(this.headerFilter);
        } else {
          this.headerReady = true;
        }

        if (this.showLineSection) {
          this.id = this.headerData[this.itemConfig.lineConfig!.headerPKProp!];
          if (this.id) {
            this.getLineData();
          } else {
            this.lineData = [];
            this.generateItemsFormArray(this.lineData);
            this.popupLoaded.emit({
              header: this.headerData,
              line: []
            });
          }
        } else {
          this.popupLoaded.emit({
            header: this.headerData,
            line: []
          });
        }
      }
    }

    this.enableOrDisableAllControlsSubscription = this.addItemService.enableOrDisableAllControls$.subscribe((data: boolean) => {
      this.viewMode = !data;
      this.showEditButton = data;
      this.cdr.detectChanges();
    });

    this.disableAllControlsExceptSomeSubscription = this.addItemService.disableAllControlsExceptSome$.subscribe((data: string[]) => {
      this.viewMode = true;
      this.showEditButton = false;
      this.viewModeEnableControls = data;
      this.updateViewModeEnableControls();
      this.cdr.detectChanges();
    });

    this.callPatchApiSubscription = this.addItemService.callPatchApi$.subscribe((row: number) => {
      const record = this.lineData[row];
      this.pendingPatchData = this.utility.getLineControlsData(this.pendingPatchData, this.itemConfig.lineConfig!.controls!);
      this.updateLineItemRecord(record, this.pendingPatchData, row);
    });

    this.patchLineDataSubscription = this.addItemService.patchLineData$.subscribe((data: { rowIndex: number, data: any, disableControls: boolean }) => {
      const rowRecord = this.lineData[data.rowIndex];
      const lineIdProp = this.itemConfig.lineConfig!.idProp!;

      if (rowRecord && rowRecord[lineIdProp]) {
        const patchData = this.utility.getLineControlsData({ ...data.data }, this.itemConfig.lineConfig!.controls!);
        this.updateLineItemRecord(rowRecord, patchData, data.rowIndex, data.disableControls);
      } else {
        this.pendingPatchData = { ...(this.pendingPatchData || {}), ...(data.data || {}) };
      }
    });

    this.showLoaderSubscription = this.addItemService.showLoader$.subscribe((data: boolean) => {
      // Only suppress loader if a child popup has been opened ON TOP OF this popup.
      // openedAtDepth = the depth level at which THIS popup was opened (0 for top-level, 1 for first sub-popup etc.)
      // If the current global depth is greater than our own level, a grandchild is open → suppress.
      if (this.addItemService.childModalDepth$.value > this.openedAtDepth) return;
      this.loading = data;
      this.cdr.detectChanges();
    });
    this.dropdownApiLoaderSubscription = this.addItemService.showDropdownAPICallLoader$.subscribe((isLoading: boolean) => {
      this.updateDropdownOverlayState(isLoading);
    });
    this.popupRefreshLineDataSubscription = this.addItemService.popupRefreshLineData$.subscribe((data: boolean) => {
      if (this.addItemService.childModalDepth$.value > 0) return; // a child modal is open — suppress cross-popup signal bleed
      this.getLineData(false, false);  // emit popupLoaded so parent can re-populate cascading dropdowns (e.g. "No" based on "Type")
    });

    this.popupUncheckLineDataSubscription = this.selectedItemService.popupUncheckedLineData$.subscribe((data: boolean) => {
      this.unselectAllLineItem();
    });

    this.reloadHeaderByIdSub = this.addItemService.reloadHeaderById$.subscribe((data: number | string) => {
      this.subscribeReloadHeaderById(data);
    });

    this.addItemService.pendingRevertLine$.subscribe(({ rowIndex, data }) => {
      this.pendingReverts.set(rowIndex, data);
    });

    this.addItemService.patchLineFormOnly$.subscribe(({ rowIndex, data }) => {
      // Immediately patch the form + lineData with no API call.
      // Used after a validation warning to snap the field back right away
      // so further blur events don't re-trigger the same dialog.
      this.applyServerLineResponse(data, rowIndex);
    });

    this.updateLineControlDataSubscription = this.addItemService.updateLineControlData$.subscribe((data: { control: string, data: any, update: boolean }) => {
      if (this.headerData[this.itemConfig.headerConfig!.idProp!]) {
        this.lineData.forEach((line: any, index: number) => {
          let lineFormGroup = (this.items.controls as FormGroup[])[index] as FormGroup;
          lineFormGroup.controls[data.control].setValue(data.data, { emitEvent: false });
          if (data.update) {
            line[data.control] = data.data;
            const patchData = {
              [data.control]: this.utility.convertDateObjToString(data.data, true)
            };
            this.updateLineItemRecord(line, patchData, index);
          }
        });
      }
    });


    this.updateLineMultipleControlsDataSubscription = this.addItemService.updateLineMultipleControlsData$.subscribe((data: { data: any, rowIndex: number, emitEvent: boolean }) => {
      if (this.headerData[this.itemConfig.headerConfig!.idProp!]) {
        this.lineData.forEach((line: any, index: number) => {
          if (index === data.rowIndex && data.data) {
            let lineFormGroup = (this.items.controls as FormGroup[])[index] as FormGroup;
            const keys = Object.keys(data.data);
            keys.forEach((key: string) => {
              let control = lineFormGroup.get(key);
              if (control) {
                control.setValue(data.data[key], { emitEvent: data.emitEvent });
              }
            });

            if (line[this.itemConfig.lineConfig!.idProp!]) {
              this.updateLineItemRecord(line, data.data, index);
            } else {
              if (this.itemConfig.lineConfig!.lineFKProp && this.itemConfig.lineConfig!.headerPKProp!) {
                line[this.itemConfig.lineConfig!.lineFKProp] = this.headerData[this.itemConfig.lineConfig!.headerPKProp!];
              }
              this.addLineItemRecord(Object.assign({}, line, data.data), index);
            }
          }
        });
      }
    });

    this.disableLineControlSubscription = this.addItemService.disableLineControls$.subscribe((data: boolean) => {
      this.itemConfig.lineConfig!.disableLine = data;
    });

    this.closePopupSubscription = this.addItemService.closePopup$.subscribe((data: boolean) => {
      this.activeModal.close({
        action: 'Update',
        record: data
      });
    });

    this.showOnSequentialButtonSubscription = this.addItemService.showOnSequentialButton$
      .subscribe(({ show, rowIndex }) => {
        if (!Array.isArray(this.disableSequential)) this.disableSequential = [];
        this.disableSequential[rowIndex] = !show;
        //  this.cdr.detectChanges();
      });

    this.showOnParallelButtonSubscription = this.addItemService.showOnParallelButton$
      .subscribe(({ show, rowIndex }) => {
        if (!Array.isArray(this.disableParallel)) this.disableParallel = [];
        this.disableParallel[rowIndex] = !show;
        // this.cdr.detectChanges();
      });


    if (!this.dataTableService.popupTaggle) {
      let sec = this.itemConfig.headerConfig!.sections;
      this.dataTableService.popupTaggle = sec?.slice(1).map(section => (
        true
      ));;
      this.sectionStates = this.dataTableService.popupTaggle;
    }
    else {
      this.sectionStates = this.dataTableService.popupTaggle;
    }
    this.documentType = this.itemConfig!.title!;
    setTimeout(() => {
      if (this.headerData) {
        this.documentData = this.headerData;
      }
    }, 1000)



    this.suspendHeaderAutoSaveSubscription = this.addItemService.suspendHeaderAutoSave$.subscribe(flag => {
      this.suspendHeaderAutoSave = flag;
    });

    this.forceLeaveHeaderControlSubscription = this.addItemService.forceLeaveHeaderControl$.subscribe(({ control, value }) => {
      const controlConfig = this.itemConfig?.headerConfig?.controls?.flat()?.find(c => c.label === control);
      if (!controlConfig) return;
      const controlData: ControlDataModel = {
        control, data: value
      };
      this.leaveHeaderControl(controlData, controlConfig);
    });
  }
  populateHeaderControls(data: any) {
    if (!data) return;

    Object.keys(this.headerFormGroup.controls).forEach(key => {
      if (data[key] !== undefined) {
        this.headerFormGroup.get(key)?.setValue(data[key]);
      }
    });
  }

  private buildPackedSectionRows(): void {
    const sections = this.itemConfig?.headerConfig?.sections || [];
    this.packedSectionRows = sections.map(section => this.getPackedRowsForSection(section));
  }

  private getPackedRowsForSection(section: { controls: FormField[][]; autoPack?: boolean }): FormField[][] {
    const sourceRows = section.controls || [];
    if (!section.autoPack) {
      return sourceRows;
    }

    const fields = sourceRows.flat().filter((control): control is FormField => !!control);
    const packed: FormField[][] = [];
    let currentRow: FormField[] = [];

    fields.forEach(control => {
      if (control.hidden) {
        return;
      }

      const allowPacking = control.clearSpace !== true;
      if (!allowPacking) {
        if (currentRow.length) {
          packed.push([...currentRow]);
          currentRow = [];
        }
        packed.push([control]);
        return;
      }

      currentRow.push(control);
      if (currentRow.length === 2) {
        packed.push([...currentRow]);
        currentRow = [];
      }
    });

    if (currentRow.length) {
      packed.push([...currentRow]);
    }

    return packed;
  }

  getSectionRows(section: { controls: FormField[][]; autoPack?: boolean }, index: number): FormField[][] {
    return this.packedSectionRows[index] || section.controls || [];
  }


  prepareHeaderControls() {

    if (!this.itemConfig?.headerConfig?.sections) return;

    this.headerFormGroup = new FormGroup({});

    const sections = this.itemConfig.headerConfig.sections;

    sections.forEach(section => {
      section.controls.forEach(column => {
        column.forEach(control => {

          // Always valid because your config always has label
          const controlName = control.label;

          if (!controlName) {
            console.warn('Missing label in control:', control);
            return;
          }

          this.headerFormGroup.addControl(
            controlName,
            new FormControl({ value: null, disabled: false })
          );

        });
      });
    });
  }


  get formControls() { return this.headerFormGroup.controls; }
  get items() { return this.lineFormGroup.get('items') as FormArray; }


  // === AUTO-SAVE SCHEDULERS (Simplified Debounce Control) ===
  private headerSaveTimer: any;
  private lineSaveTimer: any;

  private scheduleHeaderSave() {
    if (this.headerSaveTimer) clearTimeout(this.headerSaveTimer);
    this.headerSaveTimer = setTimeout(() => {
      this.performHeaderSave();
      this.headerSaveTimer = null;
    }, 1500);
  }

  private scheduleLineSave() {
    if (this.lineSaveTimer) clearTimeout(this.lineSaveTimer);
    this.lineSaveTimer = setTimeout(() => {
      this.performLineSave();
      this.lineSaveTimer = null;
    }, 1500);
  }


  // --- Debounced Auto-Save Handlers ---
  private isHeaderSaving = false;

  private performHeaderSave() {
    // if already saving, skip this run
    if (this.isHeaderSaving || !Object.keys(this.headerPendingChanges).length) return;

    const patchData = this.utility.getHeaderControlsData(
      this.headerPendingChanges,
      this.itemConfig.headerConfig!.controls!
    );

    if (!this.headerData[this.itemConfig.headerConfig!.idProp!]) return;

    this.isHeaderSaving = true;
    this.setSaving(true);

    const ifMatchKey = '*';
    this.restService
      .patch(
        `${this.itemConfig.headerConfig!.api}(${this.headerData[this.itemConfig.headerConfig!.idProp!]})`,
        patchData,
        ifMatchKey
      )
      .subscribe({
        next: (res) => {
          this.headerData = res;
          this.headerPendingChanges = {};
          this.setSaving(false);
          this.isHeaderSaving = false;
          this.cdr.detectChanges();
          this.applyServerHeaderResponse(this.headerData);
          this.addItemService.headerSaveResponse$.next(this.headerData);
        },
        error: () => {
          this.setSaving(false);
          this.isHeaderSaving = false;
        }
      });
  }


  // --- Debounced Auto-Save Handlers (line version) ---
  private isLineSaving = false;

  private performLineSave() {
    // prevent overlapping line saves
    if (this.isLineSaving || this.linePendingChanges.size === 0) return;

    this.isLineSaving = true;

    this.linePendingChanges.forEach((changes, row) => {
      const record = this.lineData[row];
      if (record && record[this.itemConfig.lineConfig!.idProp!]) {
        const patchData = this.utility.getLineControlsData(
          changes,
          this.itemConfig.lineConfig!.controls!
        );
        this.updateLineItemRecord(record, patchData, row, true);
      }
    });

    this.linePendingChanges.clear();
    this.isLineSaving = false;
  }

  // --- End of Auto-Save Handlers ---

  public get isDataLoaded(): boolean {
    if (!this.showLineSection) {
      return this.headerReady;
    } else {
      return this.headerReady && this.lineReady;
    }
  }

  public getLineFormGroup(row: number) {
    return this.items.controls[row] as FormGroup;
  }

  updateViewModeEnableControls() {
    if (this.itemConfig.headerConfig!.controls && this.itemConfig.headerConfig!.controls!.length > 0) {
      for (let i = 0; i < this.itemConfig.headerConfig!.controls!.length; i++) {
        const column: FormField[] = this.itemConfig.headerConfig!.controls![i];
        for (let j = 0; j < column.length; j++) {
          const control: FormField = column[j];
          if (this.viewModeEnableControls.includes(control.label!)) {
            this.headerFormGroup.controls[control.label!].enable();
          } else {
            this.headerFormGroup.controls[control.label!].disable();
          }
        }
      }
    }

    if (this.itemConfig.lineConfig!.controls && this.itemConfig.lineConfig!.controls.length > 0) {
      for (let i = 0; i < this.lineData.length; i++) {
        let lineFormGroup = (this.items.controls as FormGroup[])[i];
        for (let j = 0; j < this.itemConfig.lineConfig!.controls.length; j++) {
          const control: FormField = this.itemConfig.lineConfig!.controls[j];
          if (lineFormGroup.controls[control.label!]) {
            if (this.viewModeEnableControls.includes('Line_' + control.label)) {
              lineFormGroup.controls[control.label!].enable();
            } else {
              lineFormGroup.controls[control.label!].disable();
            }
          }
        }
      }
    }
  }

  private removeUnicodeChars(record: any) {
    this.itemConfig.headerConfig!.removeUnicodeCharFields!.forEach((item: string) => {
      if (record[item]) {
        record[item] = record[item]
          .replace(/_x0020_/g, ' ')
          .replace(/_x002F_/g, '/');
      }
    });

    return record;
  }


  private removeLineUnicodeChars(record: any) {
    this.itemConfig.lineConfig!.removeUnicodeCharFields!.forEach((item: string) => {
      record[item] = this.utility.removeLineUnicodeChars(record[item]);
    });

    return record;
  }




  copyHeaderData(filter: string) {
    this.restService.get(this.itemConfig.headerConfig!.api + filter).subscribe((response: any) => {
      if (response && response.value) {
        this.headerData = this.removeUnicodeChars(response.value[0]);
      } else {
        this.headerData = this.removeUnicodeChars(response);
      }
      this.copyHeaderPKProp = this.headerData[this.itemConfig.lineConfig!.headerPKProp!]
      delete this.headerData['@odata.etag'];
      delete this.headerData['@odata.context'];
      delete this.headerData['PRCancelUserID@odata.mediaEditLink'];
      delete this.headerData['PurReqCancelUserID@odata.mediaEditLink'];
      delete this.headerData['PRCancelUserID@odata.mediaReadLink'];
      delete this.headerData['PurReqCancelUserID@odata.mediaReadLink'];
      delete this.headerData['selected'];
      delete this.headerData[this.itemConfig.headerConfig!.idProp!];
      if (this.showLineSection) {
        delete this.headerData[this.itemConfig.lineConfig!.headerPKProp!];
      }

      delete this.headerData[this.itemConfig.headerConfig!.autoGenerateField!];
      if (this.itemConfig.headerConfig!.controls && this.itemConfig.headerConfig!.controls.length > 0) {
        let group: any = {};
        for (let i = 0; i < this.itemConfig.headerConfig!.controls.length; i++) {
          const column: FormField[] = this.itemConfig.headerConfig!.controls[i];
          for (let j = 0; j < column.length; j++) {
            const control: FormField = column[j];
            if (control.type === FormFieldType.DateTime) {

            } else if (control.copyResetValue !== undefined && control.copyResetValue !== null) {
              this.headerData[control.label!] = control.copyResetValue;
            }
          }
        }
      }

      this.headerData.CreatedBy = this.sessionService.UserId;
      this.headerData.UserId = this.sessionService.UserId;
      this.headerData.Company = this.sessionService.CompanyName;
      this.headerData.CompanyId = this.sessionService.Company;
      // this.headerData.PortalResponsibilityCentre = this.sessionService.DefaultResponsibilityCenter;
      this.headerData.PortalResponsibilityCentre = this.sessionService.ResponsibilityCenter?.PortalResponsibilityCentre;
      this.createFormGroup();
      if (this.showLineSection) {
        for (var i = 0; i < this.itemConfig.lineConfig!.defaultLines!; i++) {
          this.lineData.push(this.getLineInitialData());
        }
        this.generateItemsFormArray(this.lineData);
      }

      this.addHeaderData();
      this.headerFormGroup.patchValue(this.utility.setHeaderControlsData(this.headerData, this.itemConfig.headerConfig!.controls!));
      if (this.showLineSection) {
        this.id = this.headerData[this.itemConfig.lineConfig!.headerPKProp!];
        this.getLineData();
      } else {
        this.popupLoaded.emit({
          header: this.headerData,
          line: []
        });
      }
      this.cdr.detectChanges();
    }, (error) => {
      this.activeModal.dismiss();
      this.toastr.warning('Unable to find the item');
    });
  }
  getHeaderData(filter: string, skipPopupLoaded: boolean = false) {
    this.restService.get(this.itemConfig.headerConfig!.api + filter).subscribe((response: any) => {
      if (response && response.value) {
        if (response.value.length > 0) {
          this.headerData = this.removeUnicodeChars(response.value[0]);
        } else {
          this.toastr.error('Document is not found');
          this.activeModal.close({
            action: 'close',
            record: null
          });
        }
      } else {
        this.headerData = this.removeUnicodeChars(response);
      }
      this.headerFormGroup.patchValue(this.utility.setHeaderControlsData(this.headerData, this.itemConfig.headerConfig!.controls!));
      this.headerReady = true;
      if (this.showLineSection) {
        this.id = this.headerData[this.itemConfig.lineConfig!.headerPKProp!];
        this.getLineData(false, skipPopupLoaded);
      } else {
        this.addItemService.showLoader$.next(false); // stop spinner (refresh case, no line section)
        if (!skipPopupLoaded) {
          this.popupLoaded.emit({
            header: this.headerData,
            line: []
          });
        }
      }
      this.cdr.detectChanges();
    }, (error) => {
      this.activeModal.dismiss();
      this.toastr.warning('Unable to find the item');
    });
  }

  //TMY-Amit 


  //tmy-Amit Start -  GetlineData

  getLineData(lazy: boolean = false, skipPopupLoaded: boolean = false) {
    //TMY Subhankar/03.12.2025/ For isDirectApi
    if (this.itemConfig?.lineConfig?.isDirectApi === true) {
      const fillMissingFields = (row: any) => {
        this.itemConfig.lineConfig!.controls!.forEach((control: FormField) => {
          const key = control.label!;
          if (row[key] === undefined) row[key] = null;
        });
      };
      const lines: any[] = [];
      for (let i = 0; i < this.itemConfig.lineConfig!.defaultLines!; i++) {
        const row = this.getLineInitialData();
        fillMissingFields(row);
        lines.push(row);
      }

      this.restService.get(this.itemConfig.lineConfig.api!).subscribe({
        next: (response: any) => {
          const values = response?.value || [];
          if (this.itemConfig.lineConfig!.removeUnicodeCharFields?.length) {
            values.forEach((r: any) => this.removeLineUnicodeChars(r));
          }
          this.lineData = [...values, ...lines];
          this.lineData.forEach(row => fillMissingFields(row));
          setTimeout(() => {
            this.generateItemsFormArray(this.lineData);
            // Only emit popupLoaded on the initial load, not on subsequent refreshes.
            // Re-emitting on refresh causes the parent component's popupLoaded() handler
            // to run again (dimension lookups, summary recalculations, etc.).
            if (!skipPopupLoaded) {
              this.popupLoaded.emit({ header: this.headerData, line: this.lineData });
            }
            this.cdr.detectChanges();
          }, 0);
        }
      });

      return;
    }
    //TMY Subhankar/03.12.2025/ For isDirectApi end

    const headerKey = this.itemConfig.lineConfig!.headerPKProp!;
    if (!this.headerData || !this.headerData[headerKey]) {
      this.lazyloading = false;
      this.addItemService.showLoader$.next(false);
      return;
    }

    this.id = this.headerData[headerKey];
    if (!this.id) {
      this.lazyloading = false;
      this.addItemService.showLoader$.next(false);
      return;
    }

    const lines: any[] = [];
    for (let i = 0; i < this.itemConfig.lineConfig!.defaultLines!; i++) {
      lines.push(this.getLineInitialData());
    }

    let filter = `?$filter=${this.itemConfig.lineConfig!.lineFKProp} eq '${this.id}'`;
    if (this.itemConfig.lineConfig!.filterByVersionNo) {
      filter += ` and VersionNo eq ${this.headerData.VersionNo}`;
    }

    if (lazy) {
      this.page++;
      this.lazyloading = true;
      filter += `&$top=${this.pageSize}&$skip=${(this.page - 1) * this.pageSize}`;
    }

    this.lazyloading = true;
    this.addItemService.showLoader$.next(true);

    this.restService.get(this.itemConfig.lineConfig!.api + filter).subscribe({
      next: (response: any) => {
        const values = response?.value || [];

        if (this.itemConfig.lineConfig!.removeUnicodeCharFields?.length) {
          values.forEach((r: any) => this.removeLineUnicodeChars(r));
        }

        if (!values.length) {
          this.lineData = [...lines];

          this.lazyloading = false;
          this.addItemService.showLoader$.next(false);

          setTimeout(() => {
            this.generateItemsFormArray(this.lineData);
            if (!skipPopupLoaded) {
              this.popupLoaded.emit({ header: this.headerData, line: [] });
            }
            this.cdr.detectChanges();
          }, 0);

          return;
        }

        this.lineData = lazy ? [...this.lineData, ...values] : values;

        if (!lazy) {
          for (let i = 0; i < this.itemConfig.lineConfig!.defaultLines!; i++) {
            this.lineData.push(this.getLineInitialData());
          }
        }

        this.lazyloading = false;
        this.addItemService.showLoader$.next(false);

        setTimeout(() => {
          this.generateItemsFormArray(this.lineData);
          if (!skipPopupLoaded) {
            this.popupLoaded.emit({ header: this.headerData, line: this.lineData });
          }
          this.cdr.detectChanges();
        }, 0);
      },

      error: () => {
        this.lineData = [...lines];
        this.lazyloading = false;
        this.addItemService.showLoader$.next(false);

        setTimeout(() => {
          this.generateItemsFormArray(this.lineData);
          if (!skipPopupLoaded) {
            this.popupLoaded.emit({ header: this.headerData, line: [] });
          }
          this.cdr.detectChanges();
        }, 0);
      },

      complete: () => {
        this.lazyloading = false;
        this.addItemService.showLoader$.next(false);
      }
    });
  }




  copyLineData() {
    if (this.lineData.length > 0) {
      let api = this.itemConfig.lineConfig!.api;
      if (this.itemConfig.lineConfig!.includeHeaderId) {
        api = '/' + this.itemConfig.headerConfig!.api + '(' + this.headerData[this.itemConfig.headerConfig!.idProp!] + ')' + api;
      }
      const postObservables = this.lineData.map((line: any) => {
        delete line['@odata.etag'];
        delete line['Id'];
        line[this.itemConfig.lineConfig!.lineFKProp!] = this.headerData[this.itemConfig.lineConfig!.headerPKProp!];
        // line.CreatedBy = this.sessionService.UserId;
        // line.UserId = this.sessionService.UserId;
        // line.Company = this.sessionService.CompanyName;
        // line.CompanyId = this.sessionService.Company;
        // line.PortalResponsibilityCentre = this.sessionService.DefaultResponsibilityCenter;
        //   line common fields came from header data //confirm by Sir 
        line.CreatedBy = this.headerData.UserId;
        line.UserId = this.headerData.UserId;
        line.Company = this.headerData.Company;
        line.CompanyId = this.headerData.CompanyId;
        line.PortalResponsibilityCentre = this.headerData.ResponsibilityCenterId;
        return this.restService.post(api!, line).pipe(catchError(error => {
          return of(null);
        }));
      });

      forkJoin(postObservables).subscribe((res: any[]) => {
        this.lineData = res;
        if (this.lineData.length < this.itemConfig.lineConfig!.defaultLines!) {
          for (var i = 0; i < this.itemConfig.lineConfig!.defaultLines!; i++) {
            this.lineData.push(this.getLineInitialData());
          }
        }
        if (this.lineData.length > 0) {
          this.generateItemsFormArray(this.lineData);
          this.popupLoaded.emit({
            header: this.headerData,
            line: this.lineData
          });
        }
      });

      this.id = this.headerData[this.itemConfig.lineConfig!.headerPKProp!];
      this.lineData = this.lineData.slice(0, this.pageSize - 1);
    } else {
      this.popupLoaded.emit({
        header: this.headerData,
        line: []
      });
    }
  }

  createFormGroup() {
    if (this.itemConfig.headerConfig!.controls && this.itemConfig.headerConfig!.controls.length > 0) {
      let group: any = {};
      for (let i = 0; i < this.itemConfig.headerConfig!.controls.length; i++) {
        const column: FormField[] = this.itemConfig.headerConfig!.controls[i];
        for (let j = 0; j < column.length; j++) {
          const control: FormField = column[j];
          let validators: any[] = [];
          if (control.required) {
            validators.push(Validators.required);
          }
          if (control.type === FormFieldType.Email) {
            validators.push(Validators.email);
          }
          let data: any;
          if (this.update) {
            let controlData: any;
            if (control.parentObjectName) {
              controlData = this.headerData[control.parentObjectName][control.label!];
            } else {
              controlData = this.headerData[control.label!];
            }
            if (controlData) {
              if (control.type === FormFieldType.DateTime) {
                if (controlData === '0001-01-01') {
                  data = null;
                } else if (controlData === '0001-01-01' && control.defaultSystemDate) {
                  data = this.utility.convertStringToDateObj(this.datepipe.transform(new Date(), 'yyyy-MM-dd')!);
                } else {
                  data = this.utility.convertStringToDateObj(controlData);
                }
              } else if (control.type === FormFieldType.Password) {
                data = this.encryptService.decrypt(controlData + '');
              } else {
                if (control.mutiple) {
                  data = controlData.split(',');
                } else {
                  data = controlData;
                }
              }
            }
            this.headerData[control.label!] = data;
          } else {
            if (control.type === FormFieldType.DateTime && control.defaultSystemDate) {
              this.headerData[control.label!] = this.utility.convertStringToDateObj(this.datepipe.transform(new Date(), 'yyyy-MM-dd')!);
            }
          }
          group[control.label!] = new FormControl(data, validators);
        }
      }
      this.headerFormGroup = this.fb.group(group);
      this.cdr.detectChanges();
    }
  }

  generateItemsFormArray(data: any[]) {
    this.lineFormGroup = this.fb.group({
      items: new FormArray([])
    });
    data.forEach((item: any) => {
      this.createItemFormGroup(item);
    });
    this.lineReady = true;
    this.cdr.detectChanges();
  }

  createItemFormGroup(item: any, first: boolean = false) {
    if (this.itemConfig.lineConfig!.controls && this.itemConfig.lineConfig!.controls.length > 0) {
      let group: any = {};
      for (let i = 0; i < this.itemConfig.lineConfig!.controls.length; i++) {
        const control: FormField = this.itemConfig.lineConfig!.controls[i];
        let validators: any[] = [];
        if (control.required) {
          validators.push(Validators.required);
        }
        if (control.type === FormFieldType.Email) {
          validators.push(Validators.email);
        }
        let data: any;
        if (control.type === FormFieldType.DateTime) {
          if (item[control.label!] === '0001-01-01' && control.defaultSystemDate) {
            data = this.utility.convertStringToDateObj(this.datepipe.transform(new Date(), 'yyyy-MM-dd')!);
          } else {
            data = this.utility.convertStringToDateObj(item[control.label!]);
          }
        } else {
          data = item[control.label!];
        }
        group[control.label!] = new FormControl(data, validators);
      }

      if (first) {
        this.items.insert(0, this.fb.group(group));
      } else {
        this.items.push(this.fb.group(group));
      }
    }
  }



  addLine() {
    const data = this.getLineInitialData();
    this.createItemFormGroup(data, false);
  }

  getLineInitialData() {
    let data: any = {};

    this.itemConfig.lineConfig!.controls!.forEach((control: FormField) => {
      if (control.initialValue) {
        data[control.label!] = control.initialValue;
      }
    });

    return data;
  }

  getHeaderInitialData() {
    let data: any = {};

    if (this.itemConfig.headerConfig?.controls?.length) {
      this.itemConfig.headerConfig.controls.forEach(column => {
        column.forEach(control => {
          if (control.initialValue) {
            data[control.label!] = control.initialValue;
          }
        });
      });
    }
    return data;
  }

  async deleteLine(row: number) {
    if (this.itemConfig?.validateOnLineDelete) {
      const result = await this.itemConfig.validateOnLineDelete([this.lineData[row]]);
      if (!result.allowed) {
        this.dialogService.showAlert('custom', { title: 'Cannot Delete', text: result.message || 'This line cannot be deleted.' });
        return;
      }
    }

    const confirmed = await this.dialogService.confirmDelete({
      message: 'Are you sure you want to delete this line? This action cannot be undone.'
    });

    if (!confirmed) {
      return;
    }

    const id = this.lineData[row][this.itemConfig.lineConfig!.idProp!];
    if (!id) {
      console.warn('Skipped DELETE: Line item ID is missing or undefined for row', row);
      return;
    }
    this.restService.delete(this.itemConfig.lineConfig!.api + '(' + id + ')').subscribe(() => {
      let lineRows = this.items.controls as FormGroup[];
      if (lineRows.length > 1) {
        const data = lineRows[row].value;
        lineRows.splice(row, 1);
        this.lineData.splice(row, 1);
        this.items.updateValueAndValidity();
      }
    }, error => {
      this.toastr.error('Failed to delete line');
    });
  }

  changeHeaderControl(data: ControlDataModel) {
    this.changeEvent.emit({
      control: data.control,
      data: data.data,
      dropdownData: data.dropdownData,
      dropdownItems: data.dropdownItems,
      activeData: this.headerData,
      section: SectionType.Header,
      headerData: this.headerData
    });
  }

  onPopupFirstInteraction(event: MouseEvent) {
    const target = event.target as Node | null;
    if (!target || !this.shouldCreateDraftFromInteraction(target)) {
      return;
    }

    this.ensureAutoGeneratedDraftOnFirstInteraction();
  }

  private shouldCreateDraftFromInteraction(target: Node): boolean {
    if (!(target instanceof HTMLElement)) {
      return false;
    }

    return !target.closest(
      'button, .btn-round, .btn-delete, .btn-refresh, .btn-edit, .btn-nonedit, .btn-use-created, .icon-btn, .action-btn, .popup-action-buttons, [data-skip-auto-generate="true"]'
    );
  }

  private ensureAutoGeneratedDraftOnFirstInteraction() {
    if (!this.pendingAutoGenerateOnFirstInteraction) {
      return;
    }

    const idProp = this.itemConfig?.headerConfig?.idProp;
    if (idProp && this.headerData?.[idProp]) {
      this.pendingAutoGenerateOnFirstInteraction = false;
      return;
    }

    this.pendingAutoGenerateOnFirstInteraction = false;
    this.addHeaderData(true);
  }



  // === UPDATED WITH AUTO-SAVE DEBOUNCE + SAFE GUARD ===
  // leaveHeaderControl(data: ControlDataModel, control: FormField) {
  //   // ✅ Prevent save when value hasn't truly changed
  //   if (this.suspendHeaderAutoSave) {
  //     return;
  //   }

  //   // const oldValue = this.headerData[data.control];
  //   // const newValue = data.data;
  //   const oldValue = this.normalizeDate(this.headerData[data.control]);
  //   const newValue = this.normalizeDate(data.data);
  //   const hasChanged =
  //     newValue !== null &&
  //     newValue !== undefined &&
  //     newValue !== '' &&
  //     oldValue !== newValue;
  //   if (this.itemConfig.autoSave && hasChanged) {
  //     if (data.readonly) {
  //       this.headerData[data.control] = newValue;
  //     } else {
  //       this.saveHeaderData(newValue, control);
  //     }

  //     // 🕓 NEW: Push changes to pending header buffer
  //     this.headerPendingChanges[data.control] = newValue;
  //     // Schedule a debounced save
  //     this.scheduleHeaderSave();
  //   }



  //   this.leaveEvent.emit({
  //     control: control.label!,
  //     data: this.headerFormGroup.value,
  //     valid: this.headerFormGroup.valid,
  //     section: SectionType.Header,
  //     headerData: this.headerData,
  //   });
  // }

  leaveHeaderControl(data: ControlDataModel, control: FormField) {

    if (this.suspendHeaderAutoSave) return;

    const oldValue = this.normalizeDate(this.headerData[data.control]);
    const newValue = this.normalizeDate(data.data);

    const hasChanged = oldValue !== newValue;

    const autoSave = control.autoSave !== false;

    if (this.itemConfig.autoSave && autoSave && hasChanged) {

      if (data.readonly) {
        this.headerData[data.control] = newValue;
      } else {
        this.saveHeaderData(newValue, control);
      }
    }

    this.leaveEvent.emit({
      control: control.label!,
      data: this.headerFormGroup.value,
      valid: this.headerFormGroup.valid,
      section: SectionType.Header,
      headerData: this.headerData,
    });
  }




  onClearDropdown(data: ControlDataModel) {
    if (this.itemConfig.autoSave) {
      this.saving = true;
      const showEditButtonStatus = this.showEditButton;
      this.showEditButton = false;
      let patchData = {
        [data.control]: data.data,
        // UserId: this.sessionService.UserId  //TYM/Subhankar/22.01.26//Raju unnecessary code by confirm Sir
      };
      const ifMatchKey = "*"; // this.headerData["@odata.etag"];
      this.restService.patch(this.itemConfig.headerConfig!.api + '(' + this.headerData[this.itemConfig.headerConfig!.idProp!] + ')', patchData, ifMatchKey).subscribe((response: any) => {
        this.headerData = response;
        this.saving = false;
        this.showEditButton = showEditButtonStatus;
        this.updateViewModeEnableControls();
        this.cdr.detectChanges();
      }, (error) => {
        this.saving = false;
        this.showEditButton = showEditButtonStatus;
        this.cdr.detectChanges();
      });
    }
  }

  changeLineControl(data: ControlDataModel, rowIndex: number) {

    // 🚀 SAFE CHECK (null-safe)
    const fieldConfig = this.itemConfig?.lineConfig?.controls
      ?.find((c: any) => c.label === data.control);

    // If config says this field is systemUpdate → ignore this event
    if (fieldConfig?.systemUpdate === true) {
      return;
    }

    // --- your existing logic ---
    let lineData = JSON.parse(JSON.stringify(this.lineData));
    lineData[rowIndex][data.control] = data.data;

    this.changeEvent.emit({
      control: data.control,
      data: data.data,
      dropdownData: data.dropdownData,
      dropdownItems: data.dropdownItems,
      activeData: lineData[rowIndex],
      section: SectionType.Line,
      rowIndex: rowIndex,
      linesData: lineData,
      headerData: this.headerData
    });

    this.dropdownOpend.emit({
      control: data.control,
      data: data.data,
      dropdownData: data.dropdownData,
      dropdownItems: data.dropdownItems,
      activeData: lineData[rowIndex],
      section: SectionType.Line,
      rowIndex: rowIndex,
      linesData: lineData,
      headerData: this.headerData
    });

    // if (!this.isDrawerOpen) {
    //   this.ensureTrailingEmptyLines(this.itemConfig.lineConfig?.defaultLines ?? 2);
    // }
  }



  leaveLineControl(data: ControlDataModel, control: FormField, row: number) {
    const itemGroup = this.items.controls[row] as FormGroup;

    // ===============================
    // 🔹 DIRECT API MODE
    // ===============================
    if (this.itemConfig.lineConfig?.isDirectApi === true) {

      const record = this.lineData[row];
      const formGroup = this.items.at(row) as FormGroup;

      const requiredControls: string[] =
        (this.itemConfig.lineConfig.controls || [])
          .filter(c => c.required && !!c.label)
          .map(c => c.label as string);

      const allRequiredFilled = requiredControls.every(label => {
        const ctrl = formGroup.get(label);
        const v = ctrl?.value;
        return v !== null && v !== undefined && v !== "";
      });

      // 🔹 CREATE
      if (!record[this.itemConfig.lineConfig.idProp!]) {

        if (!allRequiredFilled) return;

        const newLine = { ...formGroup.value };

        const payload: any = {};
        Object.keys(newLine).forEach(k => {
          let val = newLine[k];

          const cfg = this.itemConfig?.lineConfig?.controls?.find(c => c.label === k);
          if (cfg?.type === FormFieldType.Number && val !== "" && val !== null) {
            val = Number(val);
          }

          if (val !== null && val !== undefined && val !== "") {
            payload[k] = val;
          }
        });

        this.addLineItemRecord(payload, row);
      }
      // 🔹 UPDATE
      else {

        let patchData: any = {
          [control.label!]: data.data
        };

        patchData = this.utility.getLineControlsData(
          patchData,
          this.itemConfig.lineConfig.controls!
        );

        this.updateLineItemRecord(record, patchData, row);
      }

      this.leaveEvent.emit({
        control: control.label!,
        data: data.data,
        activeData: this.items.value[row],
        linesData: this.items.value,
        valid: this.items.valid,
        section: SectionType.Line,
        headerData: this.headerData,
        rowIndex: row,
      });

      return;
    }

    // ===============================
    // 🔹 NORMAL ENGINE MODE
    // ===============================

    const autoSave = control.autoSave !== false;

    if (this.itemConfig.autoSave && autoSave
      && (!this.viewMode ||
        (this.viewMode && this.viewModeEnableControls.includes("Line_" + control.label)))) {

      if (itemGroup.valid || itemGroup.status === 'DISABLED') {

        let record = this.lineData[row];

        if (record[control.label!] !== data.data) {

          // Set FK if needed
          if (this.itemConfig.lineConfig!.lineFKProp &&
            this.itemConfig.lineConfig!.headerPKProp) {
            record[this.itemConfig.lineConfig!.lineFKProp] =
              this.headerData[this.itemConfig.lineConfig!.headerPKProp];
          }

          // 🔹 UPDATE
          if (record[this.itemConfig.lineConfig!.idProp!]) {

            let patchData = {
              [control.label!]: data.data
            };

            patchData = this.utility.getLineControlsData(
              patchData,
              this.itemConfig.lineConfig!.controls!
            );

            this.updateLineItemRecord(record, patchData, row);
          }
          // 🔹 CREATE
          else if (!this.justCalledPostApi) {

            record[control.label!] = data.data;

            this.itemConfig.lineConfig!.controls!.forEach((c: FormField) => {
              if (c.initialValue) {
                record[c.label!] = c.initialValue;
              }
            });

            record = this.utility.getLineControlsData(
              record,
              this.itemConfig.lineConfig!.controls!
            );

            this.justCalledPostApi = true;
            this.addLineItemRecord(record, row);
          }
          // 🔹 QUEUE UNTIL CREATED
          else {
            if (this.pendingPatchData) {
              this.pendingPatchData[control.label!] = data.data;
            } else {
              this.pendingPatchData = {
                [control.label!]: data.data
              };
            }
          }
        }
      }
      else {
        this.utility.patchObject(
          this.lineData[row],
          this.utility.getLineControlsData(
            itemGroup.value,
            this.itemConfig.lineConfig!.controls!
          )
        );
        this.lineData[row][control.label!] = data.data;
      }
    }
    else {
      // 🔹 AUTOSAVE OFF → only update local model
      this.utility.patchObject(
        this.lineData[row],
        this.utility.getLineControlsData(
          itemGroup.value,
          this.itemConfig.lineConfig!.controls!
        )
      );
      this.lineData[row][control.label!] = data.data;
    }

    this.leaveEvent.emit({
      control: control.label!,
      data: data.data,
      activeData: this.items.value[row],
      linesData: this.items.value,
      valid: this.items.valid,
      section: SectionType.Line,
      headerData: this.headerData,
      rowIndex: row,
    });
  }



  changeLineCalculationControl(data: ControlDataModel) {
    // 🧠 Prevent redundant recalculations when value didn't actually change
    const oldValue = this.headerFormGroup.get(data.control)?.value;
    const newValue = data.data;

    if (
      newValue !== null &&
      newValue !== undefined &&
      newValue !== '' &&
      oldValue !== newValue
    ) {
      this.changeEvent.emit({
        control: data.control,
        data: newValue,
        dropdownData: data.dropdownData,
        dropdownItems: data.dropdownItems,
        section: SectionType.Calculation,
        headerData: this.headerData
      });
    }
  }

  leaveCalculationControl() {
    // ✅ Normal emit (no issue here)
    this.leaveEvent.emit({
      data: this.headerFormGroup.value,
      valid: this.headerFormGroup.valid,
      section: SectionType.Calculation
    });
  }


  addHeaderData(suppressCloseAfterCreate: boolean = false) {
    this.saving = true;
    for (let i = 0; i < this.itemConfig.headerConfig!.controls!.length; i++) {
      const column: FormField[] = this.itemConfig.headerConfig!.controls![i];
      for (let j = 0; j < column.length; j++) {
        const control: FormField = column[j];
        if (control.type === FormFieldType.DateTime && control.defaultSystemDate) {
          this.headerData[control.label!] = this.utility.convertStringToDateObj(this.datepipe.transform(new Date(), 'yyyy-MM-dd')!);
        }
      }
    }
    let payload = this.utility.getHeaderControlsData(this.headerData, this.itemConfig.headerConfig!.controls!);
    this.restService.post(this.itemConfig.headerConfig!.api!, payload).subscribe((response: any) => {
      let result = this.utility.copyObj(response);
      this.popupAddNewPostResponse.emit(response);

      if (this.closeAfterCreate && !suppressCloseAfterCreate) {
        this.saving = false;
        this.activeModal.close({
          action: 'Create',
          record: result
        });
        return;
      }

      for (let i = 0; i < this.itemConfig.headerConfig!.controls!.length; i++) {
        const column: FormField[] = this.itemConfig.headerConfig!.controls![i];
        for (let j = 0; j < column.length; j++) {
          const control: FormField = column[j];
          if (control.type === FormFieldType.DateTime && result[control.label!]) {
            result[control.label!] = this.utility.convertStringToDateObj(result[control.label!]);
          }
        }
      }
      this.headerFormGroup.patchValue(result);
      this.headerData = result;
      this.documentData = result;
      this.headerReady = true;
      this.saving = false;
      this.cdr.detectChanges();

      if (this.itemConfig.headerConfig!.id === 'copy' && this.showLineSection) {
        this.id = this.copyHeaderPKProp;
        this.getLineData();
      }
    }, (error) => {
      this.saving = false;
      this.cdr.detectChanges();
    });
  }

  saveHeaderData(data: string, control: FormField) {
    if (this.headerFormGroup.valid && (this.headerData[control.label!] !== data || (data !== '' && data !== undefined && data !== null))) {
      let record = this.headerData;

      if (record[this.itemConfig.headerConfig!.idProp!]) {
        this.saving = true;
        const showEditButtonStatus = this.showEditButton;
        this.showEditButton = false;

        // Capture the old form value NOW, before the PATCH overwrites anything.
        // This is the value displayed in the UI before the user's edit.
        // We read it from headerData; if it was a falsy value ("", 0) that
        // setHeaderControlsData deleted, fall back to null so the field reverts to empty.
        const oldFieldValue = this.headerData.hasOwnProperty(control.label!)
          ? this.headerData[control.label!]
          : null;

        let patchData = {
          [control.label!]: data,
          ...(this.itemConfig.headerConfig?.patchUserId && {})
        };

        patchData = this.utility.getHeaderControlsData(
          patchData,
          this.itemConfig.headerConfig!.controls!
        );

        this.restService.patch(
          this.itemConfig.headerConfig!.api! + '(' + this.headerData[this.itemConfig.headerConfig!.idProp!] + ')',
          patchData,
          '*'
        ).subscribe((response: any) => {
          this.headerData = response;
          this.applyServerHeaderResponse(response);
          this.saving = false;
          this.showEditButton = showEditButtonStatus;
          this.updateViewModeEnableControls();
          this.cdr.detectChanges();
          this.addItemService.headerSaveResponse$.next(this.headerData);
        }, () => {
          // Revert the specific field the user edited back to its pre-edit value.
          // applyServerHeaderResponse alone cannot handle falsy values ("", 0)
          // because setHeaderControlsData deletes them from headerData.
          this.headerFormGroup.get(control.label!)?.setValue(oldFieldValue);
          this.applyServerHeaderResponse(this.headerData); // revert any other server-side field changes
          this.saving = false;
          this.showEditButton = showEditButtonStatus;
          this.cdr.detectChanges();
        });
      } else {
        record = this.headerFormGroup.value;
        record[control.label!] = data;
        record = this.utility.getHeaderControlsData(record, this.itemConfig.headerConfig!.controls!);
        this.saving = true;
        this.showEditButton = false;
        this.cdr.detectChanges();

        this.restService.post(this.itemConfig.headerConfig!.api!, record).subscribe((response: any) => {
          this.headerData = response;
          this.applyServerHeaderResponse(response);
          this.saving = false;
          this.showEditButton = true;
          this.cdr.detectChanges();
        }, () => {
          this.saving = false;
          this.showEditButton = true;
          this.cdr.detectChanges();
        });
      }
    } else {
      if (this.headerData[this.itemConfig.headerConfig!.idProp!]) {
        this.headerData[control.label!] = data;
      } else {
        this.headerData = this.headerFormGroup.value;
        this.headerData[control.label!] = data;
      }
    }
  }

  addLineItemRecord(item: any, row: number) {
    //TMY Subhankar/03.12.2025/ For isDirectApi
    if (this.itemConfig.lineConfig?.isDirectApi === true) {
      this.saving = true;
      this.showEditButton = false;
      this.cdr.detectChanges();
      this.restService.post(this.itemConfig.lineConfig.api!, item).subscribe({
        next: (response: any) => {

          const sysId =
            response?.["systemId"] ??
            response?.["Id"] ??
            response?.["id"] ??
            response?.["SystemId"] ??
            null;
          this.lineData[row] = response;
          this.lineData[row]["systemId"] = sysId;
          if (this.itemConfig?.lineConfig?.removeUnicodeCharFields?.length) {
            this.removeLineUnicodeChars(this.lineData[row]);
          }
          this.saving = false;
          this.showEditButton = true;
          this.justCalledPostApi = false;

          if (this.pendingNewLineIndex === row) {
            this.pendingNewLineIndex = null;
          }

          if (this.pendingPatchData) {
            this.addItemService.callPatchApi$.next(row);
          }
          this.cdr.detectChanges();
        }
      });

      return;
    }
    //TMY Subhankar/03.12.2025/ For isDirectApi end

    this.saving = true;
    this.showEditButton = false;
    this.cdr.detectChanges();
    let api = this.itemConfig.lineConfig!.api!;
    if (this.itemConfig.lineConfig!.includeHeaderId) {
      api = '/' + this.itemConfig.headerConfig!.api + '(' + this.headerData[this.itemConfig.headerConfig!.idProp!] + ')' + api;
    }
    // item.UserId = this.sessionService.UserId;
    // item.Company = this.sessionService.CompanyName;
    // item.CompanyId = this.sessionService.Company;
    // item.PortalResponsibilityCentre = this.sessionService.ResponsibilityCenterId;

    //   line common fields came from header data //confirm by Sir 
    item.UserId = this.headerData.UserId;
    item.Company = this.headerData.Company;
    item.CompanyId = this.headerData.CompanyId;
    item.PortalResponsibilityCentre = this.headerData.ResponsibilityCenterId;
    this.restService.post(api, item).subscribe((response: any) => {
      this.lineData[row] = response;
      this.applyServerLineResponse(response, row);
      this.saving = false;
      this.showEditButton = true;
      this.justCalledPostApi = false;

      if (this.pendingNewLineIndex === row) {
        this.pendingNewLineIndex = null;
      }

      if (this.pendingPatchData) {
        this.addItemService.callPatchApi$.next(row);
      }
      this.cdr.detectChanges();
    }, (error) => {
      this.saving = false;
      this.showEditButton = true;
      this.cdr.detectChanges();
    });
  }

  updateLineItemRecord(record: any, patchData: any, row: number, disableControls: boolean = true) {
    if (this.itemConfig.lineConfig?.isDirectApi) {
      if (!record) return;

      const idProp = this.itemConfig.lineConfig.idProp!;
      const id = record[idProp];

      if (!id || id === 'undefined' || id === null || id === '') {
        console.warn('FINAL GUARD: Skipped PATCH: Line item ID is missing or invalid for row', row, record);
        return;
      }

      if (this.lineSavingRows.has(row)) {
        console.warn('Blocked overlapping PATCH: Save already in progress for row', row);
        return;
      }

      const api = `${this.itemConfig.lineConfig.api}(${id})`;
      this.lineSavingRows.add(row);
      this.saving = disableControls;
      this.showEditButton = false;

      const finalPatch = {
        ...patchData,
      };

      this.restService.patch(api, finalPatch, '*').subscribe({
        next: (response: any) => {
          this.lineData[row] = response;

          if (this.itemConfig.lineConfig!.apiPatchProperties?.length) {
            const lineForm = this.items.controls as FormGroup[];
            this.itemConfig.lineConfig!.apiPatchProperties.forEach((prop: string) => {
              this.lineData[row][prop] = response[prop];
              if (this.itemConfig?.lineConfig?.removeUnicodeCharFields?.length) {
                this.removeLineUnicodeChars(this.lineData[row]);
              }
              lineForm[row].get(prop)?.patchValue(response[prop]);
            });
          }

          delete this.lineErrors[row];
          this.lineErrors = { ...this.lineErrors };
          this.showEditButton = true;
          this.saving = false;
          this.pendingPatchData = null;
          this.lineSavingRows.delete(row);
          this.applyPendingRevert(row);
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          const raw = err?.error?.message || err?.message || 'Save failed. Please correct the value and try again.';
          this.lineErrors = { ...this.lineErrors, [row]: raw.split('CorrelationId')[0].trim() };
          this.applyServerLineResponse(this.lineData[row], row); // revert form to last good server value
          this.saving = false;
          this.showEditButton = true;
          this.lineSavingRows.delete(row);
          this.applyPendingRevert(row);
          this.cdr.detectChanges();
        }
      });
      return;
    }

    if (record[this.itemConfig.lineConfig!.idProp!] && !this.utility.compareObjects(record, patchData)) {
      const id = record[this.itemConfig.lineConfig!.idProp!];

      if (!id || id === 'undefined' || id === null || id === '') {
        console.warn('FINAL GUARD: Skipped PATCH: Line item ID is missing or invalid for row', row, record);
        return;
      }

      if (this.lineSavingRows.has(row)) {
        console.warn('Blocked overlapping PATCH: Save already in progress for row', row);
        return;
      }

      const query = '(' + id + ')';
      this.lineSavingRows.add(row);
      this.saving = disableControls;
      this.showEditButton = false;

      this.restService.patch(this.itemConfig.lineConfig!.api + query, patchData, '*').subscribe((response: any) => {
        this.lineData[row] = response;
        this.applyServerLineResponse(response, row);

        if (this.itemConfig.lineConfig!.apiPatchProperties && this.itemConfig.lineConfig!.apiPatchProperties.length > 0) {
          let lines = this.items.controls as FormGroup[];
          this.itemConfig.lineConfig!.apiPatchProperties.forEach((prop: string) => {
            this.lineData[row][prop] = response[prop];
            lines[row].get(prop)!.patchValue(response[prop]);
          });
        }

        delete this.lineErrors[row];
        this.lineErrors = { ...this.lineErrors };
        this.showEditButton = true;
        this.saving = false;
        this.pendingPatchData = null;
        this.lineSavingRows.delete(row);
        this.applyPendingRevert(row);
        this.cdr.detectChanges();
      }, (err: any) => {
        const raw = err?.error?.message || err?.message || 'Save failed. Please correct the value and try again.';
        this.lineErrors = { ...this.lineErrors, [row]: raw.split('CorrelationId')[0].trim() };
        this.applyServerLineResponse(this.lineData[row], row); // revert form to last good server value
        this.saving = false;
        this.showEditButton = true;
        this.lineSavingRows.delete(row);
        this.applyPendingRevert(row);
        this.cdr.detectChanges();
      });
    }
  }

  private applyPendingRevert(row: number): void {
    if (!this.pendingReverts.has(row)) return;
    const data = this.pendingReverts.get(row);
    this.pendingReverts.delete(row);
    this.addItemService.patchLineData$.next({ rowIndex: row, data, disableControls: false });
  }

  changeViewMode() {
    this.viewMode = !this.viewMode;
  }

  // refreshData() {
  //   this.headerReady = false;
  //   this.lineReady = false;
  //   this.headerData = {};
  //   this.getHeaderData(this.headerFilter);
  //   this.getLineData();
  // }
  refreshData() {
    const idProp = this.itemConfig.headerConfig?.idProp;
    const id = idProp ? this.headerData?.[idProp] : null;

    if (!id) {
      return;
    }

    // Do NOT reset headerReady/lineReady — that would show the skeleton loader.
    // The popup already has data visible; just show the spinner overlay while reloading.
    this.addItemService.showLoader$.next(true);
    this.getHeaderData(`(${id})`, true); // skipPopupLoaded=true: refresh only, don't re-trigger parent's popupLoaded handler
  }

  async deleteRecord() {
    const confirmed = await this.dialogService.confirmDelete({
      message: 'Are you sure you want to delete this record? This action cannot be undone.'
    });

    if (!confirmed) {
      return;
    }

    const currentRecordId = this.headerData?.[this.itemConfig.headerConfig!.idProp!];

    if (!currentRecordId) {
      return;
    }

    this.restService.delete(this.itemConfig.headerConfig!.api + '(' + currentRecordId + ')').subscribe(() => {
      const fileUrl = this.headerData[this.fileUrlProp!];
      if (fileUrl && this.fileDeleteApi) {
        this.restService.delete(this.fileDeleteApi + '/' + fileUrl).subscribe(() => {
        });
      }

      this.activeModal.close({
        action: 'Delete',
        record: null
      });
    });
  }

  reset() {
  }

  selectAll() {
    this.checkLineAll = !this.checkLineAll;
    this.selectedLines = [];
    if (this.checkLineAll) {
      const lineData = this.items.value;
      lineData.forEach((ele: any, index: number) => {
        this.selectedLines.push(index);
      });
    }
    this.selectedItemService.setSelectedLines(this.selectedLines);
  }



  //TMY/ subhankar/20.08.25/ new selection
  selectLineItem(index: number) {
    if (this.selectedLines.includes(index)) {
      this.selectedLines = this.selectedLines.filter(x => x !== index);
    } else {
      this.selectedLines.push(index);
    }
    const lineData = this.items.value;
    this.checkLineAll = this.selectedLines.length === lineData.length;
    this.selectedItemService.setSelectedLines(this.selectedLines);
  }

  unselectAllLineItem() {
    this.selectedLines = [];
    this.checkLineAll = false;
    this.selectedItemService.clearSelectedLines();
  }

  addLineItem() {
    const data = this.getLineInitialData();

    this.lineData.push(data);
    this.createItemFormGroup(data, false);

    const newIndex = this.lineData.length - 1;

    this.lastNewRowIndex = newIndex;

    this.addLineEvent.emit({
      data,
      rowIndex: newIndex
    });

    // ✅ ONLY open drawer if page explicitly allows it
    if (this.itemConfig?.lineConfig?.showLinePopup === true) {
      this.pendingNewLineIndex = newIndex;
      setTimeout(() => {
        this.openDrawer(newIndex, this.getLineFormGroup(newIndex).value);
      }, 0);
    }
  }

  //tmy/amit/23.06.2023/multiple delete

  deleteLinesOld() {
    if (this.selectedLines.length === 0) {
      this.toastr.warning('Select line(s) to delete!');
      return;
    }

    this.addItemService.showLoader$.next(true);
    const sortedIndexes = [...this.selectedLines].sort((a, b) => b - a);
    let deleteCount = 0;
    let processed = 0;

    sortedIndexes.forEach((index) => {
      const lineData = this.lineData[index];
      const idProp = this.itemConfig.lineConfig!.idProp!;
      const recordId = lineData[idProp];

      const finishCheck = () => {
        processed++;
        if (processed === sortedIndexes.length) {
          // ✅ stop loader FIRST
          this.addItemService.showLoader$.next(false);
          this.lazyloading = false;

          if (deleteCount > 0) {
            this.toastr.success('Record(s) deleted successfully.');
          }

          this.unselectAllLineItem();

          // 🧠 wait for DOM to settle before reloading
          setTimeout(() => {
            this.getLineData(); // safe refresh
          }, 150);
        }
      };

      if (recordId) {
        this.restService.delete(`${this.itemConfig.lineConfig!.api}(${recordId})`).subscribe({
          next: () => {
            this.lineData = this.lineData.filter(x => x[idProp] !== recordId);
            (this.items.controls as FormGroup[]).splice(index, 1);
            this.items.updateValueAndValidity();
            this.cdr.detectChanges();
            deleteCount++;
          },
          error: () => {
            this.toastr.error(`Failed to delete record ${recordId}.`);
          },
          complete: finishCheck
        });
      } else {
        console.warn('Skipped DELETE: Line item ID is missing or undefined for index', index);
        (this.items.controls as FormGroup[]).splice(index, 1);
        this.lineData.splice(index, 1);
        this.items.updateValueAndValidity();
        this.cdr.detectChanges();
        deleteCount++;
        finishCheck();
      }
    });
  }


  async deleteLines() {
    if (this.selectedLines.length === 0) {
      this.toastr.warning('Select line(s) to delete!');
      return;
    }

    if (this.itemConfig?.validateOnLineDelete) {
      const selectedLineData = this.selectedLines.map((i: number) => this.lineData[i]).filter(Boolean);
      const result = await this.itemConfig.validateOnLineDelete(selectedLineData);
      if (!result.allowed) {
        this.dialogService.showAlert('custom', { title: 'Cannot Delete', text: result.message || 'One or more selected lines cannot be deleted.' });
        return;
      }
    }

    const confirmed = await this.dialogService.confirmDelete({
      message: `Delete ${this.selectedLines.length} selected line(s)? This action cannot be undone.`
    });

    if (!confirmed) {
      return;
    }

    this.addItemService.showLoader$.next(true);

    const sortedIndexes = [...this.selectedLines].sort((a, b) => b - a);
    const idProp = this.itemConfig.lineConfig!.idProp!;
    let deleteCount = 0;

    const awaitDelete = (obs: Observable<any>) =>
      new Promise(resolve =>
        obs.subscribe(
          () => resolve(null),
          () => resolve(null),
          () => resolve(null)
        )
      );

    for (const index of sortedIndexes) {
      const lineData = this.lineData[index];
      const recordId = lineData[idProp];

      if (recordId) {
        // WAIT for server delete to finish
        await awaitDelete(
          this.restService.delete(`${this.itemConfig.lineConfig!.api}(${recordId})`)
        );

        // Remove locally
        this.lineData = this.lineData.filter(x => x[idProp] !== recordId);
        (this.items.controls as FormGroup[]).splice(index, 1);

        this.items.updateValueAndValidity();
        this.cdr.detectChanges();
        deleteCount++;

      } else {
        // Local delete only
        console.warn('Skipped DELETE: Line item ID is missing or undefined for index', index);
        (this.items.controls as FormGroup[]).splice(index, 1);
        this.lineData.splice(index, 1);
        this.items.updateValueAndValidity();
        this.cdr.detectChanges();
        deleteCount++;
      }
    }

    // All deletes done
    this.addItemService.showLoader$.next(false);
    this.lazyloading = false;

    if (deleteCount > 0) {
      this.toastr.success('Record(s) deleted successfully.');
    }

    this.unselectAllLineItem();

    setTimeout(() => {
      this.getLineData();
    }, 150);
  }



  //tmy/amit/23.06.2023/multiple delete end

  customButtonClick(button: CustomButton, section: string, rowIndex: number = -1) {
    this.buttonClickEvent.emit({
      button: button,
      data: section === 'header' ? this.headerData : this.lineData[rowIndex],
      section: section === 'header' ? SectionType.Header : SectionType.Line,
      headerData: this.headerData,
      lineData: this.lineData
    });

  }


  customButtonResponse(data: any) {
    if (!data) return;
    const idProp = this.itemConfig.headerConfig?.idProp;
    if (!idProp) return;

    const id = this.headerData[idProp];
    if (!id) return;

    const filter = `(${id})`;
    const url = this.itemConfig.headerConfig!.api + filter;
    this.addItemService.showLoader$.next(true);
    setTimeout(() => {
      this.restService.get(url).subscribe({
        next: (response: any) => {
          this.headerData = this.removeUnicodeChars(response);
          this.applyServerHeaderResponse(this.headerData);
          // this.lineData.forEach((_, index) => {
          //   this.applyServerLineResponse(this.lineData[index], index);
          // });
          this.addItemService.popupRefreshLineData$.next(id);
        },
        error: (err) => {
          console.error('Header reload failed', err);
        },
        complete: () => {
          this.addItemService.showLoader$.next(false);
        }
      });
    }, 100)
  }




  customMenuClick(button: CustomButton, section: string, rowIndex: number = -1) {
    this.buttonClickEvent.emit({
      button: button,
      data: section === 'header' ? this.headerData : this.lineData[rowIndex],
      section: section === 'header' ? SectionType.Header : SectionType.Line,
      headerData: this.headerData,
      lineData: this.lineData
    });
  }

  closePopup() {
    this.resetSelectedRowIndex();
    if (this.headerData[this.itemConfig.headerConfig!.idProp!]) {
      let headerData = this.utility.getHeaderControlsData(this.headerData, this.itemConfig.headerConfig!.controls!);
      headerData = this.removeUnicodeChars(headerData);
      this.activeModal.close({
        action: 'Update',
        record: headerData
      });
    } else if (this.itemConfig.getPopupCloseResponse) {
      this.customSharedService.closeApproval$
        .pipe(take(1))
        .subscribe((allowed: boolean) => {
          if (allowed) {
            this.activeModal.close({ action: 'close', record: true });
          }
        });
      this.customSharedService.requestPopupClose();
      return;
    } else {
      this.activeModal.close({
        action: 'close',
        record: null
      });
    }
  }

  get canUseCreatedRecord(): boolean {
    if (!this.closeAfterCreate || !this.itemConfig?.headerConfig?.idProp) {
      return false;
    }

    const idProp = this.itemConfig.headerConfig.idProp;
    return !!this.headerData?.[idProp];
  }

  useCreatedRecord(): void {
    if (!this.canUseCreatedRecord) {
      return;
    }

    let headerData = this.utility.getHeaderControlsData(this.headerData, this.itemConfig.headerConfig!.controls!);
    headerData = this.removeUnicodeChars(headerData);

    this.activeModal.close({
      action: 'Create',
      record: headerData
    });
  }

  exportLines() {
    const lineControlsData = this.utility.getLineControlsData(this.lineData, this.itemConfig.lineConfig!.controls!);
    let lineData: any[] = [];
    lineControlsData.forEach((data: any) => {
      let line: any = {};
      this.itemConfig.lineConfig!.controls!.forEach((control: FormField) => {
        line[control.label!] = data[control.label!];
      });
      lineData.push(line);
    });
    this.excelExportService.exportAsExcelFile(lineData, this.headerData[this.itemConfig.recordId!] + '_Lines');
  }

  openComments() {
    const modalRef = this.modal.open(DocumentCommentsPopupComponent, { size: 'md', windowClass: 'modal-dialog-scrollable', backdrop: 'static' });
    modalRef.componentInstance.title = this.itemConfig.title;
    modalRef.componentInstance.documentNo = this.headerData[this.itemConfig.lineConfig!.headerPKProp!];
    modalRef.componentInstance.documentType = this.itemConfig.headerConfig!.commentDocumentType;
  }
  openSubPopup() {
    const modalRef = this.modal.open(AddItemSubPopupComponent, { size: 'md', windowClass: 'modal-dialog-scrollable', backdrop: 'static' });
    modalRef.componentInstance.showCreate = false;
    modalRef.componentInstance.showDelete = false;
    modalRef.componentInstance.title = this.itemConfig.title;
    modalRef.componentInstance.documentNo = this.headerData[this.itemConfig.headerConfig?.idProp!];
    // modalRef.componentInstance.documentNo = this.headerData[this.itemConfig.lineConfig!.headerPKProp!];
    modalRef.componentInstance.documentType = this.itemConfig.headerConfig!.commentDocumentType;
    modalRef.componentInstance.headerData = this.itemConfig;
  }

  ngOnDestroy() {
    this.resetSelectedRowIndex();
    this.callPatchApiSubscription?.unsubscribe();
    this.enableOrDisableAllControlsSubscription?.unsubscribe();
    this.disableAllControlsExceptSomeSubscription?.unsubscribe();
    this.patchLineDataSubscription?.unsubscribe();
    this.showLoaderSubscription?.unsubscribe();
    this.dropdownApiLoaderSubscription?.unsubscribe();
    this.popupRefreshLineDataSubscription?.unsubscribe();
    this.popupUncheckLineDataSubscription?.unsubscribe();
    this.updateLineControlDataSubscription?.unsubscribe();
    this.updateLineMultipleControlsDataSubscription?.unsubscribe();
    this.disableLineControlSubscription?.unsubscribe();
    this.closePopupSubscription?.unsubscribe();
    this.refreshDataSubscription?.unsubscribe();
    this.cdr?.detach();
    this.refreshDrawerSubpopupDataSubscription?.unsubscribe();
    this.drawerLockSubscription?.unsubscribe();
    this.isDisableAddButtonLineSubscription?.unsubscribe();
    this.isDisableDeleteButtonLineSubscription?.unsubscribe();
    this.showOnSequentialButtonSubscription?.unsubscribe();
    this.showOnParallelButtonSubscription?.unsubscribe();
    this.addHeaderButtonsSubscription?.unsubscribe();
    this.addLineButtonsSubscription?.unsubscribe();
    this.isShowDimensionButtonSubscription?.unsubscribe();
    this.isShowDimensionInPopupSubscription?.unsubscribe();
    this.reloadHeaderByIdSub?.unsubscribe();
    this.suspendHeaderAutoSaveSubscription?.unsubscribe();
    this.forceLeaveHeaderControlSubscription?.unsubscribe();
    this.customButtonResponseSubscription?.unsubscribe();
    this.hideLineControlsListSubscription?.unsubscribe();
    this.getLineAttachmentSubscription?.unsubscribe();
  }

  toggleFirstSection() {
    this.firstSectionOpen = !this.firstSectionOpen;
  }



  toggleSection(index: number): void {
    this.sectionStates[index] = !this.sectionStates[index];
    if (this.dataTableService.popupTaggle[index]) {
      this.dataTableService.popupTaggle[index].open = this.sectionStates[index];
    }
  }

  showReturnedOnly: boolean = false;
  toggleReturnedOnly() {
    if (!this.showReturnedOnly && this.returnedCount === 0) {
      this.toastr.warning('No rejected line found!');
      return;
    }
    this.showReturnedOnly = !this.showReturnedOnly;

    this.page = 0;
    this.getLineData();
  }



  get returnedCount(): number {
    const statusField = this.itemConfig?.lineConfig?.statusField;
    if (!this.lineData || !statusField) {
      return 0;
    }
    const count = this.lineData.filter(x => !!x[statusField]).length;
    if (count > this.lastReturnedCount) {
      this.triggerBadgePulse();
    }
    this.lastReturnedCount = count;
    return count;
  }


  private triggerBadgePulse() {
    this.badgePulse = true;
    setTimeout(() => this.badgePulse = false, 1200); // must reset
  }




  ngAfterViewChecked() {
    const statusField = this.itemConfig?.lineConfig?.statusField;
    if (statusField && this.lineData) {
      this.lineData.forEach((line, index) => {
        const flagged = !!line[statusField];
        if (flagged && !this.flashRows.has(index)) {
          this.flashRows.add(index);
          this.triggerRowFlash(index);
        }
      });
    }
  }


  private triggerRowFlash(index: number) {
    const row = document.querySelectorAll('table.excel-table tbody tr')[index] as HTMLElement;
    if (row) {
      row.classList.add('flash');
      setTimeout(() => row.classList.remove('flash'), 1200);
    }
  }

  selectedIndex: number | null = null;
  isDrawerOpen: boolean = false;

  openDrawer(i: number, lineValues: any) {
    this.drawerOpen.emit(i);

    this.drawerLockSubscription?.unsubscribe();
    this.hideLineControlsListSubscription?.unsubscribe();

    const idProp = this.itemConfig.lineConfig!.idProp!;
    const api = this.itemConfig.lineConfig!.api;
    const id = this.lineData[i]?.[idProp];

    const controls: any = this.itemConfig?.lineConfig?.controls ?? [];

    this.hideLineControlsListSubscription =
      this.formDataService.hideLineControlsList$
        .subscribe((records: { label: string, rowIndex: number }[]) => {

          const controls = this.itemConfig?.lineConfig?.controls ?? [];

          records.forEach(record => {

            if (record.rowIndex === i) {

              const controlToHide = controls.find(
                (c: any) => c.label === record.label
              );

              if (controlToHide) {
                controlToHide.hidden = true;
              }

            }

          });

          this.cdr.detectChanges();
        });



    // 🔥 NEW LINE → DO NOT CALL GET
    if (!id) {
      this.createLineAndOpenDrawer(i);
      return;   // VERY IMPORTANT
    }

    // 🔥 EXISTING LINE → LOAD FROM BC
    this.restService.get(`${api}(${id})`).subscribe({
      next: (res: any) => {
        this.handleDrawerSuccess(i, res);
      }
    });

    this.refreshDrawerSubpopupDataSubscription?.unsubscribe();

    this.drawerLockSubscription = this.formDataService.disableDrawer$.subscribe((state: any) => {
      this.drawerLocked = !!state?.isDisabled && state.rowIndex === i;
      this.cdr.detectChanges();
    });

  }



  private handleDrawerSuccess(i: number, res: any) {

    const cleanedRes = this.removeUnicodeFromValue(res);
    this.lineData[i] = cleanedRes;

    const fg = this.items.at(i) as FormGroup;

    const uiData = this.utility.setLineControlsData(
      this.utility.copyObj(cleanedRes),
      this.itemConfig.lineConfig!.controls!
    );

    fg.patchValue(uiData);

    const controls = this.itemConfig?.lineConfig?.controls ?? [];

    controls.forEach(control => {
      if (control?.isNotVisiableSubPopup) {
        const c = fg.get(control.label!);
        if (c) {
          c.clearValidators();
          c.updateValueAndValidity({ emitEvent: false });
        }
      }
    });

    if (
      this.itemConfig.lineConfig?.lineFKProp &&
      this.itemConfig.lineConfig?.headerPKProp
    ) {
      fg.get(this.itemConfig.lineConfig.lineFKProp)?.setValue(
        this.headerData[this.itemConfig.lineConfig.headerPKProp]
      );
    }

    this.isDrawerOpen = true;
    this.selectedIndex = i;

    this.drawerLockSubscription =
      this.formDataService.disableDrawer$.subscribe((state: any) => {
        this.drawerLocked =
          !!state?.isDisabled && state.rowIndex === i;
        this.cdr.detectChanges();
      });

    this.drawerStateChange.emit({
      isOpen: true,
      index: i,
      fromValue: res
    });

    this.cdr.detectChanges();
  }

  private createLineAndOpenDrawer(i: number) {
    const fg = this.items.at(i) as FormGroup;

    // 🔥 SYNC lineData from FormArray BEFORE opening
    this.lineData[i] = {
      ...this.lineData[i],
      ...fg.value
    };

    this.isDrawerOpen = true;
    this.selectedIndex = i;

    this.drawerStateChange.emit({
      isOpen: true,
      index: i,
      fromValue: this.lineData[i]
    });

    this.cdr.detectChanges();
  }


  closeDrawer() {
    this.hideLineControlsListSubscription?.unsubscribe();
    const index = this.selectedIndex;
    const controls = this.itemConfig?.lineConfig?.controls ?? [];
    controls.forEach((c: any) => {
      c.hidden = false;
    });
    if (this.selectedIndex != null) {
      this.drawerClosed.emit(this.selectedIndex);
    }
    if (this.pendingNewLineIndex !== null) {
      this.items.removeAt(this.pendingNewLineIndex);
      this.lineData.splice(this.pendingNewLineIndex, 1);
      this.pendingNewLineIndex = null;
      this.lastNewRowIndex = null;
    } else if (this.lastNewRowIndex !== null) {
      const fg = this.getLineFormGroup(this.lastNewRowIndex);

      const isEmpty = Object.values(fg.value).every(
        value => value === null || value === '' || value === false
      );

      if (isEmpty) {
        this.items.removeAt(this.lastNewRowIndex);
        this.lineData.splice(this.lastNewRowIndex, 1);
      }

      this.lastNewRowIndex = null;
    }

    this.isDrawerOpen = false;

    this.drawerStateChange.emit({
      isOpen: false,
      index,
      fromValue: index !== null ? this.lineData[index] : null
    });
  }

  get hasAttachmentControl(): boolean {
    return this.itemConfig?.lineConfig?.controls?.some(
      (c: any) => c?.type == 11
    ) ?? false;
  }


  isExceededAmount(lineNo: any): boolean {
    if (!this.exceededLines || !Array.isArray(this.exceededLines)) return false;
    return this.exceededLines.some(x => x?.toString() === lineNo?.toString());
  }

  hasExceededLines(): boolean {
    return Array.isArray(this.exceededLines) && this.exceededLines.length > 0;
  }


  openSubPopupForWorkflow(approvalType: string, i: number) {
    if (!this.lineData || !this.lineData[i]) {
      this.toastr.warning('No line data found for this row');
      return;
    }

    const line = this.lineData[i];
    const code = line?.codeNo;
    const lineSystemId = line?.systemId;
    const stepsLineNo = line?.lineNo;

    if (!code) {
      this.toastr.warning('Missing Code No for selected line');
      return;
    }

    if (!line.workflowUserID && !lineSystemId) {
      this.toastr.warning('Missing workflowUserID for selected line');
      return;
    }
    const modalRef = this.modal.open(ApprovalSetupAddItemSubPopupComponent, {
      size: 'xl',
      windowClass: 'modal-dialog-scrollable',
      backdrop: 'static',
    });

    modalRef.componentInstance.popupLoaded.subscribe((data: any) => {
      this.popupLoaded.emit(data);
    });

    modalRef.componentInstance.changeEvent.subscribe((event: EventDataModel) => {
      this.changeEvent.emit(event);
    });

    modalRef.componentInstance.currentRowIndex = i;
    modalRef.componentInstance.itemConfig = this.itemConfig;
    modalRef.componentInstance.headerFilter = this.headerFilter;
    modalRef.componentInstance.lineId = lineSystemId;
    modalRef.componentInstance.stepsLineNo = stepsLineNo;
    const payload = {
      codeNo: line.codeNo,
      approvalType,
      documentType: line.documentType,
      workflowUserID: line.workflowUserID,
      initiatorType: line.initiatorType,
    };
    this.selectedItemService.popupData = payload;

    this.selectedItemService.setSubPopupFKPropLines(line.workflowUserID);
    const checkApi = `/workflowLines?$filter=codeNo eq '${code}' and workflowUserID eq '${line.workflowUserID}' and approvalType eq '${approvalType}' and stepsLineNo eq ${stepsLineNo}`;

    this.restService.get(checkApi).subscribe({
      next: (checkRes: any) => {
        const existing = checkRes?.value || [];
        if (existing.length > 0) {
          return;
        }
        this.upDateLineDataForApprovalType(approvalType, i);
      },
      error: () => {
        this.toastr.error('Failed to check existing workflow lines');
      },
    });
    modalRef.result.finally(() => {
      modalRef.componentInstance.currentRowIndex = null;
      this.disableSequential = this.disableSequential.map(() => false);
      this.disableParallel = this.disableParallel.map(() => false);
    });
  }

  upDateLineDataForApprovalType(approvalType: string, i: number) {
    const selectedLine = this.lineData[i];
    let url = this.itemConfig.lineConfig?.api;
    if (!selectedLine) return;
    const getApi = `${url}?$filter=codeNo eq '${selectedLine.codeNo}' and workflowUserID eq '${selectedLine.workflowUserID}' and amountRange eq '${selectedLine.amountRange}'`;
    this.restService.get(getApi).subscribe({
      next: (res: any) => {
        const record = res?.value?.[0];
        if (!record) {
          return;
        }
        const patchApi = `${url}(${record.systemId})`;
        const payload = { approvalType };
        const ifMatchKey = '*';
        this.restService.patch(patchApi, payload, ifMatchKey).subscribe({
          next: (patchRes) => {
          },
          error: (err) => {
            this.toastr.error('Failed to update approval type');
          }
        });
      },
      error: (err) => {
      }
    });
  }


  // openDimension(data: any, itemConfig: any) {
  //   const section = itemConfig?.subLineSections?.find((candidate: SubLineSectionConfig) =>
  //     candidate.key === 'dimensions' && !candidate.disabled && candidate.component
  //   );

  //   if (!section?.component) {
  //     this.toastr.warning('Dimension section is not configured for this page.');
  //     return;
  //   }

  //   const modalRef = this.modal.open(section.component, { size: 'md', backdrop: 'static' });
  //   modalRef.componentInstance.headerData = data;
  //   modalRef.componentInstance.itemConfig = itemConfig;
  //   modalRef.componentInstance.sectionConfig = section.config;
  //   modalRef.componentInstance.showPopupLayout = true;
  //   modalRef.componentInstance.documentType = this.documentType;
  // }


  openLineAttachmentPopup() {
    const selectedIndex = this.selectedLines[0];
    const idProp = this.itemConfig?.lineConfig?.idProp;
    if (idProp) {
      if (!this.lineData[selectedIndex]?.[idProp]) {
        this.toastr.warning("Please Create line");
        return;
      }
    }

    if (this.selectedLines.length === 0) {
      this.toastr.warning("Please select a line");
      return;
    }
    if (this.selectedLines.length > 1) {
      this.toastr.warning("Please select a single line for attachment");
      return;
    }

    const rowIndex = this.selectedLines[0];
    const line = this.lineData[rowIndex];

    if (!line) {
      this.toastr.error("Invalid line selection");
      return;
    }

    const modalRef = this.modal.open(AttachmentsComponent, { size: 'lg', backdrop: 'static', windowClass: 'attachment-modal' });
    modalRef.componentInstance.documentNo = this.documentData[this.itemConfig!.informationSectionConfig!.documentNoProp!];
    modalRef.componentInstance.documentType = this.itemConfig?.informationSectionConfig?.documentType;
    modalRef.componentInstance.recordLineNo = line.lineNo ?? line.LineNo ?? line.lineno ?? 0;
    modalRef.componentInstance.itemConfig = this.itemConfig;
    modalRef.componentInstance.inModal = true;
  }




  openLineAttachmentPopupToShowFilesOnly(i: any) {
    if (!this.lineData || !this.lineData[i]) {
      this.toastr.warning('No line data found for this row');
      return;
    }
    const line = this.lineData[i];
    if (!line) {
      this.toastr.error("Invalid line selection");
      return;
    }

    const modalRef = this.modal.open(AttachmentsComponent, { size: 'lg', backdrop: 'static', windowClass: 'attachment-modal' });
    if (this.itemConfig?.informationSectionConfig?.documentType == 'Finance Claim' || this.itemConfig?.informationSectionConfig?.documentType == 'Claim Payment') {
      modalRef.componentInstance.documentNo = line.claimNo;
      modalRef.componentInstance.documentType = 'Employee Claim';
      modalRef.componentInstance.recordLineNo = line.sourceLineNo ?? 0;
    } else {
      modalRef.componentInstance.documentNo = this.documentData[this.itemConfig!.informationSectionConfig!.documentNoProp!];
      modalRef.componentInstance.documentType = this.itemConfig?.informationSectionConfig?.documentType;
      modalRef.componentInstance.recordLineNo = line.lineNo ?? line.LineNo ?? line.lineno ?? 0;
    }
    modalRef.componentInstance.itemConfig = this.itemConfig;
    modalRef.componentInstance.readonly = true;
    modalRef.componentInstance.inModal = true;
  }


  private applyServerHeaderResponse(response: any): void {
    if (!response || !this.headerFormGroup) return;

    const rawPatch = this.utility.getHeaderControlsData(
      response,
      this.itemConfig.headerConfig!.controls!
    );

    const patch: any = {};

    Object.keys(rawPatch).forEach(key => {
      const cfg = this.itemConfig.headerConfig!.controls!
        .flat()
        .find(c => c.label === key);

      let val = rawPatch[key];
      val = this.removeUnicodeFromValue(val);
      if (cfg?.type === FormFieldType.DateTime) {
        val = this.utility.convertStringToDateObj(val);
      }
      patch[key] = val;
    });

    this.headerFormGroup.patchValue(patch, { emitEvent: false });
  }



  revertLine(row: number): void {
    const lastGood = this.lineData[row];
    if (!lastGood) return;
    this.applyServerLineResponse(lastGood, row);
    delete this.lineErrors[row];
    this.lineErrors = { ...this.lineErrors };
    this.cdr.detectChanges();
  }

  private applyServerLineResponse(response: any, rowIndex: number): void {
    if (!response || rowIndex === undefined) return;

    const rawPatch = this.utility.getLineControlsData(
      response,
      this.itemConfig.lineConfig!.controls!
    );

    const patch: any = {};

    Object.keys(rawPatch).forEach(key => {
      const cfg = this.itemConfig.lineConfig!.controls!
        .find(c => c.label === key);

      let val = rawPatch[key];
      val = this.removeUnicodeFromValue(val);
      if (cfg?.type === FormFieldType.DateTime) {
        val = this.utility.convertStringToDateObj(val);
      }

      patch[key] = val;
    });

    this.lineData[rowIndex] = {
      ...this.lineData[rowIndex],
      ...patch
    };

    const fg = this.getLineFormGroup(rowIndex);
    fg?.patchValue(patch, { emitEvent: false });

    this.cdr.detectChanges();
  }


  private removeUnicodeFromValue(val: any): any {
    if (typeof val === 'string') {
      return val
        .replace(/_x0020_/g, ' ')
        .replace(/_x002F_/g, '/');
    }

    if (val && typeof val === 'object') {
      Object.keys(val).forEach(key => {
        val[key] = this.removeUnicodeFromValue(val[key]);
      });
    }

    return val;
  }




  private subscribeReloadHeaderById(id: number | string) {
    if (!id) {
      return;
    }
    const filter = `(${id})`;
    this.addItemService.showLoader$.next(true);
    Promise.resolve(this.getHeaderData(filter))
      .finally(() => {
        this.addItemService.showLoader$.next(false);
      });
  }


  private pad2(n: number): string {
    return n < 10 ? '0' + n : '' + n;
  }

  private normalizeDate(v: any): any {
    if (v?.year && v?.month && v?.day) {
      return `${v.year}-${this.pad2(v.month)}-${this.pad2(v.day)}`;
    }
    return v;
  }
  //Amit 06.01.2026/ For factbox 
  get documentNo(): string {
    const key = this.itemConfig?.informationSectionConfig?.documentNoProp;
    return key ? this.headerData?.[key] : '';
  }
  getFactboxDocumentNo(): string | null {
    const cfg = this.itemConfig?.informationSectionConfig;
    if (!cfg || !cfg.documentNoProp || !this.headerData) {
      return null;
    }
    return this.headerData[cfg.documentNoProp] ?? null;
  }

  getFactboxSummaryFields() {
    return this.itemConfig?.informationSectionConfig?.summaryFields ?? [];
  }

  getFactboxLineSummaryFields() {
    return this.itemConfig?.informationSectionConfig?.SummaryFieldConfigLine ?? [];
  }

  get beforeMainLineSections(): SubLineSectionConfig[] {
    return this.itemConfig?.subLineSections?.filter(section =>
      !!section.component && (section.position ?? 'beforeMainLines') === 'beforeMainLines' && !section.disabled
    ) ?? [];
  }

  get afterMainLineSections(): SubLineSectionConfig[] {
    return this.itemConfig?.subLineSections?.filter(section =>
      !!section.component && section.position === 'afterMainLines' && !section.disabled
    ) ?? [];
  }

  getSubLineComponentInputs(section: SubLineSectionConfig): Record<string, any> {
    return {
      headerData: this.headerData,
      itemConfig: this.itemConfig,
      sectionConfig: section.config,
      documentType: this.documentType,
      viewMode: this.viewMode,
      loading: this.loading,
      ...(section.inputs || {})
    };
  }

  getSubLineComponent(section: SubLineSectionConfig): Type<any> | null {
    return section.component || null;
  }

  // onThreeDotClick(index: number): void {
  //   this.selectedRowIndex = index;
  //   this.lineSelected.emit(index);
  // }

  onThreeDotClick(index: number) {
    this.selectedRowIndex = index;
    this.selectedRowIndexService.setSelectedRowIndex(index);
    this.lineSelected.emit(index);
    this.cdr.detectChanges();
  }

  private resetSelectedRowIndex(): void {
    this.selectedRowIndex = 0;
    this.selectedRowIndexService.setSelectedRowIndex(0);
    this.lineSelected.emit(0);
    this.selectRow(0);
    this.cdr.detectChanges();
  }

  //   onThreeDotClick(index: number): void {
  //   this.selectRow(index);
  //   this.lineSelected.emit(index);
  // }


  selectRow(index: number): void {
    this.lineData.forEach((l: any) => (l.__selected = false));
    if (this.lineData[index]) {
      this.lineData[index].__selected = true;
    }
  }

  //   selectRow(index: number): void {
  //   this.selectedRowIndex = index;

  //   this.lineData.forEach((l: any) => (l.__selected = false));
  //   if (this.lineData[index]) {
  //     this.lineData[index].__selected = true;
  //   }
  // }

  private getAllMenuPages() {
    return [
      ...MenuItems,
      // ...MenuItems2,
      // ...MenuItems3
    ]
      .flatMap(group => group.children);
  }
  private loadButtonPermissions() {
    this.permissionMap.clear();
    const title = this.itemConfig?.title;
    if (!title) return;
    const allMenus = this.getAllMenuPages();
    const matchedMenu = allMenus.find(m => m.title === title);
    if (!matchedMenu) {
      return;
    }
    const pageName = matchedMenu.page;
    const api = `/buttonPermissions`;
    const query =
      `?$filter=` +
      `companyId eq ${this.sessionService.Company} ` +
      `and pageID eq '${pageName}' ` +
      `and roleID eq '${this.sessionService.RoleId}'`;

    this.restService.get(api + query).subscribe((res: any) => {

      if (res?.value?.length) {
        res.value.forEach((p: ButtonPermission) => {
          this.permissionMap.set(p.fieldName?.toUpperCase(), p);
        });
      }

      this.applyPermissions();
    });
  }


  applyPermissions() {
    this.applyToButtons(this.itemConfig?.headerConfig?.buttons);
    this.applyToButtons(this.itemConfig?.lineConfig?.buttons);
    this.cdr.detectChanges();
  }

  applyToButtons(buttons?: any[]) {
    if (!buttons?.length) return;

    buttons.forEach(btn => {
      const key = btn.label?.toUpperCase();
      const perm = key ? this.permissionMap.get(key) : null;
      if (perm) {
        btn.isEnable = perm.IsEnable === true;
        btn.isVisible = perm.IsVisible === true;
      }
    });
  }


  getLineFieldValue(i: number, label?: string): any {
    if (!label) return '';
    return this.getLineFormGroup(i).get(label)?.value;
  }




  toggleFullscreen() {
    this.isFullscreen = !this.isFullscreen;
    this.syncDocumentModalSize();
  }

  private syncDocumentModalSize() {
    const modalDialog = this.hostElement.nativeElement.closest('.modal-dialog');
    if (!modalDialog) {
      return;
    }

    modalDialog.classList.add('pr-document-modal-dialog');
    modalDialog.classList.toggle('pr-document-modal-dialog--expanded', this.isFullscreen);
  }

  onLineActionClick(event: any) {
    const control = event.control;
    const rowIndex = event.rowIndex;

    // Sync current form values into lineData so consumers get fresh data
    const fg = this.getLineFormGroup(rowIndex);
    if (fg) {
      this.lineData[rowIndex] = { ...this.lineData[rowIndex], ...fg.value };
    }

    const actionButton: CustomButton = {
      label: control.label,
      name: control.name,
      icon: control.actionIcon
    };

    this.buttonClickEvent.emit({
      button: actionButton,
      data: {
        rowIndex: rowIndex
      },
      section: SectionType.Line,
      headerData: this.headerData,
      lineData: this.lineData
    });

  }

  groupControls() {

    const controls = this.itemConfig?.lineConfig?.controls || [];

    this.groupedControls = {};

    controls.forEach((control: any) => {

      const section = control.section || 'Basic';

      if (!this.groupedControls[section]) {
        this.groupedControls[section] = [];
      }

      this.groupedControls[section].push(control);

    });

  }

  hasVisibleControls(sectionControls: any[]): boolean {
    return sectionControls?.some(control => !control.hidden);
  }

  get useStructuredCommandBar(): boolean {
    return !!this.itemConfig?.headerConfig?.commandBar;
  }

  get visiblePrimaryCommandActions(): PopupCommandAction[] {
    return this.getPopupCommandActions()
      .filter((action) => action.isPrimary)
      .slice(0, this.getMaxPrimaryActions());
  }

  get visibleGroupedCommandMenus(): PopupCommandMenuKey[] {
    return this.getOrderedVisibleGroups().slice(0, this.getMaxVisibleGroups());
  }

  get overflowCommandActions(): PopupCommandAction[] {
    const visiblePrimaryKeys = new Set(this.visiblePrimaryCommandActions.map((action) => action.key));
    const visibleGroupSet = new Set(this.visibleGroupedCommandMenus);

    return this.getPopupCommandActions().filter((action) => {
      if (visiblePrimaryKeys.has(action.key)) {
        return false;
      }

      if (!action.group || action.group === 'More') {
        return true;
      }

      return !visibleGroupSet.has(action.group);
    });
  }

  get hasPopupCommandSurface(): boolean {
    if (!this.useStructuredCommandBar) {
      return false;
    }

    return this.visiblePrimaryCommandActions.length > 0
      || this.visibleGroupedCommandMenus.length > 0
      || this.overflowCommandActions.length > 0
      || this.showInformationButton;
  }

  get legacyPopupCommandSurface(): boolean {
    if (this.useStructuredCommandBar) {
      return false;
    }

    return !!(
      (this.itemConfig?.headerConfig?.buttons && this.itemConfig.headerConfig.buttons.length > 0)
      || this.showInformationButton
      || this.itemConfig?.headerConfig?.showComments
      || this.itemConfig?.headerConfig?.showDimensionButton
    );
  }

  getCommandMenuActions(menu: PopupCommandMenuKey): PopupCommandAction[] {
    const visiblePrimaryKeys = new Set(this.visiblePrimaryCommandActions.map((action) => action.key));

    if (menu === 'More') {
      return this.overflowCommandActions;
    }

    return this.getPopupCommandActions().filter((action) =>
      action.group === menu && !visiblePrimaryKeys.has(action.key)
    );
  }

  isCommandMenuOpen(menu: PopupCommandMenuKey): boolean {
    return this.activeCommandMenu === menu;
  }

  toggleCommandMenu(menu: PopupCommandMenuKey, event?: MouseEvent): void {
    event?.stopPropagation();
    this.activeCommandMenu = this.activeCommandMenu === menu ? null : menu;
    this.cdr.markForCheck();
  }

  closeActiveCommandMenu(): void {
    if (this.activeCommandMenu === null) {
      return;
    }

    this.activeCommandMenu = null;
    this.cdr.markForCheck();
  }

  onPopupInfoToggle(): void {
    this.showInformationTabs = !this.showInformationTabs;
    this.closeActiveCommandMenu();
  }

  onPopupCommandAction(action: PopupCommandAction, event?: MouseEvent, skipDuplicateCheck: boolean = false): void {
    if (!skipDuplicateCheck && this.isDuplicatePopupCommand(action.key)) {
      return;
    }

    event?.stopPropagation();

    if (action.disabled) {
      return;
    }

    if (action.source === 'custom' && action.button) {
      this.customButtonClick(action.button, 'header');
      setTimeout(() => this.closeActiveCommandMenu());
      return;
    }

    switch (action.actionName) {
      case 'comments':
        this.openComments();
        break;
      default:
        break;
    }

    setTimeout(() => this.closeActiveCommandMenu());
  }

  onPopupCommandPointerDown(action: PopupCommandAction, event?: MouseEvent): void {
    if (event && event.button !== 0) {
      return;
    }

    this.markPopupCommandTriggered(action.key);
    this.onPopupCommandAction(action, event, true);
  }

  handleFactboxProcurementFlowAction(actionName: string): void {
    if (!actionName) {
      return;
    }

    const button = this.itemConfig?.headerConfig?.buttons?.find((candidate: any) =>
      candidate?.label === actionName || candidate?.name === actionName
    );

    if (button) {
      this.customButtonClick(button, 'header');
    }
  }

  private getPopupCommandActions(): PopupCommandAction[] {
    const actions: PopupCommandAction[] = [];
    const buttons = this.itemConfig?.headerConfig?.buttons || [];

    buttons.forEach((button, index) => {
      // Keep compatibility with the popup's existing visibility convention.
      // In this component, buttons merged through addHeaderButtons$ often carry isVisible=false
      // while still being intended for display by the legacy toolbar.
      if (button?.isVisible === true) {
        return;
      }

      actions.push({
        key: `custom-${button.label || button.name || index}`,
        label: button.name || button.label,
        icon: button.icon,
        disabled: button.isEnable === false,
        source: 'custom',
        group: button.group,
        isPrimary: button.isPrimary === true,
        order: this.resolveCommandOrder(button.order, index),
        button
      });
    });

    this.getBuiltInPopupActions().forEach((action) => actions.push(action));

    return actions.sort((left, right) => left.order - right.order);
  }

  private getBuiltInPopupActions(): PopupCommandAction[] {
    const builtInActions: PopupCommandAction[] = [];
    const builtInGroups = this.getCommandBarConfig().builtInActions || {};

    if (this.itemConfig?.headerConfig?.showComments) {
      builtInActions.push({
        key: 'builtin-comments',
        label: 'Comments',
        icon: 'bi bi-chat-dots',
        disabled: false,
        source: 'builtin',
        group: builtInGroups.comments ?? 'More',
        isPrimary: false,
        order: 9000,
        actionName: 'comments'
      });
    }

    if (this.itemConfig?.headerConfig?.showDimensionButton) {
      builtInActions.push({
        key: 'builtin-dimension',
        label: 'Dimension',
        icon: 'bi bi-scissors',
        disabled: this.isDisableDimensionButton === true,
        source: 'builtin',
        group: builtInGroups.dimension ?? 'More',
        isPrimary: false,
        order: 9020,
        actionName: 'dimension'
      });
    }

    return builtInActions;
  }

  private getOrderedVisibleGroups(): PopupCommandMenuKey[] {
    const visiblePrimaryKeys = new Set(this.visiblePrimaryCommandActions.map((action) => action.key));
    const orderedGroups: PopupCommandMenuKey[] = ['Process', 'Approval', 'Review'];

    return orderedGroups.filter((group) =>
      this.getPopupCommandActions().some((action) => action.group === group && !visiblePrimaryKeys.has(action.key))
    );
  }

  private getCommandBarConfig(): PopupCommandBarConfig {
    return this.itemConfig?.headerConfig?.commandBar || {};
  }

  private getMaxPrimaryActions(): number {
    const max = this.getCommandBarConfig().maxPrimaryActions ?? 3;
    return Math.min(3, Math.max(0, max));
  }

  private getMaxVisibleGroups(): number {
    const max = this.getCommandBarConfig().maxVisibleGroups ?? 3;
    return Math.min(3, Math.max(0, max));
  }

  private resolveCommandOrder(order: number | undefined, index: number): number {
    return typeof order === 'number' ? order : 1000 + index;
  }

  private markPopupCommandTriggered(key: string): void {
    this.lastPopupCommandKey = key;
    this.lastPopupCommandAt = Date.now();
  }

  private isDuplicatePopupCommand(key: string): boolean {
    return this.lastPopupCommandKey === key && Date.now() - this.lastPopupCommandAt < 250;
  }

}




