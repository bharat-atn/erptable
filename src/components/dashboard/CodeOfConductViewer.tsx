/**
 * Inline Code of Conduct viewer — renders CoC content as scrollable HTML
 * so it works on mobile without PDF download issues.
 *
 * Content source: Ljungan Skogsvård AB company Code of Conduct (6 pages).
 */

interface CodeOfConductViewerProps {
  language: string;
}

/* ───────────────────── SWEDISH (source of truth) ───────────────────── */
const COC_SV = {
  title: "Arbetarskydds normer och ordningsregler – Ljungan Skogsvård AB",
  sections: [
    {
      heading: "",
      body: "Bästa medarbetare,\n\nVi ber dig vänligen att granska och fullt ut följa följande säkerhetsstandarder och regler under arbetstid för att säkerställa att vår verksamhet bedrivs under säkra och effektiva förhållanden. Dessa standarder är avgörande för att skydda din hälsa och upprätthålla en ordnad och säker arbetsmiljö.",
    },
    {
      heading: "Arbetskrav",
      body: "• Plantering, röjning med röjsåg och motorsågar samt andra aktiviteter får endast påbörjas efter att du har klarat proven på Skötselskolan och undertecknat alla nödvändiga dokument, inklusive anställningsavtal och andra relevanta formulär.\n• För att börja arbeta måste du som anställd klara proven på Skötselskolan för sektorerna \"Plantering\", \"Röjning och för röjning\" och \"Miljöhänsyn grunder\", samt \"Att vara anställd\", hos företag som SCA, Sveaskog, Holmen, Södra och andra företag vi samarbetar med.",
    },
    {
      heading: "Hälsovård och ersättning",
      body: "• Alla anställda har rätt till hälsovård enligt svensk lag och standarder. De har också rätt till ersättning enligt tillämplig svensk lagstiftning.\n• Enligt svenska normer krävs en minimiavgift på 300–1000 SEK för att besöka en vårdcentral (akuten eller annan enhet). Denna avgift betalas privat, medan ytterligare kostnader täcks av Försäkringskassan.",
    },
    {
      heading: "Personlig skyddsutrustning (PSU)",
      body: "• Det är obligatoriskt att bära den skyddsutrustning som företaget tillhandahåller, inklusive kängor, reflexvästar eller jackor, hjälmar, handskar och första hjälpen-kit. Att inte bära denna utrustning sker på egen risk, och vid en olycka är den anställde direkt ansvarig.",
    },
    {
      heading: "Säkerhet under arbete",
      body: "• Vid arbete med röjsågar måste ett minsta avstånd på 15 meter från kollegor upprätthållas.\n• Det är förbjudet att hantera grenar eller stockar som fastnat mellan bladet och klingskyddet medan röjsågen är i gång.\n• Det är förbjudet att ta bort klingskyddet från röjsågens klinga.",
    },
    {
      heading: "Körregler",
      body: "• Körning på skogsvägar ska ske med en hastighet som anpassas till vägförhållandena men bör inte överstiga 50 km/h om inga specifika hastighetsbegränsningar gäller.\n• Körning på allmänna vägar och skogsvägar måste ske försiktigt och i enlighet med svenska trafikregler. Bilbältesanvändning är obligatoriskt för alla passagerare. Säker och ansvarsfull körning är både en juridisk och moralisk skyldighet.\n• Gruppledaren är ansvarig för att bilnyckeln förvaras säkert och att ingen kollega som är berusad eller saknar giltigt körkort har tillgång till bilnyckeln.",
    },
    {
      heading: "Förbjudna substanser",
      body: "• Konsumtion av alkohol, droger eller hallucinogena substanser är förbjudet på arbetsplatsen eller under resor till och från jobbet.",
    },
    {
      heading: "Avfallshantering",
      body: "• Lämna inte skräp efter dig; det måste kastas i sopkärl och sorteras korrekt.\n• Stöld eller rotande i sopor är förbjudet. All aktivitet som skadar företagets anseende kommer att resultera i löneavdrag och uppsägning.",
    },
    {
      heading: "Bränsleförvaring",
      body: "• Bränslebehållare (ASPEN) måste förvaras på utsedda platser, inte i skogen eller i boendelokaler.",
    },
    {
      heading: "Boendelokaler",
      body: "• Boendelokaler måste hållas rena, och hushållsavfall måste sorteras.\n• Rökning i skogsområden är förbjudet, och rökande anställda måste vara medvetna om säkerhetsåtgärder. Rökning får endast ske på väg eller vändplan och alla fimpar samlas upp i en burk. Öppna eldar är endast tillåtna under förhållanden som anges i skogsvårdsstandarder.",
    },
    {
      heading: "Arbetstider",
      body: "• Arbetstiderna är från 06:30 till 17:00, måndag till fredag, 8 timmar per dag, 40 timmar per vecka. Anställda behöver inte arbeta mer än 8 timmar per dag, och eventuell övertid måste rapporteras dagligen/månadsvis.\n• Anställda garanteras en grundlön enligt avtalet med GS facket, förutsatt att de följer standarder och arbetstider samt uppfyller svenska kvalitets- och prestandakrav per timme.",
    },
    {
      heading: "Kvalitetsstandarder",
      body: "• Den undervisning om kvalitetsstandarder som ges av arbetsgivaren och kontaktpersonerna för varje bestånd måste följas strikt, och eventuella avvikelser kan resultera i löneavdrag baserat på kundens utvärdering.\n• Om kvalitetsstandarder inte uppfylls kommer den anställdes ersättning att suspenderas tills arbetet är korrigerat (om möjligt) eller tills den anställde betalar nödvändig ersättning. Exempel inkluderar betalning för torra eller kasserade plantor på grund av bristande plantvård, eller ersättning för skador orsakade av brand eller annan avsiktlig skada av den anställde.",
    },
    {
      heading: "Planteringsinstruktioner",
      body: "• Plantering måste ske enligt instruktioner; fel kommer att bestraffas och debiteras.\n• Det är förbjudet att plantera torra plantor; anställda är ansvariga för att vattna dem.\n• Kartonglådor måste återvinnas, och plastlådor måste förvaras korrekt.\n• Om plantor levereras i kartonglådor eller plastlådor är de anställda ansvariga för att kartonglådor samlas in och transporteras till återvinningscentral eller annan anvisad plats, medan plastlådor måste placeras på pallar och omsorgsfullt ompaketeras.",
    },
    {
      heading: "Boende",
      body: "• En koja finns tillgänglig för alla anställda, och de kan välja att använda den eller inte.\n• Det är förbjudet att lämna mat, kläder, hushållssopor eller andra personliga eller företagsägda föremål i hyrda boenden efter att det har lämnats av de anställda.",
    },
    {
      heading: "Kommunikation och rapportering",
      body: "• Alla osäkerheter måste kommuniceras, och eventuella problem måste rapporteras till koordinatorerna.\n• Om du är osäker på hur du ska hantera eller plantera ett bestånd måste du kontakta en koordinator så snart som möjligt.\n• Om du märker något misstänkt i ett bestånd måste du omedelbart informera koordinatorerna.",
    },
    {
      heading: "Uppsägning av anställning",
      body: "• Om ett team eller en teammedlem vill avsluta sitt samarbete med Ljungan Skogsvård AB måste följande följas:\n  A. Om den anställde har arbetat för Ljungan Skogsvård AB i ett (1) år eller mer måste företagsledningen meddelas minst 1 månad i förväg.\n  B. Om den anställde är ny hos Ljungan Skogsvård AB måste företagsledningen meddelas minst 3 veckor i förväg.\n• Om dessa tidsfrister inte följs kommer den sista månadens lön att hållas kvar.\n• Slutet på arbetssäsongen måste planeras med företagsledningen men får inte inträffa förrän kontrakterat arbete är slutfört eller väderförhållanden inte tillåter att verksamheten bedrivs under optimala och säkra förhållanden. Underlåtenhet att följa dessa tidsfrister bestraffas med kvarhållande av lön för den sista månaden.",
    },
    {
      heading: "Förbjudna aktiviteter",
      body: "• All aktivitet som anses vara farlig och potentiellt riskerar den anställdes liv och hälsa får inte utföras. Säkerhet och hälsa är prioritet i verksamheten, följt av produktivitet.\n• Alla incidenter som orsakar stress eller obehag måste rapporteras skriftligt omedelbart för att vidta nödvändiga åtgärder.",
    },
    {
      heading: "Utrustning och underhåll",
      body: "• Utrustning som tillhandahålls måste underhållas i funktionellt skick och rengöras/underhållas varje vecka.",
    },
    {
      heading: "Arbetsmiljö",
      body: "• Att upprätthålla en positiv atmosfär och trevlig arbetsmiljö är varje anställds ansvar. Vid personliga problem måste den anställde kontakta koordinatorn för att vidta nödvändiga åtgärder.",
    },
    {
      heading: "Bränslehantering",
      body: "• Anställda får inte transportera bensin, ASPEN eller andra bränslen i icke-godkända behållare enligt PEFC-standarder. Transport av bränsle från fordonet till arbetsplatsen får endast ske med godkända behållare, och att fästa eller binda dessa till sele är förbjudet. Underlåtenhet att följa dessa regler sker på eget ansvar och den anställde blir ansvarig för eventuella olyckor.",
    },
    {
      heading: "Kemikaliehantering",
      body: "• Anställda måste följa regler för kemikaliehantering. Det är förbjudet att konsumera, missköta eller applicera kemikalier som bensin, ASPEN, diesel eller olja på kroppen.",
    },
    {
      heading: "Fordonssäkerhet",
      body: "• Om föraren av servicefordonet eller teammedlemmar märker att fordonet är i dåligt skick och riskerar liv och hälsa för teammedlemmar eller andra trafikanter måste de informera koordinatorerna.",
    },
    {
      heading: "Kartor och nödprocedurer",
      body: "• Anställda måste bära en karta med instruktioner för det bestånd de arbetar i, och gruppledaren måste känna till nödkoordinaterna på varje karta, markerade i rött. Kartan kan vara fysisk (på papper) eller elektronisk (nedladdad på telefon/platta).\n• Vid nödsituationer måste anställda ringa 112 och ange nödkoordinaterna på kartan, som indikerar platsen där hjälp kan nå fram.",
    },
    {
      heading: "Diskriminering och sekretess",
      body: "• Diskriminering baserad på ras, kön eller religion är förbjudet, både på arbetsplatsen och i samhället.\n• Det är förbjudet att förtala Ljungan Skogsvård AB elakt, dela hemligheter eller avslöja konfidentiell information. Om dessa regler inte följs kommer det att resultera i påföljder, inklusive löneavdrag och ersättningskrav från Ljungan Skogsvård AB.",
    },
    {
      heading: "Användning av företagsfordon",
      body: "• Det är förbjudet att använda företagsfordon för personliga ändamål. De får endast användas för aktiviteter som krävs av Ljungan Skogsvård AB och för att skaffa nödvändigheter för verksamheten (mat, kläder, diesel). Resor för andra ändamål kommer att debiteras privat.",
    },
    {
      heading: "Skattedeklaration",
      body: "• Inkomstdeklarationen är personlig, och det är varje anställds ansvar att fylla i och lämna den till Skatteverket i Sverige. Ljungan Skogsvård är inte skyldig att lämna in anställdas deklarationer men kan hjälpa till om det behövs.",
    },
    {
      heading: "Riskidentifiering och rapportering",
      body: "• Att identifiera och rapportera risker är en avgörande del av verksamheten. Därför är varje anställd ansvarig för att upprätthålla en säker arbetsmiljö och bidra till dess förbättring.\n• I varje fordon finns en \"riskbedömning\" som identifierar potentiella risker och åtgärder som ska vidtas med företaget för att förhindra olyckor på arbetsplatsen. Det är din skyldighet att läsa och sätta dig in i dessa potentiella risker och vidta nödvändiga åtgärder för att förhindra olyckor.",
    },
    {
      heading: "Personliga hygienartiklar",
      body: "• Anställda är ansvariga för att ta med sina egna hygienartiklar, inklusive lakan för kuddar och filtar, örngott, handdukar, tofflor etc. Företaget tillhandahåller inte dessa artiklar, och deras användning är obligatorisk i de anvisade boendelokalerna.",
    },
    {
      heading: "Bekräftelse och avtal",
      body: "• Genom att underteckna detta anställningsavtal bekräftar jag att jag har läst, mottagit och fått en kopia av ovanstående och frivilligt åtar mig att följa dessa regler. Vid bristande efterlevnad accepterar jag motsvarande sanktioner.\n• Jag åtar mig att följa företagets interna regler och svensk lagstiftning samt mitt hemlands lagstiftning. Jag bekräftar att jag har informerats om dessa och haft möjlighet att begära förtydliganden.\n• Jag har också informerats om att företaget jag arbetar för är ett svenskt företag, att mina skatter betalas i Sverige och att jag har rätt att få lönespecifikation varje månad.\n• Jag har informerats om att jag kan begära en husvagn i arbetsområdet och välja att använda den eller inte.\n• Jag har informerats om att jag har tillgång till svensk hälsovård och att företaget jag arbetar för har ett samarbetsavtal med FeelGood – adress: Bankgatan 15, 852 31 Sundsvall. Mer information finns på www.feelgood.se. Här kan jag få fysiskt och psykiskt stöd.\n• Jag har också informerats om att den tillhandahållna informationen kommer att behandlas konfidentiellt. Jag samtycker till att Ljungan Skogsvård AB, genom sina representanter, får lagra mina personuppgifter.",
    },
  ],
};

