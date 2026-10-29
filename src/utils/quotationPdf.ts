import { jsPDF } from 'jspdf';
import { Quotation } from '../types';
import { CompanySettings } from '../types';
import { BRAND_LOGO_URL, BRAND_NAME, BRAND_SLOGAN, BRAND_LOCATION, BRAND_PHONE, BRAND_EMAIL } from '../constants/branding';

/**
 * Formats currency safely for jsPDF Helvetica standard font (avoids unicode symbol encoding bugs)
 */
function formatPdfCurrency(amount: number): string {
  const formatted = new Intl.NumberFormat('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
  return `NGN ${formatted}`;
}

/**
 * Generates and downloads an official commercial solar quotation as a PDF document.
 */
export async function downloadQuotationPDF(quotation: Quotation, settings?: CompanySettings): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Try to load the company logo as base64/HTMLImageElement
  try {
    const img = new Image();
    img.src = BRAND_LOGO_URL;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject();
      setTimeout(reject, 1200); // timeout fallback
    });
    doc.addImage(img, 'JPEG', margin, margin, 18, 18);
  } catch {
    // Fallback: draw styled brand icon square
    doc.setFillColor(6, 78, 59);
    doc.roundedRect(margin, margin, 18, 18, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('OE', margin + 6, margin + 11);
  }

  // Header Company Info
  doc.setTextColor(6, 78, 59); // Brand Deep Green
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(BRAND_NAME.toUpperCase(), margin + 22, margin + 6);

  doc.setTextColor(217, 119, 6); // Brand Solar Amber
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(BRAND_SLOGAN.toUpperCase(), margin + 22, margin + 10.5);

  doc.setTextColor(71, 85, 105); // Slate 600
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  const locationText = settings?.location || BRAND_LOCATION;
  const phoneText = settings?.phone || BRAND_PHONE;
  const emailText = settings?.email || BRAND_EMAIL;
  doc.text(locationText, margin + 22, margin + 14.5);
  doc.text(`Phone: ${phoneText}  |  Email: ${emailText}`, margin + 22, margin + 18);

  // Right-aligned Quotation Meta
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.text('OFFICIAL QUOTATION', pageWidth - margin, margin + 6, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(6, 78, 59);
  doc.text(quotation.quotationNumber, pageWidth - margin, margin + 11, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  const dateFormatted = new Date(quotation.createdAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const validUntilFormatted = new Date(quotation.validUntil).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  doc.text(`Date: ${dateFormatted}`, pageWidth - margin, margin + 15, { align: 'right' });
  doc.text(`Valid Until: ${validUntilFormatted}`, pageWidth - margin, margin + 18.5, { align: 'right' });

  // Top Accent Divider Line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(margin, margin + 22, pageWidth - margin, margin + 22);

  // Customer / Client Card
  const clientCardY = margin + 26;
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, clientCardY, contentWidth, 20, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('PREPARED FOR / CLIENT DETAILS:', margin + 4, clientCardY + 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(quotation.customerName || 'Valued Client', margin + 4, clientCardY + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(quotation.customerAddress || 'Ibadan, Oyo State, Nigeria', margin + 4, clientCardY + 15);

  if (quotation.customerPhone) {
    doc.text(`Tel: ${quotation.customerPhone}`, pageWidth - margin - 4, clientCardY + 10, { align: 'right' });
  }
  doc.text(`Status: ${quotation.status.toUpperCase()}`, pageWidth - margin - 4, clientCardY + 15, { align: 'right' });

  // Solar Bill of Engineering Materials (BOEM) Table
  let currentY = clientCardY + 25;

  // Table Header
  doc.setFillColor(6, 78, 59); // Brand Deep Green
  doc.rect(margin, currentY, contentWidth, 7, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('#', margin + 3, currentY + 4.8);
  doc.text('EQUIPMENT & MATERIALS DESCRIPTION', margin + 12, currentY + 4.8);
  doc.text('QTY', margin + 108, currentY + 4.8, { align: 'center' });
  doc.text('UNIT PRICE', margin + 140, currentY + 4.8, { align: 'right' });
  doc.text('TOTAL AMOUNT', pageWidth - margin - 4, currentY + 4.8, { align: 'right' });

  currentY += 7;

  // Table Rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);

  quotation.items.forEach((item, index) => {
    const isEven = index % 2 === 0;
    if (isEven) {
      doc.setFillColor(255, 255, 255);
    } else {
      doc.setFillColor(248, 250, 252);
    }
    doc.rect(margin, currentY, contentWidth, 6.5, 'F');
    doc.setDrawColor(241, 245, 249);
    doc.line(margin, currentY + 6.5, pageWidth - margin, currentY + 6.5);

    doc.setTextColor(100, 116, 139);
    doc.text(String(index + 1), margin + 3, currentY + 4.5);

    doc.setTextColor(15, 23, 42);
    const desc = item.description.length > 55 ? item.description.substring(0, 52) + '...' : item.description;
    doc.text(desc, margin + 12, currentY + 4.5);

    doc.setTextColor(71, 85, 105);
    doc.text(String(item.quantity), margin + 108, currentY + 4.5, { align: 'center' });
    doc.text(formatPdfCurrency(item.unitPrice), margin + 140, currentY + 4.5, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(formatPdfCurrency(item.subtotal), pageWidth - margin - 4, currentY + 4.5, { align: 'right' });
    doc.setFont('helvetica', 'normal');

    currentY += 6.5;
  });

  currentY += 2;

  // Financial Breakdown Box
  const summaryBoxWidth = 85;
  const summaryBoxX = pageWidth - margin - summaryBoxWidth;

  // Subtotal
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(8);
  doc.text('Equipment Subtotal:', summaryBoxX, currentY + 4);
  doc.text(formatPdfCurrency(quotation.subtotal), pageWidth - margin - 4, currentY + 4, { align: 'right' });
  currentY += 5;

  // Installation Charges
  if ((quotation.installationCharges || 0) > 0) {
    doc.text('Installation & Commissioning:', summaryBoxX, currentY + 4);
    doc.text(formatPdfCurrency(quotation.installationCharges), pageWidth - margin - 4, currentY + 4, { align: 'right' });
    currentY += 5;
  }

  // Logistics Charges
  if ((quotation.logisticsCharges || 0) > 0) {
    doc.text('Logistics & Material Transport:', summaryBoxX, currentY + 4);
    doc.text(formatPdfCurrency(quotation.logisticsCharges), pageWidth - margin - 4, currentY + 4, { align: 'right' });
    currentY += 5;
  }

  // Tax
  if (quotation.taxAmount > 0) {
    doc.text('VAT (7.5%):', summaryBoxX, currentY + 4);
    doc.text(formatPdfCurrency(quotation.taxAmount), pageWidth - margin - 4, currentY + 4, { align: 'right' });
    currentY += 5;
  }

  // Grand Total Box
  currentY += 2;
  doc.setFillColor(6, 78, 59);
  doc.roundedRect(summaryBoxX - 4, currentY, summaryBoxWidth + 4, 9, 1.5, 1.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text('TOTAL INVESTMENT:', summaryBoxX, currentY + 6);
  doc.setFontSize(9.5);
  doc.text(formatPdfCurrency(quotation.totalAmount), pageWidth - margin - 4, currentY + 6, { align: 'right' });

  currentY += 14;

  // Terms & Bank Details Section
  const termsY = currentY;
  const colWidth = (contentWidth - 6) / 2;

  // Left column: Payment & Bank Details
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, termsY, colWidth, 32, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(6, 78, 59);
  doc.text('OFFICIAL BANK PAYMENT DETAILS', margin + 4, termsY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text('Bank Name: First Bank of Nigeria / Zenith Bank', margin + 4, termsY + 11);
  doc.text('Account Name: Offnot Energy Systems Ltd', margin + 4, termsY + 16);
  doc.setFont('helvetica', 'bold');
  doc.text('Account Number: 1023456789', margin + 4, termsY + 21);
  doc.setFont('helvetica', 'normal');
  doc.text('Reference: Use Quotation No. on transfer narration', margin + 4, termsY + 26);

  // Right column: Warranty and Terms
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin + colWidth + 6, termsY, colWidth, 32, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(6, 78, 59);
  doc.text('TERMS & WARRANTY CONDITIONS', margin + colWidth + 10, termsY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  const termsWrapped = doc.splitTextToSize(
    quotation.terms || '70% advance deposit upon quotation acceptance. 30% balance upon delivery and installation commissioning. Comprehensive warranty applied on manufacturer specs. Offnot Energy, Ibadan, Nigeria.',
    colWidth - 8
  );
  doc.text(termsWrapped, margin + colWidth + 10, termsY + 10.5);

  currentY = termsY + 36;

  // Signature Block
  const sigBoxY = currentY;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);

  // Francis Gabriel Signatory
  doc.setDrawColor(203, 213, 225);
  doc.line(margin + 4, sigBoxY + 12, margin + 65, sigBoxY + 12);
  doc.text('Francis Gabriel', margin + 4, sigBoxY + 16);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Authorized Signatory · Offnot Energy Ibadan', margin + 4, sigBoxY + 20);

  // Client Acceptance Signature
  doc.setDrawColor(203, 213, 225);
  doc.line(pageWidth - margin - 65, sigBoxY + 12, pageWidth - margin - 4, sigBoxY + 12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Client Acceptance Signature', pageWidth - margin - 65, sigBoxY + 16);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Date & Company Stamp', pageWidth - margin - 65, sigBoxY + 20);

  // Bottom Footer
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'Offnot Energy Management System · Commercial Division · Tipper Garage, Dalute Road, Ibadan, Oyo State',
    margin,
    pageHeight - 7
  );
  doc.text('Page 1 of 1', pageWidth - margin, pageHeight - 7, { align: 'right' });

  // Save / Download PDF file
  const filename = `Offnot_Energy_Quotation_${quotation.quotationNumber}.pdf`;
  doc.save(filename);
}
