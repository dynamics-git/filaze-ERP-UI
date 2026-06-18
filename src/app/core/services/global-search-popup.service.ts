import { Injectable } from '@angular/core';
import { MenuSearchItem } from '../models/menu-item.model';
import { ConfirmationService, RunModalService } from '../../shared/erp-core/public-api';
import { RunModalContext } from '../../shared/erp-core/services/run-modal-config.token';
import { RunModalLoadingService } from '../../shared/erp-core/services/run-modal-loading.service';
import { resolveRunModalOpenTarget } from './run-modal-config-registry';
import { SessionService } from './session.service';

@Injectable({
	providedIn: 'root'
})
export class GlobalSearchPopupService {
	constructor(
		private readonly runModal: RunModalService,
		private readonly runModalLoading: RunModalLoadingService,
		private readonly confirmation: ConfirmationService,
		private readonly sessionService: SessionService,
	) {}

	async open(item: MenuSearchItem): Promise<boolean> {
		const pageId = item.pageId?.trim().toLowerCase();
		if (!pageId) {
			return false;
		}

		const target = resolveRunModalOpenTarget(pageId);
		const isSetupPage = pageId.endsWith('-setup');
		if (target === 'entry' || isSetupPage) {
			const context = this.buildRunModalContext(pageId);
			return this.openByPageId(pageId, 'entry', context);
		}

		return this.openByPageId(pageId);
	}

	async openByPageId(rawPageId?: string, forcedTarget?: 'list' | 'entry', context?: RunModalContext): Promise<boolean> {
		const pageId = rawPageId?.trim().toLowerCase();
		if (!pageId) {
			return false;
		}

		const target = forcedTarget ?? resolveRunModalOpenTarget(pageId);
		this.runModalLoading.begin();
		let opened = false;
		try {
			opened = await this.runModal.open({
				pageId,
				context,
				target,
				mode: target === 'list' ? 'modal' : undefined,
				size: target === 'list' ? 'xl' : undefined,
				allowNested: target !== 'list',
			});
		} finally {
			this.runModalLoading.end();
		}

		if (!opened) {
			const reason = this.runModal.getLastOpenFailureReason();
			const detail = reason ? ` (${reason})` : '';
			await this.confirmation.message(`Unable to open page${detail}.`);
		}

		return opened;
	}

	private buildRunModalContext(pageId: string): RunModalContext | undefined {
		if (pageId !== 'company-setup') {
			return undefined;
		}

		const companyId = this.sessionService.Company?.trim();
		if (!companyId) {
			return undefined;
		}

		return {
			recordId: companyId,
			headerData: {
				systemId: companyId,
			},
		};
	}
}

