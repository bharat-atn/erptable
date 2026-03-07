/**
 * Full translations for the employment contract document.
 * Swedish is always the legally binding language and appears as the secondary line.
 * The "primary" language (EN, RO, TH, or UK) appears first.
 *
 * Language codes match LanguageSelectionStep: "EN/SE", "SE", "RO/SE", "TH/SE", "UK/SE"
 */

type LangCode = "EN/SE" | "SE" | "RO/SE" | "TH/SE" | "UK/SE" | string;

interface LabelSet {
  en: string;
  sv: string;
  ro: string;
  th: string;
  uk: string;
}

function L(en: string, sv: string, ro: string, th: string, uk: string): LabelSet {
  return { en, sv, ro, th, uk };
}

export const CONTRACT_LABELS = {
  // Header
  title: L(
    "EMPLOYMENT CONTRACT",
    "ANSTÄLLNINGSAVTAL",
    "CONTRACT DE MUNCĂ",
    "สัญญาจ้างงาน",
    "ТРУДОВИЙ ДОГОВІР"
  ),
  season: L("Season", "Säsong", "Sezon", "ฤดูกาล", "Сезон"),
  legalDisclaimer: L(
    "The legally binding language of this contract is Swedish.",
    "Det juridiskt bindande språket i detta avtal är svenska.",
    "Limba obligatorie din punct de vedere juridic a acestui contract este suedeza.",
    "ภาษาที่มีผลผูกพันทางกฎหมายของสัญญานี้คือภาษาสวีเดน",
    "Юридично обов'язковою мовою цього договору є шведська."
  ),

  // §1
  s1_title: L("Employer", "Arbetsgivare", "Angajator", "นายจ้าง", "Роботодавець"),
  employer: L("Employer", "Arbetsgivare", "Angajator", "นายจ้าง", "Роботодавець"),
  orgNumber: L("Organization Number", "Organisationsnummer", "Număr de înregistrare", "หมายเลของค์กร", "Реєстраційний номер"),
  address: L("Address", "Adress", "Adresă", "ที่อยู่", "Адреса"),
  postcodeCity: L("Postcode & City", "Postnummer & Ort", "Cod poștal & Oraș", "รหัสไปรษณีย์ & เมือง", "Поштовий індекс та місто"),

  // §2
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

  // §3
  s3_title: L("Position & Duties", "Befattning & Arbetsuppgifter", "Funcție și atribuții", "ตำแหน่งและหน้าที่", "Посада та обов'язки"),
  mainDuties: L("Main Duties", "Huvudsakliga Arbetsuppgifter", "Atribuții principale", "หน้าที่หลัก", "Основні обов'язки"),
  jobType: L("Job Type", "Anställningstyp", "Tipul postului", "ประเภทงาน", "Тип роботи"),
  experienceLevel: L("Experience Level", "Erfarenhetsnivå", "Nivel de experiență", "ระดับประสบการณ์", "Рівень досвіду"),
  postingLocation: L("Posting Location", "Stationeringsort", "Locul de detașare", "สถานที่ปฏิบัติงาน", "Місце відрядження"),
  mainWorkplace: L("Main Workplace", "Huvudarbetsplats", "Locul principal de muncă", "สถานที่ทำงานหลัก", "Основне робоче місце"),
  workplaceVaries: L("Workplace Varies", "Arbetsplats Varierar", "Locul de muncă variază", "สถานที่ทำงานเปลี่ยนแปลง", "Робоче місце змінюється"),
  yes: L("Yes", "Ja", "Da", "ใช่", "Так"),
  no: L("No", "Nej", "Nu", "ไม่", "Ні"),

  // §4
  s4_title: L("Form of Employment", "Anställningsform", "Forma de angajare", "รูปแบบการจ้างงาน", "Форма зайнятості"),
  employmentForm: L("Employment Form", "Anställningsform", "Forma de angajare", "รูปแบบการจ้างงาน", "Форма зайнятості"),
  fromDate: L("From", "Från", "De la", "ตั้งแต่", "З"),
  untilDate: L("Until", "Till", "Până la", "จนถึง", "До"),
  fromDateFull: L("From Date", "Från Datum", "De la data", "ตั้งแต่วันที่", "З дати"),
  endAround: L("End Around", "Slutar Omkring", "Sfârșit în jurul datei", "สิ้นสุดประมาณ", "Закінчення приблизно"),
  position: L("Position", "Befattning", "Funcție", "ตำแหน่ง", "Посада"),

  // Employment form types
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

  // §5
  s5_title: L("Working Time & Leave", "Arbetstid & Semester", "Timp de lucru și concediu", "เวลาทำงานและวันลา", "Робочий час та відпустка"),
  workingTime: L("Working Time", "Arbetstid", "Timp de lucru", "เวลาทำงาน", "Робочий час"),
  fullTime: L("Full-time", "Heltid", "Normă întreagă", "เต็มเวลา", "Повна зайнятість"),
  partTime: L("Part-time", "Deltid", "Normă parțială", "นอกเวลา", "Часткова зайнятість"),
  annualLeave: L("Annual Leave", "Semesterdagar", "Concediu anual", "วันลาพักร้อน", "Щорічна відпустка"),
  days: L("days", "dagar", "zile", "วัน", "днів"),

  // §6
  s6_title: L("Notice Period", "Uppsägningstid", "Perioada de preaviz", "ระยะเวลาแจ้งล่วงหน้า", "Строк попередження"),
  s6_text: L(
    "Notice periods are regulated in accordance with the Swedish Employment Protection Act (LAS) and applicable collective agreements (Skogsavtalet).",
    "Uppsägningstider regleras i enlighet med lagen om anställningsskydd (LAS) och tillämpliga kollektivavtal (Skogsavtalet).",
    "Perioadele de preaviz sunt reglementate în conformitate cu Legea suedeză privind protecția muncii (LAS) și acordurile colective aplicabile (Skogsavtalet).",
    "ระยะเวลาแจ้งล่วงหน้าเป็นไปตามกฎหมายคุ้มครองการจ้างงานของสวีเดน (LAS) และข้อตกลงร่วมที่บังคับใช้ (Skogsavtalet)",
    "Строки попередження регулюються відповідно до Закону Швеції про захист зайнятості (LAS) та чинних колективних договорів (Skogsavtalet)."
  ),

  // §7
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

  // §8
  s8_title: L("Salary Details", "Löneuppgifter", "Detalii salariu", "รายละเอียดเงินเดือน", "Деталі заробітної плати"),
  overtimeClause: L(
    "Only ordered overtime will be compensated with overtime pay.",
    "Endast beordrad övertid ersätts med övertidsersättning.",
    "Doar orele suplimentare dispuse vor fi compensate cu plata orelor suplimentare.",
    "เฉพาะการทำงานล่วงเวลาที่ได้รับคำสั่งเท่านั้นที่จะได้รับค่าชดเชยการทำงานล่วงเวลา",
    "Лише замовлені понаднормові години компенсуються оплатою за понаднормову роботу."
  ),
  pieceWorkPay: L("Piece Work Pay", "Ackordslön", "Plata în acord", "ค่าจ้างตามชิ้นงาน", "Відрядна оплата"),
  otherBenefits: L("Other Benefits", "Övriga Förmåner", "Alte beneficii", "สวัสดิการอื่นๆ", "Інші пільги"),
  paymentMethod: L("Payment Method", "Utbetalningssätt", "Metoda de plată", "วิธีการชำระเงิน", "Спосіб оплати"),
  bankAccount: L("Bank Account", "Bankkonto", "Cont bancar", "บัญชีธนาคาร", "Банківський рахунок"),
  cash: L("Cash", "Kontant", "Numerar", "เงินสด", "Готівка"),

  // §9
  s9_title: L("Mandatory Training", "Obligatorisk Utbildning", "Instruire obligatorie", "การฝึกอบรมภาคบังคับ", "Обов'язкове навчання"),
  s9_intro: L(
    "The following training programs are mandatory for the employee before commencing work.",
    "Följande utbildningsprogram är obligatoriska för arbetstagaren innan arbetet påbörjas.",
    "Următoarele programe de instruire sunt obligatorii pentru angajat înainte de începerea activității.",
    "โปรแกรมการฝึกอบรมต่อไปนี้เป็นภาคบังคับสำหรับลูกจ้างก่อนเริ่มงาน",
    "Наступні програми навчання є обов'язковими для працівника перед початком роботи."
  ),
  mandatory: L("MANDATORY", "OBLIGATORISK", "OBLIGATORIU", "ภาคบังคับ", "ОБОВ'ЯЗКОВО"),
  other: L("Other", "Annat", "Altele", "อื่นๆ", "Інше"),
  noTraining: L(
    "No mandatory training programs selected.",
    "Inga obligatoriska utbildningsprogram valda.",
    "Nu au fost selectate programe de instruire obligatorie.",
    "ไม่มีโปรแกรมฝึกอบรมภาคบังคับที่เลือก",
    "Обов'язкові навчальні програми не вибрано."
  ),

  // §10
  s10_title: L("Social Security", "Social Trygghet", "Securitate socială", "ประกันสังคม", "Соціальне забезпечення"),
  s10_text: L(
    "Social security contributions and insurance are provided in accordance with Swedish law and applicable collective agreements. The employer shall ensure that the employee is covered by:",
    "Sociala avgifter och försäkringar tillhandahålls i enlighet med svensk lag och tillämpliga kollektivavtal. Arbetsgivaren ska säkerställa att arbetstagaren omfattas av:",
    "Contribuțiile și asigurările sociale sunt furnizate în conformitate cu legislația suedeză și acordurile colective aplicabile. Angajatorul se asigură că angajatul este acoperit de:",
    "เงินสมทบประกันสังคมและการประกันภัยจัดให้ตามกฎหมายสวีเดนและข้อตกลงร่วมที่บังคับใช้ นายจ้างต้องมั่นใจว่าลูกจ้างได้รับความคุ้มครองจาก:",
    "Внески на соціальне забезпечення та страхування надаються відповідно до законодавства Швеції та чинних колективних договорів. Роботодавець зобов'язаний забезпечити працівникові:"
  ),
  s10_pension: L("Occupational pension (Tjänstepension) as per Skogsavtalet", "Tjänstepension enligt Skogsavtalet", "Pensie ocupațională (Tjänstepension) conform Skogsavtalet", "บำนาญอาชีพ (Tjänstepension) ตาม Skogsavtalet", "Професійна пенсія (Tjänstepension) згідно з Skogsavtalet"),
  s10_tgl: L("Occupational group life insurance (TGL)", "Tjänstegrupplivförsäkring (TGL)", "Asigurare de viață de grup (TGL)", "ประกันชีวิตกลุ่มอาชีพ (TGL)", "Групове страхування життя (TGL)"),
  s10_tfa: L("Occupational injury insurance (TFA)", "Trygghetsförsäkring vid arbetsskada (TFA)", "Asigurare pentru accidente de muncă (TFA)", "ประกันอุบัติเหตุจากการทำงาน (TFA)", "Страхування від виробничих травм (TFA)"),
  s10_ags: L("Severance pay insurance (AGS)", "Avtalsgruppsjukförsäkring (AGS)", "Asigurare de concediu medical (AGS)", "ประกันเงินชดเชย (AGS)", "Страхування вихідної допомоги (AGS)"),

  // §11
  s11_title: L("Miscellaneous", "Övrigt", "Diverse", "เบ็ดเตล็ด", "Різне"),
  noAdditionalTerms: L("No additional terms specified.", "Inga ytterligare villkor angivna.", "Nu au fost specificate condiții suplimentare.", "ไม่มีเงื่อนไขเพิ่มเติม", "Додаткових умов не зазначено."),

  // §12
  s12_title: L("Notes", "Anmärkningar", "Observații", "หมายเหตุ", "Примітки"),
  s12_note1: L(
    "This contract is governed by Swedish law and the collective agreement for the forestry sector (Skogsavtalet).",
    "Detta avtal regleras av svensk lag och kollektivavtalet för skogssektorn (Skogsavtalet).",
    "Acest contract este guvernat de legislația suedeză și acordul colectiv pentru sectorul forestier (Skogsavtalet).",
    "สัญญานี้อยู่ภายใต้กฎหมายสวีเดนและข้อตกลงร่วมสำหรับภาคป่าไม้ (Skogsavtalet)",
    "Цей договір регулюється законодавством Швеції та колективним договором для лісового сектору (Skogsavtalet)."
  ),
  s12_note2: L(
    "The employee is required to comply with workplace health and safety regulations (AFS).",
    "Arbetstagaren är skyldig att följa arbetsmiljöföreskrifter (AFS).",
    "Angajatul este obligat să respecte reglementările privind sănătatea și securitatea la locul de muncă (AFS).",
    "ลูกจ้างต้องปฏิบัติตามข้อบังคับด้านสุขภาพและความปลอดภัยในสถานที่ทำงาน (AFS)",
    "Працівник зобов'язаний дотримуватися правил охорони праці та безпеки на робочому місці (AFS)."
  ),
  s12_note3: L(
    "Any changes to this agreement must be confirmed in writing by both parties.",
    "Ändringar i detta avtal ska bekräftas skriftligen av båda parter.",
    "Orice modificare a acestui acord trebuie confirmată în scris de ambele părți.",
    "การเปลี่ยนแปลงใดๆ ในข้อตกลงนี้ต้องได้รับการยืนยันเป็นลายลักษณ์อักษรจากทั้งสองฝ่าย",
    "Будь-які зміни до цього договору повинні бути підтверджені письмово обома сторонами."
  ),
  s12_note4: L(
    "Dispute resolution deadlines are governed by LAS §§ 40-42.",
    "Frister för underrättelse och väckande av talan vid tvist om avslut av anställning finns i §§ LAS 40-42.",
    "Termenele de soluționare a litigiilor sunt reglementate de LAS §§ 40-42.",
    "กำหนดเวลาการระงับข้อพิพาทเป็นไปตาม LAS §§ 40-42",
    "Строки вирішення спорів регулюються LAS §§ 40-42."
  ),
  s12_note5: L(
    "Rules for notice, information and the obligation to negotiate are set out in MBL §§ 11-14.",
    "Regler för varsel, information och förhandlingsskyldighet finns i §§ MBL 11-14.",
    "Regulile privind notificarea, informarea și obligația de negociere sunt stabilite în MBL §§ 11-14.",
    "กฎเกณฑ์การแจ้งเตือน ข้อมูล และภาระผูกพันในการเจรจาระบุไว้ใน MBL §§ 11-14",
    "Правила щодо повідомлення, інформації та обов'язку вести переговори викладені в MBL §§ 11-14."
  ),

  // §13
  s13_title: L("Net Salary Deductions", "Nettolöneavdrag", "Deduceri din salariul net", "การหักเงินเดือนสุทธิ", "Утримання із чистої заробітної плати"),
  type: L("Type", "Typ", "Tip", "ประเภท", "Тип"),
  amount: L("Amount", "Belopp", "Sumă", "จำนวนเงิน", "Сума"),
  frequency: L("Frequency", "Frekvens", "Frecvență", "ความถี่", "Частота"),
  note: L("Note", "Anteckning", "Notă", "หมายเหตุ", "Примітка"),

  // Frequency labels
  freq_monthly: L("Monthly", "Månadsvis", "Lunar", "รายเดือน", "Щомісячно"),
  freq_weekly: L("Weekly", "Veckovis", "Săptămânal", "รายสัปดาห์", "Щотижня"),
  freq_oneTime: L("One-time", "Engångs", "O singură dată", "ครั้งเดียว", "Одноразово"),
  freq_perKm: L("Per km", "Per km", "Pe km", "ต่อกิโลเมตร", "За км"),

  // Deduction types
  ded_rent: L("Rent / Accommodation", "Hyra / Boende", "Chirie / Cazare", "ค่าเช่า / ที่พัก", "Оренда / Проживання"),
  ded_car: L("Company Car Usage", "Tjänstebil", "Utilizare mașină de serviciu", "การใช้รถบริษัท", "Користування службовим автомобілем"),
  ded_travel: L("Travel Costs", "Resekostnader", "Costuri de deplasare", "ค่าเดินทาง", "Витрати на проїзд"),
  ded_immigration: L("Immigration Process Fees", "Migrationsverkets avgifter", "Taxe de imigrare", "ค่าธรรมเนียมกระบวนการตรวจคนเข้าเมือง", "Витрати на імміграційний процес"),
  ded_other: L("Other Deduction", "Annat avdrag", "Altă deducere", "การหักอื่นๆ", "Інше утримання"),

  // Signatures
  signatures: L("Signatures", "Underskrifter", "Semnături", "ลายเซ็น", "Підписи"),
  sigIntro: L(
    "This contract has been drawn up in two identical copies, of which each party has received one.",
    "Detta avtal har upprättats i två likalydande exemplar, varav parterna tagit var sitt.",
    "Acest contract a fost întocmit în două exemplare identice, fiecare parte primind câte unul.",
    "สัญญานี้จัดทำขึ้นเป็นสองฉบับเหมือนกัน ซึ่งแต่ละฝ่ายได้รับฉบับละหนึ่งฉบับ",
    "Цей договір складено у двох ідентичних примірниках, кожна сторона отримала по одному."
  ),
  placeAndDate: L("Place and date", "Plats och datum", "Locul și data", "สถานที่และวันที่", "Місце і дата"),
  company: L("Company", "Företag", "Compania", "บริษัท", "Компанія"),
  employerSignature: L("Employer's signature", "Arbetsgivarens underskrift", "Semnătura angajatorului", "ลายเซ็นนายจ้าง", "Підпис роботодавця"),
  employee: L("Employee", "Arbetstagare", "Angajat", "ลูกจ้าง", "Працівник"),
  employeeSignature: L("Employee's signature", "Arbetstagarens underskrift", "Semnătura angajatului", "ลายเซ็นลูกจ้าง", "Підпис працівника"),
  signed: L("Signed", "Undertecknad", "Semnat", "ลงนามแล้ว", "Підписано"),

  // Appendices
  appendixCoC: L("Appendix A — Code of Conduct", "Bilaga A — Uppförandekod", "Anexa A — Codul de conduită", "ภาคผนวก ก — จรรยาบรรณ", "Додаток А — Кодекс поведінки"),
  appendixSchedule: L("Appendix B — Work Schedule", "Bilaga B — Arbetsschema", "Anexa B — Programul de lucru", "ภาคผนวก ข — ตารางการทำงาน", "Додаток Б — Графік роботи"),
  scheduleDate: L("Date", "Datum", "Data", "วันที่", "Дата"),
  scheduleDayType: L("Day Type", "Dagtyp", "Tip zi", "ประเภทวัน", "Тип дня"),
  scheduleHours: L("Hours", "Timmar", "Ore", "ชั่วโมง", "Години"),
  scheduleStart: L("Start", "Början", "Început", "เริ่ม", "Початок"),
  scheduleEnd: L("End", "Slut", "Sfârșit", "สิ้นสุด", "Кінець"),
  scheduleHoliday: L("Holiday", "Helgdag", "Sărbătoare", "วันหยุด", "Свято"),
  noSchedule: L("No schedule data available.", "Ingen schemadata tillgänglig.", "Nu sunt disponibile date privind programul.", "ไม่มีข้อมูลตารางงาน", "Дані розкладу відсутні."),

  // Day type values
  dayTypeWorkday: L("Workday", "Arbetsdag", "Zi lucrătoare", "วันทำงาน", "Робочий день"),
  dayTypeWeekend: L("Weekend", "Helg", "Weekend", "วันหยุดสุดสัปดาห์", "Вихідний"),
  dayTypeHoliday: L("Holiday", "Helgdag", "Sărbătoare", "วันหยุด", "Свято"),
  dayTypeVacation: L("Vacation", "Semester", "Vacanță", "วันลาพักร้อน", "Відпустка"),
  dayTypeOffSeason: L("Off-season", "Lågsäsong", "Extrasezon", "นอกฤดูกาล", "Міжсезоння"),
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
    case "UK/SE":
      return `${label.uk} / ${label.sv}`;
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
    case "UK/SE":
      return label.uk;
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

const DAY_TYPE_MAP: Record<string, LabelSet> = {
  Workday: CONTRACT_LABELS.dayTypeWorkday,
  Weekend: CONTRACT_LABELS.dayTypeWeekend,
  Holiday: CONTRACT_LABELS.dayTypeHoliday,
  Vacation: CONTRACT_LABELS.dayTypeVacation,
  "Off-season": CONTRACT_LABELS.dayTypeOffSeason,
};

/** Translate a day_type DB value (e.g. "Weekend") into a bilingual label */
export function translateDayType(dayType: string, lang: LangCode): string {
  const label = DAY_TYPE_MAP[dayType];
  if (!label) return dayType;
  return bilingualLabel(label, lang);
}

// ── Experience Level shared data ──

export const EXPERIENCE_LEVELS_BASE = [
  { en: "Entry Level", sv: "Nybörjare", ro: "Începător", th: "ระดับเริ่มต้น", uk: "Початківець", detail_en: "0 years / < 1 season", detail_sv: "0 år / < 1 säsong" },
  { en: "Junior", sv: "Junior", ro: "Junior", th: "จูเนียร์", uk: "Молодший", detail_en: "1 year / 1 season", detail_sv: "1 år / 1 säsong" },
  { en: "Experienced", sv: "Erfaren", ro: "Experimentat", th: "มีประสบการณ์", uk: "Досвідчений", detail_en: "2 years / seasons", detail_sv: "2 år / säsonger" },
  { en: "Senior", sv: "Senior", ro: "Senior", th: "อาวุโส", uk: "Старший", detail_en: "3 years / seasons", detail_sv: "3 år / säsonger" },
  { en: "Expert", sv: "Expert", ro: "Expert", th: "ผู้เชี่ยวชาญ", uk: "Експерт", detail_en: "4+ years / seasons", detail_sv: "4+ år / säsonger" },
];

export function getExperienceLevelLabel(value: string, lang: string): string {
  const base = EXPERIENCE_LEVELS_BASE.find(
    (l) => `${l.en} / ${l.sv} (${l.detail_en} / ${l.detail_sv})` === value
  );
  if (!base) return value;
  switch (lang) {
    case "SE":
      return `${base.sv} (${base.detail_sv})`;
    case "RO/SE":
      return `${base.ro} / ${base.sv} (${base.detail_en} / ${base.detail_sv})`;
    case "TH/SE":
      return `${base.th} / ${base.sv} (${base.detail_en} / ${base.detail_sv})`;
    case "UK/SE":
      return `${base.uk} / ${base.sv} (${base.detail_en} / ${base.detail_sv})`;
    case "EN/SE":
    default:
      return value;
  }
}

export type { LabelSet, LangCode };
