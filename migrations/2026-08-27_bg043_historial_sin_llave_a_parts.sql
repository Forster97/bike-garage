-- BG-043 · El historial dejó de registrar nada desde marzo de 2026.
--
-- part_logs.part_id apuntaba a parts(id) con ON DELETE CASCADE. Desde PRD-12 el
-- código guarda ahí el id de una entrada de component_catalog, que nunca existe
-- en parts: cada evento chocaba con la llave foránea y era rechazado. Como
-- logEvent solo hacía console.error, fallaba en silencio durante seis meses.
--
-- La llave se suelta en vez de reapuntarla al catálogo. Un historial cuyo valor
-- es sobrevivir a que la pieza desaparezca no puede depender de que la pieza
-- siga existiendo. Ya guarda part_name y part_category, que son la fuente buena.
--
-- De paso desactiva una mina: con el CASCADE, borrar la tabla parts (ver BG-010)
-- se habría llevado los 31 eventos históricos.
--
-- Aplicada en producción el 2026-08-27.

alter table part_logs drop constraint part_logs_part_id_fkey;

comment on column part_logs.part_id is
  'Id del modelo del catálogo, best-effort. Puede apuntar a una fila que ya no existe: el nombre bueno vive en part_name (BG-043).';
