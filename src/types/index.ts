// src/types/index.ts

export interface Rig {
  id: string;
  name: string;
  hashrate: number; // MH/s, TH/s, etc.
  hashrateUnit: string;
  powerConsumption: number; // Watts
  status: 'online' | 'offline' | 'error' | 'warning';
  temperature?: number; // Celsius
  fanSpeed?: number; // RPM or %
  uptime?: number; // seconds
  algorithm?: string;
  pool?: string;
  lastSeen?: Date;
  location?: string;
  gpuDetails?: GpuDetail[];
}

export interface GpuDetail {
  id: string;
  name: string;
  temperature: number;
  fanSpeed: number;
  hashrate: number;
  power: number;
}

export interface Alert {
  id: string;
  rigId?: string; // Optional if it's a system-wide alert
  rigName?: string;
  type: 'offline' | 'hashrate_drop' | 'temperature_high' | 'custom';
  message: string;
  timestamp: Date;
  severity: 'info' | 'warning' | 'critical';
  acknowledged: boolean;
}

export interface PricingPlan {
  id: string;
  name: string;
  price: string; // e.g., "$9.99/month"
  features: string[];
  rigsAllowed: number | 'unlimited';
  ctaText: string;
  isPopular?: boolean;
}
