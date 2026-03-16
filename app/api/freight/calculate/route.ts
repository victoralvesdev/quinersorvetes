import { NextRequest, NextResponse } from 'next/server';
import { getActiveFreightZones } from '@/lib/supabase/freight';

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

let storeCoords: { lat: number; lon: number } | null = null;

async function getStoreCoords(): Promise<{ lat: number; lon: number } | null> {
  if (storeCoords) return storeCoords;

  const query = encodeURIComponent('Rua Argemiro Egidio Gonçalves, Parque Brasil, Bragança Paulista, SP, Brazil');
  const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`;

  const res = await fetch(url, { headers: { 'User-Agent': 'QuinerApp/1.0' } });
  const data = await res.json();

  if (!data || data.length === 0) return null;

  storeCoords = { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
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

    const viaCepRes = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
    const viaCepData = await viaCepRes.json();

    if (viaCepData.erro) {
      return NextResponse.json({ error: 'CEP não encontrado' }, { status: 404 });
    }

    const { logradouro, bairro, localidade, uf } = viaCepData;

    const nominatimQuery = encodeURIComponent(
      `${logradouro}, ${bairro}, ${localidade}, ${uf}, Brazil`
    );
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${nominatimQuery}&format=json&limit=1`;

    const nominatimRes = await fetch(nominatimUrl, {
      headers: { 'User-Agent': 'QuinerApp/1.0' },
    });
    const nominatimData = await nominatimRes.json();

    if (!nominatimData || nominatimData.length === 0) {
      return NextResponse.json({ error: 'Endereço não encontrado para geocodificação' }, { status: 422 });
    }

    const clientLat = parseFloat(nominatimData[0].lat);
    const clientLon = parseFloat(nominatimData[0].lon);
    const addressFound = nominatimData[0].display_name;

    const storeCoordsResult = await getStoreCoords();
    if (!storeCoordsResult) {
      return NextResponse.json({ error: 'Não foi possível geocodificar o endereço da loja' }, { status: 500 });
    }

    const distance_km = haversine(storeCoordsResult.lat, storeCoordsResult.lon, clientLat, clientLon);

    const zones = await getActiveFreightZones();

    const zone = zones.find((z) => distance_km >= z.min_km && distance_km < z.max_km);

    if (!zone) {
      return NextResponse.json({
        distance_km: parseFloat(distance_km.toFixed(2)),
        freight_fee: 0,
        zone_label: 'Fora da área de entrega',
        address_found: addressFound,
      });
    }

    return NextResponse.json({
      distance_km: parseFloat(distance_km.toFixed(2)),
      freight_fee: zone.price,
      zone_label: zone.label,
      address_found: addressFound,
    });
  } catch (error) {
    console.error('[freight/calculate] Erro:', error);
    return NextResponse.json({ error: 'Erro interno ao calcular frete' }, { status: 500 });
  }
}
