import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes, createHash } from 'crypto';
import { SDJwtVcInstance } from '@sd-jwt/sd-jwt-vc';
import type { Signer, Hasher } from '@sd-jwt/types';
import * as jose from 'jose';
import type { JWK } from 'jose';

const prisma = new PrismaClient();

// ============================================
// SD-JWT-VC Helpers (mirrors SdJwtService)
// ============================================
const sdJwtHasher: Hasher = (data: string, alg: string): Uint8Array => {
  const algorithm = alg === 'sha-256' ? 'sha256' : alg;
  return new Uint8Array(createHash(algorithm).update(data).digest());
};

const sdJwtSaltGenerator = (): string => randomBytes(16).toString('base64url');

function createSigner(privateKeyJwk: JWK): Signer {
  return async (data: string): Promise<string> => {
    const key = (await jose.importJWK(privateKeyJwk, 'ES256')) as jose.KeyLike;
    const parts = data.split('.');
    if (parts.length !== 2) throw new Error('Invalid data format for signing');
    const payload = Buffer.from(parts[1], 'base64url');
    const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
    const jws = await new jose.CompactSign(payload).setProtectedHeader(header).sign(key);
    return jws.split('.')[2];
  };
}

async function generateKeyPair(): Promise<{ publicKey: JWK; privateKey: JWK }> {
  const { publicKey, privateKey } = await jose.generateKeyPair('ES256', { extractable: true });
  const pubJwk = await jose.exportJWK(publicKey);
  const privJwk = await jose.exportJWK(privateKey);
  return { publicKey: pubJwk, privateKey: privJwk };
}

async function issueCredential(
  issuerPrivateKey: JWK,
  holderPublicKey: JWK,
  payload: Record<string, unknown>,
  sdClaims: string[],
): Promise<string> {
  const instance = new SDJwtVcInstance({
    hasher: sdJwtHasher,
    hashAlg: 'sha-256',
    saltGenerator: sdJwtSaltGenerator,
    signAlg: 'ES256',
    signer: createSigner(issuerPrivateKey),
  });

  const fullPayload = {
    ...payload,
    cnf: { jwk: holderPublicKey },
  };

  const sdJwtVc = await instance.issue(
    fullPayload as Parameters<SDJwtVcInstance['issue']>[0],
    { _sd: sdClaims } as Parameters<SDJwtVcInstance['issue']>[1],
  );
  return sdJwtVc;
}

const BCRYPT_ROUNDS = 12;

