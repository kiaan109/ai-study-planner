export interface SciConstant {
  symbol: string;
  name: string;
  value: number;
  unit: string;
}

export const SCIENCE_CONSTANTS: SciConstant[] = [
  { symbol: 'c',   name: 'Speed of light',       value: 2.99792458e8, unit: 'm/s' },
  { symbol: 'g',   name: 'Standard gravity',     value: 9.80665,      unit: 'm/s²' },
  { symbol: 'G',   name: 'Gravitational constant', value: 6.6743e-11, unit: 'N·m²/kg²' },
  { symbol: 'Nₐ',  name: 'Avogadro constant',    value: 6.02214076e23, unit: '1/mol' },
  { symbol: 'R',   name: 'Gas constant',         value: 8.314462618, unit: 'J/(mol·K)' },
  { symbol: 'kB',  name: 'Boltzmann constant',   value: 1.380649e-23, unit: 'J/K' },
  { symbol: 'h',   name: 'Planck constant',      value: 6.62607015e-34, unit: 'J·s' },
  { symbol: 'ℏ',   name: 'Reduced Planck constant', value: 1.054571817e-34, unit: 'J·s' },
  { symbol: 'e₀',  name: 'Elementary charge',    value: 1.602176634e-19, unit: 'C' },
  { symbol: 'me',  name: 'Electron mass',        value: 9.1093837015e-31, unit: 'kg' },
  { symbol: 'mp',  name: 'Proton mass',          value: 1.67262192369e-27, unit: 'kg' },
  { symbol: 'ε₀',  name: 'Vacuum permittivity',  value: 8.8541878128e-12, unit: 'F/m' },
  { symbol: 'μ₀',  name: 'Vacuum permeability',  value: 1.25663706212e-6, unit: 'N/A²' },
  { symbol: 'σ',   name: 'Stefan–Boltzmann constant', value: 5.670374419e-8, unit: 'W/(m²·K⁴)' },
  { symbol: 'F',   name: 'Faraday constant',     value: 96485.33212, unit: 'C/mol' },
  { symbol: 'atm', name: 'Standard atmosphere',  value: 101325, unit: 'Pa' },
];
