import { Directive, ElementRef, OnInit, Renderer2 } from '@angular/core'

@Directive({
  selector: '[appNoAutofill]',
})
export class NoAutofillDirective implements OnInit {
  constructor(private el: ElementRef, private renderer: Renderer2) {}
  ngOnInit() {
    const input = this.el.nativeElement
    const parent = input.parentElement

    // اضافه کردن فیلدهای fake قبل از input اصلی
    const fakeUsername = this.renderer.createElement('input')
    const fakePassword = this.renderer.createElement('input')

    this.renderer.setAttribute(fakeUsername, 'type', 'text')
    this.renderer.setAttribute(fakePassword, 'type', 'password')
    this.renderer.setStyle(fakeUsername, 'position', 'absolute')
    this.renderer.setStyle(fakeUsername, 'opacity', '0')
    this.renderer.setStyle(fakeUsername, 'height', '0')
    this.renderer.setStyle(fakePassword, 'position', 'absolute')
    this.renderer.setStyle(fakePassword, 'opacity', '0')
    this.renderer.setStyle(fakePassword, 'height', '0')

    this.renderer.insertBefore(parent, fakeUsername, input)
    this.renderer.insertBefore(parent, fakePassword, input)

    // تنظیمات input اصلی
    this.renderer.setAttribute(input, 'autocomplete', 'new-password')
    this.renderer.setAttribute(input, 'readonly', 'true')

    setTimeout(() => {
      this.renderer.removeAttribute(input, 'readonly')
      if (input.value) {
        input.value = ''
        input.dispatchEvent(new Event('input'))
      }
    }, 200)
  }
}
