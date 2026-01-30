import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'Ware House System';
  showLayout = false;

  constructor(private router: Router) {}

  ngOnInit() {
    // Check route changes to determine if layout should be shown
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      // Hide layout on login and register pages
      this.showLayout = !event.url.includes('/login') && !event.url.includes('/register');
    });

    // Initial check
    const currentUrl = this.router.url;
    this.showLayout = !currentUrl.includes('/login') && !currentUrl.includes('/register');
  }
}
