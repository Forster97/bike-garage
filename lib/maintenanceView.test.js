/**
 * Tests del ENSAMBLADO del mantenimiento.
 *
 * Este archivo protege tres bugs que ya se cerraron y que volverían si alguien
 * reimplementa el ensamblado en una pantalla:
 *
 *   BG-003  la misma bici mostraba dos porcentajes de salud distintos
 *   BG-004  los registros con `type_id` nulo eran invisibles para el dashboard
 *   BG-005  la pantalla de notificaciones ignoraba las preferencias del correo
 *
 * Cada bloque de abajo dice cuál de los tres cuida.
 */

import { describe, it, expect } from "vitest";
import {
  indexLastRecords,
  tipoAplica,
  buildBikeView,
  buildGarageView,
  toAlerts,
  MAINT_TO_PART_CAT,
} from "./maintenanceView";
import { addDays, todayISO } from "./dateHelpers";

const haceDias = (n) => (n === 0 ? todayISO() : addDays(todayISO(), -n));

const tipo = (id, name, category = "general", extra = {}) => ({
  id,
  name,
  category,
  severity: "medium",
  interval_days_balanced: 100,
  interval_km_balanced: null,
  default_interval_days: 100,
  default_interval_km: null,
  ...extra,
});

const bici = (id = "b1", extra = {}) => ({
  id,
  name: "Trail",
  created_at: `${haceDias(500)}T12:00:00Z`,
  ...extra,
});

