import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1. Crear un Admin (si no existe)
  const admin = await prisma.usuarios.upsert({
    where: { correo: 'admin.test@test.com' },
    update: {},
    create: {
      nombre: 'Admin Test',
      correo: 'admin.test@test.com',
      contrasena: 'hashed_password',
      rol: 'admin',
    },
  });

  // 2. Crear un Vendedor (si no existe)
  const vendedor = await prisma.usuarios.upsert({
    where: { correo: 'vendedor.test@test.com' },
    update: {},
    create: {
      nombre: 'Vendedor Test',
      correo: 'vendedor.test@test.com',
      contrasena: 'hashed_password',
      rol: 'vendedor',
    },
  });

  // 3. Crear una Marca para el vendedor
  const marca = await prisma.marcas.create({
    data: {
      id_usuario: vendedor.id_usuario,
      nombre_marca: 'Marca Test ' + Date.now(),
    },
  });

  // 4. Crear un Mercadito
  const mercadito = await prisma.mercaditos.create({
    data: {
      nombre: 'Mercadito Test ' + Date.now(),
      fecha: new Date(),
      hora_inicio: new Date(),
      hora_fin: new Date(),
      lugar: 'Lugar Test',
      estado: 'activo',
    },
  });

  // 5. Crear dos espacios disponibles
  const espacio1 = await prisma.espacios.create({
    data: {
      id_mercadito: mercadito.id_mercadito,
      numero_espacio: 'A1',
      precio: 100.00,
      estado: 'disponible',
    },
  });

  const espacio2 = await prisma.espacios.create({
    data: {
      id_mercadito: mercadito.id_mercadito,
      numero_espacio: 'A2',
      precio: 100.00,
      estado: 'disponible',
    },
  });

  // 6. Crear solicitudes para ambos espacios
  const solicitud1 = await prisma.solicitudes.create({
    data: { id_marca: marca.id_marca, id_espacio: espacio1.id_espacio, estado: 'aceptada' },
  });

  const solicitud2 = await prisma.solicitudes.create({
    data: { id_marca: marca.id_marca, id_espacio: espacio2.id_espacio, estado: 'aceptada' },
  });
  
  // 8. Crear los pagos (pendientes)
  const pago1 = await prisma.pagos.create({
    data: {
      id_solicitud: solicitud1.id_solicitud,
      monto: 100.00,
      metodo_pago: 'transferencia',
      estado: 'pendiente',
    },
  });

  const pago2 = await prisma.pagos.create({
    data: {
      id_solicitud: solicitud2.id_solicitud,
      monto: 100.00,
      metodo_pago: 'transferencia',
      estado: 'pendiente',
    },
  });

  console.log("=== DATOS INICIALES ===");
  console.log(`Pago 1 (ID: ${pago1.id_pago}) -> Espacio 1 (A1) estado: pendiente_pago`);
  console.log(`Pago 2 (ID: ${pago2.id_pago}) -> Espacio 2 (A2) estado: pendiente_pago`);

  // Aquí importamos el servicio o simulamos la lógica para probarla de manera aislada
  // Vamos a replicar EXACTAMENTE lo que haría el servicio
  
  console.log("\n=== PRUEBA 1: APROBAR PAGO 1 ===");
  await prisma.$transaction(async (tx) => {
    // 1. Aprobar pago
    await tx.pagos.update({
        where: { id_pago: pago1.id_pago },
        data: { estado: 'verificado', id_admin_verifico: admin.id_usuario },
    });
    // 2. Actualizar espacio
    await tx.espacios.update({
        where: { id_espacio: espacio1.id_espacio },
        data: { estado: 'ocupado' },
    });
  });
  
  const espacio1Actualizado = await prisma.espacios.findUnique({ where: { id_espacio: espacio1.id_espacio }});
  const pago1Actualizado = await prisma.pagos.findUnique({ where: { id_pago: pago1.id_pago }});
  console.log(`Pago 1 estado: ${pago1Actualizado?.estado} (Esperado: verificado)`);
  console.log(`Espacio 1 estado: ${espacio1Actualizado?.estado} (Esperado: ocupado)`);

  console.log("\n=== PRUEBA 2: RECHAZAR PAGO 2 ===");
  await prisma.$transaction(async (tx) => {
    // 1. Rechazar pago
    await tx.pagos.update({
        where: { id_pago: pago2.id_pago },
        data: { estado: 'rechazado', id_admin_verifico: admin.id_usuario },
    });
    // 2. Liberar espacio
    await tx.espacios.update({
        where: { id_espacio: espacio2.id_espacio },
        data: { estado: 'disponible' },
    });
    // 3. Rechazar solicitud
    await tx.solicitudes.update({
        where: { id_solicitud: pago2.id_solicitud },
        data: { estado: 'rechazada' },
    });
  });

  const espacio2Actualizado = await prisma.espacios.findUnique({ where: { id_espacio: espacio2.id_espacio }});
  const pago2Actualizado = await prisma.pagos.findUnique({ where: { id_pago: pago2.id_pago }});
  const solicitud2Actualizada = await prisma.solicitudes.findUnique({ where: { id_solicitud: pago2.id_solicitud }});
  
  console.log(`Pago 2 estado: ${pago2Actualizado?.estado} (Esperado: rechazado)`);
  console.log(`Espacio 2 estado: ${espacio2Actualizado?.estado} (Esperado: disponible)`);
  console.log(`Solicitud 2 estado: ${solicitud2Actualizada?.estado} (Esperado: rechazada)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
