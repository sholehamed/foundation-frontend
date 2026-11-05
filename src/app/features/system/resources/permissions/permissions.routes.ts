import { Routes } from '@angular/router';

export default [
   
     {path:'',loadComponent:()=>import('./permission-list/permission-list.component').then(x=>x.PermissionListComponent) ,data:{breadcrumb:'مدیریت مجوزها'}},
     {path:'create',loadComponent:()=>import('./permission-form/permission-form.component').then(x=>x.PermissionFormComponent),data:{breadcrumb: ' مجوز جدید'} },
     {path:':permissionId/edit',loadComponent:()=>import('./permission-form/permission-form.component').then(x=>x.PermissionFormComponent),data:{breadcrumb: 'ویرایش مجوز'} },
    

    { path: '**', redirectTo: '/notfound' }
   ,
] as Routes;