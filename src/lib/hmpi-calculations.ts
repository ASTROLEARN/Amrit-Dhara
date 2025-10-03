// WHO Standard Values and Background Values for Heavy Metals
export const METAL_STANDARDS = {
  As: { permissible: 0.01, background: 0.001, name: 'Arsenic' },
  Cd: { permissible: 0.003, background: 0.0005, name: 'Cadmium' },
  Cr: { permissible: 0.05, background: 0.01, name: 'Chromium' },
  Pb: { permissible: 0.01, background: 0.01, name: 'Lead' },
  Hg: { permissible: 0.001, background: 0.0001, name: 'Mercury' },
  Ni: { permissible: 0.07, background: 0.02, name: 'Nickel' },
  Cu: { permissible: 2.0, background: 0.1, name: 'Copper' },
  Zn: { permissible: 3.0, background: 0.5, name: 'Zinc' }
} as const;

export interface MetalConcentrations {
  As: number;
  Cd: number;
  Cr: number;
  Pb: number;
  Hg: number;
  Ni: number;
  Cu: number;
  Zn: number;
}

export interface CalculationResults {
  hpi: number;
  hei: number;
  cd: number;
  npi: number;
  hpiCategory: string;
  heiCategory: string;
  cdCategory: string;
  npiCategory: string;
  overallQuality: string;
}

// Heavy Metal Pollution Index (HPI)
export function calculateHPI(concentrations: MetalConcentrations): number {
  let weightedSum = 0;
  let weightSum = 0;

  Object.entries(concentrations).forEach(([metal, concentration]) => {
    const standard = METAL_STANDARDS[metal as keyof typeof METAL_STANDARDS];
    if (standard && concentration > 0) {
      const weight = 1 / standard.permissible; // Wᵢ = 1/Sᵢ
      const subIndex = (concentration / standard.permissible) * 100; // Qᵢ = Cᵢ/Sᵢ × 100
      weightedSum += weight * subIndex;
      weightSum += weight;
    }
  });

  return weightSum > 0 ? weightedSum / weightSum : 0;
}

// Heavy Metal Evaluation Index (HEI)
export function calculateHEI(concentrations: MetalConcentrations): number {
  let sum = 0;

  Object.entries(concentrations).forEach(([metal, concentration]) => {
    const standard = METAL_STANDARDS[metal as keyof typeof METAL_STANDARDS];
    if (standard && concentration > 0) {
      sum += concentration / standard.permissible; // Cᵢ / Sᵢ
    }
  });

  return sum;
}

// Contamination Degree (CD)
export function calculateCD(concentrations: MetalConcentrations): number {
  let sum = 0;

  Object.entries(concentrations).forEach(([metal, concentration]) => {
    const standard = METAL_STANDARDS[metal as keyof typeof METAL_STANDARDS];
    if (standard && concentration > 0) {
      sum += concentration / standard.permissible; // Cᵢ / Sᵢ
    }
  });

  return sum;
}

// Nemerow Pollution Index (NPI)
export function calculateNPI(concentrations: MetalConcentrations): number {
  const pollutionLevels: number[] = [];

  Object.entries(concentrations).forEach(([metal, concentration]) => {
    const standard = METAL_STANDARDS[metal as keyof typeof METAL_STANDARDS];
    if (standard && concentration > 0) {
      const pollutionLevel = concentration / standard.permissible; // Pᵢ = Cᵢ / Sᵢ
      pollutionLevels.push(pollutionLevel);
    }
  });

  if (pollutionLevels.length === 0) return 0;

  const maxPollution = Math.max(...pollutionLevels);
  const avgPollution = pollutionLevels.reduce((sum, level) => sum + level, 0) / pollutionLevels.length;

  return Math.sqrt((maxPollution * maxPollution + avgPollution * avgPollution) / 2);
}

// Quality categorization functions
export function categorizeHPI(hpi: number): string {
  if (hpi < 100) return "Clean";
  if (hpi >= 100 && hpi <= 150) return "Moderate";
  return "High";
}

export function categorizeHEI(hei: number): string {
  if (hei < 40) return "Clean";
  if (hei >= 40 && hei <= 80) return "Moderate";
  return "High";
}

export function categorizeCD(cd: number): string {
  if (cd < 1) return "Low";
  if (cd >= 1 && cd <= 3) return "Medium";
  return "High";
}

export function categorizeNPI(npi: number): string {
  if (npi < 1) return "Clean";
  if (npi >= 1 && npi < 2) return "Slight";
  if (npi >= 2 && npi <= 3) return "Moderate";
  return "Severe";
}

// Overall quality assessment
export function determineOverallQuality(results: Omit<CalculationResults, 'overallQuality'>): string {
  const categories = [results.hpiCategory, results.heiCategory, results.cdCategory, results.npiCategory];
  
  // Count severe/high pollution indicators
  const highCount = categories.filter(cat => 
    cat === "High" || cat === "Severe" || cat === "Medium"
  ).length;
  
  if (highCount >= 3) return "Poor";
  if (highCount >= 2) return "Moderate";
  if (highCount >= 1) return "Fair";
  return "Good";
}

// Main calculation function
export function calculateAllIndices(concentrations: MetalConcentrations): CalculationResults {
  const hpi = calculateHPI(concentrations);
  const hei = calculateHEI(concentrations);
  const cd = calculateCD(concentrations);
  const npi = calculateNPI(concentrations);

  const hpiCategory = categorizeHPI(hpi);
  const heiCategory = categorizeHEI(hei);
  const cdCategory = categorizeCD(cd);
  const npiCategory = categorizeNPI(npi);

  const overallQuality = determineOverallQuality({
    hpi, hei, cd, npi,
    hpiCategory, heiCategory, cdCategory, npiCategory
  });

  return {
    hpi,
    hei,
    cd,
    npi,
    hpiCategory,
    heiCategory,
    cdCategory,
    npiCategory,
    overallQuality
  };
}

// Color coding for pollution levels
export function getPollutionColor(category: string, index: string): string {
  const colorMap: Record<string, Record<string, string>> = {
    hpi: {
      "Clean": "#4CAF50",
      "Moderate": "#FFC107",
      "High": "#F44336"
    },
    hei: {
      "Clean": "#4CAF50",
      "Moderate": "#FFC107",
      "High": "#F44336"
    },
    cd: {
      "Low": "#4CAF50",
      "Medium": "#FFC107",
      "High": "#F44336"
    },
    npi: {
      "Clean": "#4CAF50",
      "Slight": "#81C784",
      "Moderate": "#FFC107",
      "Severe": "#F44336"
    }
  };

  return colorMap[index]?.[category] || "#9E9E9E";
}

// Export validation
export function validateConcentrations(concentrations: Partial<MetalConcentrations>): boolean {
  return Object.values(concentrations).every(value => 
    value === undefined || value === null || (typeof value === 'number' && value >= 0)
  );
}