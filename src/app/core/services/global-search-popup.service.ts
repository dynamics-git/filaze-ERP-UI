import { Injectable } from '@angular/core';
import { MenuSearchItem } from '../models/menu-item.model';
import { ConfirmationService, RunModalService } from '../../shared/erp-core/public-api';
import { RunModalLoadingService } from '../../shared/erp-core/services/run-modal-loading.service';
import { resolveRunModalOpenTarget } from './run-modal-config-registry';

@Injectable({
	providedIn: 'root'
})
export class GlobalSearchPopupService {
	constructor(
		private readonly runModal: RunModalService,
		private readonly runModalLoading: RunModalLoadingService,
		private readonly confirmation: ConfirmationService,
	) {}

	async open(item: MenuSearchItem): Promise<boolean> {
		const pageId = item.pageId?.trim().toLowerCase();
		if (!pageId) {
			return false;
		}

		const target = resolveRunModalOpenTarget(pageId);
		this.runModalLoading.begin();
		let opened = false;
		try {
			opened = await this.runModal.open({
				pageId,
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
			await this.confirmation.message(`Unable to open page from search${detail}.`);
		}

		return opened;
	}
}

