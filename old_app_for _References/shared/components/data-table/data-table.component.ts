
import { Component, OnInit, Input, EventEmitter, Output, ViewChildren, QueryList, ViewChild, ElementRef, OnDestroy, TemplateRef, ChangeDetectorRef, Inject, HostListener, Optional } from '@angular/core';
import { Router } from '@angular/router';
import { DOCUMENT, DatePipe } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { forkJoin, Observable, Subscription } from 'rxjs';
import { __values } from 'tslib';
import * as xlsx from 'xlsx';
import { ActionsConfig } from '../../../core/models/shared/actionsConfig';
import { FactBoxType } from '../../../core/models/shared/fact-box.enum';
import { AdvanceFilterModel } from '../../../core/models/shared/advance-filter.model';
import { DataTableConfig } from '../../../core/models/shared/dataTableConfig';
import { EventDataModel, SectionType } from '../../../core/models/shared/eventDataModel';
import { FormDataModel } from '../../../core/models/shared/formDataModel';
import { CustomButtonEvent } from '../../../core/models/shared/customButtonEvent';
import { AddLineEvent } from '../../../core/models/shared/add-line-event';
import { SortableHeaderDirective } from '../../directives/sortable-header.directive';
import { RestService } from '../../../core/services/rest.service';
import { DataTableService } from '../../../core/services/shared/data-table.service';
import { SessionService } from '../../../core/services/session.service';
import { AddItemService } from '../../../core/services/shared/add-item.service';
import { Utility } from '../../../core/services/utility.service';
import { SortEvent } from '../../../core/services/models/shared/sort-event.model';
import { LinkItemConfig, TableHeader } from '../../../core/models/shared/tableHeader';
import { ExportPdfService } from '../../../core/services/shared/export-pdf.service';
import { AddItemPopupComponent } from '../add-item-popup/add-item-popup.component';
import { NgxSelectDropdownComponent } from 'ngx-select-dropdown';
import { GlobalApiUiSearchService } from '../../../core/services/shared/global-api-ui-search.service';
import { NgbModal, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ButtonPermission } from '../../../core/models/shared/buttonPermission.model';
import { FilterField } from '../../../core/models/shared/filter.model';
import { UnifiedDialogService } from '../../../core/services/shared/unified-dialog.service';
// const PrimaryWhite = '#ffffff';
// const SecondaryGrey = '#ccc';


@Component({
  standalone: false,
  selector: 'app-data-table',
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.scss'],
  providers: [DataTableService]
})
export class DataTableComponent implements OnInit, OnDestroy {
  @ViewChild('filterDrop', { static: false }) filterDrop!: NgxSelectDropdownComponent;
  @ViewChild('epltable', { static: false }) epltable!: ElementRef;
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  records: any[] = [];
  data$: Observable<any[]>;
  total$: Observable<number>;
  allData: any[] = [];
  allData1: any[] = [];
  loading!: boolean;
  isFetching: boolean = false;
  initialDataReady: boolean = false;
  dynamicLoading!: boolean;
  totaldataCount: number = 0;
  totalAvailableCount: number | null = null;
  checkAll: boolean = false;
  page: number = 1;
  _pageSize: number = 50;
  showMoreButton: boolean = false;
  showFactBox: boolean = false;
  recordSelected: boolean = false;
  showFactBoxDetails: boolean = false;
  selectedDocumentNo!: string;
  selectedRow!: string;
  selectedRecord: any = null;
  clearAllClickedAct: boolean = false;
  isShowInfo: boolean = false;
  isGridInfo: boolean = false;
  showTableBackButton = false;
  // filterOptions: any[] = [];
  filterOptions: FilterField[] = [];
  sortOption: any;
  showCustomFilter: boolean = false;
  isFilter: boolean = false;
  removeFilter: boolean = false;
  currentFilterQuery: string | null = null;
  currentBcFilterClause: string | null = null;

  // ===== BC Context =====
  lastClickedColumn: string | null = null;
  lastClickedValue: any = null;

  // ===== Filter =====
  isBcFilterActive = false;
  activeFilterColumns: Set<string> = new Set();
  bcFilterValues: Map<string, any> = new Map();

  // ===== Header UI =====
  hoveredHeader: string | null = null;
  openHeaderMenu: string | null = null;

  hiddenColumns = new Set<string>();
  private permissionMap = new Map<string, ButtonPermission>();
  private listPermissionMap = new Map<string, ButtonPermission>();

  private static tableInstanceCounter = 0;

  tableInstanceId = `dt_${++DataTableComponent.tableInstanceCounter}`;

  clearBcFilter() {

    this.isBcFilterActive = false;
    this.activeFilterColumns.clear();
    this.bcFilterValues.clear();

    this.lastClickedColumn = null;
    this.lastClickedValue = null;

    // restore full data
    this.records = [...this.allData];
    this.service.setDataDirect(this.records);
  }

  actionConfig: ActionsConfig = {
    showView: true,
    showDelete: true,
    showSearch: true,
    showEdit: true,
    showexportExcel: true,
    showRefresh: true,
    showExportPdf: true,
    showAdvanceFilter: false,
  };
  protected permissionsLoadedSubscription!: Subscription;
  protected resCenterChangedSubscription!: Subscription;
  public factBoxType = FactBoxType;
  protected showLoaderSubscription!: Subscription;
  protected refreshDataDataTableSubscription!: Subscription;
  private filterSubscription?: Subscription;
  advancedFilter: AdvanceFilterModel;
  @Input() config!: DataTableConfig;
  @Input() filterDropdown: any;
  @Input() MenuButtons: any;
  colomnNameAll: any[] = [];
  colomnNameDrop: any[] = [];
  colomnValueAll: any[] = [];
  selectedItems: any[] = [];
  selectedItemsTemp: any[] = [];
  dropdownSettings: any = {
    singleSelection: false,
    idField: 'id',
    textField: 'text',
    selectAllText: 'Select All',
    unSelectAllText: 'UnSelect All',
    itemsShowLimit: 3,
    defaultOpen: true,
    allowSearchFilter: true
  };
  clmArray: any[] = [];
  dropdownfilter!: boolean;
  @Input() set pageSize(value: number) {
    this._pageSize = value;
    this.service.pageSize = value;
  }
  @Input() dropdown: boolean = false;
  @Output() popupLoaded = new EventEmitter<any>();
  @Output() popupAddNewPostResponse = new EventEmitter<any>();
  @Output() changeEvent = new EventEmitter<EventDataModel>();
  @Output() leaveEvent = new EventEmitter<FormDataModel>();
  @Output() buttonClickEvent = new EventEmitter<CustomButtonEvent>();
  @Output() addLineEvent = new EventEmitter<AddLineEvent>();
  @Output() drawerStateChange = new EventEmitter<any>();
  @Output() dropdownOpend = new EventEmitter<any>();
  @Output() lineSelected = new EventEmitter<any>();
  @Output() beforeCreate = new EventEmitter<any>();
  @Output() drawerOpen = new EventEmitter<boolean>();
  @Output() drawerClosed = new EventEmitter<boolean>();


