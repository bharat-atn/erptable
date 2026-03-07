import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

/* ── Bilingual label system (mirrors contract-translations.ts) ── */
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
  appendixCoCText: L(
    "The Code of Conduct was reviewed and acknowledged by the employee as part of the e-signing process and forms an integral appendix to this contract.",
    "Uppförandekoden granskades och godkändes av arbetstagaren som en del av e-signeringsprocessen och utgör en integrerad bilaga till detta avtal.",
    "Codul de conduită a fost revizuit și confirmat de angajat ca parte a procesului de semnare electronică și constituie o anexă integrală la acest contract.",
    "จรรยาบรรณได้รับการตรวจสอบและรับทราบโดยลูกจ้างเป็นส่วนหนึ่งของกระบวนการลงนามอิเล็กทรอนิกส์ และเป็นภาคผนวกที่สำคัญของสัญญานี้",
    "Кодекс поведінки був переглянутий та підтверджений працівником як частина процесу електронного підписання і є невід'ємним додатком до цього договору."
  ),
  appendixSchedule: L("Appendix B — Work Schedule", "Bilaga B — Arbetsschema", "Anexa B — Programul de lucru", "ภาคผนวก ข — ตารางการทำงาน", "Додаток Б — Графік роботи"),
  appendixScheduleText: L(
    "The work schedule was reviewed and acknowledged by the employee as part of the e-signing process and forms an integral appendix to this contract.",
    "Arbetsschemat granskades och godkändes av arbetstagaren som en del av e-signeringsprocessen och utgör en integrerad bilaga till detta avtal.",
    "Programul de lucru a fost revizuit și confirmat de angajat ca parte a procesului de semnare electronică și constituie o anexă integrală la acest contract.",
    "ตารางการทำงานได้รับการตรวจสอบและรับทราบโดยลูกจ้างเป็นส่วนหนึ่งของกระบวนการลงนามอิเล็กทรอนิกส์ และเป็นภาคผนวกที่สำคัญของสัญญานี้",
    "Графік роботи був переглянутий та підтверджений працівником як частина процесу електронного підписання і є невід'ємним додатком до цього договору."
  ),
};

