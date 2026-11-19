/* Genera forms/diagnostico.json · versión 4 (19 nov 2026)
   Guion de entrevista: Richard lo rellena con el cliente (videollamada o en persona). Unas 38 preguntas visibles.
   Cambios frente a la v3: bloque «Tus números», sin duplicadas, sin lo que Richard comprueba antes (web, ficha de Google, redes),
   una nota por bloque solo en modo entrevista (?modo=entrevista) y una única caja libre al final.
   Uso: node scripts/cuestionario-v4.cjs && node scripts/preguntas-md.cjs */
const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, '..', 'forms', 'diagnostico.json');
const f = JSON.parse(fs.readFileSync(FILE, 'utf8'));

const o = (value, label) => ({ value, label });
const single = (key, section, label, options, extra) => Object.assign({ key, section, type: 'single', required: true, label, options }, extra);
const multi = (key, section, label, options, extra) => Object.assign({ key, section, type: 'multi', required: true, label, options }, extra);
const text = (key, section, label, extra) => Object.assign({ key, section, type: 'text', required: false, label }, extra);
const area = (key, section, label, extra) => Object.assign({ key, section, type: 'textarea', required: false, label }, extra);
const si = (key, values) => ({ showIf: { key, in: values } });
const m = (values) => si('modelo', values);
const nota = (section, titulo) => ({ key: 'notas_' + section, section, type: 'textarea', required: false, modo: 'entrevista', label: `Notas de Richard · ${titulo}`, help: 'Solo en modo entrevista. Lo que has visto o te ha contado y no cabe en las preguntas. Va al diagnóstico como observación tuya, no como respuesta del cliente.' });
const NOSE = o('nose', 'No lo sé');

const sections = [
  { id: 'negocio', title: 'El negocio' },
  { id: 'modelo', title: 'Cómo compra el cliente' },
  { id: 'numeros', title: 'Los números' },
  { id: 'clientes', title: 'Clientes que llegan y que vuelven' },
  { id: 'gestion', title: 'Cómo se gestiona hoy' },
  { id: 'objetivo', title: 'Qué quiere conseguir' },
  { id: 'contacto', title: 'Contacto y decisión' },
];

const SECTORES_PRODUCTO = ['restaurantes', 'heladerias', 'floristerias', 'comercio', 'eventos'];

