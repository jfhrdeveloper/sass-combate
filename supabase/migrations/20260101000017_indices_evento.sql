/**
 * Postgres no indexa foreign keys automáticamente (solo primary/unique key).
 * `pelea.evento_id`, `area.evento_id`, `bloque.evento_id` y
 * `categoria.evento_id` se filtran seguido (agenda pública, panel del
 * evento) sin ningún índice propio — hoy no se nota con pocos eventos, pero
 * el costo de un seq scan crece con el volumen total de esas tablas en TODA
 * la plataforma, no solo del evento que se está mirando. Ver
 * docs/pending-task.md, auditoría de backend del 2026-08-06.
 */
create index if not exists pelea_evento on pelea (evento_id);
create index if not exists area_evento on area (evento_id);
create index if not exists bloque_evento on bloque (evento_id);
create index if not exists categoria_evento on categoria (evento_id);