/* ───────────────────── ENGLISH ───────────────────── */
const COC_EN = {
  title: "Safety Standards and Rules of Conduct – Ljungan Skogsvård AB",
  sections: [
    {
      heading: "",
      body: "Dear employee,\n\nWe kindly ask you to review and fully comply with the following safety standards and rules during working hours to ensure our operations are conducted under safe and efficient conditions. These standards are essential for protecting your health and maintaining an orderly and safe work environment.",
    },
    {
      heading: "Work Requirements",
      body: "• Planting, clearing with brushcutters and chainsaws, and other activities may only begin after you have passed the tests at the Forestry School (Skötselskolan) and signed all necessary documents, including employment contracts and other relevant forms.\n• To start working, you must pass the tests at the Forestry School for the sectors \"Planting\", \"Clearing and pre-clearing\", \"Environmental considerations basics\", and \"Being employed\", with companies such as SCA, Sveaskog, Holmen, Södra and other companies we work with.",
    },
    {
      heading: "Healthcare and Compensation",
      body: "• All employees are entitled to healthcare according to Swedish law and standards. They are also entitled to compensation under applicable Swedish legislation.\n• According to Swedish standards, a minimum fee of SEK 300–1,000 is required to visit a healthcare center (emergency room or other unit). This fee is paid privately, while additional costs are covered by Försäkringskassan (the Social Insurance Agency).",
    },
    {
      heading: "Personal Protective Equipment (PPE)",
      body: "• It is mandatory to wear the protective equipment provided by the company, including boots, reflective vests or jackets, helmets, gloves, and first aid kits. Not wearing this equipment is at your own risk, and in the event of an accident, the employee is directly responsible.",
    },
    {
      heading: "Safety During Work",
      body: "• When working with brushcutters, a minimum distance of 15 meters from colleagues must be maintained.\n• It is prohibited to handle branches or logs caught between the blade and the blade guard while the brushcutter is running.\n• It is prohibited to remove the blade guard from the brushcutter blade.",
    },
    {
      heading: "Driving Rules",
      body: "• Driving on forest roads must be done at a speed adapted to road conditions but should not exceed 50 km/h unless specific speed limits apply.\n• Driving on public roads and forest roads must be done carefully and in accordance with Swedish traffic rules. Seatbelt use is mandatory for all passengers. Safe and responsible driving is both a legal and moral obligation.\n• The team leader is responsible for keeping the car key safe and ensuring that no colleague who is intoxicated or lacks a valid driver's license has access to the car key.",
    },
    {
      heading: "Prohibited Substances",
      body: "• Consumption of alcohol, drugs, or hallucinogenic substances is prohibited at the workplace or during travel to and from work.",
    },
    {
      heading: "Waste Management",
      body: "• Do not leave litter behind; it must be disposed of in waste containers and sorted correctly.\n• Theft or rummaging through garbage is prohibited. Any activity that damages the company's reputation will result in salary deductions and termination.",
    },
    {
      heading: "Fuel Storage",
      body: "• Fuel containers (ASPEN) must be stored at designated locations, not in the forest or in living quarters.",
    },
    {
      heading: "Living Quarters",
      body: "• Living quarters must be kept clean, and household waste must be sorted.\n• Smoking in forest areas is prohibited, and smoking employees must be aware of safety measures. Smoking is only permitted on roads or turning areas, and all cigarette butts must be collected in a can. Open fires are only permitted under conditions specified in forestry standards.",
    },
    {
      heading: "Working Hours",
      body: "• Working hours are from 06:30 to 17:00, Monday to Friday, 8 hours per day, 40 hours per week. Employees do not need to work more than 8 hours per day, and any overtime must be reported daily/monthly.\n• Employees are guaranteed a basic salary according to the agreement with the GS union, provided they follow standards and working hours and meet Swedish quality and performance requirements per hour.",
    },
    {
      heading: "Quality Standards",
      body: "• The quality standards instruction given by the employer and contact persons for each stand must be followed strictly, and any deviations may result in salary deductions based on the client's evaluation.\n• If quality standards are not met, the employee's compensation will be suspended until the work is corrected (if possible) or until the employee pays the necessary compensation. Examples include payment for dry or discarded seedlings due to poor plant care, or compensation for damages caused by fire or other intentional damage by the employee.",
    },
    {
      heading: "Planting Instructions",
      body: "• Planting must be done according to instructions; errors will be penalized and charged.\n• It is prohibited to plant dry seedlings; employees are responsible for watering them.\n• Cardboard boxes must be recycled, and plastic boxes must be stored properly.\n• If seedlings are delivered in cardboard or plastic boxes, employees are responsible for collecting cardboard boxes and transporting them to a recycling center or other designated location, while plastic boxes must be placed on pallets and carefully repackaged.",
    },
    {
      heading: "Accommodation",
      body: "• A cabin is available for all employees, and they can choose to use it or not.\n• It is prohibited to leave food, clothing, household waste, or other personal or company-owned items in rented accommodations after they have been vacated by the employees.",
    },
    {
      heading: "Communication and Reporting",
      body: "• All uncertainties must be communicated, and any problems must be reported to the coordinators.\n• If you are unsure about how to manage or plant a stand, you must contact a coordinator as soon as possible.\n• If you notice anything suspicious in a stand, you must immediately inform the coordinators.",
    },
    {
      heading: "Termination of Employment",
      body: "• If a team or team member wishes to end their collaboration with Ljungan Skogsvård AB, the following must be observed:\n  A. If the employee has worked for Ljungan Skogsvård AB for one (1) year or more, company management must be notified at least 1 month in advance.\n  B. If the employee is new to Ljungan Skogsvård AB, company management must be notified at least 3 weeks in advance.\n• If these deadlines are not met, the last month's salary will be withheld.\n• The end of the work season must be planned with company management but may not occur until contracted work is completed or weather conditions do not allow operations to be conducted under optimal and safe conditions. Failure to comply with these deadlines is penalized by withholding the last month's salary.",
    },
    {
      heading: "Prohibited Activities",
      body: "• Any activity deemed dangerous and potentially risking the employee's life and health must not be performed. Safety and health are the priority in operations, followed by productivity.\n• All incidents causing stress or discomfort must be reported in writing immediately so that necessary measures can be taken.",
    },
    {
      heading: "Equipment and Maintenance",
      body: "• Equipment provided must be maintained in functional condition and cleaned/serviced weekly.",
    },
    {
      heading: "Work Environment",
      body: "• Maintaining a positive atmosphere and pleasant work environment is every employee's responsibility. In case of personal problems, the employee must contact the coordinator to take the necessary measures.",
    },
    {
      heading: "Fuel Handling",
      body: "• Employees may not transport gasoline, ASPEN, or other fuels in non-approved containers according to PEFC standards. Transport of fuel from the vehicle to the workplace may only be done with approved containers, and attaching or tying them to a harness is prohibited. Failure to follow these rules is at your own risk and the employee will be held responsible for any accidents.",
    },
    {
      heading: "Chemical Handling",
      body: "• Employees must follow rules for chemical handling. It is prohibited to consume, mishandle, or apply chemicals such as gasoline, ASPEN, diesel, or oil to the body.",
    },
    {
      heading: "Vehicle Safety",
      body: "• If the driver of the service vehicle or team members notice that the vehicle is in poor condition and risks the life and health of team members or other road users, they must inform the coordinators.",
    },
    {
      heading: "Maps and Emergency Procedures",
      body: "• Employees must carry a map with instructions for the stand they are working in, and the team leader must know the emergency coordinates on each map, marked in red. The map can be physical (on paper) or electronic (downloaded on phone/tablet).\n• In emergencies, employees must call 112 and provide the emergency coordinates on the map, which indicate the location where help can reach.",
    },
    {
      heading: "Discrimination and Confidentiality",
      body: "• Discrimination based on race, gender, or religion is prohibited, both in the workplace and in society.\n• It is prohibited to maliciously defame Ljungan Skogsvård AB, share secrets, or disclose confidential information. Failure to comply with these rules will result in penalties, including salary deductions and compensation claims from Ljungan Skogsvård AB.",
    },
    {
      heading: "Use of Company Vehicles",
      body: "• It is prohibited to use company vehicles for personal purposes. They may only be used for activities required by Ljungan Skogsvård AB and for obtaining necessities for operations (food, clothing, diesel). Travel for other purposes will be charged privately.",
    },
    {
      heading: "Tax Declaration",
      body: "• The income tax declaration is personal, and it is every employee's responsibility to complete and submit it to the Swedish Tax Agency (Skatteverket). Ljungan Skogsvård is not obligated to file employees' declarations but can assist if needed.",
    },
    {
      heading: "Risk Identification and Reporting",
      body: "• Identifying and reporting risks is a crucial part of operations. Therefore, every employee is responsible for maintaining a safe work environment and contributing to its improvement.\n• In each vehicle there is a \"risk assessment\" that identifies potential risks and measures to be taken with the company to prevent workplace accidents. It is your obligation to read and familiarize yourself with these potential risks and take the necessary measures to prevent accidents.",
    },
    {
      heading: "Personal Hygiene Items",
      body: "• Employees are responsible for bringing their own hygiene items, including sheets for pillows and blankets, pillowcases, towels, slippers, etc. The company does not provide these items, and their use is mandatory in the designated living quarters.",
    },
    {
      heading: "Acknowledgment and Agreement",
      body: "• By signing this employment contract, I confirm that I have read, received, and obtained a copy of the above and voluntarily commit to following these rules. In case of non-compliance, I accept the corresponding sanctions.\n• I commit to following the company's internal rules and Swedish legislation as well as the legislation of my home country. I confirm that I have been informed about these and have had the opportunity to request clarifications.\n• I have also been informed that the company I work for is a Swedish company, that my taxes are paid in Sweden, and that I have the right to receive a pay slip every month.\n• I have been informed that I can request a caravan in the work area and choose to use it or not.\n• I have been informed that I have access to Swedish healthcare and that the company I work for has a cooperation agreement with FeelGood – address: Bankgatan 15, 852 31 Sundsvall. More information is available at www.feelgood.se. Here I can receive physical and mental support.\n• I have also been informed that the information provided will be treated confidentially. I consent to Ljungan Skogsvård AB, through its representatives, storing my personal data.",
    },
  ],
};

