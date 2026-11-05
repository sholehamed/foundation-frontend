import { Directive, Input, TemplateRef } from "@angular/core";

@Directive({
  selector: 'ng-template[gridCellTemplate]'
})
export class GridCellTemplateDirective {
  @Input('gridCellTemplate') columnKey!: string;

  constructor(public templateRef: TemplateRef<any>) {}
}