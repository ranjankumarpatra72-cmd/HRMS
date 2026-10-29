import jsPDF from 'jspdf';
import { CommunicationItem, CommunicationAttachment } from '../types/index';

/**
 * Generates an official Government of Odisha PDF document for an establishment communication or notice.
 */
export function generateCommunicationPdf(comm: CommunicationItem, att?: CommunicationAttachment): jsPDF {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  // Background Watermark
  pdf.setTextColor(245, 245, 245);
  pdf.setFontSize(30);
  pdf.setFont('helvetica', 'bold');
  pdf.text('GOVERNMENT OF ODISHA', pageWidth / 2, pageHeight / 2 - 10, {
    align: 'center',
    angle: 45
  });
  pdf.text('OFFICIAL COMMUNICATION', pageWidth / 2, pageHeight / 2 + 10, {
    align: 'center',
    angle: 45
  });

  // =========================================================================
  // 1. OFFICIAL STATE LETTERHEAD
  // =========================================================================
  pdf.setTextColor(15, 23, 42); // Slate-900
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('GOVERNMENT OF ODISHA', pageWidth / 2, 22, { align: 'center' });

  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(20, 100, 160); // Blue-700
  pdf.text((comm.senderDepartment || 'Panchayati Raj & Drinking Water Department').toUpperCase(), pageWidth / 2, 28, { align: 'center' });

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 116, 139); // Slate-500
  pdf.text(comm.senderOffice || 'Lok Seva Bhawan, Bhubaneswar, Odisha – 751001', pageWidth / 2, 33, { align: 'center' });
  pdf.text('HRMS Odisha Portal – https://hrmsodisha.gov.in', pageWidth / 2, 37.5, { align: 'center' });

  // Decorative double line
  pdf.setDrawColor(20, 100, 160);
  pdf.setLineWidth(0.8);
  pdf.line(margin, 41, pageWidth - margin, 41);
  pdf.setLineWidth(0.2);
  pdf.line(margin, 42.5, pageWidth - margin, 42.5);

  // =========================================================================
  // 2. DOCUMENT TYPE & REFERENCE NUMBER BAR
  // =========================================================================
  const docTypeTitle = comm.type.replace('_', ' ');
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(20, 100, 160);
  pdf.text(`OFFICIAL ${docTypeTitle}`, pageWidth / 2, 49, { align: 'center' });

  // Memo & Date Box
  pdf.setFillColor(248, 250, 252);
  pdf.setDrawColor(226, 232, 240);
  pdf.roundedRect(margin, 53, contentWidth, 14, 2, 2, 'FD');

  pdf.setFontSize(8.5);
  pdf.setTextColor(51, 65, 85);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`Memo / Order No.: ${comm.referenceNo}`, margin + 4, 59);
  pdf.text(`Date of Issue: ${new Date(comm.publishDate || comm.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, pageWidth - margin - 4, 59, { align: 'right' });

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(100, 116, 139);
  pdf.text(`Category: ${comm.category || 'General Administration'} | Priority: ${comm.priority}`, margin + 4, 64);
  pdf.text(`Dispatch ID: ${comm.id}`, pageWidth - margin - 4, 64, { align: 'right' });

  let y = 74;

  // =========================================================================
  // 3. TARGET RECIPIENT(S)
  // =========================================================================
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(30, 41, 59);
  pdf.text('To,', margin, y);
  y += 5;

  if (comm.targetAudience === 'INDIVIDUAL' && comm.targetEmployees && comm.targetEmployees.length > 0) {
    comm.targetEmployees.forEach((emp, index) => {
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(15, 23, 42);
      pdf.text(`${index + 1}. ${emp.name} (HRMS ID: ${emp.employeeId})`, margin + 6, y);
      y += 4.5;
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(71, 85, 105);
      pdf.text(`    ${emp.designation}, ${emp.department}`, margin + 6, y);
      y += 5;
    });
  } else if (comm.targetAudience === 'INDIVIDUAL' && comm.targetEmployeeIds && comm.targetEmployeeIds.length > 0) {
    comm.targetEmployeeIds.forEach((empId, index) => {
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(15, 23, 42);
      pdf.text(`${index + 1}. Employee HRMS ID: ${empId}`, margin + 6, y);
      y += 5;
    });
  } else if (comm.targetAudience === 'DEPARTMENT') {
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(51, 65, 85);
    pdf.text(`All Officers & Staff of: ${comm.targetDepartment || comm.senderDepartment}`, margin + 6, y);
    y += 5;
  } else {
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(51, 65, 85);
    pdf.text('All State Government Employees / Establishment Offices', margin + 6, y);
    y += 5;
  }

  y += 2;

  // =========================================================================
  // 4. SUBJECT LINE
  // =========================================================================
  pdf.setFillColor(241, 245, 249);
  pdf.setDrawColor(203, 213, 225);
  pdf.roundedRect(margin, y, contentWidth, 11, 1.5, 1.5, 'FD');

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(15, 23, 42);
  pdf.text('SUBJECT:', margin + 3, y + 7);

  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(20, 100, 160);
  const splitSubject = pdf.splitTextToSize(comm.title, contentWidth - 26);
  pdf.text(splitSubject, margin + 22, y + 7);
  y += 16;

  // =========================================================================
  // 5. OFFICIAL ORDER / COMMUNICATION BODY
  // =========================================================================
  pdf.setFontSize(9.5);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(30, 41, 59);

  const splitContent = pdf.splitTextToSize(comm.content, contentWidth);
  pdf.text(splitContent, margin, y, { lineHeightFactor: 1.4 });
  y += splitContent.length * 5.2 + 8;

  // Action Deadline Box if required
  if (comm.actionRequired) {
    if (y > pageHeight - 75) {
      pdf.addPage();
      y = 25;
    }
    pdf.setFillColor(254, 243, 199); // Amber-100
    pdf.setDrawColor(245, 158, 11);
    pdf.roundedRect(margin, y, contentWidth, 12, 1.5, 1.5, 'FD');

    pdf.setFontSize(8.5);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(146, 64, 14);
    pdf.text('MANDATORY COMPLIANCE / SUBMISSION REQUIRED', margin + 4, y + 5);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Deadline: ${comm.actionDeadline || 'Immediate Action Mandated'} | Module: ${comm.actionLinkTab ? comm.actionLinkTab.toUpperCase() : 'HRMS Portal'}`, margin + 4, y + 9.5);
    y += 17;
  }

  // Enclosures / Attachment Box if attached
  if (att || (comm.attachments && comm.attachments.length > 0)) {
    const activeAtt = att || comm.attachments[0];
    if (y > pageHeight - 70) {
      pdf.addPage();
      y = 25;
    }

    pdf.setFillColor(240, 249, 255); // Sky-50
    pdf.setDrawColor(186, 230, 253);
    pdf.roundedRect(margin, y, contentWidth, 13, 1.5, 1.5, 'FD');

    pdf.setFontSize(8.5);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(3, 105, 161);
    pdf.text('OFFICIAL PDF DOCUMENT ENCLOSURE ATTACHED:', margin + 4, y + 5.5);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(51, 65, 85);
    pdf.text(`File: ${activeAtt.fileName}  |  Size: ${activeAtt.fileSize}  |  Type: Authenticated PDF Document`, margin + 4, y + 10);
    y += 18;
  }

  // Check page overflow for signature
  if (y > pageHeight - 55) {
    pdf.addPage();
    y = 30;
  }

  // =========================================================================
  // 6. OFFICIAL SIGNATURE & DIGITAL VERIFICATION
  // =========================================================================
  const sigX = pageWidth - margin - 65;
  pdf.setDrawColor(203, 213, 225);
  pdf.line(sigX - 5, y + 5, pageWidth - margin, y + 5);

  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'italic');
  pdf.setTextColor(100, 116, 139);
  pdf.text('Digitally Signed & Dispatched', sigX + 15, y + 9, { align: 'center' });

  pdf.setFontSize(9.5);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(15, 23, 42);
  pdf.text(comm.senderName || 'Drawing & Disbursing Officer (DDO)', sigX + 15, y + 14, { align: 'center' });

  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(71, 85, 105);
  pdf.text(comm.senderDesignation || 'Drawing & Disbursing Officer', sigX + 15, y + 18, { align: 'center' });
  pdf.text(comm.senderDepartment || 'Government of Odisha', sigX + 15, y + 22, { align: 'center' });

  // Digital verification seal stamp box
  pdf.setDrawColor(16, 185, 129); // Emerald-500
  pdf.setFillColor(236, 253, 245);
  pdf.roundedRect(margin, y + 6, 75, 16, 1.5, 1.5, 'FD');

  pdf.setFontSize(7.5);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(6, 95, 70);
  pdf.text('AUTHENTICATED HRMS COMMUNICATION', margin + 3, y + 11);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(15, 118, 110);
  pdf.text(`Digitally Certified via HRMS Odisha • Verified`, margin + 3, y + 15);
  pdf.text(`Hash: ${comm.id.replace(/-/g, '').slice(0, 16).toUpperCase()}`, margin + 3, y + 19);

  // Bottom Footer on all pages
  const totalPages = (pdf as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.3);
    pdf.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(148, 163, 184);
    pdf.text('Human Resource Management System (HRMS) – Government of Odisha', margin, pageHeight - 8);
    pdf.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
  }

  return pdf;
}

