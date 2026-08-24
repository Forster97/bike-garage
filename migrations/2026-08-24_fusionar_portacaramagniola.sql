-- 2026-08-24 · Fusionar la categoría "Portacaramagniola" en Accesorios
--
-- Era una categoría personalizada creada por un usuario, además mal escrita
-- (caramañola lleva ñ). Con la tanda 2 del catálogo apareció
-- "Accesorios › Portabidón", que es donde corresponde, y las dos competían.
--
-- La entrada conserva su peso (15 g) y su estado 'unverified': es la pieza real
-- de una bici, solo estaba clasificada mal. NO se apunta al Elite Cannibal
-- Bio-Based, que es otro producto y pesa 34 g — hacerlo le habría cambiado la
-- pieza a la bici y sumado 19 g que no tiene.

update public.component_catalog
set category    = 'Accesorios',
    subcategory = 'Portabidón',
    updated_at  = now()
where category = 'Portacaramagniola';

delete from public.categories
where name = 'Portacaramagniola';
