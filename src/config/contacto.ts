/**
 * Datos de contacto públicos, en un solo lugar — antes estaban repetidos a
 * mano en el footer y en la landing (mismo número, mismo correo, cada uno
 * con su propio formato de link).
 */
export const WHATSAPP_NUMERO = "51931314659";
export const WHATSAPP_MENSAJE = "Hola, quiero una demo de sass-combate.";
export const EMAIL_SOPORTE = "jfhrdeveloper@gmail.com";

export function urlWhatsApp(mensaje: string = WHATSAPP_MENSAJE): string {
  return `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensaje)}`;
}
