import { menuItem } from "./sidebar-menu-item.component/sidebar-menu-item.component";

export interface SidebarRole {
  id: string;
  title: string;
  icon:string
}

export interface SidebarBadge {
  text: string;
  class?: string;
}

export interface SidebarMenuItem {
  title: string;
  icon?: string;
  route?: string;
  externalUrl?: string;
  exact?: boolean;
  badge?: SidebarBadge;
  children?: SidebarMenuItem[];
}

export interface SidebarMenuSection {
  title: string;
  items: menuItem[];
}