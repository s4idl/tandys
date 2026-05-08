/**
 * =========================================================
 *  SCRIPT 2: PRUEBAS DE PERMISOS Y AUTENTICACIÓN
 * =========================================================
 *  Materia: Software de Calidad
 *  Proyecto: Mercadito — Backend API
 *
 *  Objetivo: Verificar que el sistema de autenticación JWT
 *  funciona correctamente:
 *  - Rechaza peticiones SIN token (401)
 *  - Rechaza tokens INVÁLIDOS (401)
 *  - Rechaza tokens EXPIRADOS (401)
 *  - Acepta tokens VÁLIDOS (no 401)
 *  - Las rutas públicas NO requieren token
 *
 *  Tipo de prueba: End-to-End (E2E) / Seguridad
 *  Herramientas: Jest + Supertest + NestJS Testing Module
 *
 *  Ejecutar:  npx jest --config ./test/jest-e2e.json permisos
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

// ── Tokens de prueba ────────────────────────────────────

// Token VÁLIDO de admin (expira en 1 hora)
const tokenValido = jwt.sign(
  { sub: 999, correo: 'admin@test.com', rol: 'admin' },
  JWT_SECRET,
  { expiresIn: '1h' },
);

// Token VÁLIDO de vendedor (expira en 1 hora)
const tokenVendedor = jwt.sign(
  { sub: 998, correo: 'vendedor@test.com', rol: 'vendedor' },
  JWT_SECRET,
  { expiresIn: '1h' },
);

// Token firmado con un SECRET INCORRECTO
//   → El servidor usará "supersecret" para verificar,
//     pero este token fue firmado con "clave-equivocada",
//     por lo tanto la firma NO coincide y será rechazado.
const tokenSecretIncorrecto = jwt.sign(
  { sub: 999, correo: 'admin@test.com', rol: 'admin' },
  'clave-equivocada',
  { expiresIn: '1h' },
);

// Token EXPIRADO (se firmó con exp en el pasado)
//   → El campo "exp" está 1 minuto atrás, así que al
//     momento de verificar ya estará vencido.
const tokenExpirado = jwt.sign(
  {
    sub: 999,
    correo: 'admin@test.com',
    rol: 'admin',
    exp: Math.floor(Date.now() / 1000) - 60, // expiró hace 1 minuto
  },
  JWT_SECRET,
);

// Token con formato MALFORMADO (no es un JWT real)
const tokenMalformado = 'esto.no.es.un.jwt.valido';

describe('SCRIPT 2 — Pruebas de Permisos y Autenticación', () => {
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
  //  2.1  SIN TOKEN → Debe rechazar con 401 Unauthorized
  // ═══════════════════════════════════════════════════════
  //  Todas las rutas protegidas DEBEN devolver 401 si no
  //  se incluye el header "Authorization: Bearer <token>".
  describe('2.1 — Sin token → 401 Unauthorized', () => {
    it('GET /api/auth/profile → 401', () => {
      return request(app.getHttpServer())
        .get('/api/auth/profile')
        .expect(401);
    });

    it('GET /api/espacios → 401', () => {
      return request(app.getHttpServer())
        .get('/api/espacios')
        .expect(401);
    });

    it('GET /api/solicitudes → 401', () => {
      return request(app.getHttpServer())
        .get('/api/solicitudes')
        .expect(401);
    });

    it('GET /api/marcas → 401', () => {
      return request(app.getHttpServer())
        .get('/api/marcas')
        .expect(401);
    });

    it('GET /api/usuarios → 401', () => {
      return request(app.getHttpServer())
        .get('/api/usuarios')
        .expect(401);
    });

    it('POST /api/pagos → 401', () => {
      return request(app.getHttpServer())
        .post('/api/pagos')
        .send({})
        .expect(401);
    });

    it('POST /api/faq → 401', () => {
      return request(app.getHttpServer())
        .post('/api/faq')
        .send({})
        .expect(401);
    });

    it('PATCH /api/espacios/1/asignar → 401', () => {
      return request(app.getHttpServer())
        .patch('/api/espacios/1/asignar')
        .expect(401);
    });

    it('PATCH /api/usuarios/1/desactivar → 401', () => {
      return request(app.getHttpServer())
        .patch('/api/usuarios/1/desactivar')
        .expect(401);
    });
  });

  // ═══════════════════════════════════════════════════════
  //  2.2  TOKEN INVÁLIDO → Debe rechazar con 401
  // ═══════════════════════════════════════════════════════
  //  Se prueban diferentes tipos de tokens inválidos:
  //  - String aleatorio
  //  - JWT firmado con secret incorrecto
  //  - JWT expirado
  //  - JWT malformado
  //  - Header sin prefijo "Bearer"
  describe('2.2 — Token inválido → 401 Unauthorized', () => {
    it('Token string aleatorio → 401', () => {
      return request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer abc123-token-inventado')
        .expect(401);
    });

    it('Token firmado con secret INCORRECTO → 401', () => {
      return request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${tokenSecretIncorrecto}`)
        .expect(401);
    });

    it('Token EXPIRADO → 401', () => {
      return request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${tokenExpirado}`)
        .expect(401);
    });

    it('Token MALFORMADO → 401', () => {
      return request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${tokenMalformado}`)
        .expect(401);
    });

    it('Header sin prefijo "Bearer" → 401', () => {
      return request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('Authorization', tokenValido) // falta "Bearer "
        .expect(401);
    });

    it('Header Authorization vacío → 401', () => {
      return request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('Authorization', '')
        .expect(401);
    });

    it('Token inválido en ruta de espacios → 401', () => {
      return request(app.getHttpServer())
        .get('/api/espacios')
        .set('Authorization', `Bearer ${tokenSecretIncorrecto}`)
        .expect(401);
    });

    it('Token expirado en ruta de solicitudes → 401', () => {
      return request(app.getHttpServer())
        .get('/api/solicitudes')
        .set('Authorization', `Bearer ${tokenExpirado}`)
        .expect(401);
    });
  });

  // ═══════════════════════════════════════════════════════
  //  2.3  TOKEN VÁLIDO → Debe permitir acceso (NO 401)
  // ═══════════════════════════════════════════════════════
  //  Nota: verificamos que la respuesta NO sea 401.
  //  Podría ser 200, 403 (si el rol no tiene permiso),
  //  o incluso 400 (body inválido). Lo importante es que
  //  el JWT fue ACEPTADO (la autenticación pasó).
  describe('2.3 — Token válido → acceso permitido (no 401)', () => {
    it('GET /api/auth/profile con token admin → NO es 401', () => {
      return request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${tokenValido}`)
        .expect((res) => {
          expect(res.status).not.toBe(401);
        });
    });

    it('GET /api/espacios con token admin → NO es 401', () => {
      return request(app.getHttpServer())
        .get('/api/espacios')
        .set('Authorization', `Bearer ${tokenValido}`)
        .expect((res) => {
          expect(res.status).not.toBe(401);
        });
    });

    it('GET /api/espacios con token vendedor → NO es 401', () => {
      return request(app.getHttpServer())
        .get('/api/espacios')
        .set('Authorization', `Bearer ${tokenVendedor}`)
        .expect((res) => {
          expect(res.status).not.toBe(401);
        });
    });

    it('GET /api/solicitudes con token admin → NO es 401', () => {
      return request(app.getHttpServer())
        .get('/api/solicitudes')
        .set('Authorization', `Bearer ${tokenValido}`)
        .expect((res) => {
          expect(res.status).not.toBe(401);
        });
    });

    it('GET /api/marcas/mias con token vendedor → NO es 401', () => {
      return request(app.getHttpServer())
        .get('/api/marcas/mias')
        .set('Authorization', `Bearer ${tokenVendedor}`)
        .expect((res) => {
          expect(res.status).not.toBe(401);
        });
    });

    it('GET /api/pagos con token admin → NO es 401', () => {
      return request(app.getHttpServer())
        .get('/api/pagos')
        .set('Authorization', `Bearer ${tokenValido}`)
        .expect((res) => {
          expect(res.status).not.toBe(401);
        });
    });

    it('GET /api/pagos con token vendedor → NO es 401 (ahora tiene acceso)', () => {
      return request(app.getHttpServer())
        .get('/api/pagos')
        .set('Authorization', `Bearer ${tokenVendedor}`)
        .expect((res) => {
          expect(res.status).not.toBe(401);
        });
    });

    it('GET /api/usuarios con token admin → NO es 401', () => {
      return request(app.getHttpServer())
        .get('/api/usuarios')
        .set('Authorization', `Bearer ${tokenValido}`)
        .expect((res) => {
          expect(res.status).not.toBe(401);
        });
    });
  });

  // ═══════════════════════════════════════════════════════
  //  2.4  RUTAS PÚBLICAS — NO requieren token
  // ═══════════════════════════════════════════════════════
  //  Estas rutas deben funcionar perfectamente sin enviar
  //  ningún header de Authorization.
  describe('2.4 — Rutas públicas accesibles sin token', () => {
    it('GET /api/health → 200 sin token', () => {
      return request(app.getHttpServer())
        .get('/api/health')
        .expect(200);
    });

    it('GET /api/faq → 200 sin token', () => {
      return request(app.getHttpServer())
        .get('/api/faq')
        .expect(200);
    });

    it('POST /api/auth/login → procesa la petición sin token (no 401 por JWT)', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ correo: 'noexiste@test.com', contrasena: 'password123' })
        .expect((res) => {
          // Retorna 401 por credenciales inválidas (lógica de negocio),
          // NO por falta de JWT. La ruta es pública.
          expect(res.status).toBe(401);
          expect(res.body.message).toBe('Credenciales inválidas');
        });
    });

    it('POST /api/auth/register → procesa la petición sin token', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({}) // body vacío, no queremos crear usuario real
        .expect((res) => {
          // Podría ser 400 o 500 por body vacío, pero NO 401
          // porque la ruta es pública
          expect(res.status).not.toBe(401);
        });
    });
  });
});
