import { Component, input, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatExpansionModule } from "@angular/material/expansion";
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sidebar-menu-item',
  imports: [CommonModule, MatExpansionModule,RouterLinkActive,RouterLink],
  templateUrl: './sidebar-menu-item.component.html',
  styleUrl: './sidebar-menu-item.component.scss',
})
export class SidebarMenuItemComponent {

  @Input() menuItem!:menuItem
  @Input() panelOpenState   = signal(false);

}
export interface menuItem{
  title:string
  route?:string
  icon?:string
  badge?:string
  childs?:menuItem[]
}