/* ───────────────────── UKRAINIAN ───────────────────── */
const COC_UK = {
  title: "Норми охорони праці та правила поведінки – Ljungan Skogsvård AB",
  sections: [
    {
      heading: "",
      body: "Шановний працівнику,\n\nМи просимо вас ознайомитися та повністю дотримуватися наступних стандартів безпеки та правил під час робочого часу, щоб забезпечити ведення нашої діяльності в безпечних та ефективних умовах. Ці стандарти є важливими для захисту вашого здоров'я та підтримання впорядкованого та безпечного робочого середовища.",
    },
    {
      heading: "Вимоги до роботи",
      body: "• Посадка, розчищення за допомогою кущорізів та бензопил, а також інші роботи можуть розпочинатися лише після того, як ви склали іспити у Школі лісівництва (Skötselskolan) та підписали всі необхідні документи, включаючи трудовий договір та інші відповідні форми.\n• Щоб почати працювати, ви як працівник повинні скласти іспити у Школі лісівництва за секторами «Посадка», «Розчищення та підготовча розчистка», «Основи охорони навколишнього середовища» та «Бути найнятим», у компаніях таких як SCA, Sveaskog, Holmen, Södra та інших компаніях, з якими ми співпрацюємо.",
    },
    {
      heading: "Охорона здоров'я та компенсація",
      body: "• Усі працівники мають право на медичне обслуговування відповідно до шведського законодавства та стандартів. Вони також мають право на компенсацію відповідно до чинного шведського законодавства.\n• Згідно зі шведськими нормами, для відвідування медичного закладу (невідкладної допомоги або іншого підрозділу) потрібна мінімальна плата в розмірі 300–1000 SEK. Ця плата сплачується приватно, тоді як додаткові витрати покриває Försäkringskassan (Агентство соціального страхування).",
    },
    {
      heading: "Засоби індивідуального захисту (ЗІЗ)",
      body: "• Обов'язково носити захисне обладнання, надане компанією, включаючи черевики, світловідбивні жилети або куртки, каски, рукавички та аптечки першої допомоги. Невикористання цього обладнання здійснюється на власний ризик, і в разі нещасного випадку працівник несе пряму відповідальність.",
    },
    {
      heading: "Безпека під час роботи",
      body: "• При роботі з кущорізами необхідно дотримуватися мінімальної відстані 15 метрів від колег.\n• Заборонено маніпулювати гілками або колодами, що застрягли між лезом та захистом леза, поки кущоріз працює.\n• Заборонено знімати захист леза з кущоріза.",
    },
    {
      heading: "Правила водіння",
      body: "• Рух лісовими дорогами повинен здійснюватися зі швидкістю, пристосованою до дорожніх умов, але не повинен перевищувати 50 км/год, якщо не діють конкретні обмеження швидкості.\n• Рух громадськими та лісовими дорогами повинен здійснюватися обережно та відповідно до шведських правил дорожнього руху. Використання ременів безпеки є обов'язковим для всіх пасажирів. Безпечне та відповідальне водіння є як юридичним, так і моральним обов'язком.\n• Бригадир відповідає за безпечне зберігання ключа від автомобіля та за те, щоб жоден колега, який перебуває в стані сп'яніння або не має дійсного посвідчення водія, не мав доступу до ключа від автомобіля.",
    },
    {
      heading: "Заборонені речовини",
      body: "• Вживання алкоголю, наркотиків або галюциногенних речовин заборонено на робочому місці або під час поїздок на роботу та з роботи.",
    },
    {
      heading: "Поводження з відходами",
      body: "• Не залишайте сміття після себе; його необхідно викидати у контейнери для сміття та правильно сортувати.\n• Крадіжка або перебирання сміття заборонені. Будь-яка діяльність, що шкодить репутації компанії, призведе до утримань із заробітної плати та звільнення.",
    },
    {
      heading: "Зберігання палива",
      body: "• Ємності з паливом (ASPEN) повинні зберігатися у визначених місцях, а не в лісі або в житлових приміщеннях.",
    },
    {
      heading: "Житлові приміщення",
      body: "• Житлові приміщення повинні утримуватися в чистоті, а побутові відходи повинні сортуватися.\n• Куріння в лісових зонах заборонено, і курці повинні знати про заходи безпеки. Куріння дозволяється лише на дорозі або розворотній площадці, і всі недопалки повинні збиратися в банку. Відкритий вогонь дозволяється лише за умов, зазначених у стандартах лісівництва.",
    },
    {
      heading: "Робочий час",
      body: "• Робочий час — з 06:30 до 17:00, з понеділка по п'ятницю, 8 годин на день, 40 годин на тиждень. Працівники не зобов'язані працювати більше 8 годин на день, і будь-які понаднормові години повинні щоденно/щомісячно звітуватися.\n• Працівникам гарантується базова заробітна плата згідно з угодою з профспілкою GS, за умови дотримання стандартів і робочого часу та виконання шведських вимог якості та продуктивності за годину.",
    },
    {
      heading: "Стандарти якості",
      body: "• Інструкції щодо стандартів якості, надані роботодавцем та контактними особами для кожного насадження, повинні суворо дотримуватися, і будь-які відхилення можуть призвести до утримань із заробітної плати на підставі оцінки замовника.\n• Якщо стандарти якості не дотримуються, компенсація працівника буде призупинена до виправлення роботи (якщо можливо) або до сплати працівником необхідної компенсації. Приклади включають оплату за сухі або відбраковані саджанці через недбалий догляд за рослинами, або компенсацію збитків, спричинених пожежею або іншою навмисною шкодою з боку працівника.",
    },
    {
      heading: "Інструкції з посадки",
      body: "• Посадка повинна здійснюватися відповідно до інструкцій; помилки будуть покарані та стягнені.\n• Заборонено садити сухі саджанці; працівники відповідають за їх полив.\n• Картонні коробки повинні бути перероблені, а пластикові коробки повинні зберігатися належним чином.\n• Якщо саджанці доставляються в картонних або пластикових коробках, працівники відповідають за збір картонних коробок та їх транспортування до центру переробки або іншого визначеного місця, тоді як пластикові коробки повинні бути розміщені на піддонах і ретельно перепаковані.",
    },
    {
      heading: "Проживання",
      body: "• Будиночок доступний для всіх працівників, і вони можуть вибирати — користуватися ним чи ні.\n• Заборонено залишати їжу, одяг, побутове сміття або інші особисті чи належні компанії речі в орендованому житлі після його звільнення працівниками.",
    },
    {
      heading: "Комунікація та звітність",
      body: "• Усі невизначеності повинні бути повідомлені, і будь-які проблеми повинні бути доведені до відома координаторів.\n• Якщо ви не впевнені, як управляти або садити в насадженні, ви повинні зв'язатися з координатором якнайшвидше.\n• Якщо ви помітили щось підозріле в насадженні, ви повинні негайно повідомити координаторів.",
    },
    {
      heading: "Припинення трудових відносин",
      body: "• Якщо команда або член команди бажає припинити співпрацю з Ljungan Skogsvård AB, необхідно дотримуватися наступного:\n  A. Якщо працівник працював на Ljungan Skogsvård AB один (1) рік або більше, керівництво компанії повинно бути повідомлено щонайменше за 1 місяць.\n  B. Якщо працівник новий у Ljungan Skogsvård AB, керівництво компанії повинно бути повідомлено щонайменше за 3 тижні.\n• Якщо ці терміни не дотримані, зарплата за останній місяць буде утримана.\n• Завершення робочого сезону повинно бути сплановане з керівництвом компанії, але не може відбутися до завершення контрактних робіт або коли погодні умови не дозволяють вести діяльність в оптимальних і безпечних умовах. Недотримання цих термінів карається утриманням зарплати за останній місяць.",
    },
    {
      heading: "Заборонені дії",
      body: "• Будь-яка діяльність, яка вважається небезпечною і потенційно загрожує життю та здоров'ю працівника, не повинна виконуватися. Безпека та здоров'я є пріоритетом у діяльності, за яким слідує продуктивність.\n• Усі інциденти, що спричиняють стрес або дискомфорт, повинні негайно повідомлятися письмово для вжиття необхідних заходів.",
    },
    {
      heading: "Обладнання та обслуговування",
      body: "• Надане обладнання повинно підтримуватися в робочому стані та щотижнево очищатися/обслуговуватися.",
    },
    {
      heading: "Робоче середовище",
      body: "• Підтримання позитивної атмосфери та приємного робочого середовища є відповідальністю кожного працівника. У разі особистих проблем працівник повинен зв'язатися з координатором для вжиття необхідних заходів.",
    },
    {
      heading: "Поводження з паливом",
      body: "• Працівники не мають права транспортувати бензин, ASPEN або інші види палива в несертифікованих ємностях відповідно до стандартів PEFC. Транспортування палива від транспортного засобу до робочого місця дозволяється лише в сертифікованих ємностях, і прикріплення або прив'язування їх до підвісної системи заборонено. Недотримання цих правил здійснюється на власний ризик, і працівник несе відповідальність за будь-які нещасні випадки.",
    },
    {
      heading: "Поводження з хімічними речовинами",
      body: "• Працівники повинні дотримуватися правил поводження з хімічними речовинами. Заборонено вживати, неправильно використовувати або наносити на тіло хімічні речовини, такі як бензин, ASPEN, дизель або масло.",
    },
    {
      heading: "Безпека транспортних засобів",
      body: "• Якщо водій службового автомобіля або члени команди помічають, що транспортний засіб перебуває в поганому стані і загрожує життю та здоров'ю членів команди або інших учасників дорожнього руху, вони повинні повідомити координаторів.",
    },
    {
      heading: "Карти та екстрені процедури",
      body: "• Працівники повинні мати при собі карту з інструкціями для насадження, в якому вони працюють, і бригадир повинен знати координати для екстрених випадків на кожній карті, позначені червоним кольором. Карта може бути фізичною (на папері) або електронною (завантаженою на телефон/планшет).\n• У екстрених ситуаціях працівники повинні зателефонувати 112 і вказати координати для екстрених випадків на карті, які вказують місце, куди може прибути допомога.",
    },
    {
      heading: "Дискримінація та конфіденційність",
      body: "• Дискримінація за ознакою раси, статі або релігії заборонена як на робочому місці, так і в суспільстві.\n• Заборонено зловмисно наклепницькі дії щодо Ljungan Skogsvård AB, розголошення таємниць або конфіденційної інформації. Недотримання цих правил призведе до покарань, включаючи утримання із заробітної плати та вимоги компенсації від Ljungan Skogsvård AB.",
    },
    {
      heading: "Використання службових транспортних засобів",
      body: "• Заборонено використовувати службові транспортні засоби для особистих цілей. Вони можуть використовуватися лише для діяльності, необхідної Ljungan Skogsvård AB, та для придбання необхідних для роботи речей (їжа, одяг, дизель). Поїздки для інших цілей будуть стягнені приватно.",
    },
    {
      heading: "Податкова декларація",
      body: "• Декларація про доходи є особистою, і кожен працівник несе відповідальність за її заповнення та подання до Податкового управління Швеції (Skatteverket). Ljungan Skogsvård не зобов'язаний подавати декларації працівників, але може допомогти за потреби.",
    },
    {
      heading: "Ідентифікація та звітування про ризики",
      body: "• Ідентифікація та звітування про ризики є важливою частиною діяльності. Тому кожен працівник відповідає за підтримання безпечного робочого середовища та сприяння його покращенню.\n• У кожному транспортному засобі є «оцінка ризиків», яка визначає потенційні ризики та заходи, які необхідно вжити разом з компанією для запобігання нещасним випадкам на робочому місці. Ваш обов'язок — прочитати та ознайомитися з цими потенційними ризиками та вжити необхідних заходів для запобігання нещасним випадкам.",
    },
    {
      heading: "Особисті засоби гігієни",
      body: "• Працівники несуть відповідальність за те, щоб привезти власні засоби гігієни, включаючи простирадла для подушок та ковдр, наволочки, рушники, тапочки тощо. Компанія не надає цих предметів, і їх використання є обов'язковим у визначених житлових приміщеннях.",
    },
    {
      heading: "Підтвердження та угода",
      body: "• Підписуючи цей трудовий договір, я підтверджую, що прочитав(-ла), отримав(-ла) та маю копію вищезазначеного і добровільно зобов'язуюся дотримуватися цих правил. У разі недотримання я приймаю відповідні санкції.\n• Я зобов'язуюся дотримуватися внутрішніх правил компанії та шведського законодавства, а також законодавства моєї рідної країни. Я підтверджую, що був(-ла) поінформований(-а) про це і мав(-ла) можливість запросити роз'яснення.\n• Я також був(-ла) поінформований(-а), що компанія, на яку я працюю, є шведською компанією, що мої податки сплачуються в Швеції, і що я маю право отримувати розрахунковий лист щомісяця.\n• Я був(-ла) поінформований(-а), що можу запросити караван у робочій зоні і вибрати — користуватися ним чи ні.\n• Я був(-ла) поінформований(-а), що маю доступ до шведської медичної допомоги і що компанія, на яку я працюю, має угоду про співпрацю з FeelGood – адреса: Bankgatan 15, 852 31 Sundsvall. Більше інформації доступно на www.feelgood.se. Тут я можу отримати фізичну та психологічну підтримку.\n• Я також був(-ла) поінформований(-а), що надана інформація оброблятиметься конфіденційно. Я надаю згоду на те, щоб Ljungan Skogsvård AB через своїх представників зберігав мої персональні дані.",
    },
  ],
};

