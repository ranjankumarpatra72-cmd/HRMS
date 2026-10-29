import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Employee, ServiceBook } from '../types';

export function generateOfficialServiceBookPDF(employee: Employee, serviceBook: ServiceBook): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  const contentWidth = pageWidth - margin * 2;

  // Helper to draw standard Odisha HRMS page frame with double borders
  const drawPageBorder = (pageNum: number, totalPages: number, pageCode: string) => {
    // Outer border
    doc.setDrawColor(30, 58, 138); // Navy #1E3A8A
    doc.setLineWidth(0.8);
    doc.rect(margin, margin, contentWidth, pageHeight - margin * 2);

    // Inner thin border
    doc.setDrawColor(180, 83, 9); // Amber/gold
    doc.setLineWidth(0.3);
    doc.rect(margin + 1.5, margin + 1.5, contentWidth - 3, pageHeight - margin * 2 - 3);

    // Header Tag
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(pageCode, margin + 3, margin + 4.5);
    doc.text('GOVERNMENT OF ODISHA - HRMS e-SERVICE BOOK', pageWidth / 2, margin + 4.5, { align: 'center' });
    doc.text(`CONFIDENTIAL`, pageWidth - margin - 3, margin + 4.5, { align: 'right' });

    // Footer
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.2);
    doc.line(margin + 2, pageHeight - margin - 5, pageWidth - margin - 2, pageHeight - margin - 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(`HRMS Odisha | Generated on ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString()}`, margin + 3, pageHeight - margin - 2);
    doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin - 3, pageHeight - margin - 2, { align: 'right' });
  };

  const totalPages = 5;

  // ==========================================
  // PAGE 1: COVER PAGE (HRMS-SB-01)
  // ==========================================
  drawPageBorder(1, totalPages, 'HRMS-SB-01');

  // Header Titles
  let y = margin + 14;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(153, 27, 27); // Maroon #991B1B
  doc.text('GOVERNMENT OF ODISHA', pageWidth / 2, y, { align: 'center' });

  y += 5.5;
  doc.setFontSize(10);
  doc.setTextColor(30, 58, 138); // Navy
  doc.text('CENTRE FOR MODERNIZING GOVERNMENT INITIATIVE (CMGI)', pageWidth / 2, y, { align: 'center' });

  y += 4.5;
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('General Administration & Public Grievance Department', pageWidth / 2, y, { align: 'center' });

  y += 3;
  doc.setDrawColor(153, 27, 27);
  doc.setLineWidth(0.5);
  doc.line(margin + 20, y, pageWidth - margin - 20, y);

  // Big Service Book Title Box
  y += 6;
  doc.setFillColor(254, 243, 199); // Soft Gold
  doc.setDrawColor(180, 83, 9);
  doc.setLineWidth(0.6);
  doc.roundedRect(margin + 30, y, contentWidth - 60, 12, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(153, 27, 27);
  doc.text('DIGITAL e-SERVICE BOOK', pageWidth / 2, y + 8, { align: 'center' });

  // Photo & Key Identifiers Box
  y += 18;
  const photoBoxWidth = 32;
  const photoBoxHeight = 38;
  const photoX = pageWidth - margin - photoBoxWidth - 8;
  
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.4);
  doc.setFillColor(248, 250, 252);
  doc.rect(photoX, y, photoBoxWidth, photoBoxHeight, 'FD');
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('AFFIX PASSPORT', photoX + photoBoxWidth / 2, y + 16, { align: 'center' });
  doc.text('SIZE PHOTOGRAPH', photoX + photoBoxWidth / 2, y + 20, { align: 'center' });
  doc.text('ATTESTED BY DDO', photoX + photoBoxWidth / 2, y + 24, { align: 'center' });

  // Employee Identity Details Table on Page 1
  const coverDetails = [
    ['HRMS EMPLOYEE ID', `:  ${employee.employeeId}`],
    ['EMPLOYEE NAME', `:  ${(serviceBook.employeeName || employee.name).toUpperCase()}`],
    ['DESIGNATION', `:  ${employee.designation.toUpperCase()}`],
    ['CADRE / SERVICE', `:  ${(employee.cadre || 'Odisha Subordinate Service').toUpperCase()}`],
    ['DEPARTMENT', `:  ${employee.department.toUpperCase()}`],
    ['CURRENT OFFICE', `:  ${employee.office.toUpperCase()}`],
    ['PRAN NO. (NPS)', `:  ${serviceBook.pranNo || employee.gpfNpsNo || 'N/A'}`],
    ['GPF NO.', `:  ${serviceBook.gpfNo || 'N/A'}`],
    ['GIS NO.', `:  ${serviceBook.gisNo || 'N/A'}`],
    ['DATE OF BIRTH', `:  ${serviceBook.dobWords || employee.dob}`],
    ['DATE OF ENTRY (GOVT)', `:  ${serviceBook.dateOfEntryGovtService || employee.dateOfJoining}`],
    ['DATE OF SUPERANNUATION', `:  ${serviceBook.retirementDetails?.superannuationDate || 'N/A'}`],
    ['HOME DISTRICT', `:  ${(employee.district || 'Khordha').toUpperCase()}`],
    ['DDO ACCOUNT CODE', `:  ${employee.ddoId || 'DDO30001'}`]
  ];

  autoTable(doc, {
    startY: y - 2,
    margin: { left: margin + 4, right: photoBoxWidth + 20 },
    body: coverDetails,
    theme: 'plain',
    styles: {
      fontSize: 8,
      cellPadding: 1.2,
      font: 'helvetica',
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50, textColor: [71, 85, 105] },
      1: { fontStyle: 'bold', textColor: [15, 23, 42] }
    }
  });

  // Statutory Certification Notice
  y = 195;
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin + 4, y, contentWidth - 8, 38, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 58, 138);
  doc.text('CERTIFICATE OF VERIFICATION AND OPENING OF SERVICE BOOK', margin + 8, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  const certText = `Certified that the entries made in this Digital Service Book have been verified with original certificates, appointment orders, and Service Register maintained in the office. All particulars recorded herein are true and verified as per Rule 123 of the Odisha Service Code. This document is authenticated electronically under the Odisha HRMS Governance framework.`;
  const splitCert = doc.splitTextToSize(certText, contentWidth - 16);
  doc.text(splitCert, margin + 8, y + 12);

  // Signatures on Cover
  y = 250;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);

  doc.text('Signature / Left Thumb Impression of Employee', margin + 8, y);
  doc.text('Signature & Seal of Attesting Officer / DDO', pageWidth - margin - 8, y, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Date: .......................................', margin + 8, y + 5);
  doc.text('Date & Official Seal: .......................................', pageWidth - margin - 8, y + 5, { align: 'right' });

  // ==========================================
  // PAGE 2: FIRST PAGE DIVIDER (HRMS-SB-02)
  // ==========================================
  doc.addPage();
  drawPageBorder(2, totalPages, 'HRMS-SB-02');

  y = margin + 25;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(153, 27, 27);
  doc.text('GOVERNMENT OF ODISHA', pageWidth / 2, y, { align: 'center' });

  y += 8;
  doc.setFontSize(12);
  doc.setTextColor(30, 58, 138);
  doc.text('FINANCE DEPARTMENT / GA & PG DEPARTMENT', pageWidth / 2, y, { align: 'center' });

  y += 18;
  doc.setFillColor(254, 243, 199);
  doc.setDrawColor(180, 83, 9);
  doc.setLineWidth(0.8);
  doc.roundedRect(margin + 20, y, contentWidth - 40, 24, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(153, 27, 27);
  doc.text('FIRST PAGE OF THE SERVICE BOOK', pageWidth / 2, y + 11, { align: 'center' });
  doc.setFontSize(9);
  doc.setTextColor(30, 58, 138);
  doc.text('(To be maintained under Rule 123 of Odisha Service Code)', pageWidth / 2, y + 18, { align: 'center' });

  // Statutory Instructions Box
  y += 40;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin + 10, y, contentWidth - 20, 110, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 58, 138);
  doc.text('IMPORTANT STATUTORY INSTRUCTIONS FOR CUSTODY & MAINTENANCE:', margin + 16, y + 10);

  const instructions = [
    '1. The Service Book must be maintained in duplicate or verified digital electronic mode for every Government servant from the date of initial appointment.',
    '2. The Head of Office shall record annual certificate of verification of service in respect of each employee after verifying pay bills and acquaintance rolls.',
    '3. At a fixed time in June every year, the Service Book shall be shown to the Government servant who shall affix signature in token of having verified entries.',
    '4. No alteration or erasure in the Date of Birth once recorded shall be made without prior approval of the Competent Administrative Authority.',
    '5. In case of transfer, the Service Book accompanied by LPC (Last Pay Certificate) shall be transmitted directly to the new Head of Office within 7 days.',
    '6. All sanctions of leave, promotions, increments, suspensions, and training must be contemporaneously entered and attested by the DDO/Establishment Officer.',
    '7. Nominations for DCRG, NPS/GPF, and GIS must be countersigned and kept attached to this ledger securely.'
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  let instY = y + 18;
  instructions.forEach((inst) => {
    const split = doc.splitTextToSize(inst, contentWidth - 32);
    doc.text(split, margin + 16, instY);
    instY += split.length * 4.5 + 2.5;
  });

  // ==========================================
  // PAGE 3: BIO-DATA & IDENTIFIERS (HRMS-SB-03)
  // ==========================================
  doc.addPage();
  drawPageBorder(3, totalPages, 'HRMS-SB-03');

  y = margin + 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 58, 138);
  doc.text('PART - I : EMPLOYEE BIO-DATA & PERSONAL PARTICULARS', pageWidth / 2, y, { align: 'center' });

  // 1. Personal particulars grid table
  const p = serviceBook.personalDetails || ({} as any);
  const bioTableData = [
    ['1. Full Name of Govt Servant', (serviceBook.employeeName || employee.name).toUpperCase(), '8. Marital Status', p.maritalStatus || 'MARRIED'],
    ["2. Father's Name", (p.fatherName || employee.fatherName || 'N/A').toUpperCase(), '9. Blood Group', p.bloodGroup || 'O+'],
    ['3. Home Town / District', (serviceBook.declarationOfHomeTown || employee.district || 'N/A').toUpperCase(), '10. Height (cm)', `${p.heightCm || 168} cm`],
    ['4. Date of Birth (Christian Era)', serviceBook.dobWords || employee.dob, '11. Identification Marks', p.identificationMark || 'N/A'],
    ['5. Date of Entry into Govt Service', serviceBook.dateOfEntryGovtServiceWords || employee.dateOfJoining, '12. Social Category', serviceBook.category || 'GENERAL'],
    ['6. Initial Joining Post & Office', `${serviceBook.initialJoiningPost || employee.designation}, ${serviceBook.initialJoiningOffice || employee.office}`, '13. Mobile / Phone', serviceBook.cellPhone || employee.mobile],
    ['7. Permanent Home Address', { content: p.permanentAddress || 'N/A', colSpan: 3 }]
  ];

  autoTable(doc, {
    startY: y + 3,
    margin: { left: margin + 3, right: margin + 3 },
    body: bioTableData as any,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 1.5,
      lineColor: [203, 213, 225],
      lineWidth: 0.2
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 42, fillColor: [248, 250, 252], textColor: [71, 85, 105] },
      1: { fontStyle: 'bold', cellWidth: 52, textColor: [15, 23, 42] },
      2: { fontStyle: 'bold', cellWidth: 38, fillColor: [248, 250, 252], textColor: [71, 85, 105] },
      3: { fontStyle: 'bold', textColor: [15, 23, 42] }
    }
  });

  let currentY = (doc as any).lastAutoTable.finalY + 4;

  // 2. Identity Documents Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(153, 27, 27);
  doc.text('IDENTITY DOCUMENTS & PROOFS', margin + 3, currentY);

  const idDocsData = (serviceBook.identityDocuments || [
    { type: 'PAN CARD', number: employee.panNumber || 'ABCPS1234F', placeOfIssue: 'Income Tax Dept', dateOfIssue: '10-JAN-2012', dateOfExpiry: 'N/A' },
    { type: 'AADHAAR CARD', number: 'xxxxxxxx5821', placeOfIssue: 'UIDAI', dateOfIssue: '15-MAR-2014', dateOfExpiry: 'N/A' }
  ]).map((d, i) => [
    (i + 1).toString(),
    d.type,
    d.number,
    d.placeOfIssue || 'N/A',
    d.dateOfIssue || 'N/A',
    d.dateOfExpiry || 'N/A'
  ]);

  autoTable(doc, {
    startY: currentY + 1.5,
    margin: { left: margin + 3, right: margin + 3 },
    head: [['Sl', 'Document Type', 'Document Number', 'Place of Issue', 'Date of Issue', 'Date of Expiry']],
    body: idDocsData,
    theme: 'grid',
    headStyles: { fillColor: [30, 58, 138], fontSize: 7, fontStyle: 'bold', textColor: 255 },
    styles: { fontSize: 7, cellPadding: 1.2, lineColor: [203, 213, 225], lineWidth: 0.2 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 4;

  // 3. Family Members Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(153, 27, 27);
  doc.text('FAMILY MEMBERS RECORD', margin + 3, currentY);

  const familyData = (serviceBook.familyMembers || [
    { relationType: 'FATHER', name: employee.fatherName || 'Late Father', isAlive: false, dob: '04-JAN-1956', maritalStatus: 'MARRIED', age: 65 },
    { relationType: 'MOTHER', name: employee.motherName || 'Mother', isAlive: true, dob: '12-AUG-1962', maritalStatus: 'WIDOW', age: 64 }
  ]).map((f, i) => [
    (i + 1).toString(),
    f.relationType,
    f.name,
    f.isAlive === true || f.isAlive === 'true' || f.isAlive === 'YES' ? 'YES' : 'NO',
    f.dob || 'N/A',
    f.maritalStatus || 'N/A',
    (f.age || 'N/A').toString()
  ]);

  autoTable(doc, {
    startY: currentY + 1.5,
    margin: { left: margin + 3, right: margin + 3 },
    head: [['Sl', 'Relationship', 'Member Name', 'Alive', 'Date of Birth', 'Marital Status', 'Age']],
    body: familyData,
    theme: 'grid',
    headStyles: { fillColor: [30, 58, 138], fontSize: 7, fontStyle: 'bold', textColor: 255 },
    styles: { fontSize: 7, cellPadding: 1.2, lineColor: [203, 213, 225], lineWidth: 0.2 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 4;

  // 4. Nominees Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(153, 27, 27);
  doc.text('FAMILY NOMINATIONS (NPS / GRATUITY / GIS)', margin + 3, currentY);

  const nomineesData = (serviceBook.nomineesTable || (serviceBook.nominations || []).map(n => ({
    relationType: n.relation?.toUpperCase(),
    name: n.nomineeName,
    isAlive: 'YES',
    dob: 'N/A',
    maritalStatus: 'MARRIED',
    age: 'N/A',
    sharePercent: n.sharePercent
  }))).map((n: any, i) => [
    (i + 1).toString(),
    n.relationType || n.relation || 'N/A',
    n.name || n.nomineeName || 'N/A',
    n.isAlive === false || n.isAlive === 'false' || n.isAlive === 'NO' ? 'NO' : 'YES',
    `${n.sharePercent || 100}%`
  ]);

  autoTable(doc, {
    startY: currentY + 1.5,
    margin: { left: margin + 3, right: margin + 3 },
    head: [['Sl', 'Relationship', 'Nominee Name', 'Alive', 'Share (%)']],
    body: nomineesData,
    theme: 'grid',
    headStyles: { fillColor: [30, 58, 138], fontSize: 7, fontStyle: 'bold', textColor: 255 },
    styles: { fontSize: 7, cellPadding: 1.2, lineColor: [203, 213, 225], lineWidth: 0.2 }
  });

  // ==========================================
  // PAGE 4: CHRONOLOGICAL SERVICE ENTRIES (HRMS-SB-04)
  // ==========================================
  doc.addPage();
  drawPageBorder(4, totalPages, 'HRMS-SB-04');

  y = margin + 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 58, 138);
  doc.text('PART - II : CHRONOLOGICAL SERVICE BOOK ENTRIES', pageWidth / 2, y, { align: 'center' });

  // Official Service Entries Table
  const officialEntries = serviceBook.officialEntries && serviceBook.officialEntries.length > 0
    ? serviceBook.officialEntries
    : [
        {
          entryType: 'JOINING' as const,
          postCadreScale: employee.designation.toUpperCase(),
          pay: `Rs. ${employee.basicPay}/- (${employee.payLevel || 'Level-9'})`,
          wef: employee.dateOfJoining,
          entryText: `JOINED AS ${employee.designation.toUpperCase()} IN ${employee.office.toUpperCase()} ON ${employee.dateOfJoining} (FN).`,
          noteText: `ENTRY TAKEN ON ${employee.dateOfJoining}`,
          entryDate: employee.dateOfJoining,
          orderNumber: `ESTT/GOVT/${employee.dateOfJoining?.slice(0, 4)}/1102`,
          orderDate: employee.dateOfJoining
        }
      ];

  const serviceTableData = officialEntries.map((e, idx) => [
    (idx + 1).toString(),
    e.postCadreScale || employee.designation.toUpperCase(),
    e.pay || `Rs. ${employee.basicPay}/-`,
    e.wef || 'N/A',
    {
      content: `${e.entryText}\n\n[${e.noteText || `ENTRY TAKEN ON ${e.entryDate || ''}`}] | Order: ${e.orderNumber || 'N/A'} dt. ${e.orderDate || ''}`,
      styles: { fontSize: 6.8 }
    },
    'Verified & Attested\n(SD/- DDO)'
  ]);

  autoTable(doc, {
    startY: y + 4,
    margin: { left: margin + 3, right: margin + 3 },
    head: [
      [
        'Sl.',
        'Post / Cadre Scale',
        'Pay (Rs.)',
        'W.E.F.',
        'Events / Orders (Transfer, Posting, Relieve, Joining, Suspension, Increment, Promotion)',
        'Signature of Attesting Officer'
      ]
    ],
    body: serviceTableData as any,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 58, 138],
      fontSize: 7.2,
      fontStyle: 'bold',
      textColor: 255,
      halign: 'center'
    },
    styles: {
      fontSize: 7,
      cellPadding: 2,
      lineColor: [203, 213, 225],
      lineWidth: 0.2
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 28, fontStyle: 'bold' },
      2: { cellWidth: 20 },
      3: { cellWidth: 20, fontStyle: 'bold' },
      4: { cellWidth: 80 },
      5: { cellWidth: 28, halign: 'center', fontSize: 6.5, fontStyle: 'italic', textColor: [100, 116, 139] }
    }
  });

  // ==========================================
  // PAGE 5: EARNED LEAVE ACCOUNT REGISTER (HRMS-SB-05)
  // ==========================================
  doc.addPage();
  drawPageBorder(5, totalPages, 'HRMS-SB-05');

  y = margin + 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 58, 138);
  doc.text('PART - III : EARNED LEAVE ACCOUNT REGISTER', pageWidth / 2, y, { align: 'center' });

  // Earned Leave Table
  const elRows = serviceBook.earnedLeaveAccount && serviceBook.earnedLeaveAccount.length > 0
    ? serviceBook.earnedLeaveAccount
    : [
        {
          periodFrom: '01-JAN-2025',
          periodTo: '30-JUN-2025',
          completedMonths: 6,
          leaveCreditDays: 15,
          eolAvailed: 0,
          elDeducted: 0,
          balanceReturnFromLeave: 120,
          availedFrom: undefined,
          availedTo: undefined,
          availedTotal: 0,
          balanceLeave: 120
        }
      ];

  const leaveTableData = elRows.map((r) => [
    `${r.periodFrom} to ${r.periodTo}`,
    r.completedMonths.toString(),
    r.leaveCreditDays.toString(),
    r.eolAvailed.toString(),
    r.elDeducted.toString(),
    r.balanceReturnFromLeave.toString(),
    r.availedFrom ? `${r.availedFrom} to ${r.availedTo}` : 'NIL',
    r.availedTotal.toString(),
    r.balanceLeave.toString(),
    'Attested (SD/-)'
  ]);

  autoTable(doc, {
    startY: y + 4,
    margin: { left: margin + 3, right: margin + 3 },
    head: [
      [
        { content: 'Duty Period (From - To)', rowSpan: 2, styles: { valign: 'middle' } },
        { content: 'Leave Credit', colSpan: 5, styles: { halign: 'center' } },
        { content: 'Leave Availed', colSpan: 2, styles: { halign: 'center' } },
        { content: 'Balance at Credit', rowSpan: 2, styles: { valign: 'middle' } },
        { content: 'Attestation', rowSpan: 2, styles: { valign: 'middle' } }
      ],
      [
        'Months',
        'Credit (Days)',
        'EOL Days',
        'Deducted',
        'Total',
        'Availed Period',
        'Days',
      ]
    ],
    body: leaveTableData,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 58, 138],
      fontSize: 6.8,
      fontStyle: 'bold',
      textColor: 255,
      halign: 'center'
    },
    styles: {
      fontSize: 6.8,
      cellPadding: 1.5,
      lineColor: [203, 213, 225],
      lineWidth: 0.2,
      halign: 'center'
    },
    columnStyles: {
      0: { cellWidth: 32, fontStyle: 'bold', halign: 'left' },
      5: { fontStyle: 'bold', fillColor: [248, 250, 252] },
      6: { cellWidth: 26 },
      8: { fontStyle: 'bold', textColor: [153, 27, 27], fillColor: [254, 243, 199] },
      9: { cellWidth: 20, fontSize: 6, fontStyle: 'italic', textColor: [100, 116, 139] }
    }
  });

  // Final DDO Attestation Footer Box
  currentY = (doc as any).lastAutoTable.finalY + 8;
  if (currentY < 230) {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin + 4, currentY, contentWidth - 8, 32, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(30, 58, 138);
    doc.text('ANNUAL VERIFICATION & RECONCILIATION CERTIFICATE', margin + 8, currentY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text('Certified that the leave account has been reconciled with attendance sheets, casual leave registers, and sanction orders for the period ending 31st March. The balance standing at credit has been duly verified and found correct.', margin + 8, currentY + 11, { maxWidth: contentWidth - 16 });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    doc.text('Signature of Dealing Assistant: ............................', margin + 8, currentY + 26);
    doc.text('Signature & Seal of DDO / Head of Office: ............................', pageWidth - margin - 8, currentY + 26, { align: 'right' });
  }

  // Save the document
  const fileName = `ServiceBook_${employee.employeeId}_${employee.name.replace(/\s+/g, '_')}.pdf`;
  doc.save(fileName);
}
