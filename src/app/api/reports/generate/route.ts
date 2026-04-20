import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { prisma } from '@/lib/db/prisma';
import { SESSION_COOKIE, validateSessionToken } from '@/lib/auth/session';
import { parseJsonSafe } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const session = await validateSessionToken(token);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { type, format, filters } = await req.json();
  const tenantId = session.tenantId;

  const vendorWhere = {
    tenantId,
    ...(filters?.criticality ? { criticality: filters.criticality } : {}),
    ...(filters?.status ? { status: filters.status } : {}),
  };

  try {
    switch (type) {
      case 'vendor-summary':
        return generateVendorSummary(tenantId, format, vendorWhere);
      case 'risk-report':
        return generateRiskReport(tenantId, format, vendorWhere);
      case 'document-status':
        return generateDocumentStatus(tenantId, format, vendorWhere);
      case 'questionnaire-status':
        return generateQuestionnaireStatus(tenantId, format, vendorWhere);
      case 'audit-package':
        return generateAuditPackage(tenantId, format, vendorWhere);
      case 'compliance-matrix':
        return generateComplianceMatrix(tenantId, format, vendorWhere);
      default:
        return NextResponse.json({ error: 'Unknown report type' }, { status: 400 });
    }
  } catch (err) {
    console.error('Report generation error:', err);
    return NextResponse.json({ error: 'Report generation failed' }, { status: 500 });
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function xlsxResponse(wb: ExcelJS.Workbook, filename: string) {
  const buf = await wb.xlsx.writeBuffer();
  return new NextResponse(buf, {
    headers: {
      'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'content-disposition': `attachment; filename="${filename}"`,
    },
  });
}

function csvResponse(rows: string[][], filename: string) {
  const csv = rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
  return new NextResponse(csv, {
    headers: {
      'content-type': 'text/csv',
      'content-disposition': `attachment; filename="${filename}"`,
    },
  });
}

function addHeaderRow(ws: ExcelJS.Worksheet, headers: string[]) {
  const row = ws.addRow(headers);
  row.font = { bold: true };
  row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2A3C' } };
  row.font = { bold: true, color: { argb: 'FFCCCCCC' } };
  headers.forEach((_, i) => { ws.getColumn(i + 1).width = 20; });
}

function dateFmt(d: Date | string | null | undefined) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US');
}

// ─── Report generators ────────────────────────────────────────────────────────

async function generateVendorSummary(tenantId: string, format: string, where: object) {
  const vendors = await prisma.vendor.findMany({
    where,
    orderBy: [{ criticality: 'asc' }, { name: 'asc' }],
  });

  const headers = ['Name', 'Legal Name', 'Category', 'Criticality', 'Status', 'Risk Score', 'Risk Level', 'PII', 'PHI', 'Financial', 'Exempt', 'Contract End', 'Last Review'];
  const rows = vendors.map((v) => [
    v.name, v.legalName ?? '', v.category ?? '', v.criticality, v.status,
    String(v.riskScore ?? ''), v.riskLevel ?? '',
    v.processesPII ? 'Yes' : 'No', v.processesPHI ? 'Yes' : 'No', v.processesFinancial ? 'Yes' : 'No',
    v.isExempt ? 'Yes' : 'No',
    dateFmt(v.contractEndDate), dateFmt(v.lastReviewDate),
  ]);

  if (format === 'csv') return csvResponse([headers, ...rows], `vendor-summary-${today()}.csv`);
  if (format === 'pdf') return pdfReport('Vendor Summary', headers, rows, `vendor-summary-${today()}.pdf`);

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Vendors');
  addHeaderRow(ws, headers);
  rows.forEach((r) => ws.addRow(r));
  return xlsxResponse(wb, `vendor-summary-${today()}.xlsx`);
}

async function generateRiskReport(tenantId: string, format: string, where: object) {
  const vendors = await prisma.vendor.findMany({
    where: { ...where, riskScore: { not: null } },
    orderBy: { riskScore: 'desc' },
  });

  const headers = ['Vendor', 'Criticality', 'Risk Score', 'Risk Level', 'PII', 'PHI', 'Financial', 'Category', 'Last Review', 'Next Review'];
  const rows = vendors.map((v) => [
    v.name, v.criticality, String(v.riskScore ?? ''), v.riskLevel ?? '',
    v.processesPII ? 'Yes' : 'No', v.processesPHI ? 'Yes' : 'No', v.processesFinancial ? 'Yes' : 'No',
    v.category ?? '', dateFmt(v.lastReviewDate), dateFmt(v.nextReviewDate),
  ]);

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Risk Report');
  addHeaderRow(ws, headers);
  rows.forEach((r) => {
    const row = ws.addRow(r);
    const score = parseInt(r[2]);
    if (score >= 75) row.getCell(4).font = { color: { argb: 'FFEF4444' } };
    else if (score >= 50) row.getCell(4).font = { color: { argb: 'FFF59E0B' } };
  });

  if (format === 'pdf') return pdfReport('Vendor Risk Report', headers, rows, `risk-report-${today()}.pdf`);
  return xlsxResponse(wb, `risk-report-${today()}.xlsx`);
}

