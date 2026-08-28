-- BG-045 · Que se pueda eliminar una cuenta.
--
-- Hoy NO SE PUEDE: tres llaves foráneas hacia auth.users no tienen cascada, así
-- que borrar un usuario revienta con una violación de integridad. No es que la
-- funcionalidad faltara en la interfaz — es que la base no lo permitía.
--
-- Las tres, y qué corresponde en cada una:
--
--   bike_maintenance          los registros de mantención SON del usuario → CASCADE
--   notification_preferences  sus preferencias de aviso                   → CASCADE
--   component_catalog.created_by                                          → SET NULL
--
-- La tercera es la decisión de fondo. El catálogo es COMPARTIDO: los modelos
-- que alguien aportó ya los usan otros ciclistas en sus bicis. Si se fueran con
-- él, se romperían bicicletas ajenas. Se quedan; lo que se va es su firma.
--
-- Es el equilibrio entre "tengo derecho a que borren mis datos" y "lo que
-- aporté al bien común no era solo mío".
--
-- Aplicada en producción el 2026-08-28.

alter table bike_maintenance
  drop constraint bike_maintenance_user_id_fkey,
  add constraint bike_maintenance_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade;

alter table notification_preferences
  drop constraint notification_preferences_user_id_fkey,
  add constraint notification_preferences_user_id_fkey
    foreign key (user_id) references auth.users(id) on delete cascade;

alter table component_catalog
  drop constraint component_catalog_created_by_fkey,
  add constraint component_catalog_created_by_fkey
    foreign key (created_by) references auth.users(id) on delete set null;

comment on column component_catalog.created_by is
  'Quién creó el modelo. Se pone en NULL si esa cuenta se elimina: la entrada se queda, porque otras bicis la usan (BG-045).';