// ============================================
// Credential Schemas
// ============================================
const schemas = [
  {
    typeUri: 'VerifiableEducationCredential',
    name: 'Education Credential',
    description: 'Verifiable credential for educational qualifications',
    sdClaims: ['fieldOfStudy', 'graduationDate', 'gpa', 'percentage', 'grade', 'studentId', 'semester', 'registrationNumber'],
    schema: {
      documentName: { type: 'string', label: 'Document Name', required: true },
      candidateName: { type: 'string', label: 'Candidate Name', required: true },
      institutionName: { type: 'string', label: 'Issuing Organization', required: true },
      degree: { type: 'string', label: 'Degree / Certificate Title', required: false },
      fieldOfStudy: { type: 'string', label: 'Field of Study', required: false },
      graduationDate: { type: 'date', label: 'Date of Completion', required: false },
      gpa: { type: 'number', label: 'GPA / CGPA', required: false },
      percentage: { type: 'number', label: 'Percentage', required: false },
      grade: { type: 'string', label: 'Grade', required: false },
      studentId: { type: 'string', label: 'Student / Roll Number', required: false },
      semester: { type: 'string', label: 'Semester / Year', required: false },
      boardName: { type: 'string', label: 'Board / University Name', required: false },
      registrationNumber: { type: 'string', label: 'Registration Number', required: false },
    },
    display: { name: 'Education Credential', backgroundColor: '#1E40AF', textColor: '#FFFFFF' },
  },
  {
    typeUri: 'VerifiableIncomeCredential',
    name: 'Income Credential',
    description: 'Verifiable credential for income and employment details',
    sdClaims: ['jobTitle', 'department', 'annualIncome', 'monthlySalary', 'employmentStartDate', 'employmentEndDate', 'employeeId', 'employmentType'],
    schema: {
      documentName: { type: 'string', label: 'Document Name', required: true },
      employeeName: { type: 'string', label: 'Employee Name', required: true },
      employerName: { type: 'string', label: 'Issuing Organization', required: true },
      jobTitle: { type: 'string', label: 'Job Title / Designation', required: false },
      department: { type: 'string', label: 'Department', required: false },
      annualIncome: { type: 'number', label: 'Annual Income', required: false },
      monthlySalary: { type: 'number', label: 'Monthly Salary', required: false },
      currency: { type: 'string', label: 'Currency', required: false },
      employmentStartDate: { type: 'date', label: 'Employment Start Date', required: false },
      employmentEndDate: { type: 'date', label: 'Employment End Date', required: false },
      employeeId: { type: 'string', label: 'Employee ID', required: false },
      employmentType: { type: 'string', label: 'Employment Type', required: false },
    },
    display: { name: 'Income Credential', backgroundColor: '#047857', textColor: '#FFFFFF' },
  },
  {
    typeUri: 'VerifiableIdentityCredential',
    name: 'Identity Credential',
    description: 'Verifiable credential for identity information',
    sdClaims: ['dateOfBirth', 'nationality', 'documentNumber', 'address', 'gender', 'validUntil', 'placeOfBirth', 'fatherName', 'bloodGroup'],
    schema: {
      documentName: { type: 'string', label: 'Document Name', required: true },
      fullName: { type: 'string', label: 'Full Name', required: true },
      dateOfBirth: { type: 'date', label: 'Date of Birth', required: false },
      nationality: { type: 'string', label: 'Nationality', required: false },
      documentNumber: { type: 'string', label: 'Document Number', required: false },
      address: { type: 'string', label: 'Address', required: false },
      gender: { type: 'string', label: 'Gender', required: false },
      issuingAuthority: { type: 'string', label: 'Issuing Authority', required: false },
      validUntil: { type: 'date', label: 'Valid Until', required: false },
      placeOfBirth: { type: 'string', label: 'Place of Birth', required: false },
      fatherName: { type: 'string', label: "Father's Name", required: false },
      bloodGroup: { type: 'string', label: 'Blood Group', required: false },
    },
    display: { name: 'Identity Credential', backgroundColor: '#7C3AED', textColor: '#FFFFFF' },
  },
];

// ============================================
// Verifier Policies
// ============================================
const verifierPolicies = [
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
    email: 'admin@trustilock.dev',
    password: 'Admin@123456',
    name: 'TrustiLock Admin',
    role: 'admin',
  },
  {
    email: 'issuer@trustilock.dev',
    password: 'Issuer@123456',
    name: 'National Technical University',
    role: 'issuer',
  },
  {
    email: 'issuer2@trustilock.dev',
    password: 'Issuer@123456',
    name: 'Apex Financial Services',
    role: 'issuer',
  },
  {
    email: 'verifier@trustilock.dev',
    password: 'Verifier@123456',
    name: 'HomeFirst Finance',
    role: 'verifier',
  },
  {
    email: 'verifier2@trustilock.dev',
    password: 'Verifier@123456',
    name: 'ClearHire Background Checks',
    role: 'verifier',
  },
  {
    email: 'holder@trustilock.dev',
    password: 'Holder@123456',
    name: 'Sandhya Sharma',
    role: 'holder',
  },
  {
    email: 'holder2@trustilock.dev',
    password: 'Holder@123456',
    name: 'Raj Patel',
    role: 'holder',
  },
];

