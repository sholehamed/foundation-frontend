import type { MenuDto } from './menu-management.model';
import { buildMenuTree } from './menu-tree';

const menu = (
  id: string,
  parentId: string | null,
  order: number,
  categoryId = 'system',
): MenuDto => ({
  id, categoryId, parentId, order, title: id, route: '/system/' + id,
  isActive: true, isHidden: false,
});

describe('menu management flat-to-tree adapter', () => {
  it('builds and sorts arbitrarily deep hierarchy from a flat API response', () => {
    const records = [
      menu('child-b', 'parent', 3),
      menu('grandchild', 'child-a', 1),
      menu('root-b', null, 2),
      menu('child-a', 'parent', 1),
      menu('parent', null, 1),
    ];
    const result = buildMenuTree(records);

    expect(result.map(x => x.id)).toEqual(['parent', 'root-b']);
    expect(result[0].children?.map(x => x.id)).toEqual(['child-a', 'child-b']);
    expect(result[0].children?.[0].children?.map(x => x.id))
      .toEqual(['grandchild']);
    expect(records[0].children).toBeUndefined();
    expect(records.map(x => x.id)).toEqual([
      'child-b', 'grandchild', 'root-b', 'child-a', 'parent',
    ]);
  });

  it('renders orphan, self-parent, cross-category and cyclic rows without recursion', () => {
    const records = [
      menu('self', 'self', 1),
      menu('orphan', 'missing', 2),
      menu('a', 'b', 3),
      menu('b', 'a', 4),
      menu('other', 'parent', 5, 'tenant'),
      menu('parent', null, 6),
    ];
    const tree = buildMenuTree(records);

    expect(tree.map(x => x.id)).toEqual([
      'self', 'orphan', 'a', 'b', 'other', 'parent',
    ]);
    expect(tree.every(x => x.children?.length === 0)).toBe(true);
  });

  it('does not duplicate identifiers or lose the external link fields', () => {
    const records = [
      { ...menu('docs', null, 1), route: null, externalUrl: 'https://docs.example.test' },
      { ...menu('docs', null, 2), title: 'Duplicate ID' },
    ];
    const tree = buildMenuTree(records);

    expect(tree).toHaveLength(1);
    expect(tree[0].externalUrl).toBe('https://docs.example.test');
    expect(tree[0].route).toBeNull();
  });
});
