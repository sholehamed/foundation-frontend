import type { MenuDto } from './menu-management.model';

/**
 * MenuCategories/{categoryId}/menus currently returns a *flat* collection.
 * Build the hierarchy from parentId instead of assuming children[] is populated.
 *
 * The admin editor must remain usable with dirty historical data: orphan,
 * cross-category and cyclic parent references are rendered as roots rather than
 * being dropped or creating an infinite recursive render. This function only
 * changes the view model; it never rewrites persisted parentId assignments.
 */
export function buildMenuTree(rows: readonly MenuDto[]): MenuDto[] {
  const byId = new Map<string, MenuDto>();

  for (const item of rows) {
    if (!item.id || byId.has(item.id)) continue;
    byId.set(item.id, { ...item, children: [] });
  }

  const createsCycle = (id: string, parentId: string): boolean => {
    const seen = new Set<string>([id]);
    let current: string | null | undefined = parentId;

    while (current) {
      if (seen.has(current)) return true;
      seen.add(current);
      current = byId.get(current)?.parentId;
    }

    return false;
  };

  const roots: MenuDto[] = [];
  for (const node of byId.values()) {
    const parentId = node.parentId;
    const parent = parentId ? byId.get(parentId) : undefined;

    if (
      parent &&
      parent.categoryId === node.categoryId &&
      !createsCycle(node.id, parentId!)
    ) {
      parent.children!.push(node);
    } else {
      roots.push(node);
    }
  }

  const sort = (items: MenuDto[]): MenuDto[] =>
    items
      .sort((left, right) =>
        left.order - right.order || left.title.localeCompare(right.title)
      )
      .map(item => {
        item.children = sort(item.children ?? []);
        return item;
      });

  return sort(roots);
}
