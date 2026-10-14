import { Injectable, signal } from '@angular/core';
import { createClient } from '@supabase/supabase-js';

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
  private readonly supabaseUrl =
    'https://erorsdnkdqgidaygggbi.supabase.co';

  private readonly supabaseKey = 'sb_publishable_O1DJRefeVnCRatR02QpFTQ_SQwGsX7i';

  private readonly supabase = createClient(
    this.supabaseUrl,
    this.supabaseKey,
  );

  readonly products = signal<Product[]>([]);

  async getProducts(): Promise<void> {
    const { data, error } = await this.supabase
      .from('products')
      .select('id, created_at, name, count');

    if (error) {
      console.error('Produkte konnten nicht geladen werden:', error.message);
      return;
    }

    this.products.set(data);
  }
}