async function generateDocumentStatus(tenantId: string, format: string, where: object) {
  const vendors = await prisma.vendor.findMany({
    where,
    select: { id: true, name: true },
  });
  const vendorIds = vendors.map((v) => v.id);
  const vendorMap = Object.fromEntries(vendors.map((v) => [v.id, v.name]));

  const docs = await prisma.vendorDocument.findMany({
    where: { tenantId, ...(vendorIds.length ? { vendorId: { in: vendorIds } } : {}) },
    orderBy: [{ vendorId: 'asc' }, { documentType: 'asc' }],
  });

  const headers = ['Vendor', 'Document Type', 'Name', 'Review Status', 'AI Review', 'Document Date', 'Expires', 'Uploaded', 'Approved'];
  const rows = docs.map((d) => [
    vendorMap[d.vendorId ?? ''] ?? 'N/A',
    d.documentType, d.name, d.reviewStatus, d.aiReviewStatus,
    dateFmt(d.documentDate), dateFmt(d.expiresAt), dateFmt(d.uploadedAt),
    d.isApproved ? 'Yes' : 'No',
  ]);

  if (format === 'csv') {
    return csvResponse([headers, ...rows], `document-status-${today()}.csv`);
  }

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Documents');
  addHeaderRow(ws, headers);
  rows.forEach((r) => ws.addRow(r));
  return xlsxResponse(wb, `document-status-${today()}.xlsx`);
}

async function generateQuestionnaireStatus(tenantId: string, format: string, where: object) {
  const vendors = await prisma.vendor.findMany({ where, select: { id: true, name: true } });
  const vendorIds = vendors.map((v) => v.id);
  const vendorMap = Object.fromEntries(vendors.map((v) => [v.id, v.name]));

  const assignments = await prisma.questionnaireAssignment.findMany({
    where: { tenantId, ...(vendorIds.length ? { vendorId: { in: vendorIds } } : {}) },
    include: { questionnaire: { select: { name: true } } },
    orderBy: [{ vendorId: 'asc' }, { assignedAt: 'desc' }],
  });

  const headers = ['Vendor', 'Questionnaire', 'Status', 'Assigned', 'Due Date', 'Completed', 'Score', 'Contact Email'];
  const rows = assignments.map((a) => [
    vendorMap[a.vendorId] ?? 'N/A',
    a.questionnaire.name, a.status,
    dateFmt(a.assignedAt), dateFmt(a.dueDate), dateFmt(a.completedAt),
    String(a.score ?? ''), a.vendorContactEmail ?? '',
  ]);

  if (format === 'csv') {
    return csvResponse([headers, ...rows], `questionnaire-status-${today()}.csv`);
  }

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Questionnaires');
  addHeaderRow(ws, headers);
  rows.forEach((r) => ws.addRow(r));
  return xlsxResponse(wb, `questionnaire-status-${today()}.xlsx`);
}

async function generateComplianceMatrix(tenantId: string, format: string, where: object) {
  const vendors = await prisma.vendor.findMany({
    where,
    include: { documents: { select: { documentType: true, isApproved: true } } },
    orderBy: [{ criticality: 'asc' }, { name: 'asc' }],
  });

  const requiredTypes = ['BAA', 'NDA', 'MSA', 'DPA', 'SOC2Report', 'ISO27001Cert'];
  const headers = ['Vendor', 'Criticality', ...requiredTypes];
  const rows = vendors.map((v) => {
    const docSet = new Set(v.documents.map((d) => d.documentType));
    return [
      v.name, v.criticality,
      ...requiredTypes.map((t) => docSet.has(t) ? 'Yes' : 'Missing'),
    ];
  });

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Compliance Matrix');
  addHeaderRow(ws, headers);
  rows.forEach((r) => {
    const row = ws.addRow(r);
    r.slice(2).forEach((val, i) => {
      if (val === 'Missing') {
        row.getCell(i + 3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '33EF4444' } };
        row.getCell(i + 3).font = { color: { argb: 'FFEF4444' } };
      }
    });
  });

  return xlsxResponse(wb, `compliance-matrix-${today()}.xlsx`);
}

