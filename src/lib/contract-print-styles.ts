/**
 * Shared print CSS for contract documents.
 * Used by ContractPreviewDialog and ContractDetailsStep to ensure
 * identical rendering across all print/PDF outputs.
 */
export const CONTRACT_PRINT_CSS = `
  @page { size: A4; margin: 14mm 12mm 14mm 12mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Georgia', 'Times New Roman', serif; color: #1a1a1a; background: #fff; font-size: 10pt; line-height: 1.45; }

  .contract-doc { max-width: 100%; }

  /* Header */
  .doc-header { text-align: center; padding-bottom: 10px; border-bottom: 3px double #333; margin-bottom: 12px; }
  .doc-header h1 { font-size: 14pt; font-weight: 700; letter-spacing: 2.5px; margin-bottom: 2px; font-family: 'Arial', 'Helvetica', sans-serif; }
  .doc-subtitle { font-size: 8.5pt; color: #555; letter-spacing: 0.5px; }
  .doc-legal-lang { font-size: 7.5pt; color: #666; margin-top: 4px; font-style: italic; letter-spacing: 0.3px; border-top: 1px solid #ccc; padding-top: 4px; }

  /* Section titles */
  .section-title { font-family: 'Arial', 'Helvetica', sans-serif; font-size: 10pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; border-bottom: 2px solid #333; padding-bottom: 2px; margin-top: 12px; margin-bottom: 6px; color: #1a1a1a; }
  .sig-title { margin-top: 20px; }

  /* Field grids */
  .field-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 3px 16px; margin-bottom: 2px; }
  .field-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 3px 16px; margin-bottom: 2px; }
  .field { padding: 2px 0; border-bottom: 1px solid #e0e0e0; }
  .field-label { display: block; font-family: 'Arial', 'Helvetica', sans-serif; font-size: 7pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; color: #666; margin-bottom: 0px; }
  .field-value { display: block; font-size: 9.5pt; color: #111; min-height: 12px; }

  .subsection-label { font-family: 'Arial', 'Helvetica', sans-serif; font-size: 7.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; color: #444; margin-top: 6px; margin-bottom: 3px; }

  /* Info blocks */
  .info-block { background: #f8f8f8; border-left: 3px solid #ccc; padding: 5px 10px; margin-bottom: 4px; font-size: 9pt; line-height: 1.4; }
  .info-block p { margin-bottom: 3px; }
  .info-sv { font-style: italic; color: #444; }
  .info-sv-inline { font-style: italic; color: #444; }
  .info-list { margin: 3px 0 4px 16px; font-size: 8.5pt; }
  .info-list li { margin-bottom: 1px; }
  .info-text-muted { color: #888; font-style: italic; font-size: 8.5pt; }
  .legal-notes p { margin-bottom: 4px; font-size: 9pt; }

  /* Checklists */
  .checklist { margin-bottom: 4px; }
  .check-item { font-size: 9.5pt; margin-bottom: 2px; }
  .training-mandatory-note { font-size: 8.5pt; color: #444; margin-bottom: 4px; font-style: italic; }
  .training-mandatory-badge { display: inline-block; font-family: 'Arial', 'Helvetica', sans-serif; font-size: 6pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #b91c1c; border: 1px solid #b91c1c; border-radius: 2px; padding: 0 3px; margin-left: 4px; vertical-align: middle; }

  /* Deduction table */
  .deduction-table { width: 100%; border-collapse: collapse; margin-bottom: 4px; font-size: 9pt; }
  .deduction-table th { font-family: 'Arial', 'Helvetica', sans-serif; font-size: 7pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #555; text-align: left; padding: 3px 6px; border-bottom: 2px solid #999; }
  .deduction-table td { padding: 3px 6px; border-bottom: 1px solid #ddd; }

  /* Signatures */
  .signatures-section { margin-top: 20px; }
  .sig-intro { font-size: 8.5pt; color: #555; margin-bottom: 14px; font-style: italic; }
  .sig-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
  .sig-column { display: flex; flex-direction: column; gap: 14px; }
  .sig-field { display: flex; flex-direction: column; }
  .sig-line { border-bottom: 1px solid #555; height: 24px; display: flex; align-items: flex-end; padding-bottom: 2px; }
  .sig-line-tall { height: 34px; }
  .sig-prefill { font-size: 9.5pt; }
  .sig-label { font-family: 'Arial', 'Helvetica', sans-serif; font-size: 6.5pt; color: #777; margin-top: 1px; text-transform: uppercase; letter-spacing: 0.4px; }
  .sig-date { font-size: 6.5pt; color: #999; margin-top: 1px; }
  .sig-img { height: 28px; object-fit: contain; }

  /* Alert info blocks */
  .info-block-alert { border-left: 3px solid #b91c1c !important; background: rgba(185,28,28,0.06) !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .info-block-alert p { color: #b91c1c !important; }

  /* Page break control */
  .page-break-avoid { page-break-inside: avoid; break-inside: avoid; }
  .signatures-section { page-break-inside: avoid; break-inside: avoid; }
  .field-grid-2, .field-grid-3 { page-break-inside: avoid; break-inside: avoid; }
  .info-block { page-break-inside: avoid; break-inside: avoid; }
  .deduction-table { page-break-inside: avoid; break-inside: avoid; }
  h2.section-title { page-break-after: avoid; break-after: avoid; }

  .whitespace-pre-wrap { white-space: pre-wrap; }
`;
