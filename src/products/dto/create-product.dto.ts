import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateProductDto {
  @IsString()
  Productname: string;

  @IsNumber()
  Productprice: number;

  @IsString()
  @IsOptional()
  Productdescription?: string;

  @IsString()
  @IsOptional()
  Productimage?: string;
}
