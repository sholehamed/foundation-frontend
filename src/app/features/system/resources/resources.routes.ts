import { Routes } from '@angular/router';

export default [
   
     {path:'',loadComponent:()=>import('./resource-list/resource-list.component').then(x=>x.ResourceListComponent) },
     {path:'create',loadComponent:()=>import('./resource-form/resource-form.component').then(x=>x.ResourceFormComponent),data:{breadcrumb: 'منبع  جدید'} },
     {path:':resourceId/edit',loadComponent:()=>import('./resource-form/resource-form.component').then(x=>x.ResourceFormComponent),data:{breadcrumb: 'ویرایش منبع'} },
     {path:':resourceId/uiResources',loadChildren:()=>import('./ui-resources/ui-resources.routes') },
     {path:':resourceId/apiResources',loadChildren:()=>import('./api-resources/api-resources.routes') },
     {path:':resourceId/permissions',loadChildren:()=>import('./permissions/permissions.routes') },
] as Routes;