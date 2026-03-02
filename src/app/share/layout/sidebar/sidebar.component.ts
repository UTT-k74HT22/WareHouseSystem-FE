import { Component } from '@angular/core';
import { SIDEBAR_NAV_SECTIONS } from '../../../helper/constraint/sidebar-nav';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  readonly navSections = SIDEBAR_NAV_SECTIONS;
}
