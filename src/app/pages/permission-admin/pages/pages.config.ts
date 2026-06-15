import { DataSourceConfig, EntryHeaderConfig, ListPageConfig } from '../../../shared/erp-core/public-api';

export const pagesListConfig: ListPageConfig & { dataSource: DataSourceConfig } = {
	id: 'pages',
	pageCode: 'PAGES',
	pageType: 'setup',
	defaultOpenTarget: 'list',
	title: 'Pages',
	module: 'Admin',
	viewSuffix: 'permission pages',
	dataSource: {
		endpoint: '/pages',
		keyField: 'systemId',
		documentNoField: 'code',
		pageSize: 25,
	},
	dataSurface: {
		id: 'pages-grid',
		idField: 'systemId',
		columns: [
			{ id: 'code', field: 'code', label: 'Code', isPrimary: true },
			{ id: 'name', field: 'name', label: 'Name' },
			{ id: 'module_id', field: 'module_id', label: 'Module' },
			{ id: 'route_path', field: 'route_path', label: 'Route Path' },
			{ id: 'component_key', field: 'component_key', label: 'Component Key' },
			{ id: 'is_active', field: 'is_active', label: 'Active', type: 'boolean', align: 'center' },
		],
	},
	searchFields: ['code', 'name', 'route_path', 'component_key'],
	searchPlaceholder: 'Search pages',
};

export const pagesHeaderConfig: EntryHeaderConfig = {
	dialogTitle: 'Page',
	toolbarButtons: [],
	sections: [
		{
			id: 'general',
			title: 'General',
			fields: [
				{
					key: 'module_id',
					label: 'Module',
					type: 'dropdown',
					valueType: 'text',
					required: true,
					api: '/modules',
					valueField: ['systemId', 'SystemId', 'id', 'Id', 'module_id', 'moduleId', 'ModuleId'],
					labelField: ['name', 'Name', 'code', 'Code'],
				},
				{ key: 'code', label: 'Code', type: 'text', required: true },
				{ key: 'name', label: 'Name', type: 'text', required: true },
				{ key: 'route_path', label: 'Route Path', type: 'text' },
				{ key: 'component_key', label: 'Component Key', type: 'text' },
				{ key: 'is_active', label: 'Active', type: 'boolean', valueType: 'boolean', defaultValue: true },
			],
		},
	],
};