export interface CompGroup {
  id: string;
  org_id: string;
  name: string;
  category: string;
  method: string;
  sort_order: number;
}

export interface CompGroupClass {
  id: string;
  org_id: string;
  group_id: string;
  sla_class_id: string;
  type_label: string;
  client: string;
  star_1: number;
  star_2: number;
  star_3: number;
  star_4: number;
  star_5: number;
  hourly_gross: number;
  net_value: number;
  sort_order: number;
}

export interface CompGroupType {
  id: string;
  org_id: string;
  group_id: string;
  label: string;
  sort_order: number;
}

export const ALL_SLA_IDS = ["101","102","103","104","105","106","107","108","109","110","111","112","113"];

export const SHOW_CLASS_OPTIONS = [
  { label: "All (13)", value: 13 },
  { label: "1", value: 1 },
  { label: "3", value: 3 },
  { label: "5", value: 5 },
  { label: "7 (default)", value: 7 },
  { label: "9", value: 9 },
  { label: "11", value: 11 },
  { label: "13", value: 13 },
];

export const DEFAULT_GROUPS = [
  { name: "Comp. group clearing hourly salary", category: "clearing", method: "hourly", sort_order: 0 },
  { name: "Comp. group planting hourly salary", category: "planting", method: "hourly", sort_order: 1 },
  { name: "Comp. group clearing piece work salary", category: "clearing", method: "piecework", sort_order: 2 },
  { name: "Comp. group planting piece work salary", category: "planting", method: "piecework", sort_order: 3 },
];

