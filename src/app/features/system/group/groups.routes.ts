import { Routes } from '@angular/router';
import { unsavedChangesGuard } from '../../../shared/guards/can-deactivate.guard';

export default [
  {
    path: '',
    loadComponent: () =>
      import('./group-list/group-list.component').then(x => x.GroupListComponent),
    data: { breadcrumb: 'گروه های کاربری' }
  },
  {
    path: 'create',canDeactivate:[unsavedChangesGuard],
    loadComponent: () =>
      import('./group-form/group-form.component').then(x => x.GroupFormComponent),
    data: { breadcrumb: 'گروه کاربری جدید' }
  },
  {
    path: ':groupId/edit',canDeactivate:[unsavedChangesGuard],
    loadComponent: () =>
      import('./group-form/group-form.component').then(x => x.GroupFormComponent),
    data: { breadcrumb: 'ویرایش گروه کاربری' }
  },
 {
    path: ':groupId/members',
    loadComponent: () =>
      import('./group-users/user-group-members.component').then(x => x.UserGroupMembersComponent),
    data: { breadcrumb: 'ویرایش اعضای گروه کاربری' }
  },
] as Routes;
