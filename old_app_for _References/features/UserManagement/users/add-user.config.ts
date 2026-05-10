import { FormFieldType } from "../../../core/models/shared/formField.enum";
import { HeaderDataConfig } from "../../../core/models/shared/header-data.config";

export const AddUserConfig: HeaderDataConfig = {
  idProp: 'Id',
  api: '/portalUsers',
  title: 'User',
  patchUserId: false,
  buttons: [{
    label: 'assignRepresentative',
    name: 'Assign Representative',
    icon: 'bi bi-send'
  }, {
    label: 'cancelRepresentative',
    name: 'Cancel Representative',
    icon: 'bi bi-send'
  },],
  sections: [
    {
      title: 'General Information',
      controls: [
        [
          {
            type: FormFieldType.TextBox,
            label: 'UserId',
            name: 'User Id',
            required: true
          },
          {
            type: FormFieldType.Email,
            label: 'Email',
            name: 'Log In Email',
            required: true
          },
        ],
        [
          {
            type: FormFieldType.Password,
            label: 'PasswordHash',
            name: 'Password',
            required: true,
            encryptPassword: true
          },
          {
            type: FormFieldType.TextBox,
            label: 'PhoneNumber',
            name: 'Phone Number',
            //required: true
          }
        ],
        [
          {
            type: FormFieldType.TextBox,
            label: 'FirstName',
            name: 'First Name',
            required: true
          },
          {
            type: FormFieldType.TextBox,
            label: 'LastName',
            name: 'Last Name',
            //required: true
          }
        ],
        [

          {
            type: FormFieldType.DropDown,
            label: 'Status',
            name: 'Status',
            items: [
              { name: 'Active', value: 'Active' },
              { name: 'Inactive', value: 'Inactive' }],
            bindLabel: 'name',
            bindValue: 'value'
          },
          {
            type: FormFieldType.DropDown,
            label: 'RoleId',
            name: 'Role Id',
            apiUrl: '/portalUsersRoles',
            bindLabel: 'RoleId',
            bindValue: 'RoleId'
          },
        ],
        [
          {
            type: FormFieldType.DropDown,
            label: 'DefaultResponsibilityCentre',
            name: 'Default Responsibility Centre'
          },
          {
            type: FormFieldType.DropDown,
            label: 'employeeID',
            name: 'Employee Id',
            apiUrl: '/employees',
            bindValue: 'no',
            displayFormat: '[no] - [firstName] [lastName]'
          },
        ],
        [
          {
            type: FormFieldType.DropDown,
            label: 'departmentID',
            name: 'Department ID',
            apiUrl: '/employeeDepartments',
            bindValue: 'departmentId',
            displayFormat: '[departmentId] - [departmentName]'
          },
        ]
      ]
    },

    {
      title: 'Workflow Setup',
      controls: [
        [{
          type: FormFieldType.Checkbox,
          label: 'enableWorkflowDelegate',
          name: 'Enable Workflow Delegate',
        }, {
          type: FormFieldType.DropDown,
          label: 'approverGroup',
          name: 'Approver Group Id',
          apiUrl: '/approvalGroups',
          bindValue: 'Code',
          displayFormat: '[Code]'
        }],
        [
          // {
          //   type: FormFieldType.DropDown,
          //   label: 'workflowDelegateType',
          //   name: 'Workflow Delegate Type',
          //   items: [
          //     {
          //       value: 'User',
          //       name: 'User'
          //     },
          //     {
          //       value: 'Group',
          //       name: 'Group',
          //     }
          //   ],
          //   bindLabel: 'name',
          //   bindValue: 'value'
          // },
          {
            type: FormFieldType.Radio,
            label: 'workflowDelegateType',
            name: 'Workflow Delegate Type',
            items: [
              { value: 'User', name: 'User' },
              { value: 'Group', name: 'Group' }
            ],
            bindLabel: 'name',
            bindValue: 'value'
          },
          {
            type: FormFieldType.DropDown,
            label: 'workflowDelegateID',
            name: 'Workflow Delegate ID',
          }
        ],
        // [
        //   {
        //     type: FormFieldType.Checkbox,
        //     label: 'workflowDelegateToUser',
        //     name: 'Delegate To User',
        //   },
        //   {
        //     type: FormFieldType.Checkbox,
        //     label: 'workflowDelegateToGroup',
        //     name: 'Delegate To Group',
        //   }
        // ],
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
            dateOnly: true
          }
        ]
      ]
    },

    {
      title: 'Representative Setup',
      controls: [
        [{
          type: FormFieldType.Checkbox,
          label: 'enableRepresentative',
          name: 'Enable Representative',
          readonly: true
        }, {
          type: FormFieldType.DropDown,
          label: 'representativeID',
          name: 'Representative ID',
          apiUrl: '/portalUsers',
          bindValue: 'UserId',
          displayFormat: '[UserId] - [UserName]'
        }],
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
            dateOnly: true
          }
        ],
        // [{
        //   type: FormFieldType.Checkbox,
        //   label: 'isRepresentor',
        //   name: 'Is Representor',
        // }],
      ]
    }
  ]
};

AddUserConfig.controls = (AddUserConfig.sections ?? []).flatMap(section => section.controls);