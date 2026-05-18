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
 * Get attendance percentage color class based on value
 */
export const getPercentageColor = (pct) => {
  if (pct >= 75) return 'text-green-600';
  if (pct >= 50) return 'text-yellow-600';
  return 'text-red-600';
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
 * Convert image file to base64 string
 */
export const toBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
  });

/**
 * Format a number to a compact string (1000 -> 1K)
 */
export const formatNumber = (num) => {
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num?.toString() || '0';
};

/**
 * Truncate a string to a max length
 */
export const truncate = (str, max = 30) =>
  str && str.length > max ? `${str.substring(0, max)}...` : str;
