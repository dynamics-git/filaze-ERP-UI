import { Injectable } from "@angular/core";
import { NgbModal, NgbModalRef } from "@ng-bootstrap/ng-bootstrap";
import { ModuleRegistry } from "../../models/registry/module-registry";

import { AddItemPopupComponent } from "../../../shared/components/add-item-popup/add-item-popup.component";
import { CustomButtonEvent } from "../../models/shared/customButtonEvent";
import { EventDataModel } from "../../models/shared/eventDataModel";
import { FormDataModel } from "../../models/shared/formDataModel";
import { RestService } from "../rest.service";
import { SelectedRowIndexService } from "./selected-row-index.service";
import { CustomSharedService } from "./custom-shared.service";
import { AddItemService } from "./add-item.service";

@Injectable({ providedIn: "root" })
export class UniversalPopupService {

  constructor(
    private modal: NgbModal,
    private restService: RestService,
    private selectedRowIndexService: SelectedRowIndexService,
    private customSharedService: CustomSharedService,
    private addItemService: AddItemService
  ) { }

  private cloneConfig<T>(config: T): T {
    return JSON.parse(JSON.stringify(config));
  }

  open(module: string, parentComponent?: any, id?: string): NgbModalRef | undefined {
    const entry = ModuleRegistry[module];
    if (!entry) return undefined;

    const listConfig = entry.getListConfig?.();
    const cardConfig = entry.getCardConfig?.();
    const listComponent = entry.component;

    return this.openModule(listConfig, cardConfig, listComponent, parentComponent, id);
  }

  private openModule(
    listConfig: any,
    cardConfig: any,
    listComponent: any,
    parentComponent: any,
    id?: string
  ): NgbModalRef | undefined {

    if (id) {
      const popup = this.modal.open(AddItemPopupComponent, {
        size: 'xl',
        backdrop: 'static',
        windowClass: 'modal-dialog-scrollable'
      });

      popup.componentInstance.itemConfig = cardConfig;
      popup.componentInstance.headerFilter = `(${id})`;

      this.forwardAllEvents(popup, parentComponent);

      return popup;
    }

    const listPopup = this.modal.open(listComponent, {
      size: 'xl',
      backdrop: 'static',
      windowClass: 'modal-dialog-scrollable'
    });

    listPopup.componentInstance.config = listConfig;
    listPopup.componentInstance.showTableBackButton = listConfig?.showTableBackButton;
    listPopup.componentInstance.title = listConfig?.title;

    this.forwardAllEvents(listPopup, parentComponent);

    return listPopup;
  }

  // private openModule(
  //   listConfig: any,
  //   cardConfig: any,
  //   listComponent: any,
  //   parentComponent: any,
  //   id?: string
  // ) {


  //   if (id) {
  //     const popup = this.modal.open(AddItemPopupComponent, {
  //       size: "xl",
  //       backdrop: "static",
  //       windowClass: "modal-dialog-scrollable"
  //     });

  //     popup.componentInstance.itemConfig = cardConfig;
  //     popup.componentInstance.headerFilter = `(${id})`;

  //     this.forwardAllEvents(popup, parentComponent);

  //     return;
  //   }

  //   const listPopup = this.modal.open(listComponent, {
  //     size: "xl",
  //     backdrop: "static",
  //     windowClass: "modal-dialog-scrollable"
  //   });

  //   listPopup.componentInstance.config = listConfig;

  //   listPopup.componentInstance.showTableBackButton = listConfig.showTableBackButton;
  //   listPopup.componentInstance.title = listConfig.title;

  //   listPopup.componentInstance.popupLoaded.subscribe((rowData: any) => {
  //     parentComponent?.popupLoaded?.(rowData);

  //     if (!listConfig.disableAutoCardOpen) {
  //       const idProp = cardConfig?.headerConfig?.idProp;
  //       const selectedId = rowData?.header?.[idProp];

  //       if (selectedId) {
  //         this.openModule(listConfig, cardConfig, listComponent, parentComponent, selectedId);
  //       }
  //     }
  //   });

  // }



  openCardOnly(module: string, parentComponent?: any, filterId?: string) {

    const entry = ModuleRegistry[module];
    if (!entry) return;

    const cardConfig = entry.getCardConfig();

    const popup = this.modal.open(AddItemPopupComponent, {
      size: "xl",
      backdrop: "static",
      windowClass: "modal-dialog-scrollable"
    });

    popup.componentInstance.itemConfig = cardConfig;
    popup.componentInstance.headerFilter = `(${filterId})`;

    this.forwardAllEvents(popup, parentComponent);
  }

