import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Req,
    UseGuards,
    ParseIntPipe,
} from '@nestjs/common';
import { MarcasService } from './marcas.service';
import { CreateMarcaDto } from './dto/create-marca.dto';
import { UpdateMarcaDto } from './dto/update-marca.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';

@UseGuards(JwtAuthGuard)
@Controller('marcas')
export class MarcasController {
    constructor(private readonly marcasService: MarcasService) { }

    // POST /api/marcas — vendedor o admin crean marca
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN, Role.VENDEDOR)
    @Post()
    create(@Req() req, @Body() dto: CreateMarcaDto) {
        return this.marcasService.create(req.user.id, dto);
    }

    // GET /api/marcas — solo admin
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN)
    @Get()
    findAll() {
        return this.marcasService.findAll();
    }

    // GET /api/marcas/mias — vendedor ve sus propias marcas
    @Get('mias')
    findMias(@Req() req) {
        return this.marcasService.findMias(req.user.id);
    }

    // PATCH /api/marcas/:id — dueño o admin editan
    @Patch(':id')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Req() req,
        @Body() dto: UpdateMarcaDto,
    ) {
        return this.marcasService.update(id, req.user.id, req.user.rol, dto);
    }

    // DELETE /api/marcas/:id — dueño o admin eliminan
    @Delete(':id')
    remove(@Param('id', ParseIntPipe) id: number, @Req() req) {
        return this.marcasService.remove(id, req.user.id, req.user.rol);
    }
}
