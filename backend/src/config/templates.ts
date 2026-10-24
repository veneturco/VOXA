import { BusinessConfig } from '../types/index.js';

export const BUSINESS_TEMPLATES: Record<'clinica' | 'taller' | 'tienda', Omit<BusinessConfig, 'id' | 'updated_at'>> = {
  clinica: {
    name: 'Centro Médico & Especialidades San Rafael',
    category: 'clinica',
    description: 'Atención médica integral, medicina general, pediatría, ginecología y odontología.',
    schedule: 'Lunes a Viernes de 8:00 AM a 6:00 PM. Sábados de 8:00 AM a 1:00 PM.',
    catalog_or_services: `1. Consulta Medicina General: $35
2. Consulta Pediatría: $45
3. Consulta Ginecología con Citología: $60
4. Limpieza Dental y Valoración: $40
5. Laboratorio Clínico Básico: Perfil 20 por $25`,
    payment_methods: 'Pago Móvil, Transferencia Bancaria Banesco/Mercantil, Zelle, Tarjeta de Débito/Crédito y Efectivo en taquilla.',
    address: 'Av. Las Delicias, Torre Médica Florencia, Piso 3, Consultorio 3-B.',
    owner_phone: '+584121234567',
    response_mode: 'mirror',
    voice_name: 'es-VE-PaolaNeural',
    call_forwarding_enabled: true,
    call_rejection_message: '¡Hola! Actualmente todos nuestros especialistas y líneas telefónicas están atendiendo consultas presenciales. Por favor déjanos tu consulta o solicitud de cita por este chat de WhatsApp y te atenderemos con prioridad de inmediato.',
    custom_system_rules: `DIRECTRICES DE CLÍNICA:
1. Sé una recepcionista médica extremadamente empática, cordial, tranquilizadora y profesional.
2. IMPORTANTE: NUNCA emitas diagnósticos médicos, ni recetes medicamentos ni contradigas a un médico.
3. Si el paciente menciona síntomas de extrema gravedad (dolor en el pecho, dificultad severa para respirar, sangrado incontrolable, convulsiones), indícale amablemente acudir de inmediato a Urgencias o al centro hospitalario más cercano.
4. Para agendar una cita necesitas: Nombre y apellido del paciente, especialidad o síntoma principal, fecha y turno preferido (mañana/tarde).
5. Las respuestas deben ser breves, claras y fluidas, adecuadas para ser escuchadas en notas de voz.`,
  },

  taller: {
    name: 'Taller Mecánico & AutoRepuestos Los Andes',
    category: 'taller',
    description: 'Diagnóstico computarizado, mecánica ligera y pesada, cambio de aceite, frenos, tren delantero y venta de repuestos originales.',
    schedule: 'Lunes a Viernes de 7:30 AM a 5:30 PM. Sábados de 8:00 AM a 2:00 PM.',
    catalog_or_services: `1. Mantenimiento Preventivo (Cambio de aceite semisintético + filtro + revisión de 25 puntos): $45
2. Escaneo Computarizado OBD2 y Diagnóstico: $20 (Gratis si realizas la reparación con nosotros)
3. Rectificación y cambio de pastillas de frenos (delanteras): $35 mano de obra + repuestos
4. Mantenimiento de Inyectores (Ultrasonido y banco de prueba): $40
5. Stock de repuestos para Toyota, Chevrolet, Ford, Hyundai, Chery y Nissan (Baterías Duncan, amortiguadores, correas).`,
    payment_methods: 'Transferencia Nacional, Pago Móvil, Zelle, Efectivo USD/EUR y Banesco Panamá.',
    address: 'Zona Industrial La Hamaca, Galpón 14, al lado de la estación de servicio.',
    owner_phone: '+584149876543',
    response_mode: 'mirror',
    voice_name: 'es-VE-SebastianNeural',
    call_forwarding_enabled: true,
    call_rejection_message: '¡Saludos! El equipo de maestros mecánicos está en fosa y operando maquinaria ruidosa en este momento. Escríbenos directamente el año, marca y modelo de tu vehículo con lo que necesitas y te responderemos con presupuesto de inmediato.',
    custom_system_rules: `DIRECTRICES DE TALLER AUTOMOTRIZ:
1. Sé un asesor técnico automotriz claro, directo, seguro y servicial.
2. REGLA FUNDAMENTAL: Para cotizar repuestos o agendar servicio SIEMPRE debes saber: Marca, Modelo, Año y Motor (cilindrada) del vehículo. Si el cliente no lo ha indicado, pídelo amablemente antes de especular.
3. Si el cliente envía fotos de piezas rotas o del tablero con testigos encendidos, interprétalas y tranquilízalo.
4. Si el cliente busca repuestos, ofrece tanto el repuesto como la instalación en el taller con garantía.`,
  },

  tienda: {
    name: 'Burger & Grill Express Gourmet',
    category: 'tienda',
    description: 'Hamburguesas artesanales, combos familiares, alitas bbq, bebidas y postres con servicio de delivery rápido.',
    schedule: 'Miércoles a Domingo de 12:00 PM a 10:30 PM.',
    catalog_or_services: `1. Doble Bacon Smash Burger (2 carnes angus 90g, queso cheddar, tocineta crocante, salsa secreta) + Papas rústicas: $9.50
2. Chicken Crispy Burger (Pechuga apanada, ensalada coleslaw, pepinillos, mayo spicy) + Papas: $8.50
3. Combo Pareja (2 Burgers a elección + 1 Ración Tequeños x6 + 2 Bebidas): $19.99
4. Ración Tequeños tradicionales rellenos de queso llanero con salsa tártara (8 unidades): $5.00
5. Bebidas (Refresco 1.5L, Té frío de limón, Cervezas artesanales): $2.50
6. Costo Delivery: $2 a $3.50 según la zona urbana (Gratis en pedidos superiores a $25).`,
    payment_methods: 'Pago Móvil, Zelle, Zinli, Binance Pay (USDT) y Efectivo en divisas al recibir.',
    address: 'Calle Comercio con Av. Bolívar, Local 12-A.',
    owner_phone: '+584165554321',
    response_mode: 'mirror',
    voice_name: 'es-CO-SalomeNeural',
    call_forwarding_enabled: true,
    call_rejection_message: '¡Hola! Nuestra cocina está activa preparando los pedidos del delivery. Escríbenos por este chat lo que se te antoja o envíanos tu pedido para despacharlo a toda marcha.',
    custom_system_rules: `DIRECTRICES DE TIENDA Y DELIVERY:
1. Sé un vendedor ágil, carismático y eficiente. Transmite entusiasmo por la comida.
2. UPSELL SUAVE: Cuando el cliente elija una hamburguesa o combo, sugiérele suavemente 1 adicional (por ejemplo: "¿Deseas acompañarla con nuestra ración de tequeños con salsa tártara o una bebida fría?"). No insistas más de una vez.
3. Para cerrar el pedido necesitas: Detalle de ítems, dirección o zona exacta para calcular delivery, método de pago seleccionado y nombre de quien recibe.
4. Si el cliente envía comprobante de pago, analízalo cordialmente e indícale que el equipo de caja lo está verificando para liberar el despacho a cocina.`,
  }
};
