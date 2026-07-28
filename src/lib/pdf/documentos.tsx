import { Document, Page, Text, View, Image, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import QRCode from "qrcode";
import React from "react";

export interface Credencial {
  token: string;
  nombre: string;
  club: string;
  categoria: string;
  peso: string;
  area: string;
  documento?: string | null;
}

export interface DatosEvento {
  nombre: string;
  fecha: string;
  sede: string | null;
  urlBase: string;
}

const s = StyleSheet.create({
  pagina: { padding: 18, backgroundColor: "#ffffff" },
  grilla: { flexDirection: "row", flexWrap: "wrap" },
  tarjeta: {
    width: "50%",
    height: 178,
    padding: 6,
  },
  marco: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderStyle: "dashed",
    borderRadius: 6,
    padding: 10,
    flexDirection: "row",
  },
  izquierda: { flex: 1, paddingRight: 8, justifyContent: "space-between" },
  evento: { fontSize: 7, color: "#64748b", textTransform: "uppercase" },
  nombre: { fontSize: 13, marginTop: 4 },
  club: { fontSize: 8, color: "#475569", marginTop: 2 },
  linea: { fontSize: 8, color: "#334155", marginTop: 6 },
  etiqueta: { fontSize: 6, color: "#94a3b8", textTransform: "uppercase" },
  area: { fontSize: 10, marginTop: 1 },
  qr: { width: 74, height: 74 },
  pie: { fontSize: 6, color: "#94a3b8", marginTop: 3, textAlign: "center", width: 74 },
});

function Tarjeta({
  c,
  evento,
  qr,
}: {
  c: Credencial;
  evento: DatosEvento;
  qr: string;
}) {
  return (
    <View style={s.tarjeta}>
      <View style={s.marco}>
        <View style={s.izquierda}>
          <View>
            <Text style={s.evento}>{evento.nombre}</Text>
            <Text style={s.nombre}>{c.nombre}</Text>
            <Text style={s.club}>{c.club}</Text>
            <Text style={s.linea}>
              {c.categoria} · {c.peso}
            </Text>
          </View>
          <View>
            <Text style={s.etiqueta}>Área</Text>
            <Text style={s.area}>{c.area}</Text>
          </View>
        </View>
        <View>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- Image de @react-pdf/renderer, no es <img> del DOM */}
          <Image style={s.qr} src={qr} />
          <Text style={s.pie}>{c.token}</Text>
        </View>
      </View>
    </View>
  );
}

function Credenciales({
  lista,
  evento,
  qrs,
}: {
  lista: Credencial[];
  evento: DatosEvento;
  qrs: string[];
}) {
  const porPagina = 8;
  const paginas: Credencial[][] = [];
  for (let i = 0; i < lista.length; i += porPagina) {
    paginas.push(lista.slice(i, i + porPagina));
  }

  return (
    <Document title={`Credenciales - ${evento.nombre}`}>
      {paginas.map((grupo, p) => (
        <Page key={p} size="A4" style={s.pagina}>
          <View style={s.grilla}>
            {grupo.map((c, i) => (
              <Tarjeta key={c.token} c={c} evento={evento} qr={qrs[p * porPagina + i]} />
            ))}
          </View>
        </Page>
      ))}
    </Document>
  );
}

/**
 * Genera el PDF de credenciales.
 *
 * Los QR se calculan antes de renderizar porque @react-pdf necesita la imagen
 * ya resuelta. Con 300 peleadores conviene llamar esta función por lotes: el
 * tiempo de una función serverless no da para todo de una sola vez.
 */
export async function generarCredenciales(
  lista: Credencial[],
  evento: DatosEvento
): Promise<Buffer> {
  const qrs = await Promise.all(
    lista.map((c) =>
      QRCode.toDataURL(`${evento.urlBase}/p/${c.token}`, {
        margin: 0,
        width: 220,
        errorCorrectionLevel: "M",
      })
    )
  );

  return renderToBuffer(<Credenciales lista={lista} evento={evento} qrs={qrs} />);
}

const a = StyleSheet.create({
  pagina: { padding: 36, fontSize: 9 },
  titulo: { fontSize: 16 },
  sub: { fontSize: 9, color: "#64748b", marginTop: 3, marginBottom: 16 },
  fila: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#e2e8f0", paddingVertical: 5 },
  cabecera: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#334155", paddingBottom: 5 },
  th: { fontSize: 7, color: "#64748b", textTransform: "uppercase" },
  n: { width: "6%" },
  h: { width: "10%" },
  p: { width: "27%" },
  m: { width: "14%" },
  g: { width: "16%" },
  firma: { marginTop: 40, flexDirection: "row", justifyContent: "space-between" },
  raya: { borderTopWidth: 0.5, borderTopColor: "#334155", width: 160, paddingTop: 4, fontSize: 7, textAlign: "center", color: "#475569" },
});

export interface FilaActa {
  orden: number;
  hora: string;
  area: string;
  roja: string;
  azul: string;
  modalidad: string;
  ganador: string;
  metodo: string;
}

function Acta({ filas, evento }: { filas: FilaActa[]; evento: DatosEvento }) {
  return (
    <Document title={`Acta - ${evento.nombre}`}>
      <Page size="A4" style={a.pagina}>
        <Text style={a.titulo}>{evento.nombre}</Text>
        <Text style={a.sub}>
          Acta oficial de resultados · {evento.fecha}
          {evento.sede ? ` · ${evento.sede}` : ""}
        </Text>

        <View style={a.cabecera}>
          <Text style={[a.th, a.n]}>N°</Text>
          <Text style={[a.th, a.h]}>Hora</Text>
          <Text style={[a.th, a.p]}>Esquina roja</Text>
          <Text style={[a.th, a.p]}>Esquina azul</Text>
          <Text style={[a.th, a.m]}>Modalidad</Text>
          <Text style={[a.th, a.g]}>Ganador</Text>
        </View>

        {filas.map((f) => (
          <View key={`${f.area}-${f.orden}`} style={a.fila} wrap={false}>
            <Text style={a.n}>{f.orden}</Text>
            <Text style={a.h}>{f.hora}</Text>
            <Text style={a.p}>{f.roja}</Text>
            <Text style={a.p}>{f.azul}</Text>
            <Text style={a.m}>{f.modalidad}</Text>
            <Text style={a.g}>
              {f.ganador}
              {f.metodo ? ` (${f.metodo})` : ""}
            </Text>
          </View>
        ))}

        <View style={a.firma}>
          <Text style={a.raya}>Delegado técnico</Text>
          <Text style={a.raya}>Organizador</Text>
        </View>
      </Page>
    </Document>
  );
}

export async function generarActa(filas: FilaActa[], evento: DatosEvento): Promise<Buffer> {
  return renderToBuffer(<Acta filas={filas} evento={evento} />);
}
