import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe.js';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt.guard.js';
import { ShoppingCartService } from './shopping-cart.service.js';
import { CreateShoppingCartDto } from './dto/create-shopping-cart.dto.js';
import { UpdateShoppingCartDto } from './dto/update-shopping-cart.dto.js';

@ApiTags('shopping-cart')
@ApiBearerAuth()
@Controller('shopping-cart')
export class ShoppingCartController {
  constructor(private readonly shoppingCartService: ShoppingCartService) {}

  @Post('create')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Add an item to the cart' })
  @ApiBody({ schema: { example: { ProductId: '665f1c2e3f4a5b6c7d8e9f00', Quantity: 2 } } })
  @ApiResponse({ status: 201, description: 'Item added to cart' })
  async create(@Req() req: any, @Body() createShoppingCartDto: CreateShoppingCartDto) {
    return this.shoppingCartService.CreateCart(req.user.id, createShoppingCartDto);
  }

  @Get('listAll')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Get the current user's cart" })
  @ApiResponse({ status: 200, description: 'Returns cart items' })
  async findAll(@Req() req: any) {
    return this.shoppingCartService.FindAllCart(req.user.id);
  }

  @Get('findone/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get a cart item by ID' })
  @ApiResponse({ status: 200, description: 'Returns cart item' })
  async findOne(@Req() req: any, @Param('id', new ParseObjectIdPipe()) id: string) {
    return this.shoppingCartService.FindOneCart(req.user.id, id);
  }

  @Patch('update/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update a cart item quantity' })
  @ApiBody({ schema: { example: { Quantity: 3 } } })
  @ApiResponse({ status: 200, description: 'Cart item updated' })
  @ApiResponse({ status: 400, description: 'Invalid quantity' })
  @ApiResponse({ status: 404, description: 'Cart item not found' })
  async update(
    @Req() req: any,
    @Param('id', new ParseObjectIdPipe()) id: string,
    @Body() updateShoppingCartDto: UpdateShoppingCartDto,
  ) {
    return this.shoppingCartService.UpdateCart(req.user.id, id, updateShoppingCartDto);
  }

  @Delete('remove/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Remove a cart item' })
  @ApiResponse({ status: 200, description: 'Cart item removed' })
  @ApiResponse({ status: 404, description: 'Cart item not found' })
  async remove(@Req() req: any, @Param('id', new ParseObjectIdPipe()) id: string) {
    return this.shoppingCartService.RemoveCart(req.user.id, id);
  }
}