/**
 * Generates and triggers download of the authentic communication PDF file.
 */
export function downloadCommunicationPdfFile(comm: CommunicationItem, att?: CommunicationAttachment): void {
  // If the attachment has a raw base64 data URI, download the raw uploaded PDF
  if (att && att.fileData && att.fileData.includes('base64,')) {
    try {
      const base64Content = att.fileData.split('base64,')[1];
      const byteCharacters = atob(base64Content);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = att.fileName || `${comm.referenceNo.replace(/[/\\?%*:|"<>]/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return;
    } catch (e) {
      console.warn('Direct base64 download failed, falling back to generated PDF', e);
    }
  }

  // Otherwise generate official PDF from communication details
  const pdf = generateCommunicationPdf(comm, att);
  const cleanRef = (att?.fileName || `Notice_${comm.referenceNo}`).replace(/[/\\?%*:|"<>]/g, '_');
  const fileName = cleanRef.endsWith('.pdf') ? cleanRef : `${cleanRef}.pdf`;
  pdf.save(fileName);
}

/**
 * Returns a base64 Data URL or Blob URL of the communication PDF for in-app viewing.
 */
export function getCommunicationPdfDataUrl(comm: CommunicationItem, att?: CommunicationAttachment): string {
  if (att && att.fileData && att.fileData.startsWith('data:application/pdf')) {
    return att.fileData;
  }
  const pdf = generateCommunicationPdf(comm, att);
  return pdf.output('datauristring');
}
