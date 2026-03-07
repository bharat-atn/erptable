/**
 * Inline Code of Conduct viewer — renders CoC content as scrollable HTML
 * so it works on mobile without PDF download issues.
 */

interface CodeOfConductViewerProps {
  language: string;
}

const COC_EN = {
  title: "Code of Conduct",
  sections: [
    {
      heading: "1. Purpose",
      body: "This Code of Conduct sets out the ethical standards and professional behavior expected of all employees. It ensures a safe, respectful, and productive working environment in compliance with Swedish labor law and international human rights standards.",
    },
    {
      heading: "2. Scope",
      body: "This Code applies to all employees, contractors, and temporary workers engaged by the company, regardless of location, role, or duration of employment.",
    },
    {
      heading: "3. Workplace Safety",
      body: "All employees must follow safety regulations and use required protective equipment at all times. Report any unsafe conditions, accidents, or near-misses to your supervisor immediately. Never operate machinery or equipment without proper training and authorization. The use of alcohol or drugs during work hours is strictly prohibited.",
    },
    {
      heading: "4. Respect and Non-Discrimination",
      body: "We are committed to a workplace free from discrimination, harassment, and bullying. Every person shall be treated with dignity and respect regardless of gender, age, ethnicity, religion, sexual orientation, disability, or national origin. Harassment of any kind — verbal, physical, or digital — will not be tolerated and may result in immediate termination.",
    },
    {
      heading: "5. Working Hours and Rest",
      body: "Employees must adhere to the agreed working hours and rest periods as stipulated in their employment contract and applicable collective agreements. Overtime must be pre-approved by a supervisor. Adequate rest between shifts is mandatory for health and safety.",
    },
    {
      heading: "6. Environmental Responsibility",
      body: "All employees shall minimize environmental impact in their daily work. Follow waste management and recycling procedures. Report any environmental incidents, spills, or breaches immediately. Sustainable practices are a shared responsibility.",
    },
    {
      heading: "7. Confidentiality",
      body: "Employees must not disclose confidential company information, trade secrets, or personal data of colleagues or clients to unauthorized parties. This obligation continues after the end of employment. Breaches of confidentiality may result in legal action.",
    },
    {
      heading: "8. Anti-Corruption and Gifts",
      body: "Bribery and corruption are strictly prohibited. Employees must not offer, give, or accept gifts, hospitality, or payments that could influence business decisions or create a conflict of interest. Any offers of this nature must be reported to management.",
    },
    {
      heading: "9. Use of Company Property",
      body: "Company equipment, vehicles, and resources shall be used responsibly and only for authorized purposes. Theft, misuse, or negligent damage to company property may result in disciplinary action and liability for damages.",
    },
    {
      heading: "10. Reporting and Whistleblowing",
      body: "Employees are encouraged to report violations of this Code of Conduct without fear of retaliation. Reports can be made to your supervisor, HR, or through the company's whistleblowing channel. All reports will be investigated confidentially.",
    },
    {
      heading: "11. Consequences of Violations",
      body: "Violations of this Code may result in disciplinary measures including verbal or written warnings, suspension, termination of employment, or legal proceedings depending on the severity of the breach.",
    },
    {
      heading: "12. Acknowledgment",
      body: "By signing the employment contract, the employee confirms that they have read, understood, and agree to comply with this Code of Conduct throughout their employment.",
    },
  ],
};

