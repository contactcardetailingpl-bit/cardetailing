
export enum ViewMode {
  HOME = 'HOME',
  SERVICES = 'SERVICES',
  GALLERY = 'GALLERY',
  ADVISOR = 'ADVISOR',
  VISUALIZER = 'VISUALIZER',
  BOOKING = 'BOOKING',
  ADMIN = 'ADMIN',
  CONTACT = 'CONTACT'
}

export interface WorkshopUser {
  id: string;
  username: string;
  password: string;
  role: 'ADMIN' | 'STAFF';
  createdAt: number;
}

export interface WorkshopMedia {
  id: string;
  type: 'image' | 'video';
  url: string;
  title: string;
  description: string;
  category: 'Process' | 'Exterior' | 'Interior';
  timestamp: number;
}

export interface WorkshopService {
  name: string;
  price: string;
  desc: string;
  category: string;
  details: string[];
  isVisible?: boolean; // New property to toggle visibility on the public site
}

export interface Appointment {
  id: string;
  name: string;
  email: string;
  car: string;
  notes: string;
  services: string[];
  aiSummary: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED';
  timestamp: number;
}

export interface HomepageContent {
  heroTitle: string;
  heroSubtitle: string;
  heroImageUrl: string;
  servicesTitle: string;
  servicesSubtitle: string;
  featuredServices: { title: string; desc: string; imageUrl: string }[];
  stats: { label: string; val: string }[];
}

export interface GeneratedAsset {
  id: string;
  type: 'image' | 'video';
  url: string;
  prompt: string;
  timestamp: number;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  groundingUrls?: Array<{ uri: string; title: string }>;
}

export interface TranscriptionItem {
  role: 'user' | 'model';
  text: string;
}
