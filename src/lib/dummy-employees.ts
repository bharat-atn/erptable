const SWEDEN_DATA = {
  firstNames: ["Erik", "Lars", "Oskar", "Gustav", "Nils", "Johan", "Anders", "Per", "Karl", "Sven"],
  lastNames: ["Lindqvist", "Johansson", "Andersson", "Svensson", "Bergström", "Nilsson", "Eriksson", "Larsson"],
  middleNames: ["Karl", "Anders", "Johan", "Per", "Sven", "Olof", "Magnus", "Henrik"],
  cities: ["Stockholm", "Gothenburg", "Malmö", "Uppsala", "Lund"],
  states: ["Stockholm County", "Västra Götaland", "Skåne", "Uppsala County", "Norrbotten"],
  addresses: ["Kungsgatan 12", "Drottninggatan 45", "Storgatan 8", "Vasagatan 21", "Sveavägen 33"],
  phones: ["+46 70 123 4567", "+46 73 456 7890", "+46 76 234 5678"],
  postcodes: ["111 22", "411 36", "211 40", "753 10", "222 28"],
};

const ROMANIA_DATA = {
  firstNames: ["Andrei", "Mihai", "Dragos", "Alexandru", "Stefan", "Ion", "Vasile", "Nicolae", "Gheorghe", "Marius"],
  lastNames: ["Popescu", "Ionescu", "Popa", "Dumitru", "Stan", "Gheorghe", "Rusu", "Munteanu"],
  middleNames: ["Ion", "Vasile", "Nicolae", "Gheorghe", "Constantin", "Florin", "Adrian", "Daniel"],
  cities: ["Bucharest", "Cluj-Napoca", "Timișoara", "Iași", "Constanța"],
  states: ["Bucharest", "Cluj", "Timiș", "Iași", "Constanța"],
  addresses: ["Strada Victoriei 15", "Bulevardul Unirii 28", "Calea Dorobanți 42", "Strada Lipscani 7"],
  phones: ["+40 721 123 456", "+40 744 567 890", "+40 733 234 567"],
  postcodes: ["010071", "400001", "300001", "700001", "900001"],
};

const THAILAND_DATA = {
  firstNames: ["Somchai", "Prasit", "Kittisak", "Thanawat", "Pichit", "Anon", "Somsak", "Wichai", "Chaiwat", "Narong"],
  lastNames: ["Srisai", "Chaiyasit", "Thongkham", "Wongsawat", "Rattanapong", "Suwan", "Phetcharat", "Bunnak"],
  middleNames: ["", "", "", "", "", "", "", ""],
  cities: ["Bangkok", "Chiang Mai", "Phuket", "Pattaya", "Khon Kaen"],
  states: ["Bangkok", "Chiang Mai", "Phuket", "Chonburi", "Khon Kaen"],
  addresses: ["123 Sukhumvit Rd", "456 Silom Rd", "789 Ratchadaphisek Rd", "321 Phahon Yothin Rd"],
  phones: ["+66 81 234 5678", "+66 89 456 7890", "+66 92 345 6789"],
  postcodes: ["10110", "50200", "83000", "20150", "40000"],
};

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const COUNTRY_MAP: Record<string, { country: string; data: typeof SWEDEN_DATA }> = {
  Sweden: { country: "Sweden", data: SWEDEN_DATA },
  Romania: { country: "Romania", data: ROMANIA_DATA },
  Thailand: { country: "Thailand", data: THAILAND_DATA },
};

function randomBirthday(): string {
  const now = new Date();
  const minAge = 20;
  const maxAge = 55;
  const age = minAge + Math.floor(Math.random() * (maxAge - minAge));
  const year = now.getFullYear() - age;
  const month = Math.floor(Math.random() * 12) + 1;
  const day = Math.floor(Math.random() * 28) + 1;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export interface DummyEmployeeData {
  first_name: string;
  last_name: string;
  middle_name: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  status: "INVITED" | "ONBOARDING" | "ACTIVE" | "INACTIVE";
  personal_info: {
    preferred_name: string;
    address1: string;
    address2: string;
    zip_code: string;
    state_province: string;
    country_of_birth: string;
    citizenship: string;
    birthday: string;
    emergency_first_name: string;
    emergency_last_name: string;
    emergency_mobile: string;
  };
}

export type DummyCountry = "Sweden" | "Romania" | "Thailand";

export function generateDummyEmployee(selectedCountry?: DummyCountry): DummyEmployeeData {
  const key = selectedCountry || pick(Object.keys(COUNTRY_MAP)) as DummyCountry;
  const { country, data } = COUNTRY_MAP[key];
  const first = pick(data.firstNames);
  const last = pick(data.lastNames);
  const middle = pick(data.middleNames);
  const emergFirst = pick(data.firstNames);
  const emergLast = pick(data.lastNames);

  return {
    first_name: first,
    last_name: last,
    middle_name: middle,
    email: `${first.toLowerCase()}.${last.toLowerCase()}@example.com`,
    phone: pick(data.phones),
    city: pick(data.cities),
    country,
    status: pick(["INVITED", "ONBOARDING", "ACTIVE", "INACTIVE"] as const),
    personal_info: {
      preferred_name: first,
      address1: pick(data.addresses),
      address2: "",
      zip_code: pick(data.postcodes),
      state_province: pick(data.states),
      country_of_birth: country,
      citizenship: country,
      birthday: randomBirthday(),
      emergency_first_name: emergFirst,
      emergency_last_name: emergLast,
      emergency_mobile: pick(data.phones),
    },
  };
}
