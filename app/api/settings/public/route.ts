import { NextResponse } from 'next/server';
import { getPublicSettings } from '@/lib/supabase/settings';

export async function GET() {
  try {
    const settings = await getPublicSettings();
    return NextResponse.json(settings);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}
