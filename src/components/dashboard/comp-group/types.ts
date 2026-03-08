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
      { sla: "104", s1: 125, s2: 135, s3: 145, s4: 155, s5: 170, gross: 145, net: 0 },
      { sla: "105", s1: 130, s2: 140, s3: 150, s4: 160, s5: 175, gross: 150, net: 0 },
      { sla: "106", s1: 135, s2: 145, s3: 155, s4: 165, s5: 180, gross: 155, net: 0 },
      { sla: "107", s1: 140, s2: 150, s3: 160, s4: 170, s5: 185, gross: 160, net: 0 },
      { sla: "108", s1: 145, s2: 155, s3: 165, s4: 175, s5: 190, gross: 165, net: 0 },
      { sla: "109", s1: 150, s2: 160, s3: 170, s4: 180, s5: 195, gross: 170, net: 0 },
      { sla: "110", s1: 155, s2: 165, s3: 175, s4: 185, s5: 200, gross: 175, net: 0 },
    ],
  },
  {
    typeLabel: "Planting Type 1",
    typeFull: "Planting Type 1 (Hourly Salary)",
    client: "Standard Inc.",
    classes: [
      { sla: "104", s1: 157, s2: 167, s3: 177, s4: 187, s5: 197, gross: 420, net: 0 },
      { sla: "105", s1: 158, s2: 168, s3: 178, s4: 188, s5: 198, gross: 430, net: 0 },
      { sla: "106", s1: 159, s2: 169, s3: 179, s4: 189, s5: 199, gross: 440, net: 0 },
      { sla: "107", s1: 160, s2: 170, s3: 180, s4: 190, s5: 200, gross: 450, net: 0 },
      { sla: "108", s1: 161, s2: 171, s3: 181, s4: 191, s5: 201, gross: 460, net: 0 },
      { sla: "109", s1: 162, s2: 172, s3: 182, s4: 192, s5: 202, gross: 470, net: 0 },
      { sla: "110", s1: 163, s2: 173, s3: 183, s4: 193, s5: 203, gross: 480, net: 0 },
    ],
  },
  {
    typeLabel: "Clearing Type 1",
    typeFull: "Clearing Type 1 (Piece Work)",
    client: "Standard Inc.",
    classes: [
      { sla: "104", s1: 1.05, s2: 1.15, s3: 1.25, s4: 1.35, s5: 1.45, gross: 3200, net: 1145 },
      { sla: "105", s1: 1.00, s2: 1.10, s3: 1.20, s4: 1.30, s5: 1.40, gross: 3300, net: 1200 },
      { sla: "106", s1: 0.95, s2: 1.05, s3: 1.15, s4: 1.25, s5: 1.35, gross: 3400, net: 1270 },
      { sla: "107", s1: 0.90, s2: 1.00, s3: 1.10, s4: 1.20, s5: 1.30, gross: 3500, net: 1335 },
      { sla: "108", s1: 0.85, s2: 0.95, s3: 1.05, s4: 1.15, s5: 1.25, gross: 3725, net: 1415 },
      { sla: "109", s1: 0.80, s2: 0.90, s3: 1.00, s4: 1.10, s5: 1.20, gross: 3950, net: 1500 },
      { sla: "110", s1: 0.75, s2: 0.85, s3: 0.95, s4: 1.05, s5: 1.15, gross: 4175, net: 1650 },
    ],
  },
  {
    typeLabel: "Planting Type 1",
    typeFull: "Planting Type 1 (Piece Work)",
    client: "Standard Inc.",
    classes: [
      { sla: "104", s1: 0, s2: 0, s3: 0, s4: 0, s5: 0, gross: 0, net: 0 },
      { sla: "105", s1: 0, s2: 0, s3: 0, s4: 0, s5: 0, gross: 0, net: 0 },
      { sla: "106", s1: 0, s2: 0, s3: 0, s4: 0, s5: 0, gross: 0, net: 0 },
      { sla: "107", s1: 0, s2: 0, s3: 0, s4: 0, s5: 0, gross: 0, net: 0 },
      { sla: "108", s1: 0, s2: 0, s3: 0, s4: 0, s5: 0, gross: 0, net: 0 },
      { sla: "109", s1: 0, s2: 0, s3: 0, s4: 0, s5: 0, gross: 0, net: 0 },
      { sla: "110", s1: 0, s2: 0, s3: 0, s4: 0, s5: 0, gross: 0, net: 0 },
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