  openCreateItem(itemConfig: any, options?: {
    headerData?: any,
    closeAfterCreate?: boolean,
    deferAutoGenerateCreate?: boolean,
    size?: 'sm' | 'md' | 'lg' | 'xl'
  }) {

    if (!itemConfig?.headerConfig) {
      return;
    }

    const popup = this.modal.open(AddItemPopupComponent, {
      size: options?.size || 'xl',
      backdrop: 'static',
      windowClass: 'modal-dialog-scrollable'
    });

    const createConfig = this.cloneConfig(itemConfig);
    createConfig.headerConfig = {
      ...(createConfig.headerConfig || {}),
      id: 'add'
    };

    popup.componentInstance.itemConfig = createConfig;
    popup.componentInstance.headerData = { ...(options?.headerData || {}) };
    popup.componentInstance.closeAfterCreate = !!options?.closeAfterCreate;
    popup.componentInstance.deferAutoGenerateCreate = !!options?.deferAutoGenerateCreate;

    return popup;
  }

  openItemCardByField(itemConfig: any, field: string, value: string | number, options?: {
    size?: 'sm' | 'md' | 'lg' | 'xl',
    headerData?: any
  }) {
    if (!itemConfig?.headerConfig?.api || !field || value === undefined || value === null || value === '') {
      return;
    }

    const popup = this.modal.open(AddItemPopupComponent, {
      size: options?.size || 'xl',
      backdrop: 'static',
      windowClass: 'modal-dialog-scrollable'
    });

    const filterValue = typeof value === 'string' ? `'${value.replace(/'/g, "''")}'` : value;
    const detailConfig = this.cloneConfig(itemConfig);
    detailConfig.headerConfig = {
      ...(detailConfig.headerConfig || {}),
      id: 'update'
    };

    popup.componentInstance.itemConfig = detailConfig;
    popup.componentInstance.headerData = options?.headerData || {};
    popup.componentInstance.headerFilter = `?$filter=${field} eq ${filterValue}`;

    return popup;
  }


  openCardByField(module: string, parentComponent: any, field: string, value: string) {
    const entry = ModuleRegistry[module];
    if (!entry) return;

    const cardConfig = entry.getCardConfig();
    const api = cardConfig.headerConfig.api;

    const filter = `?$filter=${field} eq '${value}'`;

    this.restService.get(api + filter).subscribe((res: any) => {

      if (!res.value.length) {
        return;
      }

      const systemId = res.value[0][cardConfig.headerConfig.idProp];

      this.open(module, parentComponent, systemId);
    });
  }



  openCardUsingSystemId(module: string, parent: any, systemId: string) {
    const entry = ModuleRegistry[module];
    const cardConfig = entry.getCardConfig();
    const idProp = cardConfig.headerConfig.idProp;

    const popup = this.modal.open(AddItemPopupComponent, {
      size: 'xl',
      backdrop: 'static',
      windowClass: 'modal-dialog-scrollable'
    });

    popup.componentInstance.itemConfig = cardConfig;

    popup.componentInstance.headerFilter = `?$filter=${idProp} eq ${systemId}`;

    popup.componentInstance.popupLoaded?.subscribe((data: any) => parent?.popupLoaded?.(data));
    popup.componentInstance.changeEvent?.subscribe((data: any) => parent?.changeEvent?.(data));
    popup.componentInstance.buttonClickEvent?.subscribe((data: any) => parent?.buttonClickEvent?.(data));
    popup.componentInstance.leaveEvent?.subscribe((data: any) => parent?.leaveEvent?.(data));
  }


  private forwardAllEvents(popup: any, parentComponent: any) {
    const child = popup.componentInstance;

    const safeSubscribe = (
      output: any,
      handler: (data: any) => void
    ) => {
      if (output && typeof output.subscribe === 'function') {
        output.subscribe(handler);
      }
    };

    safeSubscribe(child.popupLoaded, (d: any) =>
      parentComponent?.popupLoaded?.(d)
    );

    safeSubscribe(child.changeEvent, (d: EventDataModel) =>
      parentComponent?.changeEvent?.(d)
    );

    safeSubscribe(child.leaveEvent, (d: FormDataModel) =>
      parentComponent?.leaveEvent?.(d)
    );

    safeSubscribe(child.buttonClickEvent, (d: CustomButtonEvent) =>
      parentComponent?.buttonClickEvent?.(d)
    );

    safeSubscribe(child.addLineEvent, (d: any) =>
      parentComponent?.addLineEvent?.(d)
    );

    safeSubscribe(child.dropdownOpend, (d: any) =>
      parentComponent?.dropdownOpend?.(d)
    );
  }