const questions = [
  /* ── El negocio ───────────────────────────────────────── */
  Object.assign(text('nombre_empresa', 'negocio', '¿Cómo se llama el negocio?'), { required: true, placeholder: 'Nombre del negocio' }),
  single('sector', 'negocio', '¿A qué se dedica?', [
    o('restaurantes', 'Bar, restaurante o cafetería'), o('heladerias', 'Heladería, pastelería, panadería u obrador'),
    o('clinicas', 'Clínica: dental, fisio, estética, salud'), o('barberias', 'Peluquería, barbería, uñas o belleza'),
    o('tatuaje', 'Estudio de tatuaje o piercing'), o('floristerias', 'Floristería, regalos o decoración'),
    o('hoteles', 'Hotel, apartamentos o alojamiento'), o('constructoras', 'Reformas, construcción, instaladores u oficios'),
    o('inmobiliarias', 'Inmobiliaria'), o('telecom', 'Telecom, informática o tecnología'),
    o('comercio', 'Tienda o comercio'), o('servicios', 'Asesoría, agencia, consultoría o despacho'),
    o('formacion', 'Academia, gimnasio o formación'), o('automocion', 'Taller o automoción'),
    o('eventos', 'Eventos, fotografía o catering'), o('otros', 'Otro'),
  ]),
  text('sector_otro', 'negocio', '¿A qué se dedica exactamente?', si('sector', ['otros'])),
  Object.assign(area('que_vendes', 'negocio', '¿Qué vende y a quién?'), { required: true, help: 'Dos frases. Con sus palabras.' }),
  Object.assign(text('ciudad', 'negocio', '¿En qué ciudad o zona está?'), { required: true }),
  single('tamano', 'negocio', '¿Cuántas personas trabajan?', [o('solo', 'Solo el dueño'), o('2-5', 'De 2 a 5'), o('6-15', 'De 6 a 15'), o('16-50', 'De 16 a 50'), o('50+', 'Más de 50')]),
  single('momento', 'negocio', '¿Cómo va este año respecto al anterior?', [o('nuevo', 'Abrió hace menos de un año'), o('crece', 'Crece'), o('igual', 'Igual'), o('baja', 'Baja')]),
  single('temporada', 'negocio', '¿El negocio tiene temporada?', [o('fuerte', 'Mucha: hay meses que lo son todo'), o('algo', 'Algo: sube y baja'), o('no', 'No, es bastante parejo todo el año')]),
  nota('negocio', 'el negocio'),

  /* ── Cómo compra el cliente (abre ramas) ─────────────── */
  multi('modelo', 'modelo', '¿Cómo compra la gente lo que hace?', [
    o('citas', 'Con cita o reserva de hora'), o('local', 'Viene al local y compra al momento'),
    o('pedidos', 'Pedidos para llevar o a domicilio'), o('presupuesto', 'Pide presupuesto o propuesta antes de decidir'),
    o('encargos', 'Encargos para una fecha: bodas, eventos, fechas señaladas'), o('estancias', 'Reservas de noches o alquileres'),
    o('online', 'Compra online'), o('recurrente', 'Paga una cuota, contrato o mantenimiento periódico'),
  ], { help: 'Marca todas las que apliquen. Las siguientes preguntas se adaptan.' }),
  // citas
  single('noshows', 'modelo', '¿Cuántas citas se caen a la semana sin avisar?', [o('0-1', 'Ninguna o una'), o('2-5', 'De 2 a 5'), o('6-10', 'De 6 a 10'), o('mas10', 'Más de 10')], m(['citas'])),
  single('recordatorios', 'modelo', '¿Se manda recordatorio antes de la cita?', [o('no', 'No'), o('a_mano', 'Sí, a mano, cuando hay tiempo'), o('automatico', 'Sí, sale solo')], m(['citas'])),
  // local
  single('afluencia', 'modelo', '¿Cómo es la afluencia al local?', [o('lleno', 'Casi siempre lleno'), o('picos', 'Picos claros (fines de semana u horas punta) y el resto flojo'), o('flojo', 'Más floja de lo que debería'), o('depende', 'Depende mucho del tiempo o de la temporada')], m(['local'])),
  // pedidos
  single('reparto', 'modelo', '¿Qué parte de los pedidos llega por Glovo, Uber Eats o Just Eat?', [o('mucho', 'Una parte importante'), o('algo', 'Poca'), o('no', 'Ninguna, no trabaja con plataformas')], m(['pedidos'])),
  single('comision', 'modelo', '¿Qué comisión se llevan?', [o('menos15', 'Menos del 15 %'), o('15-25', 'Entre el 15 y el 25 %'), o('25-35', 'Entre el 25 y el 35 %'), o('mas35', 'Más del 35 %'), NOSE], Object.assign({ required: false }, si('reparto', ['mucho', 'algo']))),
  // presupuesto
  single('presupuestos', 'modelo', 'De cada diez presupuestos que hace, ¿cuántos se cierran?', [o('mayoria', 'Siete o más'), o('mitad', 'Cuatro a seis'), o('pocos', 'Tres o menos'), NOSE], m(['presupuesto'])),
  single('presupuesto_seguimiento', 'modelo', 'Si no contestan al presupuesto, ¿qué pasa?', [o('nada', 'Nada, se queda ahí'), o('aveces', 'Llama o escribe a veces, si se acuerda'), o('sistema', 'Hay un seguimiento fijo')], m(['presupuesto'])),
  // encargos
  single('encargos_como', 'modelo', '¿Dónde apunta los encargos?', [o('papel', 'En papel o libreta'), o('whatsapp', 'En WhatsApp'), o('agenda', 'En una agenda o calendario'), o('sistema', 'En un programa')], m(['encargos'])),
  single('encargos_fallo', 'modelo', 'En el último año, ¿se ha pasado algún encargo o se ha cruzado alguna fecha?', [o('no', 'No'), o('alguna_vez', 'Alguna vez'), o('mas', 'Más de lo que le gustaría')], m(['encargos'])),
  // estancias
  single('ota', 'modelo', '¿Qué parte de las reservas llega por Booking, Airbnb u otras plataformas?', [o('menos25', 'Menos de una cuarta parte'), o('25-50', 'Entre un cuarto y la mitad'), o('mas50', 'Más de la mitad'), NOSE], m(['estancias'])),
  single('reserva_directa', 'modelo', '¿Se puede reservar directamente con el negocio?', [o('no', 'No'), o('telefono', 'Sí, por teléfono o WhatsApp'), o('web', 'Sí, en su web')], m(['estancias'])),
  // online
  single('online_parte', 'modelo', '¿Qué parte de las ventas es online?', [o('menos10', 'Menos del 10 %'), o('10-30', 'Entre el 10 y el 30 %'), o('30-60', 'Entre el 30 y el 60 %'), o('mas60', 'Más del 60 %')], m(['online'])),
  // recurrente
  single('bajas', 'modelo', 'De cada 100 clientes de cuota, ¿cuántos se dan de baja al mes?', [o('casi_nadie', 'Casi nadie'), o('1-2', '1 o 2'), o('5', 'Unos 5'), o('10+', '10 o más'), NOSE], m(['recurrente'])),
  nota('modelo', 'cómo compra el cliente'),

  /* ── Los números ─────────────────────────────────────── */
  single('facturacion_mes', 'numeros', 'En un mes normal, ¿cuánto entra en caja, más o menos?', [
    o('menos5k', 'Menos de 5.000 €'), o('5-12k', 'De 5.000 a 12.000 €'), o('12-20k', 'De 12.000 a 20.000 €'), o('20-40k', 'De 20.000 a 40.000 €'), o('mas40k', 'Más de 40.000 €'),
    o('noclaro', 'No lo tiene claro'), o('nodice', 'Prefiere no decirlo'),
  ], { help: 'Con IVA. Una cifra aproximada basta y no sale de GONFIXIT.' }),
  single('ticket', 'numeros', '¿Cuánto se gasta un cliente de media cada vez?', [o('menos5', 'Menos de 5 €'), o('5-15', 'De 5 a 15 €'), o('15-40', 'De 15 a 40 €'), o('40-100', 'De 40 a 100 €'), o('100-500', 'De 100 a 500 €'), o('mas500', 'Más de 500 €')], { help: 'Si vende proyectos o presupuestos, lo que vale uno de media.' }),
  single('volumen_dia', 'numeros', 'En un día normal, ¿a cuántos clientes cobra?', [o('menos30', 'Menos de 30'), o('30-80', 'De 30 a 80'), o('80-150', 'De 80 a 150'), o('150-300', 'De 150 a 300'), o('mas300', 'Más de 300')], m(['local', 'pedidos'])),
  single('volumen_semana', 'numeros', 'En una semana normal, ¿cuántas citas, encargos, presupuestos o reservas tiene?', [o('menos10', 'Menos de 10'), o('10-30', 'De 10 a 30'), o('30-60', 'De 30 a 60'), o('60-120', 'De 60 a 120'), o('mas120', 'Más de 120')], m(['citas', 'presupuesto', 'encargos', 'estancias', 'online', 'recurrente'])),
  single('escandallo', 'numeros', '¿Sabe cuánto le cuesta hacer cada cosa que vende?', [o('si', 'Sí, de todo'), o('algunas', 'De algunas cosas'), o('no', 'No: pone el precio a ojo o mirando a la competencia')], si('sector', SECTORES_PRODUCTO)),
  single('coste_producto', 'numeros', 'De cada 10 € que vende, ¿cuánto se va en producto o materia prima?', [o('menos2.5', 'Menos de 2,50 €'), o('2.5-3.5', 'De 2,50 a 3,50 €'), o('3.5-5', 'De 3,50 a 5 €'), o('mas5', 'Más de 5 €'), NOSE], si('sector', SECTORES_PRODUCTO)),
  single('subida_precios', 'numeros', '¿Cuándo subió precios por última vez?', [o('este_ano', 'Este año'), o('ano_pasado', 'El año pasado'), o('mas2', 'Hace más de dos años'), o('nose', 'No se acuerda')]),
  single('costes_fijos', 'numeros', '¿Cuándo revisó por última vez lo que paga de luz, teléfono e internet?', [o('este_ano', 'Este año'), o('mas1', 'Hace más de un año'), o('nunca', 'Nunca')]),
  nota('numeros', 'los números'),

  /* ── Clientes ────────────────────────────────────────── */
  single('respuesta', 'clientes', 'Cuando alguien escribe o llama, ¿cuánto tarda en tener respuesta?', [o('minutos', 'Minutos'), o('horas', 'Unas horas'), o('dia', 'Un día o más'), o('depende', 'Depende de quién esté')]),
  single('repiten', 'clientes', 'De cada diez clientes nuevos, ¿cuántos vuelven?', [o('pocos', 'Menos de 3'), o('mitad', 'De 3 a 5'), o('mayoria', '6 o más'), NOSE]),
  multi('fidelizacion', 'clientes', '¿Hace algo para que vuelvan?', [o('nada', 'Nada en concreto'), o('descuentos', 'Descuentos u ofertas'), o('tarjeta', 'Tarjeta de puntos o sellos'), o('mensajes', 'Mensajes o avisos'), o('redes', 'Contenido en redes'), o('eventos', 'Eventos o novedades')]),
  single('lista_clientes', 'clientes', '¿Tiene el teléfono o el correo de sus clientes?', [o('no', 'No'), o('parcial', 'Algunos, en el móvil o en papeles'), o('si', 'Sí, y podría escribirles a todos de una vez')]),
  nota('clientes', 'clientes'),

  /* ── Gestión ─────────────────────────────────────────── */
  multi('herramientas', 'gestion', '¿Con qué lleva el día a día?', [o('papel', 'Papel y libreta'), o('excel', 'Excel u hojas de cálculo'), o('whatsapp', 'WhatsApp'), o('agenda_online', 'Agenda o reservas online'), o('crm', 'Un programa de clientes'), o('tpv', 'TPV o programa de caja'), o('plataforma', 'Lo que le da la plataforma'), o('otro', 'Otro programa')]),
  single('horas_manuales', 'gestion', '¿Cuántas horas a la semana se van en tareas a mano: apuntar, confirmar, reclamar, pasar datos?', [o('menos2', 'Menos de 2'), o('2-5', 'De 2 a 5'), o('5-10', 'De 5 a 10'), o('mas10', 'Más de 10')]),
  multi('apoyo_externo', 'gestion', '¿Con quién trabaja ya?', [o('gestoria', 'Gestoría o asesoría'), o('agencia', 'Agencia o alguien que lleva las redes'), o('web', 'Alguien que lleva la web'), o('nadie', 'Nadie')]),
  nota('gestion', 'la gestión'),

  /* ── Objetivo ────────────────────────────────────────── */
  multi('problema_principal', 'objetivo', '¿Cuáles son los frenos principales ahora mismo?', [
    o('pocos_clientes', 'Faltan clientes nuevos'), o('no_vuelven', 'Vienen una vez y no vuelven'), o('reservas_noshows', 'Citas, reservas o encargos que fallan'),
    o('leads_sin_seguimiento', 'Contactos y presupuestos sin seguimiento'), o('tareas_manuales', 'Demasiado trabajo a mano'), o('comisiones', 'Las plataformas se llevan demasiada comisión'),
    o('margen', 'Vende, pero no le queda dinero'), o('datos_dispersos', 'No tiene números para decidir'), o('marketing_sin_retorno', 'Gasta en marketing sin ver retorno'),
    o('equipo', 'Todo depende del dueño'), o('otro', 'Otro'),
  ], { help: 'Tres como mucho: los que más duelen.', maxSel: 3 }),
  text('freno_otro', 'objetivo', '¿Cuál es ese otro freno?', si('problema_principal', ['otro'])),
  Object.assign(area('objetivo', 'objetivo', 'Si en tres meses solo cambiara una cosa, ¿cuál tendría que ser?'), { required: true }),
  single('si_nada', 'objetivo', 'Si dentro de seis meses todo sigue igual, ¿qué pasa?', [o('nada', 'Nada grave'), o('pierde', 'Pierde dinero, pero aguanta'), o('cierre', 'Se plantea cerrar, traspasar o reducir'), o('horas', 'El dueño no puede seguir con estas horas')]),
  single('urgencia', 'objetivo', '¿Para cuándo lo quiere funcionando?', [o('alta', 'Este mes'), o('temporada', 'Antes de Navidad, de verano o de su temporada fuerte'), o('media', 'En los próximos tres meses'), o('baja', 'Sin fecha, está mirando')]),
  single('implicacion', 'objetivo', '¿Cuánto tiempo puede dedicar el dueño a esto las próximas semanas?', [o('poco', 'Muy poco: que funcione sin él'), o('algo', 'Un par de horas a la semana'), o('mucho', 'Lo que haga falta')]),
  single('inversion_inicial', 'objetivo', 'Para ponerlo en marcha, ¿cuánto podría invertir de una vez?', [o('menos300', 'Menos de 300 €'), o('300-1000', 'De 300 a 1.000 €'), o('1000-3000', 'De 1.000 a 3.000 €'), o('mas3000', 'Más de 3.000 €'), o('hablar', 'Prefiere hablarlo')], { required: false }),
  single('inversion_mes', 'objetivo', 'Y para que alguien lo lleve cada mes, ¿cuánto le encajaría?', [o('nada', 'Nada, lo lleva él'), o('hasta200', 'Hasta 200 € al mes'), o('200-500', 'De 200 a 500 € al mes'), o('mas500', 'Más de 500 € al mes'), o('hablar', 'Prefiere hablarlo')], { required: false }),
  area('intentado', 'objetivo', '¿Qué ha probado ya y qué pasó?'),
  area('problema_detalle', 'objetivo', '¿Algo más que debamos saber?'),

  /* ── Contacto y decisión ─────────────────────────────── */
  Object.assign(text('persona_contacto', 'contacto', '¿Con quién hablamos?'), { required: true, placeholder: 'Nombre y apellido' }),
  single('decide', 'contacto', 'Para una decisión así, ¿quién tiene la última palabra?', [o('dueno', 'Él o ella: es el dueño'), o('socios', 'Él o ella con su socio o socia'), o('encargado', 'Es encargado: decide el dueño'), o('otro', 'Otro')]),
  { key: 'email', section: 'contacto', type: 'email', required: true, label: '¿A qué correo le escribimos?', placeholder: 'correo@ejemplo.com' },
  { key: 'telefono', section: 'contacto', type: 'tel', required: true, label: '¿Y su teléfono o WhatsApp?', placeholder: '600 000 000' },
  text('web_url', 'contacto', 'Si tiene web, ¿cuál es la dirección?', { help: 'Opcional. La miramos nosotros.' }),
  text('instagram', 'contacto', '¿Y su Instagram o red principal?', { help: 'Opcional.' }),
];