const COC_SV = {
  title: "Uppförandekod",
  sections: [
    {
      heading: "1. Syfte",
      body: "Denna uppförandekod fastställer de etiska standarder och det professionella beteende som förväntas av alla anställda. Den säkerställer en säker, respektfull och produktiv arbetsmiljö i enlighet med svensk arbetsrätt och internationella mänskliga rättigheter.",
    },
    {
      heading: "2. Omfattning",
      body: "Denna kod gäller alla anställda, entreprenörer och tillfälligt anställda som är engagerade av företaget, oavsett plats, roll eller anställningens längd.",
    },
    {
      heading: "3. Arbetsmiljösäkerhet",
      body: "Alla anställda ska följa säkerhetsföreskrifter och använda erforderlig skyddsutrustning vid alla tillfällen. Rapportera eventuella osäkra förhållanden, olyckor eller tillbud till din arbetsledare omedelbart. Använd aldrig maskiner eller utrustning utan korrekt utbildning och tillstånd. Användning av alkohol eller droger under arbetstid är strängt förbjudet.",
    },
    {
      heading: "4. Respekt och icke-diskriminering",
      body: "Vi är engagerade i en arbetsplats fri från diskriminering, trakasserier och mobbning. Varje person ska behandlas med värdighet och respekt oavsett kön, ålder, etnicitet, religion, sexuell läggning, funktionsnedsättning eller nationellt ursprung. Trakasserier av något slag — verbala, fysiska eller digitala — tolereras inte och kan leda till omedelbar uppsägning.",
    },
    {
      heading: "5. Arbetstid och vila",
      body: "Anställda ska följa den överenskomna arbetstiden och viloperioderna enligt anställningsavtalet och tillämpliga kollektivavtal. Övertid ska godkännas i förväg av en arbetsledare. Tillräcklig vila mellan skift är obligatorisk för hälsa och säkerhet.",
    },
    {
      heading: "6. Miljöansvar",
      body: "Alla anställda ska minimera miljöpåverkan i sitt dagliga arbete. Följ rutiner för avfallshantering och återvinning. Rapportera eventuella miljöincidenter, utsläpp eller överträdelser omedelbart. Hållbara metoder är ett delat ansvar.",
    },
    {
      heading: "7. Sekretess",
      body: "Anställda får inte avslöja konfidentiell företagsinformation, företagshemligheter eller personuppgifter om kollegor eller kunder till obehöriga parter. Denna skyldighet gäller även efter anställningens upphörande. Brott mot sekretessen kan leda till rättsliga åtgärder.",
    },
    {
      heading: "8. Antikorruption och gåvor",
      body: "Mutor och korruption är strängt förbjudet. Anställda får inte erbjuda, ge eller ta emot gåvor, gästfrihet eller betalningar som kan påverka affärsbeslut eller skapa intressekonflikter. Alla sådana erbjudanden ska rapporteras till ledningen.",
    },
    {
      heading: "9. Användning av företagsegendom",
      body: "Företagets utrustning, fordon och resurser ska användas ansvarsfullt och endast för auktoriserade ändamål. Stöld, missbruk eller oaktsam skada på företagsegendom kan leda till disciplinära åtgärder och skadeståndsskyldighet.",
    },
    {
      heading: "10. Rapportering och visselblåsning",
      body: "Anställda uppmuntras att rapportera överträdelser av denna uppförandekod utan rädsla för repressalier. Rapporter kan göras till din arbetsledare, HR eller genom företagets visselblåsarkanal. Alla rapporter utreds konfidentiellt.",
    },
    {
      heading: "11. Konsekvenser vid överträdelser",
      body: "Överträdelser av denna kod kan leda till disciplinära åtgärder inklusive muntlig eller skriftlig varning, avstängning, uppsägning eller rättsliga förfaranden beroende på överträdelsens allvar.",
    },
    {
      heading: "12. Bekräftelse",
      body: "Genom att underteckna anställningsavtalet bekräftar den anställde att hen har läst, förstått och samtycker till att följa denna uppförandekod under hela anställningen.",
    },
  ],
};

