import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://youvnaepznqfbpdacibs.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvdXZuYWVwem5xZmJwZGFjaWJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNjc5MzIsImV4cCI6MjA4Mzg0MzkzMn0.K0F_UiIPss-qqNzCOPVjg4Ia77nXP6BraLKgiA7NLZo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'public',
  },
  auth: {
    persistSession: false,
  },
});

