import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const schemas = [
  {
    typeUri: 'VerifiableEducationCredential',
    name: 'Education Credential',
    description: 'Verifiable credential for educational qualifications',
    sdClaims: ['name', 'degree', 'institution', 'graduationYear', 'gpa'],
    schema: {
      name: { type: 'string' },
      degree: { type: 'string' },
      institution: { type: 'string' },
      graduationYear: { type: 'number' },
      gpa: { type: 'number' },
    },
    display: { name: 'Education Credential', backgroundColor: '#1E40AF', textColor: '#FFFFFF' },
  },
  {
    typeUri: 'VerifiableIncomeCredential',
    name: 'Income Credential',
    description: 'Verifiable credential for income and employment details',
    sdClaims: ['name', 'annualIncome', 'employer', 'employmentType', 'employmentSince'],
    schema: {
      name: { type: 'string' },
      annualIncome: { type: 'number' },
      employer: { type: 'string' },
      currency: { type: 'string' },
      employmentType: { type: 'string' },
      employmentSince: { type: 'string' },
    },
    display: { name: 'Income Credential', backgroundColor: '#047857', textColor: '#FFFFFF' },
  },
  {
    typeUri: 'VerifiableIdentityCredential',
    name: 'Identity Credential',
    description: 'Verifiable credential for identity information',
    sdClaims: ['name', 'dateOfBirth', 'gender', 'address', 'nationalId'],
    schema: {
      name: { type: 'string' },
      dateOfBirth: { type: 'string' },
      gender: { type: 'string' },
      country: { type: 'string' },
      address: { type: 'string' },
      nationalId: { type: 'string' },
    },
    display: { name: 'Identity Credential', backgroundColor: '#7C3AED', textColor: '#FFFFFF' },
  },
];

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

async function seed() {
  console.log('Seeding credential schemas...');
  for (const schema of schemas) {
    await prisma.credentialSchema.upsert({
      where: { typeUri: schema.typeUri },
      update: schema,
      create: schema,
    });
    console.log(`  Created/updated schema: ${schema.typeUri}`);
  }

  console.log('Seeding verifier policies...');
  for (const policy of policies) {
    await prisma.verifierPolicy.upsert({
      where: { name: policy.name },
      update: policy,
      create: policy,
    });
    console.log(`  Created/updated policy: ${policy.name}`);
  }

  console.log('Seed completed.');
}

seed()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
