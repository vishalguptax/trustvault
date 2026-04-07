import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { DatabaseService } from '../../src/database/database.service';

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
  const db = app.get(DatabaseService);

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
    await db.credentialSchema.findOneAndUpdate(
      { typeUri: schema.typeUri },
      { $set: schema },
      { upsert: true, new: true },
    );
  }
}

export async function cleanupTestData(app: INestApplication) {
  const db = app.get(DatabaseService);

  await db.auditLog.deleteMany({});
  await db.consentRecord.deleteMany({});
  await db.verificationRequest.deleteMany({});
  await db.verifierPolicy.deleteMany({});
  await db.walletCredential.deleteMany({});
  await db.walletDid.deleteMany({});
  await db.issuedCredential.deleteMany({});
  await db.credentialOffer.deleteMany({});
  await db.statusList.deleteMany({});
  await db.trustedIssuer.deleteMany({});
  await db.trustPolicy.deleteMany({});
  await db.credentialSchema.deleteMany({});
  await db.did.deleteMany({});
}
