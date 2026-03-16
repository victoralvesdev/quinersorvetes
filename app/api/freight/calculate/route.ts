import { NextRequest, NextResponse } from 'next/server';
import { getActiveFreightZones } from '@/lib/supabase/freight';

const STORE_CEP = '12908020';

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const nominatimHeaders = { 'User-Agent': 'QuinerApp/1.0 contact@quiner.com.br' };

/** 1. Tenta BrasilAPI v2 — retorna coords quando disponíveis */
async function tryBrasilApi(cep: string): Promise<{ lat: number; lon: number; label: string } | null> {
  try {
    const res = await fetch(`https://brasilapi.com.br/api/cep/v2/${cep}`, {
      headers: nominatimHeaders,
    });
    if (!res.ok) return null;
    const d = await res.json();
    const lat = parseFloat(d.location?.coordinates?.latitude);
    const lon = parseFloat(d.location?.coordinates?.longitude);
    if (isNaN(lat) || isNaN(lon)) return null;
    const label = [d.street, d.neighborhood, d.city, d.state].filter(Boolean).join(', ');
    return { lat, lon, label };
  } catch { return null; }
}

/** 2. Tenta Nominatim por CEP (postalcode) */
async function tryNominatimByCep(cep: string): Promise<{ lat: number; lon: number; label: string } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?postalcode=${cep}&country=BR&format=json&limit=1`;
    const res = await fetch(url, { headers: nominatimHeaders });
    if (!res.ok) return null;
    const d = await res.json();
    if (!d?.length) return null;
    return { lat: parseFloat(d[0].lat), lon: parseFloat(d[0].lon), label: d[0].display_name };
  } catch { return null; }
}

/** 3. Tenta Nominatim pelo endereço completo vindo do ViaCEP */
async function tryNominatimByAddress(cep: string): Promise<{ lat: number; lon: number; label: string } | null> {
  try {
    const viaCepRes = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    if (!viaCepRes.ok) return null;
    const v = await viaCepRes.json();
    if (v.erro) return null;

    // Tenta rua + bairro + cidade
    const query1 = encodeURIComponent(
      `${v.logradouro}, ${v.bairro}, ${v.localidade}, ${v.uf}, Brazil`
    );
    const res1 = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${query1}&format=json&limit=1`,
      { headers: nominatimHeaders }
    );
    const d1 = await res1.json();
    if (d1?.length) {
      return { lat: parseFloat(d1[0].lat), lon: parseFloat(d1[0].lon), label: d1[0].display_name };
    }

    // Fallback: só cidade + estado
    const query2 = encodeURIComponent(`${v.localidade}, ${v.uf}, Brazil`);
    const res2 = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${query2}&format=json&limit=1`,
      { headers: nominatimHeaders }
    );
    const d2 = await res2.json();
    if (d2?.length) {
      const label = [v.logradouro, v.bairro, v.localidade, v.uf].filter(Boolean).join(', ');
      return { lat: parseFloat(d2[0].lat), lon: parseFloat(d2[0].lon), label };
    }

    return null;
  } catch { return null; }
}

async function getCepCoords(cep: string): Promise<{ lat: number; lon: number; label: string } | null> {
  return (
    (await tryBrasilApi(cep)) ??
    (await tryNominatimByCep(cep)) ??
    (await tryNominatimByAddress(cep))
  );
}

// Cache das coordenadas da loja
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
    const { cep } = await request.json();

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
        { error: 'Não foi possível localizar o endereço. Tente informar o CEP manualmente.' },
        { status: 422 }
      );
    }

    if (!storeCoordsResult) {
      // Usa coordenadas hardcoded da loja como último recurso
      // CEP 12908-020 — Parque Brasil, Bragança Paulista, SP
      storeCoords = { lat: -22.9523, lon: -46.5418 };
    }

    const store = storeCoordsResult ?? storeCoords!;
    const distance_km = haversine(store.lat, store.lon, clientCoords.lat, clientCoords.lon);

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
