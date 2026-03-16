import { NextRequest, NextResponse } from 'next/server';
import { getActiveFreightZones } from '@/lib/supabase/freight';

// Coordenadas exatas da loja (Rua Argemiro Egidio Gonçalves, 422 — Parque Brasil, Bragança Paulista)
const STORE_COORDS = { lat: -22.9523, lon: -46.5418 };

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

type Coords = { lat: number; lon: number; label: string };

/** 0. Google Maps Geocoding API — melhor precisão, requer GOOGLE_MAPS_API_KEY */
async function tryGoogleMaps(cep: string): Promise<Coords | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${cep}&region=BR&key=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const d = await res.json();
    if (d.status !== 'OK' || !d.results?.length) return null;
    const loc = d.results[0].geometry.location;
    const lat = loc.lat;
    const lon = loc.lng;
    if (isNaN(lat) || isNaN(lon)) return null;
    return { lat, lon, label: d.results[0].formatted_address };
  } catch { return null; }
}

/** 1. AwesomeAPI — lat/lng por CEP com precisão de bairro */
async function tryAwesomeApi(cep: string): Promise<Coords | null> {
  try {
    const res = await fetch(`https://cep.awesomeapi.com.br/json/${cep}`);
    if (!res.ok) return null;
    const d = await res.json();
    const lat = parseFloat(d.lat);
    const lon = parseFloat(d.lng);
    if (isNaN(lat) || isNaN(lon) || (lat === 0 && lon === 0)) return null;
    const label = [d.address, d.district, d.city, d.state].filter(Boolean).join(', ');
    return { lat, lon, label };
  } catch { return null; }
}

/** 2. BrasilAPI v2 */
async function tryBrasilApi(cep: string): Promise<Coords | null> {
  try {
    const res = await fetch(`https://brasilapi.com.br/api/cep/v2/${cep}`);
    if (!res.ok) return null;
    const d = await res.json();
    const lat = parseFloat(d.location?.coordinates?.latitude);
    const lon = parseFloat(d.location?.coordinates?.longitude);
    if (isNaN(lat) || isNaN(lon) || (lat === 0 && lon === 0)) return null;
    const label = [d.street, d.neighborhood, d.city, d.state].filter(Boolean).join(', ');
    return { lat, lon, label };
  } catch { return null; }
}

/** 3. Nominatim por postalcode */
async function tryNominatimPostal(cep: string): Promise<Coords | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?postalcode=${cep}&country=BR&format=json&limit=1`;
    const res = await fetch(url, { headers: { 'User-Agent': 'QuinerApp/1.0' } });
    if (!res.ok) return null;
    const d = await res.json();
    if (!d?.length) return null;
    const lat = parseFloat(d[0].lat);
    const lon = parseFloat(d[0].lon);
    if (isNaN(lat) || isNaN(lon)) return null;
    return { lat, lon, label: d[0].display_name };
  } catch { return null; }
}

/** 4. ViaCEP + Nominatim por endereço completo */
async function tryViaCepNominatim(cep: string): Promise<Coords | null> {
  try {
    const viaCepRes = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    if (!viaCepRes.ok) return null;
    const v = await viaCepRes.json();
    if (v.erro) return null;

    const queries = [
      `${v.logradouro}, ${v.bairro}, ${v.localidade}, ${v.uf}, Brazil`,
      `${v.bairro}, ${v.localidade}, ${v.uf}, Brazil`,
      `${v.localidade}, ${v.uf}, Brazil`,
    ].filter(q => q.length > 10);

    for (const q of queries) {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`,
        { headers: { 'User-Agent': 'QuinerApp/1.0' } }
      );
      const d = await res.json();
      if (d?.length) {
        const lat = parseFloat(d[0].lat);
        const lon = parseFloat(d[0].lon);
        if (!isNaN(lat) && !isNaN(lon)) {
          const label = [v.logradouro, v.bairro, v.localidade, v.uf].filter(Boolean).join(', ');
          return { lat, lon, label };
        }
      }
    }
    return null;
  } catch { return null; }
}

async function getCepCoords(cep: string): Promise<Coords | null> {
  return (
    (await tryGoogleMaps(cep)) ??
    (await tryAwesomeApi(cep)) ??
    (await tryBrasilApi(cep)) ??
    (await tryNominatimPostal(cep)) ??
    (await tryViaCepNominatim(cep))
  );
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

    const clientCoords = await getCepCoords(cleanCep);

    if (!clientCoords) {
      return NextResponse.json(
        { error: 'Não foi possível localizar o endereço. Verifique o CEP informado.' },
        { status: 422 }
      );
    }

    const distance_km = haversine(STORE_COORDS.lat, STORE_COORDS.lon, clientCoords.lat, clientCoords.lon);
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
