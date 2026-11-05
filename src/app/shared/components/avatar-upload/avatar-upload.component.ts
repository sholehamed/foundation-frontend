import {
  Component,
  ElementRef,
  ViewChild,
  OnDestroy,
  forwardRef,
  ChangeDetectorRef,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';
import { FileService } from './upload.service';

@Component({
  selector: 'app-avatar-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './avatar-upload.component.html',
  styleUrls: ['./avatar-upload.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AvatarUploadComponent),
      multi: true,
    },
  ],
})
export class AvatarUploadComponent
  implements ControlValueAccessor, OnDestroy, OnChanges
{
  @Input() value: string | null = null;
  @Input() label: string | null = null;

  // برای گرید معمولا false بگذار
  @Input() editable = true;

  // اگر خواستی سایز در گرید کوچک‌تر باشد
  @Input() size = 120;
@Input() refresh=true
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  imageSrc: string | null = null;
  imageId: string | null = null;

  isUploading = false;
  disabled = false;

  private objectUrl: string | null = null;

  private onChange: (value: string | null) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(
    private fileService: FileService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value']) {
      this.setImageId(this.value);
    }
  }

  writeValue(value: string | null): void {
    this.setImageId(value);
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  openFilePicker(): void {
    if (this.disabled || !this.editable) return;

    this.onTouched();
    this.fileInput?.nativeElement.click();
  }

  onFileChange(event: Event): void {
    if (this.disabled || !this.editable) return;

    const input = event.target as HTMLInputElement;

    if (!input.files?.length) return;

    const file = input.files[0];
    this.uploadFile(file);

    input.value = '';
  }

  reloadPreview(event?: Event): void {
    event?.stopPropagation();

    if (!this.imageId) return;

    this.loadImage(this.imageId);
  }

  private setImageId(value: string | null): void {
    this.imageId = value;

    if (value) {
      this.loadImage(value);
    } else {
      this.clearPreview();
    }
  }

  private uploadFile(file: File): void {
    this.isUploading = true;

    this.fileService.uploadFile(file).subscribe({
      next: (imageId) => {
        this.imageId = imageId;

        this.onChange(imageId);
        this.onTouched();

        this.loadImage(imageId);
      },
      error: (error) => {
        console.error('Upload failed:', error);
      },
      complete: () => {
        this.isUploading = false;
        this.cdr.detectChanges();
      },
    });
  }

  private loadImage(id: string): void {
    this.fileService.preview(id).subscribe({
      next: (blob) => {
        this.setPreview(blob);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Load image failed:', error);
        this.clearPreview();
        this.cdr.detectChanges();
      },
      complete: () => {
        this.cdr.detectChanges();
      },
    });
  }

  private setPreview(blob: Blob): void {
    this.revokeObjectUrl();
    this.objectUrl = URL.createObjectURL(blob);
    this.imageSrc = this.objectUrl;
  }

  private clearPreview(): void {
    this.revokeObjectUrl();
    this.imageSrc = null;
  }

  private revokeObjectUrl(): void {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
  }

  ngOnDestroy(): void {
    this.revokeObjectUrl();
  }
}
