import { WalletTransaction } from '../types/travel';
import { SupportedCurrency, CURRENCY_REGISTRY, convertCurrency, formatCurrency } from './currency';

export interface ReceiptLineItem {
  description: string;
  code: string;
  amountFormatted: string;
  amountPdfSafe: string;
}

export interface ItemizedReceiptData {
  receiptNumber: string;
  transactionRef: string;
  bookingRef: string;
  title: string;
  categoryLabel: string;
  transactionTypeLabel: string;
  paymentMethod: string;
  timestamp: string;
  status: string;
  travelerName: string;
  currency: SupportedCurrency;
  lineItems: ReceiptLineItem[];
  subtotalFormatted: string;
  taxAndFeesFormatted: string;
  totalFormatted: string;
  subtotalPdfSafe: string;
  taxAndFeesPdfSafe: string;
  totalPdfSafe: string;
  baseUsdEquivalent: string;
}

/**
 * Formats an amount in the target currency using strictly ASCII characters for standard PDF Type1 fonts
 */
function formatPdfSafeCurrency(amountInTargetCurrency: number, currency: SupportedCurrency): string {
  const formattedNum = amountInTargetCurrency.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${currency} ${formattedNum}`;
}

/**
 * Builds itemized receipt breakdown for a given WalletTransaction in the user's selected currency.
 */
export function buildItemizedReceipt(
  tx: WalletTransaction,
  currency: SupportedCurrency,
  travelerName = 'AetherVoyage Verified Traveler'
): ItemizedReceiptData {
  const totalInCurrency = convertCurrency(tx.amountUsd, 'USD', currency);
  const bookingRef =
    tx.bookingRef ||
    (tx.type === 'credit'
      ? `WLT-${tx.referenceCode.replace('TXN-', '')}`
      : `AV-${tx.referenceCode.replace('TXN-', '')}`);

  const isDebit = tx.type === 'debit';

  let baseAmount = totalInCurrency;
  let serviceLevy = 0;
  let vatFee = 0;

  if (isDebit) {
    baseAmount = Number((totalInCurrency * 0.82).toFixed(2));
    serviceLevy = Number((totalInCurrency * 0.10).toFixed(2));
    vatFee = Number((totalInCurrency - baseAmount - serviceLevy).toFixed(2));
  }

  const formatUi = (valInCurr: number) => {
    const symbol = CURRENCY_REGISTRY[currency]?.symbol || currency;
    return `${symbol}${valInCurr.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} (${currency})`;
  };

  const categoryLabel =
    tx.category === 'topup'
      ? 'Digital Wallet Top-Up Deposit'
      : tx.category === 'cashback'
      ? 'Loyalty Cashback Credit'
      : `${tx.category.charAt(0).toUpperCase() + tx.category.slice(1)} Reservation`;

  const lineItems: ReceiptLineItem[] = isDebit
    ? [
        {
          description: `${tx.title} - Base Fare / Accommodation Tariff`,
          code: 'BASE-FARE',
          amountFormatted: formatUi(baseAmount),
          amountPdfSafe: formatPdfSafeCurrency(baseAmount, currency),
        },
        {
          description: 'Carrier, Terminal & Regional Infrastructure Levy (10%)',
          code: 'INFRA-LEVY',
          amountFormatted: formatUi(serviceLevy),
          amountPdfSafe: formatPdfSafeCurrency(serviceLevy, currency),
        },
        {
          description: 'National Tourism VAT & Instant Settlement Duty (8%)',
          code: 'GOV-VAT',
          amountFormatted: formatUi(vatFee),
          amountPdfSafe: formatPdfSafeCurrency(vatFee, currency),
        },
      ]
    : [
        {
          description: `${tx.title} - Principal Wallet Funding Credit`,
          code: 'WLT-CREDIT',
          amountFormatted: formatUi(baseAmount),
          amountPdfSafe: formatPdfSafeCurrency(baseAmount, currency),
        },
        {
          description: 'Instant Mobile / Card Gateway Processing Fee (Waived)',
          code: 'GTW-FEE',
          amountFormatted: formatUi(0),
          amountPdfSafe: formatPdfSafeCurrency(0, currency),
        },
        {
          description: 'Multi-Currency FX Treasury Conversion Spread (0%)',
          code: 'FX-SPREAD',
          amountFormatted: formatUi(0),
          amountPdfSafe: formatPdfSafeCurrency(0, currency),
        },
      ];

  const taxesTotal = Number((serviceLevy + vatFee).toFixed(2));

  return {
    receiptNumber: `RCP-${tx.referenceCode.replace('TXN-', '')}-2026`,
    transactionRef: tx.referenceCode,
    bookingRef,
    title: tx.title,
    categoryLabel,
    transactionTypeLabel: isDebit ? 'Confirmed Booking Debit' : 'Verified Wallet Credit',
    paymentMethod: tx.paymentMethod,
    timestamp: tx.timestamp.replace(/·/g, '|'),
    status: tx.status,
    travelerName,
    currency,
    lineItems,
    subtotalFormatted: formatUi(baseAmount),
    taxAndFeesFormatted: formatUi(taxesTotal),
    totalFormatted: formatCurrency(tx.amountUsd, currency),
    subtotalPdfSafe: formatPdfSafeCurrency(baseAmount, currency),
    taxAndFeesPdfSafe: formatPdfSafeCurrency(taxesTotal, currency),
    totalPdfSafe: formatPdfSafeCurrency(totalInCurrency, currency),
    baseUsdEquivalent: `USD ${tx.amountUsd.toFixed(2)}`,
  };
}

/**
 * Escapes parentheses and backslashes for PDF literal strings
 */
function escapePdfText(input: string): string {
  return input
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

/**
 * Generates a valid, standalone PDF 1.4 document binary and triggers a file download
 */
export function downloadTransactionReceiptPdf(
  tx: WalletTransaction,
  currency: SupportedCurrency,
  travelerName?: string
): ItemizedReceiptData {
  const receipt = buildItemizedReceipt(tx, currency, travelerName);

  const ops: string[] = [];

  // Page background header bar (Dark Slate #0F172A -> 0.059 0.090 0.165)
  ops.push('0.059 0.090 0.165 rg');
  ops.push('0 740 612 102 re f');

  // Accent Emerald stripe under header (#10B981 -> 0.063 0.725 0.506)
  ops.push('0.063 0.725 0.506 rg');
  ops.push('0 736 612 4 re f');

  // Header Text (White)
  ops.push('1 1 1 rg');
  ops.push(`BT /F2 18 Tf 44 795 Td (AETHERVOYAGE) Tj ET`);
  ops.push('0.65 0.95 0.85 rg');
  ops.push(`BT /F1 10 Tf 44 777 Td (OFFICIAL ITEMIZED TRAVEL & WALLET RECEIPT) Tj ET`);
  ops.push('0.82 0.86 0.92 rg');
  ops.push(`BT /F3 9 Tf 44 760 Td (Receipt No: ${escapePdfText(receipt.receiptNumber)}  |  Status: ${escapePdfText(receipt.status.toUpperCase())}) Tj ET`);

  // Right-aligned Header Badge Info
  ops.push('1 1 1 rg');
  ops.push(`BT /F2 11 Tf 395 795 Td (BOOKING REF: ${escapePdfText(receipt.bookingRef)}) Tj ET`);
  ops.push('0.82 0.86 0.92 rg');
  ops.push(`BT /F3 9 Tf 395 777 Td (TXN ID: ${escapePdfText(receipt.transactionRef)}) Tj ET`);
  ops.push(`BT /F1 9 Tf 395 760 Td (Currency: ${escapePdfText(receipt.currency)}) Tj ET`);

  // Metadata Box background (Light Slate #F8FAFC -> 0.973 0.980 0.988)
  ops.push('0.96 0.97 0.99 rg');
  ops.push('44 615 524 102 re f');
  ops.push('0.82 0.85 0.90 RG 1 w');
  ops.push('44 615 524 102 re S');

  // Metadata Box Labels & Values
  ops.push('0.35 0.40 0.48 rg');
  ops.push(`BT /F2 8 Tf 58 698 Td (PASSENGER / ACCOUNT HOLDER) Tj ET`);
  ops.push(`BT /F2 8 Tf 315 698 Td (PAYMENT METHOD & CHANNEL) Tj ET`);
  ops.push(`BT /F2 8 Tf 58 656 Td (BOOKING REFERENCE / PNR) Tj ET`);
  ops.push(`BT /F2 8 Tf 315 656 Td (TRANSACTION DATE & TIME) Tj ET`);

  ops.push('0.06 0.09 0.16 rg');
  ops.push(`BT /F2 10 Tf 58 683 Td (${escapePdfText(receipt.travelerName)}) Tj ET`);
  ops.push(`BT /F2 10 Tf 315 683 Td (${escapePdfText(receipt.paymentMethod)}) Tj ET`);
  ops.push(`BT /F3 11 Tf 58 640 Td (${escapePdfText(receipt.bookingRef)}) Tj ET`);
  ops.push(`BT /F1 10 Tf 315 640 Td (${escapePdfText(receipt.timestamp)}) Tj ET`);

  // Section Title: Itemized Breakdown
  ops.push('0.06 0.09 0.16 rg');
  ops.push(`BT /F2 12 Tf 44 585 Td (Itemized Financial Breakdown) Tj ET`);
  ops.push('0.40 0.45 0.52 rg');
  ops.push(`BT /F1 9 Tf 44 570 Td (Category: ${escapePdfText(receipt.categoryLabel)}  |  Type: ${escapePdfText(receipt.transactionTypeLabel)}) Tj ET`);

  // Table Header Bar
  ops.push('0.12 0.16 0.23 rg');
  ops.push('44 536 524 24 re f');
  ops.push('1 1 1 rg');
  ops.push(`BT /F2 9 Tf 56 545 Td (ITEM CODE) Tj ET`);
  ops.push(`BT /F2 9 Tf 145 545 Td (DESCRIPTION) Tj ET`);
  ops.push(`BT /F2 9 Tf 450 545 Td (AMOUNT (${escapePdfText(receipt.currency)})) Tj ET`);

  // Table Rows
  let currentY = 512;
  receipt.lineItems.forEach((item, idx) => {
    if (idx % 2 === 1) {
      ops.push('0.97 0.98 0.99 rg');
      ops.push(`44 ${currentY - 8} 524 26 re f`);
    }
    ops.push('0.25 0.30 0.38 rg');
    ops.push(`BT /F3 9 Tf 56 ${currentY} Td (${escapePdfText(item.code)}) Tj ET`);

    ops.push('0.06 0.09 0.16 rg');
    const cleanDesc =
      item.description.length > 52 ? item.description.slice(0, 49) + '...' : item.description;
    ops.push(`BT /F1 9.5 Tf 145 ${currentY} Td (${escapePdfText(cleanDesc)}) Tj ET`);

    ops.push(`BT /F3 9.5 Tf 450 ${currentY} Td (${escapePdfText(item.amountPdfSafe)}) Tj ET`);

    // Row divider line
    ops.push('0.88 0.90 0.94 RG 0.5 w');
    ops.push(`44 ${currentY - 8} m 568 ${currentY - 8} l S`);
    currentY -= 28;
  });

  // Totals Summary Box
  const summaryTopY = currentY - 10;
  ops.push('0.95 0.97 0.99 rg');
  ops.push(`310 ${summaryTopY - 86} 258 86 re f`);
  ops.push('0.78 0.82 0.88 RG 1 w');
  ops.push(`310 ${summaryTopY - 86} 258 86 re S`);

  ops.push('0.30 0.35 0.44 rg');
  ops.push(`BT /F1 9 Tf 324 ${summaryTopY - 20} Td (Subtotal / Principal:) Tj ET`);
  ops.push(`BT /F3 9 Tf 450 ${summaryTopY - 20} Td (${escapePdfText(receipt.subtotalPdfSafe)}) Tj ET`);

  ops.push(`BT /F1 9 Tf 324 ${summaryTopY - 38} Td (Taxes, VAT & Levies:) Tj ET`);
  ops.push(`BT /F3 9 Tf 450 ${summaryTopY - 38} Td (${escapePdfText(receipt.taxAndFeesPdfSafe)}) Tj ET`);

  // Divider inside summary box
  ops.push('0.75 0.80 0.86 RG 0.8 w');
  ops.push(`324 ${summaryTopY - 48} m 554 ${summaryTopY - 48} l S`);

  // Total Paid Highlight
  ops.push('0.05 0.45 0.32 rg');
  ops.push(`BT /F2 10.5 Tf 324 ${summaryTopY - 66} Td (TOTAL (${escapePdfText(receipt.currency)}):) Tj ET`);
  ops.push(`BT /F3 11 Tf 445 ${summaryTopY - 66} Td (${escapePdfText(receipt.totalPdfSafe)}) Tj ET`);

  ops.push('0.45 0.50 0.58 rg');
  ops.push(`BT /F3 8 Tf 324 ${summaryTopY - 80} Td (Base Clearing Equivalent: ${escapePdfText(receipt.baseUsdEquivalent)}) Tj ET`);

  // Verification Footer Box
  ops.push('0.85 0.88 0.92 RG 0.75 w');
  ops.push('44 240 m 568 240 l S');
  ops.push('0.35 0.40 0.48 rg');
  ops.push(`BT /F2 9 Tf 44 220 Td (AetherVoyage Digital Travel Wallet - Official Settlement Record) Tj ET`);
  ops.push(`BT /F1 8.5 Tf 44 205 Td (This receipt confirms completed settlement via ${escapePdfText(receipt.paymentMethod)} under Booking Reference ${escapePdfText(receipt.bookingRef)}.) Tj ET`);
  ops.push(`BT /F1 8.5 Tf 44 191 Td (All 8 Divisions Transit & Hospitality Network | Verified Digital Tax Invoice & E-Ticket Voucher.) Tj ET`);

  const contentStream = ops.join('\n');

  const objects: string[] = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R /F3 6 0 R >> >> /Contents 7 0 R >>\nendobj\n',
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n',
    '6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold >>\nendobj\n',
    `7 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream\nendobj\n`,
  ];

  let pdfBody = '%PDF-1.4\n';
  const offsets: number[] = [0];

  for (const obj of objects) {
    offsets.push(pdfBody.length);
    pdfBody += obj;
  }

  const xrefOffset = pdfBody.length;
  pdfBody += `xref\n0 ${objects.length + 1}\n`;
  pdfBody += '0000000000 65535 f \n';
  for (let i = 1; i <= objects.length; i++) {
    const padded = String(offsets[i]).padStart(10, '0');
    pdfBody += `${padded} 00000 n \n`;
  }

  pdfBody += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  const blob = new Blob([pdfBody], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `AetherVoyage-Receipt-${receipt.transactionRef}-${receipt.currency}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 3000);

  return receipt;
}
