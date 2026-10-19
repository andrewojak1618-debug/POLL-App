interface Environment {
  readonly supabase: {
    readonly url: string;
    readonly publishableKey: string;
  };
}

/** Public browser configuration shared by the current build environments. */
export const environment: Environment = {
  supabase: {
    url: 'https://erorsdnkdqgidaygggbi.supabase.co',
    publishableKey: 'sb_publishable_O1DJRefeVnCRatR02QpFTQ_SQwGsX7i',
  },
};
