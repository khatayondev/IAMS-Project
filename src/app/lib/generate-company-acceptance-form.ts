import html2pdf from 'html2pdf.js';

export interface CompanyAcceptanceFormData {
  studentName: string;
  studentId: string;
  department: string;
  level: string;
  companyName: string;
  companyAddress?: string;
  startDate?: string;
  endDate?: string;
  universityName?: string;
}

function escapeHtml(value: string | undefined): string {
  return (value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function displayValue(value: string | undefined, fallback = "____________________"): string {
  const trimmed = value?.trim();
  return trimmed ? escapeHtml(trimmed) : fallback;
}

/**
 * Generate the form HTML as a string.
 */
function generateFormHTML(data: CompanyAcceptanceFormData): string {
  const today = new Date();
  const dateStr = today.toLocaleDateString("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `
  <div class="container" style="max-width: 8.5in; margin: 0 auto; padding: 0.25in; font-family: 'Garamond', 'Georgia', serif; line-height: 1.45; color: #222; background: white;">
    <div class="letterhead" style="text-align: center; border-bottom: 3px solid #1e3a5f; padding-bottom: 0.22in; margin-bottom: 0.28in;">
      <div class="letterhead-title" style="font-size: 18px; font-weight: bold; color: #1e3a5f;">${displayValue(data.universityName, "Ho Technical University")}</div>
      <div class="letterhead-subtitle" style="font-size: 12px; color: #555; font-style: italic; margin-top: 0.04in;">Department of Industrial Attachment & Mentoring</div>
    </div>

    <div class="meta" style="display: flex; justify-content: space-between; gap: 0.3in; font-size: 11px; margin-bottom: 0.22in;">
      <div><strong>Date Issued:</strong> ${escapeHtml(dateStr)}</div>
      <div><strong>Form:</strong> Company Acceptance</div>
    </div>

    <h1 style="text-align: center; font-size: 15px; text-transform: uppercase; margin-bottom: 0.24in; text-decoration: underline;">Company Acceptance Form</h1>

    <div class="section" style="margin-bottom: 0.22in;">
      <div class="section-title" style="font-size: 12px; font-weight: bold; color: #1e3a5f; border-bottom: 1px solid #9aa8b5; padding-bottom: 0.04in; margin-bottom: 0.1in; text-transform: uppercase;">Student Details</div>
      <div class="grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.1in 0.2in;">
        <div class="field" style="font-size: 11px; min-height: 0.28in; border-bottom: 1px solid #999; padding-bottom: 0.04in;"><strong style="display: inline-block; min-width: 1.35in; color: #333;">Name:</strong> ${displayValue(data.studentName)}</div>
        <div class="field" style="font-size: 11px; min-height: 0.28in; border-bottom: 1px solid #999; padding-bottom: 0.04in;"><strong style="display: inline-block; min-width: 1.35in; color: #333;">Student ID:</strong> ${displayValue(data.studentId)}</div>
        <div class="field" style="font-size: 11px; min-height: 0.28in; border-bottom: 1px solid #999; padding-bottom: 0.04in;"><strong style="display: inline-block; min-width: 1.35in; color: #333;">Department:</strong> ${displayValue(data.department)}</div>
        <div class="field" style="font-size: 11px; min-height: 0.28in; border-bottom: 1px solid #999; padding-bottom: 0.04in;"><strong style="display: inline-block; min-width: 1.35in; color: #333;">Level:</strong> ${displayValue(data.level)}</div>
      </div>
    </div>

    <div class="section" style="margin-bottom: 0.22in;">
      <div class="section-title" style="font-size: 12px; font-weight: bold; color: #1e3a5f; border-bottom: 1px solid #9aa8b5; padding-bottom: 0.04in; margin-bottom: 0.1in; text-transform: uppercase;">Company Details</div>
      <div class="grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.1in 0.2in;">
        <div class="field" style="font-size: 11px; min-height: 0.28in; border-bottom: 1px solid #999; padding-bottom: 0.04in;"><strong style="display: inline-block; min-width: 1.35in; color: #333;">Company:</strong> ${displayValue(data.companyName)}</div>
        <div class="field" style="font-size: 11px; min-height: 0.28in; border-bottom: 1px solid #999; padding-bottom: 0.04in;"><strong style="display: inline-block; min-width: 1.35in; color: #333;">Department/Unit:</strong> ____________________</div>
        <div class="field" style="font-size: 11px; min-height: 0.28in; border-bottom: 1px solid #999; padding-bottom: 0.04in;"><strong style="display: inline-block; min-width: 1.35in; color: #333;">Address:</strong> ${displayValue(data.companyAddress)}</div>
        <div class="field" style="font-size: 11px; min-height: 0.28in; border-bottom: 1px solid #999; padding-bottom: 0.04in;"><strong style="display: inline-block; min-width: 1.35in; color: #333;">Phone/Email:</strong> ____________________</div>
      </div>
    </div>

    <div class="section" style="margin-bottom: 0.22in;">
      <div class="section-title" style="font-size: 12px; font-weight: bold; color: #1e3a5f; border-bottom: 1px solid #9aa8b5; padding-bottom: 0.04in; margin-bottom: 0.1in; text-transform: uppercase;">Attachment Period</div>
      <div class="grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.1in 0.2in;">
        <div class="field" style="font-size: 11px; min-height: 0.28in; border-bottom: 1px solid #999; padding-bottom: 0.04in;"><strong style="display: inline-block; min-width: 1.35in; color: #333;">Start Date:</strong> ${displayValue(data.startDate)}</div>
        <div class="field" style="font-size: 11px; min-height: 0.28in; border-bottom: 1px solid #999; padding-bottom: 0.04in;"><strong style="display: inline-block; min-width: 1.35in; color: #333;">End Date:</strong> ${displayValue(data.endDate)}</div>
      </div>
    </div>

    <p class="statement" style="font-size: 12px; text-align: justify; margin: 0.15in 0;">
      We confirm that the company named above accepts the student for industrial attachment.
      The student will be assigned suitable duties and supervised during the stated period.
    </p>

    <div class="section" style="margin-bottom: 0.22in;">
      <div class="section-title" style="font-size: 12px; font-weight: bold; color: #1e3a5f; border-bottom: 1px solid #9aa8b5; padding-bottom: 0.04in; margin-bottom: 0.1in; text-transform: uppercase;">Industry Supervisor</div>
      <div class="grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.1in 0.2in;">
        <div class="field" style="font-size: 11px; min-height: 0.28in; border-bottom: 1px solid #999; padding-bottom: 0.04in;"><strong style="display: inline-block; min-width: 1.35in; color: #333;">Name:</strong> ____________________</div>
        <div class="field" style="font-size: 11px; min-height: 0.28in; border-bottom: 1px solid #999; padding-bottom: 0.04in;"><strong style="display: inline-block; min-width: 1.35in; color: #333;">Job Title:</strong> ____________________</div>
        <div class="field" style="font-size: 11px; min-height: 0.28in; border-bottom: 1px solid #999; padding-bottom: 0.04in;"><strong style="display: inline-block; min-width: 1.35in; color: #333;">Email:</strong> ____________________</div>
        <div class="field" style="font-size: 11px; min-height: 0.28in; border-bottom: 1px solid #999; padding-bottom: 0.04in;"><strong style="display: inline-block; min-width: 1.35in; color: #333;">Phone:</strong> ____________________</div>
      </div>
    </div>

    <div class="signature-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.35in; margin-top: 0.35in;">
      <div class="signature-line" style="border-top: 1px solid #333; padding-top: 0.05in; font-size: 11px;">Industry Supervisor Signature / Date</div>
      <div class="signature-line" style="border-top: 1px solid #333; padding-top: 0.05in; font-size: 11px;">Company Stamp</div>
    </div>

    <div class="note" style="font-size: 10px; color: #555; border: 1px solid #c9d3dc; padding: 0.1in; margin-top: 0.18in;">
      After signing, the student should scan or photograph this form and upload it in the IAMS Documents page.
    </div>
  </div>
  `;
}

/**
 * Generate and directly download a PDF of the company acceptance form.
 */
export async function downloadCompanyAcceptanceFormPDF(data: CompanyAcceptanceFormData): Promise<boolean> {
  try {
    const htmlString = generateFormHTML(data);
    
    // Create a temporary element wrapper
    const workerContainer = document.createElement('div');
    workerContainer.innerHTML = htmlString.trim();
    
    // CRITICAL: html2canvas completely ignores capturing nodes styled with absolute coordinates off-screen.
    // Instead, keep it inside the normal browser layer flow but use opacity to hide it visually.
    workerContainer.style.position = 'fixed';
    workerContainer.style.opacity = '0';
    workerContainer.style.pointerEvents = 'none';
    
    document.body.appendChild(workerContainer);

    const safeFileName = `Acceptance_Form_${data.studentName.replace(/\s+/g, '_')}.pdf`;

    const opt = {
      margin: 0, // Inline padding handles internal layouts securely
      filename: safeFileName,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        letterRendering: true,
        logging: false
      },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    // Execute generation pipeline
    await html2pdf().set(opt).from(workerContainer).save();

    // Clean up DOM components
    document.body.removeChild(workerContainer);
    return true;
  } catch (error) {
    console.error('PDF generation failed:', error);
    return false;
  }
}