  openPopupObjectForEmployeeClaim(options: {
    module: string,
    headerData?: any,
    recordId?: any,
    parentComponent: any,
    childComponent: any,
    lineId?: any
  }) {

    const entry = ModuleRegistry[options.module];
    if (!entry) {
      return;
    }
    let itemConfig = { ...entry.getCardConfig() };

    if (options.lineId) {
      itemConfig = {
        ...itemConfig, title: "Returned Lines",
      };
    }

    const popup = this.modal.open(AddItemPopupComponent, {
      size: "xl",
      backdrop: "static",
      windowClass: "modal-dialog-scrollable"
    });

    // Guard: suspend parent loader + signal bleed while this sub-popup is open
    this.addItemService.suspendHeaderAutoSave$.next(true);
    const targetDepth = this.addItemService.childModalDepth$.value + 1;
    popup.componentInstance.openedAtDepth = targetDepth;
    this.addItemService.childModalDepth$.next(targetDepth);

    popup.hidden.subscribe(() => {
      this.addItemService.suspendHeaderAutoSave$.next(false);
      this.addItemService.childModalDepth$.next(Math.max(0, this.addItemService.childModalDepth$.value - 1));
    });

    popup.componentInstance.itemConfig = itemConfig;
    popup.componentInstance.headerData = {
      ...(options.headerData || {}),
      ...(options.lineId ? { purchaseLineId: options.lineId } : {})
    };

    if (!itemConfig.hasNoHeaderApi && options.recordId) {
      popup.componentInstance.headerFilter = `(${options.recordId})`;
    }

    const child = popup.componentInstance;

    child.popupLoaded?.subscribe((d: any) =>
      options.childComponent?.popupLoaded?.(d)
    );

    child.changeEvent?.subscribe((d: any) =>
      options.childComponent?.changeEvent?.(d)
    );

    child.buttonClickEvent?.subscribe((d: any) =>
      options.childComponent?.buttonClickEvent?.(d)
    );

    child.leaveEvent?.subscribe((d: any) =>
      options.childComponent?.leaveEvent?.(d)
    );

    return popup;
  }



  openPopupObjectForButtonPermission(options: {
    module: string,
    headerData?: any,
    recordId?: any,
    parentComponent: any,
    childComponent: any,
    lineId?: any
  }) {

    const entry = ModuleRegistry[options.module];
    if (!entry) {
      return;
    }

    let itemConfig = { ...entry.getCardConfig() };

    if (options.lineId) {
      itemConfig = {
        ...itemConfig,
        lineConfig: {
          ...itemConfig.lineConfig,
          api: `/portalPermissions(${options.lineId.Id})/buttonPermissions?$filter=roleID eq '${options.lineId.RoleId}'`,
          defaultLines: 0,
          isDirectApi: true,
          idProp: "systemId",
          headerPKProp: "purchaseLineId",
          lineFKProp: "purchaseLineId"
        }
      };
    }



    const popup = this.modal.open(AddItemPopupComponent, {
      size: "lg",
      backdrop: "static",
      windowClass: "modal-dialog-scrollable"
    });

    // Guard: suspend parent loader + signal bleed while this sub-popup is open
    this.addItemService.suspendHeaderAutoSave$.next(true);
    const targetDepth = this.addItemService.childModalDepth$.value + 1;
    popup.componentInstance.openedAtDepth = targetDepth;
    this.addItemService.childModalDepth$.next(targetDepth);

    popup.hidden.subscribe(() => {
      this.addItemService.suspendHeaderAutoSave$.next(false);
      this.addItemService.childModalDepth$.next(Math.max(0, this.addItemService.childModalDepth$.value - 1));
    });

    popup.componentInstance.itemConfig = itemConfig;
    popup.componentInstance.headerData = {
      ...(options.headerData || {}),
      ...(options.lineId)
    };

    if (!itemConfig.hasNoHeaderApi && options.recordId) {
      popup.componentInstance.headerFilter = `(${options.recordId})`;
    }

    const child = popup.componentInstance;

    child.popupLoaded?.subscribe((d: any) => {
      if (options.lineId) {
        child.itemConfig.lineConfig.api =
          `/portalPermissions(${options.lineId.Id})/buttonPermissions`;
      }
      options.childComponent?.popupLoaded?.(d);
    });

    child.changeEvent?.subscribe((d: any) =>
      options.childComponent?.changeEvent?.(d)
    );

    child.buttonClickEvent?.subscribe((d: any) =>
      options.childComponent?.buttonClickEvent?.(d)
    );

    child.leaveEvent?.subscribe((d: any) =>
      options.childComponent?.leaveEvent?.(d)
    );

    return popup;
  }