async function generateAuditPackage(tenantId: string, format: string, where: object) {
  const [vendors, docs, assignments] = await Promise.all([
    prisma.vendor.findMany({ where, orderBy: { name: 'asc' } }),
    prisma.vendorDocument.findMany({ where: { tenantId }, orderBy: { uploadedAt: 'desc' } }),
    prisma.questionnaireAssignment.findMany({
      where: { tenantId },
      include: { questionnaire: { select: { name: true } } },
    }),
  ]);

  const wb = new ExcelJS.Workbook();

  // Sheet 1: Vendors
  const ws1 = wb.addWorksheet('Vendors');
  addHeaderRow(ws1, ['Name', 'Criticality', 'Status', 'Risk Score', 'Risk Level', 'Category', 'PII', 'PHI', 'Financial', 'Exempt']);
  vendors.forEach((v) => ws1.addRow([
    v.name, v.criticality, v.status, String(v.riskScore ?? ''), v.riskLevel ?? '',
    v.category ?? '', v.processesPII ? 'Yes' : 'No', v.processesPHI ? 'Yes' : 'No',
    v.processesFinancial ? 'Yes' : 'No', v.isExempt ? 'Yes' : 'No',
  ]));

  // Sheet 2: Documents
  const vendorMap = Object.fromEntries(vendors.map((v) => [v.id, v.name]));
  const ws2 = wb.addWorksheet('Documents');
  addHeaderRow(ws2, ['Vendor', 'Type', 'Name', 'Review Status', 'AI Status', 'Expires', 'Approved']);
  docs.forEach((d) => ws2.addRow([
    vendorMap[d.vendorId ?? ''] ?? '', d.documentType, d.name,
    d.reviewStatus, d.aiReviewStatus, dateFmt(d.expiresAt), d.isApproved ? 'Yes' : 'No',
  ]));

  // Sheet 3: Questionnaires
  const ws3 = wb.addWorksheet('Questionnaires');
  addHeaderRow(ws3, ['Vendor ID', 'Questionnaire', 'Status', 'Due', 'Completed', 'Score']);
  assignments.forEach((a) => ws3.addRow([
    vendorMap[a.vendorId] ?? a.vendorId,
    a.questionnaire.name, a.status,
    dateFmt(a.dueDate), dateFmt(a.completedAt), String(a.score ?? ''),
  ]));

  if (format === 'pdf') {
    const allHeaders = ['Name', 'Criticality', 'Status', 'Risk Score', 'Risk Level'];
    const allRows = vendors.map((v) => [v.name, v.criticality, v.status, String(v.riskScore ?? '—'), v.riskLevel ?? '—']);
    return pdfReport('Audit Package — Vendor Summary', allHeaders, allRows, `audit-package-${today()}.pdf`);
  }
  return xlsxResponse(wb, `audit-package-${today()}.xlsx`);
}

function pdfReport(title: string, headers: string[], rows: string[][], filename: string): Promise<NextResponse> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'LETTER' });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('error', reject);
    doc.on('end', () => {
      const buf = Buffer.concat(chunks);
      resolve(new NextResponse(buf, {
        headers: {
          'content-type': 'application/pdf',
          'content-disposition': `attachment; filename="${filename}"`,
        },
      }));
    });

    // Header
    doc.fontSize(16).font('Helvetica-Bold').text(title, { align: 'left' });
    doc.fontSize(9).font('Helvetica').fillColor('#6b7280')
      .text(`Generated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, { align: 'left' });
    doc.moveDown(0.8);

    // Column widths — distribute available width
    const pageWidth = doc.page.width - 80;
    const colCount = headers.length;
    const colWidth = Math.floor(pageWidth / colCount);

    // Table header row
    const headerY = doc.y;
    doc.rect(40, headerY, pageWidth, 18).fill('#1e293b');
    doc.fillColor('#cbd5e1').fontSize(8).font('Helvetica-Bold');
    headers.forEach((h, i) => {
      doc.text(h.slice(0, 18), 44 + i * colWidth, headerY + 5, { width: colWidth - 4, ellipsis: true });
    });
    doc.moveDown(0.1);

    // Data rows
    doc.font('Helvetica').fontSize(8).fillColor('#1e293b');
    rows.forEach((row, ri) => {
      if (doc.y > doc.page.height - 80) {
        doc.addPage();
        doc.fontSize(8).font('Helvetica').fillColor('#1e293b');
      }
      const rowY = doc.y + 2;
      if (ri % 2 === 0) {
        doc.rect(40, rowY - 1, pageWidth, 16).fill('#f8fafc');
      }
      doc.fillColor('#1e293b');
      row.forEach((cell, i) => {
        doc.text(String(cell ?? '').slice(0, 24), 44 + i * colWidth, rowY + 2, { width: colWidth - 4, ellipsis: true });
      });
      doc.y = rowY + 16;
    });

    // Footer
    doc.moveDown(1);
    doc.fontSize(8).fillColor('#9ca3af')
      .text(`${rows.length} record${rows.length !== 1 ? 's' : ''} — Confidential`, { align: 'center' });

    doc.end();
  });
}

function today() {
  return new Date().toISOString().split('T')[0];
}
