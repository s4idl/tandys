/**
 * =========================================================
 *  SCRIPT 1: PRUEBAS DE RUTAS (ROUTE TESTING)
 * =========================================================
 *  Materia: Software de Calidad
 *  Proyecto: Mercadito — Backend API
 *
 *  Objetivo: Verificar que todas las rutas del API existen,
 *  responden con los códigos HTTP correctos, y que las rutas
 *  inexistentes retornan 404.
 *
 *  Tipo de prueba: End-to-End (E2E) / Integración
 *  Herramientas: Jest + Supertest + NestJS Testing Module
 *
 *  Ejecutar:  npx jest --config ./test/jest-e2e.json rutas
 * =========================================================
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const jwt = require('jsonwebtoken');

// ── Token de prueba ─────────────────────────────────────
// Se firma un JWT manualmente con el mismo secret del .env
// para poder acceder a las rutas protegidas y verificar
// que EXISTEN (no retornan 404).
const JWT_SECRET = 'supersecret';
const tokenAdmin = jwt.sign(
  { sub: 999, correo: 'testadmin@prueba.com', rol: 'admin' },
  JWT_SECRET,
  { expiresIn: '1h' },
);

describe('SCRIPT 1 — Pruebas de Rutas', () => {
  let app: INestApplication<App>;

  // ── Configuración inicial ───────────────────────────────
  // Se levanta la aplicación NestJS completa con el mismo
  // prefijo global "/api" y ValidationPipe del main.ts
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
  }, 30000); // timeout 30s — la conexión a Supabase puede tardar

  afterAll(async () => {
    await app.close();
  });

  // ═══════════════════════════════════════════════════════
  //  1.1  RUTAS PÚBLICAS — deben responder sin autenticación
  // ═══════════════════════════════════════════════════════
  describe('1.1 — Rutas públicas (sin token)', () => {
    it('GET /api/health → 200 con status "OK"', () => {
      return request(app.getHttpServer())
        .get('/api/health')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'OK');
          expect(res.body).toHaveProperty('message', 'Backend running');
          expect(res.body).toHaveProperty('timestamp');
        });
    });

    it('GET /api/faq → 200 con arreglo de preguntas frecuentes', () => {
      return request(app.getHttpServer())
        .get('/api/faq')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('POST /api/auth/login → ruta existe (responde, NO da 404)', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ correo: 'noexiste@test.com', contrasena: '123' })
        .expect((res) => {
          // 401 = credenciales inválidas (la ruta existe y procesó la petición)
          expect(res.status).not.toBe(404);
        });
    });

    it('POST /api/auth/register → ruta existe (responde, NO da 404)', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({}) // body vacío para no crear usuario real
        .expect((res) => {
          expect(res.status).not.toBe(404);
        });
    });
  });

  // ═══════════════════════════════════════════════════════
  //  1.2  RUTAS PROTEGIDAS — deben existir (401, NO 404)
  // ═══════════════════════════════════════════════════════
  //  Sin token deben responder 401 (Unauthorized), lo cual
  //  CONFIRMA que la ruta existe. Si respondiera 404, la
  //  ruta NO existiría.
  describe('1.2 — Rutas protegidas existen (responden 401 sin token)', () => {
    const rutasProtegidas: { method: 'get' | 'post' | 'patch' | 'delete'; path: string }[] = [
      // Auth
      { method: 'get',    path: '/api/auth/profile' },
      // Espacios
      { method: 'get',    path: '/api/espacios' },
      { method: 'get',    path: '/api/espacios/1' },
      { method: 'patch',  path: '/api/espacios/1/asignar' },
      { method: 'patch',  path: '/api/espacios/1/liberar' },
      // Solicitudes
      { method: 'get',    path: '/api/solicitudes' },
      { method: 'get',    path: '/api/solicitudes/1' },
      { method: 'get',    path: '/api/solicitudes/mias' },
      { method: 'post',   path: '/api/solicitudes' },
      { method: 'patch',  path: '/api/solicitudes/1/aceptar' },
      { method: 'patch',  path: '/api/solicitudes/1/rechazar' },
      // Marcas
      { method: 'get',    path: '/api/marcas' },
      { method: 'get',    path: '/api/marcas/mias' },
      { method: 'post',   path: '/api/marcas' },
      { method: 'patch',  path: '/api/marcas/1' },
      { method: 'delete', path: '/api/marcas/1' },
      // Pagos
      { method: 'get',    path: '/api/pagos' },
      { method: 'get',    path: '/api/pagos/1' },
      { method: 'post',   path: '/api/pagos' },
      { method: 'patch',  path: '/api/pagos/1/verificar' },
      // Usuarios
      { method: 'get',    path: '/api/usuarios' },
      { method: 'get',    path: '/api/usuarios/1' },
      { method: 'patch',  path: '/api/usuarios/1/desactivar' },
      { method: 'patch',  path: '/api/usuarios/1/activar' },
      // FAQ (rutas protegidas)
      { method: 'post',   path: '/api/faq' },
      { method: 'patch',  path: '/api/faq/1' },
      { method: 'delete', path: '/api/faq/1' },
    ];

    rutasProtegidas.forEach(({ method, path }) => {
      it(`${method.toUpperCase()} ${path} → 401 (ruta existe, requiere auth)`, () => {
        return request(app.getHttpServer())[method](path).expect(401);
      });
    });
  });

  // ═══════════════════════════════════════════════════════
  //  1.3  RUTAS CON TOKEN — responden correctamente
  // ═══════════════════════════════════════════════════════
  //  Al enviar un token válido de admin, las rutas GET de
  //  listado deben responder 200 con un arreglo.
  describe('1.3 — Rutas responden correctamente con token válido', () => {
    it('GET /api/auth/profile → 200 con datos del usuario', () => {
      return request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('correo');
          expect(res.body).toHaveProperty('rol', 'admin');
        });
    });

    it('GET /api/espacios → 200 con arreglo', () => {
      return request(app.getHttpServer())
        .get('/api/espacios')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('GET /api/solicitudes → 200 con arreglo (admin)', () => {
      return request(app.getHttpServer())
        .get('/api/solicitudes')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('GET /api/pagos → 200 con arreglo (admin)', () => {
      return request(app.getHttpServer())
        .get('/api/pagos')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('GET /api/usuarios → 200 con arreglo (admin)', () => {
      return request(app.getHttpServer())
        .get('/api/usuarios')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('GET /api/marcas → 200 con arreglo (admin)', () => {
      return request(app.getHttpServer())
        .get('/api/marcas')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  // ═══════════════════════════════════════════════════════
  //  1.4  RUTAS INEXISTENTES — deben retornar 404
  // ═══════════════════════════════════════════════════════
  describe('1.4 — Rutas inexistentes retornan 404', () => {
    it('GET /api/ruta-inventada → 404', () => {
      return request(app.getHttpServer())
        .get('/api/ruta-inventada')
        .expect(404);
    });

    it('GET /api/productos → 404 (módulo no existe)', () => {
      return request(app.getHttpServer())
        .get('/api/productos')
        .expect(404);
    });

    it('GET /api/carrito → 404 (módulo no existe)', () => {
      return request(app.getHttpServer())
        .get('/api/carrito')
        .expect(404);
    });

    it('POST /api/espacios/inventar → 404 (acción no existe)', () => {
      return request(app.getHttpServer())
        .post('/api/espacios/inventar')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .expect(404);
    });

    it('DELETE /api/usuarios/1 → 404 (DELETE no implementado)', () => {
      return request(app.getHttpServer())
        .delete('/api/usuarios/1')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .expect(404);
    });
  });

  // ═══════════════════════════════════════════════════════
  //  1.5  MÉTODO HTTP INCORRECTO — deben retornar 404
  // ═══════════════════════════════════════════════════════
  describe('1.5 — Método HTTP incorrecto retorna 404', () => {
    it('DELETE /api/health → 404 (solo GET definido)', () => {
      return request(app.getHttpServer())
        .delete('/api/health')
        .expect(404);
    });

    it('PUT /api/solicitudes → 404 (PUT no definido)', () => {
      return request(app.getHttpServer())
        .put('/api/solicitudes')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .expect(404);
    });

    it('PUT /api/faq → 404 (PUT no definido)', () => {
      return request(app.getHttpServer())
        .put('/api/faq')
        .expect(404);
    });
  });
});