// ============================================
// Trusted Issuers (Trust Registry)
// ============================================
const trustedIssuers = [
  {
    did: 'did:key:zSeedIssuerNTU',
    name: 'National Technical University',
    description: 'Accredited university issuing education credentials',
    website: 'https://ntu.example.edu',
    credentialTypes: ['VerifiableEducationCredential'],
    status: 'active',
  },
  {
    did: 'did:key:zSeedIssuerApex',
    name: 'Apex Financial Services',
    description: 'Licensed financial institution issuing income and employment credentials',
    website: 'https://apex.example.com',
    credentialTypes: ['VerifiableIncomeCredential'],
    status: 'active',
  },
  {
    did: 'did:key:zSeedIssuerGovID',
    name: 'National Identity Authority',
    description: 'Government agency issuing identity credentials',
    website: 'https://nia.example.gov',
    credentialTypes: ['VerifiableIdentityCredential'],
    status: 'active',
  },
  {
    did: 'did:key:zSeedIssuerSuspended',
    name: 'Revoked Academy',
    description: 'Formerly accredited institution — trust suspended',
    credentialTypes: ['VerifiableEducationCredential'],
    status: 'suspended',
  },
];

// ============================================
// Trust Policies
// ============================================
const trustPolicies = [
  {
    name: 'education-verification',
    description: 'Policy for verifying education credentials — requires trusted issuer and active status',
    rules: {
      requiredCredentialTypes: ['VerifiableEducationCredential'],
      trustRegistryCheck: true,
      statusCheck: true,
      expirationCheck: true,
    },
  },
  {
    name: 'income-verification',
    description: 'Policy for verifying income credentials for loan applications',
    rules: {
      requiredCredentialTypes: ['VerifiableIncomeCredential'],
      trustRegistryCheck: true,
      statusCheck: true,
      expirationCheck: true,
      minimumClaims: ['employerName', 'annualIncome', 'currency'],
    },
  },
  {
    name: 'identity-verification',
    description: 'Policy for verifying identity credentials',
    rules: {
      requiredCredentialTypes: ['VerifiableIdentityCredential'],
      trustRegistryCheck: true,
      statusCheck: true,
      expirationCheck: true,
      minimumClaims: ['fullName', 'dateOfBirth', 'documentNumber'],
    },
  },
];

// ============================================
// Dummy Issued Credentials (Issuer dashboard)
// ============================================
function buildIssuedCredentials() {
  const now = Date.now();
  const DAY = 86400000;

  return [
    {
      issuerDid: 'did:key:zSeedIssuerNTU',
      subjectDid: 'did:key:zSeedHolderSandhya',
      schemaTypeUri: 'VerifiableEducationCredential',
      credentialHash: createHash('sha256').update(`edu-sandhya-${now}`).digest('hex'),
      status: 'active',
      issuedAt: new Date(now - 30 * DAY),
      expiresAt: new Date(now + 335 * DAY),
    },
    {
      issuerDid: 'did:key:zSeedIssuerNTU',
      subjectDid: 'did:key:zSeedHolderRaj',
      schemaTypeUri: 'VerifiableEducationCredential',
      credentialHash: createHash('sha256').update(`edu-raj-${now}`).digest('hex'),
      status: 'active',
      issuedAt: new Date(now - 15 * DAY),
      expiresAt: new Date(now + 350 * DAY),
    },
    {
      issuerDid: 'did:key:zSeedIssuerApex',
      subjectDid: 'did:key:zSeedHolderSandhya',
      schemaTypeUri: 'VerifiableIncomeCredential',
      credentialHash: createHash('sha256').update(`income-sandhya-${now}`).digest('hex'),
      status: 'active',
      issuedAt: new Date(now - 10 * DAY),
      expiresAt: new Date(now + 355 * DAY),
    },
    {
      issuerDid: 'did:key:zSeedIssuerGovID',
      subjectDid: 'did:key:zSeedHolderSandhya',
      schemaTypeUri: 'VerifiableIdentityCredential',
      credentialHash: createHash('sha256').update(`id-sandhya-${now}`).digest('hex'),
      status: 'active',
      issuedAt: new Date(now - 60 * DAY),
      expiresAt: new Date(now + 305 * DAY),
    },
    {
      issuerDid: 'did:key:zSeedIssuerNTU',
      subjectDid: 'did:key:zSeedHolderOld',
      schemaTypeUri: 'VerifiableEducationCredential',
      credentialHash: createHash('sha256').update(`edu-revoked-${now}`).digest('hex'),
      status: 'revoked',
      issuedAt: new Date(now - 120 * DAY),
      expiresAt: new Date(now + 245 * DAY),
    },
  ];
}

