(() => {
  'use strict';

  const SAVE_KEY = 'de-cero-a-algo-save-v1';
  const WORLD = { width: 1000, height: 455 };
  const TICK_MS = 1000;
  const STORE_MS = 10000;
  const SUFFIXES = ['', 'k', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx'];
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const esc = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const costLabel = (amount) => `${formatNumber(amount)} €`;
  const item = (id, name, cost, stage, icon, desc, group = 'mejoras', comfort = 0, effect = {}, requirements = {}) => ({ id, name, cost, stage, icon, desc, group, comfort, effect, ...requirements });

  const STAGES = [
    { id: 1, name: 'La calle', short: 'LA CALLE', area: 'Callejón y plaza', threshold: 0, scene: 'street', blurb: 'Comida, clics de supervivencia y las primeras caras conocidas.', gate: null },
    { id: 2, name: 'Habitación alquilada', short: 'HABITACIÓN', area: 'Una habitación con llave', threshold: 3000, scene: 'room', blurb: 'Descanso, muebles de segunda mano y un alquiler que negociar.', gate: 'gate-room' },
    { id: 3, name: 'Primera bici', short: 'DOS RUEDAS', area: 'Barrio comercial', threshold: 15000, scene: 'bike', blurb: 'Pedalea hasta nuevos barrios y acepta los primeros repartos.', gate: 'gate-bike' },
    { id: 4, name: 'Piso pequeño', short: 'PISO PEQUEÑO', area: 'Tu primer piso', threshold: 120000, scene: 'flat', blurb: 'Reforma por estancias, prepara recetas y gana comodidad.', gate: 'gate-flat' },
    { id: 5, name: 'Moto y furgoneta', short: 'MÁS LEJOS', area: 'Las afueras', threshold: 1000000, scene: 'motor', blurb: 'Rutas largas, trabajos con horario y vehículos que mantener.', gate: 'gate-motor' },
    { id: 6, name: 'Puesto propio', short: 'TU PUESTO', area: 'Mercadillo del barrio', threshold: 8000000, scene: 'stall', blurb: 'Elige una especialidad y levanta tu primer negocio.', gate: 'gate-stall' },
    { id: 7, name: 'Tienda de barrio', short: 'LA TIENDA', area: 'Calle comercial', threshold: 60000000, scene: 'shop', blurb: 'Empleados, proveedores, escaparate y clientes que vuelven.', gate: 'gate-shop' },
    { id: 8, name: 'Local con equipo', short: 'CON EQUIPO', area: 'Local principal', threshold: 500000000, scene: 'team', blurb: 'Forma un equipo y aprende a gestionar algo que ya es grande.', gate: 'gate-team' },
    { id: 9, name: 'Casa con jardín', short: 'HOGAR PROPIO', area: 'Tu casa y el jardín', threshold: 5000000000, scene: 'house', blurb: 'Casa propia, familia, mascotas y un huerto que produce.', gate: 'gate-house' },
    { id: 10, name: 'Cadena regional', short: 'MÁS BARRIOS', area: 'La ciudad entera', threshold: 50000000000, scene: 'chain', blurb: 'Abre franquicias, coordina logística y construye una marca.', gate: 'gate-chain' },
    { id: 11, name: 'Empresa nacional', short: 'A GRAN ESCALA', area: 'Sede central', threshold: 1000000000000, scene: 'company', blurb: 'Fundación, inversión e impacto más allá de tu ciudad.', gate: 'gate-company' },
    { id: 12, name: 'Proyecto soñado', short: 'EL SUEÑO', area: 'Donde todo empezó', threshold: 50000000000000, scene: 'dream', blurb: 'Elige qué hacer con todo lo que has construido.', gate: 'gate-dream' },
  ];

  const STAGE_GATES = [
    { id: 'gate-room', from: 1, to: 2, cost: 4000, threshold: 3000, name: 'Contrato de alquiler', icon: '⌂', desc: '3 k € de fianza y primer mes. Hace falta probar 10 comidas distintas y conseguir 5 de reputación.', extra: 'stage1' },
    { id: 'gate-bike', from: 2, to: 3, cost: 15000, threshold: 15000, name: 'Bicicleta de segunda mano', icon: '🚲', desc: 'Una bici revisada para llegar al barrio comercial y abrir los primeros trabajos de reparto.' },
    { id: 'gate-flat', from: 3, to: 4, cost: 120000, threshold: 120000, name: 'Entrada del piso', icon: '⌂', desc: 'Tu primer piso. Elige qué estancia reformar y monta una cocina de verdad.' },
    { id: 'gate-motor', from: 4, to: 5, cost: 900000, threshold: 1000000, name: 'Moto de 125 cc', icon: '🏍', desc: 'Abre las afueras y las rutas largas. Los seguros y el mantenimiento serán opcionales.' },
    { id: 'gate-stall', from: 5, to: 6, cost: 8000000, threshold: 8000000, name: 'Licencia de venta ambulante', icon: '▤', desc: 'Tu propio puesto, con mesa, toldo y una especialidad que puedes escoger.' },
    { id: 'gate-shop', from: 6, to: 7, cost: 60000000, threshold: 60000000, name: 'Alquiler del local', icon: '▣', desc: 'Deja el puesto en la plaza y abre una tienda de barrio.' },
    { id: 'gate-team', from: 7, to: 8, cost: 500000000, threshold: 500000000, name: 'Local grande y primer equipo', icon: '▣', desc: 'Tres zonas de venta y cinco personas para compartir el trabajo.' },
    { id: 'gate-house', from: 8, to: 9, cost: 5000000000, threshold: 5000000000, name: 'Compra de la casa', icon: '⌂', desc: 'Una casa propia con jardín, espacio para visitas y sitio para Mimi.' },
    { id: 'gate-chain', from: 9, to: 10, cost: 50000000000, threshold: 50000000000, name: 'Segundo local y franquicia', icon: '⌂', desc: 'Lleva tu marca a otros barrios. Cada local aporta sin que tengas que estar allí.' },
    { id: 'gate-company', from: 10, to: 11, cost: 1000000000000, threshold: 1000000000000, name: 'Fábrica propia', icon: '⌑', desc: 'Pasa de vender productos a fabricar y distribuir tu propia marca.' },
    { id: 'gate-dream', from: 11, to: 12, cost: 0, threshold: 50000000000000, name: 'Proyecto soñado', icon: '✳', desc: 'Has llegado a 50 T. Ya puedes decidir qué dejarle a la ciudad.' },
  ];

  const ACTIONS = [
    { id: 'ground', name: 'Buscar monedas en el suelo', short: 'BUSCAR MONEDAS', cost: 0, mpc: 1, icon: '◉', desc: 'Una moneda cada vez. Todo empieza aquí.', stage: 1 },
    { id: 'cans', name: 'Recoger latas', short: 'RECOGER LATAS', cost: 40, mpc: 2, icon: '🥫', desc: 'Hay latas por toda la plaza. Algunas dejan propina.', stage: 1 },
    { id: 'cardboard', name: 'Recoger cartón', short: 'RECOGER CARTÓN', cost: 120, mpc: 3, icon: '▤', desc: 'Una ruta de cartón paga un poco mejor.', stage: 1 },
    { id: 'flyers', name: 'Repartir folletos', short: 'REPARTIR FOLLETOS', cost: 300, mpc: 5, icon: '▧', desc: 'Un trabajo corto que te pone en contacto con el barrio.', stage: 1 },
    { id: 'windows', name: 'Limpiar parabrisas', short: 'LIMPIAR PARABRISAS', cost: 700, mpc: 8, icon: '✧', desc: 'El semáforo se pone en verde y cae alguna moneda más.', stage: 1 },
    { id: 'bags', name: 'Ayudar con maletas', short: 'AYUDAR CON MALETAS', cost: 1200, mpc: 12, icon: '▣', desc: 'La gente que llega a la estación necesita una mano.', stage: 1 },
    { id: 'guitar', name: 'Tocar la guitarra', short: 'TOCAR LA GUITARRA', cost: 2000, mpc: 18, icon: '♫', desc: 'Una canción, un corro y la primera reputación.', stage: 1, type: 'creative' },
    { id: 'statue', name: 'Estatua viviente', short: 'ESTATUA VIVIENTE', cost: 3000, mpc: 25, icon: '♙', desc: 'Te quedas quieto. La gente se queda a mirar.', stage: 1, type: 'performance' },
    { id: 'cleaning', name: 'Limpieza por horas', short: 'LIMPIAR', cost: 5000, mpc: 45, icon: '🧹', desc: 'Los primeros turnos con contrato y una paga fija.', stage: 2, type: 'service' },
    { id: 'freelance', name: 'Encargos por internet', short: 'ENCARGOS ONLINE', cost: 12000, mpc: 95, icon: '▰', desc: 'Pequeñas tareas desde casa y clientes que repiten.', stage: 2, type: 'office' },
    { id: 'delivery', name: 'Repartos en bicicleta', short: 'REPARTIR PEDIDOS', cost: 60000, mpc: 260, icon: '🚲', desc: 'Cruza el barrio comercial y completa más pedidos.', stage: 3, type: 'delivery' },
    { id: 'repair', name: 'Reparar bicicletas', short: 'REPARAR BICIS', cost: 120000, mpc: 600, icon: '⚒', desc: 'Una caja de herramientas convierte averías en trabajo.', stage: 3, type: 'repair' },
    { id: 'office', name: 'Trabajo de oficina', short: 'TRABAJAR EN LA OFICINA', cost: 350000, mpc: 1600, icon: '▤', desc: 'Tareas, llamadas y un escritorio por fin propio.', stage: 4, type: 'office' },
    { id: 'design', name: 'Diseño por encargo', short: 'DISEÑAR', cost: 750000, mpc: 3500, icon: '✳', desc: 'Ideas visuales para los comercios que conoces.', stage: 4, type: 'creative' },
    { id: 'van-route', name: 'Rutas en furgoneta', short: 'HACER RUTAS', cost: 2000000, mpc: 9000, icon: '🚐', desc: 'Lleva mercancía a las afueras y vuelve con pedidos.', stage: 5, type: 'delivery' },
    { id: 'own-stall', name: 'Atender tu puesto', short: 'ATENDER EL PUESTO', cost: 12000000, mpc: 60000, icon: '▤', desc: 'Vender bien hoy paga el alquiler de mañana.', stage: 6, type: 'business' },
    { id: 'store-shift', name: 'Gestionar la tienda', short: 'GESTIONAR TIENDA', cost: 100000000, mpc: 400000, icon: '▣', desc: 'Pedidos, clientes y caja: todo pasa por ti.', stage: 7, type: 'business' },
    { id: 'manage-team', name: 'Dirigir al equipo', short: 'DIRIGIR EL EQUIPO', cost: 900000000, mpc: 4000000, icon: '♙', desc: 'Organiza los turnos y comparte el trabajo.', stage: 8, type: 'business' },
    { id: 'consulting', name: 'Asesorar a otros negocios', short: 'ASESORAR', cost: 10000000000, mpc: 35000000, icon: '▧', desc: 'Tu experiencia ayuda a crecer a otros barrios.', stage: 9, type: 'office' },
    { id: 'franchise-work', name: 'Visitar franquicias', short: 'VISITAR LOCALES', cost: 100000000000, mpc: 350000000, icon: '⌂', desc: 'Mantén el espíritu del barrio en cada sucursal.', stage: 10, type: 'business' },
    { id: 'national-contract', name: 'Contrato nacional', short: 'CONTRATO NACIONAL', cost: 2000000000000, mpc: 8000000000, icon: '⌑', desc: 'Un acuerdo que lleva tu trabajo por todo el país.', stage: 11, type: 'office' },
    { id: 'dream-project', name: 'Construir el proyecto', short: 'CONSTRUIR EL SUEÑO', cost: 40000000000000, mpc: 16000000000, icon: '✳', desc: 'Cada clic pone una pieza en el futuro del barrio.', stage: 12, type: 'creative' },
  ];

  const FOODS = [
    { id: 'bread', name: 'Mendrugo de pan duro', short: 'Pan duro', cost: 10, energy: 5, satiety: 0, icon: '🥖', desc: '+5 de energía.' },
    { id: 'apple', name: 'Manzana', short: 'Manzana', cost: 25, energy: 8, satiety: 1, icon: '🍎', desc: '+8 energía · +1 saciedad.' },
    { id: 'napolitana', name: 'Napolitana', short: 'Napolitana', cost: 45, energy: 12, satiety: 0, icon: '🥐', desc: '+12 de energía.' },
    { id: 'cheese', name: 'Bocadillo de queso', short: 'Bocadillo de queso', cost: 60, energy: 20, satiety: 3, icon: '🥪', desc: '+20 energía · +3 saciedad.' },
    { id: 'tortilla', name: 'Bocadillo de tortilla', short: 'Bocadillo de tortilla', cost: 120, energy: 35, satiety: 5, icon: '🥪', desc: '+35 energía · +5 saciedad.' },
    { id: 'coffee', name: 'Café de máquina', short: 'Café', cost: 200, energy: 0, satiety: 0, icon: '☕', desc: 'Clic un 30 % más rentable durante 30 s.', buff: { type: 'click', mult: 1.3, duration: 30 } },
    { id: 'orange', name: 'Zumo de naranja', short: 'Zumo', cost: 250, energy: 15, satiety: 0, icon: '🍊', desc: '+15 energía y evita el próximo mareo.', guard: true },
    { id: 'menu', name: 'Menú del día barato', short: 'Menú del día', cost: 400, energy: 100, satiety: 0, icon: '🍲', desc: 'Energía completa · +10 % MPC durante 5 min.', buff: { type: 'click', mult: 1.1, duration: 300 } },
    { id: 'churros', name: 'Churros con chocolate', short: 'Churros', cost: 600, energy: 40, satiety: 0, icon: '🍫', desc: '+40 energía y ánimo durante 2 min.', buff: { type: 'mood', mult: 1.12, duration: 120 } },
    { id: 'pizza', name: 'Pizza por porciones', short: 'Pizza', cost: 900, energy: 50, satiety: 8, icon: '🍕', desc: '+50 energía · +8 saciedad.' },
    { id: 'kebab', name: 'Kebab', short: 'Kebab', cost: 1200, energy: 60, satiety: 10, icon: '🌯', desc: '+60 energía · +10 saciedad.' },
    { id: 'paella', name: 'Paella del chiringuito', short: 'Paella', cost: 2500, energy: 100, satiety: 18, icon: '🥘', desc: 'Energía completa · +20 % MPC durante 10 min.', buff: { type: 'click', mult: 1.2, duration: 600 } },
  ];

  const OBJECTS = [
    // Supervivencia en la calle
    item('tin-bank', 'Hucha de lata', 60, 1, '🐖', '+5 % de ganancias sin conexión.', 'mejoras', 0, { offline: .05 }),
    item('bottle', 'Botella reutilizable', 60, 1, '◒', 'La saciedad dura un 20 % más.', 'mejoras', 0, { satietyDrain: .8 }),
    item('cap', 'Gorra', 90, 1, '🧢', '+5 % de propinas.', 'mejoras', 0, { tips: .05 }),
    item('gloves', 'Guantes de trabajo', 100, 1, '🧤', '+50 % MPC al recoger latas y cartón.', 'mejoras', 0, { gloves: true }),
    item('sneakers', 'Zapatillas cómodas', 180, 1, '👟', 'Gasta un 10 % menos de energía por clic.', 'mejoras', 0, { clickCost: .9 }),
    item('umbrella', 'Paraguas', 200, 1, '☂', 'Anula la penalización del evento lluvia.', 'mejoras', 0, { rainShield: true }),
    item('backpack', 'Mochila', 250, 1, '🎒', '+20 de energía máxima.', 'mejoras', 0, { maxEnergy: 20 }),
    item('radio', 'Radio a pilas', 300, 1, '📻', 'Música de fondo y +3 % de reputación.', 'mejoras', 0, { repGain: .03 }),
    item('ledger', 'Cuaderno de cuentas', 350, 1, '▤', 'Desbloquea estadísticas e historial de ingresos.', 'mejoras', 0, { ledger: true }),
    item('jacket', 'Chaqueta de segunda mano', 400, 1, '🧥', 'Desbloquea los clics útiles de las noches frías.', 'mejoras', 0, { nightClicks: true }),
    item('cheap-watch', 'Reloj barato', 450, 1, '◷', 'Muestra el ciclo de día y noche.', 'mejoras', 0, { watch: true }),
    item('sleeping-bag', 'Saco de dormir', 500, 1, '🛌', 'Dormir en la calle recupera 30 de energía.', 'mejoras', 0, { sleep: 30 }),
    item('neighborhood-map', 'Mapa del barrio', 600, 1, '🗺', 'Revela la primera zona del mapa.', 'mejoras', 0, { map: true }),
    item('cart', 'Carrito encontrado', 800, 1, '🛒', 'Latas y cartón valen el doble.', 'mejoras', 0, { cart: true }),
    item('library-card', 'Tarjeta de la biblioteca', 0, 1, '▤', 'Gratis tras 100 clics: ducha y wifi; abre Lectura.', 'mejoras', 0, { library: true }, { requiresClicks: 100 }),
    // Habitación alquilada
    item('mattress', 'Colchón en el suelo', 500, 2, '▰', 'Dormir recupera 60 de energía.', 'mejoras', 3, { sleep: 60 }),
    item('bed', 'Cama sencilla', 1200, 2, '🛏', 'Dormir recupera toda la energía.', 'mejoras', 6, { sleepFull: true }),
    item('pillow', 'Almohada buena', 300, 2, '▱', 'Se acaba el mareo por falta de sueño.', 'mejoras', 2, { guard: true }),
    item('blanket', 'Manta gruesa', 250, 2, '▰', 'Sin penalización en noches frías.', 'mejoras', 2, { coldShield: true }),
    item('nightstand', 'Mesilla de noche', 600, 2, '▣', 'Guarda un alimento para la madrugada.', 'mejoras', 2, { foodStorage: true }),
    item('alarm', 'Despertador', 150, 2, '◷', 'Empiezas el día con +10 de energía.', 'mejoras', 1, { morningEnergy: 10 }),
    item('curtains', 'Cortinas opacas', 350, 2, '▥', 'La siesta recupera el doble.', 'mejoras', 2, { nap: 2 }),
    item('earplugs', 'Antifaz y tapones', 120, 2, '◉', 'Ignora los ruidos del evento vecinos.', 'mejoras', 1, { noiseShield: true }),
    item('rent-negotiation', 'Negociar el alquiler', 1000, 2, '⇄', '−15 % de alquiler. Requiere 10 de reputación.', 'mejoras', 0, { rentDiscount: .15 }, { requiresRep: 10 }),
    item('camp-stove', 'Hornillo de camping', 400, 2, '♨', 'Cocinar comida simple cuesta un 30 % menos.', 'mejoras', 2, { recipesCost: .7 }),
    item('pan-set', 'Cazuela y sartén', 250, 2, '♨', 'Desbloquea cuatro recetas básicas.', 'mejoras', 1, { recipes: true }),
    item('mini-fridge', 'Nevera pequeña', 900, 2, '▣', 'Los alimentos duran el doble.', 'mejoras', 3, { foodFresh: true }),
    item('old-microwave', 'Microondas usado', 700, 2, '▣', 'Recalienta comida y recupera 5 de energía.', 'mejoras', 2, { reheat: true }),
    item('plates', 'Cubiertos y platos', 150, 2, '◒', 'Bonus de ánimo al comer en casa.', 'mejoras', 1, { mood: .02 }),
    item('fold-table', 'Mesa plegable', 350, 2, '▤', 'Comer sentado: +5 de saciedad.', 'mejoras', 2, { sitSatiety: 5 }),
    item('chair', 'Silla', 200, 2, '♧', 'Desbloquea la actividad de estudiar.', 'mejoras', 1, { study: true }),
    item('basic-phone', 'Móvil básico', 500, 2, '▯', 'Recibe notificaciones de trabajos temporales.', 'mejoras', 2, { phone: true }),
    item('charger', 'Cargador y batería extra', 100, 2, '⌁', 'Más tiempo de móvil sin conexión.', 'mejoras', 1, { phoneBattery: true }),
    item('small-tv', 'Tele pequeña de segunda mano', 1000, 2, '▣', 'Descanso mental: energía máxima +10.', 'mejoras', 3, { maxEnergy: 10 }),
    item('speaker', 'Altavoz bluetooth', 400, 2, '♫', '+5 % de reputación pasiva.', 'mejoras', 2, { repGain: .05 }),
    item('bookshelf', 'Estantería con libros', 450, 2, '▤', 'Desbloquea la habilidad de lectura.', 'mejoras', 2, { reading: true }),
    item('small-desk', 'Escritorio pequeño', 800, 2, '▰', 'Desbloquea trabajos de oficina por horas.', 'mejoras', 3, { officeJobs: true }),
    item('refurb-laptop', 'Portátil reacondicionado', 2000, 2, '▰', 'Abre el trabajo freelance.', 'mejoras', 4, { freelance: true }),
    item('headphones', 'Auriculares', 200, 2, '♫', 'Música de concentración: +5 % MPC.', 'mejoras', 1, { clickMult: 1.05 }),
    item('table-lamp', 'Lámpara de mesa', 150, 2, '◉', 'Clics útiles de noche.', 'mejoras', 1, { nightClicks: true }),
    item('rug', 'Alfombra', 300, 2, '▰', 'Más comodidad en invierno.', 'mejoras', 2, { winterComfort: 1 }),
    item('poster', 'Póster en la pared', 80, 2, '▧', 'Cambia el fondo de la escena.', 'mejoras', 1, { scenePoster: true }),
    item('cactus', 'Cactus', 60, 2, '♧', 'Primera planta: no se muere.', 'mejoras', 1, { plant: true }),
    item('houseplants', 'Plantas de interior', 200, 2, '♧', 'Más comodidad con el tiempo.', 'mejoras', 2, { plant: true }),
    item('mirror', 'Espejo', 180, 2, '▯', 'Aumenta la reputación al salir de casa.', 'mejoras', 1, { repGain: .03 }),
    item('family-photo', 'Foto de familia', 100, 2, '▧', 'Evento recuerdos con bonus aleatorio.', 'mejoras', 1, { luckyEvents: .02 }),
    item('badge-collection', 'Colección de chapas', 120, 2, '✳', 'Logro oculto y bonus de suerte.', 'mejoras', 1, { luckyEvents: .02 }),
    // Piso pequeño: edificio y estancias
    item('fibre', 'Fibra óptica', 5000, 4, '⌁', '+10 % MPS en trabajos online.', 'mejoras', 0, { onlineMps: .1 }),
    item('double-windows', 'Ventanas con doble cristal', 12000, 4, '▥', '+8 de comodidad y menos gasto de calefacción.', 'mejoras', 8, { energyRegen: .04 }),
    item('insulation', 'Aislamiento térmico', 15000, 4, '▰', '+6 de comodidad y −20 % de facturas.', 'mejoras', 6, { bills: .8 }),
    item('intercom', 'Portero automático', 6000, 4, '▯', 'Los repartos llegan solos.', 'mejoras', 1, { deliveries: true }),
    item('home-automation', 'Domótica básica', 25000, 4, '⌁', 'Luces y persianas: +5 % de energía.', 'mejoras', 2, { energyRegen: .05 }),
    item('solar-roof', 'Paneles solares en la azotea', 90000, 4, '☼', 'Elimina la factura de luz y da +2 k MPS.', 'mejoras', 3, { flatMps: 2000, bills: 0 }),
    item('smart-mailbox', 'Buzón inteligente', 4000, 4, '▤', 'Paquetes de trabajo extra.', 'mejoras', 1, { deliveries: true }),
    item('used-sofa', 'Sofá usado', 2500, 4, '▰', 'Descansar en el sofá recupera 30 de energía.', 'mejoras', 8, { sleep: 30 }),
    item('sofa-bed', 'Sofá cama', 5000, 4, '▰', 'Los invitados pueden quedarse.', 'mejoras', 10, { guests: true }),
    item('coffee-table', 'Mesa de centro', 1200, 4, '▤', 'Un sitio para el snack con bonus.', 'mejoras', 4, { sitSatiety: 5 }),
    item('tv32', 'Televisión de 32 pulgadas', 3000, 4, '▣', 'Ver series sube el ánimo.', 'mejoras', 6, { mood: .03 }),
    item('tv55', 'Televisión de 55 pulgadas', 9000, 4, '▣', '+10 % de ánimo y cine en casa.', 'mejoras', 10, { mood: .1 }),
    item('console', 'Consola', 6000, 4, '▰', 'Minijuego de descanso con recompensa.', 'mejoras', 8, { mood: .05 }),
    item('big-shelf', 'Estantería grande', 2000, 4, '▤', 'Más espacio de decoración.', 'mejoras', 5, { comfort: 1 }),
    item('big-rug', 'Alfombra grande', 1500, 4, '▰', 'Evita ruido de vecinos.', 'mejoras', 5, { noiseShield: true }),
    item('floor-lamp', 'Lámpara de pie', 900, 4, '◉', 'Ambiente cálido: +3 % MPC.', 'mejoras', 3, { clickMult: 1.03 }),
    item('record-player', 'Tocadiscos y vinilos', 4000, 4, '♫', 'Música relajante: +10 % de regeneración.', 'mejoras', 6, { energyRegen: .1 }),
    item('air-conditioning', 'Aire acondicionado', 8000, 4, '❋', 'Sin penalización en verano.', 'mejoras', 8, { heatShield: true }),
    item('fridge', 'Nevera grande', 3500, 4, '▣', 'Almacén de 20 alimentos.', 'mejoras', 8, { foodFresh: true }),
    item('stovetop', 'Fogones', 2000, 4, '♨', 'Cocina recetas intermedias.', 'mejoras', 5, { recipes: true }),
    item('oven', 'Horno', 3000, 4, '▣', 'Desbloquea las recetas al horno.', 'mejoras', 6, { recipes: true }),
    item('new-microwave', 'Microondas nuevo', 800, 4, '▣', 'Recalienta sin pérdida de energía.', 'mejoras', 2, { reheat: true }),
    item('dishwasher', 'Lavavajillas', 4000, 4, '▣', 'Ahorras tiempo: +5 % MPC.', 'mejoras', 6, { clickMult: 1.05 }),
    item('coffee-maker', 'Cafetera', 700, 4, '☕', 'Café en casa cada mañana.', 'mejoras', 3, { morningEnergy: 5 }),
    item('toaster', 'Tostadora', 200, 4, '▣', 'Desayuno rápido y tostada con tomate.', 'mejoras', 1, { recipes: true }),
    item('blender', 'Batidora', 400, 4, '▣', 'Desbloquea batidos con bonus.', 'mejoras', 2, { recipes: true }),
    item('food-robot', 'Robot de cocina', 5000, 4, '▣', 'Cocinar tarda la mitad.', 'mejoras', 6, { recipeSpeed: .5 }),
    item('air-fryer', 'Freidora de aire', 1200, 4, '▣', 'Recetas fritas más saludables.', 'mejoras', 3, { recipes: true }),
    item('good-knives', 'Cuchillos buenos', 600, 4, '♨', 'Cocinar con +10 % de efecto.', 'mejoras', 2, { foodEffect: .1 }),
    item('kitchen-table', 'Mesa de cocina con taburetes', 1800, 4, '▤', 'Comer en casa da +15 de saciedad.', 'mejoras', 5, { sitSatiety: 15 }),
    item('double-bed', 'Cama de matrimonio', 4000, 4, '🛏', 'Dormir recupera el 120 % de energía.', 'mejoras', 10, { sleepFull: true, energyRegen: .04 }),
    item('memory-mattress', 'Colchón viscoelástico', 5000, 4, '▰', 'Sin cansancio acumulado.', 'mejoras', 12, { energyRegen: .06 }),
    item('wardrobe', 'Armario empotrado', 3000, 4, '▣', 'Desbloquea ropa y estilo.', 'mejoras', 6, { style: true }),
    item('good-shirt', 'Camisa buena', 1200, 4, '👔', 'Trabajos de evento y reputación +3 %.', 'mejoras', 1, { repGain: .03 }),
    item('camera', 'Cámara de fotos', 12000, 4, '◉', 'Abre trabajos de fotografía.', 'mejoras', 1, { creativity: true }),
    item('work-desk', 'Escritorio de trabajo', 2000, 4, '▰', 'Abre trabajos remotos más caros.', 'mejoras', 5, { onlineMps: .05 }),
    item('ergonomic-chair', 'Silla ergonómica', 1800, 4, '♧', '+10 % MPC en trabajo de oficina.', 'mejoras', 5, { officeClick: .1 }),
    item('extra-monitor', 'Monitor extra', 1500, 4, '▣', 'Dobla las tareas en paralelo.', 'mejoras', 3, { onlineMps: .05 }),
    item('powerful-computer', 'Ordenador potente', 6000, 4, '▰', 'Abre trabajos de diseño y programación.', 'mejoras', 6, { onlineMps: .1 }),
    item('electric-blinds', 'Persianas eléctricas', 1200, 4, '▥', 'Puedes dormir hasta más tarde.', 'mejoras', 3, { sleepFull: true }),
    item('reading-light', 'Luz de lectura', 300, 4, '◉', 'La lectura da más experiencia.', 'mejoras', 2, { readingXp: .1 }),
    item('smart-speaker', 'Altavoz inteligente', 600, 4, '♫', 'Alarmas y recordatorios de misiones.', 'mejoras', 2, { missionBonus: .02 }),
    item('shower', 'Ducha con mampara', 3000, 4, '▥', 'Empiezas el día con +10 de ánimo.', 'mejoras', 6, { morningEnergy: 10 }),
    item('water-heater', 'Calentador de agua', 2000, 4, '♨', 'Duchas calientes sin límite.', 'mejoras', 5, { energyRegen: .03 }),
    item('bath-sink', 'Lavabo con mueble', 1200, 4, '▣', 'Más espacio de almacenaje.', 'mejoras', 3, { foodStorage: true }),
    item('big-mirror', 'Espejo grande', 500, 4, '▯', 'Sube la reputación al salir.', 'mejoras', 2, { repGain: .05 }),
    item('washer', 'Lavadora', 3500, 4, '▣', 'Ropa limpia: +5 % de reputación.', 'mejoras', 6, { repGain: .05 }),
    item('dryer', 'Secadora', 3000, 4, '▣', 'Sin esperar el tendido.', 'mejoras', 5, { comfort: 1 }),
    item('bathtub', 'Bañera', 5000, 4, '▰', 'Un baño relajante recupera toda la energía.', 'mejoras', 9, { sleepFull: true }),
    item('heated-towel', 'Toallero térmico', 900, 4, '▤', 'Más comodidad en invierno.', 'mejoras', 3, { winterComfort: 1 }),
    item('flower-pots', 'Macetas con flores', 300, 4, '♧', 'Atrae pájaros y bonus de ánimo.', 'mejoras', 2, { mood: .02, plant: true }),
    item('balcony-table', 'Mesa y dos sillas', 800, 4, '▤', 'Comer fuera con +10 de saciedad.', 'mejoras', 3, { sitSatiety: 10 }),
    item('urban-garden', 'Huerto urbano', 2000, 4, '♧', 'Produce verduras para recetas.', 'mejoras', 4, { garden: true }),
    item('small-bbq', 'Barbacoa pequeña', 1500, 4, '♨', 'Desbloquea eventos de reunión.', 'mejoras', 3, { gatherings: true }),
    item('awning', 'Toldo', 1200, 4, '▰', 'Protege de lluvia y sol.', 'mejoras', 3, { rainShield: true, heatShield: true }),
    item('clothesline', 'Tendedero', 200, 4, '⌁', 'Ropa gratis al sol.', 'mejoras', 1, { comfort: 1 }),
    item('storage-shelves', 'Estanterías del trastero', 600, 4, '▤', 'Más capacidad de almacén.', 'mejoras', 2, { foodStorage: true }),
    item('toolbox', 'Caja de herramientas', 700, 4, '▣', 'Desbloquea la habilidad de bricolaje.', 'mejoras', 2, { bricolage: true }),
    item('workshop', 'Taller en el trastero', 4000, 4, '⚒', 'Repara bicicletas para vender.', 'mejoras', 5, { mechanic: true }),
    item('guest-mattress', 'Colchón de invitados', 900, 4, '▰', 'Desbloquea visitas de la familia.', 'mejoras', 2, { guests: true }),
    // Transporte y barrios
    item('walking-shoes', 'Zapatillas de caminar', 500, 1, '👟', 'El alcance a pie aumenta un 20 %.', 'transporte', 0, { travel: 1.2 }),
    item('bus-pass', 'Abono de autobús', 1000, 1, '▤', 'Abre dos barrios sin gastar energía.', 'transporte', 0, { bus: true }),
    item('used-scooter', 'Patinete de segunda mano', 2500, 1, '🛴', 'Alcance doble y primeros trabajos de mensajería.', 'transporte', 0, { travel: 2 }),
    item('bus-map', 'Mapa de líneas de autobús', 400, 1, '🗺', 'Muestra todas las rutas de autobús.', 'transporte', 0, { map: true }),
    item('bike-lock', 'Candado de bicicleta', 800, 3, '🔒', 'Evita el robo de la bici.', 'transporte', 0, { bikeLock: true }),
    item('bike-lights', 'Luces delantera y trasera', 600, 3, '☼', 'Desbloquea trabajos nocturnos.', 'transporte', 0, { nightWork: true }),
    item('bike-basket', 'Cesta delantera', 700, 3, '▤', 'Reparto con dos pedidos más.', 'transporte', 0, { orders: 2 }),
    item('bike-helmet', 'Casco', 1000, 3, '⛑', 'Reduce un 30 % el riesgo de accidente.', 'transporte', 0, { safety: .3 }),
    item('bike-bell', 'Timbre', 100, 3, '◉', 'Desbloquea el evento peatones simpáticos.', 'transporte', 0, { luckyEvents: .02 }),
    item('mudguards', 'Guardabarros', 500, 3, '▰', 'Reduce a la mitad la penalización por lluvia.', 'transporte', 0, { rainShield: true }),
    item('panniers', 'Alforjas', 2000, 3, '▤', 'Capacidad de reparto +4 pedidos.', 'transporte', 0, { orders: 4 }),
    item('repair-kit', 'Bomba y kit de parches', 400, 3, '⚒', 'Un pinchazo dura cinco segundos, no treinta.', 'transporte', 0, { punctureShield: true }),
    item('bike-gears', 'Cambio de marchas', 3000, 3, '⌁', 'Velocidad de reparto +25 %.', 'transporte', 0, { travel: 1.25 }),
    item('road-bike', 'Bici de carretera', 12000, 3, '🚲', 'Recorres el doble de zonas por hora.', 'transporte', 0, { travel: 2 }),
    item('electric-bike', 'Bicicleta eléctrica', 40000, 3, '⚡', 'Sin gasto de energía por trayecto.', 'transporte', 0, { travelNoEnergy: true }),
    item('cargo-bike', 'Bici de carga', 60000, 3, '🚲', 'Reparto con diez pedidos más.', 'transporte', 0, { orders: 10 }),
    item('bike-trailer', 'Remolque para bici', 20000, 3, '▤', 'Lleva más mercancía al mercadillo.', 'transporte', 0, { orders: 8 }),
    item('bike-parking', 'Aparcamiento fijo para bici', 3000, 3, '⌂', 'Sin riesgo de robo en casa.', 'transporte', 0, { bikeLock: true }),
    item('motor-license', 'Carné de moto', 40000, 5, '▧', 'Requisito para motos grandes.', 'transporte', 0, { motorLicense: true }),
    item('integral-helmet', 'Casco integral', 15000, 5, '⛑', 'Reduce un 50 % el riesgo de accidente.', 'transporte', 0, { safety: .5 }),
    item('motor-jacket', 'Chaqueta de moto', 20000, 5, '🧥', 'Sin penalización por frío en ruta.', 'transporte', 0, { coldShield: true }),
    item('electric-scooter', 'Scooter eléctrico', 1200000, 5, '⚡', 'Sin gasolina y abre el trabajo nocturno.', 'transporte', 0, { nightWork: true }),
    item('top-case', 'Top case', 25000, 5, '▣', 'Reparto con seis pedidos más.', 'transporte', 0, { orders: 6 }),
    item('delivery-motorbike', 'Moto de reparto', 1500000, 5, '🏍', 'Abre los trabajos premium de mensajería.', 'transporte', 0, { premiumDelivery: true }),
    item('car-license', 'Carné de coche', 80000, 5, '▧', 'Requisito para coche y furgoneta.', 'transporte', 0, { carLicense: true }),
    item('old-van', 'Furgoneta vieja', 2000000, 5, '🚐', 'Abre el polígono y los trabajos de transporte.', 'transporte', 0, { logistics: true }),
    item('used-car', 'Coche usado', 3000000, 5, '🚙', 'Barrios lejanos y +30 % MPS por distancia.', 'transporte', 0, { mpsMult: 1.3 }),
    item('car-insurance', 'Seguro a todo riesgo', 80000, 5, '▤', 'Anula averías y robos durante un ciclo.', 'transporte', 0, { safety: .5 }),
    item('delivery-van', 'Furgoneta de reparto', 12000000, 5, '🚐', 'Entrega mercancía y trabaja con proveedores.', 'transporte', 0, { logistics: true }),
    item('small-truck', 'Camión pequeño', 80000000, 5, '🚚', 'Abre la logística para las cadenas.', 'transporte', 0, { logistics: true }),
    item('train-pass', 'Abono de tren', 2000000, 5, '🚆', 'Viaja a ciudades cercanas.', 'transporte', 0, { travel: 2 }),
    item('passport', 'Pasaporte', 20000, 5, '▤', 'Requisito para viajar al extranjero.', 'transporte', 0, { passport: true }),
    item('small-boat', 'Barco pequeño', 1000000000, 9, '⛵', 'Abre el puerto y la costa.', 'transporte', 0, { boat: true }),
    item('plane', 'Avioneta', 20000000000, 10, '✈', 'Entregas a distancia y viajes rápidos.', 'transporte', 0, { travel: 5 }),
    item('balloon', 'Globo aerostático', 200000000000, 10, '🎈', 'Logro oculto y vista del mapa entero.', 'transporte', 0, { map: true }),
    // Negocios, cadena y casa
    item('market-table', 'Mesa y toldo del puesto', 200000, 6, '▤', 'Tu escena de mercadillo empieza a tomar forma.', 'negocio', 0, { business: true }),
    item('scale-bags', 'Balanza y bolsas', 50000, 6, '⚖', 'Vende por peso.', 'negocio', 0, { sales: .05 }),
    item('painted-sign', 'Cartel pintado', 80000, 6, '▧', '+10 % de clientes en el puesto.', 'negocio', 0, { sales: .1 }),
    item('cash-box', 'Caja con cambio', 100000, 6, '▣', 'Evita errores de cobro.', 'negocio', 0, { sales: .03 }),
    item('local-supplier', 'Proveedor local', 400000, 6, '▧', 'Los productos cuestan un 15 % menos.', 'negocio', 0, { discounts: .15 }),
    item('first-helper', 'Primer ayudante', 1000000, 6, '♙', 'El puesto funciona aunque no estés.', 'negocio', 0, { business: true, mpsMult: 1.08 }),
    item('rolling-cart', 'Carrito con ruedas', 300000, 6, '🛒', 'Montas el puesto en un clic.', 'negocio', 0, { business: true }),
    item('loyal-customers', 'Cartera de clientes fijos', 600000, 6, '♧', 'Ingresos estables: +5 % MPS.', 'negocio', 0, { mpsMult: 1.05 }),
    item('shop-rent', 'Mostrador', 3000000, 7, '▤', 'Capacidad para atender a dos clientes.', 'negocio', 0, { sales: .1 }),
    item('shop-shelves', 'Estanterías', 4000000, 7, '▤', 'Más productos a la vista.', 'negocio', 0, { sales: .08 }),
    item('register', 'Caja registradora', 2000000, 7, '▣', 'Ventas automáticas: +10 % MPS.', 'negocio', 0, { mpsMult: 1.1 }),
    item('shop-window', 'Escaparate', 5000000, 7, '▥', 'Atrae a clientes de paso.', 'negocio', 0, { sales: .15 }),
    item('neon-sign', 'Rótulo luminoso', 6000000, 7, '✳', 'Reputación +10 %.', 'negocio', 0, { repGain: .1 }),
    item('shop-warehouse', 'Almacén trasero', 8000000, 7, '▣', 'Guarda stock para los eventos.', 'negocio', 0, { sales: .1 }),
    item('card-terminal', 'Terminal de pago con tarjeta', 1500000, 7, '▯', '+20 % de ventas.', 'negocio', 0, { sales: .2 }),
    item('shop-website', 'Web de la tienda', 10000000, 7, '▱', 'Pedidos online: +15 % MPS.', 'negocio', 0, { onlineMps: .15 }),
    item('loyalty-card', 'Carta de fidelidad', 4000000, 7, '▤', 'Los clientes repiten y gastan más.', 'negocio', 0, { sales: .15 }),
    item('second-employee', 'Segundo empleado', 12000000, 7, '♙', 'La tienda abre mañana y tarde.', 'negocio', 0, { mpsMult: 1.12 }),
    item('big-premises', 'Local grande', 500000000, 8, '▣', 'Tres zonas de venta.', 'negocio', 0, { sales: .2 }),
    item('team-five', 'Equipo de cinco personas', 80000000, 8, '♙', 'Mejora un 20 % el MPS de empleados.', 'negocio', 0, { mpsMult: 1.2 }),
    item('uniforms', 'Uniformes', 20000000, 8, '♙', 'Reputación +8 %.', 'negocio', 0, { repGain: .08 }),
    item('inventory-software', 'Software de inventario', 60000000, 8, '▣', 'Sin roturas de stock.', 'negocio', 0, { mpsMult: 1.1 }),
    item('local-ad', 'Campaña de publicidad local', 150000000, 8, '▧', 'Eventos de clientes nuevos.', 'negocio', 0, { sales: .2, repGain: .05 }),
    item('training', 'Formación de empleados', 90000000, 8, '▤', 'La plantilla trabaja un 20 % más rápido.', 'negocio', 0, { mpsMult: 1.2 }),
    item('national-supplier', 'Proveedor nacional', 250000000, 8, '▧', 'Productos un 25 % más baratos.', 'negocio', 0, { discounts: .25 }),
    item('registered-brand', 'Marca registrada', 80000000000, 10, '✳', 'Protege tu reputación.', 'negocio', 0, { repGain: .15 }),
    item('central-warehouse', 'Almacén central', 200000000000, 10, '▣', 'Logística entre locales.', 'negocio', 0, { mpsMult: 1.2 }),
    item('marketing-dept', 'Departamento de marketing', 400000000000, 10, '▧', 'Eventos de lanzamiento.', 'negocio', 0, { sales: .25, repGain: .1 }),
    item('own-factory', 'Fábrica propia', 1000000000000, 11, '⌑', 'Producto de marca propia.', 'negocio', 0, { mpsMult: 1.3 }),
    item('head-office', 'Oficinas centrales', 2000000000000, 11, '⌑', 'La escena del rascacielos se abre.', 'negocio', 0, { mpsMult: 1.2 }),
    item('stock-exchange', 'Bolsa de valores', 5000000000000, 11, '▥', 'Inversión pasiva y dividendos.', 'negocio', 0, { mpsMult: 1.15 }),
    item('foundation', 'Fundación y mecenazgo', 10000000000000, 11, '✳', 'Impacto social y +20 % de reputación.', 'negocio', 0, { repGain: .2, mpsMult: 1.1 }),
    item('research', 'Investigación y desarrollo', 20000000000000, 11, '⌁', 'Nuevas mejoras de producto.', 'negocio', 0, { mpsMult: 1.25 }),
    item('home-renovation', 'Reforma integral', 800000000, 9, '⚒', 'Comodidad base +20.', 'mejoras', 20),
    item('designer-kitchen', 'Cocina de diseño', 300000000, 9, '♨', 'Recetas avanzadas y +10 de comodidad.', 'mejoras', 10, { foodEffect: .2 }),
    item('fireplace', 'Salón con chimenea', 250000000, 9, '♨', '+15 de comodidad y bonus de invierno.', 'mejoras', 15, { winterComfort: 1 }),
    item('master-bedroom', 'Dormitorio principal', 200000000, 9, '🛏', 'Energía máxima +30.', 'mejoras', 12, { maxEnergy: 30 }),
    item('guest-room', 'Cuarto de invitados', 150000000, 9, '🛏', 'Las visitas duran más.', 'mejoras', 8, { guests: true }),
    item('home-office', 'Despacho en casa', 180000000, 9, '▰', 'Trabajos remotos premium.', 'mejoras', 10, { onlineMps: .15 }),
    item('garage', 'Garaje', 400000000, 9, '▣', 'Guarda tres vehículos sin riesgo.', 'mejoras', 4, { vehicleSafe: true }),
    item('wine-cellar', 'Bodega', 120000000, 9, '▣', 'Conservas y eventos con bonus.', 'mejoras', 6, { foodEffect: .1 }),
    item('home-cinema', 'Sala de cine en casa', 350000000, 9, '▣', 'Descanso mental completo.', 'mejoras', 8, { mood: .15 }),
    item('lawn', 'Césped', 50000000, 9, '♧', 'Escena de jardín y +5 de comodidad.', 'mejoras', 5, { garden: true }),
    item('big-garden', 'Huerto grande', 120000000, 9, '♧', 'Verduras para todas las recetas.', 'mejoras', 8, { garden: true }),
    item('fruit-trees', 'Árboles frutales', 150000000, 9, '♧', 'Fruta gratis cada día.', 'mejoras', 8, { garden: true, foodEffect: .05 }),
    item('chicken-coop', 'Gallinero', 40000000, 9, '♧', 'Huevos frescos para recetas.', 'mejoras', 4, { garden: true }),
    item('greenhouse', 'Invernadero', 200000000, 9, '▥', 'Cultivo durante todo el año.', 'mejoras', 8, { garden: true }),
    item('home-solar', 'Placas solares de la casa', 400000000, 9, '☼', 'Sin factura de luz.', 'mejoras', 8, { bills: 0, mpsMult: 1.05 }),
    item('rainwater', 'Recogida de agua de lluvia', 80000000, 9, '☂', 'Riego gratis para el huerto.', 'mejoras', 4, { garden: true }),
    item('compost', 'Compostaje', 20000000, 9, '♧', 'Abono para el huerto.', 'mejoras', 2, { garden: true }),
    item('pool', 'Piscina', 600000000, 9, '◒', 'Verano sin penalización y +20 de comodidad.', 'mejoras', 20, { heatShield: true }),
    item('zen-garden', 'Jardín zen', 90000000, 9, '♧', 'Meditación con bonus de energía.', 'mejoras', 8, { energyRegen: .15 }),
  ];

  const CLICK_UPGRADES = [
    { id: 'nimble-fingers', name: 'Dedos ágiles', cost: 100, stage: 1, mult: 2, desc: 'MPC ×2.' },
    { id: 'strong-hands', name: 'Manos fuertes', cost: 500, stage: 1, mult: 2, desc: 'MPC ×2.' },
    { id: 'good-rhythm', name: 'Buen ritmo', cost: 2000, stage: 1, mult: 2, desc: 'MPC ×2.' },
    { id: 'double-click', name: 'Clic doble', cost: 8000, stage: 2, desc: 'Cada décimo clic vale el doble.' },
    { id: 'lucky-click', name: 'Clic de la suerte', cost: 20000, stage: 2, desc: '1 % de probabilidad de ×10.' },
    { id: 'practice-shortcut', name: 'Atajo de práctica', cost: 50000, stage: 3, desc: 'El MPC suma el 1 % del MPS.' },
    { id: 'pro-click', name: 'Clic profesional', cost: 200000, stage: 4, mult: 2, desc: 'MPC ×2.' },
    { id: 'chain-click', name: 'Clic en cadena', cost: 1000000, stage: 5, desc: 'Cinco clics seguidos: +1 % acumulable.' },
    { id: 'artist-hands', name: 'Manos de artista', cost: 5000000, stage: 6, mult: 2, desc: 'MPC ×2.' },
    { id: 'team-click', name: 'Clic en equipo', cost: 30000000, stage: 7, desc: 'El MPC suma el 2 % del MPS.' },
    { id: 'rhythm-master', name: 'Maestro del ritmo', cost: 200000000, stage: 8, mult: 2, desc: 'MPC ×2.' },
    { id: 'magic-click', name: 'Clic mágico', cost: 1000000000, stage: 9, desc: 'Cada clic genera 1 s de MPS.' },
    { id: 'legendary-click', name: 'Clic legendario', cost: 10000000000, stage: 10, mult: 3, desc: 'MPC ×3.' },
    { id: 'fortune-click', name: 'Clic de la fortuna', cost: 100000000000, stage: 10, desc: '5 % de probabilidad de ×100.' },
    { id: 'infinite-click', name: 'Clic infinito', cost: 1000000000000, stage: 11, desc: 'El MPC suma el 5 % del MPS.' },
  ];

  const BODY_UPGRADES = [
    { id: 'big-stomach', name: 'Estómago más grande', cost: 1000, stage: 1, desc: 'Saciedad máxima +20.', effect: { maxSatiety: 20 } },
    { id: 'slow-metabolism', name: 'Metabolismo lento', cost: 3000, stage: 1, desc: 'La saciedad baja un 20 % más despacio.', effect: { satietyDrain: .8 } },
    { id: 'short-nap', name: 'Siesta de 20 minutos', cost: 800, stage: 1, desc: 'Recuperas 25 de energía una vez al día.', effect: { nap: 25 } },
    { id: 'vitamins', name: 'Vitaminas', cost: 2000, stage: 1, desc: 'Energía máxima +15.', effect: { maxEnergy: 15 } },
    { id: 'morning-run', name: 'Correr por las mañanas', cost: 4000, stage: 1, desc: '−10 % de gasto de energía.', effect: { clickCost: .9 } },
    { id: 'gym', name: 'Gimnasio', cost: 25000, stage: 2, desc: 'Energía máxima +40.', effect: { maxEnergy: 40 } },
    { id: 'trainer', name: 'Entrenador personal', cost: 120000, stage: 3, desc: '−20 % de gasto de energía.', effect: { clickCost: .8 } },
    { id: 'yoga', name: 'Yoga', cost: 15000, stage: 2, desc: 'La energía se regenera un 15 % más rápido.', effect: { energyRegen: .15 } },
    { id: 'balanced-diet', name: 'Dieta equilibrada', cost: 30000, stage: 2, desc: 'Los alimentos dan un 20 % más de efecto.', effect: { foodEffect: .2 } },
    { id: 'medical-check', name: 'Chequeo médico', cost: 40000, stage: 2, desc: 'Evita los eventos de enfermedad.', effect: { illnessShield: true } },
    { id: 'health-insurance', name: 'Seguro de salud', cost: 200000, stage: 4, desc: 'Cubre gastos de enfermedad.', effect: { illnessShield: true } },
    { id: 'deep-sleep', name: 'Sueño reparador', cost: 500000, stage: 4, desc: 'Dormir da el doble de energía.', effect: { sleepDouble: true } },
    { id: 'meditation', name: 'Meditación', cost: 1000000, stage: 5, desc: 'Energía completa con un clic al día.', effect: { meditation: true } },
    { id: 'weekend-retreat', name: 'Retiro de fin de semana', cost: 50000000, stage: 7, desc: 'Reinicia el cansancio acumulado.', effect: { energyRegen: .2 } },
  ];

  const GENERATORS = [
    { id: 'tips', name: 'Vaso de propinas', cost: 15, mps: .1, icon: '🥤', stage: 1, upgrades: ['Vaso más grande', 'Vaso con tapa', 'Vaso con cartel'] },
    { id: 'sign', name: 'Cartel «Ayúdame»', cost: 100, mps: 1, icon: '▧', stage: 1, upgrades: ['Letras claras', 'Cartel con dibujo', 'Cartel luminoso'] },
    { id: 'dog', name: 'Perro simpático', cost: 1100, mps: 8, icon: '🐕', stage: 1, upgrades: ['Pañuelo', 'Trucos', 'Perro de titulares'] },
    { id: 'corner-friend', name: 'Colega de la esquina', cost: 12000, mps: 47, icon: '♙', stage: 1, upgrades: ['Turnos compartidos', 'Esquina dividida', 'Cooperativa de la calle'] },
    { id: 'leaflets', name: 'Reparto de folletos', cost: 130000, mps: 260, icon: '▤', stage: 1, upgrades: ['Mejor papel', 'Zona fija', 'Folletos con cupón'] },
    { id: 'bike-messenger', name: 'Mensajero en bici', cost: 1400000, mps: 1400, icon: '🚲', stage: 3, upgrades: ['Mochila térmica', 'Ruta optimizada', 'Flota de bicis'] },
    { id: 'dishwasher', name: 'Friegaplatos en un bar', cost: 20000000, mps: 7800, icon: '♨', stage: 4, upgrades: ['Guantes de goma', 'Máquina de lavar', 'Turno doble'] },
    { id: 'waiter', name: 'Camarero', cost: 330000000, mps: 44000, icon: '☕', stage: 6, upgrades: ['Delantal limpio', 'Propinas con tarjeta', 'Camarero estrella'] },
    { id: 'cook', name: 'Cocinero', cost: 5100000000, mps: 260000, icon: '♨', stage: 6, upgrades: ['Cuchillo afilado', 'Receta propia', 'Plato de la casa'] },
    { id: 'moto-delivery', name: 'Repartidor en moto', cost: 75000000000, mps: 1600000, icon: '🏍', stage: 5, upgrades: ['Casco con radio', 'App de pedidos', 'Zona exclusiva'] },
    { id: 'shop-assistant', name: 'Dependiente de tienda', cost: 1000000000000, mps: 10000000, icon: '▣', stage: 7, upgrades: ['Uniforme', 'Cliente fiel', 'Venta cruzada'] },
    { id: 'van-driver', name: 'Conductor de furgoneta', cost: 14000000000000, mps: 65000000, icon: '🚐', stage: 5, upgrades: ['GPS', 'Ruta de ida y vuelta', 'Contrato fijo'] },
    { id: 'shift-manager', name: 'Encargado de turno', cost: 170000000000000, mps: 430000000, icon: '♙', stage: 8, upgrades: ['Walkie', 'Calendario de turnos', 'Bonus por equipo'] },
    { id: 'freelancer', name: 'Autónomo freelance', cost: 2100000000000000, mps: 2900000000, icon: '▰', stage: 2, upgrades: ['Web propia', 'Cartera de clientes', 'Agencia de referidos'] },
    { id: 'store-manager', name: 'Gerente de local', cost: 26000000000000000, mps: 21000000000, icon: '▣', stage: 8, upgrades: ['Cuadro de mandos', 'Compra al por mayor', 'Sucursal modelo'] },
    { id: 'franchisee', name: 'Franquiciado', cost: 310000000000000000, mps: 150000000000, icon: '⌂', stage: 10, upgrades: ['Manual de marca', 'Zona protegida', 'Red de franquicias'] },
    { id: 'property-investor', name: 'Inversor inmobiliario', cost: 7100000000000000000, mps: 1100000000000, icon: '⌂', stage: 9, upgrades: ['Primer alquiler', 'Rehabilitación', 'Edificio completo'] },
    { id: 'chain-director', name: 'Director de cadena', cost: 120000000000000000000, mps: 8300000000000, icon: '⌑', stage: 10, upgrades: ['Comité', 'Logística central', 'Marca consolidada'] },
    { id: 'industrialist', name: 'Empresario industrial', cost: 1900000000000000000000, mps: 64000000000000, icon: '⌑', stage: 11, upgrades: ['Línea automatizada', 'Exportación', 'Planta modelo'] },
    { id: 'foundation-gen', name: 'Fundación benéfica', cost: 12000000000000000000000, mps: 510000000000000, icon: '✳', stage: 12, upgrades: ['Voluntariado', 'Becas', 'Premio al mérito'] },
  ];

  const RECIPES = [
    { id: 'toast-tomato', name: 'Tostada con tomate', req: 'Tostadora', item: 'toaster', cost: 60, energy: 25, satiety: 2, icon: '🍞' },
    { id: 'pasta', name: 'Pasta con tomate', req: 'Fogones', item: 'stovetop', cost: 180, energy: 45, satiety: 5, icon: '🍝' },
    { id: 'rice-egg', name: 'Arroz con huevo', req: 'Fogones', item: 'stovetop', cost: 220, energy: 45, satiety: 5, icon: '🍚' },
    { id: 'omelette', name: 'Tortilla de patatas', req: 'Fogones', item: 'stovetop', cost: 400, energy: 60, satiety: 10, icon: '🍳' },
    { id: 'salad', name: 'Ensalada', req: 'Nevera', item: 'mini-fridge', cost: 160, energy: 30, satiety: 1, icon: '🥗' },
    { id: 'lentils', name: 'Lentejas', req: 'Fogones', item: 'stovetop', cost: 500, energy: 70, satiety: 20, icon: '🍲' },
    { id: 'baked-pasta', name: 'Macarrones gratinados', req: 'Horno', item: 'oven', cost: 900, energy: 80, satiety: 15, icon: '🍝' },
    { id: 'roast-chicken', name: 'Pollo al horno', req: 'Horno', item: 'oven', cost: 1800, energy: 100, satiety: 18, icon: '🍗', buff: { type: 'click', mult: 1.15, duration: 600 } },
    { id: 'homemade-pizza', name: 'Pizza casera', req: 'Horno', item: 'oven', cost: 2500, energy: 90, satiety: 15, icon: '🍕', buff: { type: 'click', mult: 1.1, duration: 600 } },
    { id: 'homemade-paella', name: 'Paella casera', req: 'Fogones y huerto', item: 'stovetop', requiresGarden: true, cost: 5000, energy: 100, satiety: 25, icon: '🥘', buff: { type: 'click', mult: 1.25, duration: 1200 } },
    { id: 'apple-pie', name: 'Tarta de manzana', req: 'Horno', item: 'oven', cost: 2100, energy: 75, satiety: 12, icon: '🥧', buff: { type: 'mood', mult: 1.2, duration: 900 } },
    { id: 'fruit-smoothie', name: 'Batido de frutas', req: 'Batidora', item: 'blender', cost: 140, energy: 30, satiety: 1, icon: '🥤', guard: true },
  ];

  const BUSINESS_SPECIALTIES = [
    { id: 'cafe', name: 'Cafetería', icon: '☕', bonus: 'Los alimentos dan +25 % de efecto.', item: 'Café de especialidad', effect: 'foodEffect', value: .25 },
    { id: 'bakery', name: 'Panadería', icon: '🥐', bonus: 'Las recetas de horno cuestan −30 %.', item: 'Pan artesano', effect: 'discounts', value: .3 },
    { id: 'bookshop', name: 'Librería', icon: '▤', bonus: 'Lectura sube al doble de velocidad.', item: 'Libros de ocasión', effect: 'readingXp', value: 1 },
    { id: 'bike-shop', name: 'Taller de bicis', icon: '🚲', bonus: 'Bicicletas y repuestos más baratos.', item: 'Bici restaurada', effect: 'discounts', value: .25 },
    { id: 'florist', name: 'Floristería', icon: '♧', bonus: 'Los eventos de fiesta pagan el doble.', item: 'Ramos por encargo', effect: 'eventMult', value: 2 },
    { id: 'fruit-shop', name: 'Frutería', icon: '🍎', bonus: 'Los alimentos frescos duran más.', item: 'Cesta de temporada', effect: 'foodEffect', value: .1 },
    { id: 'vintage', name: 'Ropa vintage', icon: '🧥', bonus: 'Reputación +20 %.', item: 'Prendas únicas', effect: 'repGain', value: .2 },
    { id: 'record-shop', name: 'Tienda de discos', icon: '♫', bonus: 'La música da +20 % MPC.', item: 'Vinilos raros', effect: 'clickMult', value: 1.2 },
    { id: 'food-truck', name: 'Food truck', icon: '🚐', bonus: 'Funciona en cualquier barrio.', item: 'Bocadillo gourmet', effect: 'sales', value: .25 },
    { id: 'cowork', name: 'Espacio de coworking', icon: '▰', bonus: 'Trabajos online +30 %.', item: 'Mesa por horas', effect: 'onlineMps', value: .3 },
  ];

  const CLICK_SKILLS = [
    { id: 'resistance', name: 'Resistencia', icon: '↗', desc: '−5 % de gasto de energía por nivel.', baseCost: 250 },
    { id: 'reading', name: 'Lectura', icon: '▤', desc: '+5 % de experiencia en todas las habilidades.', baseCost: 500 },
    { id: 'cooking', name: 'Cocina', icon: '♨', desc: '+10 % de efecto de la comida por nivel.', baseCost: 400 },
    { id: 'diy', name: 'Bricolaje', icon: '⚒', desc: '−8 % de coste de muebles por nivel.', baseCost: 700 },
    { id: 'mechanic', name: 'Mecánica', icon: '⚙', desc: '−10 % de mantenimiento por nivel.', baseCost: 1200 },
    { id: 'negotiation', name: 'Negociación', icon: '⇄', desc: '−5 % de coste de compra por nivel.', baseCost: 1000 },
    { id: 'languages', name: 'Idiomas', icon: '文', desc: '+8 % de pago en trabajos temporales por nivel.', baseCost: 2000 },
    { id: 'accounting', name: 'Contabilidad', icon: '▤', desc: '+5 % de monedas sin conexión por nivel.', baseCost: 1800 },
    { id: 'marketing', name: 'Marketing', icon: '▧', desc: '+6 % de reputación por nivel.', baseCost: 2500 },
    { id: 'leadership', name: 'Liderazgo', icon: '♙', desc: '+5 % de MPS de empleados por nivel.', baseCost: 5000 },
    { id: 'oratory', name: 'Oratoria', icon: '♫', desc: '+4 % de eventos buenos por nivel.', baseCost: 2200 },
    { id: 'creativity', name: 'Creatividad', icon: '✳', desc: '+5 % MPC en trabajos creativos por nivel.', baseCost: 3200 },
  ];

  const PETS = [
    { id: 'mimi', name: 'Mimi, la gata callejera', icon: '🐈', cost: 0, stage: 1, reqMission: 'mimi-1', bonus: '+3 % de suerte y +5 de ánimo.', effect: { clickMult: 1.03, luckyEvents: .03 } },
    { id: 'dog-pet', name: 'Perro adoptado', icon: '🐕', cost: 8000, stage: 2, requires: 'bed', bonus: '+10 % de energía al volver a casa.', effect: { energyRegen: .014 } },
    { id: 'fish', name: 'Pez de colores', icon: '🐟', cost: 1200, stage: 2, requires: 'mini-fridge', bonus: '+2 de comodidad.', effect: { comfort: 2 } },
    { id: 'hamster', name: 'Hámster', icon: '🐹', cost: 10000, stage: 7, bonus: 'Su rueda deja unas monedas extra.', effect: { flatMps: .5 } },
    { id: 'turtle', name: 'Tortuga', icon: '🐢', cost: 9000, stage: 4, requires: 'balcony-table', bonus: 'Reduce el estrés de los eventos malos.', effect: { eventProtection: .1 } },
    { id: 'parrot', name: 'Loro', icon: '🦜', cost: 8000000, stage: 9, bonus: 'Repite frases con bonus aleatorio.', effect: { luckyEvents: .04 } },
    { id: 'shop-cat', name: 'Gato de tienda', icon: '🐈', cost: 2000000, stage: 7, bonus: 'Los clientes de la tienda suben un 5 %.', effect: { sales: .05 } },
    { id: 'guard-dog', name: 'Perro guardián', icon: '🐕', cost: 80000000, stage: 8, bonus: 'Evita los robos del negocio.', effect: { theftShield: true } },
    { id: 'rabbit', name: 'Conejo', icon: '🐇', cost: 30000000, stage: 9, requires: 'big-garden', bonus: 'Produce abono para el huerto.', effect: { garden: true, flatMps: 1 } },
    { id: 'horse', name: 'Caballo', icon: '🐎', cost: 20000000000, stage: 10, bonus: 'Abre rutas de campo.', effect: { travel: 1.5 } },
  ];

  const TEMP_JOBS = [
    { id: 'surveys', name: 'Encuestas online', req: 'Wifi', item: 'basic-phone', stage: 2, pay: 300, icon: '▯' },
    { id: 'reviews', name: 'Escribir reseñas', req: 'Móvil', item: 'basic-phone', stage: 2, pay: 500, icon: '✎' },
    { id: 'move-help', name: 'Ayudante de mudanzas', req: 'Bici o furgoneta', item: 'bike-gateway', stage: 3, pay: 1500, icon: '▤' },
    { id: 'dog-walk', name: 'Pasear perros', req: 'Reputación 8', rep: 8, stage: 2, pay: 800, icon: '🐕' },
    { id: 'babysit', name: 'Cuidar niños', req: 'Reputación 15', rep: 15, stage: 2, pay: 2000, icon: '♧' },
    { id: 'tutoring', name: 'Clases particulares', req: 'Lectura 2', skill: ['reading', 2], stage: 2, pay: 3000, icon: '▤' },
    { id: 'furniture', name: 'Montar muebles', req: 'Bricolaje 1', skill: ['diy', 1], stage: 2, pay: 2500, icon: '⚒' },
    { id: 'paint', name: 'Pintar una pared', req: 'Caja de herramientas', item: 'toolbox', stage: 4, pay: 4000, icon: '▧' },
    { id: 'gardening', name: 'Jardinería', req: 'Reputación 20', rep: 20, stage: 4, pay: 5000, icon: '♧' },
    { id: 'event-waiter', name: 'Camarero de eventos', req: 'Camisa buena', stage: 4, pay: 6000, icon: '☕' },
    { id: 'wedding-photo', name: 'Fotógrafo de bodas', req: 'Cámara', stage: 4, pay: 20000, icon: '◉' },
    { id: 'translation', name: 'Traducción freelance', req: 'Idiomas 2', skill: ['languages', 2], stage: 4, pay: 30000, icon: '文' },
    { id: 'logo-design', name: 'Diseño de logotipos', req: 'Ordenador potente', item: 'powerful-computer', stage: 4, pay: 40000, icon: '✳' },
    { id: 'website', name: 'Programar una web', req: 'Ordenador potente e Idiomas 1', item: 'powerful-computer', skill: ['languages', 1], stage: 4, pay: 90000, icon: '▱' },
  ];

  const MISSIONS = [
    { id: 'julian-1', person: 'Julián, mentor de la plaza', icon: '♙', title: 'La primera ruta', desc: 'Haz 25 clics en la plaza.', stage: 1, test: (s) => s.runClicks >= 25, reward: { coins: 100, rep: .4 }, rewardText: '+100 € · +0,4 reputación' },
    { id: 'julian-2', person: 'Julián, mentor de la plaza', icon: '♙', title: 'Una canción conocida', desc: 'Desbloquea Tocar la guitarra.', stage: 1, test: (s) => s.actionsOwned.includes('guitar'), reward: { coins: 500, rep: 1 }, rewardText: '+500 € · +1 reputación' },
    { id: 'carmen-1', person: 'Doña Carmen, la vecina', icon: '♧', title: 'Una mano con la compra', desc: 'Llega a la habitación alquilada.', stage: 2, test: (s) => s.stage >= 2, reward: { coins: 1200, rep: 1 }, rewardText: '+1,2 k € · +1 reputación' },
    { id: 'carmen-2', person: 'Doña Carmen, la vecina', icon: '♧', title: 'Un hogar que cuidar', desc: 'Compra tres objetos de descanso.', stage: 2, test: (s) => ['mattress', 'bed', 'pillow', 'blanket', 'nightstand', 'alarm', 'curtains', 'earplugs'].filter((id) => s.ownedItems.includes(id)).length >= 3, reward: { rep: 2 }, rewardText: '+2 reputación' },
    { id: 'sofia-1', person: 'Sofía, la ciclista', icon: '🚲', title: 'Reparación de domingo', desc: 'Consigue la primera bicicleta.', stage: 3, test: (s) => s.stage >= 3, reward: { coins: 3000, rep: 2 }, rewardText: '+3 k € · +2 reputación' },
    { id: 'tomas-1', person: 'Tomás, el cartero', icon: '▤', title: 'Una dirección nueva', desc: 'Desbloquea el piso pequeño.', stage: 4, test: (s) => s.stage >= 4, reward: { coins: 12000, rep: 2 }, rewardText: '+12 k € · +2 reputación' },
    { id: 'valeria-1', person: 'Valeria, la inversora', icon: '▧', title: 'Una idea que funciona', desc: 'Abre tu primer puesto.', stage: 6, test: (s) => s.stage >= 6, reward: { coins: 200000, rep: 3 }, rewardText: '+200 k € · +3 reputación' },
    { id: 'mimi-1', person: 'Mimi, la gata callejera', icon: '🐈', title: 'Un poco de compañía', desc: 'Compra o prueba tres comidas distintas.', stage: 1, test: (s) => s.foodTried.length >= 3, reward: { pet: 'mimi', rep: .5 }, rewardText: 'Adoptas a Mimi · +0,5 reputación' },
    { id: 'elena-1', person: 'Elena, tu pareja', icon: '♡', title: 'La cita del jardín', desc: 'Llega a la casa con jardín.', stage: 9, test: (s) => s.stage >= 9, reward: { dreams: 1, rep: 5 }, rewardText: '+1 Sueño · +5 reputación' },
  ];

  const ACHIEVEMENTS = [
    { id: 'first-coin', name: 'Una moneda', desc: 'Consigue tu primera moneda.', test: (s) => s.allTimeEarned >= 1 },
    { id: 'first-click', name: 'Primer clic', desc: 'Haz tu primer clic.', test: (s) => s.clicksTotal >= 1 },
    { id: 'hundred', name: 'Con lo puesto', desc: 'Acumula 100 monedas en esta vida.', test: (s) => s.runEarned >= 100 },
    { id: 'thousand-clicks', name: 'Dedos calientes', desc: 'Haz 1.000 clics.', test: (s) => s.clicksTotal >= 1000 },
    { id: 'ten-k', name: 'Cuenta corriente', desc: 'Acumula 10 k monedas.', test: (s) => s.allTimeEarned >= 10000 },
    { id: 'five-foods', name: 'Primer bocado', desc: 'Prueba cinco comidas distintas.', test: (s) => s.foodTried.length >= 5 },
    { id: 'street-food', name: 'Gourmet', desc: 'Prueba las 12 comidas de la calle.', test: (s) => s.foodTried.length >= 12 },
    { id: 'first-generator', name: 'Un poco de ayuda', desc: 'Compra tu primer generador.', test: (s) => Object.values(s.generators).some((g) => g.count > 0) },
    { id: 'hundred-mps', name: 'Cien por segundo', desc: 'Llega a 100 monedas por segundo.', test: (s) => getMps(s) >= 100 },
    { id: 'roof', name: 'Techo propio', desc: 'Firma el primer contrato de alquiler.', test: (s) => s.stage >= 2 },
    { id: 'bicycle', name: 'Sobre dos ruedas', desc: 'Compra tu primera bicicleta.', test: (s) => s.stage >= 3 },
    { id: 'flat', name: 'Hogar, dulce hogar', desc: 'Compra el piso pequeño.', test: (s) => s.stage >= 4 },
    { id: 'first-business', name: 'Emprendedor', desc: 'Abre el puesto propio.', test: (s) => s.stage >= 6 },
    { id: 'shop', name: 'Tendero', desc: 'Abre la tienda del barrio.', test: (s) => s.stage >= 7 },
    { id: 'team', name: 'Con empleados', desc: 'Forma tu primer equipo.', test: (s) => s.stage >= 8 },
    { id: 'house', name: 'Casa con jardín', desc: 'Compra tu primera casa.', test: (s) => s.stage >= 9 },
    { id: 'million', name: 'Primer millón', desc: 'Acumula 1 M monedas en una vida.', test: (s) => s.runEarned >= 1000000 },
    { id: 'reputation', name: 'Famoso en el barrio', desc: 'Llega a 50 de reputación.', test: (s) => s.reputation >= 50 },
    { id: 'plants', name: 'Amante de las plantas', desc: 'Compra cinco plantas.', test: (s) => s.ownedItems.filter((id) => ['cactus', 'houseplants', 'flower-pots', 'urban-garden', 'big-garden', 'fruit-trees', 'greenhouse'].includes(id)).length >= 5 },
    { id: 'business-chain', name: 'Cadena propia', desc: 'Llega a la etapa de cadena regional.', test: (s) => s.stage >= 10 },
    { id: 'national', name: 'Referente nacional', desc: 'Llega a la empresa nacional.', test: (s) => s.stage >= 11 },
    { id: 'dream-project', name: 'El sueño cumplido', desc: 'Completa un proyecto soñado.', test: (s) => Boolean(s.ending) },
    { id: 'first-dream', name: 'Desde cero', desc: 'Empieza una Nueva vida.', test: (s) => s.newLives >= 1 },
    { id: 'sleepyhead', name: 'Sin parar', desc: 'Juega una hora en total.', test: (s) => s.totalPlaySeconds >= 3600 },
    { id: 'collector', name: 'Coleccionista', desc: 'Consigue diez desbloqueos.', test: (s) => s.ownedItems.length >= 10 },
    { id: 'great-neighbor', name: 'Buen vecino', desc: 'Completa una misión de personaje.', test: (s) => s.completedMissions.length >= 1 },
    { id: 'quiet-dawn', name: 'Noctámbulo', desc: 'Juega durante la noche del barrio.', test: (s) => s.nightClicks >= 1 },
    { id: 'generous', name: 'Aplausos del público', desc: 'Recoge un evento positivo.', test: (s) => s.eventsClaimed >= 1 },
    { id: 'dreams-10', name: 'Una vida tras otra', desc: 'Consigue diez Sueños.', test: (s) => s.dreams >= 10 },
    { id: 'million-clicks', name: 'Manos de acero', desc: 'Haz 10.000 clics.', test: (s) => s.clicksTotal >= 10000 },
  ];

  const DREAM_TREE = [
    { id: 'start-sandwich', name: 'Empezar con un bocadillo', cost: 1, desc: 'La Nueva vida arranca con 100 monedas.' },
    { id: 'spare-key', name: 'Llave de reserva', cost: 2, desc: 'Empiezas directamente con habitación alquilada.' },
    { id: 'beginner-luck', name: 'Suerte de principiante', cost: 3, desc: 'Los eventos buenos salen un 10 % más.' },
    { id: 'early-savings', name: 'Ahorro inicial', cost: 5, desc: 'Las tres primeras etapas cuestan un 20 % menos.' },
    { id: 'inherited-kitchen', name: 'Cocina heredada', cost: 5, desc: 'Todas las recetas quedan desbloqueadas.' },
    { id: 'childhood-bike', name: 'Bici de la infancia', cost: 8, desc: 'Empiezas con una bicicleta.' },
    { id: 'contacts', name: 'Contactos del barrio', cost: 10, desc: 'Los personajes aparecen antes.' },
    { id: 'half-flat', name: 'Un piso de regalo', cost: 15, desc: 'La entrada del piso cuesta la mitad.' },
    { id: 'second-chance', name: 'Segunda oportunidad', cost: 15, desc: 'Un evento malo al día queda anulado.' },
    { id: 'experienced-click', name: 'Clic con experiencia', cost: 20, desc: 'MPC ×2 de forma permanente.' },
    { id: 'athlete-body', name: 'Cuerpo de atleta', cost: 25, desc: 'Energía máxima ×1,5.' },
    { id: 'clear-accounts', name: 'Cuentas claras', cost: 30, desc: 'Los costes de casa y mantenimiento bajan un 30 %.' },
    { id: 'business-plan', name: 'Plan de negocio', cost: 40, desc: 'Eliges la especialidad del puesto sin coste.' },
    { id: 'inherited-rep', name: 'Reputación heredada', cost: 50, desc: 'Empiezas con 20 de reputación.' },
    { id: 'mastered-skills', name: 'Oficio dominado', cost: 60, desc: 'Las habilidades empiezan en nivel 2.' },
    { id: 'memorized-map', name: 'Mapa memorizado', cost: 75, desc: 'Todas las zonas quedan visibles desde el inicio.' },
    { id: 'collector-memories', name: 'Coleccionista de recuerdos', cost: 100, desc: 'Las mascotas dan un 50 % más de bonus.' },
    { id: 'simple-life', name: 'Vida sencilla', cost: 150, desc: 'Sin eventos malos en etapas 1 y 2.' },
    { id: 'dynasty', name: 'Dinastía', cost: 250, desc: 'Empiezas con 10 vasos de propinas.' },
    { id: 'time-master', name: 'Maestro del tiempo', cost: 400, desc: 'Las ganancias sin conexión suben al 100 %.' },
    { id: 'alternate-ending', name: 'Final alternativo', cost: 500, desc: 'Desbloquea finales secretos.' },
  ];

  const ENDINGS = [
    { id: 'seaside', name: 'Casa junto al mar', cost: 50000000000000, icon: '🌊', desc: 'Una escena tranquila y bonus de comodidad.' },
    { id: 'free-school', name: 'Escuela gratuita', cost: 60000000000000, icon: '▤', desc: 'Reputación máxima y bonus para la fundación.' },
    { id: 'nature', name: 'Reserva natural', cost: 70000000000000, icon: '♧', desc: 'Eventos de naturaleza y nuevas mascotas.' },
    { id: 'every-neighborhood', name: 'Cafetería en cada barrio', cost: 80000000000000, icon: '☕', desc: 'Las especialidades suben un 50 %.' },
    { id: 'bike-workshop', name: 'Taller de bicis solidario', cost: 80000000000000, icon: '🚲', desc: 'Bicicletas para toda la ciudad.' },
    { id: 'around-world', name: 'Vuelta al mundo', cost: 90000000000000, icon: '✈', desc: 'Todos los viajes y el logro final.' },
  ];

  const MAP_ZONES = [
    { name: 'Callejón y plaza', stage: 1, req: 'Inicio', modifier: 'Pocos clientes, mucha suerte.' },
    { name: 'Mercadillo', stage: 1, req: 'Mapa del barrio', modifier: 'Los precios bajan un 10 %.' },
    { name: 'Estación', stage: 1, req: 'Abono de autobús', modifier: 'Propinas ×1,5.' },
    { name: 'Barrio comercial', stage: 3, req: 'Bici de segunda mano', modifier: 'MPC de reparto +25 %.' },
    { name: 'Universidad', stage: 1, req: 'Patinete', modifier: 'Experiencia de habilidades ×1,5.' },
    { name: 'Parque', stage: 3, req: 'Bici o patinete', modifier: 'Energía +20 % al descansar.' },
    { name: 'Zona residencial', stage: 5, req: 'Ciclomotor', modifier: 'Reputación +15 %.' },
    { name: 'Polígono industrial', stage: 5, req: 'Furgoneta', modifier: 'Costes de negocio −15 %.' },
    { name: 'Centro histórico', stage: 5, req: 'Coche usado', modifier: 'Producto estrella ×1,5.' },
    { name: 'Puerto y costa', stage: 9, req: 'Barco pequeño', modifier: 'Proveedores nuevos.' },
    { name: 'Zona de oficinas', stage: 4, req: 'Traje y despacho', modifier: 'Contratos freelance +25 %.' },
    { name: 'Distrito financiero', stage: 11, req: 'Oficinas centrales', modifier: 'Dividendos +15 %.' },
    { name: 'Aeropuerto', stage: 5, req: 'Pasaporte', modifier: 'Desbloquea viajes largos.' },
    { name: 'Isla privada', stage: 10, req: 'Avioneta', modifier: 'Bonus de Nueva vida.' },
  ];

  const DEFAULT_STATE = {
    version: 1, coins: 1, runEarned: 1, allTimeEarned: 1,
    clicksTotal: 0, runClicks: 0, nightClicks: 0, stage: 1,
    activeAction: 'ground', actionsOwned: ['ground'],
    foodInventory: {}, foodTried: [], ownedItems: [], upgrades: [],
    generators: {}, generatorUpgrades: {},
    energy: 100, satiety: 100, maxEnergyBase: 100, maxSatietyBase: 100,
    reputation: 0, dreams: 0, dreamTree: [],
    comfort: 0, mode: 'relaxed',
    playSeconds: 0, totalPlaySeconds: 0, lastSeen: Date.now(),
    buffs: {}, activeEvent: null, nextEventAt: 65,
    streak: 0, streakTimer: 0, clickCountSince10: 0,
    completedMissions: [], completedJobs: [], achievements: [],
    skills: {}, specialty: null, pets: [], ending: null,
    eventsClaimed: 0, newLives: 0, log: [],
    gardenHarvestAt: 0, day: 1, billsLate: false,
    nextRentAt: 300, rentCycles: 0, rentDebt: 0, lastBadEventDay: 0,
  };

  const sceneCanvas = document.getElementById('scene-canvas');
  const sceneCtx = sceneCanvas.getContext('2d');
  const sceneWrap = document.getElementById('scene-wrap');
  const catalog = document.getElementById('catalog-content');
  const modal = document.getElementById('modal-backdrop');
  const toast = document.getElementById('toast');
  const floatingLayer = document.getElementById('floating-layer');
  const audioButton = document.getElementById('sound-toggle');
  const ui = {
    coins: document.getElementById('coins-value'), earned: document.getElementById('earned-value'), mps: document.getElementById('mps-value'), mpc: document.getElementById('mpc-value'), clickFactor: document.getElementById('click-factor'),
    energy: document.getElementById('energy-value'), energyMeter: document.getElementById('energy-meter'), satiety: document.getElementById('satiety-value'), satietyMeter: document.getElementById('satiety-meter'), rep: document.getElementById('rep-value'), comfort: document.getElementById('comfort-value'), comfortBonus: document.getElementById('comfort-bonus'), dreams: document.getElementById('dream-value'),
    stageKicker: document.getElementById('stage-kicker'), stageTitle: document.getElementById('stage-title'), dayCycle: document.getElementById('day-cycle'), dayValue: document.getElementById('day-value'), weather: document.getElementById('weather-tag'), sceneLocation: document.getElementById('scene-location'), sceneHint: document.getElementById('scene-click-hint'), sceneCaption: document.getElementById('scene-caption-text'), sceneCoords: document.getElementById('scene-coords'),
    action: document.getElementById('active-action'), actionDetail: document.getElementById('active-action-detail'), clickButton: document.getElementById('click-button'), clickLabel: document.getElementById('click-button-label'), clickValue: document.getElementById('click-button-value'), clicks: document.getElementById('clicks-value'), clickPanel: document.querySelector('.click-panel'),
    foodInventory: document.getElementById('food-inventory'), foodCount: document.getElementById('food-count'), nextTitle: document.getElementById('next-step-title'), nextCopy: document.getElementById('next-step-copy'), nextPercent: document.getElementById('next-step-percent'), nextMeter: document.getElementById('next-step-meter'), nextFoot: document.getElementById('next-step-foot'), nextIcon: document.getElementById('next-step-icon'), activity: document.getElementById('activity-log'), activityCount: document.getElementById('activity-count'),
    catalogDescription: document.getElementById('catalog-description'), catalogVisible: document.getElementById('catalog-visible'), modeLabel: document.getElementById('mode-label'), saveStatus: document.getElementById('save-status'), autosave: document.getElementById('autosave-label'), event: document.getElementById('scene-event'), eventLabel: document.getElementById('event-label'), eventTimer: document.getElementById('event-timer-fill'), toastText: document.getElementById('toast-text'), announcer: document.getElementById('announcer'),
  };

  let state = loadState();
  let activeTab = 'mejoras';
  let sortAvailable = true;
  let toastTimer = 0;
  let resizeObserver = null;
  let lastUpdate = 0;
  let lastSave = Date.now();
  let canvasScaleX = 1;
  let canvasScaleY = 1;
  let sceneTime = 0;
  let clickPulse = 0;
  let soundEnabled = readSoundSetting();
  let audioContext = null;
  let pendingModalAction = null;
  const sceneParticles = [];

  function loadState() {
    let saved;
    try { saved = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); } catch (_) { saved = null; }
    const fresh = JSON.parse(JSON.stringify(DEFAULT_STATE));
    if (!saved || typeof saved !== 'object') return fresh;
    const merged = { ...fresh, ...saved };
    for (const key of ['actionsOwned', 'foodTried', 'ownedItems', 'upgrades', 'dreamTree', 'completedMissions', 'completedJobs', 'achievements', 'pets', 'log']) {
      if (!Array.isArray(merged[key])) merged[key] = fresh[key];
    }
    for (const key of ['foodInventory', 'generators', 'generatorUpgrades', 'buffs', 'skills']) {
      if (!merged[key] || typeof merged[key] !== 'object') merged[key] = {};
    }
    merged.coins = Number.isFinite(Number(merged.coins)) ? Number(merged.coins) : 1;
    merged.runEarned = Number.isFinite(Number(merged.runEarned)) ? Number(merged.runEarned) : merged.coins;
    merged.allTimeEarned = Number.isFinite(Number(merged.allTimeEarned)) ? Number(merged.allTimeEarned) : merged.runEarned;
    merged.stage = clamp(Math.floor(Number(merged.stage) || 1), 1, 12);
    if (!ACTIONS.some((entry) => entry.id === merged.activeAction)) merged.activeAction = 'ground';
    if (!['relaxed', 'hard'].includes(merged.mode)) merged.mode = 'relaxed';
    merged.energy = clamp(Number(merged.energy) || 0, 0, 5000);
    merged.satiety = clamp(Number(merged.satiety) || 0, 0, 5000);
    merged.lastSeen = Number(merged.lastSeen) || Date.now();
    return merged;
  }

  function saveState() {
    state.lastSeen = Date.now();
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
      ui.autosave.textContent = 'GUARDADO';
      ui.saveStatus.textContent = 'PROGRESO GUARDADO';
    } catch (_) {
      ui.autosave.textContent = 'GUARDADO LOCAL NO DISPONIBLE';
      ui.saveStatus.textContent = 'MODO TEMPORAL';
    }
    lastSave = Date.now();
  }

  function applyOfflineProgress() {
    const now = Date.now();
    const elapsed = clamp((now - state.lastSeen) / 1000, 0, 8 * 60 * 60);
    if (elapsed < 8) { state.lastSeen = now; return; }
    const offlineMultiplier = getOfflineMultiplier(state);
    const earned = getMps(state) * elapsed * offlineMultiplier;
    if (earned > 0) {
      const repayment = Math.min(state.rentDebt, earned * .2);
      state.rentDebt = Math.max(0, state.rentDebt - repayment);
      state.coins += earned - repayment;
      state.runEarned += earned;
      state.allTimeEarned += earned;
      pushLog(`Mientras no estabas, el barrio te dejó ${formatNumber(earned)} €.`);
      showToast(`Mientras no estabas: +${formatNumber(earned)} €`, 'offline');
    }
    state.lastSeen = now;
    checkAutoUnlocks();
    checkAchievements();
    saveState();
  }

  function readSoundSetting() {
    try { const value = localStorage.getItem('de-cero-sound'); return value === null ? true : value === 'true'; } catch (_) { return true; }
  }

  function formatNumber(value, decimals = null) {
    if (!Number.isFinite(value)) return '∞';
    if (decimals !== null && Math.abs(value) < 1000) return value.toFixed(decimals).replace('.', ',');
    if (Math.abs(value) < 1000) {
      if (Math.abs(value) > 0 && Math.abs(value) < 1) return value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '').replace('.', ',');
      return Math.floor(value).toLocaleString('es-ES');
    }
    const tier = clamp(Math.floor(Math.log10(Math.abs(value)) / 3), 1, SUFFIXES.length - 1);
    const scale = Math.pow(1000, tier);
    const short = value / scale;
    const precision = decimals === null ? (short < 10 ? 1 : 0) : decimals;
    return `${short.toFixed(precision).replace(/\.0$/, '').replace('.', ',')}${SUFFIXES[tier]}`;
  }

  function formatRate(value) {
    if (value === 0) return '0';
    if (Math.abs(value) < 1000) {
      const shown = Math.abs(value) < 10 ? value.toFixed(1) : value.toFixed(0);
      return shown.replace(/\.0$/, '').replace('.', ',');
    }
    return formatNumber(value);
  }

  function formatDuration(seconds) {
    const mins = Math.floor(Math.max(0, seconds) / 60);
    const secs = Math.floor(Math.max(0, seconds) % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  }

  function hasItem(id, s = state) { return s.ownedItems.includes(id); }
  function getAction(id) { return ACTIONS.find((entry) => entry.id === id) || ACTIONS[0]; }
  function getFood(id) { return FOODS.find((entry) => entry.id === id) || RECIPES.find((entry) => entry.id === id); }
  function genCount(id, s = state) { return Number(s.generators[id]?.count || 0); }
  function genUpgradeCount(id, s = state) { return (s.generatorUpgrades[id] || []).filter(Boolean).length; }

  function getAllEffects(s = state) {
    const effects = { clickMult: 1, clickFlat: 0, tips: 0, offline: 0, mpsMult: 1, maxEnergy: 0, maxSatiety: 0, clickCost: 1, energyRegen: 0, satietyDrain: 1, repGain: 1, foodEffect: 0, discounts: 0, onlineMps: 0, comfort: 0, flatMps: 0, sales: 0, officeClick: 0, rentDiscount: 0, luckyEvents: 0, eventProtection: 0, readingXp: 0, eventMult: 1, garden: false, theftShield: false, travel: 1 };
    for (const entry of OBJECTS) {
      if (!s.ownedItems.includes(entry.id)) continue;
      if (entry.comfort) effects.comfort += entry.comfort;
      const keys = Object.keys(entry.effect || {});
      for (const key of keys) {
        const value = entry.effect[key];
        if (key === 'clickMult') effects.clickMult *= value;
        else if (key === 'clickCost' || key === 'satietyDrain') effects[key] *= value;
        else if (key === 'repGain') effects.repGain *= 1 + value;
        else if (key === 'mpsMult') effects.mpsMult *= value;
        else if (key === 'eventMult') effects.eventMult *= value;
        else if (key === 'travel') effects.travel *= value;
        else if (key === 'garden' || key === 'theftShield') effects[key] = Boolean(effects[key] || value);
        else if (key === 'comfort' || key === 'officeClick' || key === 'rentDiscount' || key === 'tips' || key === 'offline' || key === 'maxEnergy' || key === 'maxSatiety' || key === 'energyRegen' || key === 'foodEffect' || key === 'discounts' || key === 'onlineMps' || key === 'sales' || key === 'flatMps' || key === 'luckyEvents' || key === 'eventProtection' || key === 'readingXp') effects[key] += value;
      }
    }
    for (const pet of PETS) {
      if (!s.pets.includes(pet.id)) continue;
      const petBonus = s.dreamTree.includes('collector-memories') ? 1.5 : 1;
      for (const [key, value] of Object.entries(pet.effect || {})) {
        if (key === 'clickMult') effects.clickMult *= 1 + (value - 1) * petBonus;
        else if (key === 'mpsMult') effects.mpsMult *= 1 + (value - 1) * petBonus;
        else if (key === 'travel') effects.travel *= 1 + (value - 1) * petBonus;
        else if (key === 'garden' || key === 'theftShield') effects[key] = Boolean(effects[key] || value);
        else if (key === 'energyRegen' || key === 'comfort' || key === 'flatMps' || key === 'sales' || key === 'luckyEvents' || key === 'eventProtection') effects[key] += value * petBonus;
      }
    }
    for (const upgrade of BODY_UPGRADES) {
      if (!s.upgrades.includes(upgrade.id)) continue;
      for (const [key, value] of Object.entries(upgrade.effect || {})) {
        if (key === 'maxEnergy' || key === 'maxSatiety' || key === 'energyRegen' || key === 'foodEffect') effects[key] += value;
        if (key === 'clickCost' || key === 'satietyDrain') effects[key] *= value;
      }
    }
    if (s.specialty) {
      const specialty = BUSINESS_SPECIALTIES.find((entry) => entry.id === s.specialty);
      if (specialty) {
        if (specialty.effect === 'clickMult') effects.clickMult *= specialty.value;
        else if (specialty.effect === 'foodEffect') effects.foodEffect += specialty.value;
        else if (specialty.effect === 'repGain') effects.repGain *= 1 + specialty.value;
        else if (specialty.effect === 'discounts') effects.discounts += specialty.value;
        else if (specialty.effect === 'sales') effects.sales += specialty.value;
        else if (specialty.effect === 'onlineMps') effects.onlineMps += specialty.value;
        else if (specialty.effect === 'readingXp') effects.readingXp += specialty.value;
        else if (specialty.effect === 'eventMult') effects.eventMult *= specialty.value;
      }
    }
    if (s.ending === 'seaside') effects.comfort += 10;
    if (s.ending === 'free-school') { effects.repGain *= 1.2; effects.mpsMult *= 1.1; }
    if (s.ending === 'nature') { effects.luckyEvents += .1; effects.eventMult *= 1.5; effects.garden = true; }
    if (s.ending === 'every-neighborhood') effects.mpsMult *= 1.5;
    if (s.ending === 'bike-workshop') { effects.discounts += .1; effects.travel *= 2; }
    if (s.ending === 'around-world') { effects.travel *= 3; effects.eventMult *= 1.2; }
    if (s.dreamTree.includes('experienced-click')) effects.clickMult *= 2;
    effects.mpsMult *= 1 + s.dreams * .02;
    effects.mpsMult *= 1 + Math.floor(s.achievements.length / 10) * .01;
    effects.mpsMult *= 1 + effects.sales;
    return effects;
  }

  function getMaxEnergy(s = state) {
    const effects = getAllEffects(s);
    return Math.max(1, (s.maxEnergyBase || 100) + effects.maxEnergy + (s.dreamTree.includes('athlete-body') ? 50 : 0));
  }
  function getMaxSatiety(s = state) {
    const effects = getAllEffects(s);
    return Math.max(1, (s.maxSatietyBase || 100) + effects.maxSatiety);
  }
  function getComfort(s = state) {
    return getAllEffects(s).comfort;
  }
  function getMps(s = state) {
    const counts = Object.fromEntries(GENERATORS.map((entry) => [entry.id, genCount(entry.id, s)]));
    const effects = getAllEffects(s);
    const raw = {};
    for (const generator of GENERATORS) {
      const count = counts[generator.id];
      if (!count) { raw[generator.id] = 0; continue; }
      const upgradeMultiplier = Math.pow(2, genUpgradeCount(generator.id, s));
      raw[generator.id] = generator.mps * count * upgradeMultiplier;
    }
    const leadership = 1 + Number(s.skills?.leadership?.level || 0) * .05;
    for (const id of ['corner-friend', 'leaflets', 'bike-messenger', 'dishwasher', 'waiter', 'cook', 'moto-delivery', 'van-driver', 'shop-assistant', 'shift-manager', 'store-manager', 'franchisee', 'chain-director', 'industrialist', 'foundation-gen']) raw[id] *= leadership;
    const hasHospitality = counts.dishwasher && counts.waiter && counts.cook;
    if (hasHospitality) for (const id of ['dishwasher', 'waiter', 'cook']) raw[id] *= 1.2;
    if (counts['shop-assistant'] && counts['shift-manager']) {
      raw['shop-assistant'] *= 1.15;
      raw['shift-manager'] *= 1.15;
    }
    if (counts['moto-delivery'] && counts['bike-messenger']) raw['moto-delivery'] *= 1 + Math.floor(counts['bike-messenger'] / 10) * .01;
    if (counts['chain-director'] && (counts.franchisee || counts['store-manager'])) raw['chain-director'] *= 1 + (counts.franchisee + counts['store-manager']) * .02;
    if (counts.freelancer && effects.onlineMps) raw.freelancer *= 1 + effects.onlineMps;
    let base = Object.values(raw).reduce((sum, value) => sum + value, 0) + effects.flatMps;
    if (counts['property-investor'] && counts.industrialist) base *= 1.05;
    const units = Object.values(s.generators).reduce((total, entry) => total + Number(entry.count || 0), 0);
    const milestoneBonus = [50, 100, 150, 200, 300].reduce((total, milestone) => total + (units >= milestone ? ({ 50: .05, 100: .1, 150: .15, 200: .2, 300: .3 }[milestone]) : 0), 0);
    base *= (1 + milestoneBonus) * effects.mpsMult;
    const clientBuff = s.buffs.clientUntil > s.playSeconds ? 2 : 1;
    return base * clientBuff;
  }

  function getMpc(s = state) {
    const action = getAction(s.activeAction);
    const effects = getAllEffects(s);
    let mult = effects.clickMult;
    let value = action.mpc;
    for (const upgrade of CLICK_UPGRADES) if (s.upgrades.includes(upgrade.id) && upgrade.mult) mult *= upgrade.mult;
    if (s.upgrades.includes('lucky-click')) mult *= 1;
    if (s.upgrades.includes('chain-click')) mult *= 1 + Math.floor(s.streak / 5) * .01;
    if (s.upgrades.includes('team-click')) value += getMps(s) * .02;
    else if (s.upgrades.includes('practice-shortcut')) value += getMps(s) * .01;
    if (s.upgrades.includes('infinite-click')) value += getMps(s) * .05;
    if (effects.officeClick && action.type === 'office') mult *= 1 + effects.officeClick;
    if (action.type === 'creative') mult *= 1 + Number(s.skills?.creativity?.level || 0) * .05;
    if (hasItem('gloves', s) && ['cans', 'cardboard'].includes(action.id)) mult *= 1.5;
    if (hasItem('cart', s) && ['cans', 'cardboard'].includes(action.id)) mult *= 2;
    if (genCount('dog', s) && genCount('sign', s)) mult *= 1 + genCount('dog', s) * .1;
    if (effects.tips) mult *= 1 + effects.tips;
    if (s.buffs.clickUntil > s.playSeconds) mult *= s.buffs.clickMult || 1;
    if (s.buffs.moodUntil > s.playSeconds) mult *= s.buffs.moodMult || 1;
    if (s.buffs.rainUntil > s.playSeconds) mult *= s.buffs.rainMult || .7;
    if (s.specialty === 'cafe') mult *= 1;
    if (s.stage >= 3 && action.id === 'bags') mult *= 1.25;
    if (s.stage >= 6) mult *= 1 + effects.sales;
    return value * mult;
  }

  function getEnergyFactor(s = state) {
    if (s.buffs.guard) return 1;
    const ratio = clamp(s.energy / Math.max(1, getMaxEnergy(s)), 0, 1);
    return ratio >= .4 ? 1 : .5 + ratio * 1.25;
  }
  function getClickValue(s = state) {
    let amount = getMpc(s) * getEnergyFactor(s);
    if (s.upgrades.includes('double-click') && (s.clicksTotal + 1) % 10 === 0) amount *= 2;
    if (s.upgrades.includes('lucky-click') && Math.random() < .01) amount *= 10;
    if (s.upgrades.includes('fortune-click') && Math.random() < .05) amount *= 100;
    if (s.upgrades.includes('magic-click')) amount += getMps(s);
    return amount;
  }
  function getOfflineMultiplier(s = state) {
    let multiplier = .5;
    if (hasItem('tin-bank', s)) multiplier += .05;
    if (s.dreamTree.includes('time-master')) multiplier = 1;
    multiplier *= 1 + getComfort(s) * .01;
    const accounting = Number(s.skills?.accounting?.level || 0);
    multiplier *= 1 + accounting * .05;
    return Math.min(1.5, multiplier);
  }
  function getEnergyRegen(s = state) {
    if (s.satiety <= 0 && s.mode === 'hard') return 0;
    const effects = getAllEffects(s);
    const roomBonus = 1 + getComfort(s) * .015;
    const dreamBonus = s.dreamTree.includes('athlete-body') ? 1.5 : 1;
    return (.14 + effects.energyRegen) * roomBonus * dreamBonus * (s.buffs.moodUntil > s.playSeconds ? 1.1 : 1);
  }
  function getActionCost(itemDef) {
    let discount = getAllEffects().discounts;
    const negotiation = Number(state.skills?.negotiation?.level || 0) * .05;
    discount += negotiation;
    if (state.dreamTree.includes('clear-accounts')) discount += .3;
    if (state.dreamTree.includes('early-savings') && state.stage <= 3) discount += .2;
    if (itemDef.group === 'mejoras' && Number(state.skills?.diy?.level || 0)) discount += Number(state.skills.diy.level) * .08;
    if (itemDef.group === 'transporte' && Number(state.skills?.mechanic?.level || 0)) discount += Number(state.skills.mechanic.level) * .1;
    return itemDef.cost * Math.max(.1, 1 - Math.min(.8, discount));
  }

  function gainCoins(amount, source = 'Clic', log = false) {
    if (!Number.isFinite(amount) || amount <= 0) return;
    const earned = amount;
    if (state.rentDebt > 0) {
      const repayment = Math.min(state.rentDebt, amount * .2);
      state.rentDebt -= repayment;
      amount -= repayment;
    }
    state.coins += amount;
    state.runEarned += earned;
    state.allTimeEarned += earned;
    if (log) pushLog(`${source}: +${formatNumber(earned)} €.`);
    checkAutoUnlocks();
    checkAchievements();
  }
  function spendCoins(amount) {
    if (state.coins + 1e-7 < amount) return false;
    state.coins = Math.max(0, state.coins - amount);
    return true;
  }
  function addReputation(amount) {
    if (amount <= 0) return;
    const effects = getAllEffects();
    const marketing = Number(state.skills?.marketing?.level || 0) * .06;
    state.reputation += amount * effects.repGain * (1 + marketing);
  }
  function pushLog(message) {
    state.log.unshift({ text: message, time: Date.now() });
    state.log = state.log.slice(0, 5);
    renderActivity();
  }

  function showToast(message, kind = 'success') {
    ui.toastText.textContent = message;
    toast.classList.toggle('is-alert', kind === 'alert');
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 2800);
    ui.announcer.textContent = '';
    window.setTimeout(() => { ui.announcer.textContent = message; }, 20);
  }

  function playSound(kind = 'coin') {
    if (!soundEnabled) return;
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) return;
    try {
      if (!audioContext) audioContext = new AudioCtor();
      if (audioContext.state === 'suspended') audioContext.resume();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const now = audioContext.currentTime;
      const tones = { coin: [680, .065], buy: [520, .12], eat: [410, .14], gate: [550, .35], event: [850, .22], click: [340, .045] };
      const [frequency, duration] = tones[kind] || tones.coin;
      oscillator.type = kind === 'click' ? 'triangle' : 'sine';
      oscillator.frequency.setValueAtTime(frequency, now);
      if (kind === 'gate') oscillator.frequency.exponentialRampToValueAtTime(880, now + duration);
      gain.gain.setValueAtTime(.0001, now);
      gain.gain.exponentialRampToValueAtTime(kind === 'click' ? .012 : .035, now + .01);
      gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
      oscillator.connect(gain); gain.connect(audioContext.destination);
      oscillator.start(now); oscillator.stop(now + duration + .02);
    } catch (_) { /* Audio is an optional accent. */ }
  }

  function setSoundButton() {
    audioButton.classList.toggle('is-muted', !soundEnabled);
    audioButton.setAttribute('aria-label', soundEnabled ? 'Desactivar sonido' : 'Activar sonido');
    audioButton.title = soundEnabled ? 'Sonido activado' : 'Sonido desactivado';
  }

  function clickScene(event) {
    if (event && event.button !== undefined && event.button !== 0) return;
    const usesGuard = Boolean(state.buffs.guard && state.energy / getMaxEnergy() < .4);
    const amount = getClickValue(state);
    if (usesGuard) state.buffs.guard = false;
    const action = getAction(state.activeAction);
    const coldCost = state.buffs.coldUntil > state.playSeconds && !hasItem('jacket') && !hasItem('motor-jacket') ? 1.4 : 1;
    const clickEnergyCost = .55 * getAllEffects().clickCost * (1 - Number(state.skills?.resistance?.level || 0) * .05) * coldCost;
    state.energy = clamp(state.energy - clickEnergyCost, 0, getMaxEnergy());
    state.clicksTotal += 1;
    state.runClicks += 1;
    state.clickCountSince10 += 1;
    state.streak += 1;
    state.streakTimer = 4;
    if (state.stage >= 1) addReputation(.008);
    if (sceneIsNight()) state.nightClicks += 1;
    const awarded = amount;
    gainCoins(awarded, action.name);
    trainSkill('resistance', .2);
    if (action.type === 'performance' || action.type === 'creative') trainSkill(action.type === 'performance' ? 'oratory' : 'creativity', .12);
    if (action.type === 'office') trainSkill('accounting', .08);
    if (action.type === 'repair') trainSkill('mechanic', .12);
    if (action.type === 'business') trainSkill('marketing', .08);
    if (state.clickCountSince10 >= 10) state.clickCountSince10 = 0;
    clickPulse = .18;
    spawnFloat(event, `+${formatNumber(awarded)} €`);
    spawnSceneParticles(event);
    if (state.clicksTotal === 100 && !hasItem('library-card')) {
      state.ownedItems.push('library-card');
      state.skills.reading ||= { level: 0, xp: 0 };
      showToast('Tarjeta de la biblioteca gratis: ducha, wifi y Lectura.', 'success');
      pushLog('La bibliotecaria te ha dado una tarjeta de biblioteca.');
    } else if (state.clicksTotal % 100 === 0) {
      showToast(`¡${formatNumber(state.clicksTotal)} clics! Los dedos ya conocen el camino.`);
    }
    if (state.streak === 10) addReputation(.2);
    if (state.upgrades.includes('chain-click') && state.streak >= 5) addReputation(.005);
    playSound('click');
    if (state.runClicks % 50 === 0) pushLog(`Llevas ${formatNumber(state.runClicks)} clics en esta vida.`);
    checkMissions();
    checkAchievements();
    updateUI(true);
  }

  function spawnFloat(event, text) {
    const rect = sceneWrap.getBoundingClientRect();
    const x = event && Number.isFinite(event.clientX) ? event.clientX - rect.left : rect.width * .5;
    const y = event && Number.isFinite(event.clientY) ? event.clientY - rect.top : rect.height * .56;
    const element = document.createElement('span');
    element.className = 'float-coin';
    element.textContent = text;
    element.style.left = `${clamp(x, 20, rect.width - 70)}px`;
    element.style.top = `${clamp(y, 20, rect.height - 20)}px`;
    floatingLayer.append(element);
    window.setTimeout(() => element.remove(), 900);
  }

  function spawnSceneParticles(event) {
    const rect = sceneCanvas.getBoundingClientRect();
    const x = event && event.clientX ? (event.clientX - rect.left) / rect.width * WORLD.width : WORLD.width * .42;
    const y = event && event.clientY ? (event.clientY - rect.top) / rect.height * WORLD.height : WORLD.height * .58;
    for (let i = 0; i < 5; i += 1) {
      sceneParticles.push({ x, y, vx: (Math.random() - .5) * 90, vy: -45 - Math.random() * 80, life: .45 + Math.random() * .2, max: .65, size: 1.5 + Math.random() * 2.8, color: i % 2 ? '#ffdf82' : '#f2f5c4' });
    }
  }

  function eatFood(id, isRecipe = false) {
    const food = getFood(id);
    if (!food) return;
    if (isRecipe) {
      const recipe = RECIPES.find((entry) => entry.id === id);
      if (!recipe || !recipeUnlocked(recipe)) { showToast('Todavía no tienes lo necesario para cocinar eso.', 'alert'); return; }
      const cost = recipe.cost * (hasItem('camp-stove') ? .7 : 1) * (state.dreamTree.includes('inherited-kitchen') ? .7 : 1);
      if (!spendCoins(cost)) { showToast(`Te faltan ${formatNumber(cost - state.coins)} € para cocinar.`, 'alert'); return; }
      applyFoodEffect(recipe);
      state.foodTried = [...new Set([...state.foodTried, recipe.id])];
      addReputation(.15);
      trainSkill('cooking', 3);
      pushLog(`Has cocinado ${recipe.name.toLowerCase()}.`);
      showToast(`${recipe.name}: energía y buen ánimo.`, 'success');
      playSound('eat');
      updateUI(true);
      return;
    }
    const quantity = Number(state.foodInventory[id] || 0);
    if (quantity <= 0) return;
    state.foodInventory[id] -= 1;
    applyFoodEffect(food);
    const isNew = !state.foodTried.includes(id);
    state.foodTried = [...new Set([...state.foodTried, id])];
    if (isNew) addReputation(.35);
    trainSkill('cooking', 1);
    pushLog(`Has comido ${food.short.toLowerCase()}${isNew ? ' por primera vez' : ''}.`);
    showToast(`Un ${food.short.toLowerCase()} sienta bien.`, 'success');
    playSound('eat');
    checkMissions();
    checkAchievements();
    updateUI(true);
  }

  function applyFoodEffect(food) {
    const foodBonus = 1 + getAllEffects().foodEffect + Number(state.skills?.cooking?.level || 0) * .1;
    state.energy = clamp(state.energy + (food.energy || 0) * foodBonus, 0, getMaxEnergy());
    const sitBonus = (hasItem('fold-table') ? 5 : 0) + (hasItem('kitchen-table') ? 15 : 0) + (hasItem('balcony-table') ? 10 : 0);
    state.satiety = clamp(state.satiety + (food.satiety || 0) + sitBonus, 0, getMaxSatiety());
    if (food.guard) state.buffs.guard = true;
    if (food.buff) {
      const until = state.playSeconds + food.buff.duration;
      if (food.buff.type === 'click') { state.buffs.clickUntil = until; state.buffs.clickMult = food.buff.mult; }
      if (food.buff.type === 'mood') { state.buffs.moodUntil = until; state.buffs.moodMult = food.buff.mult; }
    }
  }

  function buyFood(id) {
    const food = FOODS.find((entry) => entry.id === id);
    if (!food) return;
    if (!spendCoins(getActionCost(food))) { showToast(`Necesitas ${costLabel(getActionCost(food))}.`, 'alert'); return; }
    state.foodInventory[id] = Number(state.foodInventory[id] || 0) + 1;
    pushLog(`Compraste ${food.short.toLowerCase()} por ${costLabel(getActionCost(food))}.`);
    showToast(`${food.short} guardado para cuando lo necesites.`);
    playSound('buy');
    updateUI(true);
  }

  function buyAction(id) {
    const action = ACTIONS.find((entry) => entry.id === id);
    if (!action) return;
    if (state.actionsOwned.includes(id)) {
      state.activeAction = id;
      pushLog(`Tu oficio principal ahora es: ${action.name.toLowerCase()}.`);
      updateUI(true);
      return;
    }
    if (state.stage < action.stage) { showToast(`Necesitas llegar a la etapa ${action.stage}.`, 'alert'); return; }
    if (!spendCoins(action.cost)) { showToast(`Necesitas ${costLabel(action.cost)}.`, 'alert'); return; }
    state.actionsOwned.push(id);
    state.activeAction = id;
    addReputation(.12);
    pushLog(`Aprendiste a ${action.name.toLowerCase()}.`);
    showToast(`Nuevo oficio: ${action.name}. Ahora ganas ${action.mpc} € por clic.`);
    playSound('buy');
    updateUI(true);
  }

  function buyObject(id) {
    const entry = OBJECTS.find((object) => object.id === id);
    if (!entry || hasItem(id)) return;
    const reason = getObjectLockReason(entry);
    if (reason) { showToast(reason, 'alert'); return; }
    const cost = getActionCost(entry);
    if (!spendCoins(cost)) { showToast(`Necesitas ${costLabel(cost)}.`, 'alert'); return; }
    state.ownedItems.push(id);
    if (id === 'library-card') { state.skills.reading ||= { level: 0, xp: 0 }; }
    if (entry.effect.map) state.zonesUnlocked = true;
    if (entry.effect.business && !state.specialty) state.specialty ||= null;
    if (entry.effect.maxEnergy) state.energy = clamp(state.energy, 0, getMaxEnergy());
    if (entry.effect.ledger) document.querySelector('.activity-card').classList.add('is-ledger');
    pushLog(`Desbloqueaste ${entry.name.toLowerCase()}.`);
    addReputation(entry.group === 'negocio' ? .12 : .04);
    showToast(`${entry.name}: ${entry.desc}`);
    playSound('buy');
    checkMissions(); checkAchievements(); updateUI(true);
  }

  function getObjectLockReason(entry) {
    if (state.stage < entry.stage) return `Etapa ${entry.stage}: ${STAGES[entry.stage - 1].name}.`;
    if (entry.requiresClicks && state.clicksTotal < entry.requiresClicks) return `Requisito: ${entry.requiresClicks} clics.`;
    if (entry.requiresRep && state.reputation < entry.requiresRep) return `Requisito: reputación ${entry.requiresRep}.`;
    if (entry.requiresItem && !hasItem(entry.requiresItem)) return `Requisito: ${OBJECTS.find((obj) => obj.id === entry.requiresItem)?.name || 'otro objeto'}.`;
    return '';
  }

  function buyUpgrade(id, type = 'click') {
    const list = type === 'body' ? BODY_UPGRADES : CLICK_UPGRADES;
    const upgrade = list.find((entry) => entry.id === id);
    if (!upgrade || state.upgrades.includes(id)) return;
    if (state.stage < upgrade.stage) { showToast(`Requiere etapa ${upgrade.stage}.`, 'alert'); return; }
    const cost = getActionCost(upgrade);
    if (!spendCoins(cost)) { showToast(`Necesitas ${costLabel(cost)}.`, 'alert'); return; }
    state.upgrades.push(id);
    pushLog(`Mejora conseguida: ${upgrade.name.toLowerCase()}.`);
    showToast(`${upgrade.name}: ${upgrade.desc}`);
    playSound('buy');
    checkAchievements(); updateUI(true);
  }

  function generatorCost(generator, s = state) {
    return generator.cost * Math.pow(1.15, genCount(generator.id, s));
  }
  function buyGenerator(id) {
    const generator = GENERATORS.find((entry) => entry.id === id);
    if (!generator) return;
    if (state.stage < generator.stage) { showToast(`Requiere la etapa ${generator.stage}: ${STAGES[generator.stage - 1].name}.`, 'alert'); return; }
    const cost = generatorCost(generator);
    if (!spendCoins(cost)) { showToast(`Necesitas ${costLabel(cost)} para contratar a ${generator.name.toLowerCase()}.`, 'alert'); return; }
    state.generators[id] ||= { count: 0 };
    state.generators[id].count += 1;
    pushLog(`${generator.name}: una unidad más. +${formatNumber(generator.mps)} MPS base.`);
    showToast(`${generator.name} se une a tu equipo.`);
    playSound('buy');
    trainSkill('leadership', .2);
    checkAchievements(); updateUI(true);
  }

  function buyGeneratorUpgrade(id, tier) {
    const generator = GENERATORS.find((entry) => entry.id === id);
    if (!generator || genCount(id) < [1, 10, 25][tier]) return;
    state.generatorUpgrades[id] ||= [false, false, false];
    if (state.generatorUpgrades[id][tier]) return;
    const cost = generator.cost * (8 * Math.pow(4, tier));
    if (!spendCoins(cost)) { showToast(`La mejora cuesta ${costLabel(cost)}.`, 'alert'); return; }
    state.generatorUpgrades[id][tier] = true;
    pushLog(`${generator.upgrades[tier]}: producción de ${generator.name.toLowerCase()} ×2.`);
    showToast(`${generator.upgrades[tier]}: el generador produce el doble.`);
    playSound('buy'); updateUI(true);
  }

  function buyStageGate(id) {
    const gate = STAGE_GATES.find((entry) => entry.id === id);
    if (!gate || gate.from !== state.stage) return;
    const reason = gateLockReason(gate);
    if (reason) { showToast(reason, 'alert'); return; }
    if (gate.cost && !spendCoins(getGateCost(gate))) { showToast(`Aún necesitas ${costLabel(getGateCost(gate))}.`, 'alert'); return; }
    state.stage = gate.to;
    if (gate.id === 'gate-room') { state.ownedItems.push('rental-contract'); state.reputation += .5; state.nextRentAt = state.playSeconds + 300; }
    if (gate.id === 'gate-bike') { state.buffs.bike = true; if (!hasItem('bike-gateway')) state.ownedItems.push('bike-gateway'); }
    if (gate.id === 'gate-dream') state.ending = null;
    if (gate.id === 'gate-stall' && !state.specialty) showSpecialtyChoice();
    pushLog(`Nueva etapa: ${STAGES[gate.to - 1].name}.`);
    showToast(`¡${STAGES[gate.to - 1].name}! Tu mundo acaba de crecer.`, 'success');
    playSound('gate');
    state.streak = 0;
    checkAchievements(); checkMissions(); renderSceneLabels(); updateUI(true);
  }

  function getGateCost(gate) {
    let cost = gate.cost;
    if (gate.id === 'gate-flat' && state.dreamTree.includes('half-flat')) cost *= .5;
    if (state.dreamTree.includes('early-savings') && gate.to <= 3) cost *= .8;
    if (state.dreamTree.includes('clear-accounts')) cost *= .7;
    return cost;
  }

  function gateLockReason(gate) {
    if (gate.from !== state.stage) return `Primero completa la etapa ${gate.from}.`;
    if (state.runEarned < gate.threshold) return `Acumula ${formatNumber(gate.threshold)} € en esta vida.`;
    if (gate.extra === 'stage1') {
      if (state.foodTried.length < 10) return `Prueba ${10 - state.foodTried.length} comidas distintas más.`;
      if (state.reputation < 5) return `Te faltan ${(5 - state.reputation).toFixed(1).replace('.', ',')} puntos de reputación.`;
    }
    if (gate.id === 'gate-company' && state.stage < 10) return 'Primero abre la cadena regional.';
    return '';
  }

  function checkAutoUnlocks() {
    while (state.stage < 12) {
      const gate = STAGE_GATES.find((entry) => entry.from === state.stage);
      if (!gate || gate.id !== 'gate-dream') break;
      if (state.runEarned >= gate.threshold) {
        state.stage = 12;
        pushLog('Has llegado al proyecto soñado. El final está en tus manos.');
        showToast('Etapa 12: elige qué sueño dejarle a la ciudad.');
        playSound('gate');
      }
      break;
    }
  }

  function chooseSpecialty(id) {
    const choice = BUSINESS_SPECIALTIES.find((entry) => entry.id === id);
    if (!choice || state.specialty) return;
    const cost = state.dreamTree.includes('business-plan') ? 0 : 50000;
    if (!spendCoins(cost)) { showToast(`Necesitas ${costLabel(cost)} para abrir ${choice.name.toLowerCase()}.`, 'alert'); return; }
    state.specialty = id;
    pushLog(`Elegiste especialidad: ${choice.name.toLowerCase()}.`);
    showToast(`${choice.name}: ${choice.bonus}`);
    closeModal(); updateUI(true);
  }

  function showSpecialtyChoice() {
    openModal('ELIGE TU PRIMER NEGOCIO', '¿Qué te gustaría poner en marcha?', 'Cada especialidad cambia una parte de la economía. No se puede cambiar hasta una Nueva vida.', BUSINESS_SPECIALTIES.map((specialty) => ({ label: `${specialty.icon} ${specialty.name}`, text: specialty.bonus, action: () => chooseSpecialty(specialty.id) })));
  }

  function buySpecialty(id) {
    if (state.stage < 6) return;
    if (state.specialty) { showToast(`Tu especialidad ya es ${BUSINESS_SPECIALTIES.find((entry) => entry.id === state.specialty)?.name}.`, 'alert'); return; }
    chooseSpecialty(id);
  }

  function trainSkill(id, xp = 1) {
    const skill = CLICK_SKILLS.find((entry) => entry.id === id);
    if (!skill) return;
    state.skills[id] ||= { level: state.dreamTree.includes('mastered-skills') ? 2 : 0, xp: 0 };
    const progress = state.skills[id];
    if (progress.level >= 5) return;
    const experienceBonus = 1 + Number(state.skills?.reading?.level || 0) * .05 + getAllEffects().readingXp;
    progress.xp += xp * experienceBonus;
    const needed = 20 + progress.level * 15;
    if (progress.xp >= needed) {
      progress.xp -= needed;
      progress.level += 1;
      showToast(`${skill.name} nivel ${progress.level}. ${skill.desc}`);
      pushLog(`Has mejorado la habilidad ${skill.name.toLowerCase()}.`);
      checkAchievements();
    }
  }

  function buySkillLevel(id) {
    const skill = CLICK_SKILLS.find((entry) => entry.id === id);
    if (!skill) return;
    state.skills[id] ||= { level: 0, xp: 0 };
    const skillState = state.skills[id];
    if (skillState.level >= 5) return;
    const cost = skill.baseCost * Math.pow(skillState.level + 1, 2);
    if (!spendCoins(cost)) { showToast(`Entrenar cuesta ${costLabel(cost)}.`, 'alert'); return; }
    skillState.level += 1;
    skillState.xp = 0;
    pushLog(`${skill.name}: nivel ${skillState.level}.`);
    showToast(`${skill.name} nivel ${skillState.level}. ${skill.desc}`);
    updateUI(true);
  }

  function jobLockReason(job) {
    if (state.stage < job.stage) return `Requisito: etapa ${job.stage} · ${STAGES[job.stage - 1].name}.`;
    if (job.id === 'move-help' && !hasItem('bike-gateway') && !hasItem('old-van')) return 'Requisito: bicicleta o furgoneta.';
    if (job.item && !hasItem(job.item) && !(['surveys', 'reviews'].includes(job.id) && hasItem('library-card'))) return `Requisito: ${OBJECTS.find((entry) => entry.id === job.item)?.name || job.req}.`;
    if (job.rep && state.reputation < job.rep) return `Requisito: reputación ${job.rep}.`;
    if (job.skill && Number(state.skills?.[job.skill[0]]?.level || 0) < job.skill[1]) return `Requisito: ${CLICK_SKILLS.find((entry) => entry.id === job.skill[0])?.name || 'habilidad'} nivel ${job.skill[1]}.`;
    return '';
  }

  function completeJob(id) {
    const job = TEMP_JOBS.find((entry) => entry.id === id);
    if (!job || state.completedJobs.includes(id)) return;
    const reason = jobLockReason(job);
    if (reason) { showToast(reason, 'alert'); return; }
    const languageBonus = 1 + Number(state.skills?.languages?.level || 0) * .08;
    const reward = job.pay * languageBonus;
    state.completedJobs.push(id);
    gainCoins(reward, job.name);
    addReputation(.2);
    pushLog(`Trabajo temporal: ${job.name.toLowerCase()} · +${formatNumber(reward)} €.`);
    showToast(`${job.name}: +${formatNumber(reward)} €.`);
    playSound('event'); updateUI(true);
  }

  function petLockReason(pet) {
    if (state.pets.includes(pet.id)) return 'Ya vive contigo.';
    if (pet.reqMission && !state.completedMissions.includes(pet.reqMission)) return 'Completa primero la misión de Mimi.';
    if (state.stage < pet.stage) return `Requisito: etapa ${pet.stage} · ${STAGES[pet.stage - 1].name}.`;
    if (pet.requires && !hasItem(pet.requires)) return `Requisito: ${OBJECTS.find((entry) => entry.id === pet.requires)?.name || 'mejora de hogar'}.`;
    return '';
  }

  function adoptPet(id) {
    const pet = PETS.find((entry) => entry.id === id);
    if (!pet) return;
    const reason = petLockReason(pet);
    if (reason) { showToast(reason, 'alert'); return; }
    if (pet.cost && !spendCoins(pet.cost)) { showToast(`Adoptar cuesta ${costLabel(pet.cost)}.`, 'alert'); return; }
    state.pets.push(id);
    pushLog(`${pet.name} ya forma parte de tu familia.`);
    showToast(`${pet.name}: ${pet.bonus}`);
    checkAchievements(); updateUI(true);
  }

  function completeMission(id) {
    const mission = MISSIONS.find((entry) => entry.id === id);
    if (!mission || state.completedMissions.includes(id) || !mission.test(state)) return;
    state.completedMissions.push(id);
    if (mission.reward.coins) gainCoins(mission.reward.coins, 'Misión completada');
    if (mission.reward.rep) addReputation(mission.reward.rep);
    if (mission.reward.dreams) state.dreams += mission.reward.dreams;
    if (mission.reward.pet && !state.pets.includes(mission.reward.pet)) state.pets.push(mission.reward.pet);
    if (id === 'mimi-1' && !state.pets.includes('mimi')) state.pets.push('mimi');
    pushLog(`Misión de ${mission.person.split(',')[0]} completada.`);
    showToast(`Misión: ${mission.title}. ${mission.rewardText}`);
    playSound('event'); updateUI(true);
  }

  function checkMissions() {
    for (const mission of MISSIONS) {
      if (!state.completedMissions.includes(mission.id) && state.stage >= mission.stage && mission.test(state)) {
        // Missions are claimed in the progress panel; nothing is auto-claimed.
      }
    }
  }

  function checkAchievements() {
    for (const achievement of ACHIEVEMENTS) {
      if (!state.achievements.includes(achievement.id) && achievement.test(state)) {
        state.achievements.push(achievement.id);
        showToast(`Logro: ${achievement.name}. Cada diez logros suman +1 % MPS.`);
        pushLog(`Logro desbloqueado: ${achievement.name}.`);
        playSound('event');
      }
    }
  }

  function recipeUnlocked(recipe) {
    if (state.dreamTree.includes('inherited-kitchen')) return true;
    if (recipe.requiresGarden && !hasItem('urban-garden') && !hasItem('big-garden')) return false;
    if (['pasta', 'rice-egg', 'omelette'].includes(recipe.id) && (hasItem('pan-set') || hasItem('camp-stove'))) return true;
    if (recipe.id === 'salad' && hasItem('mini-fridge')) return true;
    return hasItem(recipe.item);
  }

  function rest() {
    let amount = 0;
    if (state.stage === 1 && hasItem('sleeping-bag')) amount = 30;
    else if (state.stage >= 4 && (hasItem('bed') || hasItem('mattress') || hasItem('double-bed') || hasItem('bathtub'))) amount = hasItem('double-bed') ? getMaxEnergy() * 1.2 : hasItem('bed') ? getMaxEnergy() : hasItem('mattress') ? 60 : getMaxEnergy();
    else if (state.stage >= 2 && (hasItem('mattress') || hasItem('bed'))) amount = hasItem('bed') ? getMaxEnergy() : 60;
    else if (state.upgrades.includes('short-nap')) amount = 25;
    else { showToast('Para descansar necesitas un saco de dormir o una cama.', 'alert'); return; }
    if (hasItem('curtains')) amount *= 2;
    if (state.buffs.noiseUntil > state.playSeconds && !hasItem('earplugs') && !hasItem('big-rug')) amount *= .5;
    if (state.upgrades.includes('deep-sleep')) amount *= 2;
    state.energy = clamp(state.energy + amount, 0, getMaxEnergy());
    if (state.mode === 'hard') state.satiety = Math.max(0, state.satiety - 1);
    if (state.energy >= getMaxEnergy() * .99) addReputation(.05);
    pushLog(`Descansaste y recuperaste ${Math.round(amount)} de energía.`);
    showToast(`Buen descanso: +${Math.round(amount)} energía.`);
    updateUI(true);
  }

  function showEvent() {
    if (state.activeEvent) return;
    const eventEffects = getAllEffects();
    const hardChance = state.mode === 'hard' ? .34 : 0;
    const luck = state.dreamTree.includes('beginner-luck') ? .1 : 0;
    const oratoryLuck = Number(state.skills?.oratory?.level || 0) * .04;
    const badChance = Math.max(0, hardChance - eventEffects.eventProtection - luck - eventEffects.luckyEvents * .25 - oratoryLuck);
    const canBad = !(state.dreamTree.includes('simple-life') && state.stage <= 2);
    const bad = canBad && Math.random() < badChance;
    if (bad && state.dreamTree.includes('second-chance') && state.lastBadEventDay !== state.day) {
      state.lastBadEventDay = state.day;
      state.nextEventAt = state.playSeconds + 45;
      showToast('Segunda oportunidad: has evitado un contratiempo hoy.');
      return;
    }
    if (bad) {
      const badEvents = ['rain', 'bill', 'noise', 'cold'];
      const event = badEvents[Math.floor(Math.random() * badEvents.length)];
      const protectedEvent = (event === 'rain' && hasItem('umbrella')) || (event === 'noise' && hasItem('earplugs')) || (event === 'cold' && hasItem('blanket'));
      if (protectedEvent) {
        showToast(`Un problema iba a aparecer, pero ${event === 'rain' ? 'el paraguas' : event === 'noise' ? 'los tapones' : 'la manta'} lo ha evitado.`);
        state.nextEventAt = state.playSeconds + 55 + Math.random() * 70;
        return;
      }
      if (event === 'rain' && hasItem('mudguards')) {
        state.buffs.rainUntil = state.playSeconds + 45;
        state.buffs.rainMult = .85;
      } else if (event === 'rain') {
        state.buffs.rainUntil = state.playSeconds + 60;
        state.buffs.rainMult = .7;
      } else if (event === 'bill') {
        if (getAllEffects().theftShield) showToast('El perro guardián ha protegido la caja del negocio.');
        else {
          const cost = Math.min(state.coins, Math.max(20, getMps() * 30));
          state.coins -= cost;
          pushLog(`Factura inesperada: −${formatNumber(cost)} €.`);
          showToast(`Factura inesperada: −${formatNumber(cost)} €. El cuaderno de cuentas ayuda a planificarse.`, 'alert');
        }
      } else if (event === 'noise') {
        state.buffs.noiseUntil = state.playSeconds + 50;
        showToast('Los vecinos hacen ruido. El descanso rinde menos.', 'alert');
      } else {
        state.buffs.coldUntil = state.playSeconds + 50;
        showToast('Noche fría: los clics cuestan más energía.', 'alert');
      }
      state.nextEventAt = state.playSeconds + (state.dreamTree.includes('second-chance') ? 86400 : 80 + Math.random() * 80);
      checkAchievements(); updateUI(true);
      return;
    }
    const events = [
      { id: 'ticket', title: 'Billete en el suelo', desc: 'Haz clic en «Recoger» antes de que vuele. Vale 60 segundos de MPS.', icon: '✦', reward: () => Math.max(20, getMps() * 60) },
      { id: 'tip', title: 'Propina generosa', desc: 'La plaza está de buen humor: MPC ×7 durante 15 segundos.', icon: '✳', reward: () => { state.buffs.clickUntil = state.playSeconds + 15; state.buffs.clickMult = 7; } },
      { id: 'client', title: 'Cliente fiel', desc: 'Un cliente vuelve: generadores ×2 durante 30 segundos.', icon: '♧', reward: () => { state.buffs.clientUntil = state.playSeconds + 30; } },
      { id: 'gift', title: 'Vecino generoso', desc: 'Te han guardado un plato caliente.', icon: '🍲', reward: () => { state.energy = getMaxEnergy(); state.satiety = clamp(state.satiety + 12, 0, getMaxSatiety()); } },
      { id: 'extra', title: 'Trabajo extra', desc: 'Un encargo rápido en el móvil: 3 minutos de MPS.', icon: '▯', reward: () => Math.max(50, getMps() * 180) },
      { id: 'applause', title: 'Aplausos del público', desc: 'Te escuchan en la plaza: MPC ×2 durante 20 s.', icon: '♫', reward: () => { state.buffs.clickUntil = state.playSeconds + 20; state.buffs.clickMult = 2; } },
    ];
    const event = events[Math.floor(Math.random() * events.length)];
    state.activeEvent = { id: event.id, title: event.title, desc: event.desc, icon: event.icon, expires: state.playSeconds + (event.id === 'ticket' ? 12 : 20), reward: event.reward.toString() };
    state._activeEventReward = event.reward;
    ui.eventLabel.textContent = event.title.toUpperCase();
    ui.event.hidden = false;
    playSound('event');
    showToast(`Ha aparecido algo: ${event.title}.`);
    updateUI(true);
  }

  function claimEvent() {
    if (!state.activeEvent) return;
    const event = state.activeEvent;
    const eventDefinitionId = event.id;
    let reward;
    if (eventDefinitionId === 'ticket') reward = Math.max(20, getMps() * 60);
    else if (eventDefinitionId === 'tip') { state.buffs.clickUntil = state.playSeconds + 15; state.buffs.clickMult = 7; }
    else if (eventDefinitionId === 'client') state.buffs.clientUntil = state.playSeconds + 30;
    else if (eventDefinitionId === 'gift') { state.energy = getMaxEnergy(); state.satiety = clamp(state.satiety + 12, 0, getMaxSatiety()); }
    else if (eventDefinitionId === 'extra') reward = Math.max(50, getMps() * 180);
    else if (eventDefinitionId === 'applause') { state.buffs.clickUntil = state.playSeconds + 20; state.buffs.clickMult = 2; }
    if (reward) {
      reward *= getAllEffects().eventMult;
      gainCoins(reward, event.title);
    }
    state.activeEvent = null;
    state.eventsClaimed += 1;
    ui.event.hidden = true;
    pushLog(`${event.title}: ${reward ? `+${formatNumber(reward)} €` : 'bonus temporal'}.`);
    showToast(reward ? `${event.title}: +${formatNumber(reward)} €.` : `${event.title}: bonus activo.`);
    playSound('event');
    checkAchievements(); updateUI(true);
  }

  function sceneIsNight() {
    const phase = (state.playSeconds % 180) / 180;
    return phase > .63 || phase < .16;
  }

  function nextGate() { return STAGE_GATES.find((entry) => entry.from === state.stage); }

  function updateStageGoal() {
    if (state.stage >= 12) {
      ui.nextTitle.textContent = state.ending ? 'El sueño cumplido' : 'Elige el final que quieres dejar';
      ui.nextCopy.textContent = state.ending ? `${ENDINGS.find((entry) => entry.id === state.ending)?.name || 'Proyecto completado'}. Puedes empezar una Nueva vida cuando quieras.` : 'Cada final tiene un coste y una escena distinta. Ya puedes elegir.';
      ui.nextPercent.textContent = state.ending ? '100%' : '12 / 12';
      ui.nextMeter.style.width = state.ending ? '100%' : '100%';
      ui.nextFoot.textContent = state.ending ? 'HISTORIA COMPLETADA' : 'PROYECTO SOÑADO';
      ui.nextIcon.textContent = '✳';
      return;
    }
    const gate = nextGate();
    const targetStage = STAGES[state.stage];
    if (!gate || !targetStage) return;
    const progress = targetStage.threshold <= 0 ? 1 : clamp(state.runEarned / targetStage.threshold, 0, 1);
    const gateReason = gateLockReason(gate);
    let progressText = `${formatNumber(state.runEarned)} / ${formatNumber(targetStage.threshold)} €`;
    if (state.stage === 1) progressText = `${Math.min(10, state.foodTried.length)}/10 comidas · ${state.reputation.toFixed(1).replace('.', ',')}/5 rep.`;
    ui.nextTitle.textContent = targetStage.name;
    ui.nextCopy.textContent = gateReason || `Ya puedes dar el paso: ${gate.name.toLowerCase()} (${costLabel(getGateCost(gate))}).`;
    ui.nextPercent.textContent = `${Math.floor(progress * 100)}%`;
    ui.nextMeter.style.width = `${progress * 100}%`;
    ui.nextFoot.textContent = progressText;
    ui.nextIcon.textContent = gate.icon;
  }

  function updateUI(forceRender = false) {
    const effects = getAllEffects();
    const mps = getMps();
    const mpc = getMpc();
    const maxEnergy = getMaxEnergy();
    const maxSatiety = getMaxSatiety();
    const stage = STAGES[state.stage - 1];
    const action = getAction(state.activeAction);
    ui.coins.textContent = `${formatNumber(state.coins)} €`;
    ui.earned.textContent = formatNumber(state.runEarned);
    ui.mps.textContent = formatRate(mps);
    ui.mpc.textContent = formatRate(mpc);
    const energyFactor = getEnergyFactor();
    ui.clickFactor.textContent = energyFactor < .99 ? `ENERGÍA ${Math.round(energyFactor * 100)} %` : 'ENERGÍA OK';
    ui.clickFactor.classList.toggle('is-low', energyFactor < .99);
    ui.energy.textContent = `${Math.floor(state.energy)} / ${Math.floor(maxEnergy)}`;
    ui.energyMeter.style.width = `${clamp(state.energy / maxEnergy * 100, 0, 100)}%`;
    ui.energyMeter.classList.toggle('is-low', state.energy < maxEnergy * .3);
    ui.satiety.textContent = `${Math.floor(state.satiety)} %`;
    ui.satietyMeter.style.width = `${clamp(state.satiety / maxSatiety * 100, 0, 100)}%`;
    ui.rep.textContent = formatNumber(state.reputation, 1);
    ui.comfort.textContent = `${formatNumber(getComfort())} C`;
    ui.comfortBonus.textContent = getComfort() > 0 ? `ENERGÍA +${Math.round(getComfort() * 1.5)} %` : 'CASA: —';
    ui.dreams.textContent = formatNumber(state.dreams);
    ui.stageKicker.innerHTML = `ETAPA ${String(state.stage).padStart(2, '0')} <span>/ 12</span> · ${esc(stage.area.toUpperCase())}`;
    ui.stageTitle.textContent = stage.name;
    ui.dayValue.textContent = `DÍA ${String(state.day || 1).padStart(2, '0')}`;
    ui.dayCycle.textContent = sceneIsNight() ? 'NOCHE EN EL BARRIO' : 'UN NUEVO DÍA';
    ui.sceneLocation.textContent = stage.area.toUpperCase();
    ui.sceneCaption.textContent = sceneCaption();
    ui.sceneCoords.textContent = `ZONA ${String(state.stage).padStart(2, '0')} — ${stage.short}`;
    ui.sceneHint.textContent = `CLIC EN LA ESCENA +${formatRate(mpc)} €`;
    ui.action.textContent = action.name;
    ui.actionDetail.textContent = action.desc;
    ui.clickLabel.textContent = action.short;
    ui.clickValue.textContent = formatRate(mpc * energyFactor);
    ui.clicks.textContent = formatNumber(state.runClicks);
    ui.clickPanel.classList.toggle('is-tired', energyFactor < .75);
    const activeWeather = state.buffs.rainUntil > state.playSeconds ? 'LLUVIA' : sceneIsNight() ? 'NOCHE TRANQUILA' : 'TIEMPO TRANQUILO';
    ui.weather.innerHTML = `<i></i> ${activeWeather}`;
    ui.weather.classList.toggle('is-rain', state.buffs.rainUntil > state.playSeconds);
    ui.modeLabel.textContent = state.mode === 'relaxed' ? 'TRANQUILO' : 'DIFÍCIL';
    $('#mode-toggle').classList.toggle('is-hard', state.mode === 'hard');
    updateStageGoal();
    renderFoodInventory();
    renderActivity();
    createOfflineNotice();
    if (state.activeEvent) {
      ui.event.hidden = false;
      const remaining = clamp((state.activeEvent.expires - state.playSeconds) / (state.activeEvent.id === 'ticket' ? 12 : 20), 0, 1);
      ui.eventTimer.style.transform = `scaleX(${remaining})`;
    } else ui.event.hidden = true;
    if (forceRender || Date.now() - lastUpdate > 900) {
      renderShop();
      lastUpdate = Date.now();
    }
  }

  function sceneCaption() {
    if (state.stage === 1) return state.clicksTotal < 10 ? 'Todavía no tienes mucho, pero tienes todo el día.' : 'Julián te saluda desde la esquina. Ya empiezas a ser alguien aquí.';
    if (state.stage === 2) return `Tu habitación ya tiene ${Math.floor(getComfort())} puntos de comodidad. Hazla tuya.`;
    if (state.stage === 3) return 'La bici abre calles nuevas. ¿Hasta dónde llegarás hoy?';
    if (state.stage === 4) return 'Un piso pequeño. Un montón de espacio para hacerlo a tu manera.';
    if (state.stage < 9) return `La gente del barrio ya conoce ${state.specialty ? BUSINESS_SPECIALTIES.find((entry) => entry.id === state.specialty)?.name : 'tu esfuerzo'}.`;
    if (state.stage < 12) return 'Lo que empezó en la plaza ahora llega a toda la ciudad.';
    return state.ending ? 'Tu historia vuelve a la plaza, pero ahora hay algo nuevo en ella.' : 'Has construido mucho. Ahora puedes elegir para quién.';
  }

  function renderFoodInventory() {
    const foods = FOODS.filter((entry) => Number(state.foodInventory[entry.id] || 0) > 0);
    const recipes = RECIPES.filter((entry) => Number(state.foodInventory[entry.id] || 0) > 0);
    const all = [...foods, ...recipes];
    ui.foodCount.textContent = all.length ? `${all.reduce((sum, food) => sum + Number(state.foodInventory[food.id] || 0), 0)} RACIONES` : 'BOLSA VACÍA';
    if (!all.length) {
      ui.foodInventory.innerHTML = '<div class="empty-food"><span>◌</span><p>Prueba algo de comer y aparecerá aquí.<br /><b>La energía se recupera comiendo.</b></p></div>';
      return;
    }
    ui.foodInventory.innerHTML = all.map((food) => `<div class="food-chip"><span class="food-chip-icon">${food.icon}</span><span class="food-chip-copy"><b>${esc(food.short || food.name)}</b><small>×${Number(state.foodInventory[food.id] || 0)}</small></span><button type="button" data-eat="${food.id}" data-recipe="${recipes.includes(food)}">COMER</button></div>`).join('');
  }

  function renderActivity() {
    const messages = state.log.length ? state.log : [{ text: 'Has llegado a la plaza con una moneda en el bolsillo.', time: Date.now() }];
    ui.activity.innerHTML = messages.slice(0, 4).map((entry, index) => `<p><i>${String(index + 1).padStart(2, '0')}</i><span>${esc(entry.text)}</span><time>${index === 0 ? 'AHORA' : timeAgo(entry.time)}</time></p>`).join('');
    ui.activityCount.textContent = hasItem('ledger') ? 'HISTORIAL COMPLETO' : 'ÚLTIMOS MOVIMIENTOS';
  }

  function timeAgo(timestamp) {
    const elapsed = Math.max(0, Date.now() - (Number(timestamp) || Date.now()));
    if (elapsed < 60000) return 'HACE UN MOMENTO';
    if (elapsed < 3600000) return `HACE ${Math.floor(elapsed / 60000)} MIN`;
    return `HACE ${Math.floor(elapsed / 3600000)} H`;
  }

  function renderShop() {
    const active = document.activeElement;
    const focusKey = active && active.dataset ? active.dataset.focuskey : '';
    const scrollTop = catalog.scrollTop;
    const renderers = { mejoras: renderImprovements, comida: renderFoods, generadores: renderGenerators, mapa: renderMap, progreso: renderProgress, suenos: renderDreams };
    const labels = {
      mejoras: 'Acciones, ropa, muebles y mejoras personales.',
      comida: 'Compra alimentos, guarda raciones y cocina recetas.',
      generadores: 'Contrata fuentes de ingresos. Cada unidad sube un 15 % su precio.',
      mapa: 'Transporte, barrios y los doce grandes saltos de tu vida.',
      progreso: 'Personajes, habilidades, misiones y logros del barrio.',
      suenos: 'Prestigio: empieza otra vida con ventajas permanentes.',
    };
    ui.catalogDescription.textContent = labels[activeTab];
    const content = renderers[activeTab]();
    catalog.innerHTML = content;
    catalog.scrollTop = scrollTop;
    ui.catalogVisible.textContent = `${activeTab.toUpperCase()} · ${state.stage.toString().padStart(2, '0')}/12`;
    if (focusKey) {
      const target = catalog.querySelector(`[data-focuskey="${CSS.escape(focusKey)}"]`);
      if (target) target.focus({ preventScroll: true });
    }
  }

  function section(title, subtitle, body) {
    return `<section class="shop-section"><div class="shop-section-head"><h3>${esc(title)}</h3><span>${esc(subtitle || '')}</span></div>${body}</section>`;
  }

  function sortCatalogEntries(entries, getCost, isLocked = () => false) {
    return [...entries].sort((a, b) => {
      const costA = getCost(a), costB = getCost(b);
      if (sortAvailable) {
        const rankA = isLocked(a) ? 2 : state.coins >= costA ? 0 : 1;
        const rankB = isLocked(b) ? 2 : state.coins >= costB ? 0 : 1;
        if (rankA !== rankB) return rankA - rankB;
      }
      return costA - costB;
    });
  }

  function renderImprovements() {
    const availableActions = sortCatalogEntries(ACTIONS, (entry) => entry.cost, (entry) => state.stage < entry.stage);
    const cards = availableActions.map((action) => renderActionCard(action)).join('');
    const currentStageObjects = sortCatalogEntries(OBJECTS.filter((entry) => ['mejoras', 'negocio'].includes(entry.group) && (entry.stage <= state.stage + 1 || hasItem(entry.id))), getActionCost, (entry) => Boolean(getObjectLockReason(entry)));
    const objectCards = currentStageObjects.map((entry) => renderObjectCard(entry)).join('');
    const gate = nextGate();
    const gateCard = gate ? renderGateCard(gate) : '';
    const clicks = sortCatalogEntries(CLICK_UPGRADES.filter((entry) => entry.stage <= state.stage + 1 || state.upgrades.includes(entry.id)), getActionCost, (entry) => state.stage < entry.stage).map((entry) => renderUpgradeCard(entry, 'click')).join('');
    const body = sortCatalogEntries(BODY_UPGRADES.filter((entry) => entry.stage <= state.stage + 1 || state.upgrades.includes(entry.id)), getActionCost, (entry) => state.stage < entry.stage).map((entry) => renderUpgradeCard(entry, 'body')).join('');
    const specialty = state.stage >= 6 ? renderSpecialtyCards() : '';
    return `${gateCard ? section('EL SIGUIENTE SALTO', 'etapa', `<div class="unlock-list">${gateCard}</div>`) : ''}${section('ACCIONES DE CLIC', 'elige tu oficio', `<div class="unlock-list">${cards}</div>`)}${section('OBJETOS Y SERVICIOS', `${currentStageObjects.length} desbloqueos`, `<div class="unlock-list">${objectCards || emptyState('Todavía no hay objetos aquí.', 'Sigue avanzando para descubrir nuevas mejoras.')}</div>`)}${specialty}${section('MEJORAS DE CLIC', 'multiplica el MPC', `<div class="unlock-list">${clicks}</div>`)}${section('CUERPO Y ENERGÍA', 'cuida de ti', `<div class="unlock-list">${body}</div>`)}`;
  }

  function renderActionCard(action) {
    const owned = state.actionsOwned.includes(action.id);
    const active = state.activeAction === action.id;
    const locked = state.stage < action.stage;
    const affordable = state.coins >= action.cost;
    const disabled = locked || (!owned && !affordable);
    const buttonText = active ? 'EN USO' : owned ? 'ELEGIR' : locked ? `ETAPA ${action.stage}` : action.cost === 0 ? 'GRATIS' : 'DESBLOQUEAR';
    return `<article class="unlock-card ${locked ? 'is-locked' : ''} ${owned ? 'is-owned' : ''}"><span class="unlock-icon">${locked ? '◌' : action.icon}</span><div class="unlock-main"><div class="unlock-topline"><h4>${esc(action.name)}</h4>${active ? '<span class="unlock-tag special">ACTIVO</span>' : ''}</div><p>${esc(action.desc)} · <b>${formatRate(action.mpc)} MPC</b></p></div><div class="unlock-side"><span class="unlock-cost">${action.cost ? costLabel(action.cost) : 'INICIO'}</span><button class="buy-button ${active ? 'action-active' : owned ? 'action-owned' : ''}" type="button" data-buy-action="${action.id}" data-focuskey="action-${action.id}" ${disabled ? 'disabled' : ''}>${buttonText}</button></div></article>`;
  }

  function renderObjectCard(entry) {
    const owned = hasItem(entry.id);
    const reason = getObjectLockReason(entry);
    const cost = getActionCost(entry);
    const affordable = state.coins >= cost;
    const isLocked = Boolean(reason);
    const disabled = owned || isLocked || !affordable;
    const buttonText = owned ? 'EN CASA' : isLocked ? 'BLOQUEADO' : affordable ? 'COMPRAR' : 'AHORRA';
    const subtitle = reason || entry.desc;
    const title = isLocked ? `◇ ${entry.name}` : entry.name;
    return `<article class="unlock-card ${isLocked ? 'is-locked' : ''} ${owned ? 'is-owned' : ''}"><span class="unlock-icon">${isLocked ? '◌' : entry.icon}</span><div class="unlock-main"><div class="unlock-topline"><h4>${esc(title)}</h4>${entry.comfort ? `<span class="unlock-tag">+${entry.comfort} C</span>` : ''}</div><p>${esc(subtitle)}</p></div><div class="unlock-side"><span class="unlock-cost">${owned ? 'COMPRADO' : entry.cost ? costLabel(cost) : entry.requiresClicks ? '100 CLICS' : 'GRATIS'}</span><button class="buy-button" type="button" data-buy-object="${entry.id}" data-focuskey="object-${entry.id}" ${disabled ? 'disabled' : ''}>${buttonText}</button></div></article>`;
  }

  function renderGateCard(gate) {
    const reason = gateLockReason(gate);
    const cost = getGateCost(gate);
    const enoughCoins = state.coins >= cost;
    const disabled = Boolean(reason) || !enoughCoins;
    const buttonText = reason ? 'BLOQUEADO' : enoughCoins ? gate.id === 'gate-dream' ? 'ENTRAR' : 'DAR EL PASO' : 'AHORRA';
    const requirementText = reason || (cost && !enoughCoins ? `Te faltan ${formatNumber(cost - state.coins)} € disponibles.` : gate.desc);
    return `<article class="unlock-card gate-card ${reason ? 'is-locked' : ''}"><span class="unlock-icon">${reason ? '◌' : gate.icon}</span><div class="unlock-main"><div class="unlock-topline"><h4>${esc(gate.name)}</h4><span class="unlock-tag special">ETAPA ${String(gate.to).padStart(2, '0')}</span></div><p>${esc(requirementText)}</p></div><div class="unlock-side"><span class="unlock-cost">${cost ? costLabel(cost) : 'DESBLOQUEO'}</span><button class="buy-button" type="button" data-buy-gate="${gate.id}" data-focuskey="gate-${gate.id}" ${disabled ? 'disabled' : ''}>${buttonText}</button></div></article>`;
  }

  function renderUpgradeCard(upgrade, type) {
    const owned = state.upgrades.includes(upgrade.id);
    const locked = state.stage < upgrade.stage;
    const cost = getActionCost(upgrade);
    const disabled = owned || locked || state.coins < cost;
    const desc = locked ? `Requisito: etapa ${upgrade.stage} · ${STAGES[upgrade.stage - 1].name}.` : upgrade.desc;
    return `<article class="unlock-card ${locked ? 'is-locked' : ''} ${owned ? 'is-owned' : ''}"><span class="unlock-icon">${locked ? '◌' : type === 'click' ? '✳' : '♡'}</span><div class="unlock-main"><div class="unlock-topline"><h4>${esc(upgrade.name)}</h4>${upgrade.mult ? '<span class="unlock-tag special">MPC ×' + upgrade.mult + '</span>' : ''}</div><p>${esc(desc)}</p></div><div class="unlock-side"><span class="unlock-cost">${owned ? 'COMPRADO' : costLabel(cost)}</span><button class="buy-button" type="button" data-buy-upgrade="${upgrade.id}" data-upgrade-type="${type}" data-focuskey="upgrade-${upgrade.id}" ${disabled ? 'disabled' : ''}>${owned ? 'MEJORADO' : locked ? 'BLOQUEADO' : state.coins >= cost ? 'MEJORAR' : 'AHORRA'}</button></div></article>`;
  }

  function renderSpecialtyCards() {
    const cards = BUSINESS_SPECIALTIES.map((specialty) => {
      const chosen = state.specialty === specialty.id;
      const locked = state.stage < 6;
      const cost = state.dreamTree.includes('business-plan') ? 0 : 50000;
      const disabled = chosen || Boolean(state.specialty) || locked || state.coins < cost;
      return `<article class="unlock-card ${locked ? 'is-locked' : ''} ${chosen ? 'is-owned' : ''}"><span class="unlock-icon">${locked ? '◌' : specialty.icon}</span><div class="unlock-main"><div class="unlock-topline"><h4>${esc(specialty.name)}</h4>${chosen ? '<span class="unlock-tag special">TU NEGOCIO</span>' : ''}</div><p>${esc(specialty.bonus)}</p></div><div class="unlock-side"><span class="unlock-cost">${chosen ? 'ELEGIDA' : cost ? costLabel(cost) : 'GRATIS'}</span><button class="buy-button" type="button" data-specialty="${specialty.id}" data-focuskey="specialty-${specialty.id}" ${disabled ? 'disabled' : ''}>${chosen ? 'ELEGIDA' : state.specialty ? 'BLOQUEADO' : state.coins >= cost ? 'ELEGIR' : 'AHORRA'}</button></div></article>`;
    }).join('');
    return section('ELIGE UNA ESPECIALIDAD', state.specialty ? 'tu camino de negocio' : 'desde la etapa 6', `<div class="unlock-list">${cards}</div>`);
  }

  function renderFoods() {
    const foods = FOODS.map((food) => {
      const owned = Number(state.foodInventory[food.id] || 0);
      const affordable = state.coins >= food.cost;
      return `<article class="unlock-card"><span class="unlock-icon">${food.icon}</span><div class="unlock-main"><div class="unlock-topline"><h4>${esc(food.name)}</h4>${state.foodTried.includes(food.id) ? '<span class="unlock-tag special">PROBADO</span>' : ''}</div><p>${esc(food.desc)} ${owned ? `Tienes ${owned} en la bolsa.` : 'Se compra por unidad.'}</p></div><div class="unlock-side"><span class="unlock-cost">${costLabel(food.cost)}</span><button class="buy-button" type="button" data-buy-food="${food.id}" data-focuskey="food-${food.id}" ${!affordable ? 'disabled' : ''}>${affordable ? 'COMPRAR' : 'AHORRA'}</button></div></article>`;
    }).join('');
    const recipeCards = RECIPES.map((recipe) => {
      const unlocked = recipeUnlocked(recipe);
      const affordable = state.coins >= recipe.cost;
      const inBag = Number(state.foodInventory[recipe.id] || 0);
      return `<article class="unlock-card ${unlocked ? '' : 'is-locked'}"><span class="unlock-icon">${unlocked ? recipe.icon : '◌'}</span><div class="unlock-main"><div class="unlock-topline"><h4>${esc(recipe.name)}</h4>${state.foodTried.includes(recipe.id) ? '<span class="unlock-tag special">PROBADO</span>' : ''}</div><p>${unlocked ? `+${recipe.energy} energía · +${recipe.satiety} saciedad. Receta de ${recipe.req.toLowerCase()}.` : `Requisito: ${recipe.req}.`}${inBag ? ` Tienes ${inBag}.` : ''}</p></div><div class="unlock-side"><span class="unlock-cost">${costLabel(recipe.cost)}</span><button class="buy-button" type="button" data-cook="${recipe.id}" data-focuskey="recipe-${recipe.id}" ${!unlocked || !affordable ? 'disabled' : ''}>${!unlocked ? 'BLOQUEADO' : affordable ? 'COCINAR' : 'AHORRA'}</button></div></article>`;
    }).join('');
    return `${section('COMIDA DE LA CALLE', '12 alimentos · compra por unidad', `<div class="unlock-list">${foods}</div>`)}${section('RECETAS DE CASA', 'fogones, horno e ingredientes', `<div class="unlock-list">${recipeCards}</div>`)}`;
  }

  function renderGenerators() {
    const cards = GENERATORS.map((generator) => renderGeneratorCard(generator)).join('');
    return `${section('INGRESOS AUTOMÁTICOS', 'coste ×1,15 por unidad', `<p class="catalog-intro">Cada generador suma MPS sin clics. Las mejoras duplican su producción con 1, 10 y 25 unidades.</p><div class="unlock-list">${cards}</div>`)}`;
  }

  function renderGeneratorCard(generator) {
    const count = genCount(generator.id);
    const locked = state.stage < generator.stage;
    const cost = generatorCost(generator);
    const affordable = state.coins >= cost;
    const currentMps = generator.mps * Math.pow(2, genUpgradeCount(generator.id)) * count;
    const upgradeButtons = generator.upgrades.map((name, tier) => {
      const requirement = [1, 10, 25][tier];
      const owned = Boolean(state.generatorUpgrades[generator.id]?.[tier]);
      const upgradeCost = generator.cost * (8 * Math.pow(4, tier));
      const ready = count >= requirement && !owned && state.coins >= upgradeCost && !locked;
      return count >= requirement || owned ? `<button class="generator-upgrade" type="button" data-gen-upgrade="${generator.id}" data-tier="${tier}" data-focuskey="genupgrade-${generator.id}-${tier}" title="${esc(name)} · ${costLabel(upgradeCost)}" ${owned || !ready ? 'disabled' : ''}>${owned ? '×2 OK' : `${name} ×2`}</button>` : '';
    }).join('');
    return `<article class="unlock-card generator-card ${locked ? 'is-locked' : ''}"><span class="unlock-icon">${locked ? '◌' : generator.icon}</span><div class="unlock-main"><div class="unlock-topline"><h4>${esc(generator.name)}</h4><span class="generator-count">×${count}</span></div><p>${locked ? `Requisito: etapa ${generator.stage} · ${STAGES[generator.stage - 1].name}.` : `${formatNumber(generator.mps)} MPS por unidad · ${formatNumber(currentMps)} MPS total.`}</p><span class="generator-stat">CADA UNIDAD: <b>${formatRate(generator.mps)} / s</b> · +15 % de coste</span></div><div class="generator-actions"><span class="unlock-cost">${locked ? `ETAPA ${generator.stage}` : costLabel(cost)}</span>${upgradeButtons}<button class="buy-button" type="button" data-buy-generator="${generator.id}" data-focuskey="generator-${generator.id}" ${locked || !affordable ? 'disabled' : ''}>${locked ? 'BLOQUEADO' : affordable ? 'CONTRATAR' : 'AHORRA'}</button></div></article>`;
  }

  function renderMap() {
    const stageCards = STAGES.map((stage) => {
      const done = state.stage > stage.id || Boolean(state.ending && stage.id === 12);
      const current = state.stage === stage.id;
      const gate = STAGE_GATES.find((entry) => entry.to === stage.id);
      const thresholdText = stage.id === 1 ? 'Punto de partida' : `${formatNumber(stage.threshold)} € acumulados`;
      const gateReason = gate && !done && !current ? `Necesitas llegar a ${formatNumber(stage.threshold)} € y completar la etapa anterior.` : '';
      return `<div class="map-stage-card ${done ? 'is-done' : ''} ${current ? 'is-current' : ''} ${!done && !current ? 'is-locked' : ''}"><span class="map-stage-index">${done ? '✓' : String(stage.id).padStart(2, '0')}</span><div class="map-stage-copy"><b>${esc(stage.name)}</b><small>${esc(stage.blurb)}</small></div><span class="map-requirement">${current ? 'AQUÍ' : done ? 'VIVIDA' : esc(gateReason || thresholdText)}</span></div>`;
    }).join('');
    const transport = OBJECTS.filter((entry) => entry.group === 'transporte' && (entry.stage <= state.stage + 1 || hasItem(entry.id))).map((entry) => renderObjectCard(entry)).join('');
    const zones = MAP_ZONES.map((zone) => {
      const unlocked = zone.stage <= state.stage || (zone.name === 'Mercadillo' && hasItem('neighborhood-map')) || (zone.name === 'Estación' && hasItem('bus-pass')) || (zone.name === 'Universidad' && hasItem('used-scooter')) || (zone.name === 'Isla privada' && getAllEffects().travel >= 1.5);
      return `<div class="map-stage-card ${unlocked ? 'is-done' : 'is-locked'}"><span class="map-stage-index">${unlocked ? '✓' : '◌'}</span><div class="map-stage-copy"><b>${esc(zone.name)}</b><small>${esc(zone.modifier)}</small></div><span class="map-requirement">${unlocked ? 'DESCUBIERTA' : esc(zone.req)}</span></div>`;
    }).join('');
    return `${section('LAS DOCE ETAPAS', 'tu historia', `<div class="unlock-list">${stageCards}</div>`)}${section('BARRIOS Y RUTAS', 'el mapa se descubre', `<div class="unlock-list">${zones}</div>`)}${section('TRANSPORTE', 'nuevas rutas y trabajos', `<div class="unlock-list">${transport || emptyState('Todavía no hay vehículos nuevos.', 'Sigue ahorrando para moverte más lejos.')}</div>`)}`;
  }

  function renderJobCard(job) {
    const done = state.completedJobs.includes(job.id);
    const reason = done ? 'Encargo completado.' : jobLockReason(job);
    const locked = Boolean(reason) && !done;
    const payout = job.pay * (1 + Number(state.skills?.languages?.level || 0) * .08);
    return `<article class="unlock-card ${locked ? 'is-locked' : ''} ${done ? 'is-owned' : ''}"><span class="unlock-icon">${locked ? '◌' : job.icon}</span><div class="unlock-main"><div class="unlock-topline"><h4>${esc(job.name)}</h4>${done ? '<span class="unlock-tag special">HECHO</span>' : ''}</div><p>${esc(done ? `Pagado. +${formatNumber(payout)} €.` : reason || `${job.req} · encargo de una vez.`)}</p></div><div class="unlock-side"><span class="unlock-cost">${done ? 'COBRADO' : `+${formatNumber(payout)} €`}</span><button class="buy-button" type="button" data-job="${job.id}" data-focuskey="job-${job.id}" ${locked || done ? 'disabled' : ''}>${done ? 'HECHO' : locked ? 'BLOQUEADO' : 'ACEPTAR'}</button></div></article>`;
  }

  function renderPetCard(pet) {
    const owned = state.pets.includes(pet.id);
    const reason = petLockReason(pet);
    const locked = Boolean(reason) && !owned;
    const affordable = state.coins >= pet.cost;
    return `<article class="unlock-card ${locked ? 'is-locked' : ''} ${owned ? 'is-owned' : ''}"><span class="unlock-icon">${locked ? '◌' : pet.icon}</span><div class="unlock-main"><div class="unlock-topline"><h4>${esc(pet.name)}</h4>${owned ? '<span class="unlock-tag special">EN CASA</span>' : ''}</div><p>${esc(owned ? pet.bonus : reason || pet.bonus)}</p></div><div class="unlock-side"><span class="unlock-cost">${owned ? 'ADOPTADA' : pet.cost ? costLabel(pet.cost) : 'MISIÓN'}</span><button class="buy-button" type="button" data-pet="${pet.id}" data-focuskey="pet-${pet.id}" ${owned || locked || !affordable ? 'disabled' : ''}>${owned ? 'EN CASA' : locked ? 'BLOQUEADO' : pet.cost ? 'ADOPTAR' : 'MISIÓN'}</button></div></article>`;
  }

  function renderProgress() {
    const skills = CLICK_SKILLS.map((skill) => {
      const progress = state.skills[skill.id] || { level: state.dreamTree.includes('mastered-skills') ? 2 : 0, xp: 0 };
      const needed = 20 + progress.level * 15;
      const cost = skill.baseCost * Math.pow(progress.level + 1, 2);
      return `<article class="skill-card"><span class="skill-level">N${progress.level}</span><div><h3>${esc(skill.name)}</h3><p>${esc(skill.desc)}</p><div class="progress-meter"><span style="width:${progress.level >= 5 ? 100 : clamp(progress.xp / needed * 100, 0, 100)}%"></span></div></div><button type="button" data-buy-skill="${skill.id}" data-focuskey="skill-${skill.id}" ${progress.level >= 5 || state.coins < cost ? 'disabled' : ''}>${progress.level >= 5 ? 'MAX' : `ENTRENAR · ${formatNumber(cost)} €`}</button></article>`;
    }).join('');
    const missions = MISSIONS.filter((mission) => state.stage >= mission.stage || state.completedMissions.includes(mission.id)).map((mission) => {
      const done = state.completedMissions.includes(mission.id);
      const ready = !done && mission.test(state);
      return `<article class="mission-card"><span class="mission-icon">${mission.icon}</span><div class="mission-copy"><h3>${esc(mission.person)} · ${esc(mission.title)}</h3><p>${esc(done ? `Completada. ${mission.rewardText}` : mission.desc)}</p></div><button type="button" data-mission="${mission.id}" data-focuskey="mission-${mission.id}" ${!ready ? 'disabled' : ''}>${done ? 'HECHA' : ready ? 'COBRAR' : 'EN CURSO'}</button></article>`;
    }).join('');
    const achievements = ACHIEVEMENTS.map((achievement) => {
      const done = state.achievements.includes(achievement.id);
      return `<article class="achievement-card ${done ? 'is-done' : ''}"><span class="achievement-medal">${done ? '✦' : '◌'}</span><div><b>${esc(achievement.name)}</b><small>${esc(achievement.desc)}</small></div><span>${done ? 'LOGRO' : 'OCULTO'}</span></article>`;
    }).join('');
    const jobs = TEMP_JOBS.map((job) => renderJobCard(job)).join('');
    const pets = PETS.map((pet) => renderPetCard(pet)).join('');
    return `${section('HABILIDADES', 'hasta nivel 5 · practica o entrena', `<div class="unlock-list">${skills}</div>`)}${section('TRABAJOS TEMPORALES', `${state.completedJobs.length}/${TEMP_JOBS.length} encargos`, `<div class="unlock-list">${jobs}</div>`)}${section('PERSONAS DEL BARRIO', 'misiones con recompensa', `<div class="unlock-list">${missions || emptyState('Aún no te conocen.', 'Hazte ver por la plaza y vuelve más adelante.')}</div>`)}${section('LOGROS', `${state.achievements.length}/${ACHIEVEMENTS.length} · +1 % MPS cada 10`, `<div class="unlock-list">${achievements}</div>`)}${section('MASCOTAS', `${state.pets.length}/${PETS.length} · compañía para el camino`, `<div class="unlock-list">${pets}</div>`)}${section('EVENTOS', `${state.eventsClaimed} recogidos`, `<div class="event-history-card"><p>La plaza tiene billetes, propinas, vecinos generosos y trabajos extra. En modo tranquilo no aparecen eventos malos; en difícil hay lluvia, facturas, frío y ruido.</p><p class="small-stat">MODO ACTUAL: ${state.mode === 'relaxed' ? 'TRANQUILO · SIN HAMBRE' : 'DIFÍCIL · HAMBRE Y CONTRATIEMPOS'}</p></div>`)}`;
  }

  function renderDreams() {
    const dreamGain = getDreamGain(state.runEarned);
    const canStart = state.runEarned >= 1000000000000;
    const prestigeCard = `<div class="progress-card"><h3>NUEVA VIDA</h3><p>${canStart ? `Si empiezas ahora, ganarás ${formatNumber(dreamGain)} Sueño${dreamGain === 1 ? '' : 's'}. Fórmula: ⌊(monedas acumuladas / 10¹²)⅓⌋.` : `Disponible al acumular 1 T. Te faltan ${formatNumber(Math.max(0, 1000000000000 - state.runEarned))} € de ingresos en esta vida.`}</p><span class="small-stat">SE CONSERVAN: LOGROS · MASCOTAS · PERSONAJES · ÁRBOL</span><button type="button" data-new-life="true" data-focuskey="new-life" ${!canStart ? 'disabled' : ''}>${canStart ? `EMPEZAR OTRA VIDA · +${formatNumber(dreamGain)} ✳` : 'AÚN NO'}</button></div>`;
    const tree = DREAM_TREE.map((entry) => {
      const owned = state.dreamTree.includes(entry.id);
      const affordable = state.dreams >= entry.cost;
      return `<article class="dream-card ${owned ? 'is-owned' : ''} ${!affordable && !owned ? 'is-locked' : ''}"><span class="dream-icon">✳</span><div class="dream-copy"><h3>${esc(entry.name)}</h3><p>${esc(entry.desc)}</p></div><button type="button" data-buy-dream="${entry.id}" data-focuskey="dream-${entry.id}" ${owned || !affordable ? 'disabled' : ''}>${owned ? 'PERMANENTE' : `${entry.cost} SUEÑO${entry.cost === 1 ? '' : 'S'}`}</button></article>`;
    }).join('');
    const endingCards = ENDINGS.map((ending) => {
      const complete = state.ending === ending.id;
      const unlocked = state.stage >= 12;
      const affordable = state.coins >= ending.cost;
      return `<article class="unlock-card ${!unlocked ? 'is-locked' : ''} ${complete ? 'is-owned' : ''}"><span class="unlock-icon">${unlocked ? ending.icon : '◌'}</span><div class="unlock-main"><div class="unlock-topline"><h4>${esc(ending.name)}</h4>${complete ? '<span class="unlock-tag special">TU FINAL</span>' : ''}</div><p>${esc(unlocked ? ending.desc : 'Requisito: llega a la etapa 12 y acumula 50 T.')}</p></div><div class="unlock-side"><span class="unlock-cost">${costLabel(ending.cost)}</span><button class="buy-button" type="button" data-ending="${ending.id}" data-focuskey="ending-${ending.id}" ${!unlocked || complete || !affordable ? 'disabled' : ''}>${complete ? 'COMPLETADO' : !unlocked ? 'BLOQUEADO' : affordable ? 'ELEGIR' : 'AHORRA'}</button></div></article>`;
    }).join('');
    return `${section('PRESTIGIO', `${formatNumber(state.dreams)} sueños`, prestigeCard)}${section('ÁRBOL DE SUEÑOS', 'bonus permanentes entre vidas', `<div class="unlock-list">${tree}</div>`)}${section('PROYECTO SOÑADO', 'elige un final · etapa 12', `<div class="unlock-list">${endingCards}</div>`)}`;
  }

  function emptyState(title, copy) { return `<div class="empty-catalog"><div><strong>${esc(title)}</strong><p>${esc(copy)}</p></div></div>`; }

  function getDreamGain(runEarned) {
    return Math.floor(Math.cbrt(Math.max(0, runEarned) / 1e12));
  }

  function switchTab(tab) {
    if (!['mejoras', 'comida', 'generadores', 'mapa', 'progreso', 'suenos'].includes(tab)) return;
    activeTab = tab;
    $$('.shop-tab').forEach((button) => {
      const active = button.dataset.tab === tab;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', String(active));
    });
    catalog.scrollTop = 0;
    renderShop();
  }

  function handleCatalogClick(event) {
    const target = event.target.closest('button');
    if (!target || target.disabled) return;
    if (target.dataset.buyAction) buyAction(target.dataset.buyAction);
    else if (target.dataset.buyObject) buyObject(target.dataset.buyObject);
    else if (target.dataset.buyFood) buyFood(target.dataset.buyFood);
    else if (target.dataset.cook) eatFood(target.dataset.cook, true);
    else if (target.dataset.eat) eatFood(target.dataset.eat, target.dataset.recipe === 'true');
    else if (target.dataset.buyUpgrade) buyUpgrade(target.dataset.buyUpgrade, target.dataset.upgradeType);
    else if (target.dataset.buyGenerator) buyGenerator(target.dataset.buyGenerator);
    else if (target.dataset.genUpgrade) buyGeneratorUpgrade(target.dataset.genUpgrade, Number(target.dataset.tier));
    else if (target.dataset.buyGate) buyStageGate(target.dataset.buyGate);
    else if (target.dataset.specialty) buySpecialty(target.dataset.specialty);
    else if (target.dataset.buySkill) buySkillLevel(target.dataset.buySkill);
    else if (target.dataset.mission) completeMission(target.dataset.mission);
    else if (target.dataset.job) completeJob(target.dataset.job);
    else if (target.dataset.pet) adoptPet(target.dataset.pet);
    else if (target.dataset.newLife) startNewLifePrompt();
    else if (target.dataset.buyDream) buyDreamUpgrade(target.dataset.buyDream);
    else if (target.dataset.ending) finishDreamProject(target.dataset.ending);
  }

  function buyDreamUpgrade(id) {
    const entry = DREAM_TREE.find((dream) => dream.id === id);
    if (!entry || state.dreamTree.includes(id)) return;
    if (state.dreams < entry.cost) { showToast(`Necesitas ${entry.cost} Sueño${entry.cost === 1 ? '' : 's'}.`, 'alert'); return; }
    state.dreams -= entry.cost;
    state.dreamTree.push(id);
    pushLog(`Árbol de Sueños: ${entry.name.toLowerCase()} será permanente.`);
    showToast(`Sueño permanente: ${entry.name}.`);
    updateUI(true);
  }

  function startNewLifePrompt() {
    if (state.runEarned < 1e12) return;
    const gained = getDreamGain(state.runEarned);
    openModal('NUEVA VIDA', `Empezarás de cero con ${formatNumber(gained)} Sueño${gained === 1 ? '' : 's'}.`, 'Se reinician monedas, muebles, vehículos y negocios. Conservas logros, mascotas, personajes y el árbol de Sueños.', [
      { label: 'SEGUIR AHORRANDO', text: 'Volver a la partida', action: closeModal },
      { label: `EMPEZAR · +${formatNumber(gained)} ✳`, primary: true, text: 'Empezar otra vida', action: () => startNewLife(gained) },
    ]);
  }

  function startNewLife(gained) {
    const keep = {
      dreams: state.dreams + gained,
      dreamTree: [...state.dreamTree],
      achievements: [...state.achievements],
      pets: [...state.pets],
      completedMissions: [...state.completedMissions],
      allTimeEarned: state.allTimeEarned,
      clicksTotal: state.clicksTotal,
      totalPlaySeconds: state.totalPlaySeconds,
      newLives: state.newLives + 1,
      ending: null,
      log: [],
      mode: state.mode,
    };
    state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    Object.assign(state, keep);
    if (state.dreamTree.includes('start-sandwich')) state.coins = 100;
    if (state.dreamTree.includes('inherited-rep')) state.reputation = 20;
    if (state.dreamTree.includes('spare-key')) { state.stage = 2; state.ownedItems.push('rental-contract'); }
    if (state.dreamTree.includes('childhood-bike')) { state.stage = Math.max(3, state.stage); state.ownedItems.push('bike-gateway'); }
    if (state.dreamTree.includes('dynasty')) state.generators.tips = { count: 10 };
    if (state.dreamTree.includes('mastered-skills')) for (const skill of CLICK_SKILLS) state.skills[skill.id] = { level: 2, xp: 0 };
    if (state.dreamTree.includes('inherited-kitchen')) state.ownedItems.push('stovetop', 'oven');
    if (state.dreamTree.includes('memorized-map')) state.zonesUnlocked = true;
    if (state.stage >= 2 && !state.ownedItems.includes('rental-contract')) state.ownedItems.push('rental-contract');
    if (state.stage >= 3 && !state.ownedItems.includes('bike-gateway')) state.ownedItems.push('bike-gateway');
    if (state.clicksTotal >= 100) state.ownedItems.push('library-card');
    state.runEarned = state.coins;
    state.lastSeen = Date.now();
    closeModal();
    pushLog(`Nueva vida número ${state.newLives}. El barrio vuelve a empezar.`);
    showToast(`Nueva vida. +${formatNumber(gained)} Sueño${gained === 1 ? '' : 's'} permanente.`);
    playSound('gate');
    activeTab = 'mejoras';
    updateUI(true); saveState();
  }

  function finishDreamProject(id) {
    const ending = ENDINGS.find((entry) => entry.id === id);
    if (!ending || state.stage < 12 || state.coins < ending.cost) return;
    if (!spendCoins(ending.cost)) return;
    state.ending = id;
    if (id === 'free-school') state.reputation = Math.max(state.reputation, 100);
    if (id === 'seaside') state.ownedItems.push('ending-comfort');
    pushLog(`Proyecto soñado completado: ${ending.name}.`);
    showToast(`Final desbloqueado: ${ending.name}. Puedes empezar una Nueva vida.`);
    playSound('gate');
    checkAchievements(); updateUI(true);
  }

  function openModal(kicker, title, copy, actions = []) {
    $('#modal-kicker').textContent = kicker;
    $('#modal-title').textContent = title;
    $('#modal-copy').textContent = copy;
    const actionsNode = $('#modal-actions');
    actionsNode.innerHTML = actions.map((entry, index) => `<button type="button" data-modal-action="${index}" class="${entry.primary ? 'primary' : ''}">${esc(entry.label)}</button>`).join('');
    pendingModalAction = actions;
    modal.hidden = false;
    document.body.classList.add('modal-open');
  }
  function closeModal() { modal.hidden = true; document.body.classList.remove('modal-open'); pendingModalAction = null; }

  function handleModalClick(event) {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.id === 'modal-close') { closeModal(); return; }
    if (button.dataset.modalAction !== undefined) {
      const action = pendingModalAction?.[Number(button.dataset.modalAction)];
      if (action?.action) action.action();
    }
  }

  function updateSceneSize() {
    const rect = sceneCanvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.round(rect.width * dpr);
    const height = Math.round(rect.height * dpr);
    if (sceneCanvas.width !== width || sceneCanvas.height !== height) {
      sceneCanvas.width = width;
      sceneCanvas.height = height;
    }
    canvasScaleX = width / WORLD.width;
    canvasScaleY = height / WORLD.height;
    sceneCtx.setTransform(canvasScaleX, 0, 0, canvasScaleY, 0, 0);
  }

  if ('ResizeObserver' in window) {
    resizeObserver = new ResizeObserver(updateSceneSize);
    resizeObserver.observe(sceneWrap);
  } else window.addEventListener('resize', updateSceneSize, { passive: true });
  updateSceneSize();

  function roundedRect(context, x, y, width, height, radius, fill, stroke = null, lineWidth = 1) {
    const r = Math.min(radius, width / 2, height / 2);
    context.beginPath();
    context.moveTo(x + r, y);
    context.arcTo(x + width, y, x + width, y + height, r);
    context.arcTo(x + width, y + height, x, y + height, r);
    context.arcTo(x, y + height, x, y, r);
    context.arcTo(x, y, x + width, y, r);
    context.closePath();
    if (fill) { context.fillStyle = fill; context.fill(); }
    if (stroke) { context.strokeStyle = stroke; context.lineWidth = lineWidth; context.stroke(); }
  }

  function circle(x, y, radius, fill, stroke = null, line = 1) {
    sceneCtx.beginPath(); sceneCtx.arc(x, y, radius, 0, Math.PI * 2);
    if (fill) { sceneCtx.fillStyle = fill; sceneCtx.fill(); }
    if (stroke) { sceneCtx.strokeStyle = stroke; sceneCtx.lineWidth = line; sceneCtx.stroke(); }
  }

  function drawScene(time, deltaTime = 0) {
    if (!sceneCanvas.width) updateSceneSize();
    sceneCtx.setTransform(canvasScaleX, 0, 0, canvasScaleY, 0, 0);
    const context = sceneCtx;
    const night = sceneIsNight();
    const palette = night
      ? { sky1: '#344958', sky2: '#768d86', far: '#73827a', wall: '#bc9f77', road: '#727c70', ground: '#c5b48f', window: '#f3d998', shadow: 'rgba(34,49,46,.18)' }
      : { sky1: '#9bc7ba', sky2: '#dce3c2', far: '#8eaa86', wall: '#d8b58f', road: '#a6a391', ground: '#e8d8b5', window: '#ffe39b', shadow: 'rgba(59,69,48,.13)' };
    const sky = context.createLinearGradient(0, 0, 0, 320);
    sky.addColorStop(0, palette.sky1); sky.addColorStop(1, palette.sky2);
    context.fillStyle = sky; context.fillRect(0, 0, WORLD.width, WORLD.height);
    const sunX = night ? 820 : 780;
    circle(sunX, night ? 76 : 83, night ? 24 : 29, night ? '#e6dfbd' : '#f8d889');
    if (night) {
      for (let i = 0; i < 24; i += 1) {
        const x = (i * 167 + 38) % WORLD.width;
        const y = 25 + (i * 41 % 130);
        circle(x, y, i % 4 === 0 ? 1.6 : .9, 'rgba(255,248,208,.72)');
      }
    }
    drawBackgroundTown(palette);
    const scene = STAGES[state.stage - 1]?.scene || 'street';
    if (scene === 'street') drawStreetScene(palette);
    else if (scene === 'room') drawRoomScene(palette);
    else if (scene === 'bike') drawBikeScene(palette);
    else if (scene === 'flat') drawFlatScene(palette);
    else if (scene === 'motor') drawMotorScene(palette);
    else if (scene === 'stall') drawStallScene(palette);
    else if (scene === 'shop') drawShopScene(palette);
    else if (scene === 'team') drawTeamScene(palette);
    else if (scene === 'house') drawHouseScene(palette);
    else if (scene === 'chain') drawChainScene(palette);
    else if (scene === 'company') drawCompanyScene(palette);
    else drawDreamScene(palette);
    drawCharacter(palette, time);
    drawForeground(palette);
    drawSceneParticles(deltaTime);
  }

  function drawBackgroundTown(palette) {
    const context = sceneCtx;
    const blocks = [
      { x: 10, w: 150, h: 140, c: '#b5ab8a' }, { x: 165, w: 195, h: 185, c: '#c49b7d' }, { x: 365, w: 115, h: 145, c: '#8ea69a' },
      { x: 810, w: 180, h: 178, c: '#bfaa83' }, { x: 650, w: 150, h: 132, c: '#aab594' }, { x: 477, w: 170, h: 162, c: '#c7a88a' },
    ];
    for (const block of blocks) {
      const y = 226 - block.h;
      context.fillStyle = block.c; context.fillRect(block.x, y, block.w, block.h);
      context.fillStyle = 'rgba(72,73,58,.14)'; context.fillRect(block.x, y, block.w, 7);
      context.fillStyle = 'rgba(245,233,195,.72)';
      for (let wx = block.x + 18; wx < block.x + block.w - 12; wx += 34) {
        for (let wy = y + 25; wy < 202; wy += 35) {
          roundedRect(context, wx, wy, 15, 19, 2, nightColor(palette) ? '#e9cc83' : 'rgba(244,231,190,.7)');
          if (nightColor(palette)) { context.fillStyle = 'rgba(255,226,147,.18)'; context.fillRect(wx - 3, wy - 3, 21, 25); }
        }
      }
      context.fillStyle = 'rgba(80,77,58,.22)'; context.fillRect(block.x + 11, 219, block.w - 22, 7);
    }
    context.fillStyle = palette.shadow;
    context.beginPath(); context.moveTo(0, 230); context.lineTo(1000, 222); context.lineTo(1000, 455); context.lineTo(0, 455); context.fill();
  }
  function nightColor(palette) { return palette.sky1 === '#344958'; }

  function drawStreetScene(palette) {
    const c = sceneCtx;
    c.fillStyle = '#cbbd9e'; c.fillRect(0, 230, 1000, 76);
    c.fillStyle = '#8d8a78'; c.fillRect(0, 306, 1000, 149);
    c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(0, 304, 1000, 3);
    for (let x = 15; x < 1000; x += 85) { c.fillStyle = 'rgba(83,82,68,.17)'; c.fillRect(x, 242, 51, 2); }
    c.fillStyle = 'rgba(239,230,194,.55)';
    for (let x = 60; x < 980; x += 160) c.fillRect(x, 377, 72, 5);
    // familiar plaza tree and bench
    drawTree(110, 239, 1.05, '#6e9364');
    roundedRect(c, 145, 286, 104, 12, 3, '#93684d');
    c.fillStyle = '#6b5946'; c.fillRect(155, 298, 7, 25); c.fillRect(232, 298, 7, 25);
    if (hasItem('neighborhood-map')) { roundedRect(c, 834, 226, 60, 78, 3, '#809571', '#536d54', 2); c.fillStyle = '#eff0d2'; c.fillRect(843, 237, 42, 44); c.strokeStyle = '#719067'; c.beginPath(); c.moveTo(848, 262); c.lineTo(858, 248); c.lineTo(873, 266); c.stroke(); }
    if (hasItem('radio')) { drawRadio(308, 286); }
    if (hasItem('cart')) drawCart(715, 328);
    if (hasItem('sleeping-bag')) drawSleepingBag(570, 369);
    if (hasItem('umbrella')) drawUmbrella(610, 271);
    if (hasItem('backpack')) drawBackpack(472, 309);
    if (hasItem('cactus')) drawPlant(760, 298, .55);
    if (state.stage === 1 && state.clicksTotal > 35) drawNeighbor(865, 320, '#c5896a', 'neighbor');
  }

  function drawRoomScene(palette) {
    const c = sceneCtx;
    c.fillStyle = '#d4c6a5'; c.fillRect(0, 0, 1000, 455);
    c.fillStyle = '#c2ab88'; c.fillRect(0, 320, 1000, 135);
    c.fillStyle = '#b98d70'; c.fillRect(0, 0, 22, 455); c.fillRect(978, 0, 22, 455);
    drawWindow(774, 75, 150, 126, palette);
    roundedRect(c, 0, 311, 1000, 11, 2, '#98765b');
    if (hasItem('mattress') || hasItem('bed') || state.dreamTree.includes('spare-key')) drawBed(180, 278, hasItem('bed') || state.dreamTree.includes('spare-key'));
    if (hasItem('nightstand')) drawSideTable(309, 296);
    if (hasItem('small-desk') || hasItem('refurb-laptop')) drawDesk(623, 273, hasItem('refurb-laptop'));
    if (hasItem('table-lamp')) drawLamp(360, 276);
    if (hasItem('cactus') || hasItem('houseplants')) drawPlant(868, 306, .78);
    if (hasItem('poster')) drawPoster(474, 97);
    if (hasItem('mini-fridge')) drawFridge(75, 238);
    if (hasItem('camp-stove')) drawStove(485, 305);
    if (hasItem('small-tv')) drawTv(884, 271);
    if (hasItem('speaker')) drawRadio(703, 296);
    if (hasItem('rug')) roundedRect(c, 292, 340, 397, 67, 9, '#b88068');
    if (hasItem('mirror')) drawMirror(89, 80);
    if (hasItem('family-photo')) drawPoster(556, 100, '#8aa581');
  }

  function drawBikeScene(palette) {
    drawStreetScene(palette);
    sceneCtx.fillStyle = '#e4d2ad'; sceneCtx.fillRect(0, 235, 1000, 4);
    drawShopAwning(744, 174, '#b36f59');
    drawBike(690, 335, .95, '#4e7759');
    drawStreetLamp(558, 251);
    if (hasItem('bike-basket')) drawBikeBasket(699, 302);
    if (state.stage >= 3) { drawNeighbor(843, 323, '#83a2a0', 'courier'); }
    if (hasItem('bike-lights') && sceneIsNight()) { circle(715, 312, 11, 'rgba(255,238,155,.3)'); }
  }

  function drawFlatScene(palette) {
    const c = sceneCtx;
    c.fillStyle = '#e2d6bd'; c.fillRect(0, 0, 1000, 455);
    c.fillStyle = '#a98e6e'; c.fillRect(0, 340, 1000, 115);
    c.fillStyle = '#b69978'; c.fillRect(0, 326, 1000, 14);
    drawWindow(746, 52, 182, 142, palette);
    // kitchen and living space
    roundedRect(c, 22, 206, 180, 136, 4, '#b8c5a8');
    c.fillStyle = '#77917e'; c.fillRect(32, 230, 160, 13);
    if (hasItem('fridge') || hasItem('mini-fridge')) drawFridge(45, 257, true);
    if (hasItem('stovetop') || hasItem('oven')) drawStove(149, 278);
    if (hasItem('used-sofa') || hasItem('sofa-bed')) drawSofa(329, 296);
    if (hasItem('coffee-table')) roundedRect(c, 433, 330, 116, 13, 4, '#987557');
    if (hasItem('tv32') || hasItem('tv55') || hasItem('small-tv')) drawTv(597, 253);
    if (hasItem('double-bed') || hasItem('bed')) drawBed(778, 300, true);
    if (hasItem('urban-garden') || hasItem('flower-pots') || hasItem('houseplants')) drawPlant(922, 320, .85);
    if (hasItem('balcony-table')) { roundedRect(c, 848, 240, 92, 8, 3, '#8b755e'); circle(862, 269, 9, '#a77b5e'); circle(925, 269, 9, '#a77b5e'); }
    if (hasItem('ceiling-painting')) drawPoster(508, 89);
  }

  function drawMotorScene(palette) {
    drawStreetScene(palette);
    drawShopAwning(690, 165, '#698c74');
    if (hasItem('old-van') || state.stage >= 5) drawVan(704, 306);
    else drawBike(704, 337, .8, '#6b845b');
    drawStreetLamp(525, 248);
    drawNeighbor(860, 325, '#d19b5d', 'courier');
  }

  function drawStallScene(palette) {
    const c = sceneCtx;
    c.fillStyle = '#b9cdb0'; c.fillRect(0, 226, 1000, 80);
    c.fillStyle = '#969584'; c.fillRect(0, 306, 1000, 149);
    drawTree(120, 228, .8, '#759469');
    if (hasItem('market-table') || state.stage >= 6) {
      roundedRect(c, 550, 203, 330, 125, 6, '#b98660', '#755d48', 2);
      c.fillStyle = '#e1c773'; c.fillRect(538, 189, 355, 30);
      for (let x = 548; x < 890; x += 42) { c.fillStyle = (Math.floor(x/42)%2) ? '#f1de9b' : '#709576'; c.fillRect(x, 189, 22, 30); }
      c.fillStyle = '#80624a'; c.fillRect(565, 327, 14, 73); c.fillRect(852, 327, 14, 73);
      if (hasItem('scale-bags')) drawCrates(602, 247);
      if (hasItem('painted-sign')) drawSign(640, 128, state.specialty ? BUSINESS_SPECIALTIES.find((entry) => entry.id === state.specialty)?.name : 'PUESTO DEL BARRIO');
      if (hasItem('cash-box')) drawCashBox(790, 249);
      if (hasItem('first-helper')) drawNeighbor(817, 311, '#83a2a0', 'helper');
    }
    drawNeighbor(452, 324, '#b8785c', 'customer');
  }

  function drawShopScene(palette) {
    const c = sceneCtx;
    c.fillStyle = '#bdd0bd'; c.fillRect(0, 224, 1000, 85);
    c.fillStyle = '#9a9985'; c.fillRect(0, 309, 1000, 146);
    drawShopAwning(294, 130, '#477e58');
    roundedRect(c, 292, 194, 420, 168, 5, '#d2b392', '#8b7159', 2);
    roundedRect(c, 328, 215, 114, 102, 3, '#bad2c2', '#67816b', 3);
    roundedRect(c, 458, 215, 215, 102, 3, '#b6c9ba', '#67816b', 3);
    if (hasItem('shop-shelves') || state.stage >= 7) { drawShelves(474, 227); drawShelves(580, 227); }
    if (hasItem('register') || state.stage >= 7) drawCashBox(348, 310);
    if (hasItem('shop-window') || state.stage >= 7) { circle(385, 265, 13, '#e1c570'); circle(529, 265, 12, '#d68355'); circle(633, 262, 11, '#839b64'); }
    if (hasItem('neon-sign')) drawSign(383, 164, 'TU TIENDA');
    drawNeighbor(742, 326, '#d29d6b', 'customer');
    if (hasItem('second-employee')) drawNeighbor(520, 326, '#789b78', 'helper');
  }

  function drawTeamScene(palette) {
    drawShopScene(palette);
    for (let i = 0; i < 4; i += 1) drawNeighbor(190 + i * 96, 327 + (i % 2) * 12, ['#af7e64','#8d9b76','#c19a62','#728d9d'][i], 'worker');
    if (hasItem('team-five')) drawSign(500, 103, 'EQUIPO DEL BARRIO');
  }

  function drawHouseScene(palette) {
    const c = sceneCtx;
    c.fillStyle = '#c4d8c0'; c.fillRect(0, 231, 1000, 75);
    c.fillStyle = '#77986c'; c.fillRect(0, 306, 1000, 149);
    // home silhouette
    c.fillStyle = '#d3ad84'; c.fillRect(340, 169, 360, 191);
    c.fillStyle = '#9b684c'; c.beginPath(); c.moveTo(302, 177); c.lineTo(518, 63); c.lineTo(740, 177); c.closePath(); c.fill();
    roundedRect(c, 394, 205, 97, 80, 3, '#8ea9a0', '#6b7d63', 3);
    roundedRect(c, 535, 205, 97, 80, 3, '#8ea9a0', '#6b7d63', 3);
    roundedRect(c, 485, 286, 66, 74, 3, '#88664e');
    circle(540, 325, 3, '#e0bd69');
    drawTree(187, 267, 1.35, '#638956'); drawTree(793, 252, 1.1, '#759861');
    if (hasItem('lawn') || state.stage >= 9) { c.fillStyle = '#83a56d'; c.fillRect(0, 368, 1000, 87); }
    if (hasItem('big-garden') || hasItem('urban-garden')) drawGarden(120, 353);
    if (hasItem('chicken-coop')) drawCrates(844, 350);
    if (hasItem('pool')) { roundedRect(c, 704, 345, 158, 55, 19, '#84bdbe', '#f2e5c2', 3); }
    if (state.pets.includes('mimi')) drawCat(305, 373);
    if (hasItem('home-solar')) { c.fillStyle = '#426a71'; for (let i=0;i<5;i++) c.fillRect(400+i*39, 154, 31, 13); }
    if (hasItem('garage')) drawVan(87, 363, .65);
  }

  function drawChainScene(palette) {
    const c = sceneCtx;
    c.fillStyle = '#b6cabb'; c.fillRect(0, 220, 1000, 92); c.fillStyle = '#929383'; c.fillRect(0, 312, 1000, 143);
    drawShopAwning(120, 172, '#4a7652'); drawShopAwning(428, 148, '#b1795a'); drawShopAwning(720, 124, '#617e87');
    drawStorefront(125, 208, '#dec29c'); drawStorefront(431, 184, '#e4c7a4'); drawStorefront(723, 160, '#ddc19b');
    drawNeighbor(280, 337, '#c98e62', 'customer'); drawNeighbor(590, 337, '#829778', 'customer'); drawNeighbor(848, 337, '#899eb0', 'customer');
    drawSign(437, 95, state.specialty ? BUSINESS_SPECIALTIES.find((entry)=>entry.id===state.specialty)?.name.toUpperCase() : 'DE CERO');
  }

  function drawCompanyScene(palette) {
    const c = sceneCtx;
    c.fillStyle = '#adc4c1'; c.fillRect(0,0,1000,455);
    for (let i=0;i<8;i++) {
      const x=80+i*112, h=130+(i*51%180);
      c.fillStyle=['#78959a','#8ba9a1','#d1c2a2','#889a8c'][i%4]; c.fillRect(x,225-h,85,h);
      c.fillStyle='rgba(240,230,185,.7)'; for(let wy=240-h;wy<220;wy+=27) for(let wx=x+12;wx<x+72;wx+=23)c.fillRect(wx,wy,11,12);
    }
    c.fillStyle='#7c8274';c.fillRect(0,305,1000,150);
    c.fillStyle='#304d49'; c.beginPath();c.moveTo(388,305);c.lineTo(431,66);c.lineTo(587,66);c.lineTo(632,305);c.closePath();c.fill();
    c.fillStyle='#8bb2a4';for(let y=92;y<285;y+=30)for(let x=434;x<587;x+=30)c.fillRect(x,y,19,16);
    drawSign(462,41,'TU EMPRESA');
    if (hasItem('foundation')) drawNeighbor(158,330,'#bf8d68','neighbor');
  }

  function drawDreamScene(palette) {
    drawHouseScene(palette);
    const c=sceneCtx;
    if (state.ending === 'seaside') {
      c.fillStyle='#78b5b1';c.fillRect(0,322,1000,133);c.fillStyle='rgba(255,241,188,.45)';for(let y=342;y<448;y+=21)c.fillRect(0,y,1000,2);
      drawTree(800,234,1.2,'#56896e');
    } else if (state.ending === 'nature') {
      drawTree(63,290,1.8,'#4d895e');drawTree(917,280,1.8,'#4b845b');drawGarden(140,355);
    } else if (state.ending === 'free-school') {
      drawSign(438,90,'ESCUELA PARA TODOS');
    } else if (state.ending === 'around-world') {
      drawAirplane(780,86);
    } else if (state.ending === 'bike-workshop') {
      drawBike(705,355,1.25,'#5f8053');drawSign(410,88,'BICIS PARA TODOS');
    } else if (state.ending === 'every-neighborhood') {
      drawSign(420,88,'CAFÉ EN CADA BARRIO');
    }
    if (state.ending) drawConfetti(sceneTime);
  }

  function drawForeground(palette) {
    const c = sceneCtx;
    c.fillStyle = 'rgba(71,78,62,.1)';
    c.fillRect(0, WORLD.height - 13, WORLD.width, 13);
    for (let i = 0; i < 36; i += 1) {
      const x = (i * 97 + 17) % WORLD.width;
      const y = 406 + (i * 29 % 45);
      c.fillStyle = i % 2 ? 'rgba(70,76,58,.15)' : 'rgba(255,250,220,.2)';
      c.fillRect(x, y, 2 + i % 3, 1);
    }
  }

  function drawCharacter(palette, now) {
    const c = sceneCtx;
    const bounce = clickPulse > 0 ? Math.sin((.18 - clickPulse) / .18 * Math.PI) * 10 : Math.sin(now * 2.7) * 2;
    const x = state.stage === 1 ? 466 : state.stage === 2 ? 490 : 438;
    const floorY = state.stage === 2 ? 367 : state.stage === 4 ? 371 : state.stage === 9 ? 376 : 372;
    const y = floorY + bounce;
    // shadow
    c.fillStyle = 'rgba(42,55,43,.17)'; c.beginPath(); c.ellipse(x, floorY + 2, 29, 7, 0, 0, Math.PI*2); c.fill();
    // feet and trousers
    roundedRect(c, x - 18, y - 33, 14, 33, 5, '#3b4b43');
    roundedRect(c, x + 4, y - 33, 14, 33, 5, '#43564a');
    roundedRect(c, x - 20, y - 5, 18, 6, 3, '#6b5944'); roundedRect(c, x + 3, y - 5, 18, 6, 3, '#6b5944');
    // torso hoodie
    roundedRect(c, x - 25, y - 81, 50, 53, 11, state.stage < 3 ? '#6f8e72' : state.stage < 6 ? '#527b61' : '#426b50', '#445c48', 2);
    c.fillStyle = 'rgba(244,237,203,.2)';c.fillRect(x-1,y-76,2,47);
    // arms swing slightly
    const swing = Math.sin(now * 2.2) * 5;
    c.save();c.translate(x-23,y-72);c.rotate(-.2 + swing*.025);roundedRect(c,-5,0,12,39,6,'#d0a07d');c.restore();
    c.save();c.translate(x+17,y-72);c.rotate(.2 - swing*.025);roundedRect(c,-5,0,12,39,6,'#d0a07d');c.restore();
    // neck and face
    roundedRect(c,x-7,y-91,14,14,5,'#c68f6c');
    circle(x,y-106,21,'#d9a17e','#986b56',1.5);
    // hair
    c.fillStyle='#514536';c.beginPath();c.ellipse(x-2,y-117,21,12,-.1,Math.PI,Math.PI*2);c.lineTo(x+19,y-105);c.lineTo(x+11,y-112);c.lineTo(x-13,y-109);c.closePath();c.fill();
    circle(x+7,y-104,1.5,'#483a31');
    c.strokeStyle='#9b6254';c.lineWidth=1.4;c.beginPath();c.arc(x+3,y-98,6,.25,1.5);c.stroke();
    if (hasItem('cap')) { c.fillStyle='#4e7454';c.beginPath();c.ellipse(x,y-119,23,8,0,Math.PI,Math.PI*2);c.fill();c.fillRect(x-20,y-120,38,7); }
    if (hasItem('backpack')) drawBackpack(x+26,y-59,.7);
    drawClickProp(state.activeAction, x, y, now);
    if (state.stage >= 5) { c.fillStyle='#798f65';c.fillRect(x-21,y-31,42,4); }
    if (state.stage >= 7) { c.fillStyle='#a55d49';c.fillRect(x-7,y-75,14,30); }
  }

  function drawClickProp(actionId, x, y, now) {
    const c = sceneCtx;
    c.save();
    if (actionId === 'ground') {
      if (clickPulse > 0 || Math.sin(now * 2) > .985) {
        circle(x + 30, y - 4, 5, '#d8b95f', '#937c43', 1);
        c.strokeStyle = 'rgba(246,225,153,.75)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x + 30, y - 15); c.lineTo(x + 30, y - 21); c.moveTo(x + 20, y - 9); c.lineTo(x + 16, y - 13); c.moveTo(x + 40, y - 9); c.lineTo(x + 44, y - 13); c.stroke();
      }
    } else if (actionId === 'cans') {
      roundedRect(c, x + 25, y - 55, 16, 24, 3, '#b5b9a4', '#6b786e', 1.5); c.fillStyle = '#7d9d76'; c.fillRect(x + 27, y - 49, 12, 7);
    } else if (actionId === 'cardboard') {
      roundedRect(c, x + 24, y - 52, 25, 20, 2, '#bd9160', '#806849', 1); c.strokeStyle = '#98764f'; c.beginPath(); c.moveTo(x + 36, y - 51); c.lineTo(x + 36, y - 33); c.moveTo(x + 25, y - 45); c.lineTo(x + 47, y - 45); c.stroke();
    } else if (actionId === 'flyers') {
      c.save(); c.translate(x + 33, y - 42); c.rotate(-.12); roundedRect(c, -10, -14, 20, 27, 1, '#f3e6bc', '#8d8a6a', 1); c.fillStyle = '#6c9072'; c.fillRect(-6, -8, 12, 3); c.fillStyle = '#c58767'; c.fillRect(-6, -2, 9, 2); c.restore();
    } else if (actionId === 'windows') {
      c.strokeStyle = '#687d70'; c.lineWidth = 3; c.beginPath(); c.moveTo(x + 28, y - 30); c.lineTo(x + 42, y - 57); c.stroke(); c.strokeStyle = '#d8e4d2'; c.lineWidth = 5; c.beginPath(); c.moveTo(x + 34, y - 58); c.lineTo(x + 48, y - 52); c.stroke();
    } else if (actionId === 'bags') {
      roundedRect(c, x + 27, y - 57, 24, 27, 4, '#8c7761', '#574f43', 1.5); c.strokeStyle = '#574f43'; c.lineWidth = 2; c.beginPath(); c.arc(x + 39, y - 57, 6, Math.PI, 0); c.stroke(); c.fillStyle = '#d4bd88'; c.fillRect(x + 31, y - 48, 16, 2);
    } else if (actionId === 'guitar') {
      c.save(); c.translate(x + 28, y - 61); c.rotate(.22); c.fillStyle = '#a87950'; c.beginPath(); c.ellipse(0, 17, 14, 19, 0, 0, Math.PI * 2); c.fill(); c.fillStyle = '#6e5942'; c.fillRect(-3, -32, 6, 41); c.fillStyle = '#d9bc80'; c.fillRect(-5, -36, 10, 6); c.strokeStyle = '#eee0b9'; c.lineWidth = .7; c.beginPath(); c.moveTo(-2, -28); c.lineTo(-2, 33); c.moveTo(0, -28); c.lineTo(0, 33); c.moveTo(2, -28); c.lineTo(2, 33); c.stroke(); circle(0, 17, 3, '#493e32'); c.restore();
    } else if (actionId === 'statue') {
      circle(x + 31, y - 51, 16, 'rgba(223,194,117,.17)'); circle(x + 31, y - 51, 4, '#d6b867');
      c.fillStyle = '#b99e5b'; c.fillRect(x + 29, y - 56, 4, 11); c.fillRect(x + 26, y - 53, 10, 4);
    } else {
      const action = getAction(actionId);
      circle(x + 34, y - 48, 15, 'rgba(246,239,211,.88)', '#87937b', 1);
      c.fillStyle = '#526b50'; c.font = '16px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(action.icon, x + 34, y - 48);
    }
    c.restore();
  }

  function drawTree(x, y, scale, color) {
    const c=sceneCtx;c.save();c.translate(x,y);c.scale(scale,scale);
    c.fillStyle='#8e704f';c.fillRect(-6,-26,12,40);
    circle(0,-54,34,color);circle(-22,-42,21,color);circle(21,-41,22,color);circle(0,-76,21,color);
    circle(-11,-65,6,'rgba(221,228,161,.3)');c.restore();
  }
  function drawWindow(x,y,w,h,palette) {
    const c=sceneCtx;roundedRect(c,x,y,w,h,3,nightColor(palette)?'#435f66':'#a8c9be','#f5ead0',5);
    c.strokeStyle='#f6e8cc';c.lineWidth=6;c.beginPath();c.moveTo(x+w/2,y);c.lineTo(x+w/2,y+h);c.moveTo(x,y+h/2);c.lineTo(x+w,y+h/2);c.stroke();
    if(nightColor(palette)){circle(x+w*.7,y+h*.25,10,'#eee2ae');}
  }
  function drawBed(x,y,good) {
    const c=sceneCtx;roundedRect(c,x,y-43,180,52,6,good?'#e9e1c9':'#c9bba1','#937b61',2);c.fillStyle='#f1ece0';c.fillRect(x+12,y-36,63,29);c.fillStyle=good?'#98a987':'#a9917b';c.fillRect(x+77,y-36,92,30);c.fillStyle='#765f4c';c.fillRect(x+3,y+8,8,16);c.fillRect(x+167,y+8,8,16);if(good){c.fillStyle='#778e73';c.fillRect(x+75,y-31,4,24);}
  }
  function drawSideTable(x,y) { const c=sceneCtx;roundedRect(c,x,y-45,45,44,3,'#9b7958');c.fillStyle='#806247';c.fillRect(x+4,y-1,5,15);c.fillRect(x+37,y-1,5,15); }
  function drawDesk(x,y,laptop) { const c=sceneCtx;roundedRect(c,x,y-9,133,12,3,'#9d7959');c.fillStyle='#7e664c';c.fillRect(x+11,y+3,7,55);c.fillRect(x+115,y+3,7,55);if(laptop){roundedRect(c,x+49,y-47,48,34,3,'#475d54');c.fillStyle='#d4e0bc';c.fillRect(x+53,y-43,40,25);c.fillStyle='#8b765c';c.fillRect(x+43,y-12,62,4);}}
  function drawLamp(x,y) { const c=sceneCtx;c.fillStyle='#715e48';c.fillRect(x,y-43,3,43);c.fillStyle='#d8b260';c.beginPath();c.moveTo(x-14,y-43);c.lineTo(x+1,y-62);c.lineTo(x+16,y-43);c.closePath();c.fill();circle(x+1,y-38,15,'rgba(245,221,151,.12)'); }
  function drawPlant(x,y,scale=1) { const c=sceneCtx;c.save();c.translate(x,y);c.scale(scale,scale);c.fillStyle='#b47658';c.beginPath();c.moveTo(-15,0);c.lineTo(-11,-25);c.lineTo(11,-25);c.lineTo(15,0);c.closePath();c.fill();c.strokeStyle='#5c875e';c.lineWidth=5;c.beginPath();c.moveTo(0,-22);c.lineTo(0,-64);c.moveTo(0,-39);c.quadraticCurveTo(-23,-55,-18,-66);c.moveTo(0,-48);c.quadraticCurveTo(20,-62,23,-73);c.stroke();circle(-17,-66,7,'#7fa271');circle(23,-73,7,'#7fa271');c.restore(); }
  function drawPoster(x,y,color='#8d9e7a') { const c=sceneCtx;roundedRect(c,x,y,55,69,2,'#795f4e');c.fillStyle=color;c.fillRect(x+5,y+5,45,58);circle(x+27,y+31,12,'#d5bd8d');c.fillStyle='#719070';c.fillRect(x+5,y+44,45,19); }
  function drawFridge(x,y,tall=false) { const c=sceneCtx;roundedRect(c,x,y-70,tall?52:43,70,4,'#d8ded0','#889384',2);c.fillStyle='#8f9d8a';c.fillRect(x+7,y-38,tall?38:30,2);c.fillStyle='#798976';c.fillRect(x+(tall?43:34),y-58,2,14); }
  function drawStove(x,y) { const c=sceneCtx;roundedRect(c,x,y-42,71,42,4,'#8a9385');c.fillStyle='#ddd6c1';c.fillRect(x+5,y-37,61,8);for(let i=0;i<2;i++)circle(x+21+i*31,y-34,5,'#a58d69');c.fillStyle='#6d786d';c.fillRect(x+8,y-21,55,18); }
  function drawTv(x,y) { const c=sceneCtx;roundedRect(c,x,y-63,87,54,5,'#525d50');roundedRect(c,x+6,y-58,75,42,3,'#91aca0');c.fillStyle='#71826d';c.fillRect(x+28,y-9,30,6);c.fillRect(x+18,y-3,50,4); }
  function drawRadio(x,y) { const c=sceneCtx;roundedRect(c,x,y-39,61,39,5,'#a56c4f','#765741',2);c.fillStyle='#d6c68e';c.fillRect(x+7,y-31,25,9);circle(x+45,y-18,10,'#755b45');c.strokeStyle='#d4bf82';c.beginPath();c.moveTo(x+11,y-39);c.lineTo(x+3,y-54);c.stroke(); }
  function drawSleepingBag(x,y) { const c=sceneCtx;roundedRect(c,x,y-22,95,30,13,'#677b7a');circle(x+20,y-19,13,'#d0b391');c.fillStyle='#87948a';c.fillRect(x+16,y-6,67,4); }
  function drawUmbrella(x,y) { const c=sceneCtx; c.strokeStyle='#745b48';c.lineWidth=3;c.beginPath();c.moveTo(x,y-25);c.lineTo(x,y+29);c.arc(x-8,y+29,8,0,Math.PI);c.stroke();c.fillStyle='#d18458';c.beginPath();c.arc(x,y-27,33,Math.PI,Math.PI*2);c.lineTo(x,y-27);c.closePath();c.fill(); }
  function drawBackpack(x,y,scale=1) { const c=sceneCtx;c.save();c.translate(x,y);c.scale(scale,scale);roundedRect(c,-13,-20,26,39,7,'#b27e59','#795e48',2);roundedRect(c,-8,-12,16,13,4,'#d0a36c');c.restore(); }
  function drawCart(x,y) { const c=sceneCtx;c.strokeStyle='#5b6d60';c.lineWidth=4;c.beginPath();c.moveTo(x,y-55);c.lineTo(x+6,y-4);c.lineTo(x+74,y-4);c.lineTo(x+87,y-42);c.lineTo(x+15,y-42);c.stroke();c.fillStyle='#b87959';c.fillRect(x+19,y-36,48,26);circle(x+21,y+4,7,'#50584e');circle(x+71,y+4,7,'#50584e'); }
  function drawBike(x,y,scale=1,color='#547652') { const c=sceneCtx;c.save();c.translate(x,y);c.scale(scale,scale);c.strokeStyle='#667b61';c.lineWidth=5;c.beginPath();c.arc(0,0,27,0,Math.PI*2);c.arc(100,0,27,0,Math.PI*2);c.stroke();c.strokeStyle=color;c.lineWidth=4;c.beginPath();c.moveTo(0,0);c.lineTo(39,0);c.lineTo(62,-44);c.lineTo(100,0);c.lineTo(39,0);c.lineTo(26,-45);c.lineTo(62,-44);c.moveTo(15,-46);c.lineTo(35,-46);c.moveTo(60,-46);c.lineTo(75,-46);c.stroke();circle(62,-44,5,'#d4b56a');c.restore(); }
  function drawBikeBasket(x,y) { const c=sceneCtx;roundedRect(c,x,y,38,19,3,'#a88a5f','#776748',2); }
  function drawStreetLamp(x,y) { const c=sceneCtx; c.fillStyle='#54625a';c.fillRect(x,y-113,6,113);c.fillRect(x-21,y-115,37,4);roundedRect(c,x+3,y-126,20,16,5,'#f2dc9c');circle(x+13,y-108,21,'rgba(255,231,162,.14)'); }
  function drawNeighbor(x,y,color='#819a79',type='neighbor') { const c=sceneCtx;c.fillStyle='rgba(43,54,42,.12)';c.beginPath();c.ellipse(x,y,17,5,0,0,Math.PI*2);c.fill();roundedRect(c,x-11,y-43,22,42,8,color);roundedRect(c,x-8,y-63,16,18,6,'#c69170');circle(x,y-70,13,'#d4a17d');c.fillStyle=type==='customer'?'#624e3d':'#554a3d';c.beginPath();c.arc(x,y-73,13,Math.PI,Math.PI*2);c.fill();roundedRect(c,x-14,y-2,10,16,4,'#48564a');roundedRect(c,x+4,y-2,10,16,4,'#48564a');if(type==='helper'){c.fillStyle='#eee2bb';c.fillRect(x-5,y-39,10,13);} }
  function drawShopAwning(x,y,color) { const c=sceneCtx;c.fillStyle='#9d7153';c.fillRect(x,y+42,278,116);c.fillStyle=color;c.fillRect(x-12,y,302,49);for(let i=0;i<6;i++){c.fillStyle=i%2?'#efdfbd':'rgba(255,244,208,.55)';c.fillRect(x-12+i*50,y,25,49);}c.fillStyle='#e9d8b6';c.fillRect(x+13,y+68,246,57); }
  function drawStorefront(x,y,color) { const c=sceneCtx;c.fillStyle='#a77c58';c.fillRect(x,y,243,128);c.fillStyle=color;c.fillRect(x+14,y+22,215,90);c.fillStyle='#7d9d96';c.fillRect(x+27,y+36,67,57);c.fillRect(x+107,y+36,106,57); }
  function drawVan(x,y,scale=1) { const c=sceneCtx;c.save();c.translate(x,y);c.scale(scale,scale);roundedRect(c,0,-62,135,60,9,'#e6ddc1','#777b6e',2);c.fillStyle='#8da8a1';c.fillRect(84,-53,39,28);c.fillStyle='#72816f';c.fillRect(12,-48,60,36);circle(27,2,12,'#535b51');circle(107,2,12,'#535b51');c.fillStyle='#63816a';c.fillRect(7,-32,65,5);c.restore(); }
  function drawSign(x,y,text) { const c=sceneCtx;const width=Math.max(100,text.length*8);roundedRect(c,x,y,width,29,5,'#4f694e','#e5d8a6',2);c.fillStyle='#f5edcf';c.font='bold 10px system-ui';c.textAlign='center';c.textBaseline='middle';c.fillText(text,x+width/2,y+15,width-10); }
  function drawCrates(x,y) { const c=sceneCtx;for(let i=0;i<3;i++){roundedRect(c+x+i*28,y-i%2*18,27,25,2,['#d49c5e','#8ba36e','#bf7455'][i]);} }
  function drawCashBox(x,y) { const c=sceneCtx;roundedRect(c,x,y-24,55,24,4,'#6b7b5d');c.fillStyle='#e0d59d';c.fillRect(x+9,y-18,30,7); }
  function drawShelves(x,y) { const c=sceneCtx;c.fillStyle='#856a50';c.fillRect(x,y,7,73);c.fillRect(x+83,y,7,73);c.fillRect(x,y+22,90,6);c.fillRect(x,y+48,90,6);for(let i=0;i<5;i++){circle(x+16+i*15,y+14,5,['#dfb45a','#d37c58','#7e9a71','#90abb1','#c89378'][i%5]);circle(x+16+i*15,y+39,5,['#d08664','#8da573','#e0c36b'][i%3]);} }
  function drawGarden(x,y) { const c=sceneCtx;c.fillStyle='#957857';c.fillRect(x,y,202,33);for(let i=0;i<4;i++){const px=x+24+i*47;c.strokeStyle='#59865a';c.lineWidth=4;c.beginPath();c.moveTo(px,y+2);c.lineTo(px-4,y-24);c.moveTo(px,y-11);c.lineTo(px-12,y-20);c.moveTo(px,y-15);c.lineTo(px+11,y-26);c.stroke();circle(px-12,y-20,6,'#86a663');circle(px+11,y-26,6,'#7da36a');} }
  function drawCat(x,y) { const c=sceneCtx;circle(x,y-8,16,'#827763');c.beginPath();c.moveTo(x-13,y-18);c.lineTo(x-17,y-34);c.lineTo(x-4,y-24);c.moveTo(x+11,y-18);c.lineTo(x+17,y-34);c.lineTo(x+4,y-24);c.fillStyle='#827763';c.fill();circle(x-5,y-9,1.6,'#e8d791');circle(x+5,y-9,1.6,'#e8d791');c.strokeStyle='#786353';c.beginPath();c.moveTo(x+12,y-2);c.quadraticCurveTo(x+30,y-15,x+28,y-30);c.stroke(); }
  function drawAirplane(x,y) { const c=sceneCtx;c.save();c.translate(x,y);c.rotate(-.2);c.fillStyle='#f4ecd2';c.beginPath();c.moveTo(-32,0);c.lineTo(10,-7);c.lineTo(37,-25);c.lineTo(23,-5);c.lineTo(39,4);c.lineTo(35,8);c.lineTo(10,2);c.lineTo(-17,14);c.lineTo(-9,1);c.closePath();c.fill();c.restore(); }
  function drawConfetti(time) { const c=sceneCtx;for(let i=0;i<24;i++){const x=(i*71+Math.sin(time+i)*20)%WORLD.width;const y=(i*53+time*25)%350;c.fillStyle=['#ebc45e','#d47c5b','#79a170','#e8e1c5'][i%4];c.fillRect(x,y,4,7);} }

  function drawSceneParticles(dt) {
    const c=sceneCtx;
    for(let i=sceneParticles.length-1;i>=0;i--){const p=sceneParticles[i];p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=65*dt;if(p.life<=0){sceneParticles.splice(i,1);continue;}c.globalAlpha=clamp(p.life/p.max,0,1);c.fillStyle=p.color;c.beginPath();c.arc(p.x,p.y,p.size,0,Math.PI*2);c.fill();}
    c.globalAlpha=1;
  }

  function renderSceneLabels() {
    ui.sceneLocation.textContent = STAGES[state.stage - 1].area.toUpperCase();
    updateUI(true);
  }

  function createOfflineNotice() {
    const restAvailable = (state.stage === 1 && hasItem('sleeping-bag')) || state.stage >= 2 && (hasItem('mattress') || hasItem('bed')) || state.upgrades.includes('short-nap');
    let button = document.getElementById('rest-button');
    if (restAvailable && !button) {
      button = document.createElement('button');
      button.id = 'rest-button'; button.type = 'button'; button.className = 'rest-button'; button.textContent = '☾ DESCANSAR';
      button.addEventListener('click', rest);
      $('.food-strip-head').append(button);
    } else if (!restAvailable && button) button.remove();
  }

  function updateGame(dt) {
    if (!Number.isFinite(dt) || dt <= 0) return;
    updateClock(dt);
    updateUI(false);
    if (state.activeEvent) ui.event.hidden = false;
  }

  function checkNewDay() {
    const day = Math.floor(state.playSeconds / 180) + 1;
    if (day > state.day) {
      state.day = day;
      if (hasItem('alarm')) state.energy = clamp(state.energy + 10, 0, getMaxEnergy());
      if (hasItem('coffee-maker')) state.foodInventory.coffee = Number(state.foodInventory.coffee || 0) + 1;
      if (hasItem('fruit-trees')) state.foodInventory.apple = Number(state.foodInventory.apple || 0) + 1;
      pushLog(`Día ${day}: empieza una nueva jornada.`);
    }
  }

  function chargeRentIfDue() {
    if (state.stage < 2 || state.playSeconds < (state.nextRentAt || 300)) return;
    state.rentCycles += 1;
    const stageBase = [0, 0, 1000, 1000, 20000, 20000, 60000, 600000, 5000000, 500000, 50000000, 100000000, 200000000];
    let due = stageBase[state.stage] || 1000;
    const negotiated = hasItem('rent-negotiation') && state.reputation >= 10;
    if (!negotiated) due *= 1 + Math.min(1.5, state.rentCycles * .05);
    else due *= .85;
    if (state.mode === 'hard') due *= 1 + Math.floor(state.playSeconds / 1200) * .1;
    if (state.stage <= 3 && !hasItem('solar-roof')) due += 80; // luz y agua
    due = Math.floor(due);
    const paid = Math.min(state.coins, due);
    state.coins -= paid;
    if (paid < due) {
      state.rentDebt += due - paid;
      state.billsLate = true;
      state.reputation = Math.max(0, state.reputation - .15);
      showToast(`Alquiler pendiente: ${formatNumber(due - paid)} €. El 20 % de tus próximos ingresos irá a la deuda.`, 'alert');
    } else {
      state.billsLate = false;
      showToast(`Ciclo pagado: ${formatNumber(due)} € de alquiler y servicios.`);
    }
    state.nextRentAt = state.playSeconds + 300;
    pushLog(`Alquiler y servicios: −${formatNumber(paid)} €${paid < due ? ` · deuda ${formatNumber(state.rentDebt)} €` : ''}.`);
  }

  // Keep milestones, needs, passive production and day/night in a single fixed-step loop.
  function updateClock(dt) {
    state.playSeconds += dt;
    state.totalPlaySeconds += dt;
    checkNewDay();
    state.streakTimer = Math.max(0, state.streakTimer - dt);
    if (state.streakTimer <= 0) state.streak = 0;
    state.energy = clamp(state.energy + getEnergyRegen() * dt, 0, getMaxEnergy());
    const effects = getAllEffects();
    const drain = effects.satietyDrain * Math.max(.2, 1 - Number(state.skills?.cooking?.level || 0) * .015);
    if (state.mode === 'hard') state.satiety = clamp(state.satiety - .0032 * drain * dt, 0, getMaxSatiety());
    const income = getMps() * dt;
    if (income > 0) gainCoins(income, 'Ingresos pasivos');
    chargeRentIfDue();
    if (effects.garden && state.playSeconds >= state.gardenHarvestAt) {
      state.gardenHarvestAt = state.playSeconds + 90;
      state.energy = clamp(state.energy + 8, 0, getMaxEnergy());
      state.foodInventory.apple = Number(state.foodInventory.apple || 0) + 1;
    }
    for (const key of Object.keys(state.buffs)) {
      if (key.endsWith('Until') && state.buffs[key] <= state.playSeconds) {
        const type = key.slice(0, -5);
        delete state.buffs[key];
        if (type === 'click') delete state.buffs.clickMult;
        if (type === 'mood') delete state.buffs.moodMult;
        if (type === 'rain') delete state.buffs.rainMult;
      }
    }
    if (!state.activeEvent && state.playSeconds >= state.nextEventAt) {
      showEvent();
      state.nextEventAt = state.playSeconds + 65 + Math.random() * 75;
    }
    if (state.activeEvent && state.playSeconds >= state.activeEvent.expires) {
      state.activeEvent = null; ui.event.hidden = true;
    }
    clickPulse = Math.max(0, clickPulse - dt);
    checkAutoUnlocks(); checkAchievements();
    if (Math.floor(state.playSeconds) % 15 === 0 && Math.floor(state.playSeconds - dt) !== Math.floor(state.playSeconds)) checkMissions();
  }

  function animateFrame(now) {
    const previous = animateFrame.lastTime || now;
    const dt = Math.min(.05, Math.max(0, (now - previous) / 1000));
    animateFrame.lastTime = now;
    const seconds = now / 1000;
    sceneTime = seconds;
    drawScene(seconds, dt);
    animateFrame.accumulator = (animateFrame.accumulator || 0) + dt;
    if (animateFrame.accumulator >= .15) {
      updateGame(animateFrame.accumulator);
      animateFrame.accumulator = 0;
    }
    window.requestAnimationFrame(animateFrame);
  }

  function startGameLoop() {
    // The one animation loop owns both scene rendering and simulation.
    window.requestAnimationFrame(animateFrame);
  }

  function bindEvents() {
    sceneCanvas.addEventListener('pointerdown', (event) => {
      if (event.button !== undefined && event.button !== 0) return;
      clickScene(event);
      try { sceneCanvas.focus({ preventScroll: true }); } catch (_) { /* optional */ }
    });
    sceneCanvas.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); clickScene(); }
    });
    sceneWrap.addEventListener('pointerdown', (event) => {
      if (event.target === sceneWrap) clickScene(event);
    });
    ui.clickButton.addEventListener('click', () => clickScene());
    document.getElementById('event-claim').addEventListener('click', claimEvent);
    document.querySelector('.shop-tabs').addEventListener('click', (event) => {
      const tab = event.target.closest('[data-tab]'); if (tab) switchTab(tab.dataset.tab);
    });
    catalog.addEventListener('click', handleCatalogClick);
    document.getElementById('sort-toggle').addEventListener('click', (event) => {
      sortAvailable = !sortAvailable;
      event.currentTarget.innerHTML = sortAvailable ? 'A TU ALCANCE <span>⌄</span>' : 'POR COSTE <span>↕</span>';
      renderShop();
    });
    audioButton.addEventListener('click', () => {
      soundEnabled = !soundEnabled;
      try { localStorage.setItem('de-cero-sound', String(soundEnabled)); } catch (_) { /* optional */ }
      setSoundButton(); if (soundEnabled) playSound('coin');
    });
    document.getElementById('mode-toggle').addEventListener('click', () => {
      state.mode = state.mode === 'relaxed' ? 'hard' : 'relaxed';
      showToast(state.mode === 'relaxed' ? 'Modo tranquilo: sin presión.' : 'Modo difícil: más contratiempos y mayor riesgo.', state.mode === 'hard' ? 'alert' : 'success');
      saveState(); updateUI(true);
    });
    document.getElementById('fullscreen-toggle').addEventListener('click', async () => {
      const target = document.querySelector('.game-column');
      try { if (!document.fullscreenElement) await target.requestFullscreen?.(); else await document.exitFullscreen?.(); }
      catch (_) { showToast('Pantalla completa no disponible en este navegador.', 'alert'); }
    });
    document.addEventListener('fullscreenchange', updateSceneSize);
    modal.addEventListener('click', handleModalClick);
    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !modal.hidden) closeModal();
    });
    document.addEventListener('visibilitychange', () => { if (document.hidden) saveState(); });
    window.addEventListener('beforeunload', saveState);
  }

  function init() {
    setSoundButton();
    applyOfflineProgress();
    if (!state.actionsOwned.includes('ground')) state.actionsOwned.push('ground');
    if (state.foodInventory === undefined) state.foodInventory = {};
    if (state.stage >= 2 && !state.ownedItems.includes('rental-contract')) state.ownedItems.push('rental-contract');
    if (state.stage >= 3 && !state.ownedItems.includes('bike-gateway')) state.ownedItems.push('bike-gateway');
    createOfflineNotice();
    bindEvents();
    renderShop();
    updateUI(true);
    window.setInterval(() => {
      saveState();
      createOfflineNotice();
    }, STORE_MS);
    startGameLoop();
  }

  // Avoid starting duplicate RAF loops in browsers that load this file from disk and through a server.
  init();
})();
