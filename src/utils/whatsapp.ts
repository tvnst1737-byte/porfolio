import { Product, AdminSettings } from '../types';

export function sanitizePhoneNumber(phone: string): string {
  // Strip everything except digits
  return phone.replace(/\D/g, '');
}

export function generateWhatsAppMessage(product: Product, settings?: AdminSettings): string {
  if (settings?.customWelcomeMessage) {
    return settings.customWelcomeMessage
      .replace('{productName}', product.name)
      .replace('{productId}', product.id)
      .replace('{price}', `${product.currency}${product.price}`)
      .replace('{format}', product.deliveryFormat);
  }

  return `Hello! I would like to purchase the following automation tool:

📦 *Product:* ${product.name}
🔑 *Product ID:* ${product.id}
💵 *Price:* ${product.currency}${product.price}
⚙️ *Delivery:* ${product.deliveryFormat}

Please confirm availability and share the payment and setup instructions.`;
}

export function buildWhatsAppUrl(product: Product, settings: AdminSettings): string {
  const targetPhone = sanitizePhoneNumber(product.customWhatsAppNumber || settings.whatsappNumber);
  const message = generateWhatsAppMessage(product, settings);
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${targetPhone}?text=${encoded}`;
}

export function generateUniqueId(existingIds: string[] = []): string {
  let id = '';
  do {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    id = `AUT-${randomNum}`;
  } while (existingIds.includes(id));
  return id;
}
