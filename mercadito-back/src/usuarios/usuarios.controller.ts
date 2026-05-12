import { Controller, Get, Param, Patch, ParseIntPipe, UseGuards, Req } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';

@Controller('usuarios')
export class UsuariosController {
    constructor(private readonly usuariosService: UsuariosService) { }

    // GET /api/usuarios/me — cualquier usuario autenticado ve su propio perfil
    @UseGuards(JwtAuthGuard)
    @Get('me')
    findMe(@Req() req) {
        return this.usuariosService.findMe(req.user.id);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @Get()
    findAll() {
        return this.usuariosService.findAll();
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.usuariosService.findOne(id);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @Patch(':id/desactivar')
    desactivar(@Param('id', ParseIntPipe) id: number) {
        return this.usuariosService.desactivar(id);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @Patch(':id/activar')
    activar(@Param('id', ParseIntPipe) id: number) {
        return this.usuariosService.activar(id);
    }
}
