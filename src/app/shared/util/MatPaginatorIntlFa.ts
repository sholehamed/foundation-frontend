import { Injectable } from "@angular/core"
import { MatPaginatorIntl } from "@angular/material/paginator"
@Injectable()
export class MatPaginatorIntlFa extends MatPaginatorIntl {
  override itemsPerPageLabel = 'تعداد رکورد در هر صفحه:'
  override nextPageLabel = 'صفحه بعد'
  override previousPageLabel = 'صفحه قبل'
  override firstPageLabel = 'اولین صفحه'
  override lastPageLabel = 'آخرین صفحه'

  override getRangeLabel = (page: number, pageSize: number, length: number): string => {
    if (length === 0 || pageSize === 0) {
      return `۰ از ${length}`
    }

    const startIndex = page * pageSize
    const endIndex =
      startIndex < length
        ? Math.min(startIndex + pageSize, length)
        : startIndex + pageSize

    return `${startIndex + 1} - ${endIndex} از ${length}`
  }
}