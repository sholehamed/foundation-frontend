import { Routes } from '@angular/router';

export default [
   
     {path:'',loadComponent:()=>import('./ui-resource-list/ui-resource-list.component').then(x=>x.UiResourceListComponent),data:{breadcrumb: ' رابط های کاربری منبع'} },
     {path:'create',loadComponent:()=>import('./ui-resource-form/ui-resource-form.component').then(x=>x.UiResourceFormComponent),data:{breadcrumb: ' منبع صفحه جدید'} },
     {path:':uiResourceId/edit',loadComponent:()=>import('./ui-resource-form/ui-resource-form.component').then(x=>x.UiResourceFormComponent),data:{breadcrumb: 'ویرایش منبع صفحه'} },
    

    { path: '**', redirectTo: '/notfound' }
   ,
] as Routes;