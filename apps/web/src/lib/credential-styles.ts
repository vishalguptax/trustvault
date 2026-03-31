/**
 * Static class mappings for credential type accent colors.
 * Avoids dynamic Tailwind template literals like `bg-${accent}` which do not compile.
 */

export const credentialAccentStyles: Record<string, {
  bar: string;
  iconBg: string;
  text: string;
  selectedBorder: string;
  selectedRing: string;
  badgeBg: string;
  checkboxOn: string;
  claimOn: string;
}> = {
  'credential-education': {
    bar: 'bg-credential-education',
    iconBg: 'bg-credential-education/10 text-credential-education',
    text: 'text-credential-education',
    selectedBorder: 'border-credential-education',
    selectedRing: 'ring-credential-education/30',
    badgeBg: 'bg-credential-education/10 text-credential-education',
    checkboxOn: 'border-credential-education bg-credential-education',
    claimOn: 'border-credential-education/50 bg-credential-education/5',
  },
  'credential-income': {
    bar: 'bg-credential-income',
    iconBg: 'bg-credential-income/10 text-credential-income',
    text: 'text-credential-income',
    selectedBorder: 'border-credential-income',
    selectedRing: 'ring-credential-income/30',
    badgeBg: 'bg-credential-income/10 text-credential-income',
    checkboxOn: 'border-credential-income bg-credential-income',
    claimOn: 'border-credential-income/50 bg-credential-income/5',
  },
  'credential-identity': {
    bar: 'bg-credential-identity',
    iconBg: 'bg-credential-identity/10 text-credential-identity',
    text: 'text-credential-identity',
    selectedBorder: 'border-credential-identity',
    selectedRing: 'ring-credential-identity/30',
    badgeBg: 'bg-credential-identity/10 text-credential-identity',
    checkboxOn: 'border-credential-identity bg-credential-identity',
    claimOn: 'border-credential-identity/50 bg-credential-identity/5',
  },
  primary: {
    bar: 'bg-primary',
    iconBg: 'bg-primary/10 text-primary',
    text: 'text-primary',
    selectedBorder: 'border-primary',
    selectedRing: 'ring-primary/30',
    badgeBg: 'bg-primary/10 text-primary',
    checkboxOn: 'border-primary bg-primary',
    claimOn: 'border-primary/50 bg-primary/5',
  },
};

/** Map schema type URI to accent key */
export const schemaTypeToAccent: Record<string, string> = {
  VerifiableEducationCredential: 'credential-education',
  VerifiableIncomeCredential: 'credential-income',
  VerifiableIdentityCredential: 'credential-identity',
};

export function getAccentStyles(accentKey: string) {
  return credentialAccentStyles[accentKey] ?? credentialAccentStyles.primary;
}