// ============================================
// Dummy Verification Requests (Verifier dashboard)
// ============================================
function buildVerificationRequests() {
  const now = Date.now();
  const DAY = 86400000;

  return [
    {
      verifierDid: 'did:key:zSeedVerifierHomeFirst',
      presentationDefinition: {
        id: 'pd-seed-1',
        input_descriptors: [{
          id: 'descriptor-0',
          format: { 'vc+sd-jwt': { alg: ['ES256'] } },
          constraints: {
            fields: [{ path: ['$.vct'], filter: { type: 'string', const: 'VerifiableEducationCredential' } }],
          },
        }],
      },
      nonce: randomBytes(16).toString('base64url'),
      state: randomBytes(16).toString('base64url'),
      requiredCredentialTypes: ['VerifiableEducationCredential'],
      policies: ['require-trusted-issuer', 'require-active-status', 'require-non-expired'],
      status: 'verified',
      result: {
        verified: true,
        checks: {
          signature: { passed: true },
          expiration: { passed: true },
          trustRegistry: { passed: true, issuerName: 'National Technical University' },
          status: { passed: true },
        },
      },
      expiresAt: new Date(now + 10 * 60 * 1000),
      createdAt: new Date(now - 5 * DAY),
      completedAt: new Date(now - 5 * DAY + 30000),
    },
    {
      verifierDid: 'did:key:zSeedVerifierHomeFirst',
      presentationDefinition: {
        id: 'pd-seed-2',
        input_descriptors: [{
          id: 'descriptor-0',
          format: { 'vc+sd-jwt': { alg: ['ES256'] } },
          constraints: {
            fields: [{ path: ['$.vct'], filter: { type: 'string', const: 'VerifiableIncomeCredential' } }],
          },
        }],
      },
      nonce: randomBytes(16).toString('base64url'),
      state: randomBytes(16).toString('base64url'),
      requiredCredentialTypes: ['VerifiableIncomeCredential'],
      policies: ['require-trusted-issuer', 'require-active-status', 'require-non-expired'],
      status: 'verified',
      result: {
        verified: true,
        checks: {
          signature: { passed: true },
          expiration: { passed: true },
          trustRegistry: { passed: true, issuerName: 'Apex Financial Services' },
          status: { passed: true },
        },
      },
      expiresAt: new Date(now + 10 * 60 * 1000),
      createdAt: new Date(now - 3 * DAY),
      completedAt: new Date(now - 3 * DAY + 45000),
    },
    {
      verifierDid: 'did:key:zSeedVerifierClearHire',
      presentationDefinition: {
        id: 'pd-seed-3',
        input_descriptors: [{
          id: 'descriptor-0',
          format: { 'vc+sd-jwt': { alg: ['ES256'] } },
          constraints: {
            fields: [{ path: ['$.vct'], filter: { type: 'string', const: 'VerifiableEducationCredential' } }],
          },
        }],
      },
      nonce: randomBytes(16).toString('base64url'),
      state: randomBytes(16).toString('base64url'),
      requiredCredentialTypes: ['VerifiableEducationCredential'],
      policies: ['require-trusted-issuer', 'require-active-status', 'require-non-expired'],
      status: 'rejected',
      result: {
        verified: false,
        checks: {
          signature: { passed: true },
          expiration: { passed: true },
          trustRegistry: { passed: false, reason: 'Issuer not found in trust registry' },
          status: { passed: true },
        },
      },
      expiresAt: new Date(now + 10 * 60 * 1000),
      createdAt: new Date(now - 1 * DAY),
      completedAt: new Date(now - 1 * DAY + 20000),
    },
    {
      verifierDid: 'did:key:zSeedVerifierHomeFirst',
      presentationDefinition: {
        id: 'pd-seed-4',
        input_descriptors: [
          {
            id: 'descriptor-0',
            format: { 'vc+sd-jwt': { alg: ['ES256'] } },
            constraints: {
              fields: [{ path: ['$.vct'], filter: { type: 'string', const: 'VerifiableIdentityCredential' } }],
            },
          },
          {
            id: 'descriptor-1',
            format: { 'vc+sd-jwt': { alg: ['ES256'] } },
            constraints: {
              fields: [{ path: ['$.vct'], filter: { type: 'string', const: 'VerifiableIncomeCredential' } }],
            },
          },
        ],
      },
      nonce: randomBytes(16).toString('base64url'),
      state: randomBytes(16).toString('base64url'),
      requiredCredentialTypes: ['VerifiableIdentityCredential', 'VerifiableIncomeCredential'],
      policies: ['require-trusted-issuer', 'require-active-status', 'require-non-expired'],
      status: 'pending',
      expiresAt: new Date(now + 10 * 60 * 1000),
      createdAt: new Date(now),
    },
  ];
}

