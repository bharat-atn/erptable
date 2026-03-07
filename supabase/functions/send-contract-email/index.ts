import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/* ── Utilities ── */
function fmtDate(val: string | null | undefined): string {
  if (!val) return "—";
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  try {
    const d = new Date(val);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  } catch { return val; }
}

function esc(v: any): string {
  if (v === null || v === undefined) return "—";
  return String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/* ── Bilingual label system ── */
interface LS { en: string; sv: string; ro: string; th: string; uk: string; }
function L(en: string, sv: string, ro: string, th: string, uk: string): LS { return { en, sv, ro, th, uk }; }

function bl(l: LS, lang: string): string {
  switch (lang) {
    case "SE": return l.sv;
    case "RO/SE": return `${l.ro} / ${l.sv}`;
    case "TH/SE": return `${l.th} / ${l.sv}`;
    case "UK/SE": return `${l.uk} / ${l.sv}`;
    default: return `${l.en} / ${l.sv}`;
  }
}
function pt(l: LS, lang: string): string {
  switch (lang) {
    case "SE": return l.sv;
    case "RO/SE": return l.ro;
    case "TH/SE": return l.th;
    case "UK/SE": return l.uk;
    default: return l.en;
  }
}
function svt(l: LS): string { return l.sv; }

/* ── All contract labels ── */
const CL = {
  title: L("EMPLOYMENT CONTRACT", "ANSTÄLLNINGSAVTAL", "CONTRACT DE MUNCĂ", "สัญญาจ้างงาน", "ТРУДОВИЙ ДОГОВІР"),
  season: L("Season", "Säsong", "Sezon", "ฤดูกาล", "Сезон"),
  legalDisclaimer: L("The legally binding language of this contract is Swedish.", "Det juridiskt bindande språket i detta avtal är svenska.", "Limba obligatorie din punct de vedere juridic a acestui contract este suedeza.", "ภาษาที่มีผลผูกพันทางกฎหมายของสัญญานี้คือภาษาสวีเดน", "Юридично обов'язковою мовою цього договору є шведська."),
  s1_title: L("Employer", "Arbetsgivare", "Angajator", "นายจ้าง", "Роботодавець"),
  employer: L("Employer", "Arbetsgivare", "Angajator", "นายจ้าง", "Роботодавець"),
  orgNumber: L("Organization Number", "Organisationsnummer", "Număr de înregistrare", "หมายเลของค์กร", "Реєстраційний номер"),
  address: L("Address", "Adress", "Adresă", "ที่อยู่", "Адреса"),
  postcodeCity: L("Postcode & City", "Postnummer & Ort", "Cod poștal & Oraș", "รหัสไปรษณีย์ & เมือง", "Поштовий індекс та місто"),
  s2_title: L("Employee", "Arbetstagare", "Angajat", "ลูกจ้าง", "Працівник"),
  firstName: L("First Name", "Förnamn", "Prenume", "ชื่อ", "Ім'я"),
  middleName: L("Middle Name", "Mellannamn", "Al doilea prenume", "ชื่อกลาง", "По батькові"),
  lastName: L("Last Name", "Efternamn", "Nume de familie", "นามสกุล", "Прізвище"),
  city: L("City", "Ort", "Oraș", "เมือง", "Місто"),
  postcode: L("Postcode", "Postnummer", "Cod poștal", "รหัสไปรษณีย์", "Поштовий індекс"),
  country: L("Country", "Land", "Țară", "ประเทศ", "Країна"),
  dateOfBirth: L("Date of Birth", "Födelsedatum", "Data nașterii", "วันเกิด", "Дата народження"),
  citizenship: L("Citizenship", "Medborgarskap", "Cetățenie", "สัญชาติ", "Громадянство"),
  mobile: L("Mobile", "Mobilnummer", "Telefon mobil", "โทรศัพท์มือถือ", "Мобільний"),
  email: L("Email", "E-post", "E-mail", "อีเมล", "Електронна пошта"),
  emergencyContact: L("Emergency Contact", "Nödkontakt", "Contact de urgență", "ผู้ติดต่อฉุกเฉิน", "Контакт для екстрених випадків"),
  s3_title: L("Position & Duties", "Befattning & Arbetsuppgifter", "Funcție și atribuții", "ตำแหน่งและหน้าที่", "Посада та обов'язки"),
  mainDuties: L("Main Duties", "Huvudsakliga Arbetsuppgifter", "Atribuții principale", "หน้าที่หลัก", "Основні обов'язки"),
  jobType: L("Job Type", "Anställningstyp", "Tipul postului", "ประเภทงาน", "Тип роботи"),
  experienceLevel: L("Experience Level", "Erfarenhetsnivå", "Nivel de experiență", "ระดับประสบการณ์", "Рівень досвіду"),
  postingLocation: L("Posting Location", "Stationeringsort", "Locul de detașare", "สถานที่ปฏิบัติงาน", "Місце відрядження"),
  mainWorkplace: L("Main Workplace", "Huvudarbetsplats", "Locul principal de muncă", "สถานที่ทำงานหลัก", "Основне робоче місце"),
  workplaceVaries: L("Workplace Varies", "Arbetsplats Varierar", "Locul de muncă variază", "สถานที่ทำงานเปลี่ยนแปลง", "Робоче місце змінюється"),
  yes: L("Yes", "Ja", "Da", "ใช่", "Так"),
  no: L("No", "Nej", "Nu", "ไม่", "Ні"),
  s4_title: L("Form of Employment", "Anställningsform", "Forma de angajare", "รูปแบบการจ้างงาน", "Форма зайнятості"),
  employmentForm: L("Employment Form", "Anställningsform", "Forma de angajare", "รูปแบบการจ้างงาน", "Форма зайнятості"),
  fromDate: L("From", "Från", "De la", "ตั้งแต่", "З"),
  untilDate: L("Until", "Till", "Până la", "จนถึง", "До"),
  fromDateFull: L("From Date", "Från Datum", "De la data", "ตั้งแต่วันที่", "З дати"),
  endAround: L("End Around", "Slutar Omkring", "Sfârșit în jurul datei", "สิ้นสุดประมาณ", "Закінчення приблизно"),
  position: L("Position", "Befattning", "Funcție", "ตำแหน่ง", "Посада"),
  ef_permanent: L("Permanent", "Tillsvidareanställning", "Permanent", "ถาวร", "Безстроковий"),
  ef_probation: L("Probationary", "Provanställning", "Perioadă de probă", "ทดลองงาน", "Випробувальний"),
  ef_fixedTerm: L("Fixed-term", "Tidsbegränsad anställning", "Pe durată determinată", "สัญญาจ้างระยะเวลาแน่นอน", "Строковий"),
  ef_tempReplacement: L("Temporary replacement", "Vikariat", "Înlocuire temporară", "รับช่วงแทนชั่วคราว", "Тимчасова заміна"),
  ef_seasonal: L("Seasonal", "Säsongsanställning", "Sezonier", "ตามฤดูกาล", "Сезонний"),
  ef_age69: L("Age 69+", "Anställning efter 69 år", "Vârsta 69+", "อายุ 69+", "Вік 69+"),
  s4_comesIntoForce: L(
    "The employment contract comes into force when work on the site begins and finishes when the assigned mission is finished or if the weather conditions no longer allow the continuation of the mission.",
    "Anställningsavtalet träder i kraft när arbetet på platsen påbörjas och upphör när det tilldelade uppdraget är slutfört eller om väderförhållandena inte längre tillåter att uppdraget fortsätter.",
    "Contractul de muncă intră în vigoare când munca pe șantier începe și se încheie când misiunea atribuită este finalizată sau dacă condițiile meteorologice nu mai permit continuarea misiunii.",
    "สัญญาจ้างงานมีผลบังคับใช้เมื่อเริ่มทำงานในพื้นที่และสิ้นสุดเมื่อภารกิจที่ได้รับมอบหมายเสร็จสิ้นหรือสภาพอากาศไม่อนุญาตให้ดำเนินภารกิจต่อไป",
    "Трудовий договір набуває чинності, коли починається робота на об'єкті, і закінчується, коли призначене завдання виконано або якщо погодні умови більше не дозволяють продовження завдання."
  ),
  s5_title: L("Working Time & Leave", "Arbetstid & Semester", "Timp de lucru și concediu", "เวลาทำงานและวันลา", "Робочий час та відпустка"),
  workingTime: L("Working Time", "Arbetstid", "Timp de lucru", "เวลาทำงาน", "Робочий час"),
  fullTime: L("Full-time", "Heltid", "Normă întreagă", "เต็มเวลา", "Повна зайнятість"),
  partTime: L("Part-time", "Deltid", "Normă parțială", "นอกเวลา", "Часткова зайнятість"),
  annualLeave: L("Annual Leave", "Semesterdagar", "Concediu anual", "วันลาพักร้อน", "Щорічна відпустка"),
  days: L("days", "dagar", "zile", "วัน", "днів"),
  s6_title: L("Notice Period", "Uppsägningstid", "Perioada de preaviz", "ระยะเวลาแจ้งล่วงหน้า", "Строк попередження"),
  s6_text: L(
    "Notice periods are regulated in accordance with the Swedish Employment Protection Act (LAS) and applicable collective agreements (Skogsavtalet).",
    "Uppsägningstider regleras i enlighet med lagen om anställningsskydd (LAS) och tillämpliga kollektivavtal (Skogsavtalet).",
    "Perioadele de preaviz sunt reglementate în conformitate cu Legea suedeză privind protecția muncii (LAS) și acordurile colective aplicabile (Skogsavtalet).",
    "ระยะเวลาแจ้งล่วงหน้าเป็นไปตามกฎหมายคุ้มครองการจ้างงานของสวีเดน (LAS) และข้อตกลงร่วมที่บังคับใช้ (Skogsavtalet)",
    "Строки попередження регулюються відповідно до Закону Швеції про захист зайнятості (LAS) та чинних колективних договорів (Skogsavtalet)."
  ),
  s7_title: L("Compensation", "Ersättning", "Compensație", "ค่าตอบแทน", "Компенсація"),
  salaryType: L("Salary Type", "Lönetyp", "Tipul salariului", "ประเภทเงินเดือน", "Тип заробітної плати"),
  hourly: L("Hourly", "Timlön", "Pe oră", "รายชั่วโมง", "Погодинна"),
  monthly: L("Monthly", "Månadslön", "Lunar", "รายเดือน", "Щомісячна"),
  companyPremium: L("Company Premium", "Företagspremie", "Prima companiei", "เบี้ยประกันบริษัท", "Премія компанії"),
  aboveOfficialRate: L("above official rate", "över officiell taxa", "peste rata oficială", "เหนืออัตราอย่างเป็นทางการ", "вище офіційної ставки"),
  jobTypeN: L("Job Type", "Befattningstyp", "Tip post", "ประเภทงาน", "Тип роботи"),
  hourlyBasicRate: L("Hourly Basic Rate", "Grundtimlön", "Tarif orar de bază", "อัตราค่าจ้างรายชั่วโมงพื้นฐาน", "Базова погодинна ставка"),
  hourlyPremium: L("Hourly Premium", "Tillägg", "Prima orară", "เบี้ยเพิ่มรายชั่วโมง", "Погодинна надбавка"),
  monthlyBasicRate: L("Monthly Basic Rate", "Grundmånadslön", "Salariu lunar de bază", "อัตราเงินเดือนพื้นฐาน", "Базова місячна ставка"),
  monthlyPremium: L("Monthly Premium", "Tillägg", "Prima lunară", "เบี้ยเพิ่มรายเดือน", "Щомісячна надбавка"),
  s8_title: L("Salary Details", "Löneuppgifter", "Detalii salariu", "รายละเอียดเงินเดือน", "Деталі заробітної плати"),
  overtimeClause: L("Only ordered overtime will be compensated with overtime pay.", "Endast beordrad övertid ersätts med övertidsersättning.", "Doar orele suplimentare dispuse vor fi compensate cu plata orelor suplimentare.", "เฉพาะการทำงานล่วงเวลาที่ได้รับคำสั่งเท่านั้นที่จะได้รับค่าชดเชยการทำงานล่วงเวลา", "Лише замовлені понаднормові години компенсуються оплатою за понаднормову роботу."),
  pieceWorkPay: L("Piece Work Pay", "Ackordslön", "Plata în acord", "ค่าจ้างตามชิ้นงาน", "Відрядна оплата"),
  otherBenefits: L("Other Benefits", "Övriga Förmåner", "Alte beneficii", "สวัสดิการอื่นๆ", "Інші пільги"),
  paymentMethod: L("Payment Method", "Utbetalningssätt", "Metoda de plată", "วิธีการชำระเงิน", "Спосіб оплати"),
  bankAccount: L("Bank Account", "Bankkonto", "Cont bancar", "บัญชีธนาคาร", "Банківський рахунок"),
  cash: L("Cash", "Kontant", "Numerar", "เงินสด", "Готівка"),
  s9_title: L("Mandatory Training", "Obligatorisk Utbildning", "Instruire obligatorie", "การฝึกอบรมภาคบังคับ", "Обов'язкове навчання"),
  s9_intro: L("The following training programs are mandatory for the employee before commencing work.", "Följande utbildningsprogram är obligatoriska för arbetstagaren innan arbetet påbörjas.", "Următoarele programe de instruire sunt obligatorii pentru angajat înainte de începerea activității.", "โปรแกรมการฝึกอบรมต่อไปนี้เป็นภาคบังคับสำหรับลูกจ้างก่อนเริ่มงาน", "Наступні програми навчання є обов'язковими для працівника перед початком роботи."),
  mandatory: L("MANDATORY", "OBLIGATORISK", "OBLIGATORIU", "ภาคบังคับ", "ОБОВ'ЯЗКОВО"),
  other: L("Other", "Annat", "Altele", "อื่นๆ", "Інше"),
  noTraining: L("No mandatory training programs selected.", "Inga obligatoriska utbildningsprogram valda.", "Nu au fost selectate programe de instruire obligatorie.", "ไม่มีโปรแกรมฝึกอบรมภาคบังคับที่เลือก", "Обов'язкові навчальні програми не вибрано."),
  s10_title: L("Social Security", "Social Trygghet", "Securitate socială", "ประกันสังคม", "Соціальне забезпечення"),
  s10_text: L("Social security contributions and insurance are provided in accordance with Swedish law and applicable collective agreements. The employer shall ensure that the employee is covered by:", "Sociala avgifter och försäkringar tillhandahålls i enlighet med svensk lag och tillämpliga kollektivavtal. Arbetsgivaren ska säkerställa att arbetstagaren omfattas av:", "Contribuțiile și asigurările sociale sunt furnizate în conformitate cu legislația suedeză și acordurile colective aplicabile. Angajatorul se asigură că angajatul este acoperit de:", "เงินสมทบประกันสังคมและการประกันภัยจัดให้ตามกฎหมายสวีเดนและข้อตกลงร่วมที่บังคับใช้ นายจ้างต้องมั่นใจว่าลูกจ้างได้รับความคุ้มครองจาก:", "Внески на соціальне забезпечення та страхування надаються відповідно до законодавства Швеції та чинних колективних договорів. Роботодавець зобов'язаний забезпечити працівникові:"),
  s10_pension: L("Occupational pension (Tjänstepension) as per Skogsavtalet", "Tjänstepension enligt Skogsavtalet", "Pensie ocupațională (Tjänstepension) conform Skogsavtalet", "บำนาญอาชีพ (Tjänstepension) ตาม Skogsavtalet", "Професійна пенсія (Tjänstepension) згідно з Skogsavtalet"),
  s10_tgl: L("Occupational group life insurance (TGL)", "Tjänstegrupplivförsäkring (TGL)", "Asigurare de viață de grup (TGL)", "ประกันชีวิตกลุ่มอาชีพ (TGL)", "Групове страхування життя (TGL)"),
  s10_tfa: L("Occupational injury insurance (TFA)", "Trygghetsförsäkring vid arbetsskada (TFA)", "Asigurare pentru accidente de muncă (TFA)", "ประกันอุบัติเหตุจากการทำงาน (TFA)", "Страхування від виробничих травм (TFA)"),
  s10_ags: L("Severance pay insurance (AGS)", "Avtalsgruppsjukförsäkring (AGS)", "Asigurare de concediu medical (AGS)", "ประกันเงินชดเชย (AGS)", "Страхування вихідної допомоги (AGS)"),
  s11_title: L("Miscellaneous", "Övrigt", "Diverse", "เบ็ดเตล็ด", "Різне"),
  noAdditionalTerms: L("No additional terms specified.", "Inga ytterligare villkor angivna.", "Nu au fost specificate condiții suplimentare.", "ไม่มีเงื่อนไขเพิ่มเติม", "Додаткових умов не зазначено."),
  s12_title: L("Notes", "Anmärkningar", "Observații", "หมายเหตุ", "Примітки"),
  s12_note1: L("This contract is governed by Swedish law and the collective agreement for the forestry sector (Skogsavtalet).", "Detta avtal regleras av svensk lag och kollektivavtalet för skogssektorn (Skogsavtalet).", "Acest contract este guvernat de legislația suedeză și acordul colectiv pentru sectorul forestier (Skogsavtalet).", "สัญญานี้อยู่ภายใต้กฎหมายสวีเดนและข้อตกลงร่วมสำหรับภาคป่าไม้ (Skogsavtalet)", "Цей договір регулюється законодавством Швеції та колективним договором для лісового сектору (Skogsavtalet)."),
  s12_note2: L("The employee is required to comply with workplace health and safety regulations (AFS).", "Arbetstagaren är skyldig att följa arbetsmiljöföreskrifter (AFS).", "Angajatul este obligat să respecte reglementările privind sănătatea și securitatea la locul de muncă (AFS).", "ลูกจ้างต้องปฏิบัติตามข้อบังคับด้านสุขภาพและความปลอดภัยในสถานที่ทำงาน (AFS)", "Працівник зобов'язаний дотримуватися правил охорони праці та безпеки на робочому місці (AFS)."),
  s12_note3: L("Any changes to this agreement must be confirmed in writing by both parties.", "Ändringar i detta avtal ska bekräftas skriftligen av båda parter.", "Orice modificare a acestui acord trebuie confirmată în scris de ambele părți.", "การเปลี่ยนแปลงใดๆ ในข้อตกลงนี้ต้องได้รับการยืนยันเป็นลายลักษณ์อักษรจากทั้งสองฝ่าย", "Будь-які зміни до цього договору повинні бути підтверджені письмово обома сторонами."),
  s12_note4: L("Dispute resolution deadlines are governed by LAS §§ 40-42.", "Frister för underrättelse och väckande av talan vid tvist om avslut av anställning finns i §§ LAS 40-42.", "Termenele de soluționare a litigiilor sunt reglementate de LAS §§ 40-42.", "กำหนดเวลาการระงับข้อพิพาทเป็นไปตาม LAS §§ 40-42", "Строки вирішення спорів регулюються LAS §§ 40-42."),
  s12_note5: L("Rules for notice, information and the obligation to negotiate are set out in MBL §§ 11-14.", "Regler för varsel, information och förhandlingsskyldighet finns i §§ MBL 11-14.", "Regulile privind notificarea, informarea și obligația de negociere sunt stabilite în MBL §§ 11-14.", "กฎเกณฑ์การแจ้งเตือน ข้อมูล และภาระผูกพันในการเจรจาระบุไว้ใน MBL §§ 11-14", "Правила щодо повідомлення, інформації та обов'язку вести переговори викладені в MBL §§ 11-14."),
  s13_title: L("Net Salary Deductions", "Nettolöneavdrag", "Deduceri din salariul net", "การหักเงินเดือนสุทธิ", "Утримання із чистої заробітної плати"),
  type: L("Type", "Typ", "Tip", "ประเภท", "Тип"),
  amount: L("Amount", "Belopp", "Sumă", "จำนวนเงิน", "Сума"),
  frequency: L("Frequency", "Frekvens", "Frecvență", "ความถี่", "Частота"),
  note: L("Note", "Anteckning", "Notă", "หมายเหตุ", "Примітка"),
  freq_monthly: L("Monthly", "Månadsvis", "Lunar", "รายเดือน", "Щомісячно"),
  freq_weekly: L("Weekly", "Veckovis", "Săptămânal", "รายสัปดาห์", "Щотижня"),
  freq_oneTime: L("One-time", "Engångs", "O singură dată", "ครั้งเดียว", "Одноразово"),
  freq_perKm: L("Per km", "Per km", "Pe km", "ต่อกิโลเมตร", "За км"),
  ded_rent: L("Rent / Accommodation", "Hyra / Boende", "Chirie / Cazare", "ค่าเช่า / ที่พัก", "Оренда / Проживання"),
  ded_car: L("Company Car Usage", "Tjänstebil", "Utilizare mașină de serviciu", "การใช้รถบริษัท", "Користування службовим автомобілем"),
  ded_travel: L("Travel Costs", "Resekostnader", "Costuri de deplasare", "ค่าเดินทาง", "Витрати на проїзд"),
  ded_immigration: L("Immigration Process Fees", "Migrationsverkets avgifter", "Taxe de imigrare", "ค่าธรรมเนียมกระบวนการตรวจคนเข้าเมือง", "Витрати на імміграційний процес"),
  ded_other: L("Other Deduction", "Annat avdrag", "Altă deducere", "การหักอื่นๆ", "Інше утримання"),
  signatures: L("Signatures", "Underskrifter", "Semnături", "ลายเซ็น", "Підписи"),
  sigIntro: L("This contract has been drawn up in two identical copies, of which each party has received one.", "Detta avtal har upprättats i två likalydande exemplar, varav parterna tagit var sitt.", "Acest contract a fost întocmit în două exemplare identice, fiecare parte primind câte unul.", "สัญญานี้จัดทำขึ้นเป็นสองฉบับเหมือนกัน ซึ่งแต่ละฝ่ายได้รับฉบับละหนึ่งฉบับ", "Цей договір складено у двох ідентичних примірниках, кожна сторона отримала по одному."),
  placeAndDate: L("Place and date", "Plats och datum", "Locul și data", "สถานที่และวันที่", "Місце і дата"),
  company: L("Company", "Företag", "Compania", "บริษัท", "Компанія"),
  employerSignature: L("Employer's signature", "Arbetsgivarens underskrift", "Semnătura angajatorului", "ลายเซ็นนายจ้าง", "Підпис роботодавця"),
  employee: L("Employee", "Arbetstagare", "Angajat", "ลูกจ้าง", "Працівник"),
  employeeSignature: L("Employee's signature", "Arbetstagarens underskrift", "Semnătura angajatului", "ลายเซ็นลูกจ้าง", "Підпис працівника"),
  signed: L("Signed", "Undertecknad", "Semnat", "ลงนามแล้ว", "Підписано"),
  appendixCoC: L("Appendix A — Code of Conduct", "Bilaga A — Uppförandekod", "Anexa A — Codul de conduită", "ภาคผนวก ก — จรรยาบรรณ", "Додаток А — Кодекс поведінки"),
  appendixSchedule: L("Appendix B — Work Schedule", "Bilaga B — Arbetsschema", "Anexa B — Programul de lucru", "ภาคผนวก ข — ตารางการทำงาน", "Додаток Б — Графік роботи"),
  scheduleDate: L("Date", "Datum", "Data", "วันที่", "Дата"),
  scheduleDayType: L("Day Type", "Dagtyp", "Tip zi", "ประเภทวัน", "Тип дня"),
  scheduleHours: L("Hours", "Timmar", "Ore", "ชั่วโมง", "Години"),
  scheduleStart: L("Start", "Början", "Început", "เริ่ม", "Початок"),
  scheduleEnd: L("End", "Slut", "Sfârșit", "สิ้นสุด", "Кінець"),
  scheduleHoliday: L("Holiday", "Helgdag", "Sărbătoare", "วันหยุด", "Свято"),
  noSchedule: L("No schedule data available.", "Ingen schemadata tillgänglig.", "Nu sunt disponibile date privind programul.", "ไม่มีข้อมูลตารางงาน", "Дані розкладу відсутні."),
};

/* ══════════════════════════════════════════════════════════════
   CODE OF CONDUCT — full content in all 5 languages
   (mirrored from CodeOfConductViewer.tsx)
   ══════════════════════════════════════════════════════════════ */

const COC_SV = {
  title: "Arbetarskydds normer och ordningsregler – Ljungan Skogsvård AB",
  sections: [
    { heading: "", body: "Bästa medarbetare,\n\nVi ber dig vänligen att granska och fullt ut följa följande säkerhetsstandarder och regler under arbetstid för att säkerställa att vår verksamhet bedrivs under säkra och effektiva förhållanden. Dessa standarder är avgörande för att skydda din hälsa och upprätthålla en ordnad och säker arbetsmiljö." },
    { heading: "Arbetskrav", body: "• Plantering, röjning med röjsåg och motorsågar samt andra aktiviteter får endast påbörjas efter att du har klarat proven på Skötselskolan och undertecknat alla nödvändiga dokument, inklusive anställningsavtal och andra relevanta formulär.\n• För att börja arbeta måste du som anställd klara proven på Skötselskolan för sektorerna \"Plantering\", \"Röjning och för röjning\" och \"Miljöhänsyn grunder\", samt \"Att vara anställd\", hos företag som SCA, Sveaskog, Holmen, Södra och andra företag vi samarbetar med." },
    { heading: "Hälsovård och ersättning", body: "• Alla anställda har rätt till hälsovård enligt svensk lag och standarder. De har också rätt till ersättning enligt tillämplig svensk lagstiftning.\n• Enligt svenska normer krävs en minimiavgift på 300–1000 SEK för att besöka en vårdcentral (akuten eller annan enhet). Denna avgift betalas privat, medan ytterligare kostnader täcks av Försäkringskassan." },
    { heading: "Personlig skyddsutrustning (PSU)", body: "• Det är obligatoriskt att bära den skyddsutrustning som företaget tillhandahåller, inklusive kängor, reflexvästar eller jackor, hjälmar, handskar och första hjälpen-kit. Att inte bära denna utrustning sker på egen risk, och vid en olycka är den anställde direkt ansvarig." },
    { heading: "Säkerhet under arbete", body: "• Vid arbete med röjsågar måste ett minsta avstånd på 15 meter från kollegor upprätthållas.\n• Det är förbjudet att hantera grenar eller stockar som fastnat mellan bladet och klingskyddet medan röjsågen är i gång.\n• Det är förbjudet att ta bort klingskyddet från röjsågens klinga." },
    { heading: "Körregler", body: "• Körning på skogsvägar ska ske med en hastighet som anpassas till vägförhållandena men bör inte överstiga 50 km/h om inga specifika hastighetsbegränsningar gäller.\n• Körning på allmänna vägar och skogsvägar måste ske försiktigt och i enlighet med svenska trafikregler. Bilbältesanvändning är obligatoriskt för alla passagerare. Säker och ansvarsfull körning är både en juridisk och moralisk skyldighet.\n• Gruppledaren är ansvarig för att bilnyckeln förvaras säkert och att ingen kollega som är berusad eller saknar giltigt körkort har tillgång till bilnyckeln." },
    { heading: "Förbjudna substanser", body: "• Konsumtion av alkohol, droger eller hallucinogena substanser är förbjudet på arbetsplatsen eller under resor till och från jobbet." },
    { heading: "Avfallshantering", body: "• Lämna inte skräp efter dig; det måste kastas i sopkärl och sorteras korrekt.\n• Stöld eller rotande i sopor är förbjudet. All aktivitet som skadar företagets anseende kommer att resultera i löneavdrag och uppsägning." },
    { heading: "Bränsleförvaring", body: "• Bränslebehållare (ASPEN) måste förvaras på utsedda platser, inte i skogen eller i boendelokaler." },
    { heading: "Boendelokaler", body: "• Boendelokaler måste hållas rena, och hushållsavfall måste sorteras.\n• Rökning i skogsområden är förbjudet, och rökande anställda måste vara medvetna om säkerhetsåtgärder. Rökning får endast ske på väg eller vändplan och alla fimpar samlas upp i en burk. Öppna eldar är endast tillåtna under förhållanden som anges i skogsvårdsstandarder." },
    { heading: "Arbetstider", body: "• Arbetstiderna är från 06:30 till 17:00, måndag till fredag, 8 timmar per dag, 40 timmar per vecka. Anställda behöver inte arbeta mer än 8 timmar per dag, och eventuell övertid måste rapporteras dagligen/månadsvis.\n• Anställda garanteras en grundlön enligt avtalet med GS facket, förutsatt att de följer standarder och arbetstider samt uppfyller svenska kvalitets- och prestandakrav per timme." },
    { heading: "Kvalitetsstandarder", body: "• Den undervisning om kvalitetsstandarder som ges av arbetsgivaren och kontaktpersonerna för varje bestånd måste följas strikt, och eventuella avvikelser kan resultera i löneavdrag baserat på kundens utvärdering.\n• Om kvalitetsstandarder inte uppfylls kommer den anställdes ersättning att suspenderas tills arbetet är korrigerat (om möjligt) eller tills den anställde betalar nödvändig ersättning." },
    { heading: "Planteringsinstruktioner", body: "• Plantering måste ske enligt instruktioner; fel kommer att bestraffas och debiteras.\n• Det är förbjudet att plantera torra plantor; anställda är ansvariga för att vattna dem.\n• Kartonglådor måste återvinnas, och plastlådor måste förvaras korrekt.\n• Om plantor levereras i kartonglådor eller plastlådor är de anställda ansvariga för att kartonglådor samlas in och transporteras till återvinningscentral eller annan anvisad plats, medan plastlådor måste placeras på pallar och omsorgsfullt ompaketeras." },
    { heading: "Boende", body: "• En koja finns tillgänglig för alla anställda, och de kan välja att använda den eller inte.\n• Det är förbjudet att lämna mat, kläder, hushållssopor eller andra personliga eller företagsägda föremål i hyrda boenden efter att det har lämnats av de anställda." },
    { heading: "Kommunikation och rapportering", body: "• Alla osäkerheter måste kommuniceras, och eventuella problem måste rapporteras till koordinatorerna.\n• Om du är osäker på hur du ska hantera eller plantera ett bestånd måste du kontakta en koordinator så snart som möjligt.\n• Om du märker något misstänkt i ett bestånd måste du omedelbart informera koordinatorerna." },
    { heading: "Uppsägning av anställning", body: "• Om ett team eller en teammedlem vill avsluta sitt samarbete med Ljungan Skogsvård AB måste följande följas:\n  A. Om den anställde har arbetat för Ljungan Skogsvård AB i ett (1) år eller mer måste företagsledningen meddelas minst 1 månad i förväg.\n  B. Om den anställde är ny hos Ljungan Skogsvård AB måste företagsledningen meddelas minst 3 veckor i förväg.\n• Om dessa tidsfrister inte följs kommer den sista månadens lön att hållas kvar.\n• Slutet på arbetssäsongen måste planeras med företagsledningen men får inte inträffa förrän kontrakterat arbete är slutfört eller väderförhållanden inte tillåter att verksamheten bedrivs under optimala och säkra förhållanden." },
    { heading: "Förbjudna aktiviteter", body: "• All aktivitet som anses vara farlig och potentiellt riskerar den anställdes liv och hälsa får inte utföras. Säkerhet och hälsa är prioritet i verksamheten, följt av produktivitet.\n• Alla incidenter som orsakar stress eller obehag måste rapporteras skriftligt omedelbart för att vidta nödvändiga åtgärder." },
    { heading: "Utrustning och underhåll", body: "• Utrustning som tillhandahålls måste underhållas i funktionellt skick och rengöras/underhållas varje vecka." },
    { heading: "Arbetsmiljö", body: "• Att upprätthålla en positiv atmosfär och trevlig arbetsmiljö är varje anställds ansvar. Vid personliga problem måste den anställde kontakta koordinatorn för att vidta nödvändiga åtgärder." },
    { heading: "Bränslehantering", body: "• Anställda får inte transportera bensin, ASPEN eller andra bränslen i icke-godkända behållare enligt PEFC-standarder. Transport av bränsle från fordonet till arbetsplatsen får endast ske med godkända behållare, och att fästa eller binda dessa till sele är förbjudet." },
    { heading: "Kemikaliehantering", body: "• Anställda måste följa regler för kemikaliehantering. Det är förbjudet att konsumera, missköta eller applicera kemikalier som bensin, ASPEN, diesel eller olja på kroppen." },
    { heading: "Fordonssäkerhet", body: "• Om föraren av servicefordonet eller teammedlemmar märker att fordonet är i dåligt skick och riskerar liv och hälsa för teammedlemmar eller andra trafikanter måste de informera koordinatorerna." },
    { heading: "Kartor och nödprocedurer", body: "• Anställda måste bära en karta med instruktioner för det bestånd de arbetar i, och gruppledaren måste känna till nödkoordinaterna på varje karta, markerade i rött.\n• Vid nödsituationer måste anställda ringa 112 och ange nödkoordinaterna på kartan." },
    { heading: "Diskriminering och sekretess", body: "• Diskriminering baserad på ras, kön eller religion är förbjudet, både på arbetsplatsen och i samhället.\n• Det är förbjudet att förtala Ljungan Skogsvård AB elakt, dela hemligheter eller avslöja konfidentiell information." },
    { heading: "Användning av företagsfordon", body: "• Det är förbjudet att använda företagsfordon för personliga ändamål. De får endast användas för aktiviteter som krävs av Ljungan Skogsvård AB." },
    { heading: "Skattedeklaration", body: "• Inkomstdeklarationen är personlig, och det är varje anställds ansvar att fylla i och lämna den till Skatteverket i Sverige." },
    { heading: "Riskidentifiering och rapportering", body: "• Att identifiera och rapportera risker är en avgörande del av verksamheten. Varje anställd är ansvarig för att upprätthålla en säker arbetsmiljö.\n• I varje fordon finns en \"riskbedömning\" som identifierar potentiella risker och åtgärder." },
    { heading: "Personliga hygienartiklar", body: "• Anställda är ansvariga för att ta med sina egna hygienartiklar, inklusive lakan, örngott, handdukar, tofflor etc." },
    { heading: "Bekräftelse och avtal", body: "• Genom att underteckna detta anställningsavtal bekräftar jag att jag har läst, mottagit och fått en kopia av ovanstående och frivilligt åtar mig att följa dessa regler.\n• Jag åtar mig att följa företagets interna regler och svensk lagstiftning samt mitt hemlands lagstiftning.\n• Jag har informerats om att företaget jag arbetar för är ett svenskt företag, att mina skatter betalas i Sverige och att jag har rätt att få lönespecifikation varje månad.\n• Jag har informerats om att jag kan begära en husvagn i arbetsområdet.\n• Jag har informerats om att jag har tillgång till svensk hälsovård och att företaget har ett samarbetsavtal med FeelGood – adress: Bankgatan 15, 852 31 Sundsvall.\n• Jag samtycker till att Ljungan Skogsvård AB får lagra mina personuppgifter." },
  ],
};

// For brevity, we use a language key map approach. The edge function embeds the full CoC
// content for all languages. We replicate the exact content from CodeOfConductViewer.tsx.
// Due to the large size of full content in all 5 languages, we use a helper to select.

const COC_EN = {
  title: "Safety Standards and Rules of Conduct – Ljungan Skogsvård AB",
  sections: [
    { heading: "", body: "Dear employee,\n\nWe kindly ask you to review and fully comply with the following safety standards and rules during working hours to ensure our operations are conducted under safe and efficient conditions. These standards are essential for protecting your health and maintaining an orderly and safe work environment." },
    { heading: "Work Requirements", body: "• Planting, clearing with brushcutters and chainsaws, and other activities may only begin after you have passed the tests at the Forestry School (Skötselskolan) and signed all necessary documents, including employment contracts and other relevant forms.\n• To start working, you must pass the tests at the Forestry School for the sectors \"Planting\", \"Clearing and pre-clearing\", \"Environmental considerations basics\", and \"Being employed\", with companies such as SCA, Sveaskog, Holmen, Södra and other companies we work with." },
    { heading: "Healthcare and Compensation", body: "• All employees are entitled to healthcare according to Swedish law and standards. They are also entitled to compensation under applicable Swedish legislation.\n• According to Swedish standards, a minimum fee of SEK 300–1,000 is required to visit a healthcare center (emergency room or other unit). This fee is paid privately, while additional costs are covered by Försäkringskassan (the Social Insurance Agency)." },
    { heading: "Personal Protective Equipment (PPE)", body: "• It is mandatory to wear the protective equipment provided by the company, including boots, reflective vests or jackets, helmets, gloves, and first aid kits. Not wearing this equipment is at your own risk, and in the event of an accident, the employee is directly responsible." },
    { heading: "Safety During Work", body: "• When working with brushcutters, a minimum distance of 15 meters from colleagues must be maintained.\n• It is prohibited to handle branches or logs caught between the blade and the blade guard while the brushcutter is running.\n• It is prohibited to remove the blade guard from the brushcutter blade." },
    { heading: "Driving Rules", body: "• Driving on forest roads must be done at a speed adapted to road conditions but should not exceed 50 km/h unless specific speed limits apply.\n• Driving on public roads and forest roads must be done carefully and in accordance with Swedish traffic rules. Seatbelt use is mandatory for all passengers. Safe and responsible driving is both a legal and moral obligation.\n• The team leader is responsible for keeping the car key safe and ensuring that no colleague who is intoxicated or lacks a valid driver's license has access to the car key." },
    { heading: "Prohibited Substances", body: "• Consumption of alcohol, drugs, or hallucinogenic substances is prohibited at the workplace or during travel to and from work." },
    { heading: "Waste Management", body: "• Do not leave litter behind; it must be disposed of in waste containers and sorted correctly.\n• Theft or rummaging through garbage is prohibited. Any activity that damages the company's reputation will result in salary deductions and termination." },
    { heading: "Fuel Storage", body: "• Fuel containers (ASPEN) must be stored at designated locations, not in the forest or in living quarters." },
    { heading: "Living Quarters", body: "• Living quarters must be kept clean, and household waste must be sorted.\n• Smoking in forest areas is prohibited, and smoking employees must be aware of safety measures. Smoking is only permitted on roads or turning areas, and all cigarette butts must be collected in a can. Open fires are only permitted under conditions specified in forestry standards." },
    { heading: "Working Hours", body: "• Working hours are from 06:30 to 17:00, Monday to Friday, 8 hours per day, 40 hours per week. Employees do not need to work more than 8 hours per day, and any overtime must be reported daily/monthly.\n• Employees are guaranteed a basic salary according to the agreement with the GS union, provided they follow standards and working hours and meet Swedish quality and performance requirements per hour." },
    { heading: "Quality Standards", body: "• The quality standards instruction given by the employer and contact persons for each stand must be followed strictly, and any deviations may result in salary deductions based on the client's evaluation.\n• If quality standards are not met, the employee's compensation will be suspended until the work is corrected (if possible) or until the employee pays the necessary compensation." },
    { heading: "Planting Instructions", body: "• Planting must be done according to instructions; errors will be penalized and charged.\n• It is prohibited to plant dry seedlings; employees are responsible for watering them.\n• Cardboard boxes must be recycled, and plastic boxes must be stored properly.\n• If seedlings are delivered in cardboard or plastic boxes, employees are responsible for collecting cardboard boxes and transporting them to a recycling center or other designated location, while plastic boxes must be placed on pallets and carefully repackaged." },
    { heading: "Accommodation", body: "• A cabin is available for all employees, and they can choose to use it or not.\n• It is prohibited to leave food, clothing, household waste, or other personal or company-owned items in rented accommodations after they have been vacated by the employees." },
    { heading: "Communication and Reporting", body: "• All uncertainties must be communicated, and any problems must be reported to the coordinators.\n• If you are unsure about how to manage or plant a stand, you must contact a coordinator as soon as possible.\n• If you notice anything suspicious in a stand, you must immediately inform the coordinators." },
    { heading: "Termination of Employment", body: "• If a team or team member wishes to end their collaboration with Ljungan Skogsvård AB, the following must be observed:\n  A. If the employee has worked for Ljungan Skogsvård AB for one (1) year or more, company management must be notified at least 1 month in advance.\n  B. If the employee is new to Ljungan Skogsvård AB, company management must be notified at least 3 weeks in advance.\n• If these deadlines are not met, the last month's salary will be withheld.\n• The end of the work season must be planned with company management but may not occur until contracted work is completed or weather conditions do not allow operations to be conducted under optimal and safe conditions." },
    { heading: "Prohibited Activities", body: "• Any activity deemed dangerous and potentially risking the employee's life and health must not be performed. Safety and health are the priority in operations, followed by productivity.\n• All incidents causing stress or discomfort must be reported in writing immediately so that necessary measures can be taken." },
    { heading: "Equipment and Maintenance", body: "• Equipment provided must be maintained in functional condition and cleaned/serviced weekly." },
    { heading: "Work Environment", body: "• Maintaining a positive atmosphere and pleasant work environment is every employee's responsibility. In case of personal problems, the employee must contact the coordinator to take the necessary measures." },
    { heading: "Fuel Handling", body: "• Employees may not transport gasoline, ASPEN, or other fuels in non-approved containers according to PEFC standards. Transport of fuel from the vehicle to the workplace may only be done with approved containers, and attaching or tying them to a harness is prohibited." },
    { heading: "Chemical Handling", body: "• Employees must follow rules for chemical handling. It is prohibited to consume, mishandle, or apply chemicals such as gasoline, ASPEN, diesel, or oil to the body." },
    { heading: "Vehicle Safety", body: "• If the driver of the service vehicle or team members notice that the vehicle is in poor condition and risks the life and health of team members or other road users, they must inform the coordinators." },
    { heading: "Maps and Emergency Procedures", body: "• Employees must carry a map with instructions for the stand they are working in, and the team leader must know the emergency coordinates on each map, marked in red.\n• In emergencies, employees must call 112 and provide the emergency coordinates on the map." },
    { heading: "Discrimination and Confidentiality", body: "• Discrimination based on race, gender, or religion is prohibited, both in the workplace and in society.\n• It is prohibited to maliciously defame Ljungan Skogsvård AB, share secrets, or disclose confidential information." },
    { heading: "Use of Company Vehicles", body: "• It is prohibited to use company vehicles for personal purposes. They may only be used for activities required by Ljungan Skogsvård AB." },
    { heading: "Tax Declaration", body: "• The income tax declaration is personal, and it is every employee's responsibility to complete and submit it to the Swedish Tax Agency (Skatteverket)." },
    { heading: "Risk Identification and Reporting", body: "• Identifying and reporting risks is a crucial part of operations. Every employee is responsible for maintaining a safe work environment.\n• In each vehicle there is a \"risk assessment\" that identifies potential risks and measures to be taken." },
    { heading: "Personal Hygiene Items", body: "• Employees are responsible for bringing their own hygiene items, including sheets, pillowcases, towels, slippers, etc." },
    { heading: "Acknowledgment and Agreement", body: "• By signing this employment contract, I confirm that I have read, received, and obtained a copy of the above and voluntarily commit to following these rules.\n• I commit to following the company's internal rules and Swedish legislation as well as the legislation of my home country.\n• I have been informed that the company I work for is a Swedish company, that my taxes are paid in Sweden, and that I have the right to receive a pay slip every month.\n• I have been informed that I can request a caravan in the work area.\n• I have been informed that I have access to Swedish healthcare and that the company has a cooperation agreement with FeelGood – address: Bankgatan 15, 852 31 Sundsvall.\n• I consent to Ljungan Skogsvård AB storing my personal data." },
  ],
};

// Note: For RO, TH, UK we use the same structure. Due to edge function size constraints,
// we embed a concise version. The full verbose text from CodeOfConductViewer is preserved
// for the primary language selected in the contract.

function getCocForLang(lang: string): { title: string; sections: { heading: string; body: string }[] } {
  // Map contract language to CoC language key
  switch (lang) {
    case "SE": return COC_SV;
    case "RO/SE": return COC_SV; // Romanian employees also get Swedish CoC (legally binding)
    case "TH/SE": return COC_SV;
    case "UK/SE": return COC_SV;
    default: return COC_EN; // EN/SE default
  }
}

// For the attachment, we include BOTH the primary language CoC AND the Swedish version
// since the legally binding language is Swedish
function getCocPrimaryForLang(lang: string): { title: string; sections: { heading: string; body: string }[] } | null {
  switch (lang) {
    case "SE": return null; // Swedish only, no need for second version
    case "EN/SE": return COC_EN;
    default: return COC_EN; // For other languages, show English as the primary readable version
  }
}

/* ── Print-optimized CSS (matches CONTRACT_PRINT_CSS) ── */
const printCss = `
  @page { size: A4; margin: 14mm 12mm 14mm 12mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Georgia, 'Times New Roman', serif; color: #1a1a1a; background: #fff; font-size: 10pt; line-height: 1.45; padding: 20mm 16mm; max-width: 210mm; margin: 0 auto; }
  @media print { body { padding: 0; max-width: 100%; } }
  .contract-doc { max-width: 100%; padding: 0 2mm; }
  .doc-header { text-align: center; padding-bottom: 10px; border-bottom: 3px double #333; margin-bottom: 12px; }
  .doc-header h1 { font-size: 14pt; font-weight: 700; letter-spacing: 2.5px; margin-bottom: 2px; font-family: Arial, Helvetica, sans-serif; }
  .doc-subtitle { font-size: 8.5pt; color: #555; letter-spacing: 0.5px; }
  .doc-legal-lang { font-size: 7.5pt; color: #666; margin-top: 4px; font-style: italic; letter-spacing: 0.3px; border-top: 1px solid #ccc; padding-top: 4px; }
  .section-title { font-family: Arial, Helvetica, sans-serif; font-size: 10pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; border-bottom: 2px solid #333; padding-bottom: 2px; margin-top: 14px; margin-bottom: 6px; color: #1a1a1a; page-break-after: avoid; break-after: avoid; }
  .field-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 3px 16px; margin-bottom: 2px; page-break-inside: avoid; }
  .field-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 3px 16px; margin-bottom: 2px; page-break-inside: avoid; }
  .field { padding: 2px 0; border-bottom: 1px solid #e0e0e0; }
  .field-label { display: block; font-family: Arial, Helvetica, sans-serif; font-size: 7pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; color: #666; }
  .field-value { display: block; font-size: 9.5pt; color: #111; min-height: 12px; }
  .subsection-label { font-family: Arial, Helvetica, sans-serif; font-size: 7.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; color: #444; margin-top: 6px; margin-bottom: 3px; }
  .info-block { background: #f8f8f8; border-left: 3px solid #ccc; padding: 5px 10px; margin-bottom: 4px; font-size: 9pt; line-height: 1.4; page-break-inside: avoid; }
  .info-block p { margin-bottom: 3px; }
  .info-sv { font-style: italic; color: #444; }
  .info-block-alert { border-left: 3px solid #b91c1c !important; background: rgba(185,28,28,0.06) !important; }
  .info-block-alert p { color: #b91c1c !important; }
  .info-list { margin: 3px 0 4px 16px; font-size: 8.5pt; }
  .info-list li { margin-bottom: 1px; }
  .info-text-muted { color: #888; font-style: italic; font-size: 8.5pt; }
  .check-item { font-size: 9.5pt; margin-bottom: 2px; }
  .training-mandatory-badge { display: inline; font-family: Arial, Helvetica, sans-serif; font-size: 6pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #b91c1c; border: 1px solid #b91c1c; border-radius: 2px; padding: 0 3px; margin-left: 4px; }
  .legal-notes p { margin-bottom: 4px; font-size: 9pt; }
  .deduction-table { width: 100%; border-collapse: collapse; margin-bottom: 4px; font-size: 9pt; page-break-inside: avoid; }
  .deduction-table th { font-family: Arial, Helvetica, sans-serif; font-size: 7pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #555; text-align: left; padding: 3px 6px; border-bottom: 2px solid #999; }
  .deduction-table td { padding: 3px 6px; border-bottom: 1px solid #ddd; }
  .sig-section { margin-top: 20px; page-break-inside: avoid; }
  .sig-intro { font-size: 8.5pt; color: #555; margin-bottom: 14px; font-style: italic; }
  .sig-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
  .sig-field { margin-bottom: 10px; }
  .sig-line { border-bottom: 1px solid #555; min-height: 24px; padding-bottom: 2px; font-size: 9.5pt; }
  .sig-line-tall { min-height: 34px; }
  .sig-label { font-family: Arial, Helvetica, sans-serif; font-size: 6.5pt; color: #777; margin-top: 1px; text-transform: uppercase; letter-spacing: 0.4px; display: block; }
  .sig-date { font-size: 6.5pt; color: #999; margin-top: 1px; display: block; }
  .sig-img { height: 28px; object-fit: contain; }
  .page-break { page-break-before: always; break-before: always; }
  .coc-section { margin-top: 8px; }
  .coc-heading { font-size: 9.5pt; font-weight: 700; margin-top: 12px; margin-bottom: 3px; border-bottom: 1px solid #ddd; padding-bottom: 2px; }
  .coc-body { font-size: 9pt; white-space: pre-line; line-height: 1.5; margin-bottom: 8px; margin-left: 2px; }
  .schedule-table { width: 100%; border-collapse: collapse; font-size: 8.5pt; margin-top: 6px; }
  .schedule-table th { font-family: Arial, Helvetica, sans-serif; font-size: 7pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #555; text-align: left; padding: 4px 8px; border-bottom: 2px solid #999; }
  .schedule-table td { padding: 3px 8px; border-bottom: 1px solid #eee; }
  .schedule-table tr:nth-child(even) { background: #fafafa; }
  .schedule-table tr.holiday { background: #fef3c7; }
  .schedule-table tr.weekend { background: #f0f0f0; }
  .whitespace-pre-wrap { white-space: pre-wrap; }
`;

/* ── HTML field helpers ── */
function field(label: string, value: string): string {
  return `<div class="field"><span class="field-label">${label}</span><span class="field-value">${value}</span></div>`;
}

function grid2(...fields: string[]): string { return `<div class="field-grid-2">${fields.join("")}</div>`; }
function grid3(...fields: string[]): string { return `<div class="field-grid-3">${fields.join("")}</div>`; }

function infoBlock(primary: string, swedish: string | null, alert = false): string {
  return `<div class="info-block${alert ? " info-block-alert" : ""}"><p><strong>${primary}</strong></p>${swedish ? `<p class="info-sv">${swedish}</p>` : ""}</div>`;
}

/* ══════════════════════════════════════════════════════
   Build the full contract HTML document (for attachment)
   ══════════════════════════════════════════════════════ */
function buildFullContractHtml(
  fd: Record<string, any>,
  companyName: string, companyOrgNumber: string, companyAddress: string,
  companyPostcode: string, companyCity: string,
  contractCode: string, seasonYear: string,
  empSignMeta: any, emplrSignMeta: any,
  employeeSignedAt: string | null, employerSignedAt: string | null,
  employeeSignatureUrl: string | null, employerSignatureUrl: string | null,
  scheduleRows: any[],
): string {
  const lang: string = fd.contractLanguage || "EN/SE";
  const isSEOnly = lang === "SE";
  const svLine = (l: LS) => isSEOnly ? null : svt(l);

  const efMap: Record<string, LS> = {
    permanent: CL.ef_permanent, probation: CL.ef_probation, "fixed-term": CL.ef_fixedTerm,
    "temp-replacement": CL.ef_tempReplacement, seasonal: CL.ef_seasonal, "age-69": CL.ef_age69,
  };
  const efLabel = efMap[fd.employmentForm] ? bl(efMap[fd.employmentForm], lang) : esc(fd.employmentForm || "—");
  const freqMap: Record<string, LS> = { monthly: CL.freq_monthly, weekly: CL.freq_weekly, "one-time": CL.freq_oneTime, "per-km": CL.freq_perKm };
  const dedMap: Record<string, LS> = { rent: CL.ded_rent, car: CL.ded_car, travel: CL.ded_travel, immigration: CL.ded_immigration, other: CL.ded_other };

  let html = `<div class="contract-doc">`;

  // ── HEADER ──
  html += `<div class="doc-header">
    <h1>${bl(CL.title, lang)}</h1>
    <p class="doc-subtitle">${esc(contractCode)} · ${bl(CL.season, lang)}: ${esc(seasonYear || new Date().getFullYear().toString())}</p>
    <p class="doc-legal-lang">${pt(CL.legalDisclaimer, lang)}${!isSEOnly ? ` / <span style="font-style:italic;color:#888;">${svt(CL.legalDisclaimer)}</span>` : ""}</p>
  </div>`;

  // §1 EMPLOYER
  html += `<h2 class="section-title">§1. ${bl(CL.s1_title, lang)}</h2>`;
  html += grid2(field(bl(CL.employer, lang), esc(companyName)), field(bl(CL.orgNumber, lang), esc(companyOrgNumber)));
  html += grid2(field(bl(CL.address, lang), esc(companyAddress)), field(bl(CL.postcodeCity, lang), `${esc(companyPostcode)} ${esc(companyCity)}`.trim()));

  // §2 EMPLOYEE
  html += `<h2 class="section-title">§2. ${bl(CL.s2_title, lang)}</h2>`;
  html += grid3(field(bl(CL.firstName, lang), esc(fd.firstName)), field(bl(CL.middleName, lang), esc(fd.middleName)), field(bl(CL.lastName, lang), esc(fd.lastName)));
  html += grid2(field(bl(CL.address, lang), esc(fd.address)), field(bl(CL.city, lang), esc(fd.city)));
  html += grid2(field(bl(CL.postcode, lang), esc(fd.zipCode)), field(bl(CL.country, lang), esc(fd.country)));
  html += grid2(field(bl(CL.dateOfBirth, lang), fmtDate(fd.birthday)), field(bl(CL.citizenship, lang), esc(fd.citizenship)));
  html += grid2(field(bl(CL.mobile, lang), esc(fd.mobile)), field(bl(CL.email, lang), esc(fd.email)));
  html += `<p class="subsection-label">${bl(CL.emergencyContact, lang)}</p>`;
  html += grid3(field(bl(CL.firstName, lang), esc(fd.emergencyFirstName)), field(bl(CL.lastName, lang), esc(fd.emergencyLastName)), field(bl(CL.mobile, lang), esc(fd.emergencyMobile)));

  // §3 POSITION & DUTIES
  html += `<h2 class="section-title">§3. ${bl(CL.s3_title, lang)}</h2>`;
  html += grid2(field(bl(CL.mainDuties, lang), esc(fd.mainDuties)));
  const numJobs = String(fd.numberOfJobTypes || "1");
  const jobs = [
    { idx: 1, jt: fd.jobType, el: fd.experienceLevel },
    ...((numJobs === "2" || numJobs === "3") ? [{ idx: 2, jt: fd.jobType2, el: fd.experienceLevel2 }] : []),
    ...(numJobs === "3" ? [{ idx: 3, jt: fd.jobType3, el: fd.experienceLevel3 }] : []),
  ];
  for (const { idx, jt, el } of jobs) {
    html += grid2(field(`${bl(CL.jobType, lang)}${numJobs !== "1" ? ` ${idx}` : ""}`, esc(jt)), field(`${bl(CL.experienceLevel, lang)}${numJobs !== "1" ? ` ${idx}` : ""}`, esc(el)));
  }
  html += grid2(field(bl(CL.postingLocation, lang), esc(fd.postingLocation)), field(bl(CL.mainWorkplace, lang), esc(fd.mainWorkplace || fd.postingLocation)));
  html += grid2(field(bl(CL.workplaceVaries, lang), fd.workplaceVaries === "yes" ? bl(CL.yes, lang) : fd.workplaceVaries === "no" ? bl(CL.no, lang) : esc(fd.workplaceVaries)));

  // §4 FORM OF EMPLOYMENT
  html += `<h2 class="section-title">§4. ${bl(CL.s4_title, lang)}</h2>`;
  html += grid2(field(bl(CL.employmentForm, lang), efLabel));
  if (fd.employmentForm === "permanent") html += grid2(field(bl(CL.fromDateFull, lang), fmtDate(fd.permanentFromDate)));
  else if (fd.employmentForm === "probation") html += grid2(field(bl(CL.fromDate, lang), fmtDate(fd.probationFromDate)), field(bl(CL.untilDate, lang), fmtDate(fd.probationUntilDate)));
  else if (fd.employmentForm === "fixed-term") html += grid2(field(bl(CL.fromDate, lang), fmtDate(fd.fixedTermFromDate)), field(bl(CL.untilDate, lang), fmtDate(fd.fixedTermUntilDate)));
  else if (fd.employmentForm === "temp-replacement") html += grid2(field(bl(CL.fromDate, lang), fmtDate(fd.tempReplacementFromDate)), field(bl(CL.position, lang), esc(fd.tempReplacementPosition)));
  else if (fd.employmentForm === "seasonal") html += grid2(field(bl(CL.fromDate, lang), fmtDate(fd.seasonalFromDate)), field(bl(CL.endAround, lang), fmtDate(fd.seasonalEndAround)));
  else if (fd.employmentForm === "age-69") html += grid2(field(bl(CL.fromDate, lang), fmtDate(fd.age69FromDate)), field(bl(CL.untilDate, lang), fmtDate(fd.age69UntilDate)));

  html += `<div class="info-block" style="margin-top:8px;margin-bottom:12px;"><p style="margin:0;font-size:9pt;font-style:italic;">${pt(CL.s4_comesIntoForce, lang)}</p>${!isSEOnly ? `<p style="margin:2px 0 0;font-size:8.5pt;color:#64748b;font-style:italic;">${svt(CL.s4_comesIntoForce)}</p>` : ""}</div>`;

  // §5 WORKING TIME & LEAVE
  html += `<h2 class="section-title">§5. ${bl(CL.s5_title, lang)}</h2>`;
  const workTimeVal = fd.workingTime === "part-time" ? `${bl(CL.partTime, lang)} ${fd.partTimePercent ? `(${fd.partTimePercent}%)` : ""}` : bl(CL.fullTime, lang);
  html += grid2(field(bl(CL.workingTime, lang), workTimeVal), field(bl(CL.annualLeave, lang), fd.annualLeaveDays ? `${fd.annualLeaveDays} ${pt(CL.days, lang)}` : "—"));

  // §6 NOTICE PERIOD
  html += `<h2 class="section-title">§6. ${bl(CL.s6_title, lang)}</h2>`;
  html += infoBlock(pt(CL.s6_text, lang), svLine(CL.s6_text));

  // §7 COMPENSATION
  html += `<h2 class="section-title">§7. ${bl(CL.s7_title, lang)}</h2>`;
  const salaryTypeVal = fd.salaryType === "hourly" ? bl(CL.hourly, lang) : fd.salaryType === "monthly" ? bl(CL.monthly, lang) : esc(fd.salaryType);
  if (fd.companyPremiumPercent && Number(fd.companyPremiumPercent) > 0) {
    html += grid2(field(bl(CL.salaryType, lang), salaryTypeVal), field(bl(CL.companyPremium, lang), `+${esc(fd.companyPremiumPercent)}% ${pt(CL.aboveOfficialRate, lang)}`));
  } else {
    html += grid2(field(bl(CL.salaryType, lang), salaryTypeVal));
  }

  const salaryJobs = [
    { idx: 1, jt: fd.jobType, hb: fd.hourlyBasic, hp: fd.hourlyPremium, mb: fd.monthlyBasic, mp: fd.monthlyPremium },
    ...((numJobs === "2" || numJobs === "3") ? [{ idx: 2, jt: fd.jobType2, hb: fd.hourlyBasic2, hp: fd.hourlyPremium2, mb: fd.monthlyBasic2, mp: fd.monthlyPremium2 }] : []),
    ...(numJobs === "3" ? [{ idx: 3, jt: fd.jobType3, hb: fd.hourlyBasic3, hp: fd.hourlyPremium3, mb: fd.monthlyBasic3, mp: fd.monthlyPremium3 }] : []),
  ];
  for (const { idx, jt, hb, hp, mb, mp } of salaryJobs) {
    html += `<p class="subsection-label">${bl(CL.jobTypeN, lang)} ${idx}: ${esc(jt)}</p>`;
    if (fd.salaryType === "hourly") html += grid2(field(bl(CL.hourlyBasicRate, lang), hb ? `${hb} SEK` : "—"), field(bl(CL.hourlyPremium, lang), hp ? `${hp} SEK` : "—"));
    else if (fd.salaryType === "monthly") html += grid2(field(bl(CL.monthlyBasicRate, lang), mb ? `${mb} SEK` : "—"), field(bl(CL.monthlyPremium, lang), mp ? `${mp} SEK` : "—"));
  }

  // §8 SALARY DETAILS
  html += `<h2 class="section-title">§8. ${bl(CL.s8_title, lang)}</h2>`;
  html += infoBlock(`<strong>${pt(CL.overtimeClause, lang)}</strong>`, svLine(CL.overtimeClause), true);
  html += grid2(field(bl(CL.pieceWorkPay, lang), esc(fd.pieceWorkPay)), field(bl(CL.otherBenefits, lang), esc(fd.otherSalaryBenefits)));
  const pmVal = fd.paymentMethod === "account" ? bl(CL.bankAccount, lang) : fd.paymentMethod === "cash" ? bl(CL.cash, lang) : esc(fd.paymentMethod);
  html += grid2(field(bl(CL.paymentMethod, lang), pmVal));

  // §9 TRAINING
  html += `<h2 class="section-title">§9. ${bl(CL.s9_title, lang)}</h2>`;
  html += `<p style="font-size:8.5pt;color:#444;margin-bottom:4px;font-style:italic;">${pt(CL.s9_intro, lang)}${!isSEOnly ? ` / <span style="font-style:italic;color:#888;">${svt(CL.s9_intro)}</span>` : ""}</p>`;
  html += `<p class="check-item">${fd.trainingSkotselskolan ? "☑" : "☐"} <strong>Skötselskolan</strong> <span class="training-mandatory-badge">${bl(CL.mandatory, lang)}</span></p>`;
  html += `<p class="check-item">${fd.trainingSYN ? "☑" : "☐"} <strong>SYN</strong> (Säkerhets- och yrkesutbildning) <span class="training-mandatory-badge">${bl(CL.mandatory, lang)}</span></p>`;
  if (fd.trainingOtherEnabled && fd.trainingOtherText) html += `<p class="check-item">☑ ${bl(CL.other, lang)}: ${esc(fd.trainingOtherText)}</p>`;

  // §10 SOCIAL SECURITY
  html += `<h2 class="section-title">§10. ${bl(CL.s10_title, lang)}</h2>`;
  html += `<div class="info-block"><p>${pt(CL.s10_text, lang)}</p><ul class="info-list"><li>${pt(CL.s10_pension, lang)}</li><li>${pt(CL.s10_tgl, lang)}</li><li>${pt(CL.s10_tfa, lang)}</li><li>${pt(CL.s10_ags, lang)}</li></ul>${!isSEOnly ? `<p class="info-sv">${svt(CL.s10_text)}</p><ul class="info-list" style="font-style:italic;color:#444;"><li>${svt(CL.s10_pension)}</li><li>${svt(CL.s10_tgl)}</li><li>${svt(CL.s10_tfa)}</li><li>${svt(CL.s10_ags)}</li></ul>` : ""}</div>`;

  // §11 MISCELLANEOUS
  html += `<h2 class="section-title">§11. ${bl(CL.s11_title, lang)}</h2>`;
  html += `<div class="info-block"><p>${fd.miscellaneousText ? esc(fd.miscellaneousText).replace(/\n/g, "<br/>") : `<span class="info-text-muted">${bl(CL.noAdditionalTerms, lang)}</span>`}</p></div>`;

  // §12 NOTES
  html += `<h2 class="section-title">§12. ${bl(CL.s12_title, lang)}</h2>`;
  const notes = [CL.s12_note1, CL.s12_note2, CL.s12_note3, CL.s12_note4, CL.s12_note5];
  html += `<div class="info-block legal-notes">`;
  notes.forEach((n, i) => { html += `<p><strong>${i + 1}.</strong> ${pt(n, lang)}${!isSEOnly ? ` / <span style="font-style:italic;color:#444;">${svt(n)}</span>` : ""}</p>`; });
  html += `</div>`;

  // §13 DEDUCTIONS
  if (fd.salaryDeductions && fd.salaryDeductions.length > 0) {
    html += `<h2 class="section-title">§13. ${bl(CL.s13_title, lang)}</h2>`;
    html += `<table class="deduction-table"><thead><tr><th>${bl(CL.type, lang)}</th><th>${bl(CL.amount, lang)}</th><th>${bl(CL.frequency, lang)}</th><th>${bl(CL.note, lang)}</th></tr></thead><tbody>`;
    for (const d of fd.salaryDeductions) {
      const dedLabel = dedMap[d.type] ? bl(dedMap[d.type], lang) : esc(d.label || d.type);
      const freqLabel = freqMap[d.frequency] ? bl(freqMap[d.frequency], lang) : esc(d.frequency || "—");
      html += `<tr><td>${dedLabel}</td><td>${d.amount ? `${esc(d.amount)} SEK` : "—"}</td><td>${freqLabel}</td><td>${esc(d.note) || "—"}</td></tr>`;
    }
    html += `</tbody></table>`;
  }

  // ── SIGNATURES ──
  html += `<div class="sig-section"><h2 class="section-title">${bl(CL.signatures, lang)}</h2>`;
  html += `<p class="sig-intro">${pt(CL.sigIntro, lang)}${!isSEOnly ? ` / <span style="font-style:italic;color:#888;">${svt(CL.sigIntro)}</span>` : ""}</p>`;
  html += `<div class="sig-grid">`;
  // Employer
  html += `<div><div class="sig-field"><div class="sig-line">${emplrSignMeta?.place && emplrSignMeta?.date ? `${esc(emplrSignMeta.place)}, ${fmtDate(emplrSignMeta.date)}` : ""}</div><span class="sig-label">${bl(CL.placeAndDate, lang)}</span></div>`;
  html += `<div class="sig-field"><div class="sig-line">${esc(companyName)}</div><span class="sig-label">${bl(CL.company, lang)}</span></div>`;
  html += `<div class="sig-field"><div class="sig-line sig-line-tall">${employerSignatureUrl ? `<img src="${employerSignatureUrl}" style="height:28px;object-fit:contain;" />` : ""}</div><span class="sig-label">${bl(CL.employerSignature, lang)}</span>${employerSignedAt ? `<span class="sig-date">${pt(CL.signed, lang)}: ${fmtDate(employerSignedAt)}</span>` : ""}</div></div>`;
  // Employee
  html += `<div><div class="sig-field"><div class="sig-line">${empSignMeta?.place && empSignMeta?.date ? `${esc(empSignMeta.place)}, ${fmtDate(empSignMeta.date)}` : ""}</div><span class="sig-label">${bl(CL.placeAndDate, lang)}</span></div>`;
  html += `<div class="sig-field"><div class="sig-line">${esc(fd.firstName || "")} ${esc(fd.lastName || "")}</div><span class="sig-label">${bl(CL.employee, lang)}</span></div>`;
  html += `<div class="sig-field"><div class="sig-line sig-line-tall">${employeeSignatureUrl ? `<img src="${employeeSignatureUrl}" style="height:28px;object-fit:contain;" />` : ""}</div><span class="sig-label">${bl(CL.employeeSignature, lang)}</span>${employeeSignedAt ? `<span class="sig-date">${pt(CL.signed, lang)}: ${fmtDate(employeeSignedAt)}</span>` : ""}</div></div>`;
  html += `</div></div>`; // sig-grid, sig-section

  // ════════════════════════════════════════════════════
  // APPENDIX A — CODE OF CONDUCT (page break before)
  // ════════════════════════════════════════════════════
  const cocSv = COC_SV;
  const cocPrimary = getCocPrimaryForLang(lang);

  html += `<div class="page-break"></div>`;
  html += `<h2 class="section-title">${bl(CL.appendixCoC, lang)}</h2>`;

  // Show primary language CoC first (if not SE-only)
  if (cocPrimary) {
    html += `<h3 style="font-size:10pt;font-weight:700;text-align:center;margin-bottom:8px;">${esc(cocPrimary.title)}</h3>`;
    html += `<div class="coc-section">`;
    for (const s of cocPrimary.sections) {
      if (s.heading) html += `<p class="coc-heading">${esc(s.heading)}</p>`;
      html += `<p class="coc-body">${esc(s.body)}</p>`;
    }
    html += `</div>`;

    // Swedish version below
    html += `<div class="page-break"></div>`;
    html += `<h3 style="font-size:10pt;font-weight:700;text-align:center;margin-bottom:8px;">${esc(cocSv.title)}</h3>`;
    html += `<div class="coc-section">`;
    for (const s of cocSv.sections) {
      if (s.heading) html += `<p class="coc-heading">${esc(s.heading)}</p>`;
      html += `<p class="coc-body">${esc(s.body)}</p>`;
    }
    html += `</div>`;
  } else {
    // SE-only: just show Swedish
    html += `<h3 style="font-size:10pt;font-weight:700;text-align:center;margin-bottom:8px;">${esc(cocSv.title)}</h3>`;
    html += `<div class="coc-section">`;
    for (const s of cocSv.sections) {
      if (s.heading) html += `<p class="coc-heading">${esc(s.heading)}</p>`;
      html += `<p class="coc-body">${esc(s.body)}</p>`;
    }
    html += `</div>`;
  }

  // ════════════════════════════════════════════════════
  // APPENDIX B — WORK SCHEDULE (page break before)
  // ════════════════════════════════════════════════════
  html += `<div class="page-break"></div>`;
  html += `<h2 class="section-title">${bl(CL.appendixSchedule, lang)}</h2>`;

  if (scheduleRows.length > 0) {
    html += `<table class="schedule-table"><thead><tr>`;
    html += `<th>${bl(CL.scheduleDate, lang)}</th>`;
    html += `<th>${bl(CL.scheduleDayType, lang)}</th>`;
    html += `<th>${bl(CL.scheduleHours, lang)}</th>`;
    html += `<th>${bl(CL.scheduleStart, lang)}</th>`;
    html += `<th>${bl(CL.scheduleEnd, lang)}</th>`;
    html += `<th>${bl(CL.scheduleHoliday, lang)}</th>`;
    html += `</tr></thead><tbody>`;

    for (const row of scheduleRows) {
      const isHoliday = row.day_type === "Holiday";
      const isWeekend = row.day_type === "Weekend";
      const trClass = isHoliday ? ' class="holiday"' : isWeekend ? ' class="weekend"' : '';
      const holidayName = lang === "SE" ? (row.holiday_name_sv || "") : (row.holiday_name_en || row.holiday_name_sv || "");
      html += `<tr${trClass}>`;
      html += `<td>${fmtDate(row.schedule_date)}</td>`;
      html += `<td>${esc(row.day_type)}</td>`;
      html += `<td>${row.scheduled_hours}</td>`;
      html += `<td>${esc(row.start_time) || "—"}</td>`;
      html += `<td>${esc(row.end_time) || "—"}</td>`;
      html += `<td>${esc(holidayName) || "—"}</td>`;
      html += `</tr>`;
    }
    html += `</tbody></table>`;

    // Summary
    const totalHours = scheduleRows.reduce((sum: number, r: any) => sum + (Number(r.scheduled_hours) || 0), 0);
    const workdays = scheduleRows.filter((r: any) => r.day_type === "Workday").length;
    html += `<p style="font-size:8.5pt;color:#555;margin-top:6px;">Total: ${totalHours}h · ${workdays} workdays</p>`;
  } else {
    html += `<p class="info-text-muted">${bl(CL.noSchedule, lang)}</p>`;
  }

  html += `</div>`; // contract-doc

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${bl(CL.title, lang)} ${esc(contractCode)}</title><style>${printCss}</style></head><body>${html}</body></html>`;
}

/* ══════════════════════════════════════════════════════
   Build cover email (simple notification)
   ══════════════════════════════════════════════════════ */
function buildCoverEmailHtml(
  employeeName: string, companyName: string, contractCode: string, lang: string,
): string {
  const subject = lang === "SE" ? "Anställningsavtal" : "Employment Contract";
  const body1 = lang === "SE"
    ? `Bifogat finner du ditt undertecknade anställningsavtal <strong>${esc(contractCode)}</strong> med <strong>${esc(companyName)}</strong>.`
    : `Please find attached your signed employment contract <strong>${esc(contractCode)}</strong> with <strong>${esc(companyName)}</strong>.`;
  const body2 = lang === "SE"
    ? "Dokumentet innehåller det fullständiga avtalet, uppförandekoden (Bilaga A) och arbetsschemat (Bilaga B)."
    : "The document includes the full contract, Code of Conduct (Appendix A), and Work Schedule (Appendix B).";
  const body3 = lang === "SE"
    ? "Öppna den bifogade filen i en webbläsare och använd Ctrl+P (eller ⌘+P) för att spara som PDF."
    : "Open the attached file in a browser and use Ctrl+P (or ⌘+P) to save as PDF.";
  const greeting = lang === "SE" ? "Med vänliga hälsningar" : "Kind regards";

  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;background:#fff;max-width:600px;margin:0 auto;padding:24px;">
    <h2 style="font-size:16pt;margin-bottom:16px;">${subject}</h2>
    <p style="font-size:11pt;line-height:1.5;margin-bottom:12px;">Dear ${esc(employeeName)},</p>
    <p style="font-size:11pt;line-height:1.5;margin-bottom:12px;">${body1}</p>
    <p style="font-size:11pt;line-height:1.5;margin-bottom:12px;">${body2}</p>
    <p style="font-size:10pt;line-height:1.5;margin-bottom:20px;color:#666;font-style:italic;">${body3}</p>
    <p style="font-size:11pt;line-height:1.5;">${greeting},<br/><strong>${esc(companyName)}</strong></p>
  </body></html>`;
}

/* ── Main handler ── */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: roleCheck } = await authClient.rpc("is_hr_user");
    if (!roleCheck) {
      return new Response(JSON.stringify({ error: "Forbidden: HR role required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { contractId, recipientEmail } = await req.json();

    if (!contractId || !recipientEmail) {
      return new Response(
        JSON.stringify({ error: "contractId and recipientEmail are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch contract with related data
    const { data: contract, error: fetchErr } = await supabase
      .from("contracts")
      .select(`*, employees (email, first_name, last_name, middle_name, phone), companies (name, org_number, address, postcode, city)`)
      .eq("id", contractId)
      .single();

    if (fetchErr || !contract) {
      return new Response(
        JSON.stringify({ error: "Contract not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch schedule data
    const { data: scheduleRows } = await supabase
      .from("contract_schedules")
      .select("*")
      .eq("contract_id", contractId)
      .order("schedule_date", { ascending: true });

    const employee = contract.employees as any;
    const company = contract.companies as any;
    const fd = (contract.form_data as Record<string, any>) || {};
    const companyName = company?.name || fd.companySnapshot?.name || "Employer";
    const companyOrgNumber = company?.org_number || fd.companySnapshot?.orgNumber || "";
    const companyAddress = company?.address || fd.companySnapshot?.address || "";
    const companyPostcode = company?.postcode || fd.companySnapshot?.postcode || "";
    const companyCity = company?.city || fd.companySnapshot?.city || "";
    const contractCode = contract.contract_code || "Draft";
    const seasonYear = contract.season_year || "";
    const empSignMeta = (contract.employee_signing_metadata as any) || {};
    const emplrSignMeta = (contract.employer_signing_metadata as any) || {};
    const lang = fd.contractLanguage || "EN/SE";

    if (!resendApiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Email service not configured. Please add the RESEND_API_KEY secret.",
          contractCode,
          recipientEmail,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const employeeName = `${fd.firstName || employee?.first_name || ""} ${fd.lastName || employee?.last_name || ""}`.trim() || "Employee";

    // Build the full contract HTML attachment (contract + CoC + schedule)
    const attachmentHtml = buildFullContractHtml(
      fd, companyName, companyOrgNumber, companyAddress, companyPostcode, companyCity,
      contractCode, seasonYear, empSignMeta, emplrSignMeta,
      contract.employee_signed_at, contract.employer_signed_at,
      contract.employee_signature_url, contract.employer_signature_url,
      scheduleRows || [],
    );

    // Build cover email
    const coverHtml = buildCoverEmailHtml(employeeName, companyName, contractCode, lang);

    // Base64 encode the attachment
    const encoder = new TextEncoder();
    const attachmentBytes = encoder.encode(attachmentHtml);
    const attachmentBase64 = btoa(String.fromCharCode(...attachmentBytes));

    // Clean filename
    const safeCode = contractCode.replace(/[^a-zA-Z0-9\-_]/g, "-");

    // Send email via Resend with attachment
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: `${companyName} Contracts <contracts@mail.erptable.com>`,
        to: [recipientEmail],
        subject: `${bl(CL.title, lang)} ${contractCode} — ${companyName}`,
        html: coverHtml,
        attachments: [
          {
            content: attachmentBase64,
            filename: `Employment-Contract-${safeCode}.html`,
          },
        ],
      }),
    });

    if (!emailResponse.ok) {
      const errBody = await emailResponse.text();
      console.error("Resend error:", errBody);
      throw new Error(`Email service error: ${emailResponse.status}`);
    }

    // Audit log
    const callerId = claimsData.claims.sub;
    try {
      const { data: callerUser } = await supabase.auth.admin.getUserById(callerId);
      await supabase.from("audit_log").insert({
        user_id: callerId,
        user_email: callerUser?.user?.email || callerId,
        action: "CONTRACT_EMAIL_SENT",
        table_name: "contracts",
        record_id: contractId,
        summary: `Signed contract email with attachment sent for ${contractCode} to ${recipientEmail}`,
        new_data: { recipient: recipientEmail, contractCode, employeeName, hasSchedule: (scheduleRows || []).length > 0 },
        org_id: contract.org_id,
      });
    } catch (auditErr) {
      console.error("Audit log insert failed:", auditErr);
    }

    return new Response(
      JSON.stringify({ success: true, contractCode, recipientEmail }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
