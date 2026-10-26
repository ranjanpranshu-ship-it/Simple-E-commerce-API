import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe.js';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { ProductsService } from './products.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';

@ApiTags('products')
@ApiBearerAuth()
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post('create')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(201)
  @ApiOperation({ summary: 'Create product (admin only)' })
  @ApiBody({
    schema: {
      example: {
        Productname: 'Test Product',
        Productprice: 100,
        Productdescription: 'Test Product',
        Productimage: 'https://example.com/test.jpg',
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  async createProduct(@Body() createProductDto: CreateProductDto) {
    return this.productsService.CreateProduct(createProductDto);
  }

  @Get('listAll')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List all products' })
  @ApiResponse({ status: 200, description: 'List of all products' })
  async findAllProducts() {
    return this.productsService.ListAllProducts();
  }

  @Get('findone/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Find product by ID' })
  @ApiResponse({ status: 200, description: 'Product information' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async findOneProduct(@Param('id', new ParseObjectIdPipe()) id: string) {
    return this.productsService.ListProductInfo(id);
  }

  @Patch('update/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Update product (admin only)' })
  @ApiBody({
    schema: {
      example: {
        Productname: 'Updated Product',
        Productprice: 200,
        Productdescription: 'Updated Product',
        Productimage: 'https://example.com/updated.jpg',
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Product updated successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async updateProduct(
    @Param('id', new ParseObjectIdPipe()) id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.Update(id, updateProductDto);
  }

  @Delete('remove/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Delete product (admin only)' })
  @ApiResponse({ status: 200, description: 'Product deleted' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async removeProduct(@Param('id', new ParseObjectIdPipe()) id: string) {
    return this.productsService.Delete(id);
  }
}
