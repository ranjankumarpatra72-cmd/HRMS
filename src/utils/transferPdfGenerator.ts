import jsPDF from 'jspdf';
import { TransferRecord, TransferDocument } from '../types/index';

/**
 * Generates an official Government of Odisha PDF document for Transfer, BDO Recommendation, Relieving, or Joining orders.
 */
export function generateTransferPdf(transfer: TransferRecord, doc: TransferDocument): jsPDF {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  const docType = doc.documentType || 'Transfer Order';
  const orderNum = doc.orderNumber || transfer.orderNumber || (docType === 'Approval Order' ? 'LTR-BDO/2026/0412' : 'ORD-PRDW-2026/1185');
  const orderDate = doc.orderDate || transfer.orderDate || '18-08-2026';
  const currentBlockName = transfer.currentBlock || (transfer.currentOffice?.includes('Bijatala') ? 'Bijatala' : 'Bijatala');
  const currentDistName = transfer.currentDistrict || 'Mayurbhanj';
  const preferredBlockName = transfer.preferredBlock || 'Kaptipada';
  const preferredDistName = transfer.preferredDistrict || 'Mayurbhanj';

  // Subtle Watermark
  pdf.setTextColor(242, 242, 242);
  pdf.setFontSize(docType === 'Approval Order' ? 28 : 34);
  pdf.setFont('helvetica', 'bold');
  const watermarkText = docType === 'Approval Order'
    ? `BDO ${currentBlockName.toUpperCase()} - FORWARDING`
    : 'GOVT OF ODISHA - HRMS';
  pdf.text(watermarkText, pageWidth / 2, pageHeight / 2, {
    align: 'center',
    angle: 45
  });

  if (docType === 'Approval Order') {
    // =========================================================================
    // 1. DDO / BDO FORWARDING & RECOMMENDATION LETTER (BLOCK OFFICE LEVEL)
    // =========================================================================

    // Top Header: Current Block Office (No State Head Office / Lok Seva Bhawan)
    pdf.setTextColor(15, 23, 42); // Slate-900
    pdf.setFontSize(13);
    pdf.setFont('helvetica', 'bold');
    pdf.text('OFFICE OF THE BLOCK DEVELOPMENT OFFICER', pageWidth / 2, 20, { align: 'center' });

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(15, 118, 110); // Teal-700
    pdf.text(`${currentBlockName.toUpperCase()} BLOCK, ${currentDistName.toUpperCase()}, ODISHA`, pageWidth / 2, 26, { align: 'center' });

    pdf.setFontSize(8.5);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 116, 139);
    pdf.text(`At/Po: ${currentBlockName}, Dist: ${currentDistName}, Odisha, Pin: 757048`, pageWidth / 2, 31, { align: 'center' });
    pdf.text(`Email: bdo.${currentBlockName.toLowerCase().replace(/\s+/g, '')}@odisha.gov.in | Portal: hrmsodisha.gov.in`, pageWidth / 2, 35, { align: 'center' });

    // Divider line
    pdf.setDrawColor(15, 118, 110);
    pdf.setLineWidth(0.8);
    pdf.line(margin, 38, pageWidth - margin, 38);
    pdf.setLineWidth(0.2);
    pdf.line(margin, 39.5, pageWidth - margin, 39.5);

    // Letter Banner
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(15, 118, 110);
    pdf.text('TRANSFER APPLICATION – FORWARDING / RECOMMENDATION LETTER', pageWidth / 2, 46, { align: 'center' });

    // Letter Ref & Date Bar
    pdf.setFontSize(8.5);
    pdf.setTextColor(51, 65, 85);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Letter No.: ${orderNum}`, margin, 53);
    pdf.text(`Date: ${orderDate}`, pageWidth - margin, 53, { align: 'right' });

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.text(`HRMS Application Ref: ${transfer.requestNumber}`, margin, 58);
    pdf.text(`Document ID: ${doc.id} (v${doc.version || 1})`, pageWidth - margin, 58, { align: 'right' });

    // Divider
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.3);
    pdf.line(margin, 61, pageWidth - margin, 61);

    // Addressee: To District Collector
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(30, 41, 59);
    pdf.text('To,', margin, 67);
    pdf.text('The District Collector,', margin + 6, 72);
    pdf.text(`${currentDistName}, Odisha.`, margin + 6, 76.5);

    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(15, 118, 110);
    pdf.text('(Through Proper Channel)', margin + 6, 81.5);

    // Subject
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(15, 23, 42);
    const subjectText = `Subject: Forwarding of Transfer Application of Smt./Shri ${transfer.employeeName}, ${transfer.designation || 'Panchayat Executive Officer'}, for consideration of transfer to ${preferredBlockName} Block, ${preferredDistName} District.`;
    const subjectLines = pdf.splitTextToSize(subjectText, contentWidth);
    pdf.text(subjectLines, margin, 89);

    const afterSubjectY = 89 + subjectLines.length * 4.5;

    // Salutation
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(30, 41, 59);
    pdf.text('Sir/Madam,', margin, afterSubjectY + 3);

    // Body Paragraphs
    pdf.setFontSize(8.5);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(30, 41, 59);

    const p1 = `I am to forward herewith the transfer application of Smt./Shri ${transfer.employeeName}, ${transfer.designation || 'Panchayat Executive Officer (PEO)'} (HRMS ID: ${transfer.employeeId}), presently posted at ${transfer.currentOffice || transfer.currentBlock + ' Gram Panchayat'} under ${currentBlockName} Block, ${currentDistName} District, requesting transfer to ${preferredBlockName} Block, ${preferredDistName} District.`;

    const p2 = `The application has been examined at this office and the request of the applicant is hereby recommended/forwarded for consideration by the competent authority.`;

    const p3 = `It is therefore requested that the transfer application may kindly be considered by the District Collector, ${currentDistName}, and necessary orders may be issued as deemed appropriate under the applicable rules and administrative requirements.`;

    const p4 = `This forwarding/recommendation shall not be treated as the final transfer order. The final decision regarding the transfer shall rest with the competent authority.`;

    let yPos = afterSubjectY + 8;
    [p1, p2, p3, p4].forEach((para) => {
      const lines = pdf.splitTextToSize(para, contentWidth);
      pdf.text(lines, margin, yPos);
      yPos += lines.length * 4.2 + 2.5;
    });

    // DDO / BDO Recommendation Highlight Box
    pdf.setFillColor(240, 253, 250); // Teal-50
    pdf.roundedRect(margin, yPos + 1, contentWidth, 18, 2, 2, 'F');
    pdf.setDrawColor(45, 212, 191);
    pdf.roundedRect(margin, yPos + 1, contentWidth, 18, 2, 2, 'S');

    pdf.setFontSize(8.5);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(15, 118, 110);
    pdf.text('DDO / BDO Recommendation:', margin + 4, yPos + 6.5);

    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(15, 23, 42);
    pdf.text(`"Recommended and forwarded to the District Collector, ${currentDistName} for consideration and necessary orders."`, margin + 4, yPos + 12);

    yPos += 23;

    // Complimentary Close
    pdf.setFontSize(8.5);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(30, 41, 59);
    pdf.text('Yours faithfully,', pageWidth - margin - 50, yPos + 2);

    // Physical Signature Block and Office Seal Area
    const sigBlockY = yPos + 12;

    // Right Side: BDO Physical Signature & Designation
    pdf.setFontSize(8.5);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Signature: __________________________', pageWidth - margin - 65, sigBlockY);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Block Development Officer', pageWidth - margin - 65, sigBlockY + 6);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(71, 85, 105);
    pdf.text(`${currentBlockName} Block, ${currentDistName}`, pageWidth - margin - 65, sigBlockY + 10.5);

    // Left Side: Office Seal / Stamp Box with ample blank space
    pdf.setDrawColor(148, 163, 184); // Slate-400
    pdf.setLineWidth(0.4);
    pdf.roundedRect(margin, sigBlockY - 3, 62, 24, 2, 2, 'S');

    pdf.setFontSize(7.5);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(100, 116, 139);
    pdf.text('OFFICE SEAL / STAMP', margin + 31, sigBlockY + 3, { align: 'center' });
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.5);
    pdf.text('(Place official stamp here)', margin + 31, sigBlockY + 19, { align: 'center' });

    // Memo Distribution at the bottom
    const memoY = sigBlockY + 28;
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.3);
    pdf.line(margin, memoY - 2, pageWidth - margin, memoY - 2);

    pdf.setFontSize(7.5);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(51, 65, 85);
    pdf.text(`Memo No: ${orderNum}/BDO-${currentBlockName.substring(0, 3).toUpperCase()}`, margin, memoY + 3);
    pdf.text(`Date: ${orderDate}`, pageWidth - margin, memoY + 3, { align: 'right' });

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.text('Copy forwarded for kind information to:', margin, memoY + 7.5);
    pdf.text(`1. Smt./Shri ${transfer.employeeName}, ${transfer.designation || 'PEO'} for information.`, margin + 2, memoY + 11.5);
    pdf.text(`2. Collector & District Magistrate, ${currentDistName} for kind favour of information and necessary action.`, margin + 2, memoY + 15.5);
    pdf.text(`3. Block Development Officer, ${preferredBlockName} Block, ${preferredDistName}.`, margin + 2, memoY + 19.5);
    pdf.text('4. Office Guard File / HRMS Portal Electronic Records.', margin + 2, memoY + 23.5);

  } else {
    // =========================================================================
    // 2. FINAL TRANSFER ORDER / RELIEVING / JOINING (STATE / COLLECTOR LEVEL)
    // =========================================================================

    // Top Header: Government of Odisha
    pdf.setTextColor(30, 41, 59); // Slate-800
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('GOVERNMENT OF ODISHA', pageWidth / 2, 22, { align: 'center' });

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('PANCHAYATI RAJ & DRINKING WATER DEPARTMENT', pageWidth / 2, 28, { align: 'center' });

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 116, 139);
    pdf.text('Lok Seva Bhawan, Bhubaneswar - 751001, Odisha', pageWidth / 2, 33, { align: 'center' });
    pdf.text('Email: prsec.od@nic.in | Portal: hrmsodisha.gov.in', pageWidth / 2, 37, { align: 'center' });

    // Divider line
    pdf.setDrawColor(15, 118, 110);
    pdf.setLineWidth(0.8);
    pdf.line(margin, 41, pageWidth - margin, 41);
    pdf.setLineWidth(0.2);
    pdf.line(margin, 42.5, pageWidth - margin, 42.5);

    // Document Title Banner
    let bannerTitle = 'OFFICIAL TRANSFER ORDER';
    if (docType === 'Relieving Order') bannerTitle = 'RELIEVING ORDER & CHARGE DISCHARGE';
    else if (docType === 'Joining Order') bannerTitle = 'JOINING ACCEPTANCE ORDER';
    else if (docType === 'Other Supporting Document') bannerTitle = 'OFFICIAL ATTACHMENT';

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(15, 118, 110);
    pdf.text(bannerTitle, pageWidth / 2, 50, { align: 'center' });

    // Meta Table (Order No & Date)
    pdf.setFontSize(9);
    pdf.setTextColor(51, 65, 85);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Order No: ${orderNum}`, margin, 58);
    pdf.text(`Date: ${orderDate}`, pageWidth - margin, 58, { align: 'right' });

    pdf.setFont('helvetica', 'normal');
    pdf.text(`Transfer Request ID: ${transfer.requestNumber}`, margin, 63);
    pdf.text(`Document Ref: ${doc.id} (v${doc.version || 1})`, pageWidth - margin, 63, { align: 'right' });

    // Divider
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.4);
    pdf.line(margin, 66, pageWidth - margin, 66);

    // Employee Profile Box
    pdf.setFillColor(248, 250, 252);
    pdf.roundedRect(margin, 70, contentWidth, 38, 2, 2, 'F');
    pdf.setDrawColor(203, 213, 225);
    pdf.roundedRect(margin, 70, contentWidth, 38, 2, 2, 'S');

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(15, 118, 110);
    pdf.text('1. APPLICANT / OFFICER PARTICULARS', margin + 4, 76);

    pdf.setFontSize(8.5);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(71, 85, 105);
    pdf.text('Employee Name:', margin + 4, 82);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(15, 23, 42);
    pdf.text(transfer.employeeName || 'LAXMI NAIK', margin + 35, 82);

    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(71, 85, 105);
    pdf.text('HRMS ID:', margin + 100, 82);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(15, 23, 42);
    pdf.text(transfer.employeeId || '91206224', margin + 120, 82);

    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(71, 85, 105);
    pdf.text('Designation:', margin + 4, 88);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(15, 23, 42);
    pdf.text(transfer.designation || 'Panchayat Executive Officer (PEO)', margin + 35, 88);

    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(71, 85, 105);
    pdf.text('Department:', margin + 100, 88);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(15, 23, 42);
    pdf.text(transfer.department || 'Panchayati Raj & Drinking Water Dept', margin + 125, 88);

    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(71, 85, 105);
    pdf.text('Current Posting:', margin + 4, 94);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(15, 23, 42);
    pdf.text(`${transfer.currentOffice}, ${transfer.currentDistrict}`, margin + 35, 94);

    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(71, 85, 105);
    pdf.text('Transferred To:', margin + 4, 100);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(15, 118, 110);
    pdf.text(`${transfer.preferredOffice || transfer.preferredBlock + ' Block'}, ${transfer.preferredDistrict}, Odisha`, margin + 35, 100);

    // Main Order Text Section
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(15, 118, 110);
    pdf.text('2. ORDER NOTIFICATION', margin, 116);

    pdf.setFontSize(8.5);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(30, 41, 59);

    let bodyParagraphs: string[] = [];

    if (docType === 'Relieving Order') {
      bodyParagraphs = [
        `In pursuance of Transfer Order No. ${orderNum} dated ${orderDate} issued by the Competent Authority, Government of Odisha, Smt./Shri ${transfer.employeeName}, ${transfer.designation || 'Panchayat Executive Officer'}, HRMS ID: ${transfer.employeeId}, is hereby RELIEVED of her/his duties from ${transfer.currentOffice} with effect from the afternoon of ${orderDate}.`,
        `She/He is directed to hand over all physical charges, files, documents, registers, and digital credentials to the designated relieving charge officer immediately.`,
        `The Last Pay Certificate (LPC) and Service Book are being forwarded electronically to the new Drawing & Disbursing Officer at ${transfer.preferredDistrict}. Joining time as admissible under the Odisha Service Code is granted.`
      ];
    } else if (docType === 'Joining Order') {
      bodyParagraphs = [
        `In compliance with Transfer Order No. ${orderNum} and subsequent Relieving Order, Smt./Shri ${transfer.employeeName}, ${transfer.designation || 'Panchayat Executive Officer'}, HRMS ID: ${transfer.employeeId}, has reported for duty at ${transfer.preferredOffice || transfer.preferredBlock + ' Block Office'}, ${transfer.preferredDistrict} on ${orderDate} (Forenoon).`,
        `The joining report is hereby ACCEPTED and she/he is taken on the strength of this establishment with effect from the said date.`,
        `The Accounts Section is instructed to incorporate the officer into the electronic HRMS Payroll system upon verification of LPC and Service Records.`
      ];
    } else {
      // Default Transfer Order
      bodyParagraphs = [
        `In exercise of powers conferred under the Odisha Service Code and Departmental Transfer Guidelines, Smt./Shri ${transfer.employeeName}, ${transfer.designation || 'Panchayat Executive Officer (PEO)'}, HRMS ID: ${transfer.employeeId}, presently stationed at ${transfer.currentOffice}, District ${transfer.currentDistrict}, is hereby transferred and posted to ${transfer.preferredOffice || transfer.preferredBlock + ' Block Office, ' + transfer.preferredDistrict}, with immediate effect.`,
        `The transfer is made in the interest of public service / on mutual administrative grounds upon recommendation of the Block Development Officer, ${currentBlockName} and sanction by the District Collector, ${currentDistName}.`,
        `The incumbent officer shall be relieved immediately to join at the new place of posting within the stipulated joining time of 7 (seven) working days from the date of release.`,
        `No Travelling Allowance (TA) / Daily Allowance (DA) and Joining Time pay will be admissible if the transfer is made on the applicant's own request, except where permissible under Government regulations.`
      ];
    }

    let yCursor = 122;
    bodyParagraphs.forEach((para) => {
      const lines = pdf.splitTextToSize(para, contentWidth);
      pdf.text(lines, margin, yCursor);
      yCursor += lines.length * 4.8 + 3;
    });

    // Terms & Conditions Table
    if (yCursor < 195) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.5);
      pdf.setTextColor(15, 118, 110);
      pdf.text('3. COMPLIANCE DIRECTIVES & CONDITIONS', margin, yCursor + 2);
      yCursor += 7;

      const conditions = [
        '1. Handover of charge must be completed and logged into the HRMS Portal.',
        '2. Last Pay Certificate (LPC) and Service Book must be transmitted digitally.',
        '3. Any pending vigilance, audit clearance, or court proceedings must be reported.',
        '4. Unauthorized absence or delay in joining shall attract disciplinary action under OCS (CCA) Rules.'
      ];

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.5);
      pdf.setTextColor(71, 85, 105);
      conditions.forEach((c) => {
        pdf.text(c, margin + 2, yCursor);
        yCursor += 4.5;
      });
    }

    // Signature Block
    const sigY = 230;
    pdf.setDrawColor(203, 213, 225);
    pdf.setLineWidth(0.3);
    pdf.line(pageWidth - margin - 70, sigY, pageWidth - margin, sigY);

    // Digital Signature Stamp Box
    pdf.setFillColor(240, 253, 250);
    pdf.roundedRect(pageWidth - margin - 75, sigY + 2, 75, 32, 2, 2, 'F');
    pdf.setDrawColor(45, 212, 191);
    pdf.roundedRect(pageWidth - margin - 75, sigY + 2, 75, 32, 2, 2, 'S');

    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(13, 148, 136);
    pdf.text('DIGITALLY SIGNED & VERIFIED', pageWidth - margin - 70, sigY + 8);

    pdf.setFontSize(7.5);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(15, 23, 42);
    pdf.text(doc.uploadedBy || 'Competent Authority / District Collector', pageWidth - margin - 70, sigY + 14);

    pdf.setFontSize(6.5);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(71, 85, 105);
    pdf.text(`District Administration, ${currentDistName}`, pageWidth - margin - 70, sigY + 19);
    pdf.text('Government of Odisha', pageWidth - margin - 70, sigY + 23);
    pdf.text(`Timestamp: ${orderDate} 12:19:00 IST`, pageWidth - margin - 70, sigY + 27);
    pdf.text(`Doc Ref: ${doc.id}`, pageWidth - margin - 70, sigY + 31);

    // Left side copy forwarded to
    pdf.setFontSize(7.5);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(51, 65, 85);
    pdf.text('Memo No: ' + orderNum + '/PRDW', margin, sigY + 4);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.text('Copy forwarded for information & necessary action to:', margin, sigY + 9);
    pdf.text('1. Smt./Shri ' + transfer.employeeName + ' (Applicant)', margin + 2, sigY + 14);
    pdf.text('2. Collector & District Magistrate, ' + transfer.currentDistrict + ' / ' + transfer.preferredDistrict, margin + 2, sigY + 19);
    pdf.text('3. Block Development Officer, ' + (transfer.currentBlock || transfer.currentDistrict), margin + 2, sigY + 24);
    pdf.text('4. Block Development Officer, ' + (transfer.preferredBlock || transfer.preferredDistrict), margin + 2, sigY + 29);
    pdf.text('5. Guard File / HRMS Odisha Electronic Repository', margin + 2, sigY + 34);
  }

  // Footer / Security Watermark
  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(0.3);
  pdf.line(margin, 280, pageWidth - margin, 280);

  pdf.setFontSize(6.5);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(148, 163, 184);
  pdf.text('This is an electronically generated and authenticated official document of the Government of Odisha HRMS Portal.', margin, 285);
  pdf.text('Document Security ID: ' + doc.id + ' | Verification URL: https://hrmsodisha.gov.in/verify', margin, 289);
  pdf.text('Page 1 of 1', pageWidth - margin, 289, { align: 'right' });

  return pdf;
}