// ═════════════════════════════════════════════════════════════════════════════
describe("indexLastRecords · BG-004, los registros que se volvían invisibles", () => {
  it("encuentra un registro por su type_id", () => {
    const idx = indexLastRecords([
      { bike_id: "b1", type_id: 7, type_name: "Cadena", performed_at: haceDias(5) },
    ]);
    expect(idx.get("b1", tipo(7, "Cadena"))?.performed_at).toBe(haceDias(5));
  });

  it("ENCUENTRA un registro con type_id nulo, por su nombre", () => {
    // Este es el caso exacto de BG-004: el usuario escribió el tipo a mano,
    // así que no hay type_id. Indexar solo por id lo hacía desaparecer.
    const idx = indexLastRecords([
      { bike_id: "b1", type_id: null, type_name: "Cadena", performed_at: haceDias(3) },
    ]);
    expect(idx.get("b1", tipo(7, "Cadena"))?.performed_at).toBe(haceDias(3));
  });

  it("el nombre se compara sin distinguir mayúsculas ni espacios", () => {
    const idx = indexLastRecords([
      { bike_id: "b1", type_id: null, type_name: "  CADENA  ", performed_at: haceDias(3) },
    ]);
    expect(idx.get("b1", tipo(7, "cadena"))).not.toBeNull();
  });

  it("prefiere el type_id cuando ambos existen", () => {
    const idx = indexLastRecords([
      { bike_id: "b1", type_id: 7, type_name: "Otro nombre", performed_at: haceDias(1) },
      { bike_id: "b1", type_id: null, type_name: "Cadena", performed_at: haceDias(2) },
    ]);
    expect(idx.get("b1", tipo(7, "Cadena"))?.performed_at).toBe(haceDias(1));
  });

  it("se queda con el primero de la lista: hay que pasarla ordenada desc", () => {
    const idx = indexLastRecords([
      { bike_id: "b1", type_id: 7, type_name: "Cadena", performed_at: haceDias(2) },
      { bike_id: "b1", type_id: 7, type_name: "Cadena", performed_at: haceDias(90) },
    ]);
    expect(idx.get("b1", tipo(7, "Cadena"))?.performed_at).toBe(haceDias(2));
  });

  it("no cruza registros entre bicis distintas", () => {
    const idx = indexLastRecords([
      { bike_id: "b2", type_id: 7, type_name: "Cadena", performed_at: haceDias(1) },
    ]);
    expect(idx.get("b1", tipo(7, "Cadena"))).toBeNull();
  });

  it("devuelve null si no hay nada", () => {
    expect(indexLastRecords([]).get("b1", tipo(7, "Cadena"))).toBeNull();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
describe("tipoAplica · BG-003, el filtro que una pantalla no aplicaba", () => {
  it("si no sabemos qué tiene montado, aplican todos los tipos", () => {
    expect(tipoAplica(tipo(1, "X", "frenos"), null)).toBe(true);
    expect(tipoAplica(tipo(1, "X", "frenos"), new Set())).toBe(true);
  });

  it("un tipo mapeado a null aplica siempre", () => {
    expect(MAINT_TO_PART_CAT.general).toBeNull();
    expect(tipoAplica(tipo(1, "X", "general"), new Set(["Marco"]))).toBe(true);
    expect(tipoAplica(tipo(1, "X", "estructura"), new Set(["Marco"]))).toBe(true);
  });

  it("aplica si la bici tiene alguna de las categorías mapeadas", () => {
    expect(tipoAplica(tipo(1, "X", "frenos"), new Set(["Frenos", "Marco"]))).toBe(true);
  });

  it("NO aplica si la bici no tiene ninguna", () => {
    // Una bici rígida no debería recibir avisos de service de horquilla
    expect(tipoAplica(tipo(1, "X", "suspension"), new Set(["Marco", "Ruedas"]))).toBe(false);
  });

  it("una categoría de tipo desconocida aplica siempre, por seguridad", () => {
    expect(tipoAplica(tipo(1, "X", "categoria_nueva"), new Set(["Marco"]))).toBe(true);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
describe("buildBikeView · el estado de una bici", () => {
  const types = [
    tipo(1, "Cadena", "transmision"),
    tipo(2, "Frenos", "frenos"),
    tipo(3, "Suspensión", "suspension"),
  ];

  it("filtra los tipos según lo que la bici tiene montado", () => {
    const v = buildBikeView({
      bike: bici(),
      types,
      lastIndex: indexLastRecords([]),
      categoriasMontadas: new Set(["Transmisión"]),
    });
    expect(v.tasks.map((t) => t.type.name)).toEqual(["Cadena"]);
  });

  it("sin componentes montados considera todos los tipos", () => {
    const v = buildBikeView({ bike: bici(), types, lastIndex: indexLastRecords([]) });
    expect(v.tasks).toHaveLength(3);
  });

  it("omite los tipos que no tienen ningún intervalo", () => {
    const sinIntervalo = tipo(9, "Sin intervalo", "general", {
      interval_days_balanced: null, interval_km_balanced: null,
      default_interval_days: null, default_interval_km: null,
    });
    const v = buildBikeView({ bike: bici(), types: [sinIntervalo], lastIndex: indexLastRecords([]) });
    expect(v.tasks).toHaveLength(0);
  });

  it("sin registro previo cuenta desde que la bici entró a la app", () => {
    // La bici se creó hace 500 días y el intervalo es de 100 → vencida
    const v = buildBikeView({ bike: bici(), types: [types[0]], lastIndex: indexLastRecords([]) });
    expect(v.tasks[0].status).toBe("overdue");
  });

  it("una bici sin fecha de creación no inventa un vencimiento", () => {
    const v = buildBikeView({
      bike: { id: "b1", created_at: null },
      types: [types[0]],
      lastIndex: indexLastRecords([]),
    });
    expect(v.tasks[0].status).toBe("none");
  });

  it("ordena lo urgente primero", () => {
    const idx = indexLastRecords([
      { bike_id: "b1", type_id: 1, type_name: "Cadena", performed_at: haceDias(1) },   // ok
      { bike_id: "b1", type_id: 2, type_name: "Frenos", performed_at: haceDias(300) }, // overdue
      { bike_id: "b1", type_id: 3, type_name: "Suspensión", performed_at: haceDias(80) }, // soon
    ]);
    const v = buildBikeView({ bike: bici(), types, lastIndex: idx });
    expect(v.tasks.map((t) => t.status)).toEqual(["overdue", "soon", "ok"]);
  });

  it("cuenta vencidas y próximas", () => {
    const idx = indexLastRecords([
      { bike_id: "b1", type_id: 1, type_name: "Cadena", performed_at: haceDias(300) },
      { bike_id: "b1", type_id: 2, type_name: "Frenos", performed_at: haceDias(80) },
      { bike_id: "b1", type_id: 3, type_name: "Suspensión", performed_at: haceDias(1) },
    ]);
    const v = buildBikeView({ bike: bici(), types, lastIndex: idx });
    expect(v.overdue).toBe(1);
    expect(v.soon).toBe(1);
  });

  it("una regla custom le gana al perfil", () => {
    const v = buildBikeView({
      bike: bici(),
      types: [types[0]],
      lastIndex: indexLastRecords([
        { bike_id: "b1", type_id: 1, type_name: "Cadena", performed_at: haceDias(10) },
      ]),
      rulesByTypeId: { 1: { is_active: true, interval_days: 5, interval_km: null } },
    });
    expect(v.tasks[0].status).toBe("overdue"); // 10 días con intervalo de 5
  });
});

// ═════════════════════════════════════════════════════════════════════════════
describe("buildBikeView · BG-005, lo silenciado se MARCA, no se excluye", () => {
  const types = [tipo(1, "Cadena", "transmision")];

  it("marca como silenciado lo que tiene notify_email en false", () => {
    const v = buildBikeView({
      bike: bici(), types, lastIndex: indexLastRecords([]),
      prefsByTypeId: { 1: { notify_email: false } },
    });
    expect(v.tasks[0].muted).toBe(true);
  });

  it("marca como silenciado lo que tiene silent_mode", () => {
    const v = buildBikeView({
      bike: bici(), types, lastIndex: indexLastRecords([]),
      prefsByTypeId: { 1: { silent_mode: true } },
    });
    expect(v.tasks[0].muted).toBe(true);
  });

  it("silenciado NO significa excluido: la tarea sigue en la lista", () => {
    // Es la esencia de BG-005: la pantalla lo muestra atenuado para que se
    // entienda por qué no llegó el correo. Si lo excluyéramos acá, el usuario
    // volvería a no entender nada.
    const v = buildBikeView({
      bike: bici(), types, lastIndex: indexLastRecords([]),
      prefsByTypeId: { 1: { notify_email: false } },
    });
    expect(v.tasks).toHaveLength(1);
  });

  it("sin preferencia guardada, no está silenciado", () => {
    const v = buildBikeView({ bike: bici(), types, lastIndex: indexLastRecords([]) });
    expect(v.tasks[0].muted).toBe(false);
  });

  it("lo silenciado igual cuenta para la salud de la bici", () => {
    // Apagar el aviso no arregla la bici.
    const conAviso = buildBikeView({ bike: bici(), types, lastIndex: indexLastRecords([]) });
    const sinAviso = buildBikeView({
      bike: bici(), types, lastIndex: indexLastRecords([]),
      prefsByTypeId: { 1: { notify_email: false } },
    });
    expect(sinAviso.health).toBe(conAviso.health);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
describe("buildGarageView · varias bicis a la vez", () => {
  const types = [tipo(1, "Cadena", "transmision")];
  const bikes = [bici("b1"), bici("b2", { name: "Gravel" })];

  it("devuelve una entrada por bici", () => {
    const v = buildGarageView({ bikes, types });
    expect(v).toHaveLength(2);
    expect(v.map((x) => x.bike.id)).toEqual(["b1", "b2"]);
  });

  it("cada bici usa SU perfil y SU odómetro", () => {
    const v = buildGarageView({
      bikes, types,
      profiles: [{ bike_id: "b1", profile: "maniac" }],
      stats: [{ bike_id: "b2", odometer_km: 500 }],
    });
    expect(v[0].profile).toBe("maniac");
    expect(v[1].profile).toBe("balanced"); // el default
    expect(v[0].currentKm).toBeNull();
    expect(v[1].currentKm).toBe(500);
  });

  it("cada bici usa SUS reglas custom, sin contaminar a la otra", () => {
    const v = buildGarageView({
      bikes, types,
      records: [
        { bike_id: "b1", type_id: 1, type_name: "Cadena", performed_at: haceDias(10) },
        { bike_id: "b2", type_id: 1, type_name: "Cadena", performed_at: haceDias(10) },
      ],
      rules: [{ bike_id: "b1", type_id: 1, is_active: true, interval_days: 5, interval_km: null }],
    });
    expect(v[0].tasks[0].status).toBe("overdue"); // intervalo de 5 días
    expect(v[1].tasks[0].status).toBe("ok");      // intervalo de 100
  });

  it("cada bici usa SUS componentes montados para filtrar", () => {
    const v = buildGarageView({
      bikes, types,
      categoriasPorBici: { b1: new Set(["Marco"]) }, // sin transmisión
    });
    expect(v[0].tasks).toHaveLength(0);
    expect(v[1].tasks).toHaveLength(1); // b2 no declara: aplican todos
  });
});

// ═════════════════════════════════════════════════════════════════════════════
describe("toAlerts · BG-005, lo que llega al correo y lo que se ve en pantalla", () => {
  const types = [tipo(1, "Cadena", "transmision"), tipo(2, "Frenos", "frenos")];

  const garage = () =>
    buildGarageView({
      bikes: [bici("b1")],
      types,
      records: [
        { bike_id: "b1", type_id: 1, type_name: "Cadena", performed_at: haceDias(300) }, // overdue
        { bike_id: "b1", type_id: 2, type_name: "Frenos", performed_at: haceDias(1) },   // ok
      ],
      prefs: [{ type_id: 1, notify_email: false }],
    });

  it("solo devuelve lo vencido o próximo, nunca lo que está al día", () => {
    const a = toAlerts(garage());
    expect(a.every((x) => x.status === "overdue" || x.status === "soon")).toBe(true);
  });

  it("la PANTALLA recibe también lo silenciado, marcado", () => {
    const a = toAlerts(garage(), { excluirSilenciadas: false });
    expect(a).toHaveLength(1);
    expect(a[0].muted).toBe(true);
  });

  it("el CORREO no recibe lo silenciado", () => {
    const a = toAlerts(garage(), { excluirSilenciadas: true });
    expect(a).toHaveLength(0);
  });

  it("ordena las vencidas antes que las próximas", () => {
    const g = buildGarageView({
      bikes: [bici("b1")],
      types,
      records: [
        { bike_id: "b1", type_id: 1, type_name: "Cadena", performed_at: haceDias(80) },  // soon
        { bike_id: "b1", type_id: 2, type_name: "Frenos", performed_at: haceDias(300) }, // overdue
      ],
    });
    expect(toAlerts(g).map((a) => a.status)).toEqual(["overdue", "soon"]);
  });

  it("cada alerta trae lo que el correo necesita para escribirse", () => {
    const a = toAlerts(garage())[0];
    expect(a).toHaveProperty("bike");
    expect(a).toHaveProperty("type");
    expect(a).toHaveProperty("nextDate");
    expect(a).toHaveProperty("daysLeft");
    expect(a).toHaveProperty("remainingKm");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
describe("BG-003 · las cuatro superficies dan el MISMO resultado", () => {
  // Este es el test que cuida el bug de fondo: antes cada pantalla ensamblaba
  // por su cuenta y la misma bici mostraba dos porcentajes de salud distintos.
  const types = [tipo(1, "Cadena", "transmision"), tipo(2, "Suspensión", "suspension")];
  const records = [{ bike_id: "b1", type_id: 1, type_name: "Cadena", performed_at: haceDias(300) }];
  const categoriasMontadas = new Set(["Transmisión"]);

  it("la vista por bici y la del garage coinciden en salud y conteos", () => {
    const unaBici = buildBikeView({
      bike: bici("b1"),
      types,
      lastIndex: indexLastRecords(records),
      categoriasMontadas,
    });

    const enElGarage = buildGarageView({
      bikes: [bici("b1")],
      types,
      records,
      categoriasPorBici: { b1: categoriasMontadas },
    })[0];

    expect(enElGarage.health).toBe(unaBici.health);
    expect(enElGarage.overdue).toBe(unaBici.overdue);
    expect(enElGarage.soon).toBe(unaBici.soon);
    expect(enElGarage.tasks).toHaveLength(unaBici.tasks.length);
  });

  it("ambas excluyen la suspensión en una bici sin horquilla registrada", () => {
    const g = buildGarageView({
      bikes: [bici("b1")], types, records,
      categoriasPorBici: { b1: categoriasMontadas },
    })[0];
    expect(g.tasks.map((t) => t.type.name)).toEqual(["Cadena"]);
  });
});
