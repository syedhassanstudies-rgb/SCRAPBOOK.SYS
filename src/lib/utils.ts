export function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

export function getContrastText(hexColor?: string) {
  if (!hexColor || hexColor === 'transparent') return 'text-paper-ink';
  
  let hex = hexColor.replace('#', '');
  
  if (hex.length === 3) {
    hex = hex.charAt(0) + hex.charAt(0) + hex.charAt(1) + hex.charAt(1) + hex.charAt(2) + hex.charAt(2);
  }
  
  if (hex.length !== 6) return 'text-paper-ink';

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Calculate Relative Luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  return luminance > 0.5 ? 'text-paper-ink' : 'text-paper-base';
}

export function getContrastBorder(hexColor?: string) {
  if (!hexColor || hexColor === 'transparent') return 'border-paper-outline';
  
  let hex = hexColor.replace('#', '');
  
  if (hex.length === 3) {
    hex = hex.charAt(0) + hex.charAt(0) + hex.charAt(1) + hex.charAt(1) + hex.charAt(2) + hex.charAt(2);
  }
  
  if (hex.length !== 6) return 'border-paper-outline';

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  return luminance > 0.5 ? 'border-paper-outline' : 'border-paper-base/30';
}

/**
 * Sanitizes data for Firestore by recursively removing undefined values.
 * Firestore does not support undefined, but it does support null.
 */
export function sanitizeData(data: any): any {
  if (data === null || data === undefined) return null;
  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item));
  }
  if (data instanceof Date) {
    return data;
  }
  if (typeof data === 'object') {
    // Preserve Firestore sentinels like serverTimestamp, FieldValue, etc.
    if (typeof data.toDate === 'function' || data._methodName || data._delegate || typeof data.isEqual === 'function') {
        return data; 
    }
    const result: any = {};
    Object.keys(data).forEach(key => {
      const val = data[key];
      // Convert undefined to null to prevent "Unsupported field value: undefined"
      result[key] = val === undefined ? null : sanitizeData(val);
    });
    return result;
  }
  return data;
}