/**
 * Returns a standardized, dynamic filename for any transfer document.
 * Example for BDO Forwarding: Laxmi_Naik_BDO_Transfer_Recommendation_Bijatala_BDO_18-08-2026.pdf
 */
export function getTransferDocumentFileName(transfer: TransferRecord, doc: TransferDocument): string {
  const cleanEmp = (transfer.employeeName || 'Employee').trim().replace(/[^a-zA-Z0-9]/g, '_');
  const cleanBlock = (transfer.currentBlock || transfer.currentOffice || 'Block').trim().replace(/[^a-zA-Z0-9]/g, '_');
  const dateStr = (doc.orderDate || transfer.orderDate || new Date().toISOString().split('T')[0]).replace(/[^a-zA-Z0-9]/g, '-');
  const docType = doc.documentType || 'Transfer Order';

  if (docType === 'Approval Order') {
    return `${cleanEmp}_BDO_Transfer_Recommendation_${cleanBlock}_BDO_${dateStr}.pdf`;
  } else if (docType === 'Transfer Order') {
    const ordNum = (doc.orderNumber || transfer.orderNumber || 'ORD-PRDW-2026-1185').replace(/[^a-zA-Z0-9]/g, '_');
    return `${cleanEmp}_Final_Transfer_Order_${ordNum}_${dateStr}.pdf`;
  } else if (docType === 'Relieving Order') {
    return `${cleanEmp}_Relieving_Order_${cleanBlock}_${dateStr}.pdf`;
  } else if (docType === 'Joining Order') {
    const destBlock = (transfer.preferredBlock || transfer.preferredDistrict || 'Destination').replace(/[^a-zA-Z0-9]/g, '_');
    return `${cleanEmp}_Joining_Order_${destBlock}_${dateStr}.pdf`;
  }
  return `${cleanEmp}_${docType.replace(/[^a-zA-Z0-9]/g, '_')}_${dateStr}.pdf`;
}

/**
 * Trigger immediate download of the generated PDF file.
 */
export function downloadTransferPdfFile(transfer: TransferRecord, doc: TransferDocument) {
  const pdf = generateTransferPdf(transfer, doc);
  const targetFileName = getTransferDocumentFileName(transfer, doc);
  pdf.save(targetFileName);
}

