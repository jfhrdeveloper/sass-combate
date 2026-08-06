/* ================= PROCESAMIENTO DE IMÁGENES SUBIDAS =================
   El comprobante de pago (captura de Yape/Plin/transferencia) sube tal cual
   al bucket `comprobantes` de Supabase Storage — una foto de celular sin
   comprimir (10-20MB) se sube igual, ocupando espacio de Storage y tardando
   en cargar cuando el organizador revisa pagos. Este helper cap ea las
   dimensiones y recomprime ANTES de subir, así el tamaño final no depende
   de lo que capture el usuario. La dimensión máxima es más grande que un
   avatar (1600px, no 512px) porque el comprobante es una captura de texto
   (monto, número de operación) que tiene que seguir siendo legible para
   quien aprueba el pago. */

const DIMENSION_MAXIMA = 1600;
const CALIDAD_JPEG = 0.85;
const TAMANO_MAXIMO_ORIGINAL_MB = 8;

export class ImagenInvalidaError extends Error {}

/** Valida, redimensiona (si hace falta) y comprime una imagen subida por el
 *  usuario, devolviendo un `File` listo para ir en un `FormData` o subirse a
 *  Storage. Nunca lanza fuera de la promesa — rechaza con
 *  `ImagenInvalidaError` y un mensaje mostrable. */
export function prepararImagen(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) {
    return Promise.reject(new ImagenInvalidaError("El archivo debe ser una imagen."));
  }
  if (file.size > TAMANO_MAXIMO_ORIGINAL_MB * 1024 * 1024) {
    return Promise.reject(new ImagenInvalidaError(`La imagen pesa más de ${TAMANO_MAXIMO_ORIGINAL_MB}MB.`));
  }

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      /* Solo se achica, nunca se agranda (`Math.min(1, …)`) — una captura ya
         chica no gana nada estirándose. */
      const escala = Math.min(1, DIMENSION_MAXIMA / Math.max(img.width, img.height));
      const ancho = Math.round(img.width * escala);
      const alto = Math.round(img.height * escala);

      const canvas = document.createElement("canvas");
      canvas.width = ancho;
      canvas.height = alto;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new ImagenInvalidaError("El navegador no pudo procesar la imagen."));
        return;
      }
      ctx.drawImage(img, 0, 0, ancho, alto);

      /* PNG conserva transparencia; cualquier otro formato (típicamente una
         captura JPEG del celular) se recomprime como JPEG. */
      const conservarPng = file.type === "image/png";
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new ImagenInvalidaError("No se pudo comprimir la imagen."));
            return;
          }
          const nombre = conservarPng ? file.name : file.name.replace(/\.\w+$/, "") + ".jpg";
          resolve(new File([blob], nombre, { type: blob.type }));
        },
        conservarPng ? "image/png" : "image/jpeg",
        CALIDAD_JPEG
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new ImagenInvalidaError("No se pudo leer el archivo como imagen."));
    };

    img.src = url;
  });
}
