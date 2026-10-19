import { vi } from 'vitest';
import { SupabaseService } from './supabase';

const { select } = vi.hoisted(() => ({ select: vi.fn() }));
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({ from: () => ({ select }) }),
}));

describe('Supabase request state', () => {
  beforeEach(() => { select.mockReset(); });

  it('starts without a loading or error state', () => {
    const service = new SupabaseService();
    expect(service.isLoading()).toBe(false);
    expect(service.errorMessage()).toBeNull();
  });

  it.each(['response', 'rejection'])('handles a %s failure and allows retry', async (failure: string) => {
    const service = new SupabaseService();
    if (failure === 'response') select.mockResolvedValueOnce({ data: null, error: { message: 'internal detail' } });
    else select.mockRejectedValueOnce(new Error('internal detail'));
    await service.getProducts();
    expect(service.isLoading()).toBe(false);
    expect(service.errorMessage()).toBe('Data could not be loaded. Please try again.');
    select.mockResolvedValueOnce({ data: [], error: null });
    await service.getProducts();
    expect(service.errorMessage()).toBeNull();
    expect(service.products()).toEqual([]);
  });

  it('exposes loading and avoids duplicate concurrent requests', async () => {
    const service = new SupabaseService();
    select.mockResolvedValue({ data: [], error: null });
    const pending = service.getProducts();
    expect(service.isLoading()).toBe(true);
    await service.getProducts();
    await pending;
    expect(select).toHaveBeenCalledTimes(1);
    expect(service.isLoading()).toBe(false);
  });

  it('keeps previously loaded data when a later request fails', async () => {
    const service = new SupabaseService();
    const products = [{ id: 1, name: 'Test', count: 0, created_at: '2026-10-19T00:00:00Z' }];
    select.mockResolvedValueOnce({ data: products, error: null });
    await service.getProducts();
    select.mockRejectedValueOnce(new Error('offline'));
    await service.getProducts();
    expect(service.products()).toEqual(products);
    expect(service.errorMessage()).not.toBeNull();
  });
});