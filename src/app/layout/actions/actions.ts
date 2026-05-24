import { Component, EventEmitter, OnDestroy, Output } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { ActionDispatcherService, CommandConfig, PageContext, PageToolsConfig } from '../../shared/erp-core/public-api';

type ActionPageContext = {
  title: string;
  module: string;
  company: string;
  viewSuffix: string;
  views?: Array<{ id: string; label: string; filter?: string }>;
  activeViewId?: string;
  tools?: PageToolsConfig;
};

@Component({
  selector: 'app-actions',
  templateUrl: './actions.html',
  styleUrl: './actions.scss'
})
export class Actions implements OnDestroy {
  @Output() newClick = new EventEmitter<void>();
  @Output() deleteClick = new EventEmitter<void>();
  @Output() refreshClick = new EventEmitter<void>();
  @Output() filterClick = new EventEmitter<void>();
  @Output() exportClick = new EventEmitter<void>();

  pageContext: ActionPageContext = this.getPageContext('/');
  activeViewId = '';
  pageCommands: CommandConfig[] = [];
  private configuredPageContext?: Partial<PageContext>;
  private readonly subscriptions = new Subscription();

  constructor(
    private readonly actionDispatcher: ActionDispatcherService,
    private readonly router: Router
  ) {
    this.refreshPageContext(this.router.url);

    this.subscriptions.add(this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.refreshPageContext(event.urlAfterRedirects);
      }));

    this.subscriptions.add(this.actionDispatcher.pageCommands$.subscribe((commands) => {
      this.pageCommands = commands.filter((command) => !command.hidden);
    }));

    this.subscriptions.add(this.actionDispatcher.pageContext$.subscribe((context) => {
      this.configuredPageContext = context ?? undefined;
      this.refreshPageContext(this.router.url);
    }));
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
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

    return tools.filter !== false || tools.advancedFilter === true;
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

    this.actionDispatcher.dispatch(command.actionKey ?? command.id);
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

  private refreshPageContext(url: string): void {
    const routeContext = this.getPageContext(url);
    const configContext = this.configuredPageContext;

    this.pageContext = {
      title: configContext?.title ?? routeContext.title,
      module: configContext?.module ?? routeContext.module,
      company: configContext?.company ?? routeContext.company,
      viewSuffix: configContext?.viewSuffix ?? routeContext.viewSuffix,
      views: configContext?.views ?? routeContext.views,
      activeViewId: configContext?.activeViewId ?? routeContext.activeViewId,
      tools: configContext?.tools ?? routeContext.tools
    };

    const configuredActiveView = this.pageContext.activeViewId ?? this.pageContext.views?.[0]?.id ?? '';
    if (!this.activeViewId || !this.pageContext.views?.some((view) => view.id === this.activeViewId)) {
      this.activeViewId = configuredActiveView;
    }
  }

  private getPageContext(url: string): ActionPageContext {
    if (url.startsWith('/purchase-order')) {
      return {
        title: 'Purchase Order',
        module: 'Purchase',
        company: 'Cronus International Ltd.',
        viewSuffix: 'purchase orders',
        views: [
          { id: 'all', label: 'All' },
          { id: 'open', label: 'Open', filter: "status eq 'Open'" }
        ],
        activeViewId: 'all'
      };
    }

    return {
      title: 'Chart of accounts',
      module: 'General ledger',
      company: 'Cronus International Ltd.',
      viewSuffix: 'accounts',
      views: [
        { id: 'all', label: 'All' }
      ],
      activeViewId: 'all'
    };
  }
}
