/**
 * CRM Utilities for phone formatting and communication links.
 */

export function formatPhoneNumberForWa(phone: string): string {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, "");
  
  // If the number is 10 digits, prepend 91 (India)
  if (cleaned.length === 10) {
    return `91${cleaned}`;
  }
  
  return cleaned;
}

export function getWhatsAppUrl(phone: string, text?: string): string {
  const waPhone = formatPhoneNumberForWa(phone);
  let url = `https://wa.me/${waPhone}`;
  if (text) {
    url += `?text=${encodeURIComponent(text)}`;
  }
  return url;
}

export function getTelUrl(phone: string): string {
  // Keep numbers and leading +
  const cleaned = phone.replace(/[^\d+]/g, "");
  return `tel:${cleaned}`;
}
