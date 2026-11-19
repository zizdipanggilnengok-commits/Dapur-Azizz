import { createClient } from '@supabase/supabase-js';

const rawUrl =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ||
  'https://cyooulwffyeivfsouaeh.supabase.co';

const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');

const supabaseKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ||
  'sb_publishable_xk_f2r4p5jOa-D3_7Ey9lw_Bn6WakQj';

export const supabase = createClient(supabaseUrl, supabaseKey);

export const BOOTSTRAP_ADMIN_EMAILS = [
  'admin@dapuraziz.com',
  'zizdipanggilnengok@gmail.com',
] as const;