const COC_RO = {
  title: "Codul de conduită",
  sections: [
    { heading: "1. Scop", body: "Acest Cod de conduită stabilește standardele etice și comportamentul profesional așteptat de la toți angajații. Acesta asigură un mediu de lucru sigur, respectuos și productiv, în conformitate cu legislația muncii din Suedia și standardele internaționale ale drepturilor omului." },
    { heading: "2. Domeniu de aplicare", body: "Acest Cod se aplică tuturor angajaților, contractorilor și lucrătorilor temporari angajați de companie, indiferent de locație, rol sau durata angajării." },
    { heading: "3. Siguranța la locul de muncă", body: "Toți angajații trebuie să respecte regulamentele de siguranță și să utilizeze echipamentul de protecție necesar în orice moment. Raportați imediat supervizorului orice condiții nesigure, accidente sau incidente. Nu operați niciodată mașini sau echipamente fără instruire și autorizare corespunzătoare. Utilizarea alcoolului sau a drogurilor în timpul programului de lucru este strict interzisă." },
    { heading: "4. Respect și non-discriminare", body: "Ne angajăm pentru un loc de muncă liber de discriminare, hărțuire și intimidare. Fiecare persoană va fi tratată cu demnitate și respect, indiferent de sex, vârstă, etnie, religie, orientare sexuală, dizabilitate sau origine națională. Hărțuirea de orice fel — verbală, fizică sau digitală — nu va fi tolerată și poate duce la încetarea imediată a contractului." },
    { heading: "5. Programul de lucru și odihna", body: "Angajații trebuie să respecte programul de lucru și perioadele de odihnă convenite conform contractului de muncă și acordurilor colective aplicabile. Orele suplimentare trebuie aprobate în prealabil de un supervizor. Odihna adecvată între schimburi este obligatorie pentru sănătate și siguranță." },
    { heading: "6. Responsabilitatea față de mediu", body: "Toți angajații vor minimiza impactul asupra mediului în activitatea lor zilnică. Respectați procedurile de gestionare a deșeurilor și reciclare. Raportați imediat orice incidente de mediu, deversări sau încălcări. Practicile durabile sunt o responsabilitate comună." },
    { heading: "7. Confidențialitate", body: "Angajații nu trebuie să divulge informații confidențiale ale companiei, secrete comerciale sau date personale ale colegilor sau clienților către părți neautorizate. Această obligație continuă și după încheierea raportului de muncă. Încălcarea confidențialității poate duce la acțiuni legale." },
    { heading: "8. Anticorupție și cadouri", body: "Mita și corupția sunt strict interzise. Angajații nu trebuie să ofere, să dea sau să accepte cadouri, ospitalitate sau plăți care ar putea influența deciziile de afaceri sau crea un conflict de interese. Orice oferte de acest tip trebuie raportate conducerii." },
    { heading: "9. Utilizarea proprietății companiei", body: "Echipamentele, vehiculele și resursele companiei vor fi utilizate responsabil și numai în scopuri autorizate. Furtul, utilizarea necorespunzătoare sau deteriorarea din neglijență a proprietății companiei poate duce la măsuri disciplinare și răspundere pentru daune." },
    { heading: "10. Raportare și avertizare de integritate", body: "Angajații sunt încurajați să raporteze încălcările acestui Cod de conduită fără teama de represalii. Rapoartele pot fi făcute supervizorului, departamentului HR sau prin canalul de avertizare de integritate al companiei. Toate rapoartele vor fi investigate confidențial." },
    { heading: "11. Consecințele încălcărilor", body: "Încălcările acestui Cod pot duce la măsuri disciplinare, inclusiv avertisment verbal sau scris, suspendare, încetarea contractului de muncă sau proceduri legale, în funcție de gravitatea încălcării." },
    { heading: "12. Confirmare", body: "Prin semnarea contractului de muncă, angajatul confirmă că a citit, a înțeles și este de acord să respecte acest Cod de conduită pe toată durata angajării." },
  ],
};

