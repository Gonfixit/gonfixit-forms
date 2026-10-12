/* Genera forms/diagnostico.json (versión 3: cuestionario general con ramas por modelo de negocio).
   Uso: node scripts/cuestionario-v3.cjs  → reescribe preguntas y secciones conservando consentimiento, gracias y muestra. */
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

const sections = [
  { id: 'negocio', title: 'Tu negocio' },
  { id: 'modelo', title: 'Cómo compra tu cliente' },
  { id: 'clientes', title: 'Cómo te llegan los clientes' },
  { id: 'presencia', title: 'Tu presencia: web, Google y redes' },
  { id: 'gestion', title: 'Cómo lo gestionas hoy' },
  { id: 'vuelven', title: 'Clientes que vuelven' },
  { id: 'objetivo', title: 'Qué quieres conseguir' },
  { id: 'contacto', title: 'Dónde te respondemos' },
];

const NOSE = o('nose', 'No lo sé');
const MAYORIA = [o('mayoria', 'La mayoría'), o('mitad', 'Más o menos la mitad'), o('pocos', 'Pocos'), NOSE];

const questions = [
  /* ── Tu negocio ───────────────────────────────────────── */
  Object.assign(text('nombre_empresa', 'negocio', '¿Cómo se llama tu negocio?'), { required: true, placeholder: 'Nombre del negocio' }),
  single('sector', 'negocio', '¿A qué se dedica?', [
    o('restaurantes', 'Bar, restaurante o cafetería'),
    o('heladerias', 'Heladería, pastelería, panadería u obrador'),
    o('clinicas', 'Clínica: dental, fisio, estética, salud'),
    o('barberias', 'Peluquería, barbería, uñas o belleza'),
    o('tatuaje', 'Estudio de tatuaje o piercing'),
    o('floristerias', 'Floristería, regalos o decoración'),
    o('hoteles', 'Hotel, apartamentos o alojamiento'),
    o('constructoras', 'Reformas, construcción, instaladores u oficios'),
    o('inmobiliarias', 'Inmobiliaria'),
    o('telecom', 'Telecom, informática o tecnología'),
    o('comercio', 'Tienda o comercio'),
    o('servicios', 'Asesoría, agencia, consultoría o despacho'),
    o('formacion', 'Academia, gimnasio o formación'),
    o('automocion', 'Taller o automoción'),
    o('eventos', 'Eventos, fotografía o catering'),
    o('otros', 'Otro'),
  ]),
  text('sector_otro', 'negocio', '¿A qué se dedica exactamente?', si('sector', ['otros'])),
  Object.assign(area('que_vendes', 'negocio', 'En dos o tres frases: ¿qué vendes, a quién y qué te diferencia de los de al lado?'), { required: true }),
  Object.assign(text('ciudad', 'negocio', '¿En qué ciudad o zona estáis?'), { required: true }),
  single('antiguedad', 'negocio', '¿Cuánto lleva en marcha?', [o('menos1', 'Menos de un año'), o('1-3', 'Entre uno y tres años'), o('3-10', 'Entre tres y diez'), o('mas10', 'Más de diez')]),
  single('tamano', 'negocio', '¿Cuántas personas trabajáis?', [o('solo', 'Solo yo'), o('2-5', 'De 2 a 5'), o('6-15', 'De 6 a 15'), o('16-50', 'De 16 a 50'), o('50+', 'Más de 50')]),
  single('ticket', 'negocio', '¿Cuánto se gasta un cliente de media cada vez?', [o('menos15', 'Menos de 15 €'), o('15-40', 'Entre 15 y 40 €'), o('40-100', 'Entre 40 y 100 €'), o('100-500', 'Entre 100 y 500 €'), o('mas500', 'Más de 500 €')], { help: 'Si vendes proyectos o presupuestos, piensa en lo que vale uno de media.' }),
  single('momento', 'negocio', '¿Cómo va el negocio este año respecto al anterior?', [o('crece', 'Crece'), o('igual', 'Igual'), o('baja', 'Baja'), o('nuevo', 'Es nuevo, no hay comparación')]),
  area('momento_detalle', 'negocio', '¿A qué lo achacas?', si('momento', ['crece', 'baja'])),
  single('temporada', 'negocio', '¿Tu negocio tiene temporada?', [o('fuerte', 'Mucha: hay meses que lo son todo'), o('algo', 'Algo: sube y baja'), o('no', 'No, es bastante parejo todo el año')]),
  text('temporada_detalle', 'negocio', '¿Qué meses son los fuertes y qué pasa el resto del año?', si('temporada', ['fuerte', 'algo'])),
  area('detalle_negocio', 'negocio', '¿Algo más sobre el negocio que debamos saber?'),

  /* ── Cómo compra tu cliente (abre ramas) ─────────────── */
  multi('modelo', 'modelo', '¿Cómo compra la gente lo que haces?', [
    o('citas', 'Con cita o reserva de hora'),
    o('local', 'Viene al local y compra al momento'),
    o('pedidos', 'Pedidos para llevar o a domicilio'),
    o('presupuesto', 'Pide presupuesto o propuesta antes de decidir'),
    o('encargos', 'Encargos para una fecha: bodas, eventos, fechas señaladas'),
    o('estancias', 'Reservas de noches o alquileres'),
    o('online', 'Compra online'),
    o('recurrente', 'Paga una cuota, contrato o mantenimiento periódico'),
  ], { help: 'Marca todas las que te pasen. Las siguientes preguntas se adaptan a lo que marques.' }),

  // citas
  multi('citas_como', 'modelo', '¿Cómo se pide la cita?', [o('llamada', 'Por teléfono'), o('whatsapp', 'Por WhatsApp'), o('online', 'Online: web, app o enlace'), o('presencial', 'En persona'), o('redes', 'Por Instagram u otra red')], m(['citas'])),
  single('noshows', 'modelo', '¿Cuántas citas se caen a la semana sin avisar?', [o('0-1', 'Ninguna o una'), o('2-5', 'De 2 a 5'), o('6-10', 'De 6 a 10'), o('mas10', 'Más de 10')], m(['citas'])),
  single('recordatorios', 'modelo', '¿Mandáis recordatorio antes de la cita?', [o('no', 'No'), o('a_mano', 'Sí, a mano, cuando hay tiempo'), o('automatico', 'Sí, automático')], m(['citas'])),
  single('agenda_llena', 'modelo', '¿Cómo va la agenda?', [o('llena', 'Llena: hay lista de espera'), o('bien', 'Bien, con huecos sueltos'), o('huecos', 'Con bastantes huecos'), o('irregular', 'Muy irregular según el día')], m(['citas'])),
  area('detalle_citas', 'modelo', 'Cuéntanos cómo va lo de las citas en tu caso: qué falla y qué funciona.', m(['citas'])),

  // local
  single('afluencia', 'modelo', '¿Cómo es la afluencia al local?', [o('lleno', 'Casi siempre lleno'), o('picos', 'Picos claros: fines de semana u horas punta, y el resto flojo'), o('flojo', 'Más floja de lo que debería'), o('depende', 'Depende mucho del tiempo o de la temporada')], m(['local'])),
  single('cobro', 'modelo', '¿Cómo cobras y registras las ventas?', [o('tpv_registra', 'TPV con programa: sé qué se vende y cuánto'), o('tpv_simple', 'Datáfono y caja, sin registro por producto'), o('efectivo', 'Casi todo efectivo')], m(['local'])),
  area('detalle_local', 'modelo', '¿Qué hace que alguien entre en tu local y no en otro? ¿Y qué le haría volver?', m(['local'])),

  // pedidos
  single('reparto', 'modelo', '¿Trabajas con plataformas de reparto como Glovo, Uber Eats o Just Eat?', [o('mucho', 'Sí, son una parte importante de las ventas'), o('algo', 'Sí, pero poco'), o('no', 'No')], m(['pedidos'])),
  single('comision', 'modelo', '¿Qué comisión se llevan, más o menos?', [o('menos15', 'Menos del 15 %'), o('15-25', 'Entre el 15 y el 25 %'), o('25-35', 'Entre el 25 y el 35 %'), NOSE], Object.assign({ required: false }, si('reparto', ['mucho', 'algo']))),
  single('pedidos_propio', 'modelo', '¿Tienes una forma propia de pedir sin pasar por plataformas?', [o('no', 'No'), o('whatsapp', 'Por WhatsApp o teléfono'), o('web', 'Web o app propia')], m(['pedidos'])),
  area('detalle_pedidos', 'modelo', '¿Cómo va lo de los pedidos: qué falla y qué funciona?', m(['pedidos'])),

  // presupuesto
  single('presupuestos', 'modelo', 'De los presupuestos o propuestas que haces al mes, ¿cuántos se cierran?', MAYORIA, m(['presupuesto'])),
  single('presupuesto_tiempo', 'modelo', '¿Cuánto tardas en enviar un presupuesto desde que te lo piden?', [o('mismo_dia', 'El mismo día'), o('2-3dias', 'Dos o tres días'), o('semana', 'Una semana'), o('mas', 'Más de una semana')], m(['presupuesto'])),
  single('presupuesto_seguimiento', 'modelo', 'Y si no contestan, ¿qué pasa?', [o('nada', 'Nada, se queda ahí'), o('aveces', 'Llamo o escribo a veces, si me acuerdo'), o('sistema', 'Hay un seguimiento fijo')], m(['presupuesto'])),
  area('detalle_presupuesto', 'modelo', '¿Por qué crees que se pierden los que se pierden?', m(['presupuesto'])),

  // encargos
  single('encargos', 'modelo', '¿Qué parte de tus ventas son encargos?', MAYORIA, m(['encargos'])),
  single('encargos_como', 'modelo', '¿Cómo los apuntas?', [o('papel', 'En papel o libreta'), o('whatsapp', 'En WhatsApp'), o('agenda', 'En una agenda o calendario'), o('sistema', 'En un programa o sistema')], m(['encargos'])),
  single('encargos_fallo', 'modelo', 'En el último año, ¿se te ha pasado alguno o se ha cruzado alguna fecha?', [o('no', 'No'), o('alguna_vez', 'Alguna vez'), o('mas', 'Más de lo que me gustaría')], m(['encargos'])),
  area('detalle_encargos', 'modelo', 'Cuéntanos cómo funcionan los encargos en tu caso y qué fechas son las fuertes.', m(['encargos'])),

  // estancias
  single('ota', 'modelo', '¿Qué parte de tus reservas llega por Booking, Airbnb u otras plataformas?', [o('menos25', 'Menos de una cuarta parte'), o('25-50', 'Entre un cuarto y la mitad'), o('mas50', 'Más de la mitad'), NOSE], m(['estancias'])),
  single('reserva_directa', 'modelo', '¿Se puede reservar directamente contigo sin pasar por plataformas?', [o('no', 'No'), o('telefono', 'Sí, por teléfono o WhatsApp'), o('web', 'Sí, en la web con motor de reservas')], m(['estancias'])),
  area('detalle_estancias', 'modelo', '¿Qué cambiarías de cómo te llegan las reservas?', m(['estancias'])),

  // online
  single('online_parte', 'modelo', '¿Qué parte de tus ventas es online?', [o('menos10', 'Menos del 10 %'), o('10-30', 'Entre el 10 y el 30 %'), o('30-60', 'Entre el 30 y el 60 %'), o('mas60', 'Más del 60 %')], m(['online'])),
  single('online_donde', 'modelo', '¿Dónde vendes online?', [o('propia', 'Tienda propia: Shopify, WooCommerce o similar'), o('marketplace', 'Amazon, Etsy, Wallapop u otro marketplace'), o('redes', 'Por Instagram o WhatsApp'), o('varias', 'Varias de las anteriores')], m(['online'])),
  area('detalle_online', 'modelo', '¿Qué funciona y qué falla en la venta online?', m(['online'])),

  // recurrente
  single('bajas', 'modelo', '¿Cuántos clientes se dan de baja al mes, más o menos?', [o('casi_nadie', 'Casi nadie'), o('pocos', 'Pocos: uno de cada veinte'), o('bastantes', 'Bastantes: uno de cada diez o más'), NOSE], m(['recurrente'])),
  single('cobro_recurrente', 'modelo', '¿Cómo cobras las cuotas?', [o('automatico', 'Domiciliación o tarjeta automática'), o('manual', 'Transferencia, efectivo o factura cada mes'), o('mixto', 'Mezcla de las dos')], m(['recurrente'])),
  area('detalle_recurrente', 'modelo', '¿Por qué se van los que se van?', m(['recurrente'])),

  /* ── Cómo te llegan los clientes ─────────────────────── */
  multi('canales', 'clientes', '¿Por dónde te llegan los clientes hoy?', [o('boca_a_boca', 'Boca a boca y recomendaciones'), o('google', 'Google y Maps'), o('redes', 'Instagram, TikTok, Facebook'), o('plataformas', 'Plataformas: Booking, Glovo, Idealista, TripAdvisor…'), o('paso', 'Gente que pasa por delante'), o('publicidad', 'Publicidad pagada'), o('otros', 'Otros')]),
  single('canal_principal', 'clientes', 'De esos, ¿cuál trae más clientes?', [o('boca_a_boca', 'Boca a boca'), o('google', 'Google y Maps'), o('redes', 'Redes sociales'), o('plataformas', 'Plataformas'), o('paso', 'Gente que pasa'), o('publicidad', 'Publicidad'), NOSE]),
  multi('contacto_via', 'clientes', '¿Cómo te contactan o te piden?', [o('whatsapp', 'WhatsApp'), o('llamada', 'Llamada'), o('web', 'Formulario o correo desde la web'), o('redes', 'Mensajes en redes'), o('presencial', 'En persona'), o('plataforma', 'A través de una plataforma')]),
  single('volumen', 'clientes', '¿Cuántos contactos, citas, pedidos o presupuestos manejas a la semana?', [o('menos10', 'Menos de 10'), o('10-30', 'Entre 10 y 30'), o('30-100', 'Entre 30 y 100'), o('mas100', 'Más de 100')]),
  single('respuesta', 'clientes', 'Cuando alguien te escribe, ¿cuánto tarda en tener respuesta?', [o('minutos', 'Minutos'), o('horas', 'Unas horas'), o('dia', 'Un día o más'), o('depende', 'Depende de quién esté')]),
  single('respuesta_quien', 'clientes', '¿Quién responde?', [o('yo', 'Yo, entre una cosa y otra'), o('persona', 'Una persona del equipo'), o('nadie', 'Nadie fijo: quien pueda')], Object.assign({ required: false }, si('respuesta', ['horas', 'dia', 'depende']))),
  single('perdida', 'clientes', 'De los que te contactan, ¿cuántos se pierden por el camino?', [o('casi_nada', 'Casi ninguno'), o('1de10', 'Uno de cada diez'), o('1de4', 'Uno de cada cuatro'), o('mas', 'Más'), NOSE]),
  area('perdida_donde', 'clientes', '¿Dónde crees que se pierden? Por ejemplo: no contesto a tiempo, preguntan precio y desaparecen, no hay hueco…', si('perdida', ['1de10', '1de4', 'mas', 'nose'])),
  area('detalle_clientes', 'clientes', '¿Quieres contarnos algo más sobre cómo te llegan los clientes?'),

  /* ── Presencia ───────────────────────────────────────── */
  single('web', 'presencia', '¿Tienes página web?', [o('no', 'No'), o('si_no_trae', 'Sí, pero no trae clientes'), o('si_trae', 'Sí y trae clientes'), o('nose', 'Sí, pero no sé si trae')]),
  text('web_url', 'presencia', '¿Cuál es la dirección de la web?', si('web', ['si_no_trae', 'si_trae', 'nose'])),
  area('web_por_que', 'presencia', '¿Por qué crees que no trae clientes?', si('web', ['si_no_trae'])),
  single('ficha_google', 'presencia', 'Tu ficha de Google, la que sale en Maps, ¿cómo está?', [o('cuidada', 'Cuidada: fotos, horarios y reseñas al día'), o('abandonada', 'Existe pero está abandonada'), o('no', 'No tengo'), NOSE]),
  single('resenas', 'presencia', '¿Pides reseñas a tus clientes?', [o('no', 'No'), o('aveces', 'A veces, de palabra'), o('sistema', 'Sí, de forma sistemática')]),
  single('redes', 'presencia', '¿Qué haces en redes sociales?', [o('nada', 'Nada o casi nada'), o('cuando_puedo', 'Publico cuando puedo'), o('plan', 'Publico con un plan'), o('externo', 'Lo lleva alguien de fuera')]),
  text('instagram', 'presencia', '¿Cuál es tu Instagram o red principal?', si('redes', ['cuando_puedo', 'plan', 'externo'])),
  single('publicidad', 'presencia', '¿Pagas publicidad: Google, Instagram, Facebook, folletos?', [o('no', 'No'), o('si_sin_medir', 'Sí, pero no sé qué me trae'), o('si_mido', 'Sí y mido lo que trae'), o('antes', 'Lo hice y lo dejé')]),
  single('inversion_marketing', 'presencia', '¿Cuánto te gastas al mes en publicidad, más o menos?', [o('menos100', 'Menos de 100 €'), o('100-300', 'Entre 100 y 300 €'), o('300-1000', 'Entre 300 y 1.000 €'), o('mas1000', 'Más de 1.000 €')], Object.assign({ required: false }, si('publicidad', ['si_sin_medir', 'si_mido']))),
  area('publicidad_resultado', 'presencia', '¿Qué resultado notas o notaste?', si('publicidad', ['si_sin_medir', 'si_mido', 'antes'])),
  multi('visibilidad_local', 'presencia', '¿Qué haces para que te vean en el barrio o en tu zona?', [o('nada', 'Nada en especial'), o('escaparate', 'Escaparate, cartelería o fachada'), o('alianzas', 'Alianzas con otros negocios'), o('eventos', 'Eventos o promociones'), o('folletos', 'Folletos o buzoneo')]),
  area('detalle_presencia', 'presencia', '¿Algo más sobre tu web, Google o redes?'),

  /* ── Gestión ─────────────────────────────────────────── */
  multi('herramientas', 'gestion', '¿Con qué llevas el día a día?', [o('papel', 'Papel y libreta'), o('excel', 'Excel u hojas de cálculo'), o('whatsapp', 'WhatsApp'), o('agenda_online', 'Agenda o reservas online'), o('crm', 'Un CRM o programa de clientes'), o('tpv', 'TPV o programa de caja'), o('plataforma', 'Lo que me da la plataforma'), o('otro', 'Otro programa')]),
  text('herramientas_cuales', 'gestion', '¿Cuáles usas? Nombres de los programas o apps.', si('herramientas', ['agenda_online', 'crm', 'tpv', 'plataforma', 'otro'])),
  single('ya_tienes_sistemas', 'gestion', '¿Dirías que tienes sistemas montados?', [o('no', 'No, va todo de cabeza'), o('si_desordenados', 'Sí, pero desordenados'), o('si_ok', 'Sí y funcionan')]),
  area('sistemas_desorden', 'gestion', '¿Qué es lo que más se desordena?', si('ya_tienes_sistemas', ['si_desordenados'])),
  single('lista_clientes', 'gestion', '¿Tienes una lista de clientes con su teléfono o correo?', [o('no', 'No'), o('parcial', 'A medias: están en el móvil o en papeles'), o('si', 'Sí, ordenada')]),
  single('seguimiento', 'gestion', 'Un presupuesto, una consulta o un contacto que no cierra el mismo día, ¿cómo lo sigues?', [o('no', 'No lo sigo'), o('memoria', 'De memoria'), o('lista', 'Con una lista o un Excel'), o('sistema', 'Con un sistema que avisa')]),
  single('horas_manuales', 'gestion', '¿Cuántas horas a la semana se van en tareas a mano: apuntar, confirmar, reclamar, pasar datos?', [o('menos2', 'Menos de 2'), o('2-5', 'De 2 a 5'), o('5-10', 'De 5 a 10'), o('mas10', 'Más de 10')]),
  area('horas_que', 'gestion', '¿En qué se van esas horas, sobre todo?', si('horas_manuales', ['5-10', 'mas10'])),
  single('quien_gestiona', 'gestion', '¿Quién lo lleva?', [o('yo', 'Yo'), o('una_persona', 'Una persona del equipo'), o('varios', 'Varios, según el día'), o('nadie', 'Nadie en concreto')]),
  single('datos', 'gestion', '¿Sabes cada mes cuánto has vendido, qué va mejor y de dónde vienen los clientes?', [o('no', 'No'), o('ventas', 'Sé las ventas, poco más'), o('si', 'Sí, lo tengo controlado')]),
  area('detalle_gestion', 'gestion', '¿Algo más sobre cómo lo gestionas?'),

  /* ── Clientes que vuelven ────────────────────────────── */
  single('repiten', 'vuelven', 'De cada diez clientes nuevos, ¿cuántos vuelven?', [o('pocos', 'Dos o tres'), o('mitad', 'La mitad'), o('mayoria', 'Siete o más'), NOSE]),
  area('repiten_por_que', 'vuelven', '¿Por qué crees que no vuelven más?', si('repiten', ['pocos', 'nose'])),
  multi('fidelizacion', 'vuelven', '¿Haces algo para que vuelvan?', [o('nada', 'Nada en concreto'), o('descuentos', 'Descuentos u ofertas'), o('tarjeta', 'Tarjeta de puntos o sellos'), o('mensajes', 'Mensajes o avisos'), o('redes', 'Contenido en redes'), o('eventos', 'Eventos o novedades')]),
  area('fidelizacion_que', 'vuelven', '¿Cómo funciona lo que haces y qué resultado te da?', si('fidelizacion', ['descuentos', 'tarjeta', 'mensajes', 'eventos'])),
  single('aviso_clientes', 'vuelven', 'Si mañana quisieras avisar a todos tus clientes de una novedad, ¿podrías?', [o('no', 'No'), o('algunos', 'A algunos, uno a uno'), o('si', 'Sí, a todos de una vez')]),
  area('detalle_vuelven', 'vuelven', '¿Algo más sobre tus clientes de siempre?'),

  /* ── Objetivo ────────────────────────────────────────── */
  multi('problema_principal', 'objetivo', '¿Cuáles son los frenos principales ahora mismo?', [
    o('pocos_clientes', 'Me faltan clientes nuevos'), o('no_vuelven', 'Vienen una vez y no vuelven'), o('reservas_noshows', 'Citas, reservas o encargos que fallan'),
    o('leads_sin_seguimiento', 'Contactos y presupuestos sin seguimiento'), o('tareas_manuales', 'Demasiado trabajo a mano'), o('comisiones', 'Las plataformas se llevan demasiada comisión'),
    o('web', 'La web no trae nada o no la tengo'), o('datos_dispersos', 'No tengo datos para decidir'), o('marketing_sin_retorno', 'Gasto en marketing sin ver retorno'),
    o('equipo', 'Dependo demasiado de mí o del equipo'), o('otro', 'Otro'),
  ], { help: 'Marca todos los que te pasen. El primero que marques es el que más te duele.' }),
  text('freno_otro', 'objetivo', '¿Cuál es ese otro freno?', si('problema_principal', ['otro'])),
  Object.assign(area('objetivo', 'objetivo', 'Si en tres meses solo cambiara una cosa, ¿cuál tendría que ser?'), { required: true }),
  area('intentado', 'objetivo', '¿Qué has probado ya y qué pasó?'),
  single('urgencia', 'objetivo', '¿Cómo de urgente es?', [o('baja', 'Sin prisa, estoy mirando'), o('media', 'Me gustaría arrancar este trimestre'), o('alta', 'Lo necesito ya')]),
  single('implicacion', 'objetivo', '¿Cuánto tiempo puedes dedicar tú a esto las próximas semanas?', [o('poco', 'Muy poco: que funcione sin mí'), o('algo', 'Un par de horas a la semana'), o('mucho', 'Lo que haga falta')]),
  single('presupuesto', 'objetivo', '¿Qué inversión te planteas?', [o('', 'Prefiero no decirlo aún'), o('menos500', 'Menos de 500 €'), o('500-2000', 'Entre 500 y 2.000 €'), o('2000-5000', 'Entre 2.000 y 5.000 €'), o('mas5000', 'Más de 5.000 €')], { required: false }),
  area('problema_detalle', 'objetivo', '¿Algo más que debamos saber antes de llamarte?'),

  /* ── Contacto ────────────────────────────────────────── */
  Object.assign(text('persona_contacto', 'contacto', '¿Con quién hablamos?'), { required: true, placeholder: 'Nombre y apellido' }),
  single('cargo', 'contacto', '¿Cuál es tu papel en el negocio?', [o('propietario', 'Propietario o socio'), o('gerente', 'Gerente o encargado'), o('equipo', 'Parte del equipo'), o('otro', 'Otro')]),
  { key: 'email', section: 'contacto', type: 'email', required: true, label: '¿A qué correo te escribimos?', placeholder: 'tu@correo.com' },
  { key: 'telefono', section: 'contacto', type: 'tel', required: true, label: '¿Y tu teléfono o WhatsApp?', placeholder: '600 000 000' },
  single('horario', 'contacto', '¿Cuándo te viene bien que te llamemos?', [o('indiferente', 'Cuando sea'), o('manana', 'Por la mañana'), o('tarde', 'Por la tarde'), o('whatsapp', 'Mejor por WhatsApp')], { required: false }),
];

