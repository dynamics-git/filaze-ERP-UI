import { Component, OnInit, Input, EventEmitter, Output, ViewChildren, QueryList, ViewChild, ElementRef, OnDestroy, TemplateRef, ChangeDetectorRef, Inject, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { DOCUMENT, DatePipe } from '@angular/common';

import { ToastrService } from 'ngx-toastr';
import { forkJoin, Observable, Subscription } from 'rxjs';
import { __values } from 'tslib';
import * as xlsx from 'xlsx';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { ActionsConfig } from '../../../core/models/shared/actionsConfig';
import { FactBoxType } from '../../../core/models/shared/fact-box.enum';
import { AdvanceFilterModel } from '../../../core/models/shared/advance-filter.model';
import { DataTableConfig } from '../../../core/models/shared/dataTableConfig';
import { EventDataModel, SectionType } from '../../../core/models/shared/eventDataModel';
import { FormDataModel } from '../../../core/models/shared/formDataModel';
import { CustomButtonEvent } from '../../../core/models/shared/customButtonEvent';
import { AddLineEvent } from '../../../core/models/shared/add-line-event';
import { SortableHeaderDirective } from '../../../shared/directives/sortable-header.directive';
import { RestService } from '../../../core/services/rest.service';
import { DataTableService } from '../../../core/services/shared/data-table.service';
import { SessionService } from '../../../core/services/session.service';
import { AddItemService } from '../../../core/services/shared/add-item.service';
import { Utility } from '../../../core/services/utility.service';
import { SortEvent } from '../../../core/services/models/shared/sort-event.model';
import { LinkItemConfig, TableHeader } from '../../../core/models/shared/tableHeader';
import { ExportPdfService } from '../../../core/services/shared/export-pdf.service';
import { TemplateAddItemPopupComponent } from '../template-add-item-popup/template-add-item-popup.component';
import { NgxSelectDropdownComponent } from 'ngx-select-dropdown';
import { GlobalApiUiSearchService } from '../../../core/services/shared/global-api-ui-search.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

const PrimaryWhite = '#ffffff';
const SecondaryGrey = '#ccc';


@Component({
  standalone: false,
  selector: 'app-template-data-table',
  templateUrl: './template-data-table.component.html',
  styleUrl: './template-data-table.component.scss'
})
export class TemplateDataTableComponent implements OnInit, OnDestroy {
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
  totaldataCount: number = 0;
  checkAll: boolean = false;
  page: number = 1;
  _pageSize: number = 50;
  showMoreButton: boolean = false;
  showFactBox: boolean = false;
  recordSelected: boolean = false;
  showFactBoxDetails: boolean = false;
  selectedDocumentNo!: string;
  selectedRow!: string;
  clearAllClickedAct: boolean = false;
  isShowInfo: boolean = false;
  isGridInfo: boolean = false;

  filterOptions: any[] = [];
  sortOption: any;
  showCustomFilter: boolean = false;
  isFilter: boolean = false;
  removeFilter: boolean = false;
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
    private utility: Utility) {
    service.pageSize = 50;
    service.pagination = false;
    this.data$ = service.data$;
    this.total$ = service.total$;
    this.advancedFilter = {
      searchTerm: '',
      selectedColumn: undefined
    };
  }

  public primaryColour = PrimaryWhite;
  public secondaryColour = SecondaryGrey;
  public coloursEnabled = false;
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
    if (this.config.factBoxConfig) {
      // this.showFactBox = true;
      this.actionConfig.showInformation = true;
    }

    if (this.config && this.config.enableCache === false) {
    } else {
      this.config.enableCache = true;
    }

    if (this.config && this.config.showCreate === false) {
      this.config.showCreate = false;
    } else {
      this.config.showCreate = true;
    }

    if (this.config && this.config.showDelete === false) {
      this.config.showDelete = false;
    } else {
      this.config.showDelete = true;
    }

    if (this.config && this.config.showEdit === false) {
      this.config.showEdit = false;
    } else {
      this.config.showEdit = true;
    }

    if (this.config && !this.config.removeUnicodeCharFields) {
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
      this.loading = data;
      this.cdr.detectChanges();
    });
    this.sortOption = this.config.headers;
    this.service.popupTaggle = '';
  }

  private removeUnicodeChars(record: any) {
    this.config.removeUnicodeCharFields!.forEach((item: string) => {
      record[item] = record[item].replace('_x0020_', ' ');
    });

    return record;
  }

  getItems(callCache: boolean = true) {
    this.loading = true;
    const cacheData = this.service.getCacheData(this.config.title!, this.page);
    this.service.headers = this.config.headers!;
    this.service.searchTerm = '';
    if (callCache && cacheData && this.config.enableCache) {
      this.records = cacheData;
      this.service.data = cacheData;
      this.allData = cacheData;
      this.loading = false;
    } else {
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

      if (this.advancedFilter && this.advancedFilter.searchTerm && this.advancedFilter.selectedColumn) {
        const condition = "contains(" + this.advancedFilter.selectedColumn + ", '" + this.advancedFilter.searchTerm + "')";
        if (filter === '') {
          filter = "?$filter=" + condition;
        } else {
          filter = filter + " and " + condition;
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
        filter = '?$top=' + this._pageSize + '&$skip=' + ((this.page - 1) * this._pageSize) + orderby;
      } else {
        filter = filter + '&$top=' + this._pageSize + '&$skip=' + ((this.page - 1) * this._pageSize) + orderby;
      }

      this.restService.get(this.config.headerApi + filter).subscribe((data: any) => {
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

        this.allData = [...this.allData, ...data.value];
        const records = this.utility.copyObj(data.value.map((x: any) => this.updateRecordDisplayFormats(x)));
        this.records = [...this.records, ...records];
        this.service.data = this.records;
        this.selectRow(this.service.data[0]);    // Select first row by default
        this.totaldataCount = this.records.length;
        this.service.setCacheData(this.config.title!, records, this.page);
        this.page++;
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

        setTimeout(() => {
          if (data.value.length < this._pageSize) {
            this.showMoreButton = false;
          } else {
            this.showMoreButton = true;
          }
        }, 1000);
      }, (error) => {
        this.records = [];
        this.service.data = this.records;
        this.loading = false;
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

  deleteItem(items: any[]) {
    if (items.length === 1) {
      const ref = this.modal.open(ConfirmDialogComponent, { windowClass: 'modal-dialog-confirm' });
      ref.componentInstance.showAsNotification = false;
      ref.componentInstance.message = 'Are you sure you want to delete this item? This action cannot be undone.';
      ref.componentInstance.yesButtonText = 'Yes, Delete';
      ref.result.then((value: boolean) => {
        if (value) {
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
        }
      });
    } else {
      const ref = this.modal.open(ConfirmDialogComponent, { windowClass: 'modal-dialog-confirm' });
      ref.componentInstance.showAsNotification = false;
      ref.componentInstance.message = 'Are you sure you want to delete this item? This action cannot be undone.';
      ref.componentInstance.yesButtonText = 'Yes, Delete';
      ref.result.then((value: boolean) => {
        if (value) {
          this.loading = true;
          const deleteApiCalls = items.map((item: any) => {
            return this.restService.delete(this.config.headerApi + '(' + item[this.config.idProp!] + ')');
          });
          forkJoin(deleteApiCalls).subscribe((response: any) => {
            // const fileUrl = items[0][this.config.fileUrlProp!];
            // if (fileUrl && this.config.fileDeleteApi) {
            //   this.restService.delete(this.config.fileDeleteApi + '/' + fileUrl).subscribe((res: any) => {
            //     this.toastr.success('File Deleted successfully!');
            //   });
            // }

            const ids = items.map((item: any) => item[this.config.idProp!]);
            this.records = this.records.filter((p: any) => !ids.includes(p[this.config.idProp!]));
            this.service.ItemSelected$.next([]);
            //this.service.headers = [...this.config.headers];
            this.service.data = this.records;
            this.refreshData();
            this.loading = false;
            this.toastr.success('Deleted successfully!');
          });
        }
      });
    }
  }

  addItem() {
    // const defaultResponsibilityCenter = this.sessionService.DefaultResponsibilityCenter;
    const defaultResponsibilityCenter = this.sessionService.ResponsibilityCenter?.PortalResponsibilityCentre;
    if (defaultResponsibilityCenter || this.sessionService.SuperAdmin) {
      this.openItemPopup('add', null);
    } else {
      this.toastr.warning('This user doesn\'t have default responsibility center.  Please contact administrator.')
    }
  }

  copyItem(items: any[]) {
    if (items.length === 1) {
      this.openItemPopup('copy', items[0]);
    }
  }

  viewItem(item: any) {
    this.sessionService.OpenedPopupId = this.config.pageName + '|' + item[this.config.idProp!];
    this.openItemPopup(item[this.config.idProp!], item);
  }

  editItem(item: any, header: TableHeader) {
    if (header.linkItemConfigs && header.linkItemConfigs.length > 0) {
      if (header.linkItemConfigs.length === 1) {
        this.openLinkItemPopup(item[header.prop], header, header.linkItemConfigs[0]);
      } else {
        let linkItemConfig: LinkItemConfig = header.linkItemConfigs.filter((x: any) => item[x.property] === x.value)[0];
        if (linkItemConfig) {
          this.openLinkItemPopup(item[header.prop], header, linkItemConfig);
        } else {
          this.sessionService.OpenedPopupId = this.config.pageName + '|' + item[this.config.idProp!];
          this.openItemPopup(item[this.config.idProp!], item);
        }
      }
    } else {
      this.sessionService.OpenedPopupId = this.config.pageName + '|' + item[this.config.idProp!];
      this.openItemPopup(item[this.config.idProp!], item);
    }
  }

  openItemPopup(id: string, item: any) {
    if (this.config.addItemPageUrl) {
      this.router.navigate([this.config.addItemPageUrl + '/' + id]);
    } else {
      const modalRef = this.modal.open(TemplateAddItemPopupComponent, { size: 'xl', windowClass: 'modal-dialog-scrollable', backdrop: 'static' });
      modalRef.componentInstance.itemConfig = this.config.addItemConfig;
      modalRef.componentInstance.itemConfig.headerConfig.id = id;
      modalRef.componentInstance.headerFilter = item ? "(" + item[this.config.idProp!] + ")" : '(' + id + ')';
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
    this.loading = true;
    this.service.headers = this.config.headers!;
    this.service.searchTerm = '';
    this.allData = [];
    this.records = [];
    this.service.clearCacheData();
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

    if (filter === '') {
      filter = '?$top=' + (this.page * this._pageSize) + orderby;
    } else {
      filter = filter + '&$top=' + (this.page * this._pageSize) + orderby;
    }

    this.restService.get(this.config.headerApi + filter).subscribe((data: any) => {
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
      });

      this.allData = [...this.allData, ...data.value];
      const records = this.utility.copyObj(data.value.map((x: any) => this.updateRecordDisplayFormats(x)));
      this.records = [...this.records, ...records];
      this.service.data = this.records;
      this.totaldataCount = this.records.length;
      this.loading = false;

      setTimeout(() => {
        if (data.value.length < this._pageSize) {
          this.showMoreButton = false;
        } else {
          this.showMoreButton = true;
        }
      }, 1000);
    }, (error) => {
      this.records = [];
      this.service.data = this.records;
      this.loading = false;
    });
  }

  openLinkItemPopup(id: string, header: TableHeader, linkItemConfig: LinkItemConfig) {
    const modalRef = this.modal.open(TemplateAddItemPopupComponent, { size: 'xl', windowClass: 'modal-dialog-scrollable', backdrop: 'static' });
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
    this.service.data = [];
    if (!searchTerm || searchTerm.trim() === '') {
      this.getItems(false);
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
    this.service.data = [];
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

  @HostListener("window:scroll", ['$event'])
  scrollHandler({ target }: any) {
    setTimeout(() => {
      if ((target.scrollTop > window.innerHeight) && !this.loading && this.showMoreButton) {
        this.loading = true;
        this.getItems();
      }
    }, 100);
  }
  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const clickedInsideMenu = target.closest('.menu-icon') || target.closest('.menu-dropdown');

    if (!clickedInsideMenu) {
      this.closeAllMenus();
    }
  }

  private closeAllMenus(): void {
    const data = this.service.data;
    if (data && Array.isArray(data)) {
      data.forEach((record: any) => record.menuOpen = false);
    }
  }

  ngOnDestroy() {
    this.permissionsLoadedSubscription ? this.permissionsLoadedSubscription.unsubscribe() : null;
  }

  selectAll(event: any) {
    // if (this.config.selctionType === 'single') {
    // } else {
    //   this.checkAll = !this.checkAll;
    //   this.records.map(s => s.selected = this.checkAll);
    // }
    const checked = event.target.checked;
    this.checkAll = checked;
    this.records.forEach(record => record.selected = checked);
    this.emitSelection();
    // const slectedRecords = this.records.filter(x => x.selected);
    // this.service.ItemSelected$.next(slectedRecords);
    // this.service.data = this.records;
  }

  private emitSelection() {
    const selectedRecords = this.records.filter(r => r.selected);
    this.service.ItemSelected$.next(selectedRecords);
    this.service.data = this.records;
  }

  selectRecord(record: any) {
    const selected = record.selected;
    const index = this.records.findIndex(x => x[this.config.idProp!] == record[this.config.idProp!]);
    if (this.config.selctionType === 'single') {
      this.records.map(s => s.selected = false);
      this.records[index].selected = !selected;
    } else {
      this.records[index].selected = !selected;
      const selectedRecords: any[] = this.records.filter(d => d.selected);
      if (selectedRecords.length === 0) {
        this.checkAll = false;
      } else {
        this.checkAll = true;
        this.service.ItemSelected$.next(selectedRecords);
        this.service.data = this.records;
      }
    }
    const slectedRecords = this.records.filter(x => x.selected);
    this.service.ItemSelected$.next(slectedRecords);
    this.service.data = this.records;
    this.recordSelected = this.records[index].selected;
    this.showFactBoxDetails = this.recordSelected;
    if (this.records[index].selected) {
      this.selectedDocumentNo = this.records[index].Number;
    } else {
      this.selectedDocumentNo = '';
    }
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
    const selectedRecords: any[] = this.records.filter(d => d.selected);
    if (selectedRecords.length === 1) {
      this.buttonClickEvent.next({
        button: buttonData.button,
        data: selectedRecords[0],
        section: SectionType.List
      });
    } else {
      this.toastr.warning('Please select record to ' + buttonData.button.name + '!');
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
    this.recordSelected = true;
    this.showFactBoxDetails = true;
    this.service.ItemSelected$.next([this.records[index]]);
    this.service.data = this.records;
  }






  // TMY / Subhankar /210525 / FIlter

  ngOnChanges(): void {
    this.setFilterOptions();
  }

  setFilterOptions() {
    if (this.config.headers!.length && this.filterDropdown) {
      this.filterOptions = this.config.headers!.map((header) => {
        let type = "text";
        let options: any;
        const dropdown = this.filterDropdown.find((fd: any) => fd.fieldName === header.name);
        if (dropdown) {
          type = "dropdown";
          options = dropdown.fieldOptions;
        } else if (header.prop.toLowerCase().includes('date')) {
          type = "date";
        } else if (typeof header.prop === "number") {
          type = "number";
        }
        return {
          field: header.prop,
          label: header.name,
          type: type,
          options: options || (header.isObject ? [] : undefined),
        };
      });
    } else if (this.config.headers!.length) {
      this.filterOptions = this.config.headers!.map((header) => {
        let type = "text";
        if (header.prop.toLowerCase().includes('date')) {
          type = "date";
        } else if (typeof header.prop === "number") {
          type = "number";
        }
        return {
          field: header.prop,
          label: header.name,
          type: type,
          options: header.isObject ? [] : undefined,
        };
      });
    }
  }

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
    if (filters) {
      this.loading = true;
      this.clearAllClickedAct = false;
      let filter = `?$filter=${filters}`;
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
    }
    // else {
    //   this.page = 1;
    //   this.getItems(false);
    //   this.showMoreButton = true;
    // }
  }

  onFilterClearAll() {
    this.records = [];
    this.service.data = [];
    this.allData = [];
    this.page = 1;
    this.getItems(false);
    this.isFilter = false;
    this.clearAllClickedAct = true;
  }


  onGroupOptionChangeByAPI(option: any) {
    this.onFilterClearAll();
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

  gridView(option: any) {
    console.log("option=", option);
    this.isGridInfo = !this.isGridInfo;
  }
  getHeaderProp(index: number): string {
    return this.config?.headers?.[index]?.prop ?? '';
  }



}




