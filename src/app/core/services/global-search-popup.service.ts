import { Injectable } from '@angular/core';
import { MenuSearchItem } from '../models/menu-item.model';
import { ConfirmationService, RunModalService } from '../../shared/erp-core/public-api';
import { RunModalContext } from '../../shared/erp-core/services/run-modal-config.token';
import { RunModalLoadingService } from '../../shared/erp-core/services/run-modal-loading.service';
import { resolveRunModalConfigModule, resolveRunModalOpenTarget } from './run-modal-config-registry';
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
		if (pageId) {
			return this.openByPageId(pageId, resolveRunModalOpenTarget(pageId));
		}

		return false;
	}

	async openByPageId(rawPageId?: string, forcedTarget?: 'list' | 'entry', context?: RunModalContext): Promise<boolean> {
		const pageId = rawPageId?.trim().toLowerCase();
		if (!pageId) {
			return false;
		}

		const target = forcedTarget ?? resolveRunModalOpenTarget(pageId);
		const resolvedContext = context ?? this.resolveDefaultRunModalContext(pageId);
		this.runModalLoading.begin();
		let opened = false;
		try {
			opened = await this.runModal.open({
				pageId,
				context: resolvedContext,
				target,
				mode: 'page',
				size: 'full',
				allowNested: true,
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

	private resolveDefaultRunModalContext(pageId: string): RunModalContext | undefined {
		const companyId = this.sessionService.Company?.trim();
		if (!companyId) {
			return undefined;
		}

		const moduleRef = resolveRunModalConfigModule(pageId);
		const pageConfig = this.findPageConfig(moduleRef as Record<string, unknown> | undefined, pageId);
		const dataSource = this.toRecord(pageConfig?.['dataSource']);
		const endpoint = this.toText(dataSource?.['endpoint']).trim().toLowerCase();
		if (!endpoint.includes('/companies')) {
			return undefined;
		}

		const keyField = this.toText(dataSource?.['keyField']).trim() || 'systemId';
		return {
			recordId: companyId,
			headerData: {
				[keyField]: companyId,
			},
		};
	}

	private findPageConfig(moduleRef: Record<string, unknown> | undefined, pageId: string): Record<string, unknown> | undefined {
		if (!moduleRef) {
			return undefined;
		}

		const normalizedPageId = pageId.trim().toLowerCase();
		for (const exportedValue of Object.values(moduleRef)) {
			const config = this.toRecord(exportedValue);
			if (!config) {
				continue;
			}

			const declaredPageId = this.toText(config['pageId']).trim().toLowerCase();
			if (declaredPageId === normalizedPageId) {
				return config;
			}
		}

		return undefined;
	}

	private toRecord(value: unknown): Record<string, unknown> | undefined {
		return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : undefined;
	}

	private toText(value: unknown): string {
		return typeof value === 'string' ? value : '';
	}
}

