import {
    Controller,
    Get,
    Post,
    Patch,
    Body,
    Param,
    Req,
    UseGuards,
    ParseIntPipe,
} from '@nestjs/common';
import { PagosService } from './pagos.service';
import { CreatePagoDto } from './dto/create-pago.dto';
import { VerificarPagoDto } from './dto/verificar-pago.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';

@UseGuards(JwtAuthGuard)
@Controller('pagos')
export class PagosController {
    constructor(private readonly pagosService: PagosService) { }

    // POST /api/pagos — vendedor registra un pago para una solicitud aprobada
    @UseGuards(RolesGuard)
    @Roles(Role.VENDEDOR, Role.ADMIN)
    @Post()
    create(@Body() dto: CreatePagoDto) {
        return this.pagosService.create(dto);
    }

    // GET /api/pagos — solo admin ve todos los pagos
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN)
    @Get()
    findAll() {
        return this.pagosService.findAll();
    }

    // GET /api/pagos/:id — detalle de un pago
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN, Role.VENDEDOR)
    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.pagosService.findOne(id);
    }

    // PATCH /api/pagos/:id/verificar — admin verifica o rechaza el pago
    @UseGuards(RolesGuard)
    @Roles(Role.ADMIN)
    @Patch(':id/verificar')
    verificar(
        @Param('id', ParseIntPipe) id: number,
        @Req() req,
        @Body() dto: VerificarPagoDto,
    ) {
        return this.pagosService.verificar(id, req.user.id, dto);
    }

    // POST /api/pagos/:id/comprobante — vendedor sube el URL del comprobante
    @UseGuards(RolesGuard)
    @Roles(Role.VENDEDOR, Role.ADMIN)
    @Post(':id/comprobante')
    subirComprobante(
        @Param('id', ParseIntPipe) id: number,
        @Body('archivo_url') archivoUrl: string,
    ) {
        return this.pagosService.subirComprobante(id, archivoUrl);
    }
}
