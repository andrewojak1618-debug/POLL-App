import { InjectionToken } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

import { environment } from '../../../environments/environment';

/** Provides one shared Supabase client within the application injector. */
export const SUPABASE_CLIENT = new InjectionToken<SupabaseClient>('SUPABASE_CLIENT', {
  providedIn: 'root',
  factory: (): SupabaseClient => createClient(
    environment.supabase.url,
    environment.supabase.publishableKey,
  ),
});
