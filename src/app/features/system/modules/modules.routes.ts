import { Routes } from '@angular/router';

export default [
   
     {path:'',loadComponent:()=>import('./module-list/module-list.component').then(x=>x.ModuleListComponent) },
     {path:'create',loadComponent:()=>import('./module-form/module-form.component').then(x=>x.ModuleFormComponent) ,data:{breadcrumb:'ماژول جدید'}},
     {path:':moduleId/edit',loadComponent:()=>import('./module-form/module-form.component').then(x=>x.ModuleFormComponent),data:{breadcrumb:'ویرایش ماژول'} },
] as Routes;