import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function truncateDid(did: string, chars: number = 16): string {
  if (did.length <= chars + 6) return did;
  return `${did.slice(0, chars)}...${did.slice(-4)}`;
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date));
}

export const CLAIM_LABELS: Record<string, string> = {
  institutionName: 'Institution Name',
  degree: 'Degree',
  fieldOfStudy: 'Field of Study',
  graduationDate: 'Graduation Date',
  gpa: 'GPA',
  studentId: 'Student ID',
  employerName: 'Employer Name',
  jobTitle: 'Job Title',
  annualIncome: 'Annual Income',
  currency: 'Currency',
  employmentStartDate: 'Employment Start Date',
  employeeId: 'Employee ID',
  fullName: 'Full Name',
  dateOfBirth: 'Date of Birth',
  nationality: 'Nationality',
  documentNumber: 'Document Number',
  address: 'Address',
  gender: 'Gender',
  iss: 'Issuer',
  sub: 'Subject',
  vct: 'Credential Type',
};

export function getClaimLabel(key: string): string {
  return CLAIM_LABELS[key] ?? key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getCredentialAccentClass(type: string): string {
  if (type.includes('Education')) return 'credential-education';
  if (type.includes('Income')) return 'credential-income';
  if (type.includes('Identity')) return 'credential-identity';
  return 'primary';
}