/* ── CSS (matches CONTRACT_PRINT_CSS for consistent rendering) ── */
const emailCss = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Georgia, 'Times New Roman', serif; color: #1a1a1a; background: #fff; font-size: 10pt; line-height: 1.45; }
  .contract-doc { max-width: 640px; margin: 0 auto; padding: 24px; }
  .doc-header { text-align: center; padding-bottom: 10px; border-bottom: 3px double #333; margin-bottom: 12px; }
  .doc-header h1 { font-size: 14pt; font-weight: 700; letter-spacing: 2.5px; margin-bottom: 2px; font-family: Arial, Helvetica, sans-serif; }
  .doc-subtitle { font-size: 8.5pt; color: #555; letter-spacing: 0.5px; }
  .doc-legal-lang { font-size: 7.5pt; color: #666; margin-top: 4px; font-style: italic; letter-spacing: 0.3px; border-top: 1px solid #ccc; padding-top: 4px; }
  .section-title { font-family: Arial, Helvetica, sans-serif; font-size: 10pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; border-bottom: 2px solid #333; padding-bottom: 2px; margin-top: 14px; margin-bottom: 6px; color: #1a1a1a; }
  .field-row { display: table; width: 100%; border-bottom: 1px solid #e0e0e0; padding: 2px 0; }
  .field-row-half { display: inline-block; width: 49%; vertical-align: top; border-bottom: 1px solid #e0e0e0; padding: 2px 0; }
  .field-row-third { display: inline-block; width: 32%; vertical-align: top; border-bottom: 1px solid #e0e0e0; padding: 2px 0; }
  .field-label { display: block; font-family: Arial, Helvetica, sans-serif; font-size: 7pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; color: #666; }
  .field-value { display: block; font-size: 9.5pt; color: #111; min-height: 12px; }
  .subsection-label { font-family: Arial, Helvetica, sans-serif; font-size: 7.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; color: #444; margin-top: 6px; margin-bottom: 3px; }
  .info-block { background: #f8f8f8; border-left: 3px solid #ccc; padding: 5px 10px; margin-bottom: 4px; font-size: 9pt; line-height: 1.4; }
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
  .deduction-table { width: 100%; border-collapse: collapse; margin-bottom: 4px; font-size: 9pt; }
  .deduction-table th { font-family: Arial, Helvetica, sans-serif; font-size: 7pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #555; text-align: left; padding: 3px 6px; border-bottom: 2px solid #999; }
  .deduction-table td { padding: 3px 6px; border-bottom: 1px solid #ddd; }
  .sig-section { margin-top: 20px; }
  .sig-intro { font-size: 8.5pt; color: #555; margin-bottom: 14px; font-style: italic; }
  .sig-grid { width: 100%; }
  .sig-col { display: inline-block; width: 48%; vertical-align: top; }
  .sig-field { margin-bottom: 10px; }
  .sig-line { border-bottom: 1px solid #555; min-height: 24px; padding-bottom: 2px; font-size: 9.5pt; }
  .sig-line-tall { min-height: 34px; }
  .sig-label { font-family: Arial, Helvetica, sans-serif; font-size: 6.5pt; color: #777; margin-top: 1px; text-transform: uppercase; letter-spacing: 0.4px; }
  .sig-date { font-size: 6.5pt; color: #999; margin-top: 1px; }
  .sig-img { height: 28px; }
  .appendix-section { margin-top: 16px; padding-top: 12px; border-top: 1px dashed #ccc; }
  .appendix-title { font-family: Arial, Helvetica, sans-serif; font-size: 9pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; color: #1a1a1a; margin-bottom: 4px; }
`;

/* ── HTML builders ── */
function fieldRow(label: string, value: string, cls = "field-row"): string {
  return `<div class="${cls}"><span class="field-label">${label}</span><span class="field-value">${value}</span></div>`;
}

function sectionTitle(title: string): string {
  return `<h2 class="section-title">${title}</h2>`;
}

function twoCol(left: string, right: string): string {
  return `<div>${left.replace(/class="field-row"/g, 'class="field-row-half"')}${right.replace(/class="field-row"/g, 'class="field-row-half"')}</div>`;
}

function threeCol(a: string, b: string, c: string): string {
  return `<div>${a.replace(/class="field-row"/g, 'class="field-row-third"')}${b.replace(/class="field-row"/g, 'class="field-row-third"')}${c.replace(/class="field-row"/g, 'class="field-row-third"')}</div>`;
}

function infoBlock(primary: string, swedish: string | null, alert = false): string {
  return `<div class="info-block${alert ? " info-block-alert" : ""}"><p><strong>${primary}</strong></p>${swedish ? `<p class="info-sv">${swedish}</p>` : ""}</div>`;
}

function buildContractEmailHtml(
  fd: Record<string, any>,
  companyName: string,
  companyOrgNumber: string,
  companyAddress: string,
  companyPostcode: string,
  companyCity: string,
  contractCode: string,
  seasonYear: string,
  empSignMeta: any,
  emplrSignMeta: any,
  employeeSignedAt: string | null,
  employerSignedAt: string | null,
  employeeSignatureUrl: string | null,
  employerSignatureUrl: string | null,
  viewLink: string,
): string {
  const lang: string = fd.contractLanguage || "EN/SE";
  const isSEOnly = lang === "SE";
  const svLine = (l: LS) => isSEOnly ? null : svt(l);

  // Employment form
  const efMap: Record<string, LS> = {
    permanent: CL.ef_permanent, probation: CL.ef_probation, "fixed-term": CL.ef_fixedTerm,
    "temp-replacement": CL.ef_tempReplacement, seasonal: CL.ef_seasonal, "age-69": CL.ef_age69,
  };
  const efLabel = efMap[fd.employmentForm] ? bl(efMap[fd.employmentForm], lang) : esc(fd.employmentForm || "—");

  // Frequency & deduction maps
  const freqMap: Record<string, LS> = { monthly: CL.freq_monthly, weekly: CL.freq_weekly, "one-time": CL.freq_oneTime, "per-km": CL.freq_perKm };
  const dedMap: Record<string, LS> = { rent: CL.ded_rent, car: CL.ded_car, travel: CL.ded_travel, immigration: CL.ded_immigration, other: CL.ded_other };

  let html = `<div class="contract-doc">`;

  // ── HEADER ──
  html += `<div class="doc-header">
    <h1>${bl(CL.title, lang)}</h1>
    <p class="doc-subtitle">${esc(contractCode)} · ${bl(CL.season, lang)}: ${esc(seasonYear || new Date().getFullYear().toString())}</p>
    <p class="doc-legal-lang">${pt(CL.legalDisclaimer, lang)}${!isSEOnly ? ` / <span style="font-style:italic;color:#888;">${svt(CL.legalDisclaimer)}</span>` : ""}</p>
  </div>`;

  // ── §1 EMPLOYER ──
  html += sectionTitle(`§1. ${bl(CL.s1_title, lang)}`);
  html += twoCol(
    fieldRow(bl(CL.employer, lang), esc(companyName)),
    fieldRow(bl(CL.orgNumber, lang), esc(companyOrgNumber))
  );
  html += twoCol(
    fieldRow(bl(CL.address, lang), esc(companyAddress)),
    fieldRow(bl(CL.postcodeCity, lang), `${esc(companyPostcode)} ${esc(companyCity)}`.trim())
  );

  // ── §2 EMPLOYEE ──
  html += sectionTitle(`§2. ${bl(CL.s2_title, lang)}`);
  html += threeCol(
    fieldRow(bl(CL.firstName, lang), esc(fd.firstName)),
    fieldRow(bl(CL.middleName, lang), esc(fd.middleName)),
    fieldRow(bl(CL.lastName, lang), esc(fd.lastName))
  );
  html += twoCol(
    fieldRow(bl(CL.address, lang), esc(fd.address)),
    fieldRow(bl(CL.city, lang), esc(fd.city))
  );
  html += twoCol(
    fieldRow(bl(CL.postcode, lang), esc(fd.zipCode)),
    fieldRow(bl(CL.country, lang), esc(fd.country))
  );
  html += twoCol(
    fieldRow(bl(CL.dateOfBirth, lang), fmtDate(fd.birthday)),
    fieldRow(bl(CL.citizenship, lang), esc(fd.citizenship))
  );
  html += twoCol(
    fieldRow(bl(CL.mobile, lang), esc(fd.mobile)),
    fieldRow(bl(CL.email, lang), esc(fd.email))
  );
  // Emergency Contact
  html += `<p class="subsection-label">${bl(CL.emergencyContact, lang)}</p>`;
  html += threeCol(
    fieldRow(bl(CL.firstName, lang), esc(fd.emergencyFirstName)),
    fieldRow(bl(CL.lastName, lang), esc(fd.emergencyLastName)),
    fieldRow(bl(CL.mobile, lang), esc(fd.emergencyMobile))
  );

  // ── §3 POSITION & DUTIES ──
  html += sectionTitle(`§3. ${bl(CL.s3_title, lang)}`);
  html += fieldRow(bl(CL.mainDuties, lang), esc(fd.mainDuties));
  const numJobs = String(fd.numberOfJobTypes || "1");
  const jobs = [
    { idx: 1, jt: fd.jobType, el: fd.experienceLevel },
    ...((numJobs === "2" || numJobs === "3") ? [{ idx: 2, jt: fd.jobType2, el: fd.experienceLevel2 }] : []),
    ...(numJobs === "3" ? [{ idx: 3, jt: fd.jobType3, el: fd.experienceLevel3 }] : []),
  ];
  for (const { idx, jt, el } of jobs) {
    html += twoCol(
      fieldRow(`${bl(CL.jobType, lang)}${numJobs !== "1" ? ` ${idx}` : ""}`, esc(jt)),
      fieldRow(`${bl(CL.experienceLevel, lang)}${numJobs !== "1" ? ` ${idx}` : ""}`, esc(el))
    );
  }
  html += twoCol(
    fieldRow(bl(CL.postingLocation, lang), esc(fd.postingLocation)),
    fieldRow(bl(CL.mainWorkplace, lang), esc(fd.mainWorkplace || fd.postingLocation))
  );
  html += fieldRow(bl(CL.workplaceVaries, lang), fd.workplaceVaries === "yes" ? bl(CL.yes, lang) : fd.workplaceVaries === "no" ? bl(CL.no, lang) : esc(fd.workplaceVaries));

  // ── §4 FORM OF EMPLOYMENT ──
  html += sectionTitle(`§4. ${bl(CL.s4_title, lang)}`);
  html += fieldRow(bl(CL.employmentForm, lang), efLabel);

  if (fd.employmentForm === "permanent") {
    html += fieldRow(bl(CL.fromDateFull, lang), fmtDate(fd.permanentFromDate));
  } else if (fd.employmentForm === "probation") {
    html += twoCol(fieldRow(bl(CL.fromDate, lang), fmtDate(fd.probationFromDate)), fieldRow(bl(CL.untilDate, lang), fmtDate(fd.probationUntilDate)));
  } else if (fd.employmentForm === "fixed-term") {
    html += twoCol(fieldRow(bl(CL.fromDate, lang), fmtDate(fd.fixedTermFromDate)), fieldRow(bl(CL.untilDate, lang), fmtDate(fd.fixedTermUntilDate)));
  } else if (fd.employmentForm === "temp-replacement") {
    html += twoCol(fieldRow(bl(CL.fromDate, lang), fmtDate(fd.tempReplacementFromDate)), fieldRow(bl(CL.position, lang), esc(fd.tempReplacementPosition)));
  } else if (fd.employmentForm === "seasonal") {
    html += twoCol(fieldRow(bl(CL.fromDate, lang), fmtDate(fd.seasonalFromDate)), fieldRow(bl(CL.endAround, lang), fmtDate(fd.seasonalEndAround)));
  } else if (fd.employmentForm === "age-69") {
    html += twoCol(fieldRow(bl(CL.fromDate, lang), fmtDate(fd.age69FromDate)), fieldRow(bl(CL.untilDate, lang), fmtDate(fd.age69UntilDate)));
  }

  // §4 clause
  html += `<div class="info-block" style="margin-top:8px;margin-bottom:12px;">
    <p style="margin:0;font-size:9pt;font-style:italic;">${pt(CL.s4_comesIntoForce, lang)}</p>
    ${!isSEOnly ? `<p style="margin:2px 0 0;font-size:8.5pt;color:#64748b;font-style:italic;">${svt(CL.s4_comesIntoForce)}</p>` : ""}
  </div>`;

  // ── §5 WORKING TIME & LEAVE ──
  html += sectionTitle(`§5. ${bl(CL.s5_title, lang)}`);
  const workTimeVal = fd.workingTime === "part-time"
    ? `${bl(CL.partTime, lang)} ${fd.partTimePercent ? `(${fd.partTimePercent}%)` : ""}`
    : bl(CL.fullTime, lang);
  html += twoCol(
    fieldRow(bl(CL.workingTime, lang), workTimeVal),
    fieldRow(bl(CL.annualLeave, lang), fd.annualLeaveDays ? `${fd.annualLeaveDays} ${pt(CL.days, lang)}` : "—")
  );

  // ── §6 NOTICE PERIOD ──
  html += sectionTitle(`§6. ${bl(CL.s6_title, lang)}`);
  html += infoBlock(pt(CL.s6_text, lang), svLine(CL.s6_text));

  // ── §7 COMPENSATION ──
  html += sectionTitle(`§7. ${bl(CL.s7_title, lang)}`);
  const salaryTypeVal = fd.salaryType === "hourly" ? bl(CL.hourly, lang) : fd.salaryType === "monthly" ? bl(CL.monthly, lang) : esc(fd.salaryType);
  let s7Row = fieldRow(bl(CL.salaryType, lang), salaryTypeVal);
  if (fd.companyPremiumPercent && Number(fd.companyPremiumPercent) > 0) {
    s7Row = twoCol(
      fieldRow(bl(CL.salaryType, lang), salaryTypeVal),
      fieldRow(bl(CL.companyPremium, lang), `+${esc(fd.companyPremiumPercent)}% ${pt(CL.aboveOfficialRate, lang)}`)
    );
  }
  html += s7Row;

  // Per-job-type salary
  const salaryJobs = [
    { idx: 1, jt: fd.jobType, hb: fd.hourlyBasic, hp: fd.hourlyPremium, mb: fd.monthlyBasic, mp: fd.monthlyPremium },
    ...((numJobs === "2" || numJobs === "3") ? [{ idx: 2, jt: fd.jobType2, hb: fd.hourlyBasic2, hp: fd.hourlyPremium2, mb: fd.monthlyBasic2, mp: fd.monthlyPremium2 }] : []),
    ...(numJobs === "3" ? [{ idx: 3, jt: fd.jobType3, hb: fd.hourlyBasic3, hp: fd.hourlyPremium3, mb: fd.monthlyBasic3, mp: fd.monthlyPremium3 }] : []),
  ];
  for (const { idx, jt, hb, hp, mb, mp } of salaryJobs) {
    html += `<p class="subsection-label">${bl(CL.jobTypeN, lang)} ${idx}: ${esc(jt)}</p>`;
    if (fd.salaryType === "hourly") {
      html += twoCol(
        fieldRow(bl(CL.hourlyBasicRate, lang), hb ? `${hb} SEK` : "—"),
        fieldRow(bl(CL.hourlyPremium, lang), hp ? `${hp} SEK` : "—")
      );
    } else if (fd.salaryType === "monthly") {
      html += twoCol(
        fieldRow(bl(CL.monthlyBasicRate, lang), mb ? `${mb} SEK` : "—"),
        fieldRow(bl(CL.monthlyPremium, lang), mp ? `${mp} SEK` : "—")
      );
    }
  }

  // ── §8 SALARY DETAILS ──
  html += sectionTitle(`§8. ${bl(CL.s8_title, lang)}`);
  html += infoBlock(`<strong>${pt(CL.overtimeClause, lang)}</strong>`, svLine(CL.overtimeClause), true);
  html += twoCol(
    fieldRow(bl(CL.pieceWorkPay, lang), esc(fd.pieceWorkPay)),
    fieldRow(bl(CL.otherBenefits, lang), esc(fd.otherSalaryBenefits))
  );
  const pmVal = fd.paymentMethod === "account" ? bl(CL.bankAccount, lang) : fd.paymentMethod === "cash" ? bl(CL.cash, lang) : esc(fd.paymentMethod);
  html += fieldRow(bl(CL.paymentMethod, lang), pmVal);

  // ── §9 TRAINING ──
  html += sectionTitle(`§9. ${bl(CL.s9_title, lang)}`);
  html += `<p style="font-size:8.5pt;color:#444;margin-bottom:4px;font-style:italic;">${pt(CL.s9_intro, lang)}${!isSEOnly ? ` / <span style="font-style:italic;color:#888;">${svt(CL.s9_intro)}</span>` : ""}</p>`;
  if (fd.trainingSkotselskolan) html += `<p class="check-item">☑ <strong>Skötselskolan</strong> <span class="training-mandatory-badge">${bl(CL.mandatory, lang)}</span></p>`;
  else html += `<p class="check-item">☐ <strong>Skötselskolan</strong> <span class="training-mandatory-badge">${bl(CL.mandatory, lang)}</span></p>`;
  if (fd.trainingSYN) html += `<p class="check-item">☑ <strong>SYN</strong> (Säkerhets- och yrkesutbildning) <span class="training-mandatory-badge">${bl(CL.mandatory, lang)}</span></p>`;
  else html += `<p class="check-item">☐ <strong>SYN</strong> (Säkerhets- och yrkesutbildning) <span class="training-mandatory-badge">${bl(CL.mandatory, lang)}</span></p>`;
  if (fd.trainingOtherEnabled && fd.trainingOtherText) {
    html += `<p class="check-item">☑ ${bl(CL.other, lang)}: ${esc(fd.trainingOtherText)}</p>`;
  }

  // ── §10 SOCIAL SECURITY ──
  html += sectionTitle(`§10. ${bl(CL.s10_title, lang)}`);
  html += `<div class="info-block">
    <p>${pt(CL.s10_text, lang)}</p>
    <ul class="info-list"><li>${pt(CL.s10_pension, lang)}</li><li>${pt(CL.s10_tgl, lang)}</li><li>${pt(CL.s10_tfa, lang)}</li><li>${pt(CL.s10_ags, lang)}</li></ul>
    ${!isSEOnly ? `<p class="info-sv">${svt(CL.s10_text)}</p><ul class="info-list" style="font-style:italic;color:#444;"><li>${svt(CL.s10_pension)}</li><li>${svt(CL.s10_tgl)}</li><li>${svt(CL.s10_tfa)}</li><li>${svt(CL.s10_ags)}</li></ul>` : ""}
  </div>`;

  // ── §11 MISCELLANEOUS ──
  html += sectionTitle(`§11. ${bl(CL.s11_title, lang)}`);
  html += `<div class="info-block"><p>${fd.miscellaneousText ? esc(fd.miscellaneousText).replace(/\n/g, "<br/>") : `<span class="info-text-muted">${bl(CL.noAdditionalTerms, lang)}</span>`}</p></div>`;

  // ── §12 NOTES / LEGAL CLAUSES ──
  html += sectionTitle(`§12. ${bl(CL.s12_title, lang)}`);
  const notes = [CL.s12_note1, CL.s12_note2, CL.s12_note3, CL.s12_note4, CL.s12_note5];
  html += `<div class="info-block legal-notes">`;
  notes.forEach((n, i) => {
    html += `<p><strong>${i + 1}.</strong> ${pt(n, lang)}${!isSEOnly ? ` / <span style="font-style:italic;color:#444;">${svt(n)}</span>` : ""}</p>`;
  });
  html += `</div>`;

  // ── §13 DEDUCTIONS (conditional) ──
  if (fd.salaryDeductions && fd.salaryDeductions.length > 0) {
    html += sectionTitle(`§13. ${bl(CL.s13_title, lang)}`);
    html += `<table class="deduction-table"><thead><tr><th>${bl(CL.type, lang)}</th><th>${bl(CL.amount, lang)}</th><th>${bl(CL.frequency, lang)}</th><th>${bl(CL.note, lang)}</th></tr></thead><tbody>`;
    for (const d of fd.salaryDeductions) {
      const dedLabel = dedMap[d.type] ? bl(dedMap[d.type], lang) : d.labelSv ? `${esc(d.label)} / ${esc(d.labelSv)}` : esc(d.label || d.type);
      const freqLabel = freqMap[d.frequency] ? bl(freqMap[d.frequency], lang) : esc(d.frequency || "—");
      html += `<tr><td>${dedLabel}</td><td>${d.amount ? `${esc(d.amount)} SEK` : "—"}</td><td>${freqLabel}</td><td>${esc(d.note) || "—"}</td></tr>`;
    }
    html += `</tbody></table>`;
  }

  // ── SIGNATURES ──
  html += `<div class="sig-section">`;
  html += sectionTitle(bl(CL.signatures, lang));
  html += `<p class="sig-intro">${pt(CL.sigIntro, lang)}${!isSEOnly ? ` / <span style="font-style:italic;color:#888;">${svt(CL.sigIntro)}</span>` : ""}</p>`;
  html += `<div class="sig-grid">`;

  // Employer column
  html += `<div class="sig-col">`;
  html += `<div class="sig-field"><div class="sig-line">${emplrSignMeta?.place && emplrSignMeta?.date ? `${esc(emplrSignMeta.place)}, ${fmtDate(emplrSignMeta.date)}` : ""}</div><span class="sig-label">${bl(CL.placeAndDate, lang)}</span></div>`;
  html += `<div class="sig-field"><div class="sig-line">${esc(companyName)}</div><span class="sig-label">${bl(CL.company, lang)}</span></div>`;
  html += `<div class="sig-field"><div class="sig-line sig-line-tall">${employerSignatureUrl ? `<img src="${employerSignatureUrl}" alt="Employer signature" class="sig-img" />` : ""}</div><span class="sig-label">${bl(CL.employerSignature, lang)}</span>${employerSignedAt ? `<span class="sig-date">${pt(CL.signed, lang)}: ${fmtDate(employerSignedAt)}</span>` : ""}</div>`;
  html += `</div>`;

  // Employee column
  html += `<div class="sig-col" style="margin-left:3%;">`;
  html += `<div class="sig-field"><div class="sig-line">${empSignMeta?.place && empSignMeta?.date ? `${esc(empSignMeta.place)}, ${fmtDate(empSignMeta.date)}` : ""}</div><span class="sig-label">${bl(CL.placeAndDate, lang)}</span></div>`;
  html += `<div class="sig-field"><div class="sig-line">${esc(fd.firstName || "")} ${esc(fd.lastName || "")}</div><span class="sig-label">${bl(CL.employee, lang)}</span></div>`;
  html += `<div class="sig-field"><div class="sig-line sig-line-tall">${employeeSignatureUrl ? `<img src="${employeeSignatureUrl}" alt="Employee signature" class="sig-img" />` : ""}</div><span class="sig-label">${bl(CL.employeeSignature, lang)}</span>${employeeSignedAt ? `<span class="sig-date">${pt(CL.signed, lang)}: ${fmtDate(employeeSignedAt)}</span>` : ""}</div>`;
  html += `</div>`;

  html += `</div></div>`; // sig-grid, sig-section

  // ── APPENDICES ──
  html += `<div class="appendix-section">`;
  html += `<p class="appendix-title">${bl(CL.appendixCoC, lang)}</p>`;
  html += `<div class="info-block"><p>${pt(CL.appendixCoCText, lang)}</p>${!isSEOnly ? `<p class="info-sv">${svt(CL.appendixCoCText)}</p>` : ""}</div>`;
  html += `<p class="appendix-title" style="margin-top:8px;">${bl(CL.appendixSchedule, lang)}</p>`;
  html += `<div class="info-block"><p>${pt(CL.appendixScheduleText, lang)}</p>${!isSEOnly ? `<p class="info-sv">${svt(CL.appendixScheduleText)}</p>` : ""}</div>`;
  html += `</div>`;

  // ── VIEW LINK ──
  if (viewLink) {
    html += `<div style="text-align:center;margin:24px 0 16px;">
      <a href="${viewLink}" style="display:inline-block;padding:10px 28px;background:#1a1a1a;color:#fff;text-decoration:none;font-family:Arial,sans-serif;font-size:10pt;font-weight:700;letter-spacing:0.5px;border-radius:2px;">VIEW FULL CONTRACT / SE HELA AVTALET</a>
    </div>`;
  }

  html += `</div>`; // contract-doc

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${emailCss}</style></head><body>${html}</body></html>`;
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
    const signingToken = contract.signing_token || "";
    const empSignMeta = (contract.employee_signing_metadata as any) || {};
    const emplrSignMeta = (contract.employer_signing_metadata as any) || {};

    const appOrigin = req.headers.get("origin") || "https://erptable.lovable.app";
    const viewLink = signingToken ? `${appOrigin}/sign/${signingToken}` : "";

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

    const emailHtml = buildContractEmailHtml(
      fd, companyName, companyOrgNumber, companyAddress, companyPostcode, companyCity,
      contractCode, seasonYear, empSignMeta, emplrSignMeta,
      contract.employee_signed_at, contract.employer_signed_at,
      contract.employee_signature_url, contract.employer_signature_url,
      viewLink,
    );

    // Send email via Resend
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: `${companyName} Contracts <contracts@mail.erptable.com>`,
        to: [recipientEmail],
        subject: `${bl(CL.title, fd.contractLanguage || "EN/SE")} ${contractCode} — ${companyName}`,
        html: emailHtml,
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
        summary: `Signed contract email sent for ${contractCode} to ${recipientEmail}`,
        new_data: { recipient: recipientEmail, contractCode, employeeName },
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
