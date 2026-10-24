import { inject, Injectable, signal } from '@angular/core';
import type { SupabaseClient } from '@supabase/supabase-js';

import { SUPABASE_CLIENT } from './shared/data/supabase_client';

interface Product {
  id: number;
  created_at: string;
  name: string;
  count: number;
}

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private readonly supabase: SupabaseClient = inject(SUPABASE_CLIENT);

  readonly products = signal<Product[]>([]);

  private readonly loadingState = signal<boolean>(false);
  private readonly errorState = signal<string | null>(null);
  readonly isLoading = this.loadingState.asReadonly();
  readonly errorMessage = this.errorState.asReadonly();

  /** Loads test products and exposes a recoverable application error on failure. */
  async getProducts(): Promise<void> {
    if (this.isLoading()) return;
    this.loadingState.set(true);
    this.errorState.set(null);
    try {
      await this.loadProducts();
    } catch {
      this.errorState.set('Data could not be loaded. Please try again.');
    } finally {
      this.loadingState.set(false);
    }
  }

  /** Reads products and forwards request failures to the application state. */
  private async loadProducts(): Promise<void> {
    const { data, error } = await this.supabase
      .from('products')
      .select('id, created_at, name, count');
    if (error) throw error;
    this.products.set(data ?? []);
  }
}