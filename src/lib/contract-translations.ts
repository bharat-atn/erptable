/**
 * Full translations for the employment contract document.
 * Swedish is always the legally binding language and appears as the secondary line.
 * The "primary" language (EN, RO, or TH) appears first.
 *
 * Language codes match LanguageSelectionStep: "EN/SE", "SE", "RO/SE", "TH/SE"
 */

type LangCode = "EN/SE" | "SE" | "RO/SE" | "TH/SE" | string;

// Each translatable string is keyed and has EN, RO, TH variants.
// Swedish is stored separately since it always appears.
interface LabelSet {
  en: string;
  sv: string;
  ro: string;
  th: string;
}

function L(en: string, sv: string, ro: string, th: string): LabelSet {
  return { en, sv, ro, th };
}

export const CONTRACT_LABELS = {
  // Header
  title: L(
    "EMPLOYMENT CONTRACT",
    "ANSTÄLLNINGSAVTAL",
    "CONTRACT DE MUNCĂ",
    "สัญญาจ้างงาน"
  ),
  season: L("Season", "Säsong", "Sezon", "ฤดูกาล"),
  legalDisclaimer: L(
    "The legally binding language of this contract is Swedish.",
    "Det juridiskt bindande språket i detta avtal är svenska.",
    "Limba obligatorie din punct de vedere juridic a acestui contract este suedeza.",
    "ภาษาที่มีผลผูกพันทางกฎหมายของสัญญานี้คือภาษาสวีเดน"
  ),

  // §1
  s1_title: L("Employer", "Arbetsgivare", "Angajator", "นายจ้าง"),
  employer: L("Employer", "Arbetsgivare", "Angajator", "นายจ้าง"),
  orgNumber: L("Organization Number", "Organisationsnummer", "Număr de înregistrare", "หมายเลของค์กร"),
  address: L("Address", "Adress", "Adresă", "ที่อยู่"),
  postcodeCity: L("Postcode & City", "Postnummer & Ort", "Cod poștal & Oraș", "รหัสไปรษณีย์ & เมือง"),

  // §2
  s2_title: L("Employee", "Arbetstagare", "Angajat", "ลูกจ้าง"),
  firstName: L("First Name", "Förnamn", "Prenume", "ชื่อ"),
  middleName: L("Middle Name", "Mellannamn", "Al doilea prenume", "ชื่อกลาง"),
  lastName: L("Last Name", "Efternamn", "Nume de familie", "นามสกุล"),
  city: L("City", "Ort", "Oraș", "เมือง"),
  postcode: L("Postcode", "Postnummer", "Cod poștal", "รหัสไปรษณีย์"),
  country: L("Country", "Land", "Țară", "ประเทศ"),
  dateOfBirth: L("Date of Birth", "Födelsedatum", "Data nașterii", "วันเกิด"),
  citizenship: L("Citizenship", "Medborgarskap", "Cetățenie", "สัญชาติ"),
  mobile: L("Mobile", "Mobilnummer", "Telefon mobil", "โทรศัพท์มือถือ"),
  email: L("Email", "E-post", "E-mail", "อีเมล"),
  emergencyContact: L("Emergency Contact", "Nödkontakt", "Contact de urgență", "ผู้ติดต่อฉุกเฉิน"),

  // §3
  s3_title: L("Position & Duties", "Befattning & Arbetsuppgifter", "Funcție și atribuții", "ตำแหน่งและหน้าที่"),
  mainDuties: L("Main Duties", "Huvudsakliga Arbetsuppgifter", "Atribuții principale", "หน้าที่หลัก"),
  jobType: L("Job Type", "Anställningstyp", "Tipul postului", "ประเภทงาน"),
  experienceLevel: L("Experience Level", "Erfarenhetsnivå", "Nivel de experiență", "ระดับประสบการณ์"),
  postingLocation: L("Posting Location", "Stationeringsort", "Locul de detașare", "สถานที่ปฏิบัติงาน"),
  mainWorkplace: L("Main Workplace", "Huvudarbetsplats", "Locul principal de muncă", "สถานที่ทำงานหลัก"),
  workplaceVaries: L("Workplace Varies", "Arbetsplats Varierar", "Locul de muncă variază", "สถานที่ทำงานเปลี่ยนแปลง"),
  yes: L("Yes", "Ja", "Da", "ใช่"),
  no: L("No", "Nej", "Nu", "ไม่"),

  // §4
  s4_title: L("Form of Employment", "Anställningsform", "Forma de angajare", "รูปแบบการจ้างงาน"),
  employmentForm: L("Employment Form", "Anställningsform", "Forma de angajare", "รูปแบบการจ้างงาน"),
  fromDate: L("From", "Från", "De la", "ตั้งแต่"),
  untilDate: L("Until", "Till", "Până la", "จนถึง"),
  fromDateFull: L("From Date", "Från Datum", "De la data", "ตั้งแต่วันที่"),
  endAround: L("End Around", "Slutar Omkring", "Sfârșit în jurul datei", "สิ้นสุดประมาณ"),
  position: L("Position", "Befattning", "Funcție", "ตำแหน่ง"),

  // Employment form types
  ef_permanent: L("Permanent", "Tillsvidareanställning", "Permanent", "ถาวร"),
  ef_probation: L("Probationary", "Provanställning", "Perioadă de probă", "ทดลองงาน"),
  ef_fixedTerm: L("Fixed-term", "Tidsbegränsad anställning", "Pe durată determinată", "สัญญาจ้างระยะเวลาแน่นอน"),
  ef_tempReplacement: L("Temporary replacement", "Vikariat", "Înlocuire temporară", "รับช่วงแทนชั่วคราว"),
  ef_seasonal: L("Seasonal", "Säsongsanställning", "Sezonier", "ตามฤดูกาล"),
  ef_age69: L("Age 69+", "Anställning efter 69 år", "Vârsta 69+", "อายุ 69+"),

  // §5
  s5_title: L("Working Time & Leave", "Arbetstid & Semester", "Timp de lucru și concediu", "เวลาทำงานและวันลา"),
  workingTime: L("Working Time", "Arbetstid", "Timp de lucru", "เวลาทำงาน"),
  fullTime: L("Full-time", "Heltid", "Normă întreagă", "เต็มเวลา"),
  partTime: L("Part-time", "Deltid", "Normă parțială", "นอกเวลา"),
  annualLeave: L("Annual Leave", "Semesterdagar", "Concediu anual", "วันลาพักร้อน"),
  days: L("days", "dagar", "zile", "วัน"),

  // §6
  s6_title: L("Notice Period", "Uppsägningstid", "Perioada de preaviz", "ระยะเวลาแจ้งล่วงหน้า"),
  s6_text: L(
    "Notice periods are regulated in accordance with the Swedish Employment Protection Act (LAS) and applicable collective agreements (Skogsavtalet).",
    "Uppsägningstider regleras i enlighet med lagen om anställningsskydd (LAS) och tillämpliga kollektivavtal (Skogsavtalet).",
    "Perioadele de preaviz sunt reglementate în conformitate cu Legea suedeză privind protecția muncii (LAS) și acordurile colective aplicabile (Skogsavtalet).",
    "ระยะเวลาแจ้งล่วงหน้าเป็นไปตามกฎหมายคุ้มครองการจ้างงานของสวีเดน (LAS) และข้อตกลงร่วมที่บังคับใช้ (Skogsavtalet)"
  ),

  // §7
  s7_title: L("Compensation", "Ersättning", "Compensație", "ค่าตอบแทน"),
  salaryType: L("Salary Type", "Lönetyp", "Tipul salariului", "ประเภทเงินเดือน"),
  hourly: L("Hourly", "Timlön", "Pe oră", "รายชั่วโมง"),
  monthly: L("Monthly", "Månadslön", "Lunar", "รายเดือน"),
  companyPremium: L("Company Premium", "Företagspremie", "Prima companiei", "เบี้ยประกันบริษัท"),
  aboveOfficialRate: L("above official rate", "över officiell taxa", "peste rata oficială", "เหนืออัตราอย่างเป็นทางการ"),
  jobTypeN: L("Job Type", "Befattningstyp", "Tip post", "ประเภทงาน"),
  hourlyBasicRate: L("Hourly Basic Rate", "Grundtimlön", "Tarif orar de bază", "อัตราค่าจ้างรายชั่วโมงพื้นฐาน"),
  hourlyPremium: L("Hourly Premium", "Tillägg", "Prima orară", "เบี้ยเพิ่มรายชั่วโมง"),
  monthlyBasicRate: L("Monthly Basic Rate", "Grundmånadslön", "Salariu lunar de bază", "อัตราเงินเดือนพื้นฐาน"),
  monthlyPremium: L("Monthly Premium", "Tillägg", "Prima lunară", "เบี้ยเพิ่มรายเดือน"),

  // §8
  s8_title: L("Salary Details", "Löneuppgifter", "Detalii salariu", "รายละเอียดเงินเดือน"),
  overtimeClause: L(
    "Only ordered overtime will be compensated with overtime pay.",
    "Endast beordrad övertid ersätts med övertidsersättning.",
    "Doar orele suplimentare dispuse vor fi compensate cu plata orelor suplimentare.",
    "เฉพาะการทำงานล่วงเวลาที่ได้รับคำสั่งเท่านั้นที่จะได้รับค่าชดเชยการทำงานล่วงเวลา"
  ),
  pieceWorkPay: L("Piece Work Pay", "Ackordslön", "Plata în acord", "ค่าจ้างตามชิ้นงาน"),
  otherBenefits: L("Other Benefits", "Övriga Förmåner", "Alte beneficii", "สวัสดิการอื่นๆ"),
  paymentMethod: L("Payment Method", "Utbetalningssätt", "Metoda de plată", "วิธีการชำระเงิน"),
  bankAccount: L("Bank Account", "Bankkonto", "Cont bancar", "บัญชีธนาคาร"),
  cash: L("Cash", "Kontant", "Numerar", "เงินสด"),

  // §9
  s9_title: L("Mandatory Training", "Obligatorisk Utbildning", "Instruire obligatorie", "การฝึกอบรมภาคบังคับ"),
  s9_intro: L(
    "The following training programs are mandatory for the employee before commencing work.",
    "Följande utbildningsprogram är obligatoriska för arbetstagaren innan arbetet påbörjas.",
    "Următoarele programe de instruire sunt obligatorii pentru angajat înainte de începerea activității.",
    "โปรแกรมการฝึกอบรมต่อไปนี้เป็นภาคบังคับสำหรับลูกจ้างก่อนเริ่มงาน"
  ),
  mandatory: L("MANDATORY", "OBLIGATORISK", "OBLIGATORIU", "ภาคบังคับ"),
  other: L("Other", "Annat", "Altele", "อื่นๆ"),
  noTraining: L(
    "No mandatory training programs selected.",
    "Inga obligatoriska utbildningsprogram valda.",
    "Nu au fost selectate programe de instruire obligatorie.",
    "ไม่มีโปรแกรมฝึกอบรมภาคบังคับที่เลือก"
  ),

  // §10
  s10_title: L("Social Security", "Social Trygghet", "Securitate socială", "ประกันสังคม"),
  s10_text: L(
    "Social security contributions and insurance are provided in accordance with Swedish law and applicable collective agreements. The employer shall ensure that the employee is covered by:",
    "Sociala avgifter och försäkringar tillhandahålls i enlighet med svensk lag och tillämpliga kollektivavtal. Arbetsgivaren ska säkerställa att arbetstagaren omfattas av:",
    "Contribuțiile și asigurările sociale sunt furnizate în conformitate cu legislația suedeză și acordurile colective aplicabile. Angajatorul se asigură că angajatul este acoperit de:",
    "เงินสมทบประกันสังคมและการประกันภัยจัดให้ตามกฎหมายสวีเดนและข้อตกลงร่วมที่บังคับใช้ นายจ้างต้องมั่นใจว่าลูกจ้างได้รับความคุ้มครองจาก:"
  ),
  s10_pension: L("Occupational pension (Tjänstepension) as per Skogsavtalet", "Tjänstepension enligt Skogsavtalet", "Pensie ocupațională (Tjänstepension) conform Skogsavtalet", "บำนาญอาชีพ (Tjänstepension) ตาม Skogsavtalet"),
  s10_tgl: L("Occupational group life insurance (TGL)", "Tjänstegrupplivförsäkring (TGL)", "Asigurare de viață de grup (TGL)", "ประกันชีวิตกลุ่มอาชีพ (TGL)"),
  s10_tfa: L("Occupational injury insurance (TFA)", "Trygghetsförsäkring vid arbetsskada (TFA)", "Asigurare pentru accidente de muncă (TFA)", "ประกันอุบัติเหตุจากการทำงาน (TFA)"),
  s10_ags: L("Severance pay insurance (AGS)", "Avtalsgruppsjukförsäkring (AGS)", "Asigurare de concediu medical (AGS)", "ประกันเงินชดเชย (AGS)"),

  // §11
  s11_title: L("Miscellaneous", "Övrigt", "Diverse", "เบ็ดเตล็ด"),
  noAdditionalTerms: L("No additional terms specified.", "Inga ytterligare villkor angivna.", "Nu au fost specificate condiții suplimentare.", "ไม่มีเงื่อนไขเพิ่มเติม"),

  // §12
  s12_title: L("Notes", "Anmärkningar", "Observații", "หมายเหตุ"),
  s12_note1: L(
    "This contract is governed by Swedish law and the collective agreement for the forestry sector (Skogsavtalet).",
    "Detta avtal regleras av svensk lag och kollektivavtalet för skogssektorn (Skogsavtalet).",
    "Acest contract este guvernat de legislația suedeză și acordul colectiv pentru sectorul forestier (Skogsavtalet).",
    "สัญญานี้อยู่ภายใต้กฎหมายสวีเดนและข้อตกลงร่วมสำหรับภาคป่าไม้ (Skogsavtalet)"
  ),
  s12_note2: L(
    "The employee is required to comply with workplace health and safety regulations (AFS).",
    "Arbetstagaren är skyldig att följa arbetsmiljöföreskrifter (AFS).",
    "Angajatul este obligat să respecte reglementările privind sănătatea și securitatea la locul de muncă (AFS).",
    "ลูกจ้างต้องปฏิบัติตามข้อบังคับด้านสุขภาพและความปลอดภัยในสถานที่ทำงาน (AFS)"
  ),
  s12_note3: L(
    "Any changes to this agreement must be confirmed in writing by both parties.",
    "Ändringar i detta avtal ska bekräftas skriftligen av båda parter.",
    "Orice modificare a acestui acord trebuie confirmată în scris de ambele părți.",
    "การเปลี่ยนแปลงใดๆ ในข้อตกลงนี้ต้องได้รับการยืนยันเป็นลายลักษณ์อักษรจากทั้งสองฝ่าย"
  ),
  s12_note4: L(
    "Dispute resolution deadlines are governed by LAS §§ 40-42.",
    "Frister för underrättelse och väckande av talan vid tvist om avslut av anställning finns i §§ LAS 40-42.",
    "Termenele de soluționare a litigiilor sunt reglementate de LAS §§ 40-42.",
    "กำหนดเวลาการระงับข้อพิพาทเป็นไปตาม LAS §§ 40-42"
  ),
  s12_note5: L(
    "Rules for notice, information and the obligation to negotiate are set out in MBL §§ 11-14.",
    "Regler för varsel, information och förhandlingsskyldighet finns i §§ MBL 11-14.",
    "Regulile privind notificarea, informarea și obligația de negociere sunt stabilite în MBL §§ 11-14.",
    "กฎเกณฑ์การแจ้งเตือน ข้อมูล และภาระผูกพันในการเจรจาระบุไว้ใน MBL §§ 11-14"
  ),

  // §13
  s13_title: L("Net Salary Deductions", "Nettolöneavdrag", "Deduceri din salariul net", "การหักเงินเดือนสุทธิ"),
  type: L("Type", "Typ", "Tip", "ประเภท"),
  amount: L("Amount", "Belopp", "Sumă", "จำนวนเงิน"),
  frequency: L("Frequency", "Frekvens", "Frecvență", "ความถี่"),
  note: L("Note", "Anteckning", "Notă", "หมายเหตุ"),

  // Frequency labels
  freq_monthly: L("Monthly", "Månadsvis", "Lunar", "รายเดือน"),
  freq_weekly: L("Weekly", "Veckovis", "Săptămânal", "รายสัปดาห์"),
  freq_oneTime: L("One-time", "Engångs", "O singură dată", "ครั้งเดียว"),
  freq_perKm: L("Per km", "Per km", "Pe km", "ต่อกิโลเมตร"),

  // Deduction types
  ded_rent: L("Rent / Accommodation", "Hyra / Boende", "Chirie / Cazare", "ค่าเช่า / ที่พัก"),
  ded_car: L("Company Car Usage", "Tjänstebil", "Utilizare mașină de serviciu", "การใช้รถบริษัท"),
  ded_travel: L("Travel Costs", "Resekostnader", "Costuri de deplasare", "ค่าเดินทาง"),
  ded_immigration: L("Immigration Process Fees", "Migrationsverkets avgifter", "Taxe de imigrare", "ค่าธรรมเนียมกระบวนการตรวจคนเข้าเมือง"),
  ded_other: L("Other Deduction", "Annat avdrag", "Altă deducere", "การหักอื่นๆ"),

  // Signatures
  signatures: L("Signatures", "Underskrifter", "Semnături", "ลายเซ็น"),
  sigIntro: L(
    "This contract has been drawn up in two identical copies, of which each party has received one.",
    "Detta avtal har upprättats i två likalydande exemplar, varav parterna tagit var sitt.",
    "Acest contract a fost întocmit în două exemplare identice, fiecare parte primind câte unul.",
    "สัญญานี้จัดทำขึ้นเป็นสองฉบับเหมือนกัน ซึ่งแต่ละฝ่ายได้รับฉบับละหนึ่งฉบับ"
  ),
  placeAndDate: L("Place and date", "Plats och datum", "Locul și data", "สถานที่และวันที่"),
  company: L("Company", "Företag", "Compania", "บริษัท"),
  employerSignature: L("Employer's signature", "Arbetsgivarens underskrift", "Semnătura angajatorului", "ลายเซ็นนายจ้าง"),
  employee: L("Employee", "Arbetstagare", "Angajat", "ลูกจ้าง"),
  employeeSignature: L("Employee's signature", "Arbetstagarens underskrift", "Semnătura angajatului", "ลายเซ็นลูกจ้าง"),
  signed: L("Signed", "Undertecknad", "Semnat", "ลงนามแล้ว"),
} as const;

/**
 * Returns a bilingual label string based on the selected contract language.
 * Format: "Primary / Swedish"  (or just "Swedish" for SE-only)
 */
export function bilingualLabel(label: LabelSet, lang: LangCode): string {
  switch (lang) {
    case "SE":
      return label.sv;
    case "RO/SE":
      return `${label.ro} / ${label.sv}`;
    case "TH/SE":
      return `${label.th} / ${label.sv}`;
    case "EN/SE":
    default:
      return `${label.en} / ${label.sv}`;
  }
}

/**
 * Returns primary-language text (for standalone paragraphs).
 */
export function primaryText(label: LabelSet, lang: LangCode): string {
  switch (lang) {
    case "SE":
      return label.sv;
    case "RO/SE":
      return label.ro;
    case "TH/SE":
      return label.th;
    case "EN/SE":
    default:
      return label.en;
  }
}

/**
 * Returns Swedish text (for the secondary line beneath primary).
 */
export function swedishText(label: LabelSet): string {
  return label.sv;
}

export type { LabelSet, LangCode };
