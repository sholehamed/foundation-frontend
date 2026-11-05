export interface MenuCategoryReorderCommand {
  items: {
    id: string;
    order: number;
  }[];
}
export interface MenuReorderCommand {
  categoryId: string;
  items: MenuOrderItem[];
}

export interface MenuOrderItem {
  id: string;
  parentId?: string | null;
  order: number;
}
export interface MenuCategoryDto {
  id: string;
  title: string;
  order: number;
  isActive: boolean;
}

export interface MenuDto {
  id: string;
  categoryId: string;
  parentId?: string | null;
  title: string;
  icon?: string | null;
  order: number;
  route?: string | null;
  externalUrl?: string | null;
  permissionId?: string | null;
  isActive: boolean;
  isHidden: boolean;
  children?: MenuDto[];
}

export interface MenuCreateCommand {
  categoryId: string;
  parentId?: string | null;
  isActive: boolean;
  isHidden: boolean;
  title: string;
  icon?: string | null;
  order: number;
  route?: string | null;
  externalUrl?: string | null;
  permissionId?: string | null;
}

export interface MenuCategoryCreateCommand {
  title: string;
  order: number;
  isActive: boolean;
}