// ============================================
// Audit Log Entries
// ============================================
function buildAuditLogs() {
  const now = Date.now();
  const DAY = 86400000;

  return [
    {
      action: 'credential.issued',
      actorDid: 'did:key:zSeedIssuerNTU',
      targetId: 'VerifiableEducationCredential',
      details: { subjectDid: 'did:key:zSeedHolderSandhya', schemaTypeUri: 'VerifiableEducationCredential' },
      timestamp: new Date(now - 30 * DAY),
    },
    {
      action: 'credential.issued',
      actorDid: 'did:key:zSeedIssuerApex',
      targetId: 'VerifiableIncomeCredential',
      details: { subjectDid: 'did:key:zSeedHolderSandhya', schemaTypeUri: 'VerifiableIncomeCredential' },
      timestamp: new Date(now - 10 * DAY),
    },
    {
      action: 'presentation.verified',
      actorDid: 'did:key:zSeedVerifierHomeFirst',
      targetId: 'VerifiableEducationCredential',
      details: { result: 'verified', credentialTypes: ['VerifiableEducationCredential'] },
      timestamp: new Date(now - 5 * DAY),
    },
    {
      action: 'presentation.rejected',
      actorDid: 'did:key:zSeedVerifierClearHire',
      targetId: 'VerifiableEducationCredential',
      details: { result: 'rejected', reason: 'Issuer not in trust registry' },
      timestamp: new Date(now - 1 * DAY),
    },
    {
      action: 'credential.revoked',
      actorDid: 'did:key:zSeedIssuerNTU',
      targetId: 'VerifiableEducationCredential',
      details: { subjectDid: 'did:key:zSeedHolderOld', reason: 'Fraudulent application' },
      timestamp: new Date(now - 120 * DAY),
    },
    {
      action: 'trust.issuer_registered',
      actorDid: 'admin',
      targetId: 'did:key:zSeedIssuerNTU',
      details: { issuerName: 'National Technical University' },
      timestamp: new Date(now - 60 * DAY),
    },
    {
      action: 'trust.issuer_registered',
      actorDid: 'admin',
      targetId: 'did:key:zSeedIssuerApex',
      details: { issuerName: 'Apex Financial Services' },
      timestamp: new Date(now - 55 * DAY),
    },
    {
      action: 'trust.issuer_suspended',
      actorDid: 'admin',
      targetId: 'did:key:zSeedIssuerSuspended',
      details: { issuerName: 'Revoked Academy', reason: 'Accreditation revoked' },
      timestamp: new Date(now - 45 * DAY),
    },
  ];
}