  @ViewChildren(SortableHeaderDirective) headers!: QueryList<SortableHeaderDirective>;
  constructor(
    @Inject(DOCUMENT) private _document: Document,
    private router: Router,
    private modal: NgbModal,
    private restService: RestService,
    private toastr: ToastrService,
    public service: DataTableService,
    private exportPdfService: ExportPdfService,
    private sessionService: SessionService,
    private datePipe: DatePipe,
    private addItemService: AddItemService,
    private cdr: ChangeDetectorRef,
    private searchService: GlobalApiUiSearchService,
    private utility: Utility,
    private dialogService: UnifiedDialogService,
    @Optional() public activeModal: NgbActiveModal
  ) {
    service.pageSize = 50;
    service.pagination = false;
    this.data$ = service.data$;
    this.total$ = service.total$;
    this.advancedFilter = {
      searchTerm: '',
      selectedColumn: undefined
    };
  }
  // public primaryColour = PrimaryWhite;
  // public secondaryColour = SecondaryGrey;
  // public coloursEnabled = false;
  public loadingTemplate!: TemplateRef<any>;
  onItemSelect(item: any) {
    let clm = {
      prop: item.id,
      name: item.text,
    }
    this.config.headers!.push(clm);
  }
  onItemDeSelect(item: any) {
    if (!item.isPrimaryLink) {
      for (let i = 0; i < this.config.headers!.length; i++) {
        if (this.config.headers![i].prop == item.id) {
          this.config.headers!.splice(i, 1);
        }
      }
    } else {
      for (let i = 0; i < this.config.headers!.length; i++) {
        this.selectedItems.push(item);
      }
    }
  }
  onSelectAll(items: any) {
  }
  ngOnInit(): void {
    this.service.data = [];
    if (this.config?.factBoxConfig) {
      // this.showFactBox = true;
      this.actionConfig.showInformation = true;
    }
    if (this.config && this.config.showTableBackButton == true) {
      this.showTableBackButton = true
    }
    if (this.config && this.config?.enableCache === false) {
    } else {
      this.config.enableCache = true;
    }
    if (this.config && this.config?.showCreate === false) {
      this.config.showCreate = false;
    } else {
      this.config.showCreate = true;
    }
    if (this.config && this.config?.showDelete === false) {
      this.config.showDelete = false;
    } else {
      this.config.showDelete = true;
    }
    if (this.config && this.config?.showEdit === false) {
      this.config.showEdit = false;
    } else {
      this.config.showEdit = true;
    }
    if (this.config && !this.config?.removeUnicodeCharFields) {
      this.config.removeUnicodeCharFields = [];
    }
    this.getItems();
    this.actionConfig.title = this.config.title;
    this.actionConfig.showCreate = this.config.showCreate;
    this.actionConfig.showCopy = this.config.showCopy;
    this.actionConfig.showEdit = this.config.showEdit;
    this.actionConfig.showDelete = this.config.showDelete;
    this.actionConfig.searchPlaceHolder = 'Search ' + this.config.title + 's';
    if (this.sessionService.SuperAdmin || this.sessionService.Permissions.length > 0) {
      if (this.sessionService.SuperAdmin) {
        this.actionConfig.showDelete = this.actionConfig.showDelete ? true : false;
        this.actionConfig.showEdit = this.actionConfig.showEdit ? true : false;
        this.actionConfig.showCreate = this.actionConfig.showCreate ? true : false;
        this.actionConfig.showCopy = this.actionConfig.showCopy ? true : false;
        this.actionConfig.showView = this.actionConfig.showView ? true : false;
        this.actionConfig.showPrint = this.actionConfig.showPrint ? true : false;
      } else {
        const permission = this.sessionService.getPermission(this.config.pageName!);
        this.actionConfig.showDelete = this.actionConfig.showDelete ? permission.delete : false;
        this.actionConfig.showEdit = this.actionConfig.showEdit ? permission.edit : false;
        this.actionConfig.showCreate = this.actionConfig.showCreate ? permission.create : false;
        this.actionConfig.showCopy = this.actionConfig.showCopy ? permission.create : false;
        this.actionConfig.showView = this.actionConfig.showView ? permission.read : false;
        this.actionConfig.showPrint = this.actionConfig.showPrint ? permission.read : false;
      }
    } else {
      this.permissionsLoadedSubscription = this.sessionService.permissionsLoaded$.subscribe(() => {
        if (this.sessionService.SuperAdmin) {
          this.actionConfig.showDelete = this.actionConfig.showDelete ? true : false;
          this.actionConfig.showEdit = this.actionConfig.showEdit ? true : false;
          this.actionConfig.showCreate = this.actionConfig.showCreate ? true : false;
          this.actionConfig.showCopy = this.actionConfig.showCopy ? true : false;
          this.actionConfig.showView = this.actionConfig.showView ? true : false;
          this.actionConfig.showPrint = this.actionConfig.showPrint ? true : false;
        } else {
          const permission = this.sessionService.getPermission(this.config.pageName!);
          this.actionConfig.showDelete = this.actionConfig.showDelete ? permission.delete : false;
          this.actionConfig.showEdit = this.actionConfig.showEdit ? permission.edit : false;
          this.actionConfig.showCreate = this.actionConfig.showCreate ? permission.create : false;
          this.actionConfig.showCopy = this.actionConfig.showCopy ? permission.create : false;
          this.actionConfig.showView = this.actionConfig.showView ? permission.read : false;
          this.actionConfig.showPrint = this.actionConfig.showPrint ? permission.read : false;
        }
      });
    }
    this.resCenterChangedSubscription = this.sessionService.resCenterChanged$.subscribe((data: boolean) => {
      if (data) {
        this.page = 1;
        this.records = [];
        this.service.clearCacheData();
        this.getItems();
      }
    });
    this.showLoaderSubscription = this.addItemService.showLoader$.subscribe((data: boolean) => {
      const overlayOpen = this.modal.hasOpenModals() || this._document?.body?.classList?.contains('modal-open');
      this.dynamicLoading = !!data && !overlayOpen;
      this.cdr.detectChanges();
    });
    this.refreshDataDataTableSubscription = this.addItemService.refreshDataDataTable$.subscribe((data: boolean) => {
      if (data) { this.refreshPage() }
    });
    // this.sortOption = this.config.headers;
    this.filterOptions = this.buildFilterOptions();
    this.service.popupTaggle = '';

    this.loadButtonPermissions();
  }

  //   private buildFilterOptions(): FilterField[] {
  //   const headerDefaults = this.buildFilterFieldsFromHeaders();

  //   if (!this.config.filterConfig || this.config.filterConfig.length === 0) {
  //     return headerDefaults;
  //   }

  //   const overrideMap = new Map(
  //     this.config.filterConfig.map(field => [field.field, field])
  //   );

  //   return headerDefaults.map(defaultField => {
  //     const override = overrideMap.get(defaultField.field);
  //     return override ? { ...defaultField, ...override } : defaultField;
  //   });
  // }

  //amit

  //amit
  private buildFilterOptions(): FilterField[] {
    const headerDefaults = this.buildFilterFieldsFromHeaders();

    const dropdownOverrides = this.buildLegacyDropdownOverrides();
    const configOverrides = this.config.filterConfig || [];

    const overrideMap = new Map<string, FilterField>();

    dropdownOverrides.forEach(field => {
      overrideMap.set(field.field, field);
    });

    configOverrides.forEach(field => {
      overrideMap.set(field.field, field);
    });

    return headerDefaults.map(defaultField => {
      const override = overrideMap.get(defaultField.field);
      return override ? { ...defaultField, ...override } : defaultField;
    });
  }



  private buildLegacyDropdownOverrides(): FilterField[] {
    if (!this.filterDropdown?.length || !this.config?.headers?.length) {
      return [];
    }

    return this.config.headers
      .map((header): FilterField | null => {
        const dropdown = this.filterDropdown.find(
          (fd: any) => fd.fieldName === header.name
        );

        if (!dropdown) {
          return null;
        }

        return {
          field: header.prop,
          label: header.name,
          type: 'dropdown',
          options: dropdown.fieldOptions || []
        };
      })
      .filter((field): field is FilterField => field !== null);
  }
  //amit end

  private buildFilterFieldsFromHeaders(): FilterField[] {
    if (!this.config?.headers?.length) {
      return [];
    }

    return this.config.headers
      .filter(header => !!header.prop)
      .map(header => ({
        field: header.prop,
        label: header.name,
        type: this.inferFilterType(header.prop)
      }));
  }

  private inferFilterType(prop: string): 'text' | 'date' | 'number' {
    const key = (prop || '').toLowerCase();

    if (key.includes('date') || key.includes('datetime') || key.endsWith('at')) {
      return 'date';
    }

    if (
      key.includes('amount') ||
      key.includes('total') ||
      key.includes('qty') ||
      key.includes('quantity') ||
      key.includes('balance') ||
      key.includes('rate') ||
      key.includes('price') ||
      key.includes('cost') ||
      key.includes('percent') ||
      key.includes('percentage') ||
      key.includes('score') ||
      key.includes('count') ||
      key.includes('days') ||
      key.includes('hours') ||
      key.includes('km')
    ) {
      return 'number';
    }

    return 'text';
  }
  // private removeUnicodeChars(record: any) {
  //   this.config.removeUnicodeCharFields!.forEach((item: string) => {
  //     record[item] = record[item].replace('_x0020_', ' ');
  //   });
  //   return record;
  // }
  private removeUnicodeChars(record: any) {
    this.config.removeUnicodeCharFields!.forEach((item: string) => {
      if (record[item]) {
        record[item] = record[item].replace(/_x0020_/g, ' ');
      }
    });
    return record;
  }

  private restoreCachedPages(): boolean {
    const cachedPages = this.service.getCacheData(this.config.title!);

    if (!cachedPages || typeof cachedPages !== 'object' || Array.isArray(cachedPages)) {
      return false;
    }

    const pageNumbers = Object.keys(cachedPages)
      .map((key) => Number(key))
      .filter((page) => !Number.isNaN(page))
      .sort((left, right) => left - right);

    if (pageNumbers.length === 0) {
      return false;
    }

    const restoredRecords = pageNumbers.flatMap((page) => cachedPages[page] || []);
    const lastPage = pageNumbers[pageNumbers.length - 1];

    this.records = [...restoredRecords];
    this.allData = [...restoredRecords];
    this.service.setDataDirect(this.records);
    this.totaldataCount = this.records.length;
    this.page = lastPage + 1;
    this.showMoreButton = this.totalAvailableCount !== null
      ? restoredRecords.length < this.totalAvailableCount
      : restoredRecords.length >= this._pageSize;
    this.loading = false;
    this.initialDataReady = true;
    this.isFetching = false;

    if (!this.selectedRow && this.service.data.length > 0) {
      this.selectRow(this.service.data[0]);
    }

    return true;
  }

