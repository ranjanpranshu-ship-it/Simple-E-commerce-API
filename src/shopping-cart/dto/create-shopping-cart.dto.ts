import { IsInt, IsMongoId, Min } from 'class-validator';

export class CreateShoppingCartDto {
  @IsMongoId()
  ProductId: string;

  @IsInt()
  @Min(1, { message: 'Quantity must be at least 1' })
  Quantity: number;
}
