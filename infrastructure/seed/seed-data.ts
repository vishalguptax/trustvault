import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const BCRYPT_ROUNDS = 12;

// ============================================
// Credential Schemas
// ============================================
const schemas = [
  {
    typeUri: 'VerifiableEducationCredential',
    name: 'Education Credential',
    description: 'Verifiable credential for educational qualifications',
    sdClaims: ['fieldOfStudy', 'graduationDate', 'gpa', 'studentId'],
    schema: {
      institutionName: { type: 'string', label: 'Institution Name', required: true },
      degree: { type: 'string', label: 'Degree', required: true },
      fieldOfStudy: { type: 'string', label: 'Field of Study', required: true },
      graduationDate: { type: 'date', label: 'Graduation Date', required: true },
      gpa: { type: 'number', label: 'GPA', required: false },
      studentId: { type: 'string', label: 'Student ID', required: false },
    },
    display: { name: 'Education Credential', backgroundColor: '#1E40AF', textColor: '#FFFFFF' },
  },
  {
    typeUri: 'VerifiableIncomeCredential',
    name: 'Income Credential',
    description: 'Verifiable credential for income and employment details',
    sdClaims: ['jobTitle', 'annualIncome', 'employmentStartDate', 'employeeId'],
    schema: {
      employerName: { type: 'string', label: 'Employer Name', required: true },
      jobTitle: { type: 'string', label: 'Job Title', required: true },
      annualIncome: { type: 'number', label: 'Annual Income', required: true },
      currency: { type: 'string', label: 'Currency', required: true },
      employmentStartDate: { type: 'date', label: 'Employment Start Date', required: true },
      employeeId: { type: 'string', label: 'Employee ID', required: false },
    },
    display: { name: 'Income Credential', backgroundColor: '#047857', textColor: '#FFFFFF' },
  },
  {
    typeUri: 'VerifiableIdentityCredential',
    name: 'Identity Credential',
    description: 'Verifiable credential for identity information',
    sdClaims: ['dateOfBirth', 'nationality', 'documentNumber', 'address', 'gender'],
    schema: {
      fullName: { type: 'string', label: 'Full Name', required: true },
      dateOfBirth: { type: 'date', label: 'Date of Birth', required: true },
      nationality: { type: 'string', label: 'Nationality', required: true },
      documentNumber: { type: 'string', label: 'Document Number', required: true },
      address: { type: 'string', label: 'Address', required: false },
      gender: { type: 'string', label: 'Gender', required: false },
    },
    display: { name: 'Identity Credential', backgroundColor: '#7C3AED', textColor: '#FFFFFF' },
  },
];

// ============================================
// Verifier Policies
// ============================================
const policies = [
  {
    name: 'require-trusted-issuer',
    description: 'Requires the credential issuer to be in the trust registry',
    rules: { trustRegistry: { required: true } },
  },
  {
    name: 'require-active-status',
    description: 'Requires the credential to not be revoked or suspended',
    rules: { statusCheck: { required: true, rejectRevoked: true, rejectSuspended: true } },
  },
  {
    name: 'require-non-expired',
    description: 'Requires the credential to not be expired',
    rules: { expirationCheck: { required: true } },
  },
];

// ============================================
// Default Users
// ============================================
const users = [
  {
    email: 'admin@trustvault.dev',
    password: 'Admin@123456',
    name: 'TrustVault Admin',
    role: 'admin',
  },
  {
    email: 'issuer@trustvault.dev',
    password: 'Issuer@123456',
    name: 'National Technical University',
    role: 'issuer',
  },
  {
    email: 'verifier@trustvault.dev',
    password: 'Verifier@123456',
    name: 'HomeFirst Finance',
    role: 'verifier',
  },
  {
    email: 'holder@trustvault.dev',
    password: 'Holder@123456',
    name: 'Sandhya Sharma',
    role: 'holder',
  },
];

async function seed() {
  console.log('=== TrustVault Seed ===\n');

  // --- Schemas ---
  console.log('Seeding credential schemas...');
  for (const schema of schemas) {
    await prisma.credentialSchema.upsert({
      where: { typeUri: schema.typeUri },
      update: schema,
      create: schema,
    });
    console.log(`  + ${schema.typeUri}`);
  }

  // --- Policies ---
  console.log('\nSeeding verifier policies...');
  for (const policy of policies) {
    await prisma.verifierPolicy.upsert({
      where: { name: policy.name },
      update: policy,
      create: policy,
    });
    console.log(`  + ${policy.name}`);
  }

  // --- Users ---
  console.log('\nSeeding users...');
  for (const user of users) {
    const existing = await prisma.user.findUnique({ where: { email: user.email } });
    if (existing) {
      console.log(`  ~ ${user.email} (${user.role}) — already exists`);
      continue;
    }

    const passwordHash = await bcrypt.hash(user.password, BCRYPT_ROUNDS);
    await prisma.user.create({
      data: {
        email: user.email,
        passwordHash,
        name: user.name,
        role: user.role,
        refreshTokens: [],
        apiKeys: [],
        active: true,
      },
    });
    console.log(`  + ${user.email} (${user.role})`);
  }

  // --- Summary ---
  console.log('\n=== Seed Complete ===');
  console.log('\nDefault credentials:');
  console.log('┌─────────────────────────────┬────────────────┬──────────┐');
  console.log('│ Email                       │ Password       │ Role     │');
  console.log('├─────────────────────────────┼────────────────┼──────────┤');
  for (const user of users) {
    const email = user.email.padEnd(27);
    const pass = user.password.padEnd(14);
    const role = user.role.padEnd(8);
    console.log(`│ ${email} │ ${pass} │ ${role} │`);
  }
  console.log('└─────────────────────────────┴────────────────┴──────────┘');
}

seed()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