const keys = questions.map((q) => q.key);
const dup = keys.filter((k, i) => keys.indexOf(k) !== i);
if (dup.length) throw new Error('claves duplicadas: ' + dup.join(','));
for (const q of questions) for (const c of q.showIf ? [].concat(q.showIf) : []) if (!keys.includes(c.key) || keys.indexOf(c.key) > keys.indexOf(q.key)) throw new Error('showIf de ' + q.key + ' → ' + c.key);

f.version = '2026-11-19';
f.title = 'Diagnóstico de negocio';
f.intro = 'Veinte minutos para ver cómo funciona el negocio hoy: cómo compra el cliente, qué números mueve, cómo se gestiona y qué se quiere conseguir. Con las respuestas preparamos un pre-diagnóstico al momento.';
f.duration = '20 min · unas 38 preguntas, casi todas de un toque';
f.next_steps = ['Al terminar sale el pre-diagnóstico: dónde se va el dinero y cuánto.', 'Un responsable de GONFIXIT lo revisa contigo.', 'Decidimos juntos qué va primero.'];
f.entrevista = {
  kicker: 'GONFIXIT · Modo entrevista',
  intro: 'Lo rellenas tú con el cliente delante. Al terminar ves el diagnóstico completo, con soluciones, orden, plan y nota interna. No se lo enseñes tal cual: la versión del cliente es la corta.',
  accept_label: 'He informado al cliente de que GONFIXIT trata sus datos para preparar el diagnóstico y contactarle, y lo acepta.',
};
f.sections = sections;
f.questions = questions;

