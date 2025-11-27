// Centralized document status calculation utility
export function calculateDocumentStatus(expiryDateString: string | undefined | null): 'valid' | 'expiring_soon' | 'expired' {
  if (!expiryDateString) return 'valid';
  
  // Parse date with timezone fix
  const expiryDate = new Date(expiryDateString + 'T00:00:00');
  const now = new Date();
  
  // Set time to start of day for accurate comparison
  now.setHours(0, 0, 0, 0);
  expiryDate.setHours(0, 0, 0, 0);
  
  const daysDiff = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysDiff < 0) return 'expired';
  if (daysDiff <= 30) return 'expiring_soon'; // 30 days or less
  return 'valid';
}

// Helper function for Date objects (used in forms)
export function calculateDocumentStatusFromDate(expiryDate: Date | undefined): 'valid' | 'expiring_soon' | 'expired' {
  if (!expiryDate) return 'valid';
  
  const now = new Date();
  const daysDiff = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysDiff < 0) return 'expired';
  if (daysDiff <= 30) return 'expiring_soon'; // 30 days or less  
  return 'valid';
}