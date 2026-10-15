import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  if (!lat || !lng) {
    return NextResponse.json({ error: 'Parâmetros lat e lng são obrigatórios.' }, { status: 400 });
  }

  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(
      lat
    )}&lon=${encodeURIComponent(lng)}&zoom=18&addressdetails=1`;

    const res = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'NavegandoMKT-CRM/1.0 (contato@navegandomkt.com.br)',
        'Accept-Language': 'pt-BR,pt;q=0.9',
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      throw new Error(`Nominatim error: ${res.status}`);
    }

    const data = await res.json();
    const address = data.address || {};

    const road = address.road || address.pedestrian || address.street || '';
    const houseNumber = address.house_number ? `, ${address.house_number}` : '';
    const suburb = address.suburb || address.neighbourhood || address.city_district || '';
    const city = address.city || address.town || address.municipality || '';
    const state = address.state || '';

    // Formatar endereço limpo no padrão brasileiro
    let formattedShort = [
      road ? `${road}${houseNumber}` : '',
      suburb,
      city ? (state ? `${city} - ${state}` : city) : '',
    ]
      .filter(Boolean)
      .join(', ');

    if (!formattedShort) {
      formattedShort = data.display_name || `${lat}, ${lng}`;
    }

    return NextResponse.json({
      success: true,
      address: formattedShort,
      fullAddress: data.display_name,
      details: {
        road,
        suburb,
        city,
        state,
        postcode: address.postcode,
      },
    });
  } catch (error: any) {
    console.error('Erro na geocodificação reversa:', error);
    return NextResponse.json(
      {
        success: false,
        address: `Coordenadas: ${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}`,
        error: error.message,
      },
      { status: 200 }
    );
  }
}