  private getResponseTotalCount(data: any): number | null {
    const rawCount = data?.['@odata.count'];
    const totalCount = typeof rawCount === 'number' ? rawCount : Number(rawCount);
    return Number.isFinite(totalCount) ? totalCount : null;
  }

  private updateShowMoreButton(batchLength: number, totalCount: number | null) {
    if (totalCount !== null) {
      this.totalAvailableCount = totalCount;
      this.showMoreButton = this.records.length < totalCount;
      return;
    }

    this.showMoreButton = batchLength >= this._pageSize;
  }

  private cacheRecordsByPage(records: any[]) {
    this.service.clearCacheData(this.config.title!);

    for (let index = 0; index < records.length; index += this._pageSize) {
      const pageNumber = Math.floor(index / this._pageSize) + 1;
      this.service.setCacheData(this.config.title!, records.slice(index, index + this._pageSize), pageNumber);
    }
  }

  getItems(callCache: boolean = true) {
    if (this.isFetching) {
      return;
    }

    const previousRecords = [...this.records];
    const previousAllData = [...this.allData];
    const isInitialLoad = this.page === 1 && this.records.length === 0;
    const shouldReplaceRecords = this.page === 1;
    if (isInitialLoad) {
      this.initialDataReady = false;
    }
    this.isFetching = true;
    this.loading = isInitialLoad;
    this.service.headers = this.config.headers!;
    this.service.searchTerm = '';
    const restoredFromCache = callCache && this.page === 1 && this.config.enableCache && this.restoreCachedPages();
    const revalidateCachedRecords = restoredFromCache && this.records.length > 0;

    {
      let filter: string = '';
      let orderby: string = '';
      const requestTop = revalidateCachedRecords ? Math.max(this.records.length, this._pageSize) : this._pageSize;
      const requestSkip = revalidateCachedRecords ? 0 : ((this.page - 1) * this._pageSize);
      const shouldReplaceRecords = requestSkip === 0;
      if (this.config.headerApiFilterField) {
        filter = "?$filter=" + this.config.headerApiFilterField + " eq '" + this.sessionService.UserId + "'";
      }
      // if (this.config.filters && this.config.filters.length > 0) {
      //   const conditions = this.config.filters.map(x => `${x.field} ${x.operator} ${x.value}`).join(' and ');
      //   if (filter === '') {
      //     filter = "?$filter=" + conditions;
      //   } else {
      //     filter = filter + " and " + conditions;
      //   }
      // }
      if (!this.sessionService.SuperAdmin) {
        if (this.config.filters && this.config.filters.length > 0) {
          const conditions = this.config.filters.map(x => `${x.field} ${x.operator} ${x.value}`).join(' and ');
          if (filter === '') {
            filter = "?$filter=" + conditions;
          } else {
            filter = filter + " and " + conditions;
          }
        }
      } else if (this.sessionService.SuperAdmin) {
        if (this.config.filters && this.config.filters.length > 0) {
          const filteredConditions = this.config.filters
            .filter(x => x.field !== 'UserId')
            .map(x => `${x.field} ${x.operator} ${x.value}`)
            .join(' and ');
          if (filteredConditions) {
            if (filter === '') {
              filter = '?$filter=' + filteredConditions;
            } else {
              filter = filter + ' and ' + filteredConditions;
            }
          }
        }
      }

      if (this.advancedFilter && this.advancedFilter.searchTerm && this.advancedFilter.selectedColumn) {
        const condition = "contains(" + this.advancedFilter.selectedColumn + ", '" + this.advancedFilter.searchTerm + "')";
        if (filter === '') {
          filter = "?$filter=" + condition;
        } else {
          filter = filter + " and " + condition;
        }
      }

      // Keep custom filter query during incremental page loads
      if (this.currentFilterQuery) {
        const customFilter = this.currentFilterQuery;
        if (filter === '') {
          filter = "?$filter=" + customFilter;
        } else {
          filter = filter + " and " + customFilter;
        }
      }

      // Keep header-click filter query during incremental page loads
      if (this.currentBcFilterClause) {
        const bcClause = this.currentBcFilterClause;
        if (filter === '') {
          filter = "?$filter=" + bcClause;
        } else {
          filter = filter + " and " + bcClause;
        }
      }

      if (!this.sessionService.SuperAdmin) {
        if (this.config.filterByUserCompanyResCenter) {
          let condition: string = "CompanyId eq " + this.sessionService.Company;
          if (this.sessionService.ResponsibilityCenterId && this.config.pageName !== 'PRE-PAYMENT POSTED PURCHASE INVOICE') {
            condition = condition + " and PortalResponsibilityCentre eq '" + this.sessionService.ResponsibilityCenterId + "'";
          }
          if (filter === '') {
            filter = "?$filter=" + condition;
          } else {
            filter = filter + " and " + condition;
          }
        }
      }


      if (this.config.headerApiOrderByField) {
        orderby = "&$orderby=" + this.config.headerApiOrderByField + ' desc';
      }
      if (filter === '') {
        filter = '?$top=' + requestTop + '&$skip=' + requestSkip + orderby + '&$count=true';
      } else {
        filter = filter + '&$top=' + requestTop + '&$skip=' + requestSkip + orderby + '&$count=true';
      }
      this.restService.get(this.config.headerApi + filter).subscribe((data: any) => {
        const totalCount = this.getResponseTotalCount(data);
        if (data.value.length) {
          this.colomnValueAll = Object.keys(data.value[0]);
          this.colomnNameDrop = Object.keys(data.value[0]);
          this.camelToNormal(this.colomnValueAll);
          for (let i = 0; i < this.colomnValueAll.length; i++) {
            let a = {
              'text': '',
              id: '',
            }
            a.id = this.colomnValueAll[i];
            a.text = this.colomnNameAll[i].trim();
            if ((a.id != '@odata.etag') && (a.id != 'Id')) {
              this.clmArray.push(a);
            }
          }
          this.dropdownfilter = true;
          for (let i = 0; i < this.config.headers!.length; i++) {
            let a = {
              'text': '',
              id: '',
              'isPrimaryLink': false,
            }
            a.id = this.config.headers![i].prop;
            a.text = this.config.headers![i].name;
            if (this.config.headers![i].isPrimaryLink) {
              a.isPrimaryLink = this.config.headers![i].isPrimaryLink!;
            }
            if ((a.id != '@odata.etag') && (a.id != 'Id')) {
              this.selectedItemsTemp.push(a);
            }
          }
          for (let j = 0; j < this.selectedItemsTemp.length; j++) {
            if (this.selectedItemsTemp[j].isPrimaryLink) {
              for (let i = 0; i < this.clmArray.length; i++) {
                if (this.clmArray[i].id == this.selectedItemsTemp[j].id) {
                  this.clmArray.splice(i, 1)
                }
              }
            }
          }
          this.selectedItems = this.selectedItemsTemp.filter((obj) => {
            return obj.isPrimaryLink === false;
          });
        }
        data.value.forEach((record: any) => {
          record.selected = false;
          if (this.config.removeUnicodeCharFields!.length > 0) {
            record = this.removeUnicodeChars(record);
          }
        });
        const records = this.utility.copyObj(data.value.map((x: any) => this.updateRecordDisplayFormats(x)));
        if (shouldReplaceRecords) {
          this.allData = [...data.value];
          this.records = [...records];
          this.cacheRecordsByPage(records);
          this.page = Math.ceil(this.records.length / this._pageSize) + 1;
        } else {
          this.allData = [...this.allData, ...data.value];
          this.records = [...this.records, ...records];
          this.service.setCacheData(this.config.title!, records, this.page);
          this.page++;
        }
        this.service.setDataDirect(this.records);
        if (!this.selectedRow && this.service.data.length > 0) {
          this.selectRow(this.service.data[0]);
        }
        this.totaldataCount = this.records.length;
        // Restore opened popup
        const openedId = this.sessionService.OpenedPopupId;
        if (openedId) {
          const pageName = openedId.split('|')[0];
          const id = openedId.split('|')[1];
          if (this.config.pageName === pageName) {
            this.openItemPopup(id, null);
          }
        }
        this.loading = false;
        this.initialDataReady = true;
        this.isFetching = false;
        setTimeout(() => {
          this.updateShowMoreButton(data.value.length, totalCount);
        }, 1000);
      }, (error) => {
        this.records = previousRecords;
        this.allData = previousAllData;
        this.service.setDataDirect(previousRecords);
        this.loading = false;
        this.initialDataReady = true;
        this.isFetching = false;
      });
    }
  }
  filterClass: boolean = true;
  filterDropfn() {
    this.filterClass = !this.filterClass;
    this.filterDrop.toggleDropdown = this.filterClass;
  }
  camelToNormal(camArray: any[]) {
    let arr: any[] = [];
    for (let camstring of camArray) {
      const result = camstring.replace(/([A-Z])/g, ' $1');
      const finalResult = result.charAt(0).toUpperCase() + result.slice(1);
      this.colomnNameAll.push(finalResult);
    }
  }
  onSort({ column, direction }: SortEvent) {
    // resetting other headers
    this.headers.forEach(header => {
      if (header.sortable !== column) {
        header.direction = '';
      }
    });
    this.service.sortColumn = column;
    this.service.sortDirection = direction;
  }
  async deleteItem(items: any[]) {
    const confirmed = await this.dialogService.confirm({
      message: 'Are you sure you want to delete this item? This action cannot be undone.',
      yesButtonText: 'Yes, Delete',
      noButtonText: 'No',
      showAsNotification: false,
      modalOptions: { windowClass: 'modal-dialog-confirm' }
    });

    if (!confirmed) {
      return;
    }

    if (items.length === 1) {
      this.restService.delete(this.config.headerApi + '(' + items[0][this.config.idProp!] + ')').subscribe((response: any) => {
        const fileUrl = items[0][this.config.fileUrlProp!];
        if (fileUrl && this.config.fileDeleteApi) {
          this.restService.delete(this.config.fileDeleteApi + '/' + fileUrl).subscribe((res: any) => {
            this.toastr.success('File Deleted successfully!');
          });
        }
        this.records = this.records.filter((p: any) => p[this.config.idProp!] !== items[0][this.config.idProp!]);
        this.service.ItemSelected$.next([]);
        this.service.headers = this.config.headers!;
        this.service.data = this.records;
        this.toastr.success('Deleted successfully!');
      });
      return;
    }

    this.loading = true;
    const deleteApiCalls = items.map((item: any) => {
      return this.restService.delete(this.config.headerApi + '(' + item[this.config.idProp!] + ')');
    });

    forkJoin(deleteApiCalls).subscribe((response: any) => {
      const ids = items.map((item: any) => item[this.config.idProp!]);
      this.records = this.records.filter((p: any) => !ids.includes(p[this.config.idProp!]));
      this.service.ItemSelected$.next([]);
      this.service.data = this.records;
      this.refreshData();
      this.loading = false;
      this.toastr.success('Deleted successfully!');
    });
  }
  // addItem() {
  //   const defaultResponsibilityCenter = this.sessionService.DefaultResponsibilityCenter;
  //   if (defaultResponsibilityCenter || this.sessionService.SuperAdmin) {
  //     this.openItemPopup('add', null);
  //   } else {
  //     this.toastr.warning('This user doesn\'t have default responsibility center.  Please contact administrator.')
  //   }
  // }
  addItem() {
    const executeCreate = () => {
      //const defaultResponsibilityCenter = this.sessionService.DefaultResponsibilityCenter;      
      const defaultResponsibilityCenter = this.sessionService.ResponsibilityCenter?.PortalResponsibilityCentre;
      if (defaultResponsibilityCenter || this.sessionService.SuperAdmin) {
        this.openItemPopup('add', null);
      } else {
        this.toastr.warning(
          "This user doesn't have default responsibility center. Please contact administrator."
        );
      }
    };

    if (this.beforeCreate.observers.length > 0) {
      this.beforeCreate.emit({
        proceed: (allow: boolean) => {
          if (allow) {
            executeCreate();
          }
        }
      });

    } else {
      executeCreate();
    }
  }

