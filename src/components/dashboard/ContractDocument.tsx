import { forwardRef } from "react";
import { format } from "date-fns";
import {
  CONTRACT_LABELS as CL,
  bilingualLabel as bl,
  primaryText as pt,
  swedishText as svt,
  type LangCode,
} from "@/lib/contract-translations";

interface SigningMetadata {
  place?: string | null;
  date?: string | null;
  ip?: string | null;
  signedAt?: string | null;
}

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
  employeeSigningMetadata?: SigningMetadata | null;
  employerSigningMetadata?: SigningMetadata | null;
}

function fmtDate(val: string | null | undefined): string {
  if (!val) return "—";
  // If already YYYY-MM-DD, return as-is to avoid UTC date shift
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  try {
    const d = new Date(val);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch { return val; }
}

export const ContractDocument = forwardRef<HTMLDivElement, ContractDocumentProps>(
  function ContractDocument(props, ref) {
    const {
      companyName, companyOrgNumber, companyAddress, companyPostcode, companyCity,
      contractCode, seasonYear, formData: fd,
      employeeSignatureUrl, employerSignatureUrl, employeeSignedAt, employerSignedAt,
      employeeSigningMetadata, employerSigningMetadata,
    } = props;

    const lang: LangCode = fd.contractLanguage || "EN/SE";
    const isSEOnly = lang === "SE";

    // Employment form labels – bilingual via translations
    const efMap: Record<string, typeof CL.ef_permanent> = {
      permanent: CL.ef_permanent,
      probation: CL.ef_probation,
      "fixed-term": CL.ef_fixedTerm,
      "temp-replacement": CL.ef_tempReplacement,
      seasonal: CL.ef_seasonal,
      "age-69": CL.ef_age69,
    };
    const efLabel = efMap[fd.employmentForm]
      ? bl(efMap[fd.employmentForm], lang)
      : fd.employmentForm || "—";

    // Frequency labels
    const freqMap: Record<string, typeof CL.freq_monthly> = {
      monthly: CL.freq_monthly,
      weekly: CL.freq_weekly,
      "one-time": CL.freq_oneTime,
      "per-km": CL.freq_perKm,
    };

    // Deduction type labels
    const dedMap: Record<string, typeof CL.ded_rent> = {
      rent: CL.ded_rent,
      car: CL.ded_car,
      travel: CL.ded_travel,
      immigration: CL.ded_immigration,
      other: CL.ded_other,
    };

    /** Render a bilingual info block: primary text + Swedish below */
    const InfoBlock = ({ label }: { label: typeof CL.s6_text }) => (
      <div className="info-block">
        <p><strong>{pt(label, lang)}</strong></p>
        {!isSEOnly && <p className="info-sv">{svt(label)}</p>}
      </div>
    );

    return (
      <div ref={ref} className="contract-doc">
        {/* ── HEADER ── */}
        <div className="doc-header">
          <h1>{bl(CL.title, lang)}</h1>
          <p className="doc-subtitle">
            {contractCode || "Draft"} · {bl(CL.season, lang)}: {seasonYear || new Date().getFullYear()}
          </p>
          <p className="doc-legal-lang">
            {pt(CL.legalDisclaimer, lang)}
            {!isSEOnly && <> / <span className="info-sv-inline">{svt(CL.legalDisclaimer)}</span></>}
          </p>
        </div>

        {/* ── §1 EMPLOYER ── */}
        <h2 className="section-title">§1. {bl(CL.s1_title, lang)}</h2>
        <div className="field-grid-2">
          <div className="field">
            <span className="field-label">{bl(CL.employer, lang)}</span>
            <span className="field-value">{companyName}</span>
          </div>
          <div className="field">
            <span className="field-label">{bl(CL.orgNumber, lang)}</span>
            <span className="field-value">{companyOrgNumber || "—"}</span>
          </div>
          <div className="field">
            <span className="field-label">{bl(CL.address, lang)}</span>
            <span className="field-value">{companyAddress || "—"}</span>
          </div>
          <div className="field">
            <span className="field-label">{bl(CL.postcodeCity, lang)}</span>
            <span className="field-value">{`${companyPostcode || ""} ${companyCity || ""}`.trim() || "—"}</span>
          </div>
        </div>

        {/* ── §2 EMPLOYEE ── */}
        <h2 className="section-title">§2. {bl(CL.s2_title, lang)}</h2>
        <div className="field-grid-3">
          <div className="field">
            <span className="field-label">{bl(CL.firstName, lang)}</span>
            <span className="field-value">{fd.firstName || "—"}</span>
          </div>
          <div className="field">
            <span className="field-label">{bl(CL.middleName, lang)}</span>
            <span className="field-value">{fd.middleName || "—"}</span>
          </div>
          <div className="field">
            <span className="field-label">{bl(CL.lastName, lang)}</span>
            <span className="field-value">{fd.lastName || "—"}</span>
          </div>
        </div>
        <div className="field-grid-2">
          <div className="field">
            <span className="field-label">{bl(CL.address, lang)}</span>
            <span className="field-value">{fd.address || "—"}</span>
          </div>
          <div className="field">
            <span className="field-label">{bl(CL.city, lang)}</span>
            <span className="field-value">{fd.city || "—"}</span>
          </div>
          <div className="field">
            <span className="field-label">{bl(CL.postcode, lang)}</span>
            <span className="field-value">{fd.zipCode || "—"}</span>
          </div>
          <div className="field">
            <span className="field-label">{bl(CL.country, lang)}</span>
            <span className="field-value">{fd.country || "—"}</span>
          </div>
          <div className="field">
            <span className="field-label">{bl(CL.dateOfBirth, lang)}</span>
            <span className="field-value">{fmtDate(fd.birthday)}</span>
          </div>
          <div className="field">
            <span className="field-label">{bl(CL.citizenship, lang)}</span>
            <span className="field-value">{fd.citizenship || "—"}</span>
          </div>
          <div className="field">
            <span className="field-label">{bl(CL.mobile, lang)}</span>
            <span className="field-value">{fd.mobile || "—"}</span>
          </div>
          <div className="field">
            <span className="field-label">{bl(CL.email, lang)}</span>
            <span className="field-value">{fd.email || "—"}</span>
          </div>
        </div>
        {/* Emergency Contact */}
        <p className="subsection-label">{bl(CL.emergencyContact, lang)}</p>
        <div className="field-grid-3">
          <div className="field">
            <span className="field-label">{bl(CL.firstName, lang)}</span>
            <span className="field-value">{fd.emergencyFirstName || "—"}</span>
          </div>
          <div className="field">
            <span className="field-label">{bl(CL.lastName, lang)}</span>
            <span className="field-value">{fd.emergencyLastName || "—"}</span>
          </div>
          <div className="field">
            <span className="field-label">{bl(CL.mobile, lang)}</span>
            <span className="field-value">{fd.emergencyMobile || "—"}</span>
          </div>
        </div>

        {/* ── §3 POSITION & DUTIES ── */}
        <h2 className="section-title page-break-avoid">§3. {bl(CL.s3_title, lang)}</h2>
        <div className="field-grid-2">
          <div className="field">
            <span className="field-label">{bl(CL.mainDuties, lang)}</span>
            <span className="field-value">{fd.mainDuties || "—"}</span>
          </div>
        </div>
        {(() => {
          const numJobs = String(fd.numberOfJobTypes || "1");
          const jobs = [
            { idx: 1, jt: fd.jobType, el: fd.experienceLevel },
            ...((numJobs === "2" || numJobs === "3") ? [{ idx: 2, jt: fd.jobType2, el: fd.experienceLevel2 }] : []),
            ...(numJobs === "3" ? [{ idx: 3, jt: fd.jobType3, el: fd.experienceLevel3 }] : []),
          ];
          return jobs.map(({ idx, jt, el }) => (
            <div key={idx} className="field-grid-2">
              <div className="field">
                <span className="field-label">{bl(CL.jobType, lang)}{numJobs !== "1" ? ` ${idx}` : ""}</span>
                <span className="field-value">{jt || "—"}</span>
              </div>
              <div className="field">
                <span className="field-label">{bl(CL.experienceLevel, lang)}{numJobs !== "1" ? ` ${idx}` : ""}</span>
                <span className="field-value">{el || "—"}</span>
              </div>
            </div>
          ));
        })()}
        <div className="field-grid-2">
          <div className="field">
            <span className="field-label">{bl(CL.postingLocation, lang)}</span>
            <span className="field-value">{fd.postingLocation || "—"}</span>
          </div>
          <div className="field">
            <span className="field-label">{bl(CL.mainWorkplace, lang)}</span>
            <span className="field-value">{fd.mainWorkplace || fd.postingLocation || "—"}</span>
          </div>
          <div className="field">
            <span className="field-label">{bl(CL.workplaceVaries, lang)}</span>
            <span className="field-value">
              {fd.workplaceVaries === "yes" ? bl(CL.yes, lang) : fd.workplaceVaries === "no" ? bl(CL.no, lang) : fd.workplaceVaries || "—"}
            </span>
          </div>
        </div>

        {/* ── §4 FORM OF EMPLOYMENT ── */}
        <h2 className="section-title page-break-avoid">§4. {bl(CL.s4_title, lang)}</h2>
        <div className="field-grid-2">
          <div className="field">
            <span className="field-label">{bl(CL.employmentForm, lang)}</span>
            <span className="field-value">{efLabel}</span>
          </div>
        </div>
        {fd.employmentForm === "permanent" && (
          <div className="field-grid-2">
            <div className="field">
              <span className="field-label">{bl(CL.fromDateFull, lang)}</span>
              <span className="field-value">{fmtDate(fd.permanentFromDate)}</span>
            </div>
          </div>
        )}
        {fd.employmentForm === "probation" && (
          <div className="field-grid-2">
            <div className="field">
              <span className="field-label">{bl(CL.fromDate, lang)}</span>
              <span className="field-value">{fmtDate(fd.probationFromDate)}</span>
            </div>
            <div className="field">
              <span className="field-label">{bl(CL.untilDate, lang)}</span>
              <span className="field-value">{fmtDate(fd.probationUntilDate)}</span>
            </div>
          </div>
        )}
        {fd.employmentForm === "fixed-term" && (
          <div className="field-grid-2">
            <div className="field">
              <span className="field-label">{bl(CL.fromDate, lang)}</span>
              <span className="field-value">{fmtDate(fd.fixedTermFromDate)}</span>
            </div>
            <div className="field">
              <span className="field-label">{bl(CL.untilDate, lang)}</span>
              <span className="field-value">{fmtDate(fd.fixedTermUntilDate)}</span>
            </div>
          </div>
        )}
        {fd.employmentForm === "temp-replacement" && (
          <div className="field-grid-2">
            <div className="field">
              <span className="field-label">{bl(CL.fromDate, lang)}</span>
              <span className="field-value">{fmtDate(fd.tempReplacementFromDate)}</span>
            </div>
            <div className="field">
              <span className="field-label">{bl(CL.position, lang)}</span>
              <span className="field-value">{fd.tempReplacementPosition || "—"}</span>
            </div>
          </div>
        )}
        {fd.employmentForm === "seasonal" && (
          <div className="field-grid-2">
            <div className="field">
              <span className="field-label">{bl(CL.fromDate, lang)}</span>
              <span className="field-value">{fmtDate(fd.seasonalFromDate)}</span>
            </div>
            <div className="field">
              <span className="field-label">{bl(CL.endAround, lang)}</span>
              <span className="field-value">{fmtDate(fd.seasonalEndAround)}</span>
            </div>
          </div>
        )}
        {fd.employmentForm === "age-69" && (
          <div className="field-grid-2">
            <div className="field">
              <span className="field-label">{bl(CL.fromDate, lang)}</span>
              <span className="field-value">{fmtDate(fd.age69FromDate)}</span>
            </div>
            <div className="field">
              <span className="field-label">{bl(CL.untilDate, lang)}</span>
              <span className="field-value">{fmtDate(fd.age69UntilDate)}</span>
            </div>
          </div>
        )}

        {/* Clause: contract comes into force */}
        <div className="info-block" style={{ marginTop: 8, marginBottom: 12 }}>
          <p style={{ margin: 0, fontSize: "0.78rem", color: "#1a1a1a", fontStyle: "italic" }}>
            {pt(CL.s4_comesIntoForce, lang)}
          </p>
          {lang !== "SE" && (
            <p style={{ margin: "2px 0 0", fontSize: "0.74rem", color: "#64748b", fontStyle: "italic" }}>
              {svt(CL.s4_comesIntoForce)}
            </p>
          )}
        </div>

        {/* ── §5 WORKING TIME & LEAVE ── */}
        <h2 className="section-title page-break-avoid">§5. {bl(CL.s5_title, lang)}</h2>
        <div className="field-grid-2">
          <div className="field">
            <span className="field-label">{bl(CL.workingTime, lang)}</span>
            <span className="field-value">
              {fd.workingTime === "part-time"
                ? `${bl(CL.partTime, lang)} ${fd.partTimePercent ? `(${fd.partTimePercent}%)` : ""}`
                : bl(CL.fullTime, lang)}
            </span>
          </div>
          <div className="field">
            <span className="field-label">{bl(CL.annualLeave, lang)}</span>
            <span className="field-value">{fd.annualLeaveDays ? `${fd.annualLeaveDays} ${pt(CL.days, lang)}` : "—"}</span>
          </div>
        </div>

        {/* ── §6 NOTICE PERIOD ── */}
        <h2 className="section-title page-break-avoid">§6. {bl(CL.s6_title, lang)}</h2>
        <div className="info-block">
          <p>{pt(CL.s6_text, lang)}</p>
          {!isSEOnly && <p className="info-sv">{svt(CL.s6_text)}</p>}
        </div>

        {/* ── §7 COMPENSATION ── */}
        <h2 className="section-title page-break-avoid">§7. {bl(CL.s7_title, lang)}</h2>
        <div className="field-grid-2">
          <div className="field">
            <span className="field-label">{bl(CL.salaryType, lang)}</span>
            <span className="field-value">
              {fd.salaryType === "hourly" ? bl(CL.hourly, lang) : fd.salaryType === "monthly" ? bl(CL.monthly, lang) : fd.salaryType || "—"}
            </span>
          </div>
          {fd.companyPremiumPercent && Number(fd.companyPremiumPercent) > 0 && (
            <div className="field">
              <span className="field-label">{bl(CL.companyPremium, lang)}</span>
              <span className="field-value">+{fd.companyPremiumPercent}% {pt(CL.aboveOfficialRate, lang)}</span>
            </div>
          )}
        </div>

        {/* Per-job-type salary display */}
        {(() => {
          const numJobs = String(fd.numberOfJobTypes || "1");
          return [
            { idx: 1, jt: fd.jobType, hb: fd.hourlyBasic, hp: fd.hourlyPremium, mb: fd.monthlyBasic, mp: fd.monthlyPremium },
            ...((numJobs === "2" || numJobs === "3") ? [{ idx: 2, jt: fd.jobType2, hb: fd.hourlyBasic2, hp: fd.hourlyPremium2, mb: fd.monthlyBasic2, mp: fd.monthlyPremium2 }] : []),
            ...(numJobs === "3" ? [{ idx: 3, jt: fd.jobType3, hb: fd.hourlyBasic3, hp: fd.hourlyPremium3, mb: fd.monthlyBasic3, mp: fd.monthlyPremium3 }] : []),
          ];
        })().map(({ idx, jt, hb, hp, mb, mp }) => (
          <div key={idx}>
            <p className="subsection-label">{bl(CL.jobTypeN, lang)} {idx}: {jt || "—"}</p>
            {fd.salaryType === "hourly" && (
              <div className="field-grid-2">
                <div className="field">
                  <span className="field-label">{bl(CL.hourlyBasicRate, lang)}</span>
                  <span className="field-value">{hb ? `${hb} SEK` : "—"}</span>
                </div>
                <div className="field">
                  <span className="field-label">{bl(CL.hourlyPremium, lang)}</span>
                  <span className="field-value">{hp ? `${hp} SEK` : "—"}</span>
                </div>
              </div>
            )}
            {fd.salaryType === "monthly" && (
              <div className="field-grid-2">
                <div className="field">
                  <span className="field-label">{bl(CL.monthlyBasicRate, lang)}</span>
                  <span className="field-value">{mb ? `${mb} SEK` : "—"}</span>
                </div>
                <div className="field">
                  <span className="field-label">{bl(CL.monthlyPremium, lang)}</span>
                  <span className="field-value">{mp ? `${mp} SEK` : "—"}</span>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* ── §8 SALARY DETAILS ── */}
        <h2 className="section-title page-break-avoid">§8. {bl(CL.s8_title, lang)}</h2>
        <div className="info-block info-block-alert">
          <p><strong>{pt(CL.overtimeClause, lang)}</strong></p>
          {!isSEOnly && <p className="info-sv">{svt(CL.overtimeClause)}</p>}
        </div>

        <div className="field-grid-2">
          <div className="field">
            <span className="field-label">{bl(CL.pieceWorkPay, lang)}</span>
            <span className="field-value">{fd.pieceWorkPay || "—"}</span>
          </div>
          <div className="field">
            <span className="field-label">{bl(CL.otherBenefits, lang)}</span>
            <span className="field-value">{fd.otherSalaryBenefits || "—"}</span>
          </div>
          <div className="field">
            <span className="field-label">{bl(CL.paymentMethod, lang)}</span>
            <span className="field-value">
              {fd.paymentMethod === "account" ? bl(CL.bankAccount, lang) : fd.paymentMethod === "cash" ? bl(CL.cash, lang) : fd.paymentMethod || "—"}
            </span>
          </div>
        </div>

        {/* ── §9 TRAINING ── */}
        <h2 className="section-title page-break-avoid">§9. {bl(CL.s9_title, lang)}</h2>
        <p className="training-mandatory-note">
          {pt(CL.s9_intro, lang)}
          {!isSEOnly && <> / <span className="info-sv-inline">{svt(CL.s9_intro)}</span></>}
        </p>
        <div className="checklist">
          <p className="check-item">{fd.trainingSkotselskolan ? "☑" : "☐"} <strong>Skötselskolan</strong> <span className="training-mandatory-badge">{bl(CL.mandatory, lang)}</span></p>
          <p className="check-item">{fd.trainingSYN ? "☑" : "☐"} <strong>SYN</strong> (Säkerhets- och yrkesutbildning) <span className="training-mandatory-badge">{bl(CL.mandatory, lang)}</span></p>
          {fd.trainingOtherEnabled && fd.trainingOtherText && (
            <p className="check-item">☑ {bl(CL.other, lang)}: {fd.trainingOtherText}</p>
          )}
          {!fd.trainingSkotselskolan && !fd.trainingSYN && !fd.trainingOtherText && (
            <p className="info-text-muted">{bl(CL.noTraining, lang)}</p>
          )}
        </div>

        {/* ── §10 SOCIAL SECURITY ── */}
        <h2 className="section-title page-break-avoid">§10. {bl(CL.s10_title, lang)}</h2>
        <div className="info-block">
          <p>{pt(CL.s10_text, lang)}</p>
          <ul className="info-list">
            <li>{pt(CL.s10_pension, lang)}</li>
            <li>{pt(CL.s10_tgl, lang)}</li>
            <li>{pt(CL.s10_tfa, lang)}</li>
            <li>{pt(CL.s10_ags, lang)}</li>
          </ul>
          {!isSEOnly && (
            <>
              <p className="info-sv">{svt(CL.s10_text)}</p>
              <ul className="info-list info-sv">
                <li>{svt(CL.s10_pension)}</li>
                <li>{svt(CL.s10_tgl)}</li>
                <li>{svt(CL.s10_tfa)}</li>
                <li>{svt(CL.s10_ags)}</li>
              </ul>
            </>
          )}
        </div>

        {/* ── §11 MISCELLANEOUS ── */}
        <h2 className="section-title page-break-avoid">§11. {bl(CL.s11_title, lang)}</h2>
        {fd.miscellaneousText ? (
          <div className="info-block">
            <p className="whitespace-pre-wrap">{fd.miscellaneousText}</p>
          </div>
        ) : (
          <div className="info-block">
            <p className="info-text-muted">{bl(CL.noAdditionalTerms, lang)}</p>
          </div>
        )}

        {/* ── §12 NOTES / LEGAL CLAUSES ── */}
        <h2 className="section-title page-break-avoid">§12. {bl(CL.s12_title, lang)}</h2>
        <div className="info-block legal-notes">
          <p><strong>1.</strong> {pt(CL.s12_note1, lang)}{!isSEOnly && <> / <span className="info-sv-inline">{svt(CL.s12_note1)}</span></>}</p>
          <p><strong>2.</strong> {pt(CL.s12_note2, lang)}{!isSEOnly && <> / <span className="info-sv-inline">{svt(CL.s12_note2)}</span></>}</p>
          <p><strong>3.</strong> {pt(CL.s12_note3, lang)}{!isSEOnly && <> / <span className="info-sv-inline">{svt(CL.s12_note3)}</span></>}</p>
          <p><strong>4.</strong> {pt(CL.s12_note4, lang)}{!isSEOnly && <> / <span className="info-sv-inline">{svt(CL.s12_note4)}</span></>}</p>
          <p><strong>5.</strong> {pt(CL.s12_note5, lang)}{!isSEOnly && <> / <span className="info-sv-inline">{svt(CL.s12_note5)}</span></>}</p>
        </div>

        {/* ── §13 DEDUCTIONS (conditional) ── */}
        {fd.salaryDeductions && fd.salaryDeductions.length > 0 && (
          <>
            <h2 className="section-title page-break-avoid">§13. {bl(CL.s13_title, lang)}</h2>
            <table className="deduction-table">
              <thead>
                <tr>
                  <th>{bl(CL.type, lang)}</th>
                  <th>{bl(CL.amount, lang)}</th>
                  <th>{bl(CL.frequency, lang)}</th>
                  <th>{bl(CL.note, lang)}</th>
                </tr>
              </thead>
              <tbody>
                {fd.salaryDeductions.map((d: any, i: number) => {
                  const dedLabel = dedMap[d.type]
                    ? bl(dedMap[d.type], lang)
                    : d.labelSv ? `${d.label} / ${d.labelSv}` : d.label || d.type;
                  const freqLabel = freqMap[d.frequency]
                    ? bl(freqMap[d.frequency], lang)
                    : d.frequency || "—";
                  return (
                    <tr key={i}>
                      <td data-label={bl(CL.type, lang)}>{dedLabel}</td>
                      <td data-label={bl(CL.amount, lang)}>{d.amount ? `${d.amount} SEK` : "—"}</td>
                      <td data-label={bl(CL.frequency, lang)}>{freqLabel}</td>
                      <td data-label={bl(CL.note, lang)}>{d.note || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        )}

        {/* ── SIGNATURES ── */}
        <div className="signatures-section page-break-avoid">
          <h2 className="section-title sig-title">{bl(CL.signatures, lang)}</h2>
          <p className="sig-intro">
            {pt(CL.sigIntro, lang)}
            {!isSEOnly && <> / <span className="info-sv-inline">{svt(CL.sigIntro)}</span></>}
          </p>
          <div className="sig-grid">
            <div className="sig-column">
              <div className="sig-field">
                <div className="sig-line">
                  {employerSigningMetadata?.place && employerSigningMetadata?.date && (
                    <span className="sig-prefill">{employerSigningMetadata.place}, {fmtDate(employerSigningMetadata.date)}</span>
                  )}
                </div>
                <span className="sig-label">{bl(CL.placeAndDate, lang)}</span>
              </div>
              <div className="sig-field">
                <div className="sig-line"><span className="sig-prefill">{companyName}</span></div>
                <span className="sig-label">{bl(CL.company, lang)}</span>
              </div>
              <div className="sig-field">
                <div className="sig-line sig-line-tall">
                  {employerSignatureUrl && <img src={employerSignatureUrl} alt="Employer signature" className="sig-img" />}
                </div>
                <span className="sig-label">{bl(CL.employerSignature, lang)}</span>
                {employerSignedAt && <span className="sig-date">{pt(CL.signed, lang)}: {fmtDate(employerSignedAt)}</span>}
              </div>
            </div>
            <div className="sig-column">
              <div className="sig-field">
                <div className="sig-line">
                  {employeeSigningMetadata?.place && employeeSigningMetadata?.date && (
                    <span className="sig-prefill">{employeeSigningMetadata.place}, {fmtDate(employeeSigningMetadata.date)}</span>
                  )}
                </div>
                <span className="sig-label">{bl(CL.placeAndDate, lang)}</span>
              </div>
              <div className="sig-field">
                <div className="sig-line"><span className="sig-prefill">{fd.firstName || ""} {fd.lastName || ""}</span></div>
                <span className="sig-label">{bl(CL.employee, lang)}</span>
              </div>
              <div className="sig-field">
                <div className="sig-line sig-line-tall">
                  {employeeSignatureUrl && <img src={employeeSignatureUrl} alt="Employee signature" className="sig-img" />}
                </div>
                <span className="sig-label">{bl(CL.employeeSignature, lang)}</span>
                {employeeSignedAt && <span className="sig-date">{pt(CL.signed, lang)}: {fmtDate(employeeSignedAt)}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);