const COC_TH = {
  title: "จรรยาบรรณ",
  sections: [
    { heading: "1. วัตถุประสงค์", body: "จรรยาบรรณฉบับนี้กำหนดมาตรฐานทางจริยธรรมและพฤติกรรมทางวิชาชีพที่คาดหวังจากพนักงานทุกคน เพื่อให้มั่นใจว่าสภาพแวดล้อมการทำงานมีความปลอดภัย เคารพซึ่งกันและกัน และมีประสิทธิภาพ สอดคล้องกับกฎหมายแรงงานของสวีเดนและมาตรฐานสิทธิมนุษยชนสากล" },
    { heading: "2. ขอบเขต", body: "จรรยาบรรณนี้ใช้กับพนักงาน ผู้รับเหมา และแรงงานชั่วคราวทุกคนที่ทำงานให้กับบริษัท โดยไม่คำนึงถึงสถานที่ ตำแหน่ง หรือระยะเวลาการจ้างงาน" },
    { heading: "3. ความปลอดภัยในสถานที่ทำงาน", body: "พนักงานทุกคนต้องปฏิบัติตามกฎระเบียบด้านความปลอดภัยและใช้อุปกรณ์ป้องกันที่จำเป็นตลอดเวลา รายงานสภาวะที่ไม่ปลอดภัย อุบัติเหตุ หรือเหตุการณ์เกือบเกิดอุบัติเหตุต่อหัวหน้างานทันที ห้ามใช้เครื่องจักรหรืออุปกรณ์โดยไม่ได้รับการฝึกอบรมและอนุญาตอย่างเหมาะสม ห้ามใช้แอลกอฮอล์หรือยาเสพติดในระหว่างเวลาทำงานอย่างเด็ดขาด" },
    { heading: "4. ความเคารพและไม่เลือกปฏิบัติ", body: "เรามุ่งมั่นที่จะสร้างสถานที่ทำงานที่ปราศจากการเลือกปฏิบัติ การล่วงละเมิด และการกลั่นแกล้ง ทุกคนจะได้รับการปฏิบัติด้วยศักดิ์ศรีและความเคารพ โดยไม่คำนึงถึงเพศ อายุ ชาติพันธุ์ ศาสนา เพศสัมพันธ์ ความพิการ หรือสัญชาติ การล่วงละเมิดทุกรูปแบบ ไม่ว่าจะเป็นวาจา กายภาพ หรือดิจิทัล จะไม่ได้รับการยอมรับและอาจส่งผลให้ถูกเลิกจ้างทันที" },
    { heading: "5. ชั่วโมงทำงานและการพักผ่อน", body: "พนักงานต้องปฏิบัติตามชั่วโมงทำงานและช่วงพักผ่อนที่ตกลงไว้ตามที่กำหนดในสัญญาจ้างงานและข้อตกลงร่วมที่ใช้บังคับ การทำงานล่วงเวลาต้องได้รับการอนุมัติล่วงหน้าจากหัวหน้างาน การพักผ่อนอย่างเพียงพอระหว่างกะเป็นข้อบังคับเพื่อสุขภาพและความปลอดภัย" },
    { heading: "6. ความรับผิดชอบต่อสิ่งแวดล้อม", body: "พนักงานทุกคนจะต้องลดผลกระทบต่อสิ่งแวดล้อมในการทำงานประจำวัน ปฏิบัติตามขั้นตอนการจัดการขยะและการรีไซเคิล รายงานเหตุการณ์ด้านสิ่งแวดล้อม การรั่วไหล หรือการละเมิดทันที การปฏิบัติอย่างยั่งยืนเป็นความรับผิดชอบร่วมกัน" },
    { heading: "7. การรักษาความลับ", body: "พนักงานต้องไม่เปิดเผยข้อมูลลับของบริษัท ความลับทางการค้า หรือข้อมูลส่วนบุคคลของเพื่อนร่วมงานหรือลูกค้าต่อบุคคลที่ไม่ได้รับอนุญาต ข้อผูกพันนี้ยังคงมีผลหลังจากสิ้นสุดการจ้างงาน การละเมิดความลับอาจส่งผลให้เกิดการดำเนินคดีทางกฎหมาย" },
    { heading: "8. การต่อต้านการทุจริตและของขวัญ", body: "การให้สินบนและการทุจริตเป็นสิ่งต้องห้ามอย่างเด็ดขาด พนักงานต้องไม่เสนอ ให้ หรือรับของขวัญ การต้อนรับ หรือการชำระเงินที่อาจส่งผลต่อการตัดสินใจทางธุรกิจหรือสร้างผลประโยชน์ทับซ้อน ข้อเสนอทุกประเภทต้องรายงานต่อฝ่ายบริหาร" },
    { heading: "9. การใช้ทรัพย์สินของบริษัท", body: "อุปกรณ์ ยานพาหนะ และทรัพยากรของบริษัทจะต้องใช้อย่างรับผิดชอบและเฉพาะเพื่อวัตถุประสงค์ที่ได้รับอนุญาตเท่านั้น การขโมย การใช้ในทางที่ผิด หรือความเสียหายจากความประมาทเลินเล่อต่อทรัพย์สินของบริษัทอาจส่งผลให้เกิดมาตรการทางวินัยและความรับผิดต่อความเสียหาย" },
    { heading: "10. การรายงานและการแจ้งเบาะแส", body: "พนักงานได้รับการสนับสนุนให้รายงานการละเมิดจรรยาบรรณนี้โดยไม่ต้องกลัวการตอบโต้ สามารถรายงานต่อหัวหน้างาน ฝ่ายทรัพยากรบุคคล หรือผ่านช่องทางแจ้งเบาะแสของบริษัท รายงานทั้งหมดจะได้รับการตรวจสอบอย่างเป็นความลับ" },
    { heading: "11. ผลของการละเมิด", body: "การละเมิดจรรยาบรรณนี้อาจส่งผลให้เกิดมาตรการทางวินัย รวมถึงการตักเตือนด้วยวาจาหรือลายลักษณ์อักษร การพักงาน การเลิกจ้าง หรือการดำเนินคดีทางกฎหมาย ขึ้นอยู่กับความรุนแรงของการละเมิด" },
    { heading: "12. การรับทราบ", body: "ด้วยการลงนามในสัญญาจ้างงาน พนักงานยืนยันว่าได้อ่าน เข้าใจ และตกลงที่จะปฏิบัติตามจรรยาบรรณนี้ตลอดระยะเวลาการจ้างงาน" },
  ],
};

