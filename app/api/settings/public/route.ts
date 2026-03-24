import { NextResponse } from 'next/server';
import { unstable_noStore as noStore } from 'next/cache';
import { getPublicSettings } from '@/lib/supabase/settings';

export const dynamic = 'force-dynamic';

export async function GET() {
  noStore();
  try {
    const settings = await getPublicSettings();
    return NextResponse.json(settings, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}
