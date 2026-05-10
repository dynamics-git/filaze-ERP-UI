import { FormFieldType } from "../../../core/models/shared/formField.enum";
import { HeaderDataConfig } from "../../../core/models/shared/header-data.config";
import { LineDataConfig } from "../../../core/models/shared/line-data.config";

export const UserRoleHeaderConfig: HeaderDataConfig = {
  idProp: 'Id',
  api: '/portalUsersRoles',
  title: 'User Role',
  includeUserId: true,
  sections: [
    {
      title: 'Role Information',
      controls: [
        [
          {
            type: FormFieldType.TextBox,
            label: 'RoleId',
            name: 'Role Id',
            required: true
          },
          {
            type: FormFieldType.TextBox,
            label: 'Name',
            name: 'Name'
          }
        ],
        [
          {
            type: FormFieldType.Checkbox,
            label: 'IsSuperAdmin',
            name: 'Is Super Admin'
          }
        ]
      ]
    }
  ]
};
UserRoleHeaderConfig.controls = (UserRoleHeaderConfig.sections ?? []).flatMap(section => section.controls);

export const UserRoleLineConfig: LineDataConfig = {
  idProp: 'Id',
  headerPKProp: 'RoleId',
  lineFKProp: 'RoleId',
  api: '/portalPermissions',
  buttons: [
    {
      label: 'UserRoleUpdate',
      name: 'User Role Update',
      icon: 'bi bi-chevron-double-down',
    },
    {
      label: 'CheckAll',
      name: 'Check All',
      icon: 'bi bi-check-all',
    },
    {
      label: 'ClearAll',
      name: 'Clear All',
      icon: 'bi bi-x',
    },
    {
      label: 'UpdatePermission',
      name: 'Update Permission',
      icon: 'bi bi-shield-check',
    },
    {
      label: 'ButtonPermission',
      name: 'Button Permission',
      icon: 'bi bi-shield-check',
    },
  ],
  controls: [
    {
      type: FormFieldType.DropDown,
      label: 'ObjectName',
      name: 'Object Name',
      apiUrl: '/pageConfigurations',
      // bindLabel: 'Page',
      bindValue: 'Page',
      displayFormat: '[title] - [Page]'
    },
    {
      type: FormFieldType.Checkbox,
      label: 'ReadPermission',
      name: 'Read Permission'
    },
    {
      type: FormFieldType.Checkbox,
      label: 'InsertPermission',
      name: 'Insert Permission'
    },
    {
      type: FormFieldType.Checkbox,
      label: 'ModifyPermission',
      name: 'Modify Permission'
    },
    {
      type: FormFieldType.Checkbox,
      label: 'DeletePermission',
      name: 'Delete Permission'
    },
    {
      type: FormFieldType.Checkbox,
      label: 'PostPermission',
      name: 'Post Permission'
    }
  ]
}
