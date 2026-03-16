import { NextRequest, NextResponse } from 'next/server';
import { getActiveFreightZones } from '@/lib/supabase/freight';

const STORE_CEP = '12908020';

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function getCepCoords(cep: string): Promise<{ lat: number; lon: number; label: string } | null> {
  try {
    const res = await fetch(`https://brasilapi.com.br/api/cep/v2/${cep}`, {
      headers: { 'User-Agent': 'QuinerApp/1.0' },
      next: { revalidate: 3600 },
    });

    if (!res.ok) return null;
    const data = await res.json();

    const lat = parseFloat(data.location?.coordinates?.latitude);
    const lon = parseFloat(data.location?.coordinates?.longitude);

    if (isNaN(lat) || isNaN(lon)) return null;

    const label = [data.street, data.neighborhood, data.city, data.state]
      .filter(Boolean)
      .join(', ');

    return { lat, lon, label };
  } catch {
    return null;
  }
}

// Cache das coordenadas da loja em memória
let storeCoords: { lat: number; lon: number } | null = null;

async function getStoreCoords(): Promise<{ lat: number; lon: number } | null> {
  if (storeCoords) return storeCoords;
  const result = await getCepCoords(STORE_CEP);
  if (!result) return null;
  storeCoords = { lat: result.lat, lon: result.lon };
  return storeCoords;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cep } = body;

    if (!cep || typeof cep !== 'string') {
      return NextResponse.json({ error: 'CEP inválido' }, { status: 400 });
    }

    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      return NextResponse.json({ error: 'CEP deve ter 8 dígitos' }, { status: 400 });
    }

    const [clientCoords, storeCoordsResult] = await Promise.all([
      getCepCoords(cleanCep),
      getStoreCoords(),
    ]);

    if (!clientCoords) {
      return NextResponse.json(
        { error: 'CEP não encontrado. Verifique o CEP informado.' },
        { status: 422 }
      );
    }

    if (!storeCoordsResult) {
      return NextResponse.json(
        { error: 'Erro ao obter coordenadas da loja.' },
        { status: 500 }
      );
    }

    const distance_km = haversine(
      storeCoordsResult.lat,
      storeCoordsResult.lon,
      clientCoords.lat,
      clientCoords.lon
    );

    const zones = await getActiveFreightZones();
    const zone = zones.find((z) => distance_km >= z.min_km && distance_km < z.max_km);

    return NextResponse.json({
      distance_km: parseFloat(distance_km.toFixed(2)),
      freight_fee: zone ? zone.price : 0,
      zone_label: zone ? zone.label : 'Fora da área configurada',
      address_found: clientCoords.label,
    });
  } catch (error) {
    console.error('[freight/calculate] Erro:', error);
    return NextResponse.json({ error: 'Erro interno ao calcular frete' }, { status: 500 });
  }
}
