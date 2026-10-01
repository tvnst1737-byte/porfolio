export interface Product {
  id: string; // Unique ID, e.g., 'AUT-9041'
  name: string;
  tagline: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  imageUrl: string;
  deliveryFormat: string;
  features: string[];
  specs?: string;
  customWhatsAppNumber?: string;
  createdAt: string;
}

export interface AdminSettings {
  whatsappNumber: string; // e.g. '15553492041' (numeric without '+' for wa.me link)
  whatsappDisplayNumber: string; // e.g. '+1 (555) 349-2041'
  businessName: string;
  currencySymbol: string;
  customWelcomeMessage?: string;
}