const out = ['{'];
const entries = Object.entries(f);
entries.forEach(([k, v], i) => {
  const last = i === entries.length - 1 ? '' : ',';
  if (k === 'questions' || k === 'sections') out.push(`  ${JSON.stringify(k)}: [\n` + v.map((x) => '    ' + JSON.stringify(x)).join(',\n') + `\n  ]${last}`);
  else out.push(`  ${JSON.stringify(k)}: ` + JSON.stringify(v, null, 2).replace(/\n/g, '\n  ') + last);
});
out.push('}');
fs.writeFileSync(FILE, out.join('\n') + '\n');
const vis = (ans, modo) => questions.filter((q) => (!q.modo || q.modo === modo) && (!q.showIf || [].concat(q.showIf).every((c) => { const v = ans[c.key]; const a = Array.isArray(v) ? v : [v]; return a.some((x) => c.in.includes(x)); })));
console.log('total', questions.length, '· barbería', vis({ modelo: ['citas'], sector: 'barberias' }).length, '· obrador (local+pedidos+encargos)', vis({ modelo: ['local', 'pedidos', 'encargos'], sector: 'heladerias', reparto: 'mucho' }).length, '· obrador en entrevista', vis({ modelo: ['local', 'pedidos', 'encargos'], sector: 'heladerias', reparto: 'mucho' }, 'entrevista').length);
