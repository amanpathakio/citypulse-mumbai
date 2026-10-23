/**
 * Indian National Ambient Air Quality Standards (NAAQS)
 * Color, Label, and Health Category Mappings for PM2.5 (µg/m³)
 */

export interface AQICategory {
  label: string;
  min: number;
  max: number;
  textColor: string;
  bgColor: string;
  borderColor: string;
  hex: string;
  healthNotice: string;
}

export function getPM25Category(pm25: number | null | undefined): AQICategory {
  if (pm25 === null || pm25 === undefined || isNaN(pm25)) {
    return {
      label: 'Missing Data',
      min: 0,
      max: 0,
      textColor: 'text-slate-500',
      bgColor: 'bg-slate-100',
      borderColor: 'border-slate-300',
      hex: '#94a3b8',
      healthNotice: 'Sensor data currently unavailable or offline.'
    };
  }

  if (pm25 <= 30) {
    return {
      label: 'Good (NAAQS)',
      min: 0,
      max: 30,
      textColor: 'text-emerald-800',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      hex: '#10b981',
      healthNotice: 'Minimal air quality impact. Meets standard.'
    };
  } else if (pm25 <= 60) {
    return {
      label: 'Satisfactory (NAAQS Standard)',
      min: 31,
      max: 60,
      textColor: 'text-teal-800',
      bgColor: 'bg-teal-50',
      borderColor: 'border-teal-200',
      hex: '#0d9488',
      healthNotice: 'Minor breathing discomfort to sensitive individuals.'
    };
  } else if (pm25 <= 90) {
    return {
      label: 'Moderate',
      min: 61,
      max: 90,
      textColor: 'text-amber-800',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      hex: '#f59e0b',
      healthNotice: 'Breathing discomfort to people with lung disease, asthma and heart diseases.'
    };
  } else if (pm25 <= 120) {
    return {
      label: 'Poor',
      min: 91,
      max: 120,
      textColor: 'text-orange-800',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      hex: '#f97316',
      healthNotice: 'Breathing discomfort to most people on prolonged exposure.'
    };
  } else if (pm25 <= 250) {
    return {
      label: 'Very Poor',
      min: 121,
      max: 250,
      textColor: 'text-red-800',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      hex: '#ef4444',
      healthNotice: 'Respiratory illness on prolonged exposure. Pronounced effect on vulnerable cohorts.'
    };
  } else {
    return {
      label: 'Severe',
      min: 251,
      max: 1000,
      textColor: 'text-rose-950',
      bgColor: 'bg-rose-100',
      borderColor: 'border-rose-300',
      hex: '#991b1b',
      healthNotice: 'Affects healthy people and seriously impacts those with existing diseases.'
    };
  }
}

export function formatNumber(val: number | null | undefined, decimals = 1): string {
  if (val === null || val === undefined || isNaN(val)) return '—';
  return val.toFixed(decimals);
}

/**
 * Extracts the 24h clock time + IST from formatted IST string (e.g. "24 Oct 2026, 00:00 IST" -> "00:00 IST")
 */
export function formatISTTime(str: string | undefined | null): string {
  if (!str) return '—';
  const match = str.match(/(\d{1,2}:\d{2})/);
  if (match) {
    return `${match[1]} IST`;
  }
  return str;
}

/**
 * Clean short date + time for table cells and badges (e.g. "24 Oct, 00:00 IST")
 */
export function formatISTDateTime(str: string | undefined | null): string {
  if (!str) return '—';
  // Matches "24 Oct 2026, 00:00 IST" and turns into "24 Oct, 00:00 IST"
  return str.replace(/ \d{4},/, ',');
}
