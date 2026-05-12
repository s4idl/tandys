import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

async register(data: any) {
  const existingUser = await this.prisma.usuarios.findUnique({
    where: { correo: data.correo },
  });

  if (existingUser) {
    throw new BadRequestException('El correo ya está registrado');
  }

  const hashedPassword = await bcrypt.hash(data.contrasena, 10);

  const user = await this.prisma.usuarios.create({
    data: {
      nombre: data.nombre,
      correo: data.correo,
      contrasena: hashedPassword,
      telefono: data.telefono,
      rol: data.rol ?? 'visualizador',
    },
  });

  return {
    message: 'Usuario registrado correctamente',
    user: {
      id_usuario: user.id_usuario,
      nombre: user.nombre,
      correo: user.correo,
      rol: user.rol,
      activo: user.activo,
      fecha_registro: user.fecha_registro,
    },
  };
}

  async login(correo: string, contrasena: string) {
    const user = await this.prisma.usuarios.findUnique({
      where: { correo },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const validPassword = await bcrypt.compare(contrasena, user.contrasena);

    if (!validPassword) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload = {
      sub: user.id_usuario,
      correo: user.correo,
      rol: user.rol,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}