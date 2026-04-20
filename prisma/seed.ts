import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { BUILT_IN_QUESTIONNAIRES } from '../src/lib/data-questionnaires';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database…');

  // ── Platform settings ──────────────────────────────────────────────────────
  await prisma.platformSetting.upsert({
    where: { key: 'app_name' },
    create: { key: 'app_name', value: 'Vengagement' },
    update: {},
  });

  // ── Demo tenant ────────────────────────────────────────────────────────────
  const tenant = await prisma.tenant.upsert({
    where: { id: 'seed-tenant' },
    create: {
      id: 'seed-tenant',
      name: 'Acme Legal LLP',
      industry: 'Law Firm',
      enableAiReview: true,
    },
    update: { name: 'Acme Legal LLP' },
  });

  // Tenant settings
  await prisma.tenantSettings.upsert({
    where: { tenantId: tenant.id },
    create: {
      tenantId: tenant.id,
      requireSecurityReview: true,
      requireLegalReview: true,
      requireExecApproval: false,
      allowGuestQuestionnaire: true,
      guestLinkExpireDays: 30,
      annualReviewMonth: 1,
      documentExpiryLeadDays: 30,
      branding: JSON.stringify({
        primaryColor: '#4f46e5',
        accentColor: '#4f46e5',
        colorMode: 'dark',
      }),
    },
    update: {},
  });

  // ── Admin user ─────────────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash('Admin1234!', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@acmelegal.com' },
    create: {
      tenantId: tenant.id,
      email: 'admin@acmelegal.com',
      name: 'Platform Admin',
      role: 'admin',
      passwordHash: adminHash,
      mustChangePw: false,
    },
    update: {},
  });

  // ── Company admin ──────────────────────────────────────────────────────────
  const coAdminHash = await bcrypt.hash('Admin1234!', 12);
  await prisma.user.upsert({
    where: { email: 'vendor.admin@acmelegal.com' },
    create: {
      tenantId: tenant.id,
      email: 'vendor.admin@acmelegal.com',
      name: 'Vendor Admin',
      role: 'company_admin',
      passwordHash: coAdminHash,
      mustChangePw: false,
    },
    update: {},
  });

  // ── Demo vendors ───────────────────────────────────────────────────────────
  const vendorData = [
    {
      name: 'Salesforce',
      legalName: 'Salesforce, Inc.',
      website: 'https://salesforce.com',
      category: JSON.stringify(['SaaS', 'CRM']),
      criticality: 'critical',
      status: 'active',
      processesPII: true,
      processesPHI: false,
      processesFinancial: true,
      isExempt: false,
      riskScore: 62,
      riskLevel: 'high',
      description: 'CRM platform used for client relationship management and billing.',
    },
    {
      name: 'Microsoft 365',
      legalName: 'Microsoft Corporation',
      website: 'https://microsoft.com',
      category: JSON.stringify(['SaaS', 'Productivity']),
      criticality: 'critical',
      status: 'active',
      processesPII: true,
      processesPHI: false,
      processesFinancial: false,
      isExempt: true,
      exemptReason: 'Tier-1 cloud provider with SOC 2 Type II and ISO 27001 certifications',
      trustCenterUrl: 'https://www.microsoft.com/en-us/trust-center',
      riskScore: 10,
      riskLevel: 'low',
      description: 'Email, collaboration, and productivity suite.',
    },
    {
      name: 'DocuSign',
      legalName: 'DocuSign, Inc.',
      website: 'https://docusign.com',
      category: JSON.stringify(['SaaS']),
      criticality: 'high',
      status: 'active',
      processesPII: true,
      processesPHI: false,
      processesFinancial: false,
      isExempt: false,
      riskScore: 45,
      riskLevel: 'medium',
      description: 'Electronic signature platform for client agreements and contracts.',
    },
    {
      name: 'Clio',
      legalName: 'Themis Solutions Inc.',
      website: 'https://clio.com',
      category: JSON.stringify(['SaaS', 'Legal Tech']),
      criticality: 'critical',
      status: 'active',
      processesPII: true,
      processesPHI: true,
      processesFinancial: true,
      isExempt: false,
      riskScore: 71,
      riskLevel: 'high',
      description: 'Legal practice management software. Stores confidential client files and billing.',
    },
    {
      name: 'AWS',
      legalName: 'Amazon Web Services, Inc.',
      website: 'https://aws.amazon.com',
      category: JSON.stringify(['IaaS', 'Cloud']),
      criticality: 'critical',
      status: 'active',
      processesPII: true,
      processesPHI: true,
      processesFinancial: true,
      isExempt: true,
      exemptReason: 'Tier-1 cloud provider with FedRAMP, SOC 2 Type II, and ISO 27001 certifications',
      trustCenterUrl: 'https://aws.amazon.com/compliance/',
      riskScore: 10,
      riskLevel: 'low',
      description: 'Cloud infrastructure provider.',
    },
    {
      name: 'Logikcull',
      legalName: 'Logikcull, Inc.',
      website: 'https://logikcull.com',
      category: JSON.stringify(['SaaS', 'eDiscovery']),
      criticality: 'high',
      status: 'active',
      processesPII: true,
      processesPHI: false,
      processesFinancial: false,
      isExempt: false,
      riskScore: 55,
      riskLevel: 'high',
      description: 'eDiscovery and document review platform for litigation matters.',
    },
  ];

  const vendors: Array<{ id: string; name: string }> = [];
  for (const v of vendorData) {
    const vid = `seed-${v.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`;
    const vendor = await prisma.vendor.upsert({
      where: { id: vid },
      create: { id: vid, tenantId: tenant.id, createdBy: admin.id, ...v },
      update: {},
    });
    vendors.push({ id: vendor.id, name: vendor.name });
  }

  // ── Demo clients ───────────────────────────────────────────────────────────
  const clientData = [
    {
      name: 'Apex Industries LLC',
      matter: 'ACM-2024-001',
      type: 'corporate',
      status: 'active',
      primaryContactName: 'Robert Chen',
      primaryContactEmail: 'rchen@apexindustries.com',
    },
    {
      name: 'Sterling Financial Group',
      matter: 'ACM-2024-002',
      type: 'transactional',
      status: 'active',
      primaryContactName: 'Sarah Williams',
      primaryContactEmail: 'swilliams@sterlingfg.com',
    },
    {
      name: 'Meridian Healthcare',
      matter: 'ACM-2024-003',
      type: 'advisory',
      status: 'active',
      primaryContactName: 'Dr. Lisa Park',
      primaryContactEmail: 'lpark@meridianhc.com',
    },
  ];

  const clients: Array<{ id: string; name: string }> = [];
  for (const c of clientData) {
    const cid = `seed-client-${c.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`;
    const client = await prisma.client.upsert({
      where: { id: cid },
      create: { id: cid, tenantId: tenant.id, createdBy: admin.id, ...c },
      update: {},
    });
    clients.push({ id: client.id, name: client.name });
  }

  // ── Built-in questionnaires ────────────────────────────────────────────────
  for (const q of BUILT_IN_QUESTIONNAIRES) {
    await prisma.questionnaire.upsert({
      where: { id: q.id },
      create: {
        id: q.id,
        tenantId: null,
        name: q.name,
        description: q.description,
        type: q.type,
        version: q.version,
        sections: JSON.stringify(q.sections),
        isBuiltIn: true,
        isActive: true,
        isPublic: true,
      },
      update: {},
    });
  }

  // ── Sample questionnaire assignment ───────────────────────────────────────
  const salesforce = vendors.find((v) => v.name === 'Salesforce');
  if (salesforce) {
    const sigLite = await prisma.questionnaire.findUnique({ where: { id: 'builtin-sig-lite' } });
    if (sigLite) {
      await prisma.questionnaireAssignment.upsert({
        where: { id: 'seed-assignment-1' },
        create: {
          id: 'seed-assignment-1',
          vendorId: salesforce.id,
          tenantId: tenant.id,
          questionnaireId: sigLite.id,
          assignedBy: admin.id,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: 'pending',
          vendorContactName: 'Jane Doe',
          vendorContactEmail: 'security@salesforce.com',
        },
        update: {},
      });
    }
  }

  // ── Automation rules ───────────────────────────────────────────────────────
  await prisma.automationRule.upsert({
    where: { id: 'seed-rule-annual' },
    create: {
      id: 'seed-rule-annual',
      tenantId: tenant.id,
      name: 'Annual Vendor Review',
      description: 'Send questionnaire and request document renewal every January',
      triggerType: 'annual_review',
      config: JSON.stringify({ month: 1, leadDays: 30 }),
      isActive: true,
    },
    update: {},
  });

  await prisma.automationRule.upsert({
    where: { id: 'seed-rule-expiry' },
    create: {
      id: 'seed-rule-expiry',
      tenantId: tenant.id,
      name: 'Document Expiry Alert',
      description: 'Notify when documents are expiring within 30 days',
      triggerType: 'document_expiry',
      config: JSON.stringify({ leadDays: 30 }),
      isActive: true,
    },
    update: {},
  });

  console.log('Seed complete.');
  console.log('');
  console.log('Login credentials:');
  console.log('  Platform Admin: admin@acmelegal.com / Admin1234!');
  console.log('  Vendor Admin:   vendor.admin@acmelegal.com / Admin1234!');
  console.log('');
  console.log(`Vendors: ${vendors.length} | Clients: ${clients.length}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