  copyItem(items: any[]) {
    if (items.length === 1) {
      this.openItemPopup('copy', items[0]);
    }
  }
  viewItem(item: any) {
    const recordId = this.getRecordValue(item, this.config.idProp!);
    this.sessionService.OpenedPopupId = this.config.pageName + '|' + recordId;
    this.openItemPopup(recordId, item);
  }
  editItem(item: any, header: TableHeader) {
    if (header.linkItemConfigs && header.linkItemConfigs.length > 0) {
      const linkRecordId = this.getRecordValue(item, header.prop);
      if (header.linkItemConfigs.length === 1) {
        this.openLinkItemPopup(linkRecordId, header, header.linkItemConfigs[0]);
      } else {
        let linkItemConfig: LinkItemConfig = header.linkItemConfigs.filter((x: any) => this.getRecordValue(item, x.property) === x.value)[0];
        if (linkItemConfig) {
          this.openLinkItemPopup(linkRecordId, header, linkItemConfig);
        } else {
          const recordId = this.getRecordValue(item, this.config.idProp!);
          this.sessionService.OpenedPopupId = this.config.pageName + '|' + recordId;
          this.openItemPopup(recordId, item);
        }
      }
    } else {
      const recordId = this.getRecordValue(item, this.config.idProp!);
      this.sessionService.OpenedPopupId = this.config.pageName + '|' + recordId;
      this.openItemPopup(recordId, item);
    }
  }
  openItemPopup(id: string, item: any) {
    if (this.config.addItemPageUrl) {
      this.router.navigate([this.config.addItemPageUrl + '/' + id]);
    } else {
      const popupId = item ? this.getRecordValue(item, this.config.idProp!) : id;
      const modalRef = this.modal.open(AddItemPopupComponent, { size: 'lg', windowClass: 'modal-dialog-scrollable', backdrop: 'static' });
      modalRef.componentInstance.itemConfig = this.config.addItemConfig;
      modalRef.componentInstance.itemConfig.headerConfig.id = id;
      modalRef.componentInstance.headerFilter = '(' + popupId + ')';
      modalRef.componentInstance.viewMode = !this.actionConfig.showEdit || !this.actionConfig.showCreate;
      modalRef.componentInstance.editPermission = this.actionConfig.showEdit;
      modalRef.componentInstance.fileUrlProp = this.config.fileUrlProp;
      modalRef.componentInstance.fileDeleteApi = this.config.fileDeleteApi!;
      modalRef.componentInstance.popupLoaded.subscribe((data: any) => {
        this.popupLoaded.emit(data);
      });
      modalRef.componentInstance.popupAddNewPostResponse.subscribe((data: any) => {
        this.popupAddNewPostResponse.emit(data);
      });
      modalRef.componentInstance.drawerStateChange.subscribe((data: any) => {
        this.drawerStateChange.emit(data);
      });
      modalRef.componentInstance.changeEvent.subscribe((data: EventDataModel) => {
        this.changeEvent.emit(data);
      });
      modalRef.componentInstance.leaveEvent.subscribe((data: FormDataModel) => {
        this.leaveEvent.emit(data);
      });
      modalRef.componentInstance.buttonClickEvent.subscribe((data: CustomButtonEvent) => {
        this.buttonClickEvent.emit(data);
      });
      modalRef.componentInstance.addLineEvent.subscribe((data: AddLineEvent) => {
        this.addLineEvent.emit(data);
      });
      modalRef.componentInstance.dropdownOpend.subscribe((data: any) => {
        this.dropdownOpend.emit(data);
      });
      modalRef.componentInstance.lineSelected.subscribe((data: any) => {
        this.lineSelected.emit(data);
      });
      modalRef.componentInstance.drawerClosed.subscribe((data: any) => {
        this.drawerClosed.emit(data);
      });
      modalRef.componentInstance.drawerOpen.subscribe((data: any) => {
        this.drawerOpen.emit(data);
      });
      modalRef.result.then((result: any) => {
        this.sessionService.OpenedPopupId = '';
        if (typeof result === 'object') {
          if (result.action === 'Update') {
            if (id === 'add' || id === 'copy') {
              this.records.unshift(result.record);
              this.service.headers = this.config.headers!;
              this.service.data = this.records;
              // this.toastr.success('Record added successfully!');
            } else {
              const index = this.records.findIndex(x => x[this.config.idProp!] === id);
              this.records[index] = this.utility.updateObject(this.records[index], result.record);
              this.service.headers = this.config.headers!;
              this.service.data = this.records;
              // this.toastr.success('Record updated successfully!');
            }
          } else if (result.action === 'Delete') {
            this.records = this.records.filter((p: any) => p[this.config.idProp!] !== id);
            this.service.ItemSelected$.next([]);
            this.service.headers = this.config.headers!;
            this.service.data = this.records;
            this.toastr.success('Deleted successfully!');
          }
        } else if (typeof result === 'boolean') {
          this.refreshData();
        }
      });
    }
  }
  refreshData() {
    const previousRecords = [...this.records];
    const previousAllData = [...this.allData];
    this.loading = true;
    this.totalAvailableCount = null;
    this.service.headers = this.config.headers!;
    this.service.searchTerm = '';
    this.service.clearCacheData(this.config.title!);
    let filter: string = '';
    let orderby: string = '';
    if (this.config.headerApiFilterField) {
      filter = "?$filter=" + this.config.headerApiFilterField + " eq '" + this.sessionService.UserId + "'";
    }
    if (this.config.filters && this.config.filters.length > 0) {
      const conditions = this.config.filters.map(x => `${x.field} ${x.operator} ${x.value}`).join(' and ');
      if (filter === '') {
        filter = "?$filter=" + conditions;
      } else {
        filter = filter + " and " + conditions;
      }
    }
    if (!this.sessionService.SuperAdmin) {
      if (this.config.filterByUserCompanyResCenter) {
        let condition: string = "CompanyId eq " + this.sessionService.Company;
        if (this.sessionService.ResponsibilityCenterId) {
          condition = condition + " and PortalResponsibilityCentre eq '" + this.sessionService.ResponsibilityCenterId + "'";
        }
        if (filter === '') {
          filter = "?$filter=" + condition;
        } else {
          filter = filter + " and " + condition;
        }
      }
    }
    if (this.config.headerApiOrderByField) {
      orderby = "&$orderby=" + this.config.headerApiOrderByField + ' desc';
    }

    // If user has applied a custom filter, keep it in place when refreshing
    if (this.currentFilterQuery) {
      const customFilter = this.currentFilterQuery;
      if (filter === '') {
        filter = "?$filter=" + customFilter;
      } else {
        filter = filter + " and " + customFilter;
      }
    }

    // If user has applied a header-click filter, keep it in place as well
    if (this.currentBcFilterClause) {
      const bcClause = this.currentBcFilterClause;
      if (filter === '') {
        filter = "?$filter=" + bcClause;
      } else {
        filter = filter + " and " + bcClause;
      }
    }

    if (filter === '') {
      filter = '?$top=' + (this.page * this._pageSize) + orderby + '&$count=true';
    } else {
      filter = filter + '&$top=' + (this.page * this._pageSize) + orderby + '&$count=true';
    }
    this.restService.get(this.config.headerApi + filter).subscribe((data: any) => {
      const totalCount = this.getResponseTotalCount(data);
      if (data.value.length) {
        this.colomnValueAll = Object.keys(data.value[0]);
        this.colomnNameDrop = Object.keys(data.value[0]);
        this.camelToNormal(this.colomnValueAll);
        for (let i = 0; i < this.colomnValueAll.length; i++) {
          let a = {
            'text': '',
            id: '',
          }
          a.id = this.colomnValueAll[i];
          a.text = this.colomnNameAll[i].trim();
          if ((a.id != '@odata.etag') && (a.id != 'Id')) {
            this.clmArray.push(a);
          }
        }
        this.dropdownfilter = true;
        for (let i = 0; i < this.config.headers!.length; i++) {
          let a = {
            'text': '',
            id: '',
            'isPrimaryLink': false,
          }
          a.id = this.config.headers![i].prop;
          a.text = this.config.headers![i].name;
          if (this.config.headers![i].isPrimaryLink) {
            a.isPrimaryLink = this.config.headers![i].isPrimaryLink!;
          }
          if ((a.id != '@odata.etag') && (a.id != 'Id')) {
            this.selectedItemsTemp.push(a);
          }
        }
        for (let j = 0; j < this.selectedItemsTemp.length; j++) {
          if (this.selectedItemsTemp[j].isPrimaryLink) {
            for (let i = 0; i < this.clmArray.length; i++) {
              if (this.clmArray[i].id == this.selectedItemsTemp[j].id) {
                this.clmArray.splice(i, 1)
              }
            }
          }
        }
        this.selectedItems = this.selectedItemsTemp.filter((obj) => {
          return obj.isPrimaryLink === false;
        });
      }
      data.value.forEach((record: any) => {
        record.selected = false;
        if (this.config.removeUnicodeCharFields?.length) {
          this.removeUnicodeChars(record);
        }
      });
      this.allData = [...data.value];
      const records = this.utility.copyObj(data.value.map((x: any) => this.updateRecordDisplayFormats(x)));
      this.records = [...records];
      this.service.setDataDirect(this.records);
      this.totaldataCount = this.records.length;
      this.loading = false;
      this.initialDataReady = true;
      setTimeout(() => {
        this.updateShowMoreButton(data.value.length, totalCount);
      }, 1000);
    }, (error) => {
      this.records = previousRecords;
      this.allData = previousAllData;
      this.service.setDataDirect(previousRecords);
      this.loading = false;
      this.initialDataReady = true;
      this.toastr.error('Unable to refresh data. Showing previous records.');
    });
  }
  openLinkItemPopup(id: string, header: TableHeader, linkItemConfig: LinkItemConfig) {
    const modalRef = this.modal.open(AddItemPopupComponent, { size: 'lg', windowClass: 'modal-dialog-scrollable', backdrop: 'static' });
    modalRef.componentInstance.itemConfig = linkItemConfig.itemConfig;
    modalRef.componentInstance.itemConfig.headerConfig.id = id;
    modalRef.componentInstance.linkMode = true;
    modalRef.componentInstance.headerData = null;
    modalRef.componentInstance.headerFilter = "?$filter=" + linkItemConfig.itemProp + " eq '" + id + "'";
    modalRef.componentInstance.fileUrlProp = this.config.fileUrlProp;
    modalRef.componentInstance.fileDeleteApi = this.config.fileDeleteApi!;
    modalRef.componentInstance.popupLoaded.subscribe((data: any) => {
      data.linkItemType = linkItemConfig.linkItemType;
      this.popupLoaded.emit(data);
    });
    modalRef.componentInstance.changeEvent.subscribe((data: EventDataModel) => {
      data.linkItemType = linkItemConfig.linkItemType;
      this.changeEvent.emit(data);
    });
    modalRef.componentInstance.leaveEvent.subscribe((data: FormDataModel) => {
      data.linkItemType = linkItemConfig.linkItemType;
      this.leaveEvent.emit(data);
    });
    modalRef.componentInstance.buttonClickEvent.subscribe((data: CustomButtonEvent) => {
      data.linkItemType = linkItemConfig.linkItemType;
      this.buttonClickEvent.emit(data);
    });
  }
  // searchData(searchText: string) {
  //   this.service.searchTerm = searchText;
  // }
  searchData(searchTerm: string) {
    if (!searchTerm || searchTerm.trim() === '') {
      this.service.setDataDirect([...this.records]);
    } else {
      this.search(searchTerm);
    }
  }
  search(searchTerm: string) {
    this.loading = true;
    const headers: any = this.config.headers;
    this.searchService.searchFromApi(this.config, headers, searchTerm).subscribe({
      next: (results: any[]) => {
        this.loading = false;
        this.service.data = results;
        if (results.length === 0) {
          this.toastr.warning('No result found!');
        }
      },
      error: () => {
        this.loading = false;
        this.toastr.error('Error fetching data');
      }
    });
  }


