/**
 * Format a date string to a readable format
 * e.g. "2026-05-18" -> "May 18, 2026"
 */
export const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Get badge bg color based on attendance percentage
 */
export const getPercentageBadge = (pct) => {
  if (pct >= 75) return 'bg-green-100 text-green-700';
  if (pct >= 50) return 'bg-yellow-100 text-yellow-700';
  return 'bg-red-100 text-red-700';
};

/**
 * Convert data URL to File object
 */
export const dataURLtoFile = (dataurl, filename) => {
  const arr = dataurl.split(',');
  const match = arr[0].match(/:(.*?);/);
  if (!match) return null;
  const mime = match[1];
  const bstr = atob(arr[1]);
  const bytes = new Uint8Array(bstr.length);
  for (let i = 0; i < bstr.length; i++) {
    bytes[i] = bstr.charCodeAt(i);
  }
  return new File([bytes], filename, { type: mime });
};
