import { DrawerDataConfig } from "../../../../../core/models/shared/drawer-data.config";
import { FormFieldType } from "../../../../../core/models/shared/formField.enum";

export const USER_PROFILE_HEADER: DrawerDataConfig = {
  idProp: 'Id',
  api: '/portalUsers',
  title: 'User Profile',
  showHeader: false,
  isDrawerCloseAfterSave: false,

  sections: [
    {
      title: 'General Information',
      controls: [

        [
          {
            type: FormFieldType.TextBox,
            label: 'FirstName',
            name: 'First Name',
          },
          {
            type: FormFieldType.TextBox,
            label: 'LastName',
            name: 'Last Name',
          }
        ],
        [
          {
            type: FormFieldType.TextBox,
            label: 'PhoneNumber',
            name: 'Phone Number',
          }
        ],
        [
          {
            type: FormFieldType.DropDown,
            label: 'Status',
            name: 'Status',
            items: [
              { name: 'Active', value: 'Active' },
              { name: 'Inactive', value: 'Inactive' }
            ],
            bindLabel: 'name',
            bindValue: 'value',
          },
          {
            type: FormFieldType.DropDown,
            label: 'RoleId',
            name: 'Role Id',
            apiUrl: '/portalUsersRoles',
            bindLabel: 'RoleId',
            bindValue: 'RoleId',
          },
        ],
        [
          {
            type: FormFieldType.DropDown,
            label: 'DefaultResponsibilityCentre',
            name: 'Default Responsibility Centre',
          },
          {
            type: FormFieldType.DropDown,
            label: 'employeeID',
            name: 'Employee Id',
            apiUrl: '/employees',
            bindValue: 'no',
            displayFormat: '[no] - [firstName] [lastName]',
          },
        ],
        [
          {
            type: FormFieldType.DropDown,
            label: 'departmentID',
            name: 'Department ID',
            apiUrl: '/employeeDepartments',
            bindValue: 'departmentId',
            displayFormat: '[departmentId] - [departmentName]',
          },
        ]
      ]
    },

    {
      title: 'Workflow Setup',
      controls: [
        [
          {
            type: FormFieldType.Checkbox,
            label: 'enableWorkflowDelegate',
            name: 'Enable Workflow Delegate',
          },
          {
            type: FormFieldType.TextBox,
            label: 'approverGroup',
            name: 'Approver Group Id',
            readonly: true
          }
        ],
        [
          {
            type: FormFieldType.Radio,
            label: 'workflowDelegateType',
            name: 'Workflow Delegate Type',
            items: [
              { value: 'User', name: 'User' },
              { value: 'Group', name: 'Group' }
            ],
            bindLabel: 'name',
            bindValue: 'value',
          },
          {
            type: FormFieldType.DropDown,
            label: 'workflowDelegateID',
            name: 'Workflow Delegate ID',
          }
        ],
        [
          {
            type: FormFieldType.DateTime,
            label: 'delegateStart',
            name: 'Delegate Start',
            dateOnly: true,
          },
          {
            type: FormFieldType.DateTime,
            label: 'delegateEnd',
            name: 'Delegate To End',
            dateOnly: true,
          }
        ]
      ]
    },

    {
      title: 'Representative Setup',
      controls: [
        [
          {
            type: FormFieldType.Checkbox,
            label: 'enableRepresentative',
            name: 'Enable Representative',
          },
          {
            type: FormFieldType.DropDown,
            label: 'representativeID',
            name: 'Representative ID',
            apiUrl: '/portalUsers',
            bindValue: 'UserId',
            displayFormat: '[UserId] - [UserName]',
          }
        ],
        [
          {
            type: FormFieldType.DateTime,
            label: 'representativeStart',
            name: 'Representative Start Date',
            dateOnly: true,
          },
          {
            type: FormFieldType.DateTime,
            label: 'representativeEnd',
            name: 'Representative End Date',
            dateOnly: true,
          }
        ]
      ]
    }
  ]
};

USER_PROFILE_HEADER.controls = (USER_PROFILE_HEADER.sections ?? []).flatMap(section => section.controls);
