import type { EmployeeFormData } from "@/components/dashboard/EmployeeFormDialog";

const SWEDEN_DATA = {
  firstNames: ["Erik", "Anna", "Lars", "Sofia", "Oskar", "Astrid", "Gustav", "Elsa", "Nils", "Freja"],
  lastNames: ["Lindqvist", "Johansson", "Andersson", "Svensson", "Bergström", "Nilsson", "Eriksson", "Larsson"],
  cities: ["Stockholm", "Gothenburg", "Malmö", "Uppsala", "Lund"],
  phones: ["+46 70 123 4567", "+46 73 456 7890", "+46 76 234 5678"],
};

const ROMANIA_DATA = {
  firstNames: ["Andrei", "Elena", "Mihai", "Ioana", "Dragos", "Maria", "Alexandru", "Ana", "Stefan", "Cristina"],
  lastNames: ["Popescu", "Ionescu", "Popa", "Dumitru", "Stan", "Gheorghe", "Rusu", "Munteanu"],
  cities: ["Bucharest", "Cluj-Napoca", "Timișoara", "Iași", "Constanța"],
  phones: ["+40 721 123 456", "+40 744 567 890", "+40 733 234 567"],
};

const THAILAND_DATA = {
  firstNames: ["Somchai", "Siriporn", "Prasit", "Nattaya", "Kittisak", "Supaporn", "Thanawat", "Aranya", "Pichit", "Malai"],
  lastNames: ["Srisai", "Chaiyasit", "Thongkham", "Wongsawat", "Rattanapong", "Suwan", "Phetcharat", "Bunnak"],
  cities: ["Bangkok", "Chiang Mai", "Phuket", "Pattaya", "Khon Kaen"],
  phones: ["+66 81 234 5678", "+66 89 456 7890", "+66 92 345 6789"],
};

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const COUNTRY_MAP: Record<string, { country: string; data: typeof SWEDEN_DATA }> = {
  Sweden: { country: "Sweden", data: SWEDEN_DATA },
  Romania: { country: "Romania", data: ROMANIA_DATA },
  Thailand: { country: "Thailand", data: THAILAND_DATA },
};

export function generateDummyEmployee(): EmployeeFormData {
  const key = pick(Object.keys(COUNTRY_MAP));
  const { country, data } = COUNTRY_MAP[key];
  const first = pick(data.firstNames);
  const last = pick(data.lastNames);

  return {
    first_name: first,
    last_name: last,
    email: `${first.toLowerCase()}.${last.toLowerCase()}@example.com`,
    phone: pick(data.phones),
    city: pick(data.cities),
    country,
    status: pick(["INVITED", "ONBOARDING", "ACTIVE", "INACTIVE"] as const),
  };
}