/* ───────────────────── ROMANIAN ───────────────────── */
const COC_RO = {
  title: "Standarde de protecție a muncii și reguli de conduită – Ljungan Skogsvård AB",
  sections: [
    {
      heading: "",
      body: "Dragă angajat,\n\nVă rugăm să examinați și să respectați pe deplin următoarele standarde de siguranță și reguli în timpul programului de lucru pentru a asigura desfășurarea activităților noastre în condiții sigure și eficiente. Aceste standarde sunt esențiale pentru protejarea sănătății dumneavoastră și menținerea unui mediu de lucru ordonat și sigur.",
    },
    {
      heading: "Cerințe de lucru",
      body: "• Plantarea, defrișarea cu motocoase și drujbe și alte activități pot începe numai după ce ați trecut examenele la Școala de Silvicultură (Skötselskolan) și ați semnat toate documentele necesare, inclusiv contractul de muncă și alte formulare relevante.\n• Pentru a începe lucrul, trebuie să treceți examenele la Școala de Silvicultură pentru sectoarele „Plantare", „Defrișare și pre-defrișare", „Considerații de mediu de bază" și „A fi angajat", la companii precum SCA, Sveaskog, Holmen, Södra și alte companii cu care colaborăm.",
    },
    {
      heading: "Asistență medicală și compensații",
      body: "• Toți angajații au dreptul la asistență medicală conform legislației și standardelor suedeze. De asemenea, au dreptul la compensații conform legislației suedeze aplicabile.\n• Conform standardelor suedeze, este necesară o taxă minimă de 300–1.000 SEK pentru a vizita un centru medical (urgență sau altă unitate). Această taxă se plătește privat, în timp ce costurile suplimentare sunt acoperite de Försäkringskassan (Agenția de Asigurări Sociale).",
    },
    {
      heading: "Echipament individual de protecție (EIP)",
      body: "• Este obligatoriu să purtați echipamentul de protecție furnizat de companie, inclusiv cizme, veste sau jachete reflectorizante, căști, mănuși și truse de prim ajutor. Nepurtarea acestui echipament se face pe propriul risc, iar în cazul unui accident, angajatul este direct responsabil.",
    },
    {
      heading: "Siguranța în timpul lucrului",
      body: "• La lucrul cu motocoase, trebuie menținută o distanță minimă de 15 metri față de colegi.\n• Este interzis să manipulați ramuri sau bușteni prinși între lamă și apărătoarea lamei în timp ce motocoasa funcționează.\n• Este interzis să scoateți apărătoarea lamei de pe motocoasă.",
    },
    {
      heading: "Reguli de conducere",
      body: "• Conducerea pe drumuri forestiere trebuie efectuată la o viteză adaptată condițiilor drumului, dar nu trebuie să depășească 50 km/h dacă nu se aplică limite de viteză specifice.\n• Conducerea pe drumuri publice și forestiere trebuie efectuată cu atenție și în conformitate cu regulile de circulație suedeze. Utilizarea centurii de siguranță este obligatorie pentru toți pasagerii. Conducerea sigură și responsabilă este atât o obligație legală, cât și morală.\n• Liderul echipei este responsabil pentru păstrarea în siguranță a cheii mașinii și pentru a se asigura că niciun coleg aflat în stare de ebrietate sau fără permis de conducere valabil nu are acces la cheia mașinii.",
    },
    {
      heading: "Substanțe interzise",
      body: "• Consumul de alcool, droguri sau substanțe halucinogene este interzis la locul de muncă sau în timpul deplasărilor la și de la serviciu.",
    },
    {
      heading: "Gestionarea deșeurilor",
      body: "• Nu lăsați gunoi în urmă; acesta trebuie aruncat în containere și sortat corect.\n• Furtul sau răscolirea gunoaielor este interzisă. Orice activitate care dăunează reputației companiei va duce la rețineri din salariu și concediere.",
    },
    {
      heading: "Depozitarea combustibilului",
      body: "• Recipientele de combustibil (ASPEN) trebuie depozitate în locuri desemnate, nu în pădure sau în spațiile de locuit.",
    },
    {
      heading: "Spații de locuit",
      body: "• Spațiile de locuit trebuie menținute curate, iar deșeurile menajere trebuie sortate.\n• Fumatul în zonele forestiere este interzis, iar angajații fumători trebuie să cunoască măsurile de siguranță. Fumatul este permis doar pe drum sau pe platforme de întoarcere, iar toate mucurile de țigări trebuie colectate într-o cutie. Focurile deschise sunt permise doar în condițiile specificate în standardele de silvicultură.",
    },
    {
      heading: "Program de lucru",
      body: "• Programul de lucru este de la 06:30 la 17:00, de luni până vineri, 8 ore pe zi, 40 de ore pe săptămână. Angajații nu trebuie să lucreze mai mult de 8 ore pe zi, iar orice ore suplimentare trebuie raportate zilnic/lunar.\n• Angajaților li se garantează un salariu de bază conform acordului cu sindicatul GS, cu condiția respectării standardelor și programului de lucru și îndeplinirii cerințelor suedeze de calitate și performanță pe oră.",
    },
    {
      heading: "Standarde de calitate",
      body: "• Instrucțiunile privind standardele de calitate oferite de angajator și persoanele de contact pentru fiecare parcelă trebuie respectate strict, iar orice abateri pot duce la rețineri din salariu pe baza evaluării clientului.\n• Dacă standardele de calitate nu sunt respectate, compensația angajatului va fi suspendată până la corectarea lucrării (dacă este posibil) sau până când angajatul plătește compensația necesară. Exemplele includ plata pentru puieți uscați sau aruncați din cauza îngrijirii deficitare a plantelor, sau compensația pentru daune cauzate de incendii sau alte daune intenționate ale angajatului.",
    },
    {
      heading: "Instrucțiuni de plantare",
      body: "• Plantarea trebuie efectuată conform instrucțiunilor; erorile vor fi penalizate și facturate.\n• Este interzis să plantați puieți uscați; angajații sunt responsabili pentru udarea acestora.\n• Cutiile de carton trebuie reciclate, iar cutiile de plastic trebuie depozitate corespunzător.\n• Dacă puieții sunt livrați în cutii de carton sau plastic, angajații sunt responsabili pentru colectarea cutiilor de carton și transportul lor la un centru de reciclare sau alt loc desemnat, în timp ce cutiile de plastic trebuie plasate pe paleți și reambalate cu grijă.",
    },
    {
      heading: "Cazare",
      body: "• O cabană este disponibilă pentru toți angajații, iar aceștia pot alege să o utilizeze sau nu.\n• Este interzis să lăsați mâncare, haine, deșeuri menajere sau alte obiecte personale sau aparținând companiei în locuințele închiriate după ce acestea au fost părăsite de angajați.",
    },
    {
      heading: "Comunicare și raportare",
      body: "• Toate incertitudinile trebuie comunicate, iar orice probleme trebuie raportate coordonatorilor.\n• Dacă nu sunteți sigur cum să gestionați sau să plantați o parcelă, trebuie să contactați un coordonator cât mai curând posibil.\n• Dacă observați ceva suspect într-o parcelă, trebuie să informați imediat coordonatorii.",
    },
    {
      heading: "Încetarea raportului de muncă",
      body: "• Dacă o echipă sau un membru al echipei dorește să încheie colaborarea cu Ljungan Skogsvård AB, trebuie respectate următoarele:\n  A. Dacă angajatul a lucrat la Ljungan Skogsvård AB timp de un (1) an sau mai mult, conducerea companiei trebuie notificată cu cel puțin 1 lună înainte.\n  B. Dacă angajatul este nou la Ljungan Skogsvård AB, conducerea companiei trebuie notificată cu cel puțin 3 săptămâni înainte.\n• Dacă aceste termene nu sunt respectate, salariul ultimei luni va fi reținut.\n• Sfârșitul sezonului de lucru trebuie planificat cu conducerea companiei, dar nu poate avea loc până când lucrările contractate nu sunt finalizate sau condițiile meteorologice nu permit desfășurarea operațiunilor în condiții optime și sigure. Nerespectarea acestor termene se sancționează cu reținerea salariului pentru ultima lună.",
    },
    {
      heading: "Activități interzise",
      body: "• Orice activitate considerată periculoasă și care riscă potențial viața și sănătatea angajatului nu trebuie efectuată. Siguranța și sănătatea sunt prioritare în operațiuni, urmate de productivitate.\n• Toate incidentele care provoacă stres sau disconfort trebuie raportate imediat în scris pentru a lua măsurile necesare.",
    },
    {
      heading: "Echipamente și întreținere",
      body: "• Echipamentele furnizate trebuie menținute în stare funcțională și curățate/întreținute săptămânal.",
    },
    {
      heading: "Mediul de lucru",
      body: "• Menținerea unei atmosfere pozitive și a unui mediu de lucru plăcut este responsabilitatea fiecărui angajat. În cazul problemelor personale, angajatul trebuie să contacteze coordonatorul pentru a lua măsurile necesare.",
    },
    {
      heading: "Manipularea combustibilului",
      body: "• Angajații nu au voie să transporte benzină, ASPEN sau alte combustibile în recipiente neaprobate conform standardelor PEFC. Transportul combustibilului de la vehicul la locul de muncă se poate face doar cu recipiente aprobate, iar atașarea sau legarea acestora de ham este interzisă. Nerespectarea acestor reguli se face pe propriul risc, iar angajatul va fi responsabil pentru orice accident.",
    },
    {
      heading: "Manipularea substanțelor chimice",
      body: "• Angajații trebuie să respecte regulile de manipulare a substanțelor chimice. Este interzis să consumați, să manipulați necorespunzător sau să aplicați pe corp substanțe chimice precum benzina, ASPEN, motorina sau uleiul.",
    },
    {
      heading: "Siguranța vehiculelor",
      body: "• Dacă șoferul vehiculului de service sau membrii echipei observă că vehiculul este în stare proastă și riscă viața și sănătatea membrilor echipei sau a altor participanți la trafic, aceștia trebuie să informeze coordonatorii.",
    },
    {
      heading: "Hărți și proceduri de urgență",
      body: "• Angajații trebuie să aibă asupra lor o hartă cu instrucțiuni pentru parcela în care lucrează, iar liderul echipei trebuie să cunoască coordonatele de urgență de pe fiecare hartă, marcate cu roșu. Harta poate fi fizică (pe hârtie) sau electronică (descărcată pe telefon/tabletă).\n• În cazuri de urgență, angajații trebuie să sune la 112 și să furnizeze coordonatele de urgență de pe hartă, care indică locul unde poate ajunge ajutorul.",
    },
    {
      heading: "Discriminare și confidențialitate",
      body: "• Discriminarea bazată pe rasă, gen sau religie este interzisă, atât la locul de muncă, cât și în societate.\n• Este interzis să defăimați cu rea-voință Ljungan Skogsvård AB, să împărtășiți secrete sau să dezvăluiți informații confidențiale. Nerespectarea acestor reguli va duce la sancțiuni, inclusiv rețineri din salariu și cereri de compensare din partea Ljungan Skogsvård AB.",
    },
    {
      heading: "Utilizarea vehiculelor companiei",
      body: "• Este interzis să utilizați vehiculele companiei în scopuri personale. Acestea pot fi utilizate doar pentru activitățile necesare Ljungan Skogsvård AB și pentru achiziționarea necesarului pentru operațiuni (mâncare, îmbrăcăminte, motorină). Călătoriile în alte scopuri vor fi facturate privat.",
    },
    {
      heading: "Declarația fiscală",
      body: "• Declarația de venituri este personală, iar fiecare angajat este responsabil pentru completarea și depunerea ei la Agenția Fiscală Suedeză (Skatteverket). Ljungan Skogsvård nu este obligat să depună declarațiile angajaților, dar poate ajuta dacă este necesar.",
    },
    {
      heading: "Identificarea și raportarea riscurilor",
      body: "• Identificarea și raportarea riscurilor este o parte esențială a operațiunilor. Prin urmare, fiecare angajat este responsabil pentru menținerea unui mediu de lucru sigur și pentru contribuția la îmbunătățirea acestuia.\n• În fiecare vehicul există o „evaluare a riscurilor" care identifică riscurile potențiale și măsurile ce trebuie luate împreună cu compania pentru prevenirea accidentelor la locul de muncă. Este obligația dumneavoastră să citiți și să vă familiarizați cu aceste riscuri potențiale și să luați măsurile necesare pentru prevenirea accidentelor.",
    },
    {
      heading: "Articole de igienă personală",
      body: "• Angajații sunt responsabili să aducă propriile articole de igienă, inclusiv cearșafuri pentru perne și pături, fețe de pernă, prosoape, papuci etc. Compania nu furnizează aceste articole, iar utilizarea lor este obligatorie în spațiile de cazare desemnate.",
    },
    {
      heading: "Confirmare și acord",
      body: "• Prin semnarea acestui contract de muncă, confirm că am citit, am primit și am obținut o copie a celor de mai sus și mă angajez în mod voluntar să respect aceste reguli. În cazul neconformității, accept sancțiunile corespunzătoare.\n• Mă angajez să respect regulile interne ale companiei și legislația suedeză, precum și legislația țării mele de origine. Confirm că am fost informat(ă) cu privire la acestea și am avut posibilitatea de a solicita clarificări.\n• Am fost de asemenea informat(ă) că compania pentru care lucrez este o companie suedeză, că taxele mele se plătesc în Suedia și că am dreptul de a primi un fluturaș de salariu în fiecare lună.\n• Am fost informat(ă) că pot solicita o rulotă în zona de lucru și pot alege să o folosesc sau nu.\n• Am fost informat(ă) că am acces la asistență medicală suedeză și că compania pentru care lucrez are un acord de cooperare cu FeelGood – adresa: Bankgatan 15, 852 31 Sundsvall. Mai multe informații sunt disponibile la www.feelgood.se. Aici pot primi sprijin fizic și psihic.\n• Am fost de asemenea informat(ă) că informațiile furnizate vor fi tratate confidențial. Consimt ca Ljungan Skogsvård AB, prin reprezentanții săi, să stocheze datele mele personale.",
    },
  ],
};