  onAdvanceSearch(data: AdvanceFilterModel) {
    this.advancedFilter = data;
    this.page = 1;
    this.getItems(false);
  }
  Exportexcel() {
    const ws: xlsx.WorkSheet =
      xlsx.utils.table_to_sheet(this.epltable.nativeElement);
    const wb: xlsx.WorkBook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Sheet1');
    xlsx.writeFile(wb, this.config.title + '.xlsx');
  }
  refreshPage() {
    this.refreshData();
  }
  exportPdf() {
    this.exportPdfService.exportTableToPdf(this.config.headers!, this.service.data, this.config.title!);
  }
  isValidDate(value: string) {
    const regex = new RegExp('[a-su-zA-SU-Z]*');
    if (regex.test(value)) {
      return false;
    } else {
      return true;
    }
  }
  isDataTimeData(data: string) {
    const date = new Date(data);
    if (typeof data === 'string' && !isNaN(date.getTime()) && data.includes('-') && data.includes(':')) {
      return true;
    } else {
      return false;
    }
  }
  isNumeric(prop: string): boolean {
    const sample = this.records?.[0]?.[prop];
    return typeof sample === 'number' || (!isNaN(sample) && !isNaN(parseFloat(sample)));
  }

  getRecordValue(record: any, prop?: string): any {
    if (!record || !prop) {
      return undefined;
    }

    if (record[prop] !== undefined) {
      return record[prop];
    }

    const matchKey = Object.keys(record).find((key) => key.toLowerCase() === prop.toLowerCase());
    return matchKey ? record[matchKey] : undefined;
  }

  getCellDisplayValue(record: any, header: any): any {
    return header?.isObject ? record?.['@' + header.prop] : this.getRecordValue(record, header?.prop);
  }