  /**
   * Generic popup-on-popup entry point.
   *
   * Opens any ModuleRegistry entry inside AddItemPopupComponent. All event
   * handling is done via callbacks — no child component instantiation needed.
   *
   * @param key  Key in ModuleRegistry (e.g. 'changeAllocation', 'PrePayment')
   * @param options.headerData        Merged into popup headerData
   * @param options.lineApiOverrideConfig  Shallow-merged onto lineConfig (use for dynamic API paths)
   * @param options.size              Modal size (default 'md')
   * @param options.onLoaded          Fires when AddItemPopupComponent emits popupLoaded.
   *                                  Receives data + _itemConfig (live reference for config mutation)
   * @param options.onChangeEvent     Fires on changeEvent
   * @param options.onButtonClick     Fires on buttonClickEvent
   * @param options.onLeave           Fires on leaveEvent
   * @param options.suspendAutoSave   Pauses parent header auto-save while popup is open; resumes on close
   * @param options.validateOnClose   Async callback — return true to allow close, false to block.
   *                                  Service wires popupCloseRequest$ automatically; caller only writes the business rule.
   */
  openModulePopup(key: string, options: {
    headerData?: any;
    lineApiOverrideConfig?: Record<string, any>;
    recordId?: any;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    onLoaded?: (data: any) => void;
    onChangeEvent?: (data: any) => void;
    onButtonClick?: (data: any) => void;
    onLeave?: (data: any) => void;
    suspendAutoSave?: boolean;
    validateOnClose?: () => Promise<boolean>;
  }): any {

    const entry = ModuleRegistry[key];
    if (!entry) return;

    let itemConfig = { ...entry.getCardConfig() };

    if (options.lineApiOverrideConfig) {
      itemConfig = {
        ...itemConfig,
        lineConfig: {
          ...itemConfig.lineConfig,
          ...options.lineApiOverrideConfig
        }
      };
    }

    const popup = this.modal.open(AddItemPopupComponent, {
      size: options.size || 'md',
      backdrop: 'static',
      windowClass: 'modal-dialog-scrollable'
    });

    // The child popup's ngOnDestroy calls resetSelectedRowIndex() which resets the singleton to 0.
    // Save the current index now and restore it after the child closes — so the parent popup
    // always knows which row was selected, regardless of what the child does.
    const savedRowIndex = this.selectedRowIndexService.getSelectedRowIndex();

    // suspendAutoSave: block parent header auto-save + cross-popup signal bleed while this popup is open
    if (options.suspendAutoSave) {
      this.addItemService.suspendHeaderAutoSave$.next(true);
      const targetDepth = this.addItemService.childModalDepth$.value + 1;
      // Tell the child popup what depth it lives at, so its showLoader$ guard only suppresses
      // signals from ITS OWN children — not suppress its own loader.
      popup.componentInstance.openedAtDepth = targetDepth;
      this.addItemService.childModalDepth$.next(targetDepth);
    }

    // validateOnClose: wire popupCloseRequest$ → caller's business rule → sendCloseApproval
    if (options.validateOnClose) {
      const closeSub = this.customSharedService.popupCloseRequest$.subscribe(async () => {
        const canClose = await options.validateOnClose!();
        this.customSharedService.sendCloseApproval(canClose);
      });
      popup.hidden.subscribe(() => closeSub.unsubscribe());
    }

    popup.hidden.subscribe(() => {
      if (options.suspendAutoSave) {
        this.addItemService.suspendHeaderAutoSave$.next(false);
        const depth = this.addItemService.childModalDepth$.value;
        this.addItemService.childModalDepth$.next(Math.max(0, depth - 1));
      }
      this.selectedRowIndexService.setSelectedRowIndex(savedRowIndex);
    });

    popup.componentInstance.itemConfig = itemConfig;
    popup.componentInstance.headerData = { ...(options.headerData || {}) };

    if (!itemConfig.hasNoHeaderApi && options.recordId) {
      popup.componentInstance.headerFilter = `(${options.recordId})`;
    }

    const child = popup.componentInstance;

    if (options.onLoaded) {
      // Pass _itemConfig + _instance so the callback can mutate live config and headerData
      child.popupLoaded?.subscribe((d: any) => options.onLoaded!({ ...d, _itemConfig: itemConfig, _instance: child }));
    }
    if (options.onChangeEvent) {
      child.changeEvent?.subscribe((d: any) => options.onChangeEvent!(d));
    }
    if (options.onButtonClick) {
      child.buttonClickEvent?.subscribe((d: any) => options.onButtonClick!(d));
    }
    if (options.onLeave) {
      child.leaveEvent?.subscribe((d: any) => options.onLeave!(d));
    }

    return popup;
  }




}
