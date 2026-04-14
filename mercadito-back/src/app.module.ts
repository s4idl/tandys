import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { EspaciosModule } from './espacios/espacios.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { MarcasModule } from './marcas/marcas.module';
import { PagosModule } from './pagos/pagos.module';
import { SolicitudesModule } from './solicitudes/solicitudes.module';
import { FaqModule } from './faq/faq.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    HealthModule,
    AuthModule,
    PrismaModule,
    EspaciosModule,
    UsuariosModule,
    MarcasModule,
    PagosModule,
    SolicitudesModule,
    FaqModule,
  ],
})
export class AppModule {}