  getInsightHeaders(limit: number = 10): TableHeader[] {
    if (!this.selectedRecord || !Array.isArray(this.config?.headers)) {
      return [];
    }

    return this.config.headers
      .filter((header) => this.isColumnVisible(header))
      .filter((header) => this.getCellDisplayValue(this.selectedRecord, header) !== null && this.getCellDisplayValue(this.selectedRecord, header) !== undefined && this.getCellDisplayValue(this.selectedRecord, header) !== '')
      .slice(0, limit);
  }

  isDateValue(value: any): boolean {
    if (!value || typeof value !== 'string') {
      return false;
    }

    const date = new Date(value);
    return !isNaN(date.getTime()) && value.includes('-');
  }

  getInsightSignalHeaders(): TableHeader[] {
    if (!this.selectedRecord || !Array.isArray(this.config?.headers)) {
      return [];
    }

    return this.config.headers
      .filter((header) => this.isStatusField(header))
      .filter((header) => {
        const value = this.getCellDisplayValue(this.selectedRecord, header);
        return this.isStatusValue(value);
      })
      .slice(0, 4);
  }

  isStatusField(header: any): boolean {
    const name = (header?.name || '').toString().toLowerCase();
    const prop = (header?.prop || '').toString().toLowerCase();
    return name.includes('status') || name.includes('state') || prop.includes('status') || prop.includes('state');
  }

  isStatusValue(value: any): boolean {
    if (value === null || value === undefined) {
      return false;
    }

    const normalized = value.toString().trim().toLowerCase();
    if (!normalized) {
      return false;
    }

    const knownStatusKeywords = [
      'open', 'closed', 'pending', 'approved', 'rejected', 'cancelled', 'canceled',
      'draft', 'submitted', 'review', 'posted', 'released', 'initiated', 'failed', 'completed'
    ];

    return knownStatusKeywords.some((keyword) => normalized.includes(keyword));
  }

  getStatusClass(value: any): string {
    const normalized = (value || '').toString().toLowerCase();

    if (normalized.includes('approved') || normalized.includes('completed') || normalized.includes('posted')) {
      return 'dt-status-chip dt-status-success';
    }

    if (normalized.includes('pending') || normalized.includes('review') || normalized.includes('submitted') || normalized.includes('initiated')) {
      return 'dt-status-chip dt-status-warning';
    }

    if (normalized.includes('rejected') || normalized.includes('cancelled') || normalized.includes('canceled') || normalized.includes('failed')) {
      return 'dt-status-chip dt-status-danger';
    }

    if (normalized.includes('draft') || normalized.includes('open') || normalized.includes('released')) {
      return 'dt-status-chip dt-status-neutral';
    }

    return 'dt-status-chip dt-status-default';
  }

  printReport() {
    // const report = this.config.report;
    // if (report) {
    //   const url = environment.report + report.page + '?ReportName=' + report.value
    //     + '&ReportDescription=' + report.name + '&width=100&height=650';
    //   window.open(url, '_blank');
    // } else {
    //   this.toastr.warning('Please configure Report!');
    // }
  }
  // @HostListener("window:scroll", ['$event'])
  // scrollHandler({ target }: any) {
  //   setTimeout(() => {
  //     if ((target.scrollTop > window.innerHeight) && !this.loading && this.showMoreButton) {
  //       this.loading = true;
  //       this.getItems();
  //     }
  //   }, 100);
  // }

