import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

export async function createTestApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.init();
  return app;
}

export async function seedTestData(app: INestApplication) {
  const prisma = app.get(PrismaService);

  const schemas = [
    {
      typeUri: 'VerifiableEducationCredential',
      name: 'Education Credential',
      sdClaims: ['name', 'degree', 'institution', 'graduationYear', 'gpa'],
      schema: {
        name: { type: 'string' },
        degree: { type: 'string' },
        institution: { type: 'string' },
        graduationYear: { type: 'number' },
        gpa: { type: 'number' },
      },
    },
    {
      typeUri: 'VerifiableIncomeCredential',
      name: 'Income Credential',
      sdClaims: ['name', 'annualIncome', 'employer', 'employmentType', 'employmentSince'],
      schema: {
        name: { type: 'string' },
        annualIncome: { type: 'number' },
        employer: { type: 'string' },
        currency: { type: 'string' },
        employmentType: { type: 'string' },
        employmentSince: { type: 'string' },
      },
    },
    {
      typeUri: 'VerifiableIdentityCredential',
      name: 'Identity Credential',
      sdClaims: ['name', 'dateOfBirth', 'gender', 'address', 'nationalId'],
      schema: {
        name: { type: 'string' },
        dateOfBirth: { type: 'string' },
        gender: { type: 'string' },
        country: { type: 'string' },
        address: { type: 'string' },
        nationalId: { type: 'string' },
      },
    },
  ];

  for (const schema of schemas) {
    await prisma.credentialSchema.upsert({
      where: { typeUri: schema.typeUri },
      update: schema,
      create: schema,
    });
  }
}

export async function cleanupTestData(app: INestApplication) {
  const prisma = app.get(PrismaService);

  await prisma.auditLog.deleteMany();
  await prisma.consentRecord.deleteMany();
  await prisma.verificationRequest.deleteMany();
  await prisma.verifierPolicy.deleteMany();
  await prisma.walletCredential.deleteMany();
  await prisma.walletDid.deleteMany();
  await prisma.issuedCredential.deleteMany();
  await prisma.credentialOffer.deleteMany();
  await prisma.statusList.deleteMany();
  await prisma.trustedIssuer.deleteMany();
  await prisma.trustPolicy.deleteMany();
  await prisma.credentialSchema.deleteMany();
  await prisma.did.deleteMany();
}
