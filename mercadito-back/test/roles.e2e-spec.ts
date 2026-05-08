/**
 * =========================================================
 *  SCRIPT 3: PRUEBAS DE ROLES DE USUARIO
 * =========================================================
 *  Materia: Software de Calidad
 *  Proyecto: Mercadito — Backend API
 *
 *  Objetivo: Verificar que el sistema de control de acceso
 *  basado en roles (RBAC) funciona correctamente:
 *  - Un VENDEDOR no puede acceder a rutas de ADMIN (→ 403)
 *  - Un ADMIN no puede acceder a rutas de VENDEDOR (→ 403)
 *  - Un VISUALIZADOR no puede acceder a rutas restringidas (→ 403)
 *  - Cada rol SÍ puede acceder a sus rutas permitidas (≠ 403)
 *
 *  Roles del sistema:
 *  ┌───────────────┬──────────────────────────────────────┐
 *  │ Rol           │ Descripción                          │
 *  ├───────────────┼──────────────────────────────────────┤
 *  │ admin         │ Administrador del mercadito          │
 *  │ vendedor      │ Vendedor que renta espacios          │
 *  │ visualizador  │ Rol por defecto al registrarse       │
 *  └───────────────┴──────────────────────────────────────┘
 *
 *  Tipo de prueba: End-to-End (E2E) / Autorización
 *  Herramientas: Jest + Supertest + NestJS Testing Module
 *
 *  Ejecutar:  npx jest --config ./test/jest-e2e.json roles
 * =========================================================
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'supersecret';

// ── Tokens de prueba para cada rol ──────────────────────
// Se firman JWTs manualmente simulando cada tipo de usuario.
// El campo "rol" es lo que el RolesGuard evalúa.

const tokenAdmin = jwt.sign(
  { sub: 999, correo: 'admin@test.com', rol: 'admin' },
  JWT_SECRET,
  { expiresIn: '1h' },
);

const tokenVendedor = jwt.sign(
  { sub: 998, correo: 'vendedor@test.com', rol: 'vendedor' },
  JWT_SECRET,
  { expiresIn: '1h' },
);

// "visualizador" es el rol por defecto al registrarse.
// No tiene acceso a rutas de admin ni de vendedor.
const tokenVisualizador = jwt.sign(
  { sub: 997, correo: 'visitante@test.com', rol: 'visualizador' },
  JWT_SECRET,
  { expiresIn: '1h' },
);

describe('SCRIPT 3 — Pruebas de Roles de Usuario', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  // ═══════════════════════════════════════════════════════
  //  3.1  VENDEDOR accediendo a rutas de ADMIN → 403
  // ═══════════════════════════════════════════════════════
  //  Un vendedor autenticado NO debe poder acceder a rutas
  //  que requieren el rol "admin". El guard devuelve 403
  //  (Forbidden) con el mensaje "No tienes permisos para
  //  acceder a este recurso".
  describe('3.1 — Vendedor NO puede acceder a rutas de Admin (→ 403)', () => {
    it('GET /api/solicitudes → 403 (solo admin ve todas)', () => {
      return request(app.getHttpServer())
        .get('/api/solicitudes')
        .set('Authorization', `Bearer ${tokenVendedor}`)
        .expect(403)
        .expect((res) => {
          expect(res.body.message).toBe(
            'No tienes permisos para acceder a este recurso',
          );
        });
    });

    it('PATCH /api/solicitudes/1/aceptar → 403 (solo admin)', () => {
      return request(app.getHttpServer())
        .patch('/api/solicitudes/1/aceptar')
        .set('Authorization', `Bearer ${tokenVendedor}`)
        .expect(403);
    });

    it('PATCH /api/solicitudes/1/rechazar → 403 (solo admin)', () => {
      return request(app.getHttpServer())
        .patch('/api/solicitudes/1/rechazar')
        .set('Authorization', `Bearer ${tokenVendedor}`)
        .send({ motivo_rechazo: 'test' })
        .expect(403);
    });

    it('PATCH /api/espacios/1/asignar → 403 (solo admin)', () => {
      return request(app.getHttpServer())
        .patch('/api/espacios/1/asignar')
        .set('Authorization', `Bearer ${tokenVendedor}`)
        .expect(403);
    });

    it('PATCH /api/espacios/1/liberar → 403 (solo admin)', () => {
      return request(app.getHttpServer())
        .patch('/api/espacios/1/liberar')
        .set('Authorization', `Bearer ${tokenVendedor}`)
        .expect(403);
    });

    it('GET /api/usuarios → 403 (solo admin gestiona usuarios)', () => {
      return request(app.getHttpServer())
        .get('/api/usuarios')
        .set('Authorization', `Bearer ${tokenVendedor}`)
        .expect(403);
    });

    it('GET /api/usuarios/1 → 403 (solo admin)', () => {
      return request(app.getHttpServer())
        .get('/api/usuarios/1')
        .set('Authorization', `Bearer ${tokenVendedor}`)
        .expect(403);
    });

    it('PATCH /api/usuarios/1/desactivar → 403 (solo admin)', () => {
      return request(app.getHttpServer())
        .patch('/api/usuarios/1/desactivar')
        .set('Authorization', `Bearer ${tokenVendedor}`)
        .expect(403);
    });

    it('PATCH /api/usuarios/1/activar → 403 (solo admin)', () => {
      return request(app.getHttpServer())
        .patch('/api/usuarios/1/activar')
        .set('Authorization', `Bearer ${tokenVendedor}`)
        .expect(403);
    });

    it('GET /api/pagos → 200 con sus pagos (vendedor ahora puede ver los suyos)', () => {
      return request(app.getHttpServer())
        .get('/api/pagos')
        .set('Authorization', `Bearer ${tokenVendedor}`)
        .expect((res) => {
          // Ahora el vendedor tiene acceso; retorna 200 con sus pagos filtrados
          expect(res.status).not.toBe(403);
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('PATCH /api/pagos/1/verificar → 403 (solo admin verifica)', () => {
      return request(app.getHttpServer())
        .patch('/api/pagos/1/verificar')
        .set('Authorization', `Bearer ${tokenVendedor}`)
        .send({ estado: 'verificado' })
        .expect(403);
    });

    it('POST /api/faq → 403 (solo admin crea FAQ)', () => {
      return request(app.getHttpServer())
        .post('/api/faq')
        .set('Authorization', `Bearer ${tokenVendedor}`)
        .send({ pregunta: 'test?', respuesta: 'test' })
        .expect(403);
    });

    it('PATCH /api/faq/1 → 403 (solo admin edita FAQ)', () => {
      return request(app.getHttpServer())
        .patch('/api/faq/1')
        .set('Authorization', `Bearer ${tokenVendedor}`)
        .send({ pregunta: 'editada?' })
        .expect(403);
    });

    it('DELETE /api/faq/1 → 403 (solo admin elimina FAQ)', () => {
      return request(app.getHttpServer())
        .delete('/api/faq/1')
        .set('Authorization', `Bearer ${tokenVendedor}`)
        .expect(403);
    });

    it('GET /api/marcas → 403 (solo admin ve todas las marcas)', () => {
      return request(app.getHttpServer())
        .get('/api/marcas')
        .set('Authorization', `Bearer ${tokenVendedor}`)
        .expect(403);
    });
  });

  // ═══════════════════════════════════════════════════════
  //  3.2  ADMIN accediendo a rutas de VENDEDOR → 403
  // ═══════════════════════════════════════════════════════
  //  Algunas rutas son EXCLUSIVAS del vendedor.
  //  Un admin NO debería poder usarlas.
  describe('3.2 — Admin NO puede acceder a rutas exclusivas de Vendedor (→ 403)', () => {
    it('POST /api/solicitudes → 403 (solo vendedor crea solicitudes)', () => {
      return request(app.getHttpServer())
        .post('/api/solicitudes')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({})
        .expect(403);
    });

    it('GET /api/solicitudes/mias → 403 (solo vendedor ve sus solicitudes)', () => {
      return request(app.getHttpServer())
        .get('/api/solicitudes/mias')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .expect(403);
    });
  });

  // ═══════════════════════════════════════════════════════
  //  3.3  VISUALIZADOR accediendo a rutas restringidas → 403
  // ═══════════════════════════════════════════════════════
  //  El rol "visualizador" es el más limitado. No puede
  //  acceder a ninguna ruta que requiera admin o vendedor.
  describe('3.3 — Visualizador NO puede acceder a rutas restringidas (→ 403)', () => {
    it('GET /api/solicitudes → 403 (requiere admin)', () => {
      return request(app.getHttpServer())
        .get('/api/solicitudes')
        .set('Authorization', `Bearer ${tokenVisualizador}`)
        .expect(403);
    });

    it('POST /api/solicitudes → 403 (requiere vendedor)', () => {
      return request(app.getHttpServer())
        .post('/api/solicitudes')
        .set('Authorization', `Bearer ${tokenVisualizador}`)
        .send({})
        .expect(403);
    });

    it('PATCH /api/espacios/1/asignar → 403 (requiere admin)', () => {
      return request(app.getHttpServer())
        .patch('/api/espacios/1/asignar')
        .set('Authorization', `Bearer ${tokenVisualizador}`)
        .expect(403);
    });

    it('GET /api/usuarios → 403 (requiere admin)', () => {
      return request(app.getHttpServer())
        .get('/api/usuarios')
        .set('Authorization', `Bearer ${tokenVisualizador}`)
        .expect(403);
    });

    it('POST /api/pagos → 403 (requiere vendedor o admin)', () => {
      return request(app.getHttpServer())
        .post('/api/pagos')
        .set('Authorization', `Bearer ${tokenVisualizador}`)
        .send({})
        .expect(403);
    });

    it('POST /api/faq → 403 (requiere admin)', () => {
      return request(app.getHttpServer())
        .post('/api/faq')
        .set('Authorization', `Bearer ${tokenVisualizador}`)
        .send({})
        .expect(403);
    });

    it('GET /api/marcas → 403 (requiere admin)', () => {
      return request(app.getHttpServer())
        .get('/api/marcas')
        .set('Authorization', `Bearer ${tokenVisualizador}`)
        .expect(403);
    });

    it('POST /api/marcas → 403 (requiere admin o vendedor)', () => {
      return request(app.getHttpServer())
        .post('/api/marcas')
        .set('Authorization', `Bearer ${tokenVisualizador}`)
        .send({})
        .expect(403);
    });
  });

  // ═══════════════════════════════════════════════════════
  //  3.4  ADMIN SÍ puede acceder a sus rutas (≠ 403)
  // ═══════════════════════════════════════════════════════
  //  Verificamos que el admin pasa el RolesGuard.
  //  Nota: comprobamos que NO sea 403 (podría ser 200, 400, etc.
  //  dependiendo del body o del estado de la BD).
  describe('3.4 — Admin SÍ puede acceder a rutas de Admin (no 403)', () => {
    it('GET /api/solicitudes → permitido', () => {
      return request(app.getHttpServer())
        .get('/api/solicitudes')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .expect((res) => {
          expect(res.status).not.toBe(403);
        });
    });

    it('GET /api/usuarios → permitido', () => {
      return request(app.getHttpServer())
        .get('/api/usuarios')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .expect((res) => {
          expect(res.status).not.toBe(403);
        });
    });

    it('GET /api/pagos → permitido', () => {
      return request(app.getHttpServer())
        .get('/api/pagos')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .expect((res) => {
          expect(res.status).not.toBe(403);
        });
    });

    it('GET /api/marcas → permitido', () => {
      return request(app.getHttpServer())
        .get('/api/marcas')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .expect((res) => {
          expect(res.status).not.toBe(403);
        });
    });

    it('GET /api/espacios → permitido', () => {
      return request(app.getHttpServer())
        .get('/api/espacios')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .expect((res) => {
          expect(res.status).not.toBe(403);
        });
    });
  });

  // ═══════════════════════════════════════════════════════
  //  3.5  VENDEDOR SÍ puede acceder a sus rutas (≠ 403)
  // ═══════════════════════════════════════════════════════
  //  El vendedor debe poder crear solicitudes, ver sus
  //  marcas, registrar pagos, etc.
  describe('3.5 — Vendedor SÍ puede acceder a rutas de Vendedor (no 403)', () => {
    it('POST /api/solicitudes → permitido (body inválido da 400, no 403)', () => {
      return request(app.getHttpServer())
        .post('/api/solicitudes')
        .set('Authorization', `Bearer ${tokenVendedor}`)
        .send({}) // body vacío → 400, pero NO 403
        .expect((res) => {
          expect(res.status).not.toBe(403);
        });
    });

    it('GET /api/solicitudes/mias → permitido', () => {
      return request(app.getHttpServer())
        .get('/api/solicitudes/mias')
        .set('Authorization', `Bearer ${tokenVendedor}`)
        .expect((res) => {
          expect(res.status).not.toBe(403);
        });
    });

    it('GET /api/marcas/mias → permitido', () => {
      return request(app.getHttpServer())
        .get('/api/marcas/mias')
        .set('Authorization', `Bearer ${tokenVendedor}`)
        .expect((res) => {
          expect(res.status).not.toBe(403);
        });
    });

    it('POST /api/pagos → permitido (body inválido da 400, no 403)', () => {
      return request(app.getHttpServer())
        .post('/api/pagos')
        .set('Authorization', `Bearer ${tokenVendedor}`)
        .send({}) // body vacío → 400, pero NO 403
        .expect((res) => {
          expect(res.status).not.toBe(403);
        });
    });

    it('POST /api/marcas → permitido (body inválido da 400, no 403)', () => {
      return request(app.getHttpServer())
        .post('/api/marcas')
        .set('Authorization', `Bearer ${tokenVendedor}`)
        .send({}) // body vacío → 400, pero NO 403
        .expect((res) => {
          expect(res.status).not.toBe(403);
        });
    });

    it('GET /api/espacios → permitido', () => {
      return request(app.getHttpServer())
        .get('/api/espacios')
        .set('Authorization', `Bearer ${tokenVendedor}`)
        .expect((res) => {
          expect(res.status).not.toBe(403);
        });
    });

    it('GET /api/pagos → permitido (vendedor ve sus propios pagos)', () => {
      return request(app.getHttpServer())
        .get('/api/pagos')
        .set('Authorization', `Bearer ${tokenVendedor}`)
        .expect((res) => {
          expect(res.status).not.toBe(403);
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('GET /api/pagos/:id → 403 si el pago pertenece a otro vendedor', () => {
      return request(app.getHttpServer())
        .get('/api/pagos/1')
        .set('Authorization', `Bearer ${tokenVendedor}`)
        .expect((res) => {
          // El pago id=1 pertenece a otro usuario → el guard devuelve 403
          // Si no existiera → 404. En ningún caso 401.
          expect(res.status).not.toBe(401);
          expect([403, 404]).toContain(res.status);
        });
    });
  });

  // ═══════════════════════════════════════════════════════
  //  3.6  RUTAS COMPARTIDAS — ambos roles pueden acceder
  // ═══════════════════════════════════════════════════════
  //  Algunas rutas permiten tanto admin como vendedor.
  describe('3.6 — Rutas compartidas (admin Y vendedor tienen acceso)', () => {
    it('POST /api/pagos → admin puede (no 403)', () => {
      return request(app.getHttpServer())
        .post('/api/pagos')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({})
        .expect((res) => {
          expect(res.status).not.toBe(403);
        });
    });

    it('POST /api/pagos → vendedor puede (no 403)', () => {
      return request(app.getHttpServer())
        .post('/api/pagos')
        .set('Authorization', `Bearer ${tokenVendedor}`)
        .send({})
        .expect((res) => {
          expect(res.status).not.toBe(403);
        });
    });

    it('POST /api/marcas → admin puede (no 403)', () => {
      return request(app.getHttpServer())
        .post('/api/marcas')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({})
        .expect((res) => {
          expect(res.status).not.toBe(403);
        });
    });

    it('POST /api/marcas → vendedor puede (no 403)', () => {
      return request(app.getHttpServer())
        .post('/api/marcas')
        .set('Authorization', `Bearer ${tokenVendedor}`)
        .send({})
        .expect((res) => {
          expect(res.status).not.toBe(403);
        });
    });

    it('GET /api/pagos → admin puede ver todos (no 403)', () => {
      return request(app.getHttpServer())
        .get('/api/pagos')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .expect((res) => {
          expect(res.status).not.toBe(403);
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('GET /api/pagos → vendedor puede ver los suyos (no 403)', () => {
      return request(app.getHttpServer())
        .get('/api/pagos')
        .set('Authorization', `Bearer ${tokenVendedor}`)
        .expect((res) => {
          expect(res.status).not.toBe(403);
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('GET /api/pagos/:id → admin puede ver cualquier pago (no 403)', () => {
      return request(app.getHttpServer())
        .get('/api/pagos/1')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .expect((res) => {
          expect(res.status).not.toBe(403);
        });
    });

    it('GET /api/pagos/:id → vendedor recibe 403 si el pago no le pertenece', () => {
      return request(app.getHttpServer())
        .get('/api/pagos/1')
        .set('Authorization', `Bearer ${tokenVendedor}`)
        .expect((res) => {
          // 403 si pertenece a otro, 404 si no existe. Nunca 401.
          expect(res.status).not.toBe(401);
          expect([403, 404]).toContain(res.status);
        });
    });
  });
});
