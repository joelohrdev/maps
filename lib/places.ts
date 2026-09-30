// Seed cities that random spots are generated around. Every country here has
// reasonable Google Street View coverage; add cities freely as [name, lat, lng].

export type Continent =
  | "Europe"
  | "North America"
  | "Latin America"
  | "Asia & Middle East"
  | "Oceania"
  | "Africa";

export type City = [name: string, lat: number, lng: number];

export interface Country {
  code: string;
  name: string;
  continent: Continent;
  cities: City[];
}

export const CONTINENTS: Continent[] = [
  "Europe",
  "North America",
  "Latin America",
  "Asia & Middle East",
  "Oceania",
  "Africa",
];

export const COUNTRIES: Country[] = [
  // Europe
  { code: "FR", name: "France", continent: "Europe", cities: [["Paris", 48.8566, 2.3522], ["Lyon", 45.764, 4.8357], ["Marseille", 43.2965, 5.3698], ["Bordeaux", 44.8378, -0.5792], ["Strasbourg", 48.5734, 7.7521], ["Nice", 43.7102, 7.262], ["Toulouse", 43.6047, 1.4442], ["Lille", 50.6292, 3.0573]] },
  { code: "GB", name: "United Kingdom", continent: "Europe", cities: [["London", 51.5074, -0.1278], ["Edinburgh", 55.9533, -3.1883], ["Manchester", 53.4808, -2.2426], ["Bath", 51.3811, -2.359], ["York", 53.959, -1.0815], ["Bristol", 51.4545, -2.5879], ["Liverpool", 53.4084, -2.9916]] },
  { code: "IE", name: "Ireland", continent: "Europe", cities: [["Dublin", 53.3498, -6.2603], ["Galway", 53.2707, -9.0568], ["Cork", 51.8985, -8.4756]] },
  { code: "ES", name: "Spain", continent: "Europe", cities: [["Madrid", 40.4168, -3.7038], ["Barcelona", 41.3851, 2.1734], ["Seville", 37.3891, -5.9845], ["Valencia", 39.4699, -0.3763], ["Granada", 37.1773, -3.5986], ["Bilbao", 43.263, -2.935], ["Toledo", 39.8628, -4.0273]] },
  { code: "PT", name: "Portugal", continent: "Europe", cities: [["Lisbon", 38.7223, -9.1393], ["Porto", 41.1579, -8.6291], ["Coimbra", 40.2033, -8.4103], ["Faro", 37.0194, -7.9304]] },
  { code: "IT", name: "Italy", continent: "Europe", cities: [["Rome", 41.9028, 12.4964], ["Florence", 43.7696, 11.2558], ["Venice", 45.4408, 12.3155], ["Milan", 45.4642, 9.19], ["Naples", 40.8518, 14.2681], ["Bologna", 44.4949, 11.3426], ["Siena", 43.3188, 11.3308], ["Palermo", 38.1157, 13.3615]] },
  { code: "DE", name: "Germany", continent: "Europe", cities: [["Berlin", 52.52, 13.405], ["Munich", 48.1351, 11.582], ["Hamburg", 53.5511, 9.9937], ["Cologne", 50.9375, 6.9603], ["Dresden", 51.0504, 13.7373], ["Heidelberg", 49.3988, 8.6724], ["Bamberg", 49.8988, 10.9028]] },
  { code: "NL", name: "Netherlands", continent: "Europe", cities: [["Amsterdam", 52.3676, 4.9041], ["Utrecht", 52.0907, 5.1214], ["Delft", 52.0116, 4.3571], ["Rotterdam", 51.9244, 4.4777], ["Haarlem", 52.3874, 4.6462]] },
  { code: "BE", name: "Belgium", continent: "Europe", cities: [["Brussels", 50.8503, 4.3517], ["Bruges", 51.2093, 3.2247], ["Ghent", 51.0543, 3.7174], ["Antwerp", 51.2194, 4.4025]] },
  { code: "CH", name: "Switzerland", continent: "Europe", cities: [["Zurich", 47.3769, 8.5417], ["Bern", 46.948, 7.4474], ["Lucerne", 47.0502, 8.3093], ["Geneva", 46.2044, 6.1432]] },
  { code: "AT", name: "Austria", continent: "Europe", cities: [["Vienna", 48.2082, 16.3738], ["Salzburg", 47.8095, 13.055], ["Innsbruck", 47.2692, 11.4041], ["Graz", 47.0707, 15.4395]] },
  { code: "CZ", name: "Czechia", continent: "Europe", cities: [["Prague", 50.0755, 14.4378], ["Brno", 49.1951, 16.6068], ["Český Krumlov", 48.8127, 14.3175]] },
  { code: "PL", name: "Poland", continent: "Europe", cities: [["Warsaw", 52.2297, 21.0122], ["Kraków", 50.0647, 19.945], ["Gdańsk", 54.352, 18.6466], ["Wrocław", 51.1079, 17.0385]] },
  { code: "HU", name: "Hungary", continent: "Europe", cities: [["Budapest", 47.4979, 19.0402], ["Szeged", 46.253, 20.1414], ["Eger", 47.9025, 20.3772]] },
  { code: "HR", name: "Croatia", continent: "Europe", cities: [["Zagreb", 45.815, 15.9819], ["Split", 43.5081, 16.4402], ["Dubrovnik", 42.6507, 18.0944]] },
  { code: "GR", name: "Greece", continent: "Europe", cities: [["Athens", 37.9838, 23.7275], ["Thessaloniki", 40.6401, 22.9444], ["Nafplio", 37.5673, 22.8016], ["Chania", 35.5138, 24.018]] },
  { code: "DK", name: "Denmark", continent: "Europe", cities: [["Copenhagen", 55.6761, 12.5683], ["Aarhus", 56.1629, 10.2039], ["Odense", 55.4038, 10.4024]] },
  { code: "SE", name: "Sweden", continent: "Europe", cities: [["Stockholm", 59.3293, 18.0686], ["Gothenburg", 57.7089, 11.9746], ["Malmö", 55.605, 13.0038], ["Uppsala", 59.8586, 17.6389]] },
  { code: "NO", name: "Norway", continent: "Europe", cities: [["Oslo", 59.9139, 10.7522], ["Bergen", 60.3913, 5.3221], ["Trondheim", 63.4305, 10.3951]] },
  { code: "FI", name: "Finland", continent: "Europe", cities: [["Helsinki", 60.1699, 24.9384], ["Turku", 60.4518, 22.2666], ["Tampere", 61.4978, 23.761]] },
  { code: "EE", name: "Estonia", continent: "Europe", cities: [["Tallinn", 59.437, 24.7536], ["Tartu", 58.378, 26.729]] },
  { code: "RO", name: "Romania", continent: "Europe", cities: [["Bucharest", 44.4268, 26.1025], ["Brașov", 45.6427, 25.5887], ["Sibiu", 45.7983, 24.1256], ["Cluj-Napoca", 46.7712, 23.6236]] },

  // North America
  { code: "US", name: "United States", continent: "North America", cities: [["New York", 40.7128, -74.006], ["San Francisco", 37.7749, -122.4194], ["Chicago", 41.8781, -87.6298], ["New Orleans", 29.9511, -90.0715], ["Boston", 42.3601, -71.0589], ["Seattle", 47.6062, -122.3321], ["Los Angeles", 34.0522, -118.2437], ["Savannah", 32.0809, -81.0912], ["Santa Fe", 35.687, -105.9378], ["Charleston", 32.7765, -79.9311], ["Portland", 45.5152, -122.6784]] },
  { code: "CA", name: "Canada", continent: "North America", cities: [["Montreal", 45.5017, -73.5673], ["Quebec City", 46.8139, -71.208], ["Toronto", 43.6532, -79.3832], ["Vancouver", 49.2827, -123.1207], ["Halifax", 44.6488, -63.5752], ["Victoria", 48.4284, -123.3656]] },
  { code: "MX", name: "Mexico", continent: "North America", cities: [["Mexico City", 19.4326, -99.1332], ["Oaxaca", 17.0732, -96.7266], ["Guanajuato", 21.019, -101.2574], ["San Miguel de Allende", 20.9144, -100.7452], ["Mérida", 20.9674, -89.5926], ["Guadalajara", 20.6597, -103.3496]] },

  // Latin America
  { code: "BR", name: "Brazil", continent: "Latin America", cities: [["Rio de Janeiro", -22.9068, -43.1729], ["São Paulo", -23.5505, -46.6333], ["Salvador", -12.9777, -38.5016], ["Ouro Preto", -20.3856, -43.5035], ["Paraty", -23.2178, -44.7131], ["Recife", -8.0476, -34.877]] },
  { code: "AR", name: "Argentina", continent: "Latin America", cities: [["Buenos Aires", -34.6037, -58.3816], ["Córdoba", -31.4201, -64.1888], ["Mendoza", -32.8895, -68.8458], ["Salta", -24.7821, -65.4232]] },
  { code: "CL", name: "Chile", continent: "Latin America", cities: [["Santiago", -33.4489, -70.6693], ["Valparaíso", -33.0472, -71.6127], ["Puerto Varas", -41.3195, -72.9854]] },
  { code: "CO", name: "Colombia", continent: "Latin America", cities: [["Bogotá", 4.711, -74.0721], ["Cartagena", 10.391, -75.4794], ["Medellín", 6.2442, -75.5812]] },
  { code: "PE", name: "Peru", continent: "Latin America", cities: [["Lima", -12.0464, -77.0428], ["Cusco", -13.5319, -71.9675], ["Arequipa", -16.409, -71.5375]] },
  { code: "UY", name: "Uruguay", continent: "Latin America", cities: [["Montevideo", -34.9011, -56.1645], ["Colonia del Sacramento", -34.4626, -57.8398]] },
  { code: "EC", name: "Ecuador", continent: "Latin America", cities: [["Quito", -0.1807, -78.4678], ["Cuenca", -2.9001, -79.0059]] },
  { code: "GT", name: "Guatemala", continent: "Latin America", cities: [["Antigua", 14.5586, -90.7295], ["Guatemala City", 14.6349, -90.5069]] },

  // Asia & Middle East
  { code: "JP", name: "Japan", continent: "Asia & Middle East", cities: [["Tokyo", 35.6762, 139.6503], ["Kyoto", 35.0116, 135.7681], ["Osaka", 34.6937, 135.5023], ["Kanazawa", 36.5613, 136.6562], ["Nara", 34.6851, 135.8048], ["Takayama", 36.1461, 137.2522], ["Hiroshima", 34.3853, 132.4553], ["Sapporo", 43.0618, 141.3545]] },
  { code: "TW", name: "Taiwan", continent: "Asia & Middle East", cities: [["Taipei", 25.033, 121.5654], ["Tainan", 22.9999, 120.227], ["Taichung", 24.1477, 120.6736], ["Jiufen", 25.1092, 121.8446]] },
  { code: "HK", name: "Hong Kong", continent: "Asia & Middle East", cities: [["Central", 22.2819, 114.158], ["Kowloon", 22.3167, 114.1833], ["Sham Shui Po", 22.3307, 114.1622]] },
  { code: "SG", name: "Singapore", continent: "Asia & Middle East", cities: [["Singapore", 1.3521, 103.8198], ["Chinatown", 1.2839, 103.8436], ["Joo Chiat", 1.3123, 103.9016]] },
  { code: "TH", name: "Thailand", continent: "Asia & Middle East", cities: [["Bangkok", 13.7563, 100.5018], ["Chiang Mai", 18.7883, 98.9853], ["Phuket Town", 7.8804, 98.3923], ["Ayutthaya", 14.3532, 100.5689]] },
  { code: "MY", name: "Malaysia", continent: "Asia & Middle East", cities: [["Kuala Lumpur", 3.139, 101.6869], ["George Town", 5.4141, 100.3288], ["Malacca", 2.1896, 102.2501], ["Ipoh", 4.5975, 101.0901]] },
  { code: "ID", name: "Indonesia", continent: "Asia & Middle East", cities: [["Jakarta", -6.2088, 106.8456], ["Yogyakarta", -7.7956, 110.3695], ["Ubud", -8.5069, 115.2625], ["Bandung", -6.9175, 107.6191]] },
  { code: "PH", name: "Philippines", continent: "Asia & Middle East", cities: [["Manila", 14.5995, 120.9842], ["Vigan", 17.5747, 120.3869], ["Cebu", 10.3157, 123.8854]] },
  { code: "VN", name: "Vietnam", continent: "Asia & Middle East", cities: [["Hanoi", 21.0285, 105.8542], ["Ho Chi Minh City", 10.8231, 106.6297], ["Hoi An", 15.8801, 108.338]] },
  { code: "IN", name: "India", continent: "Asia & Middle East", cities: [["Mumbai", 19.076, 72.8777], ["Delhi", 28.7041, 77.1025], ["Jaipur", 26.9124, 75.7873], ["Kolkata", 22.5726, 88.3639], ["Bengaluru", 12.9716, 77.5946]] },
  { code: "TR", name: "Turkey", continent: "Asia & Middle East", cities: [["Istanbul", 41.0082, 28.9784], ["Izmir", 38.4237, 27.1428], ["Antalya", 36.8969, 30.7133], ["Ankara", 39.9334, 32.8597]] },
  { code: "IL", name: "Israel", continent: "Asia & Middle East", cities: [["Jerusalem", 31.7683, 35.2137], ["Tel Aviv", 32.0853, 34.7818], ["Haifa", 32.794, 34.9896]] },
  { code: "AE", name: "United Arab Emirates", continent: "Asia & Middle East", cities: [["Dubai", 25.2048, 55.2708], ["Abu Dhabi", 24.4539, 54.3773]] },

  // Oceania
  { code: "AU", name: "Australia", continent: "Oceania", cities: [["Sydney", -33.8688, 151.2093], ["Melbourne", -37.8136, 144.9631], ["Hobart", -42.8821, 147.3272], ["Adelaide", -34.9285, 138.6007], ["Brisbane", -27.4698, 153.0251], ["Perth", -31.9505, 115.8605], ["Fremantle", -32.0569, 115.7439]] },
  { code: "NZ", name: "New Zealand", continent: "Oceania", cities: [["Wellington", -41.2865, 174.7762], ["Auckland", -36.8485, 174.7633], ["Christchurch", -43.5321, 172.6362], ["Dunedin", -45.8788, 170.5028], ["Queenstown", -45.0312, 168.6626]] },

  // Africa
  { code: "ZA", name: "South Africa", continent: "Africa", cities: [["Cape Town", -33.9249, 18.4241], ["Johannesburg", -26.2041, 28.0473], ["Durban", -29.8587, 31.0218], ["Stellenbosch", -33.9321, 18.8602]] },
  { code: "KE", name: "Kenya", continent: "Africa", cities: [["Nairobi", -1.2921, 36.8219], ["Mombasa", -4.0435, 39.6682]] },
  { code: "SN", name: "Senegal", continent: "Africa", cities: [["Dakar", 14.7167, -17.4677], ["Saint-Louis", 16.0326, -16.4818]] },
  { code: "GH", name: "Ghana", continent: "Africa", cities: [["Accra", 5.6037, -0.187], ["Kumasi", 6.6885, -1.6244]] },
  { code: "NG", name: "Nigeria", continent: "Africa", cities: [["Lagos", 6.5244, 3.3792], ["Abuja", 9.0765, 7.3986]] },
  { code: "TN", name: "Tunisia", continent: "Africa", cities: [["Tunis", 36.8065, 10.1815], ["Sidi Bou Said", 36.8687, 10.3417]] },
];

export const ALL_COUNTRY_CODES = COUNTRIES.map((c) => c.code);

const EARTH_RADIUS_KM = 6371;
const toRad = (deg: number) => (deg * Math.PI) / 180;

export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

/** Nearest seed city, so any panorama (random, walked to, or deep-linked) gets a "near X" label. */
export function nearestCity(lat: number, lng: number) {
  let best: { city: string; country: Country; km: number } | null = null;
  for (const country of COUNTRIES) {
    for (const [city, cLat, cLng] of country.cities) {
      const km = distanceKm(lat, lng, cLat, cLng);
      if (!best || km < best.km) best = { city, country, km };
    }
  }
  return best;
}
