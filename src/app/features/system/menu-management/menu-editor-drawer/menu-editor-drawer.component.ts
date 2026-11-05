import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { MenuCategoryDto, MenuDto, MenuCreateCommand } from '../menu-management.model';
import { CustomInputComponent, CustomSelectComponent, CustomToggleComponent } from '../../../../shared/components/form-components';
import { PermissionsService } from '../../resources/permissions/permissions.service';



export type MenuDrawerMode = 'create-root' | 'create-child' | 'edit' | null;

@Component({
  selector: 'app-menu-editor-drawer',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSlideToggleModule,
    MatDividerModule,
    CustomInputComponent,
    CustomSelectComponent,
    CustomToggleComponent
],
  templateUrl: './menu-editor-drawer.component.html',
  styleUrls: ['./menu-editor-drawer.component.scss'],
})
export class MenuEditorDrawerComponent implements OnChanges,OnInit {
  ngOnInit(): void {
this.searchPermission()
  }
  private readonly fb = inject(FormBuilder);
  private _permissionService=inject(PermissionsService)
  @Input({ required: true }) mode: MenuDrawerMode = null;
  @Input() category: MenuCategoryDto | null = null;
  @Input() menu: MenuDto | null = null;
  @Output() saved = new EventEmitter<MenuCreateCommand>();
  @Output() cancelled = new EventEmitter<void>();
  permissions=signal<any|null>([])
searchPermission(text?:string){
this._permissionService.getLookup(text).subscribe({
      next:x=>{this.permissions.set(x)}
    })
  }
  form = this.fb.group({
    categoryId: this.fb.nonNullable.control('', [Validators.required]),
    parentId: this.fb.control<string | null>(null),
    title: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(200)]),
    icon: this.fb.control<string | null>(null),
    order: this.fb.nonNullable.control(1, [Validators.required, Validators.min(1)]),
    route: this.fb.control<string | null>(null),
    externalUrl: this.fb.control<string | null>(null),
    permissionId: this.fb.control<string | null>(null),
    isActive: this.fb.nonNullable.control(true),
    isHidden: this.fb.nonNullable.control(false),
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['mode'] || changes['category'] || changes['menu']) {
      this.patchForm();
      this.setupUrlMutualExclusion();
    }
  }

  private patchForm(): void {
    const categoryId = this.category?.id ?? '';
    const parentId =
      this.mode === 'create-child'
        ? this.menu?.id ?? null
        : this.mode === 'edit'
        ? this.menu?.parentId ?? null
        : null;

    this.form.reset({
      categoryId,
      parentId,
      title: this.mode === 'edit' ? this.menu?.title ?? '' : '',
      icon: this.mode === 'edit' ? this.menu?.icon ?? null : null,
      order: this.mode === 'edit' ? this.menu?.order ?? 1 : 1,
      route: this.mode === 'edit' ? this.menu?.route ?? null : null,
      externalUrl: this.mode === 'edit' ? this.menu?.externalUrl ?? null : null,
      permissionId: this.mode === 'edit' ? this.menu?.permissionId ?? null : null,
      isActive: this.mode === 'edit' ? this.menu?.isActive ?? true : true,
      isHidden: this.mode === 'edit' ? this.menu?.isHidden ?? false : false,
    });
  }

  private setupUrlMutualExclusion(): void {
    const routeCtrl = this.form.controls.route;
    const externalUrlCtrl = this.form.controls.externalUrl;

    routeCtrl.valueChanges.subscribe(route => {
      if (route && externalUrlCtrl.value) {
        externalUrlCtrl.setValue(null, { emitEvent: false });
      }
    });

    externalUrlCtrl.valueChanges.subscribe(url => {
      if (url && routeCtrl.value) {
        routeCtrl.setValue(null, { emitEvent: false });
      }
    });
  }

  get titleText(): string {
    switch (this.mode) {
      case 'create-root': return 'ایجاد منوی ریشه';
      case 'create-child': return 'ایجاد زیرمنو';
      case 'edit': return 'ویرایش منو';
      default: return '';
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const rawValue = this.form.getRawValue();
    this.saved.emit(rawValue as MenuCreateCommand);
  }

  close(): void {
    this.cancelled.emit();
  }
}