const COC_UK = {
  title: "Кодекс поведінки",
  sections: [
    { heading: "1. Мета", body: "Цей Кодекс поведінки встановлює етичні стандарти та професійну поведінку, яких очікують від усіх працівників. Він забезпечує безпечне, шанобливе та продуктивне робоче середовище відповідно до трудового законодавства Швеції та міжнародних стандартів прав людини." },
    { heading: "2. Сфера застосування", body: "Цей Кодекс поширюється на всіх працівників, підрядників та тимчасових працівників, залучених компанією, незалежно від місця роботи, посади чи тривалості працевлаштування." },
    { heading: "3. Безпека на робочому місці", body: "Усі працівники повинні дотримуватися правил безпеки та використовувати необхідні засоби захисту в будь-який час. Негайно повідомляйте свого керівника про будь-які небезпечні умови, нещасні випадки або інциденти. Ніколи не працюйте з машинами чи обладнанням без належного навчання та дозволу. Вживання алкоголю або наркотиків під час робочого часу суворо заборонено." },
    { heading: "4. Повага та недискримінація", body: "Ми прагнемо забезпечити робоче місце, вільне від дискримінації, переслідувань та цькування. Кожна людина має право на гідне та шанобливе ставлення незалежно від статі, віку, етнічної приналежності, релігії, сексуальної орієнтації, інвалідності чи національного походження. Переслідування будь-якого виду — словесне, фізичне чи цифрове — не допускається і може призвести до негайного звільнення." },
    { heading: "5. Робочий час та відпочинок", body: "Працівники повинні дотримуватися узгодженого робочого часу та періодів відпочинку, визначених у трудовому договорі та чинних колективних угодах. Понаднормова робота повинна бути попередньо схвалена керівником. Належний відпочинок між змінами є обов'язковим для здоров'я та безпеки." },
    { heading: "6. Екологічна відповідальність", body: "Усі працівники повинні мінімізувати вплив на навколишнє середовище у своїй щоденній роботі. Дотримуйтесь процедур поводження з відходами та переробки. Негайно повідомляйте про будь-які екологічні інциденти, витоки або порушення. Сталі практики є спільною відповідальністю." },
    { heading: "7. Конфіденційність", body: "Працівники не повинні розголошувати конфіденційну інформацію компанії, комерційну таємницю або персональні дані колег чи клієнтів неуповноваженим особам. Це зобов'язання діє і після закінчення трудових відносин. Порушення конфіденційності може призвести до судового переслідування." },
    { heading: "8. Боротьба з корупцією та подарунки", body: "Хабарництво та корупція суворо заборонені. Працівники не повинні пропонувати, давати або приймати подарунки, гостинність або платежі, які можуть вплинути на бізнес-рішення або створити конфлікт інтересів. Про будь-які такі пропозиції необхідно повідомляти керівництву." },
    { heading: "9. Використання майна компанії", body: "Обладнання, транспортні засоби та ресурси компанії повинні використовуватися відповідально і лише для дозволених цілей. Крадіжка, зловживання або недбала шкода майну компанії може призвести до дисциплінарних заходів та відповідальності за збитки." },
    { heading: "10. Звітування та інформування про порушення", body: "Працівників заохочують повідомляти про порушення цього Кодексу поведінки без побоювання помсти. Повідомлення можна подавати керівнику, у відділ кадрів або через канал інформування про порушення компанії. Усі повідомлення розглядаються конфіденційно." },
    { heading: "11. Наслідки порушень", body: "Порушення цього Кодексу може призвести до дисциплінарних заходів, включаючи усне або письмове попередження, відсторонення, розірвання трудового договору або судове переслідування залежно від тяжкості порушення." },
    { heading: "12. Підтвердження", body: "Підписуючи трудовий договір, працівник підтверджує, що прочитав, зрозумів і зобов'язується дотримуватися цього Кодексу поведінки протягом усього терміну працевлаштування." },
  ],
};

const COC_MAP: Record<string, { title: string; sections: { heading: string; body: string }[] }> = {
  en: COC_EN,
  sv: COC_SV,
  ro: COC_RO,
  th: COC_TH,
  uk: COC_UK,
};

export function CodeOfConductViewer({ language }: CodeOfConductViewerProps) {
  const coc = COC_MAP[language] || COC_EN;

  return (
    <div className="rounded-lg border border-border overflow-hidden bg-background max-h-[500px] overflow-y-auto">
      <div className="p-4 sm:p-6 space-y-4">
        <h2 className="text-lg font-bold text-center border-b border-border pb-3">
          {coc.title}
        </h2>
        {coc.sections.map((section, i) => (
          <div key={i} className="space-y-1">
            <h3 className="text-sm font-semibold text-foreground">{section.heading}</h3>
            <p className="text-sm text-foreground/80 leading-relaxed">{section.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
