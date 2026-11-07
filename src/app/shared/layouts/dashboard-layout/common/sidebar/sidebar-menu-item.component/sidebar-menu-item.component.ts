import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { RouterLink, RouterLinkActive } from '@angular/router';
import type { MenuDto } from '../sidebar-menu.service';

@Component({
  selector: 'app-sidebar-menu-item',
  standalone: true,
  imports: [CommonModule, MatExpansionModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar-menu-item.component.html',
  styleUrl: './sidebar-menu-item.component.scss',
})
export class SidebarMenuItemComponent {
  @Input({ required: true }) menuItem!: MenuDto;
}