  scrollHandler(event: Event) {
    const target = event.target as HTMLElement | null;

    if (!target || this.isFetching || !this.showMoreButton) {
      return;
    }

    const remainingScroll = target.scrollHeight - target.scrollTop - target.clientHeight;

    if (remainingScroll <= 120) {
      this.getItems();
    }
  }


  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const clickedInsideMenu = target.closest('.menu-icon') || target.closest('.menu-dropdown');
    if (!clickedInsideMenu) {
      this.closeAllMenus();
    }
    // Close header filter dropdown when clicking outside
    const clickedInsideHeaderFilter = target.closest('.header-caret-wrapper') || target.closest('.header-dropdown');
    if (!clickedInsideHeaderFilter && this.openHeaderMenu) {
      this.openHeaderMenu = null;
    }
  }
  private closeAllMenus(): void {
    const data = this.service.data;
    if (data && Array.isArray(data)) {
      data.forEach((record: any) => record.menuOpen = false);
    }
  }
  ngOnDestroy() {
    this.permissionsLoadedSubscription?.unsubscribe();
    this.resCenterChangedSubscription?.unsubscribe();
    this.showLoaderSubscription?.unsubscribe();
    this.refreshDataDataTableSubscription?.unsubscribe();
  }
  selectAll(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;

    this.checkAll = checked;
    this.records.forEach(record => {
      record.selected = checked;
    });

    this.emitSelection();
  }
  private emitSelection() {
    const selectedRecords = this.records.filter(r => r.selected);

    this.service.ItemSelected$.next(selectedRecords);
    this.service.setSelectedItem(selectedRecords);
    this.service.setDataDirect([...this.records]);
  }
  selectRecord(record: any) {
    const selected = !!record.selected;

    const index = this.records.findIndex(
      x => x[this.config.idProp!] === record[this.config.idProp!]
    );

    if (index === -1) {
      return;
    }

    if (this.config.selctionType === 'single') {
      this.records.forEach(r => r.selected = false);
      this.records[index].selected = !selected;
    } else {
      this.records[index].selected = !selected;
    }

    const selectedRecords = this.records.filter(x => x.selected);

    this.checkAll =
      this.records.length > 0 &&
      selectedRecords.length === this.records.length;

    this.service.ItemSelected$.next(selectedRecords);
    this.service.setSelectedItem(selectedRecords);
    this.service.setDataDirect([...this.records]);

    this.recordSelected = this.records[index].selected;
    this.showFactBoxDetails = this.recordSelected;
    this.selectedDocumentNo = this.recordSelected
      ? this.records[index].Number
      : '';
  }
  updateRecordDisplayFormats(record: any) {
    this.config.headers!.forEach((header: TableHeader) => {
      if (header.displayFormat) {
        if (header.isObject) {
          let text: string = header.displayFormat;
          const keys = Object.keys(record[header.prop]);
          keys.forEach(key => {
            text = text.replace('{{' + header.prop + '.' + key + '}}', record[header.prop][key]);
          });
          record['@' + header.prop] = text;
        }
      }
    });
    return record;
  }
  customButtonClick(buttonData: CustomButtonEvent) {
    const checkedRecords: any[] = this.records.filter(d => d.selected);
    const selectedRecords: any[] = checkedRecords.length > 0
      ? checkedRecords
      : (this.selectedRecord ? [this.selectedRecord] : []);
    const allowMultiple = buttonData.button.allowMultiple === true;

    if (allowMultiple && selectedRecords.length > 0) {
      this.buttonClickEvent.next({
        button: buttonData.button,
        data: selectedRecords,
        lineData: selectedRecords,
        section: SectionType.List
      });
    } else if (!allowMultiple && selectedRecords.length === 1) {
      this.buttonClickEvent.next({
        button: buttonData.button,
        data: selectedRecords[0],
        section: SectionType.List
      });
    } else {
      this.toastr.warning('Please select record' + (allowMultiple ? '(s)' : '') + ' to ' + buttonData.button.name + '!');
    }
  }
  frozenColumns: Set<string> = new Set();
  toggleFreezeColumn(event: MouseEvent, columnProp: string): void {
    event.stopPropagation(); // prevent sortBy() from firing
    if (this.frozenColumns.has(columnProp)) {
      this.frozenColumns.delete(columnProp);
    } else {
      this.frozenColumns.add(columnProp);
    }
  }

  sortBy(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.records.sort((a, b) => {
      const valA = this.extractValue(a[column]);
      const valB = this.extractValue(b[column]);
      if (valA == null || valA === '') return 1;
      if (valB == null || valB === '') return -1;
      if (typeof valA === 'number' && typeof valB === 'number') {
        return this.sortDirection === 'asc' ? valA - valB : valB - valA;
      } else {
        return this.sortDirection === 'asc'
          ? valA.toString().localeCompare(valB.toString())
          : valB.toString().localeCompare(valA.toString());
      }
    });
    this.service.data = [...this.records];
  }
  private extractValue(value: any): any {
    if (typeof value === 'string' && this.isValidDate(value)) {
      return new Date(value);
    }
    return value;
  }
  openFilter(column: string): void {
    const filterTerm = prompt(`Enter filter value for "${column}":`);
    if (!filterTerm) return;
    this.records = this.records.filter(record => {
      const value = this.extractValue(record[column]);
      return value?.toString().toLowerCase().includes(filterTerm.toLowerCase());
    });
    this.service.data = [...this.records];
  }

  // toogleInfo(data: boolean) {
  //   if (this.recordSelected) {
  //     this.showFactBoxDetails = !this.showFactBoxDetails;
  //   } else {
  //     this.showFactBoxDetails = false;
  //   }
  // }
  toogleInfo(data: boolean) {
    this.showCustomFilter = false;
    if (this.selectedRow) {
      this.isShowInfo = !this.isShowInfo;
      if (this.isShowInfo) {
        this.showFactBoxDetails = true;
        this.showFactBox = true;
      } else {
        this.showFactBoxDetails = false;
        this.showFactBox = false;
      }
    } else {
      this.showFactBoxDetails = false;
      this.showFactBox = false;
      this.isShowInfo = false;
    }
  }



  selectRow(record: any) {
    const idProp = this.config.idProp!;
    const index = this.records.findIndex(r => r[idProp] === record[idProp]);
    if (index === -1) return;
    this.records.forEach(r => r.selectedRow = false);
    this.records[index].selectedRow = true;
    // this.selectedRow = this.records[index].Number;
    this.selectedRow = this.records[index][this.config.addItemConfig!.recordId!];
    this.selectedRecord = this.records[index];
    this.recordSelected = true;
    this.showFactBoxDetails = true;
    this.service.ItemSelected$.next([this.records[index]]);
    this.service.setDataDirect([...this.records]);
  }

  // TMY / Subhankar /210525 / FIlter
  // ngOnChanges(): void {
  //   this.setFilterOptions();
  // }

  ngOnChanges(): void {
    this.filterOptions = this.buildFilterOptions();
  }

  // setFilterOptions() {
  //   if (this.config.headers!.length && this.filterDropdown) {
  //     this.filterOptions = this.config.headers!.map((header) => {
  //       let type = "text";
  //       let options: any;
  //       const dropdown = this.filterDropdown.find((fd: any) => fd.fieldName === header.name);
  //       if (dropdown) {
  //         type = "dropdown";
  //         options = dropdown.fieldOptions;
  //       } else if (header.prop.toLowerCase().includes('date')) {
  //         type = "date";
  //       } else if (typeof header.prop === "number") {
  //         type = "number";
  //       }
  //       return {
  //         field: header.prop,
  //         label: header.name,
  //         type: type,
  //         options: options || (header.isObject ? [] : undefined),
  //       };
  //     });
  //   } else if (this.config.headers!.length) {
  //     this.filterOptions = this.config.headers!.map((header) => {
  //       let type = "text";
  //       if (header.prop.toLowerCase().includes('date')) {
  //         type = "date";
  //       } else if (typeof header.prop === "number") {
  //         type = "number";
  //       }
  //       return {
  //         field: header.prop,
  //         label: header.name,
  //         type: type,
  //         options: header.isObject ? [] : undefined,
  //       };
  //     });
  //   }
  // }


  customfilter(data: boolean) {
    this.isShowInfo = false;
    this.removeFilter = false;
    this.showFactBox = true;
    if (this.selectedDocumentNo) {
      this.toastr.warning('Please Unselect items!');
      this.showCustomFilter = false;
    } else {
      this.showCustomFilter = !this.showCustomFilter;
      this.showFactBoxDetails = !this.showFactBoxDetails;
      if (this.showCustomFilter) {
        this.showFactBoxDetails = true;
      }
    }
  }
  onFilterChange(filters: any) {
    // Store the current filter so it can be reapplied when the user hits Refresh
    this.currentFilterQuery = filters || null;

    if (filters) {
      this.loading = true;
      this.clearAllClickedAct = false;
      let filter = `?$filter=${filters}`;
      this.filterSubscription?.unsubscribe();
      this.filterSubscription = this.restService.get(this.config.headerApi + filter).subscribe((data: any) => {
        data.value.forEach((record: any) => {
          record.selected = false;
          if (this.config.removeUnicodeCharFields!.length > 0) {
            record = this.removeUnicodeChars(record);
          }
        });
        this.allData = [...data.value];
        const records = this.utility.copyObj(data.value.map((x: any) => this.updateRecordDisplayFormats(x)));
        this.records = [...records];
        this.service.data = this.records;
        this.totaldataCount = this.records.length;
        this.service.setCacheData(this.config.title!, records, this.page);
        this.page++;
        this.loading = false;
        this.showMoreButton = false;
        this.isFilter = true;
      }, (error) => {
        this.records = [];
        this.service.data = this.records;
        this.loading = false;
      });
      const cacheData = this.service.getCacheData(this.config.title!, this.page);
      if (cacheData && this.config.enableCache) {
        this.records = cacheData;
        this.service.data = cacheData;
        this.allData = cacheData;
        this.loading = false;
      }
    } else {
      // Filter cleared — reload fresh data
      this.onFilterClearAll();
    }
  }

  onFilterClearAll() {
    this.resetFilterState();
    this.getItems(false);
  }

  private resetFilterState() {
    this.filterSubscription?.unsubscribe();
    this.filterSubscription = undefined;
    this.page = 1;
    this.totalAvailableCount = null;
    this.currentFilterQuery = null;
    this.currentBcFilterClause = null;
    this.isFetching = false;
    this.isFilter = false;
    this.clearAllClickedAct = true;
  }

  onGroupOptionChangeByAPI(option: any) {
    this.resetFilterState();
    this.isRemoveFilter();
    if (option) {
      this.loading = true;
      let filter = `?$filter=${this.filterDropdown[0].filedLabel} eq '${option}'`;
      this.restService.get(this.config.headerApi + filter).subscribe((data: any) => {
        data.value.forEach((record: any) => {
          record.selected = false;
          if (this.config.removeUnicodeCharFields!.length > 0) {
            record = this.removeUnicodeChars(record);
          }
        });
        this.allData = [...data.value];
        const records = this.utility.copyObj(data.value.map((x: any) => this.updateRecordDisplayFormats(x)));
        this.records = [...records];
        this.service.data = this.records;
        this.totaldataCount = this.records.length;
        this.service.setCacheData(this.config.title!, records, this.page);
        this.page++;
        this.loading = false;
        this.showMoreButton = false;
      }, (error) => {
        this.records = [];
        this.service.data = this.records;
        this.loading = false;
      });
      const cacheData = this.service.getCacheData(this.config.title!, this.page);
      if (cacheData && this.config.enableCache) {
        this.records = cacheData;
        this.service.data = cacheData;
        this.allData = cacheData;
        this.loading = false;
      }
    }
    else if (!option || option == undefined) {
      this.getItems(false);
    }
  }

  onGroupOptionChangeFromUI(option: any) {
    this.service.data = [...this.records];
    if (option) {
      let fieldLabel = this.filterDropdown[0].filedLabel;
      let filterData = this.service.data.filter(
        (u) => u[fieldLabel] === option
      );
      this.service.data = [...filterData];
    }
    else {
      this.service.data = [...this.records];
    }
  }
  onGroupOptionChange(option: any) {
    if (this.isFilter) {
      this.onGroupOptionChangeFromUI(option);
    }
    else {
      this.onGroupOptionChangeByAPI(option)
    }
  }

  isRemoveFilter() {
    this.removeFilter = true;
    this.showFactBox = false;
    this.showCustomFilter = false;
    this.showFactBoxDetails = !this.showFactBoxDetails;
    this.isFilter = false;
  }

  //for api sort
  onSortChangeByAPI(sort: any) {
    this.isRemoveFilter();
    if (sort) {
      this.loading = true;
      let orderby = `&$orderby=${sort}`;
      let filter = '?$top=' + this._pageSize + '&$skip=' + '0' + orderby;
      this.restService.get(this.config.headerApi + filter).subscribe((data: any) => {
        data.value.forEach((record: any) => {
          record.selected = false;
          if (this.config.removeUnicodeCharFields!.length > 0) {
            record = this.removeUnicodeChars(record);
          }
        });
        this.allData = [...data.value];
        const records = this.utility.copyObj(data.value.map((x: any) => this.updateRecordDisplayFormats(x)));
        this.records = [...records];
        this.service.data = this.records;
        this.totaldataCount = this.records.length;
        this.service.setCacheData(this.config.title!, records, this.page);
        this.page++;
        this.loading = false;
        this.showMoreButton = false;
      }, (error) => {
        this.records = [];
        this.service.data = this.records;
        this.loading = false;
      });
      const cacheData = this.service.getCacheData(this.config.title!, this.page);
      if (cacheData && this.config.enableCache) {
        this.records = cacheData;
        this.service.data = cacheData;
        this.allData = cacheData;
        this.loading = false;
      }
    }
  }


  //for ui sort
  onSortChangeFromUI(sort: string) {
    if (this.sortColumn === sort) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = sort;
      this.sortDirection = 'asc';
    }
    let sortData = this.service.data.sort((a, b) => {
      const valA = this.extractValue(a[sort]);
      const valB = this.extractValue(b[sort]);
      if (valA == null || valA === '') return 1;
      if (valB == null || valB === '') return -1;
      if (typeof valA === 'number' && typeof valB === 'number') {
        return this.sortDirection === 'asc' ? valA - valB : valB - valA;
      } else {
        return this.sortDirection === 'asc'
          ? valA.toString().localeCompare(valB.toString())
          : valB.toString().localeCompare(valA.toString());
      }
    });
    this.service.data = [...sortData];
  }
  onSortChange(sort: string) {
    if (this.isFilter) {
      this.onSortChangeFromUI(sort);
    }
    else {
      this.onSortChangeByAPI(sort)
    }
  }
  // gridView(option: any) {
  //   this.isGridInfo = !this.isGridInfo;
  // }

  gridView(option: boolean) {
    this.isGridInfo = !!option;
  }
  getHeaderProp(index: number): string {
    return this.config?.headers?.[index]?.prop ?? '';
  }
  closePopup() {
    if (this.activeModal) {
      this.activeModal.close({
        action: 'close',
        record: null
      });
    }
  }

  onCellClick(record: any, header: any) {
    this.lastClickedColumn = header.prop;
    this.lastClickedValue = record[header.prop];
  }
  // onHeaderFilterClick(column: string) {
  //   if (!this.lastClickedValue || this.lastClickedColumn !== column) {
  //     return;
  //   }

  //   this.isBcFilterActive = true;
  //   this.bcFilterColumn = column;
  //   this.bcFilterValue = this.lastClickedValue;

  //   this.records = this.allData.filter(row =>
  //     row[column] === this.bcFilterValue
  //   );

  //   this.service.data = this.records;
  // }


  onHeaderFilterClick(column: string) {
    const selectedRecord = this.records.find((row: any) => row.selectedRow);
    const selectedRowValue =
      selectedRecord && selectedRecord[column] !== undefined && selectedRecord[column] !== null && selectedRecord[column] !== ''
        ? selectedRecord[column]
        : undefined;

    const lastClickedValue =
      this.lastClickedColumn === column &&
        this.lastClickedValue !== undefined &&
        this.lastClickedValue !== null &&
        this.lastClickedValue !== ''
        ? this.lastClickedValue
        : undefined;

    const filterValue = selectedRowValue !== undefined ? selectedRowValue : lastClickedValue;

    if (filterValue === undefined) {
      return;
    }

    // Toggle filter for this column
    if (this.activeFilterColumns.has(column)) {
      this.activeFilterColumns.delete(column);
      this.bcFilterValues.delete(column);
    } else {
      this.activeFilterColumns.add(column);
      this.bcFilterValues.set(column, filterValue);
    }

    // Reassign Set to trigger Angular change detection
    this.activeFilterColumns = new Set(this.activeFilterColumns);
    this.bcFilterValues = new Map(this.bcFilterValues);

    this.isBcFilterActive = this.activeFilterColumns.size > 0;

    // Build OData filter clause for API calls
    if (this.isBcFilterActive) {
      const clauses = Array.from(this.activeFilterColumns).map(col =>
        this.buildBcFilterClause(col, this.bcFilterValues.get(col))
      ).filter(clause => clause.length > 0);
      this.currentBcFilterClause = clauses.length > 0 ? clauses.join(' and ') : null;
    } else {
      this.currentBcFilterClause = null;
    }

    // Apply all active filters
    this.records = this.allData.filter((row: any) => {
      for (const activeCol of this.activeFilterColumns) {
        const filterVal = this.bcFilterValues.get(activeCol);
        if (row[activeCol] !== filterVal) {
          return false;
        }
      }
      return true;
    });

    this.service.setDataDirect(this.records);
    this.cdr.detectChanges();
  }

  private buildBcFilterClause(column: string, value: any): string {
    // Use string quotes for strings; leave numbers unquoted
    if (value === null || value === undefined) {
      return '';
    }

    const isNumber = typeof value === 'number' || (!isNaN(value) && value !== '');
    const formatted = isNumber ? value : `'${value}'`;
    return `${column} eq ${formatted}`;
  }


  isColumnVisible(header: any): boolean {
    return header.isPrimaryLink || !this.hiddenColumns.has(header.prop);
  }

  toggleColumn(header: any): void {
    if (header.isPrimaryLink) return;

    if (this.hiddenColumns.has(header.prop)) {
      this.hiddenColumns.delete(header.prop);
    } else {
      this.hiddenColumns.add(header.prop);
    }
  }

  // loadButtonPermissions() {
  //   const api = `/buttonPermissions`;

  //   const query =
  //     `?$filter=` +
  //     `companyId eq ${this.sessionService.Company} ` +
  //     `and pageID eq '${this.config.pageName}' ` +
  //     `and roleID eq '${this.sessionService.RoleId}'`;
  //   this.restService.get(api + query).subscribe((res: any) => {
  //     if (!res?.value?.length) {
  //       this.applyPermissions();
  //       return;
  //     }

  //     res.value.forEach((p: ButtonPermission) => {
  //       this.permissionMap.set(p.fieldName, p);

  //     });

  //     this.applyPermissions();
  //   });
  // }


  // applyPermissions() {
  //   this.applyToButtons(this.config.buttons);
  //   this.applyToButtons(this.config.topbuttons);
  //   this.applyToButtons(this.config.addItemConfig?.headerConfig?.buttons);
  //   this.applyToButtons(this.config.addItemConfig?.lineConfig?.buttons);
  // }

  // applyToButtons(buttons?: any[]) {
  //    console.log("permission=", buttons);
  //   if (!buttons?.length) return;

  //   buttons.forEach(btn => {
  //     btn.isEnable = true;
  //     btn.isVisible = false;

  //     const key = btn.label?.toUpperCase();
  //     const perm = key ? this.permissionMap.get(key) : null;

  //     console.log("permission=", perm);


  //     if (perm) {
  //       btn.isEnable = perm.IsEnable === true;
  //       btn.isVisible = perm.IsVisible === true;
  //     }
  //   });
  // }


  loadButtonPermissions() {
    if (this.sessionService.SuperAdmin) {
      this.applyPermissions();
      return;
    }

    const api = `/buttonPermissions`;

    const query =
      `?$filter=` +
      `companyId eq ${this.sessionService.Company} ` +
      `and pageID eq '${this.config.pageName}' ` +
      `and roleID eq '${this.sessionService.RoleId}'`;

    this.restService.get(api + query).subscribe((res: any) => {
      this.permissionMap.clear();
      this.listPermissionMap.clear();

      if (!res?.value?.length) {
        this.applyPermissions();
        return;
      }

      res.value.forEach((p: ButtonPermission & { sourceType?: string }) => {
        const key = (p.fieldName || '').toUpperCase();
        const sourceType = (p.sourceType || '').toUpperCase();

        if (!key) return;

        if (sourceType === 'LIST') {
          this.listPermissionMap.set(key, p);
        } else {
          this.permissionMap.set(key, p);
        }
      });

      this.applyPermissions();
    });
  }

  applyPermissions() {
    this.applyDefaultToButtons(this.config.buttons);
    this.applyDefaultToButtons(this.config.topbuttons);
    this.applyDefaultToButtons(this.config.addItemConfig?.headerConfig?.buttons);
    this.applyDefaultToButtons(this.config.addItemConfig?.lineConfig?.buttons);
    this.applyListToButtons(this.MenuButtons);
  }

  applyDefaultToButtons(buttons?: any[]) {
    if (!buttons?.length) return;

    buttons.forEach(btn => {
      // SuperAdmin => show all
      if (this.sessionService.SuperAdmin) {
        btn.isEnable = true;
        btn.isVisible = false;
        return;
      }

      btn.isEnable = true;
      btn.isVisible = false;

      const key = (btn.label || btn.name || '').toUpperCase();
      const perm = key ? this.permissionMap.get(key) : null;

      if (perm) {
        btn.isEnable = perm.IsEnable === true;
        btn.isVisible = perm.IsVisible === true;
      }
    });
  }

  applyListToButtons(buttons?: any[]) {
    if (!buttons?.length) return;

    buttons.forEach(btn => {
      // SuperAdmin => show all
      if (this.sessionService.SuperAdmin) {
        btn.isEnable = true;
        btn.isVisible = false;
        return;
      }
      btn.isEnable = true;
      btn.isVisible = false;

      const key = (btn.label || btn.name || '').toUpperCase();
      const perm = key ? this.listPermissionMap.get(key) : null;

      if (perm) {
        btn.isEnable = perm.IsEnable === true;
        btn.isVisible = perm.IsVisible === false;
      }
    });
  }


}
