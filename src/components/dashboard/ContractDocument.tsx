import { forwardRef } from "react";
import { format } from "date-fns";

interface ContractDocumentProps {
  companyName: string;
  companyOrgNumber?: string | null;
  companyAddress?: string | null;
  companyPostcode?: string | null;
  companyCity?: string | null;
  contractCode?: string | null;
  seasonYear?: string | null;
  formData: Record<string, any>;
  employeeSignatureUrl?: string | null;
  employerSignatureUrl?: string | null;
  employeeSignedAt?: string | null;
  employerSignedAt?: string | null;
}

function fmtDate(val: string | null | undefined): string {
  if (!val) return "—";
  try { return format(new Date(val), "yyyy-MM-dd"); } catch { return val; }
}

/**
 * Full employment contract rendered as a printable document.
 * Every section (1–13) is always rendered. Conditional content appears only where relevant.
 * Print CSS is handled externally via the print handler.
 */
export const ContractDocument = forwardRef<HTMLDivElement, ContractDocumentProps>(
  function ContractDocument(props, ref) {
    const {
      companyName, companyOrgNumber, companyAddress, companyPostcode, companyCity,
      contractCode, seasonYear, formData: fd,
      employeeSignatureUrl, employerSignatureUrl, employeeSignedAt, employerSignedAt,
    } = props;

    const employmentFormLabels: Record<string, [string, string]> = {
      permanent: ["Permanent", "Tillsvidareanställning"],
      probation: ["Probationary", "Provanställning"],
      "fixed-term": ["Fixed-term", "Tidsbegränsad anställning"],
      "temp-replacement": ["Temporary replacement", "Vikariat"],
      seasonal: ["Seasonal", "Säsongsanställning"],
      "age-69": ["Age 69+", "Anställning efter 69 år"],
    };

    const efLabels = employmentFormLabels[fd.employmentForm] || [fd.employmentForm, ""];

    const frequencyLabels: Record<string, string> = {
      monthly: "Monthly / Månadsvis",
      weekly: "Weekly / Veckovis",
      "one-time": "One-time / Engångs",
      "per-km": "Per km / Per km",
    };

    const deductionTypeLabels: Record<string, string> = {
      rent: "Rent / Accommodation / Hyra / Boende",
      car: "Company Car Usage / Tjänstebil",
      travel: "Travel Costs / Resekostnader",
      immigration: "Immigration Process Fees / Migrationsverkets avgifter",
      other: "Other Deduction / Annat avdrag",
    };

    return (
      <div ref={ref} className="contract-doc">
        {/* ── HEADER ── */}
        <div className="doc-header">
          <h1>EMPLOYMENT CONTRACT / ANSTÄLLNINGSAVTAL</h1>
          <p className="doc-subtitle">
            {contractCode || "Draft"} · Season / Säsong: {seasonYear || new Date().getFullYear()}
          </p>
          <p className="doc-legal-lang">The legally binding language of this contract is Swedish. / <span className="info-sv-inline">Det juridiskt bindande språket i detta avtal är svenska.</span></p>
        </div>

        {/* ── §1 EMPLOYER ── */}
        <h2 className="section-title">§1. Employer / Arbetsgivare</h2>
        <div className="field-grid-2">
          <div className="field">
            <span className="field-label">Employer / Arbetsgivare</span>
            <span className="field-value">{companyName}</span>
          </div>
          <div className="field">
            <span className="field-label">Organization Number / Organisationsnummer</span>
            <span className="field-value">{companyOrgNumber || "—"}</span>
          </div>
          <div className="field">
            <span className="field-label">Address / Adress</span>
            <span className="field-value">{companyAddress || "—"}</span>
          </div>
          <div className="field">
            <span className="field-label">Postcode & City / Postnummer & Ort</span>
            <span className="field-value">{`${companyPostcode || ""} ${companyCity || ""}`.trim() || "—"}</span>
          </div>
        </div>

        {/* ── §2 EMPLOYEE ── */}
        <h2 className="section-title">§2. Employee / Arbetstagare</h2>
        <div className="field-grid-3">
          <div className="field">
            <span className="field-label">First Name / Förnamn</span>
            <span className="field-value">{fd.firstName || "—"}</span>
          </div>
          <div className="field">
            <span className="field-label">Middle Name / Mellannamn</span>
            <span className="field-value">{fd.middleName || "—"}</span>
          </div>
          <div className="field">
            <span className="field-label">Last Name / Efternamn</span>
            <span className="field-value">{fd.lastName || "—"}</span>
          </div>
        </div>
        <div className="field-grid-2">
          <div className="field">
            <span className="field-label">Address / Adress</span>
            <span className="field-value">{fd.address || "—"}</span>
          </div>
          <div className="field">
            <span className="field-label">City / Ort</span>
            <span className="field-value">{fd.city || "—"}</span>
          </div>
          <div className="field">
            <span className="field-label">Postcode / Postnummer</span>
            <span className="field-value">{fd.zipCode || "—"}</span>
          </div>
          <div className="field">
            <span className="field-label">Country / Land</span>
            <span className="field-value">{fd.country || "—"}</span>
          </div>
          <div className="field">
            <span className="field-label">Date of Birth / Födelsedatum</span>
            <span className="field-value">{fmtDate(fd.birthday)}</span>
          </div>
          <div className="field">
            <span className="field-label">Citizenship / Medborgarskap</span>
            <span className="field-value">{fd.citizenship || "—"}</span>
          </div>
          <div className="field">
            <span className="field-label">Mobile / Mobilnummer</span>
            <span className="field-value">{fd.mobile || "—"}</span>
          </div>
          <div className="field">
            <span className="field-label">Email / E-post</span>
            <span className="field-value">{fd.email || "—"}</span>
          </div>
        </div>
        {/* Emergency Contact */}
        <p className="subsection-label">Emergency Contact / Nödkontakt</p>
        <div className="field-grid-3">
          <div className="field">
            <span className="field-label">First Name / Förnamn</span>
            <span className="field-value">{fd.emergencyFirstName || "—"}</span>
          </div>
          <div className="field">
            <span className="field-label">Last Name / Efternamn</span>
            <span className="field-value">{fd.emergencyLastName || "—"}</span>
          </div>
          <div className="field">
            <span className="field-label">Mobile / Mobilnummer</span>
            <span className="field-value">{fd.emergencyMobile || "—"}</span>
          </div>
        </div>

        {/* ── §3 POSITION & DUTIES ── */}
        <h2 className="section-title page-break-avoid">§3. Position & Duties / Befattning & Arbetsuppgifter</h2>
        <div className="field-grid-2">
          <div className="field">
            <span className="field-label">Main Duties / Huvudsakliga Arbetsuppgifter</span>
            <span className="field-value">{fd.mainDuties || "—"}</span>
          </div>
          <div className="field">
            <span className="field-label">Job Type / Anställningstyp</span>
            <span className="field-value">{fd.jobType || "—"}</span>
          </div>
          <div className="field">
            <span className="field-label">Experience Level / Erfarenhetsnivå</span>
            <span className="field-value">{fd.experienceLevel || "—"}</span>
          </div>
          <div className="field">
            <span className="field-label">Posting Location / Stationeringsort</span>
            <span className="field-value">{fd.postingLocation || "—"}</span>
          </div>
          <div className="field">
            <span className="field-label">Main Workplace / Huvudarbetsplats</span>
            <span className="field-value">{fd.mainWorkplace || fd.postingLocation || "—"}</span>
          </div>
          <div className="field">
            <span className="field-label">Workplace Varies / Arbetsplats Varierar</span>
            <span className="field-value">{fd.workplaceVaries === "yes" ? "Yes / Ja" : fd.workplaceVaries === "no" ? "No / Nej" : fd.workplaceVaries || "—"}</span>
          </div>
        </div>

        {/* ── §4 FORM OF EMPLOYMENT ── */}
        <h2 className="section-title page-break-avoid">§4. Form of Employment / Anställningsform</h2>
        <div className="field-grid-2">
          <div className="field">
            <span className="field-label">Employment Form / Anställningsform</span>
            <span className="field-value">{efLabels[0]} / {efLabels[1]}</span>
          </div>
        </div>
        {fd.employmentForm === "permanent" && (
          <div className="field-grid-2">
            <div className="field">
              <span className="field-label">From Date / Från Datum</span>
              <span className="field-value">{fmtDate(fd.permanentFromDate)}</span>
            </div>
          </div>
        )}
        {fd.employmentForm === "probation" && (
          <div className="field-grid-2">
            <div className="field">
              <span className="field-label">From / Från</span>
              <span className="field-value">{fmtDate(fd.probationFromDate)}</span>
            </div>
            <div className="field">
              <span className="field-label">Until / Till</span>
              <span className="field-value">{fmtDate(fd.probationUntilDate)}</span>
            </div>
          </div>
        )}
        {fd.employmentForm === "fixed-term" && (
          <div className="field-grid-2">
            <div className="field">
              <span className="field-label">From / Från</span>
              <span className="field-value">{fmtDate(fd.fixedTermFromDate)}</span>
            </div>
            <div className="field">
              <span className="field-label">Until / Till</span>
              <span className="field-value">{fmtDate(fd.fixedTermUntilDate)}</span>
            </div>
          </div>
        )}
        {fd.employmentForm === "temp-replacement" && (
          <div className="field-grid-2">
            <div className="field">
              <span className="field-label">From / Från</span>
              <span className="field-value">{fmtDate(fd.tempReplacementFromDate)}</span>
            </div>
            <div className="field">
              <span className="field-label">Position / Befattning</span>
              <span className="field-value">{fd.tempReplacementPosition || "—"}</span>
            </div>
          </div>
        )}
        {fd.employmentForm === "seasonal" && (
          <div className="field-grid-2">
            <div className="field">
              <span className="field-label">From / Från</span>
              <span className="field-value">{fmtDate(fd.seasonalFromDate)}</span>
            </div>
            <div className="field">
              <span className="field-label">End Around / Slutar Omkring</span>
              <span className="field-value">{fmtDate(fd.seasonalEndAround)}</span>
            </div>
          </div>
        )}
        {fd.employmentForm === "age-69" && (
          <div className="field-grid-2">
            <div className="field">
              <span className="field-label">From / Från</span>
              <span className="field-value">{fmtDate(fd.age69FromDate)}</span>
            </div>
            <div className="field">
              <span className="field-label">Until / Till</span>
              <span className="field-value">{fmtDate(fd.age69UntilDate)}</span>
            </div>
          </div>
        )}

        {/* ── §5 WORKING TIME & LEAVE ── */}
        <h2 className="section-title page-break-avoid">§5. Working Time & Leave / Arbetstid & Semester</h2>
        <div className="field-grid-2">
          <div className="field">
            <span className="field-label">Working Time / Arbetstid</span>
            <span className="field-value">
              {fd.workingTime === "part-time" ? `Part-time / Deltid ${fd.partTimePercent ? `(${fd.partTimePercent}%)` : ""}` : "Full-time / Heltid"}
            </span>
          </div>
          <div className="field">
            <span className="field-label">Annual Leave / Semesterdagar</span>
            <span className="field-value">{fd.annualLeaveDays ? `${fd.annualLeaveDays} days` : "—"}</span>
          </div>
        </div>

        {/* ── §6 NOTICE PERIOD ── */}
        <h2 className="section-title page-break-avoid">§6. Notice Period / Uppsägningstid</h2>
        <div className="info-block">
          <p>Notice periods are regulated in accordance with the Swedish Employment Protection Act (LAS) and applicable collective agreements (Skogsavtalet).</p>
          <p className="info-sv">Uppsägningstider regleras i enlighet med lagen om anställningsskydd (LAS) och tillämpliga kollektivavtal (Skogsavtalet).</p>
        </div>

        {/* ── §7 COMPENSATION ── */}
        <h2 className="section-title page-break-avoid">§7. Compensation / Ersättning</h2>
        <div className="field-grid-2">
          <div className="field">
            <span className="field-label">Salary Type / Lönetyp</span>
            <span className="field-value">{fd.salaryType === "hourly" ? "Hourly / Timlön" : fd.salaryType === "monthly" ? "Monthly / Månadslön" : fd.salaryType || "—"}</span>
          </div>
          {fd.companyPremiumPercent && Number(fd.companyPremiumPercent) > 0 && (
            <div className="field">
              <span className="field-label">Company Premium / Företagspremie</span>
              <span className="field-value">+{fd.companyPremiumPercent}% above official rate</span>
            </div>
          )}
        </div>

        {/* Per-job-type salary display */}
        {[
          { idx: 1, jt: fd.jobType, hb: fd.hourlyBasic, hp: fd.hourlyPremium, mb: fd.monthlyBasic, mp: fd.monthlyPremium },
          ...((fd.numberOfJobTypes === "2" || fd.numberOfJobTypes === "3") ? [{ idx: 2, jt: fd.jobType2, hb: fd.hourlyBasic2, hp: fd.hourlyPremium2, mb: fd.monthlyBasic2, mp: fd.monthlyPremium2 }] : []),
          ...(fd.numberOfJobTypes === "3" ? [{ idx: 3, jt: fd.jobType3, hb: fd.hourlyBasic3, hp: fd.hourlyPremium3, mb: fd.monthlyBasic3, mp: fd.monthlyPremium3 }] : []),
        ].map(({ idx, jt, hb, hp, mb, mp }) => (
          <div key={idx}>
            <p className="subsection-label">Job Type {idx} / Befattningstyp {idx}: {jt || "—"}</p>
            {fd.salaryType === "hourly" && (
              <div className="field-grid-2">
                <div className="field">
                  <span className="field-label">Hourly Basic Rate / Grundtimlön</span>
                  <span className="field-value">{hb ? `${hb} SEK` : "—"}</span>
                </div>
                <div className="field">
                  <span className="field-label">Hourly Premium / Tillägg</span>
                  <span className="field-value">{hp ? `${hp} SEK` : "—"}</span>
                </div>
              </div>
            )}
            {fd.salaryType === "monthly" && (
              <div className="field-grid-2">
                <div className="field">
                  <span className="field-label">Monthly Basic Rate / Grundmånadslön</span>
                  <span className="field-value">{mb ? `${mb} SEK` : "—"}</span>
                </div>
                <div className="field">
                  <span className="field-label">Monthly Premium / Tillägg</span>
                  <span className="field-value">{mp ? `${mp} SEK` : "—"}</span>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* ── §8 SALARY DETAILS ── */}
        <h2 className="section-title page-break-avoid">§8. Salary Details / Löneuppgifter</h2>
        
        {/* Overtime clause - language-aware */}
        <div className="info-block">
          {(fd.contractLanguage === "EN/SE" || !fd.contractLanguage) && (
            <>
              <p><strong>Only ordered overtime will be compensated with overtime pay.</strong></p>
              <p className="info-sv">Endast beordrad övertid ersätts med övertidsersättning.</p>
            </>
          )}
          {fd.contractLanguage === "SE" && (
            <p><strong>Endast beordrad övertid ersätts med övertidsersättning.</strong></p>
          )}
          {fd.contractLanguage === "RO/SE" && (
            <>
              <p><strong>Doar orele suplimentare dispuse vor fi compensate cu plata orelor suplimentare.</strong></p>
              <p className="info-sv">Endast beordrad övertid ersätts med övertidsersättning.</p>
            </>
          )}
          {fd.contractLanguage === "TH/SE" && (
            <>
              <p><strong>เฉพาะการทำงานล่วงเวลาที่ได้รับคำสั่งเท่านั้นที่จะได้รับค่าชดเชยการทำงานล่วงเวลา</strong></p>
              <p className="info-sv">Endast beordrad övertid ersätts med övertidsersättning.</p>
            </>
          )}
        </div>

        <div className="field-grid-2">
          <div className="field">
            <span className="field-label">Piece Work Pay / Ackordslön</span>
            <span className="field-value">{fd.pieceWorkPay || "—"}</span>
          </div>
          <div className="field">
            <span className="field-label">Other Benefits / Övriga Förmåner</span>
            <span className="field-value">{fd.otherSalaryBenefits || "—"}</span>
          </div>
          <div className="field">
            <span className="field-label">Payment Method / Utbetalningssätt</span>
            <span className="field-value">{fd.paymentMethod === "account" ? "Bank Account / Bankkonto" : fd.paymentMethod === "cash" ? "Cash / Kontant" : fd.paymentMethod || "—"}</span>
          </div>
        </div>

        {/* ── §9 TRAINING ── */}
        <h2 className="section-title page-break-avoid">§9. Mandatory Training / Obligatorisk Utbildning</h2>
        <p className="training-mandatory-note">The following training programs are mandatory for the employee before commencing work. / <span className="info-sv-inline">Följande utbildningsprogram är obligatoriska för arbetstagaren innan arbetet påbörjas.</span></p>
        <div className="checklist">
          <p className="check-item">{fd.trainingSkotselskolan ? "☑" : "☐"} <strong>Skötselskolan</strong> <span className="training-mandatory-badge">MANDATORY / OBLIGATORISK</span></p>
          <p className="check-item">{fd.trainingSYN ? "☑" : "☐"} <strong>SYN</strong> (Säkerhets- och yrkesutbildning) <span className="training-mandatory-badge">MANDATORY / OBLIGATORISK</span></p>
          {fd.trainingOtherEnabled && fd.trainingOtherText && (
            <p className="check-item">☑ Other / Annat: {fd.trainingOtherText}</p>
          )}
          {!fd.trainingSkotselskolan && !fd.trainingSYN && !fd.trainingOtherText && (
            <p className="info-text-muted">No mandatory training programs selected. / Inga obligatoriska utbildningsprogram valda.</p>
          )}
        </div>

        {/* ── §10 SOCIAL SECURITY ── */}
        <h2 className="section-title page-break-avoid">§10. Social Security / Social Trygghet</h2>
        <div className="info-block">
          <p>Social security contributions and insurance are provided in accordance with Swedish law and applicable collective agreements. The employer shall ensure that the employee is covered by:</p>
          <ul className="info-list">
            <li>Occupational pension (Tjänstepension) as per Skogsavtalet</li>
            <li>Occupational group life insurance (TGL)</li>
            <li>Occupational injury insurance (TFA)</li>
            <li>Severance pay insurance (AGS)</li>
          </ul>
          <p className="info-sv">Sociala avgifter och försäkringar tillhandahålls i enlighet med svensk lag och tillämpliga kollektivavtal. Arbetsgivaren ska säkerställa att arbetstagaren omfattas av:</p>
          <ul className="info-list info-sv">
            <li>Tjänstepension enligt Skogsavtalet</li>
            <li>Tjänstegrupplivförsäkring (TGL)</li>
            <li>Trygghetsförsäkring vid arbetsskada (TFA)</li>
            <li>Avtalsgruppsjukförsäkring (AGS)</li>
          </ul>
        </div>

        {/* ── §11 MISCELLANEOUS ── */}
        <h2 className="section-title page-break-avoid">§11. Miscellaneous / Övrigt</h2>
        {fd.miscellaneousText ? (
          <div className="info-block">
            <p className="whitespace-pre-wrap">{fd.miscellaneousText}</p>
          </div>
        ) : (
          <div className="info-block">
            <p className="info-text-muted">No additional terms specified. / Inga ytterligare villkor angivna.</p>
          </div>
        )}

        {/* ── §12 NOTES / LEGAL CLAUSES ── */}
        <h2 className="section-title page-break-avoid">§12. Notes / Anmärkningar</h2>
        <div className="info-block legal-notes">
          <p><strong>1.</strong> This contract is governed by Swedish law and the collective agreement for the forestry sector (Skogsavtalet). / <span className="info-sv-inline">Detta avtal regleras av svensk lag och kollektivavtalet för skogssektorn (Skogsavtalet).</span></p>
          <p><strong>2.</strong> The employee is required to comply with workplace health and safety regulations (AFS). / <span className="info-sv-inline">Arbetstagaren är skyldig att följa arbetsmiljöföreskrifter (AFS).</span></p>
          <p><strong>3.</strong> Any changes to this agreement must be confirmed in writing by both parties. / <span className="info-sv-inline">Ändringar i detta avtal ska bekräftas skriftligen av båda parter.</span></p>
          <p><strong>4.</strong> Dispute resolution deadlines are governed by LAS §§ 40-42. / <span className="info-sv-inline">Frister för underrättelse och väckande av talan vid tvist om avslut av anställning finns i §§ LAS 40-42.</span></p>
          <p><strong>5.</strong> Rules for notice, information and the obligation to negotiate are set out in MBL §§ 11-14. / <span className="info-sv-inline">Regler för varsel, information och förhandlingsskyldighet finns i §§ MBL 11-14.</span></p>
        </div>

        {/* ── §13 DEDUCTIONS (conditional) ── */}
        {fd.salaryDeductions && fd.salaryDeductions.length > 0 && (
          <>
            <h2 className="section-title page-break-avoid">§13. Net Salary Deductions / Nettolöneavdrag</h2>
            <table className="deduction-table">
              <thead>
                <tr>
                  <th>Type / Typ</th>
                  <th>Amount / Belopp</th>
                  <th>Frequency / Frekvens</th>
                  <th>Note / Anteckning</th>
                </tr>
              </thead>
              <tbody>
                {fd.salaryDeductions.map((d: any, i: number) => {
                  const bilingualLabel = d.labelSv
                    ? `${d.label} / ${d.labelSv}`
                    : deductionTypeLabels[d.type] || d.label || d.type;
                  const bilingualFreq = frequencyLabels[d.frequency] || d.frequency || "—";
                  return (
                    <tr key={i}>
                      <td data-label="Type / Typ">{bilingualLabel}</td>
                      <td data-label="Amount / Belopp">{d.amount ? `${d.amount} SEK` : "—"}</td>
                      <td data-label="Frequency / Frekvens">{bilingualFreq}</td>
                      <td data-label="Note / Anteckning">{d.note || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        )}

        {/* ── SIGNATURES ── */}
        <div className="signatures-section page-break-avoid">
          <h2 className="section-title sig-title">Signatures / Underskrifter</h2>
          <p className="sig-intro">This contract has been drawn up in two identical copies, of which each party has received one. / <span className="info-sv-inline">Detta avtal har upprättats i två likalydande exemplar, varav parterna tagit var sitt.</span></p>
          <div className="sig-grid">
            <div className="sig-column">
              <div className="sig-field">
                <div className="sig-line" />
                <span className="sig-label">Place and date / Plats och datum</span>
              </div>
              <div className="sig-field">
                <div className="sig-line"><span className="sig-prefill">{companyName}</span></div>
                <span className="sig-label">Company / Företag</span>
              </div>
              <div className="sig-field">
                <div className="sig-line sig-line-tall">
                  {employerSignatureUrl && <img src={employerSignatureUrl} alt="Employer signature" className="sig-img" />}
                </div>
                <span className="sig-label">Employer's signature / Arbetsgivarens underskrift</span>
                {employerSignedAt && <span className="sig-date">Signed: {fmtDate(employerSignedAt)}</span>}
              </div>
            </div>
            <div className="sig-column">
              <div className="sig-field">
                <div className="sig-line" />
                <span className="sig-label">Place and date / Plats och datum</span>
              </div>
              <div className="sig-field">
                <div className="sig-line"><span className="sig-prefill">{fd.firstName || ""} {fd.lastName || ""}</span></div>
                <span className="sig-label">Employee / Arbetstagare</span>
              </div>
              <div className="sig-field">
                <div className="sig-line sig-line-tall">
                  {employeeSignatureUrl && <img src={employeeSignatureUrl} alt="Employee signature" className="sig-img" />}
                </div>
                <span className="sig-label">Employee's signature / Arbetstagarens underskrift</span>
                {employeeSignedAt && <span className="sig-date">Signed: {fmtDate(employeeSignedAt)}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);
