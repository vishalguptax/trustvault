export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';

export const CREDENTIAL_TYPE_CONFIG: Record<string, CredentialTypeStyle> = {
  VerifiableEducationCredential: {
    name: 'Education Credential',
    accent: '#7C3AED',
    gradientStart: '#7C3AED',
    gradientEnd: '#4F46E5',
  },
  VerifiableIncomeCredential: {
    name: 'Income Credential',
    accent: '#14B8A6',
    gradientStart: '#14B8A6',
    gradientEnd: '#10B981',
  },
  VerifiableIdentityCredential: {
    name: 'Identity Credential',
    accent: '#F59E0B',
    gradientStart: '#F59E0B',
    gradientEnd: '#F97316',
  },
};

interface CredentialTypeStyle {
  name: string;
  accent: string;
  gradientStart: string;
  gradientEnd: string;
}

/** Category definitions with display order and icons */
export const CREDENTIAL_CATEGORIES = [
  { type: 'VerifiableEducationCredential', label: 'Education', icon: 'school-outline' as const, accent: '#7C3AED' },
  { type: 'VerifiableIncomeCredential', label: 'Income & Employment', icon: 'cash-outline' as const, accent: '#14B8A6' },
  { type: 'VerifiableIdentityCredential', label: 'Identity', icon: 'person-outline' as const, accent: '#F59E0B' },
] as const;

export const CLAIM_LABELS: Record<string, string> = {
  // Common
  documentName: 'Document Name',
  // Education
  institutionName: 'Issuing Organization',
  degree: 'Degree / Certificate Title',
  fieldOfStudy: 'Field of Study',
  graduationDate: 'Date of Completion',
  gpa: 'GPA / CGPA',
  percentage: 'Percentage',
  grade: 'Grade',
  studentId: 'Student / Roll Number',
  semester: 'Semester / Year',
  boardName: 'Board / University Name',
  registrationNumber: 'Registration Number',
  // Income & Employment
  employerName: 'Issuing Organization',
  jobTitle: 'Job Title / Designation',
  department: 'Department',
  annualIncome: 'Annual Income',
  monthlySalary: 'Monthly Salary',
  currency: 'Currency',
  employmentStartDate: 'Employment Start Date',
  employmentEndDate: 'Employment End Date',
  employeeId: 'Employee ID',
  employmentType: 'Employment Type',
  designation: 'Designation',
  // Identity
  fullName: 'Full Name',
  dateOfBirth: 'Date of Birth',
  nationality: 'Nationality',
  documentNumber: 'Document Number',
  address: 'Address',
  gender: 'Gender',
  issuingAuthority: 'Issuing Authority',
  validUntil: 'Valid Until',
  placeOfBirth: 'Place of Birth',
  fatherName: "Father's Name",
  bloodGroup: 'Blood Group',
  // System
  iss: 'Issuer',
  sub: 'Subject',
  vct: 'Credential Type',
};

export function getClaimLabel(key: string): string {
  return CLAIM_LABELS[key] ?? key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Convert a raw credential type string to a human-readable name */
export function formatCredentialType(type: string): string {
  const config = CREDENTIAL_TYPE_CONFIG[type];
  if (config) return config.name;
  return type
    .replace(/^Verifiable/, '')
    .replace(/Credential$/, ' Credential')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .trim();
}

/** Derive a meaningful document title from credential claims */
export function getDocumentTitle(type: string, claims: Record<string, unknown>): string {
  // If the issuer set an explicit document name, use it
  const docName = claims.documentName as string | undefined;
  if (docName) return docName;

  // Otherwise derive from type-specific claims
  switch (type) {
    case 'VerifiableEducationCredential': {
      const degree = claims.degree as string | undefined;
      const field = claims.fieldOfStudy as string | undefined;
      if (degree && field) return `${degree} in ${field}`;
      if (degree) return degree;
      return 'Education Certificate';
    }
    case 'VerifiableIncomeCredential': {
      const title = claims.jobTitle as string | undefined;
      const employer = claims.employerName as string | undefined;
      if (title && employer) return `${title} at ${employer}`;
      if (title) return `${title} — Income Certificate`;
      return 'Income Certificate';
    }
    case 'VerifiableIdentityCredential': {
      const name = claims.fullName as string | undefined;
      const docNum = claims.documentNumber as string | undefined;
      if (name && docNum) return `${name} — ID #${docNum}`;
      if (name) return `${name} — Identity Document`;
      return 'Identity Document';
    }
    default:
      return formatCredentialType(type);
  }
}
