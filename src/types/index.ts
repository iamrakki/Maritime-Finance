// UI State Types for Onboarding
export type Step = 'wallet-connect' | 'did-company-info' | 'documents' | 'verification' | 'vc-issuance';
export type VerificationStatus = 'pending' | 'uploading-ipfs' | 'awaiting-review' | 'verified' | 'failed';
export type DocumentStatus = 'not-uploaded' | 'uploaded' | 'verifying' | 'verified' | 'rejected';
export type DIDStatus = 'pending' | 'checking' | 'found' | 'not-found' | 'creating' | 'created' | 'failed';
export type VCStatus = 'pending' | 'issuing' | 'issued' | 'failed';

// Form Data Types
export interface CompanyInfo {
  companyName: string;
  registrationNumber: string;
  countryOfIncorporation: string;
  registeredAddress: string;
  contactEmail: string;
  contactPhone: string;
}

export interface Document {
  name: string;
  file: File | null;
  status: DocumentStatus;
  uploadedAt?: string;
}
