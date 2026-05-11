import { Component, EventEmitter, OnDestroy, Output } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { ErpCommandConfig } from '../../shared/erp-core/models/command-config.model';
import { ActionDispatcherService } from '../../shared/erp-core/services/action-dispatcher.service';

type ActionPageContext = {
  title: string;
  module: string;
  company: string;
  viewSuffix: string;
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

  activeView = 'All';
  pageContext: ActionPageContext = this.getPageContext('/');
  pageCommands: ErpCommandConfig[] = [];
  private readonly subscriptions = new Subscription();

  constructor(
    private readonly actionDispatcher: ActionDispatcherService,
    private readonly router: Router
  ) {
    this.pageContext = this.getPageContext(this.router.url);

    this.subscriptions.add(this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.pageContext = this.getPageContext(event.urlAfterRedirects);
      }));

    this.subscriptions.add(this.actionDispatcher.pageCommands$.subscribe((commands) => {
      this.pageCommands = commands.filter((command) => !command.hidden);
    }));
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  setView(view: string): void {
    this.activeView = view;
  }

  get activeViewLabel(): string {
    return `${this.activeView} ${this.pageContext.viewSuffix}`;
  }

  get visibleCommands(): ErpCommandConfig[] {
    if (this.pageCommands.length) {
      return this.pageCommands;
    }

    return [
      { id: 'process', label: 'Process', actionKey: 'process' },
      { id: 'post', label: 'Post', actionKey: 'post' },
      { id: 'reports', label: 'Reports', actionKey: 'reports' },
      { id: 'more', label: 'More', type: 'menu', actionKey: 'more' }
    ];
  }

  runCommand(command: ErpCommandConfig): void {
    if (command.disabled) {
      return;
    }

    this.actionDispatcher.dispatch(command.actionKey ?? command.id);
  }

  private getPageContext(url: string): ActionPageContext {
    if (url.startsWith('/purchase-order')) {
      return {
        title: 'Purchase Order',
        module: 'Purchase',
        company: 'Cronus International Ltd.',
        viewSuffix: 'purchase orders'
      };
    }

    if (url.startsWith('/purchase-invoice')) {
      return {
        title: 'Purchase Invoice',
        module: 'Purchase',
        company: 'Cronus International Ltd.',
        viewSuffix: 'purchase invoices'
      };
    }

    return {
      title: 'Chart of accounts',
      module: 'General ledger',
      company: 'Cronus International Ltd.',
      viewSuffix: 'accounts'
    };
  }
}
