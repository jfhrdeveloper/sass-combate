/**
 * Agrega `metodos` al `config` jsonb de cada modalidad del catálogo global
 * (`organizacion_id is null`, sembrado en 20260101000004) — hasta ahora la
 * mesa de control (`mesa/[eventoId]/page.tsx`) mostraba los mismos 5 métodos
 * de kickboxing (decisión/RSC/abandono/descalificación/walkover) sin importar
 * la disciplina de la pelea, aunque `resultado.metodo` siempre fue `text`
 * libre en la base — el límite era puramente del código de la app, no del
 * schema. Boxeo/muay thai no usan "RSC" sino KO/TKO; MMA suma sumisión y "no
 * contest"; jiu-jitsu no tiene decisión de jueces en el mismo sentido
 * (sumisión/puntos/ventaja); sanda tiene un método propio, la salida del
 * área. Espejo exacto de `METODOS_POR_DISCIPLINA` en `src/types/index.ts` —
 * si se agrega un método nuevo ahí, agregarlo acá también.
 *
 * Una academia puede seguir agregando su propia fila en `modalidad` (con su
 * `organizacion_id`) para una disciplina no cubierta por el catálogo global;
 * si su `config` no trae `metodos`, la app cae al listado genérico de
 * kickboxing (ver el fallback en `mesa/[eventoId]/page.tsx`).
 */
update modalidad set config = config || '{"metodos":["decision","rsc","abandono","descalificacion","walkover"]}'::jsonb
where organizacion_id is null and codigo in ('low_kick','k1','full_contact','kick_light','light_contact','point_fighting');

update modalidad set config = config || '{"metodos":["decision","ko","tko","abandono","descalificacion","walkover"]}'::jsonb
where organizacion_id is null and codigo in ('boxeo','muay_thai');

update modalidad set config = config || '{"metodos":["decision","ko","tko","sumision","descalificacion","no_contest"]}'::jsonb
where organizacion_id is null and codigo = 'mma';

update modalidad set config = config || '{"metodos":["decision","ko","tko","ring_out","abandono","descalificacion"]}'::jsonb
where organizacion_id is null and codigo = 'sanda';

update modalidad set config = config || '{"metodos":["sumision","puntos","ventaja","descalificacion","walkover"]}'::jsonb
where organizacion_id is null and codigo in ('gi','no_gi');