export const SEED_PER_GROUP = [
  {
    typeLabel: "Clearing Type 1",
    typeFull: "Clearing Type 1 (Hourly Salary)",
    client: "Standard Inc.",
    classes: [
      { sla: "101", s1: 1.20, s2: 1.30, s3: 1.40, s4: 1.50, s5: 1.60, gross: 2900, net: 0 },
      { sla: "102", s1: 1.15, s2: 1.25, s3: 1.35, s4: 1.45, s5: 1.55, gross: 3000, net: 0 },
      { sla: "103", s1: 1.10, s2: 1.20, s3: 1.30, s4: 1.40, s5: 1.50, gross: 3100, net: 0 },
      { sla: "104", s1: 1.05, s2: 1.15, s3: 1.25, s4: 1.35, s5: 1.45, gross: 3200, net: 0 },
      { sla: "105", s1: 1.00, s2: 1.10, s3: 1.20, s4: 1.30, s5: 1.40, gross: 3300, net: 0 },
      { sla: "106", s1: 0.95, s2: 1.05, s3: 1.15, s4: 1.25, s5: 1.35, gross: 3400, net: 0 },
      { sla: "107", s1: 0.90, s2: 1.00, s3: 1.10, s4: 1.20, s5: 1.30, gross: 3500, net: 0 },
      { sla: "108", s1: 0.85, s2: 0.95, s3: 1.05, s4: 1.15, s5: 1.25, gross: 3725, net: 0 },
      { sla: "109", s1: 0.80, s2: 0.90, s3: 1.00, s4: 1.10, s5: 1.20, gross: 3950, net: 0 },
      { sla: "110", s1: 0.75, s2: 0.85, s3: 0.95, s4: 1.05, s5: 1.15, gross: 4175, net: 0 },
      { sla: "111", s1: 0.70, s2: 0.80, s3: 0.90, s4: 1.00, s5: 1.10, gross: 4400, net: 0 },
      { sla: "112", s1: 0.65, s2: 0.75, s3: 0.85, s4: 0.95, s5: 1.05, gross: 4625, net: 0 },
      { sla: "113", s1: 0.60, s2: 0.70, s3: 0.80, s4: 0.90, s5: 1.00, gross: 4850, net: 0 },
    ],
  },
  {
    typeLabel: "Planting Type 1",
    typeFull: "Planting Type 1 (Hourly Salary)",
    client: "Standard Inc.",
    classes: [
      { sla: "101", s1: 154, s2: 164, s3: 174, s4: 184, s5: 194, gross: 390, net: 0 },
      { sla: "102", s1: 155, s2: 165, s3: 175, s4: 185, s5: 195, gross: 400, net: 0 },
      { sla: "103", s1: 156, s2: 166, s3: 176, s4: 186, s5: 196, gross: 410, net: 0 },
      { sla: "104", s1: 157, s2: 167, s3: 177, s4: 187, s5: 197, gross: 420, net: 0 },
      { sla: "105", s1: 158, s2: 168, s3: 178, s4: 188, s5: 198, gross: 430, net: 0 },
      { sla: "106", s1: 159, s2: 169, s3: 179, s4: 189, s5: 199, gross: 440, net: 0 },
      { sla: "107", s1: 160, s2: 170, s3: 180, s4: 190, s5: 200, gross: 450, net: 0 },
      { sla: "108", s1: 161, s2: 171, s3: 181, s4: 191, s5: 201, gross: 460, net: 0 },
      { sla: "109", s1: 162, s2: 172, s3: 182, s4: 192, s5: 202, gross: 470, net: 0 },
      { sla: "110", s1: 163, s2: 173, s3: 183, s4: 193, s5: 203, gross: 480, net: 0 },
      { sla: "111", s1: 164, s2: 174, s3: 184, s4: 194, s5: 204, gross: 490, net: 0 },
      { sla: "112", s1: 165, s2: 175, s3: 185, s4: 195, s5: 205, gross: 500, net: 0 },
      { sla: "113", s1: 166, s2: 176, s3: 186, s4: 196, s5: 206, gross: 510, net: 0 },
    ],
  },
  {
    typeLabel: "Clearing Type 1",
    typeFull: "Clearing Type 1 (Piece Work)",
    client: "Standard Inc.",
    classes: [
      { sla: "101", s1: 1.20, s2: 1.30, s3: 1.40, s4: 1.50, s5: 1.60, gross: 2900, net: 1000 },
      { sla: "102", s1: 1.15, s2: 1.25, s3: 1.35, s4: 1.45, s5: 1.55, gross: 3000, net: 1050 },
      { sla: "103", s1: 1.10, s2: 1.20, s3: 1.30, s4: 1.40, s5: 1.50, gross: 3100, net: 1100 },
      { sla: "104", s1: 1.05, s2: 1.15, s3: 1.25, s4: 1.35, s5: 1.45, gross: 3200, net: 1145 },
      { sla: "105", s1: 1.00, s2: 1.10, s3: 1.20, s4: 1.30, s5: 1.40, gross: 3300, net: 1200 },
      { sla: "106", s1: 0.95, s2: 1.05, s3: 1.15, s4: 1.25, s5: 1.35, gross: 3400, net: 1270 },
      { sla: "107", s1: 0.90, s2: 1.00, s3: 1.10, s4: 1.20, s5: 1.30, gross: 3500, net: 1335 },
      { sla: "108", s1: 0.85, s2: 0.95, s3: 1.05, s4: 1.15, s5: 1.25, gross: 3725, net: 1415 },
      { sla: "109", s1: 0.80, s2: 0.90, s3: 1.00, s4: 1.10, s5: 1.20, gross: 3950, net: 1500 },
      { sla: "110", s1: 0.75, s2: 0.85, s3: 0.95, s4: 1.05, s5: 1.15, gross: 4175, net: 1650 },
      { sla: "111", s1: 0.70, s2: 0.80, s3: 0.90, s4: 1.00, s5: 1.10, gross: 4400, net: 1750 },
      { sla: "112", s1: 0.65, s2: 0.75, s3: 0.85, s4: 0.95, s5: 1.05, gross: 4625, net: 1850 },
      { sla: "113", s1: 0.60, s2: 0.70, s3: 0.80, s4: 0.90, s5: 1.00, gross: 4850, net: 1950 },
    ],
  },
  {
    typeLabel: "Planting Type 1",
    typeFull: "Planting Type 1 (Piece Work)",
    client: "Standard Inc.",
    classes: [
      { sla: "101", s1: 0, s2: 0, s3: 0, s4: 0, s5: 0, gross: 0, net: 0 },
      { sla: "102", s1: 0, s2: 0, s3: 0, s4: 0, s5: 0, gross: 0, net: 0 },
      { sla: "103", s1: 0, s2: 0, s3: 0, s4: 0, s5: 0, gross: 0, net: 0 },
      { sla: "104", s1: 0, s2: 0, s3: 0, s4: 0, s5: 0, gross: 0, net: 0 },
      { sla: "105", s1: 0, s2: 0, s3: 0, s4: 0, s5: 0, gross: 0, net: 0 },
      { sla: "106", s1: 0, s2: 0, s3: 0, s4: 0, s5: 0, gross: 0, net: 0 },
      { sla: "107", s1: 0, s2: 0, s3: 0, s4: 0, s5: 0, gross: 0, net: 0 },
      { sla: "108", s1: 0, s2: 0, s3: 0, s4: 0, s5: 0, gross: 0, net: 0 },
      { sla: "109", s1: 0, s2: 0, s3: 0, s4: 0, s5: 0, gross: 0, net: 0 },
      { sla: "110", s1: 0, s2: 0, s3: 0, s4: 0, s5: 0, gross: 0, net: 0 },
      { sla: "111", s1: 0, s2: 0, s3: 0, s4: 0, s5: 0, gross: 0, net: 0 },
      { sla: "112", s1: 0, s2: 0, s3: 0, s4: 0, s5: 0, gross: 0, net: 0 },
      { sla: "113", s1: 0, s2: 0, s3: 0, s4: 0, s5: 0, gross: 0, net: 0 },
    ],
  },
];

export const DEFAULT_CLIENTS = [
  "Swedish Forestry Corporation",
  "Standard Inc.",
  "Green Valley Enterprises",
  "Pacific Forest Management",
  "Sveaskog Norrland",
  "SCA Skog AB",
  "Northwest Logging Co.",
  "Forest Solutions Inc.",
  "Timber Tech Ltd",
];