/* conservar placeholders/ayudas que ya existían para claves iguales */
const prev = Object.fromEntries(f.questions.map((q) => [q.key, q]));
for (const q of questions) {
  const p = prev[q.key];
  if (!p) continue;
  if (p.placeholder && !q.placeholder) q.placeholder = p.placeholder;
  if (p.help && !q.help) q.help = p.help;
}

const keys = questions.map((q) => q.key);
const dup = keys.filter((k, i) => keys.indexOf(k) !== i);
if (dup.length) throw new Error('claves duplicadas: ' + dup.join(','));
for (const q of questions) {
  const conds = q.showIf ? [].concat(q.showIf) : [];
  for (const c of conds) if (!keys.includes(c.key) || keys.indexOf(c.key) > keys.indexOf(q.key)) throw new Error('showIf de ' + q.key + ' apunta a ' + c.key + ' que no existe o va después');
}

f.version = '2026-10-13';
f.intro = 'Doce minutos para contarnos cómo funciona tu negocio hoy: cómo compra tu cliente, cómo te llega, cómo lo gestionas, qué haces para que vuelva y qué quieres conseguir. El cuestionario se adapta a tu tipo de negocio: una heladería y una clínica no responden lo mismo. Con tus respuestas preparamos un pre-diagnóstico al momento y un responsable de GONFIXIT lo revisa y te llama en menos de 24 horas laborables.';
f.duration = '12 min · entre 50 y 60 preguntas según tu negocio, casi todas de un toque';
f.sections = sections;
f.questions = questions;

/* serializar: todo con sangría salvo preguntas y secciones, una por línea */
const out = ['{'];
const entries = Object.entries(f);
entries.forEach(([k, v], i) => {
  const last = i === entries.length - 1 ? '' : ',';
  if (k === 'questions' || k === 'sections') out.push(`  ${JSON.stringify(k)}: [\n` + v.map((x) => '    ' + JSON.stringify(x)).join(',\n') + `\n  ]${last}`);
  else out.push(`  ${JSON.stringify(k)}: ` + JSON.stringify(v, null, 2).replace(/\n/g, '\n  ') + last);
});
out.push('}');
fs.writeFileSync(FILE, out.join('\n') + '\n');
console.log('preguntas', questions.length, '· condicionales', questions.filter((q) => q.showIf).length, '· texto libre', questions.filter((q) => q.type === 'textarea' || q.type === 'text').length);
