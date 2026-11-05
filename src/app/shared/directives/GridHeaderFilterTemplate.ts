import { Directive, Input, TemplateRef } from "@angular/core";

@Directive({
  selector: 'ng-template[gridHeaderFilterTemplate]'
})
export class GridHeaderFilterTemplateDirective {
  @Input('gridHeaderFilterTemplate') columnKey!: string;

  constructor(public templateRef: TemplateRef<any>) {}
}