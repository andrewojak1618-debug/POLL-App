import { Component, inject, OnInit } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { RouterOutlet } from '@angular/router';

import { SupabaseService } from './supabase';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, JsonPipe],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  readonly dbService = inject(SupabaseService);

  ngOnInit(): void {
    void this.dbService.getProducts();
  }
}
