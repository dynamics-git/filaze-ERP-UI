import {
  AfterContentChecked,
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  OnDestroy,
  Output,
} from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import {
  ActionDispatcherService,
  CommandConfig,
  DataSourceConfig,
  PageContext,
  PageToolsConfig
} from '../../shared/erp-core/public-api';

type ActionPageContext = {
  title: string;
  module: string;
  company: string;
  viewSuffix: string;
  views?: Array<{ id: string; label: string; filter?: string }>;
  activeViewId?: string;
  tools?: PageToolsConfig;
  dataSource?: Pick<DataSourceConfig, 'supportsCreate' | 'supportsUpdate' | 'supportsDelete'>;
};

@Component({
  selector: 'app-actions',
  templateUrl: './actions.html',
  styleUrl: './actions.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Actions implements AfterViewInit, OnDestroy {
  @Output() newClick = new EventEmitter<void>();
  @Output() deleteClick = new EventEmitter<void>();
  @Output() refreshClick = new EventEmitter<void>();
  @Output() filterClick = new EventEmitter<void>();
  @Output() exportClick = new EventEmitter<void>();

  pageContext: ActionPageContext = this.getEmptyPageContext();
  activeViewId = '';
  pageCommands: CommandConfig[] = [];
  private configuredPageContext?: Partial<PageContext>;
  private readonly subscriptions = new Subscription();
  private destroyed = false;
  private viewInitialized = false;
  private pendingRefreshUrl?: string;
  private refreshTimer?: ReturnType<typeof setTimeout>;

  constructor(
    private readonly actionDispatcher: ActionDispatcherService,
    private readonly router: Router,
    private readonly changeDetector: ChangeDetectorRef,
  ) {
    this.subscriptions.add(this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.schedulePageContextRefresh(event.urlAfterRedirects);
      }));

    this.subscriptions.add(this.actionDispatcher.pageCommands$.subscribe((commands) => {
      this.pageCommands = commands.filter((command) => !command.hidden);
    }));

    this.subscriptions.add(this.actionDispatcher.pageContext$.subscribe((context) => {
      this.configuredPageContext = context ?? undefined;
      this.schedulePageContextRefresh(this.router.url);
    }));

    this.schedulePageContextRefresh(this.router.url);
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = undefined;
    }
    this.subscriptions.unsubscribe();
  }

  ngAfterViewInit(): void {
    this.viewInitialized = true;
    this.schedulePageContextRefresh(this.pendingRefreshUrl ?? this.router.url);
    this.pendingRefreshUrl = undefined;
  }

  ngAfterContentChecked(): void {
    this.changeDetector.detectChanges();
  }

  get activeViewLabel(): string {
    return this.pageContext.viewSuffix;
  }

  get pageViews(): Array<{ id: string; label: string; filter?: string }> {
    return this.pageContext.views ?? [];
  }

  get showFilterTool(): boolean {
    const tools = this.pageContext.tools;
    if (!tools) {
      return true;
    }

    return tools.filter !== false || tools.advancedFilter !== false;
  }

  get showNewAction(): boolean {
    return this.pageContext.dataSource?.supportsCreate !== false;
  }

  get showDeleteAction(): boolean {
    return this.pageContext.dataSource?.supportsDelete !== false;
  }

  get showRefreshAction(): boolean {
    return this.pageContext.tools?.refresh !== false;
  }

  get showExportTool(): boolean {
    return this.pageContext.tools?.export !== false;
  }

  get showColumnsTool(): boolean {
    return this.pageContext.tools?.columns !== false;
  }

  get visibleCommands(): CommandConfig[] {
    return this.pageCommands;
  }

  runCommand(command: CommandConfig): void {
    if (command.disabled) {
      return;
    }

    this.actionDispatcher.dispatch(command.actionKey);
  }

  setView(view: { id: string; label: string; filter?: string }): void {
    this.activeViewId = view.id;
    this.actionDispatcher.dispatch('viewChanged', {
      viewId: view.id,
      viewFilter: view.filter
    });
  }

  isViewActive(viewId: string): boolean {
    return this.activeViewId === viewId;
  }

  private schedulePageContextRefresh(url: string): void {
    if (!this.viewInitialized) {
      this.pendingRefreshUrl = url;
      return;
    }

    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    this.refreshTimer = setTimeout(() => {
      if (this.destroyed) {
        return;
      }

      this.refreshPageContext(url);
      this.refreshTimer = undefined;
    }, 0);
  }

  private refreshPageContext(url: string): void {
    const configContext = this.configuredPageContext;
    const pageContext = this.getEmptyPageContext();

    this.pageContext = {
      title: configContext?.title ?? pageContext.title,
      module: configContext?.module ?? pageContext.module,
      company: configContext?.company ?? pageContext.company,
      viewSuffix: configContext?.viewSuffix ?? pageContext.viewSuffix,
      views: configContext?.views ?? pageContext.views,
      activeViewId: configContext?.activeViewId ?? pageContext.activeViewId,
      tools: configContext?.tools ?? pageContext.tools,
      dataSource: configContext?.dataSource ?? pageContext.dataSource
    };

    const configuredActiveView = this.pageContext.activeViewId ?? this.pageContext.views?.[0]?.id ?? '';
    if (!this.activeViewId || !this.pageContext.views?.some((view) => view.id === this.activeViewId)) {
      this.activeViewId = configuredActiveView;
    }

    this.changeDetector.markForCheck();
  }

  private getEmptyPageContext(): ActionPageContext {
    return {
      title: '',
      module: '',
      company: '',
      viewSuffix: '',
      views: [],
      activeViewId: ''
    };
  }
}