// ============================================
// Seed Runner
// ============================================
async function seed() {
  console.log('=== TrustiLock Seed ===\n');

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

  // --- Verifier Policies ---
  console.log('\nSeeding verifier policies...');
  for (const policy of verifierPolicies) {
    await prisma.verifierPolicy.upsert({
      where: { name: policy.name },
      update: policy,
      create: policy,
    });
    console.log(`  + ${policy.name}`);
  }

  // --- Trust Policies ---
  console.log('\nSeeding trust policies...');
  for (const policy of trustPolicies) {
    await prisma.trustPolicy.upsert({
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

  // --- Trusted Issuers ---
  console.log('\nSeeding trusted issuers...');
  for (const issuer of trustedIssuers) {
    await prisma.trustedIssuer.upsert({
      where: { did: issuer.did },
      update: issuer,
      create: issuer,
    });
    console.log(`  + ${issuer.name} (${issuer.status})`);
  }

  // --- Issued Credentials ---
  console.log('\nSeeding issued credentials...');
  const issuedCreds = buildIssuedCredentials();
  for (const cred of issuedCreds) {
    const existing = await prisma.issuedCredential.findUnique({ where: { credentialHash: cred.credentialHash } });
    if (existing) {
      console.log(`  ~ ${cred.schemaTypeUri} for ${cred.subjectDid} — already exists`);
      continue;
    }
    await prisma.issuedCredential.create({ data: cred });
    console.log(`  + ${cred.schemaTypeUri} → ${cred.subjectDid} (${cred.status})`);
  }

  // --- Verification Requests ---
  console.log('\nSeeding verification requests...');
  const existingRequests = await prisma.verificationRequest.count();
  if (existingRequests > 0) {
    console.log(`  ~ ${existingRequests} requests already exist — skipping`);
  } else {
    const requests = buildVerificationRequests();
    for (const req of requests) {
      await prisma.verificationRequest.create({ data: req });
      console.log(`  + ${req.requiredCredentialTypes.join(', ')} (${req.status})`);
    }
  }

  // --- Wallet Credentials (real SD-JWT-VCs for holder dashboard) ---
  console.log('\nSeeding wallet credentials...');
  const holderUser = await prisma.user.findUnique({ where: { email: 'holder@trustilock.dev' } });
  const holder2User = await prisma.user.findUnique({ where: { email: 'holder2@trustilock.dev' } });

  if (holderUser) {
    const existingWalletCreds = await prisma.walletCredential.count({ where: { holderId: holderUser.id } });
    if (existingWalletCreds > 0) {
      console.log(`  ~ holder@trustilock.dev already has ${existingWalletCreds} credentials — skipping`);
    } else {
      const now = Date.now();
      const DAY = 86400000;

      // Generate key pairs for issuers and holder
      const ntuKeys = await generateKeyPair();
      const apexKeys = await generateKeyPair();
      const govKeys = await generateKeyPair();
      const holderKeys = await generateKeyPair();

      // Store holder DID + keys so presentations work
      const holderDid = `did:key:zSeedHolder${holderUser.id.slice(-8)}`;
      const existingDid = await prisma.walletDid.findFirst({ where: { holderId: holderUser.id } });
      if (!existingDid) {
        await prisma.walletDid.create({
          data: {
            holderId: holderUser.id,
            did: holderDid,
            method: 'key',
            keyData: JSON.parse(JSON.stringify(holderKeys)),
            isPrimary: true,
          },
        });
        console.log(`  + WalletDid for holder@trustilock.dev`);
      }

      // Store issuer DIDs + keys so verification can resolve them
      for (const { did, keys } of [
        { did: 'did:key:zSeedIssuerNTU', keys: ntuKeys },
        { did: 'did:key:zSeedIssuerApex', keys: apexKeys },
        { did: 'did:key:zSeedIssuerGovID', keys: govKeys },
      ]) {
        const existingIssuerDid = await prisma.did.findUnique({ where: { did } });
        if (!existingIssuerDid) {
          await prisma.did.create({
            data: {
              did,
              method: 'key',
              document: { id: did, verificationMethod: [] },
              keys: [{
                kid: `${did}#key-1`,
                type: 'ES256',
                publicKeyJwk: keys.publicKey as unknown as Record<string, string>,
                privateKeyJwk: keys.privateKey as unknown as Record<string, string>,
                purposes: ['assertionMethod', 'authentication'],
              }],
              active: true,
            },
          });
        }
      }

      const credentialDefs = [
        {
          credentialType: 'VerifiableEducationCredential',
          issuerDid: 'did:key:zSeedIssuerNTU',
          issuerKey: ntuKeys.privateKey,
          sdClaims: ['fieldOfStudy', 'graduationDate', 'gpa', 'studentId'],
          claims: {
            documentName: 'B.Tech Degree Certificate',
            candidateName: 'Aarav Sharma',
            institutionName: 'National Technical University',
            degree: 'Bachelor of Technology',
            fieldOfStudy: 'Computer Science',
            graduationDate: '2024-06-15',
            gpa: 3.8,
            studentId: 'NTU-2020-CS-1042',
          },
          issuedAt: new Date(now - 30 * DAY),
          expiresAt: new Date(now + 335 * DAY),
        },
        {
          credentialType: 'VerifiableIncomeCredential',
          issuerDid: 'did:key:zSeedIssuerApex',
          issuerKey: apexKeys.privateKey,
          sdClaims: ['jobTitle', 'annualIncome', 'employmentStartDate', 'employeeId'],
          claims: {
            documentName: 'Employment Verification Letter',
            employeeName: 'Aarav Sharma',
            employerName: 'Apex Financial Services',
            jobTitle: 'Software Engineer',
            annualIncome: 1200000,
            currency: 'INR',
            employmentStartDate: '2024-07-01',
            employeeId: 'APEX-EMP-3847',
          },
          issuedAt: new Date(now - 10 * DAY),
          expiresAt: new Date(now + 355 * DAY),
        },
        {
          credentialType: 'VerifiableIdentityCredential',
          issuerDid: 'did:key:zSeedIssuerGovID',
          issuerKey: govKeys.privateKey,
          sdClaims: ['dateOfBirth', 'nationality', 'documentNumber', 'address', 'gender'],
          claims: {
            documentName: 'Aadhaar Card',
            fullName: 'Sandhya Sharma',
            dateOfBirth: '2002-03-15',
            nationality: 'Indian',
            documentNumber: 'XXXX-XXXX-4829',
            address: 'Mumbai, Maharashtra',
            gender: 'Female',
          },
          issuedAt: new Date(now - 60 * DAY),
          expiresAt: new Date(now + 305 * DAY),
        },
      ];

      for (const def of credentialDefs) {
        const payload: Record<string, unknown> = {
          iss: def.issuerDid,
          sub: holderDid,
          vct: def.credentialType,
          iat: Math.floor(def.issuedAt.getTime() / 1000),
          exp: Math.floor(def.expiresAt.getTime() / 1000),
          ...def.claims,
        };

        const rawCredential = await issueCredential(
          def.issuerKey,
          holderKeys.publicKey,
          payload,
          def.sdClaims,
        );

        await prisma.walletCredential.create({
          data: {
            holderId: holderUser.id,
            rawCredential,
            format: 'sd-jwt-vc',
            credentialType: def.credentialType,
            issuerDid: def.issuerDid,
            claims: JSON.parse(JSON.stringify(payload)),
            sdClaims: def.sdClaims,
            issuedAt: def.issuedAt,
            expiresAt: def.expiresAt,
          },
        });
        console.log(`  + ${def.credentialType} → holder@trustilock.dev (real SD-JWT-VC)`);
      }
    }
  }

  if (holder2User) {
    const existingWalletCreds = await prisma.walletCredential.count({ where: { holderId: holder2User.id } });
    if (existingWalletCreds > 0) {
      console.log(`  ~ holder2@trustilock.dev already has ${existingWalletCreds} credentials — skipping`);
    } else {
      const now = Date.now();
      const DAY = 86400000;

      const holder2Keys = await generateKeyPair();
      const ntuKeys2 = await generateKeyPair();
      const holder2Did = `did:key:zSeedHolder2${holder2User.id.slice(-8)}`;

      const existingDid = await prisma.walletDid.findFirst({ where: { holderId: holder2User.id } });
      if (!existingDid) {
        await prisma.walletDid.create({
          data: {
            holderId: holder2User.id,
            did: holder2Did,
            method: 'key',
            keyData: JSON.parse(JSON.stringify(holder2Keys)),
            isPrimary: true,
          },
        });
      }

      const payload: Record<string, unknown> = {
        iss: 'did:key:zSeedIssuerNTU',
        sub: holder2Did,
        vct: 'VerifiableEducationCredential',
        iat: Math.floor((now - 15 * DAY) / 1000),
        exp: Math.floor((now + 350 * DAY) / 1000),
        documentName: 'M.Sc Degree Certificate',
        candidateName: 'Priya Patel',
        institutionName: 'National Technical University',
        degree: 'Master of Science',
        fieldOfStudy: 'Data Science',
        graduationDate: '2025-05-20',
        gpa: 3.6,
        studentId: 'NTU-2023-DS-0187',
      };

      const rawCredential = await issueCredential(
        ntuKeys2.privateKey,
        holder2Keys.publicKey,
        payload,
        ['fieldOfStudy', 'graduationDate', 'gpa', 'studentId'],
      );

      await prisma.walletCredential.create({
        data: {
          holderId: holder2User.id,
          rawCredential,
          format: 'sd-jwt-vc',
          credentialType: 'VerifiableEducationCredential',
          issuerDid: 'did:key:zSeedIssuerNTU',
          claims: JSON.parse(JSON.stringify(payload)),
          sdClaims: ['fieldOfStudy', 'graduationDate', 'gpa', 'studentId'],
          issuedAt: new Date(now - 15 * DAY),
          expiresAt: new Date(now + 350 * DAY),
        },
      });
      console.log(`  + VerifiableEducationCredential → holder2@trustilock.dev (real SD-JWT-VC)`);
    }
  }

  // --- Audit Logs ---
  console.log('\nSeeding audit logs...');
  const existingLogs = await prisma.auditLog.count();
  if (existingLogs > 0) {
    console.log(`  ~ ${existingLogs} logs already exist — skipping`);
  } else {
    const logs = buildAuditLogs();
    for (const log of logs) {
      await prisma.auditLog.create({ data: log });
      console.log(`  + ${log.action}`);
    }
  }

  // --- Summary ---
  console.log('\n=== Seed Complete ===');
  console.log('\nDefault credentials:');
  console.log('┌─────────────────────────────────┬────────────────┬──────────┐');
  console.log('│ Email                           │ Password       │ Role     │');
  console.log('├─────────────────────────────────┼────────────────┼──────────┤');
  for (const user of users) {
    const email = user.email.padEnd(31);
    const pass = user.password.padEnd(14);
    const role = user.role.padEnd(8);
    console.log(`│ ${email} │ ${pass} │ ${role} │`);
  }
  console.log('└─────────────────────────────────┴────────────────┴──────────┘');

  const counts = {
    users: await prisma.user.count(),
    schemas: await prisma.credentialSchema.count(),
    trustedIssuers: await prisma.trustedIssuer.count(),
    issuedCredentials: await prisma.issuedCredential.count(),
    verificationRequests: await prisma.verificationRequest.count(),
    verifierPolicies: await prisma.verifierPolicy.count(),
    trustPolicies: await prisma.trustPolicy.count(),
    walletCredentials: await prisma.walletCredential.count(),
    auditLogs: await prisma.auditLog.count(),
  };
  console.log('\nDatabase totals:');
  for (const [key, count] of Object.entries(counts)) {
    console.log(`  ${key}: ${count}`);
  }
}

seed()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