/* ───────────────────── THAI ───────────────────── */
const COC_TH = {
  title: "มาตรฐานความปลอดภัยในการทำงานและกฎระเบียบ – Ljungan Skogsvård AB",
  sections: [
    {
      heading: "",
      body: "พนักงานที่รัก\n\nเราขอให้คุณทบทวนและปฏิบัติตามมาตรฐานความปลอดภัยและกฎระเบียบต่อไปนี้อย่างเคร่งครัดในระหว่างเวลาทำงาน เพื่อให้แน่ใจว่าการดำเนินงานของเราเป็นไปในสภาวะที่ปลอดภัยและมีประสิทธิภาพ มาตรฐานเหล่านี้มีความสำคัญอย่างยิ่งในการปกป้องสุขภาพของคุณและรักษาสภาพแวดล้อมการทำงานที่เป็นระเบียบและปลอดภัย",
    },
    {
      heading: "ข้อกำหนดการทำงาน",
      body: "• การปลูก การถางด้วยเครื่องตัดหญ้าและเลื่อยยนต์ รวมถึงกิจกรรมอื่น ๆ จะเริ่มได้ก็ต่อเมื่อคุณผ่านการสอบที่โรงเรียนป่าไม้ (Skötselskolan) และลงนามในเอกสารที่จำเป็นทั้งหมดแล้ว รวมถึงสัญญาจ้างงานและแบบฟอร์มที่เกี่ยวข้องอื่น ๆ\n• ในการเริ่มทำงาน คุณต้องผ่านการสอบที่โรงเรียนป่าไม้ในสาขา \"การปลูก\" \"การถางและการเตรียมการถาง\" \"พื้นฐานการดูแลสิ่งแวดล้อม\" และ \"การเป็นลูกจ้าง\" กับบริษัทต่าง ๆ เช่น SCA, Sveaskog, Holmen, Södra และบริษัทอื่น ๆ ที่เราร่วมงานด้วย",
    },
    {
      heading: "การดูแลสุขภาพและค่าชดเชย",
      body: "• พนักงานทุกคนมีสิทธิ์ได้รับการดูแลสุขภาพตามกฎหมายและมาตรฐานของสวีเดน และมีสิทธิ์ได้รับค่าชดเชยตามกฎหมายสวีเดนที่ใช้บังคับ\n• ตามมาตรฐานสวีเดน ต้องมีค่าธรรมเนียมขั้นต่ำ 300–1,000 SEK สำหรับการเข้ารับบริการที่ศูนย์สุขภาพ (ห้องฉุกเฉินหรือหน่วยอื่น) ค่าธรรมเนียมนี้จ่ายเป็นการส่วนตัว ในขณะที่ค่าใช้จ่ายเพิ่มเติมจะได้รับการคุ้มครองจาก Försäkringskassan (สำนักงานประกันสังคม)",
    },
    {
      heading: "อุปกรณ์ป้องกันส่วนบุคคล (PPE)",
      body: "• จำเป็นต้องสวมใส่อุปกรณ์ป้องกันที่บริษัทจัดให้ รวมถึงรองเท้าบูท เสื้อกั๊กหรือเสื้อแจ็คเก็ตสะท้อนแสง หมวกนิรภัย ถุงมือ และชุดปฐมพยาบาล การไม่สวมอุปกรณ์เหล่านี้ถือเป็นความเสี่ยงของตนเอง และในกรณีที่เกิดอุบัติเหตุ พนักงานจะต้องรับผิดชอบโดยตรง",
    },
    {
      heading: "ความปลอดภัยระหว่างการทำงาน",
      body: "• เมื่อทำงานกับเครื่องตัดหญ้า ต้องรักษาระยะห่างขั้นต่ำ 15 เมตรจากเพื่อนร่วมงาน\n• ห้ามจัดการกิ่งไม้หรือท่อนไม้ที่ติดอยู่ระหว่างใบมีดและที่ป้องกันใบมีดขณะที่เครื่องตัดหญ้ากำลังทำงาน\n• ห้ามถอดที่ป้องกันใบมีดออกจากเครื่องตัดหญ้า",
    },
    {
      heading: "กฎการขับขี่",
      body: "• การขับขี่บนถนนป่าต้องทำด้วยความเร็วที่เหมาะสมกับสภาพถนน แต่ไม่ควรเกิน 50 กม./ชม. หากไม่มีข้อจำกัดความเร็วเฉพาะ\n• การขับขี่บนถนนสาธารณะและถนนป่าต้องทำอย่างระมัดระวังและเป็นไปตามกฎจราจรของสวีเดน การคาดเข็มขัดนิรภัยเป็นข้อบังคับสำหรับผู้โดยสารทุกคน การขับขี่อย่างปลอดภัยและรับผิดชอบเป็นทั้งหน้าที่ทางกฎหมายและศีลธรรม\n• หัวหน้าทีมรับผิดชอบในการเก็บรักษากุญแจรถอย่างปลอดภัยและดูแลให้แน่ใจว่าไม่มีเพื่อนร่วมงานที่เมาสุราหรือไม่มีใบอนุญาตขับขี่ที่ถูกต้องเข้าถึงกุญแจรถได้",
    },
    {
      heading: "สารต้องห้าม",
      body: "• ห้ามดื่มแอลกอฮอล์ ใช้ยาเสพติด หรือสารหลอนประสาทในที่ทำงานหรือระหว่างการเดินทางไปและกลับจากที่ทำงาน",
    },
    {
      heading: "การจัดการขยะ",
      body: "• อย่าทิ้งขยะไว้ ต้องทิ้งในถังขยะและคัดแยกอย่างถูกต้อง\n• ห้ามขโมยหรือรื้อค้นขยะ กิจกรรมใด ๆ ที่ทำลายชื่อเสียงของบริษัทจะส่งผลให้ถูกหักเงินเดือนและเลิกจ้าง",
    },
    {
      heading: "การจัดเก็บเชื้อเพลิง",
      body: "• ภาชนะบรรจุเชื้อเพลิง (ASPEN) ต้องเก็บไว้ในสถานที่ที่กำหนด ไม่ใช่ในป่าหรือในที่พักอาศัย",
    },
    {
      heading: "ที่พักอาศัย",
      body: "• ที่พักอาศัยต้องรักษาความสะอาด และต้องคัดแยกขยะในครัวเรือน\n• ห้ามสูบบุหรี่ในพื้นที่ป่า และพนักงานที่สูบบุหรี่ต้องตระหนักถึงมาตรการความปลอดภัย อนุญาตให้สูบบุหรี่เฉพาะบนถนนหรือลานกลับรถ และต้องเก็บก้นบุหรี่ทั้งหมดใส่กระป๋อง อนุญาตให้จุดไฟกลางแจ้งเฉพาะภายใต้เงื่อนไขที่ระบุในมาตรฐานป่าไม้เท่านั้น",
    },
    {
      heading: "ชั่วโมงทำงาน",
      body: "• ชั่วโมงทำงานคือ 06:30 ถึง 17:00 วันจันทร์ถึงศุกร์ 8 ชั่วโมงต่อวัน 40 ชั่วโมงต่อสัปดาห์ พนักงานไม่จำเป็นต้องทำงานมากกว่า 8 ชั่วโมงต่อวัน และการทำงานล่วงเวลาต้องรายงานทุกวัน/ทุกเดือน\n• พนักงานได้รับการรับประกันเงินเดือนพื้นฐานตามข้อตกลงกับสหภาพแรงงาน GS โดยมีเงื่อนไขว่าต้องปฏิบัติตามมาตรฐานและชั่วโมงทำงานและตอบสนองข้อกำหนดด้านคุณภาพและประสิทธิภาพของสวีเดนต่อชั่วโมง",
    },
    {
      heading: "มาตรฐานคุณภาพ",
      body: "• คำแนะนำเกี่ยวกับมาตรฐานคุณภาพที่ให้โดยนายจ้างและผู้ประสานงานสำหรับแต่ละแปลงต้องปฏิบัติตามอย่างเคร่งครัด และการเบี่ยงเบนใด ๆ อาจส่งผลให้ถูกหักเงินเดือนตามการประเมินของลูกค้า\n• หากไม่เป็นไปตามมาตรฐานคุณภาพ ค่าตอบแทนของพนักงานจะถูกระงับจนกว่างานจะได้รับการแก้ไข (หากเป็นไปได้) หรือจนกว่าพนักงานจะจ่ายค่าชดเชยที่จำเป็น ตัวอย่างเช่น การจ่ายเงินสำหรับต้นกล้าที่แห้งหรือถูกทิ้งเนื่องจากการดูแลพืชที่ไม่ดี หรือค่าชดเชยความเสียหายที่เกิดจากไฟไหม้หรือความเสียหายโดยเจตนาอื่น ๆ ของพนักงาน",
    },
    {
      heading: "คำแนะนำการปลูก",
      body: "• การปลูกต้องเป็นไปตามคำแนะนำ ข้อผิดพลาดจะถูกลงโทษและเรียกเก็บ\n• ห้ามปลูกต้นกล้าที่แห้ง พนักงานรับผิดชอบในการรดน้ำต้นกล้า\n• กล่องกระดาษแข็งต้องนำไปรีไซเคิล และกล่องพลาสติกต้องจัดเก็บอย่างถูกต้อง\n• หากต้นกล้าถูกส่งมาในกล่องกระดาษแข็งหรือพลาสติก พนักงานรับผิดชอบในการรวบรวมกล่องกระดาษแข็งและขนส่งไปยังศูนย์รีไซเคิลหรือสถานที่อื่นที่กำหนด ในขณะที่กล่องพลาสติกต้องวางบนพาเลทและบรรจุใหม่อย่างระมัดระวัง",
    },
    {
      heading: "ที่พัก",
      body: "• มีกระท่อมให้สำหรับพนักงานทุกคน และสามารถเลือกใช้หรือไม่ก็ได้\n• ห้ามทิ้งอาหาร เสื้อผ้า ขยะในครัวเรือน หรือสิ่งของส่วนตัวหรือของบริษัทอื่น ๆ ไว้ในที่พักเช่าหลังจากที่พนักงานย้ายออกแล้ว",
    },
    {
      heading: "การสื่อสารและการรายงาน",
      body: "• ความไม่แน่ใจทั้งหมดต้องได้รับการสื่อสาร และปัญหาใด ๆ ต้องรายงานต่อผู้ประสานงาน\n• หากคุณไม่แน่ใจว่าจะจัดการหรือปลูกในแปลงอย่างไร คุณต้องติดต่อผู้ประสานงานโดยเร็วที่สุด\n• หากคุณสังเกตเห็นสิ่งผิดปกติในแปลง คุณต้องแจ้งผู้ประสานงานทันที",
    },
    {
      heading: "การสิ้นสุดการจ้างงาน",
      body: "• หากทีมหรือสมาชิกในทีมต้องการยุติความร่วมมือกับ Ljungan Skogsvård AB ต้องปฏิบัติตามข้อกำหนดต่อไปนี้:\n  A. หากพนักงานทำงานให้กับ Ljungan Skogsvård AB เป็นเวลาหนึ่ง (1) ปีขึ้นไป ต้องแจ้งผู้บริหารบริษัทล่วงหน้าอย่างน้อย 1 เดือน\n  B. หากพนักงานเป็นคนใหม่ที่ Ljungan Skogsvård AB ต้องแจ้งผู้บริหารบริษัทล่วงหน้าอย่างน้อย 3 สัปดาห์\n• หากไม่ปฏิบัติตามกำหนดเวลาเหล่านี้ เงินเดือนเดือนสุดท้ายจะถูกระงับ\n• การสิ้นสุดฤดูกาลทำงานต้องวางแผนร่วมกับผู้บริหารบริษัท แต่จะไม่เกิดขึ้นจนกว่างานที่ทำสัญญาจะเสร็จสมบูรณ์หรือสภาพอากาศไม่อนุญาตให้ดำเนินงานในสภาวะที่เหมาะสมและปลอดภัย การไม่ปฏิบัติตามกำหนดเวลาจะถูกลงโทษด้วยการระงับเงินเดือนเดือนสุดท้าย",
    },
    {
      heading: "กิจกรรมต้องห้าม",
      body: "• กิจกรรมใด ๆ ที่ถือว่าเป็นอันตรายและอาจเสี่ยงต่อชีวิตและสุขภาพของพนักงานจะต้องไม่ดำเนินการ ความปลอดภัยและสุขภาพเป็นสิ่งสำคัญที่สุดในการดำเนินงาน ตามด้วยผลผลิต\n• เหตุการณ์ทั้งหมดที่ก่อให้เกิดความเครียดหรือความไม่สบายต้องรายงานเป็นลายลักษณ์อักษรทันทีเพื่อดำเนินมาตรการที่จำเป็น",
    },
    {
      heading: "อุปกรณ์และการบำรุงรักษา",
      body: "• อุปกรณ์ที่จัดให้ต้องรักษาให้อยู่ในสภาพใช้งานได้และทำความสะอาด/บำรุงรักษาทุกสัปดาห์",
    },
    {
      heading: "สภาพแวดล้อมการทำงาน",
      body: "• การรักษาบรรยากาศที่ดีและสภาพแวดล้อมการทำงานที่น่ารื่นรมย์เป็นความรับผิดชอบของพนักงานทุกคน ในกรณีที่มีปัญหาส่วนตัว พนักงานต้องติดต่อผู้ประสานงานเพื่อดำเนินมาตรการที่จำเป็น",
    },
    {
      heading: "การจัดการเชื้อเพลิง",
      body: "• พนักงานไม่อาจขนส่งน้ำมันเบนซิน ASPEN หรือเชื้อเพลิงอื่น ๆ ในภาชนะที่ไม่ได้รับอนุมัติตามมาตรฐาน PEFC การขนส่งเชื้อเพลิงจากยานพาหนะไปยังสถานที่ทำงานอนุญาตเฉพาะในภาชนะที่ได้รับอนุมัติเท่านั้น และห้ามติดหรือผูกกับสายรัด การไม่ปฏิบัติตามกฎเหล่านี้ถือเป็นความเสี่ยงของตนเอง และพนักงานจะต้องรับผิดชอบต่ออุบัติเหตุใด ๆ",
    },
    {
      heading: "การจัดการสารเคมี",
      body: "• พนักงานต้องปฏิบัติตามกฎการจัดการสารเคมี ห้ามบริโภค จัดการอย่างไม่ถูกต้อง หรือทาสารเคมีเช่น น้ำมันเบนซิน ASPEN ดีเซล หรือน้ำมันบนร่างกาย",
    },
    {
      heading: "ความปลอดภัยของยานพาหนะ",
      body: "• หากผู้ขับขี่ยานพาหนะบริการหรือสมาชิกในทีมสังเกตเห็นว่ายานพาหนะอยู่ในสภาพไม่ดีและเสี่ยงต่อชีวิตและสุขภาพของสมาชิกในทีมหรือผู้ใช้ถนนคนอื่น ต้องแจ้งผู้ประสานงาน",
    },
    {
      heading: "แผนที่และขั้นตอนฉุกเฉิน",
      body: "• พนักงานต้องพกแผนที่พร้อมคำแนะนำสำหรับแปลงที่ทำงานอยู่ และหัวหน้าทีมต้องทราบพิกัดฉุกเฉินบนแต่ละแผนที่ ซึ่งทำเครื่องหมายด้วยสีแดง แผนที่อาจเป็นแบบกายภาพ (บนกระดาษ) หรือแบบอิเล็กทรอนิกส์ (ดาวน์โหลดบนโทรศัพท์/แท็บเล็ต)\n• ในกรณีฉุกเฉิน พนักงานต้องโทร 112 และแจ้งพิกัดฉุกเฉินบนแผนที่ ซึ่งระบุตำแหน่งที่ความช่วยเหลือสามารถเข้าถึงได้",
    },
    {
      heading: "การเลือกปฏิบัติและการรักษาความลับ",
      body: "• ห้ามเลือกปฏิบัติบนพื้นฐานของเชื้อชาติ เพศ หรือศาสนา ทั้งในที่ทำงานและในสังคม\n• ห้ามกล่าวร้าย Ljungan Skogsvård AB อย่างมุ่งร้าย แบ่งปันความลับ หรือเปิดเผยข้อมูลที่เป็นความลับ การไม่ปฏิบัติตามกฎเหล่านี้จะส่งผลให้ถูกลงโทษ รวมถึงการหักเงินเดือนและการเรียกร้องค่าชดเชยจาก Ljungan Skogsvård AB",
    },
    {
      heading: "การใช้ยานพาหนะของบริษัท",
      body: "• ห้ามใช้ยานพาหนะของบริษัทเพื่อวัตถุประสงค์ส่วนตัว อนุญาตให้ใช้เฉพาะสำหรับกิจกรรมที่ Ljungan Skogsvård AB กำหนดและสำหรับการจัดหาสิ่งจำเป็นสำหรับการดำเนินงาน (อาหาร เสื้อผ้า ดีเซล) การเดินทางเพื่อวัตถุประสงค์อื่นจะถูกเรียกเก็บเงินส่วนตัว",
    },
    {
      heading: "การยื่นภาษี",
      body: "• การยื่นภาษีรายได้เป็นเรื่องส่วนบุคคล และเป็นความรับผิดชอบของพนักงานแต่ละคนในการกรอกและยื่นต่อสำนักงานสรรพากรสวีเดน (Skatteverket) Ljungan Skogsvård ไม่มีหน้าที่ยื่นแบบภาษีของพนักงาน แต่สามารถช่วยเหลือได้หากจำเป็น",
    },
    {
      heading: "การระบุและรายงานความเสี่ยง",
      body: "• การระบุและรายงานความเสี่ยงเป็นส่วนสำคัญของการดำเนินงาน ดังนั้น พนักงานทุกคนมีหน้าที่รับผิดชอบในการรักษาสภาพแวดล้อมการทำงานที่ปลอดภัยและมีส่วนร่วมในการปรับปรุง\n• ในแต่ละยานพาหนะมี \"การประเมินความเสี่ยง\" ที่ระบุความเสี่ยงที่อาจเกิดขึ้นและมาตรการที่ต้องดำเนินการร่วมกับบริษัทเพื่อป้องกันอุบัติเหตุในที่ทำงาน เป็นหน้าที่ของคุณที่จะอ่านและทำความคุ้นเคยกับความเสี่ยงเหล่านี้และดำเนินมาตรการที่จำเป็นเพื่อป้องกันอุบัติเหตุ",
    },
    {
      heading: "สิ่งของสุขอนามัยส่วนบุคคล",
      body: "• พนักงานรับผิดชอบในการนำสิ่งของสุขอนามัยส่วนตัวมาเอง รวมถึงผ้าปูที่นอนสำหรับหมอนและผ้าห่ม ปลอกหมอน ผ้าขนหนู รองเท้าแตะ ฯลฯ บริษัทไม่จัดหาสิ่งของเหล่านี้ และการใช้เป็นข้อบังคับในที่พักที่กำหนด",
    },
    {
      heading: "การรับทราบและข้อตกลง",
      body: "• โดยการลงนามในสัญญาจ้างงานนี้ ข้าพเจ้ายืนยันว่าได้อ่าน รับ และได้รับสำเนาของข้อความข้างต้น และสมัครใจที่จะปฏิบัติตามกฎเหล่านี้ ในกรณีที่ไม่ปฏิบัติตาม ข้าพเจ้ายอมรับการลงโทษที่เหมาะสม\n• ข้าพเจ้ามุ่งมั่นที่จะปฏิบัติตามกฎภายในของบริษัทและกฎหมายสวีเดนรวมถึงกฎหมายของประเทศบ้านเกิด ข้าพเจ้ายืนยันว่าได้รับแจ้งเกี่ยวกับสิ่งเหล่านี้และมีโอกาสขอคำชี้แจง\n• ข้าพเจ้ายังได้รับแจ้งว่าบริษัทที่ข้าพเจ้าทำงานให้เป็นบริษัทสวีเดน ภาษีของข้าพเจ้าจ่ายในสวีเดน และข้าพเจ้ามีสิทธิ์ได้รับสลิปเงินเดือนทุกเดือน\n• ข้าพเจ้าได้รับแจ้งว่าสามารถขอรถบ้านในพื้นที่ทำงานและเลือกที่จะใช้หรือไม่ก็ได้\n• ข้าพเจ้าได้รับแจ้งว่ามีสิทธิ์เข้าถึงการดูแลสุขภาพของสวีเดน และบริษัทที่ข้าพเจ้าทำงานให้มีข้อตกลงความร่วมมือกับ FeelGood – ที่อยู่: Bankgatan 15, 852 31 Sundsvall ข้อมูลเพิ่มเติมมีอยู่ที่ www.feelgood.se ที่นี่ข้าพเจ้าสามารถรับการสนับสนุนทางกายภาพและจิตใจ\n• ข้าพเจ้ายังได้รับแจ้งว่าข้อมูลที่ให้จะได้รับการปฏิบัติอย่างเป็นความลับ ข้าพเจ้ายินยอมให้ Ljungan Skogsvård AB ผ่านตัวแทนของบริษัท จัดเก็บข้อมูลส่วนบุคคลของข้าพเจ้า",
    },
  ],
};

/* ───────────────────── MAP ───────────────────── */
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
            {section.heading && (
              <h3 className="text-sm font-semibold text-foreground">{section.heading}</h3>
            )}
            <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">{section.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
