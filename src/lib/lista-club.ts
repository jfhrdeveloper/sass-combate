export interface FilaLista {
  nombre: string;
  documento: string;
  nacimiento: string;
  sexo: string;
  peso: string;
  modalidad: string;
  error?: string;
}

/**
 * Lee la lista que el coach pega desde su Excel o desde WhatsApp.
 *
 * Acepta tabulaciones, punto y coma, comas o dos o más espacios como separador,
 * porque en la práctica llega de las tres formas y pedirle un formato exacto a
 * alguien que está apurado garantiza que no lo use.
 */
export function analizarLista(texto: string): FilaLista[] {
  return texto
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((linea) => {
      const c = linea.split(/\t|;|\s{2,}|,/).map((x) => x.trim());
      const fila: FilaLista = {
        nombre: c[0] ?? "",
        documento: c[1] ?? "",
        nacimiento: c[2] ?? "",
        sexo: (c[3] ?? "").toUpperCase(),
        peso: c[4] ?? "",
        modalidad: (c[5] ?? "").toLowerCase(),
      };

      if (fila.nombre.split(/\s+/).filter(Boolean).length < 2) {
        fila.error = "Falta el apellido";
      } else if (!/^\d{7,12}$/.test(fila.documento)) {
        fila.error = "Documento no válido";
      } else if (!/^\d{4}-\d{2}-\d{2}$/.test(fila.nacimiento)) {
        fila.error = "La fecha debe ir como 2011-03-14";
      } else if (!["M", "F"].includes(fila.sexo)) {
        fila.error = "El sexo debe ser M o F";
      } else if (!Number.isFinite(Number(fila.peso.replace(",", ".")))) {
        fila.error = "Peso no válido";
      } else if (!fila.modalidad) {
        fila.error = "Falta la modalidad";
      }

      return fila;
    });
}

export function separarValidas(filas: FilaLista[]) {
  return {
    validas: filas.filter((f) => !f.error),
    conError: filas.filter((f) => f.error),
  };
}
