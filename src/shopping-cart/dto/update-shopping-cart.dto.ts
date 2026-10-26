import { IsInt, Min } from 'class-validator';

export class UpdateShoppingCartDto {
  @IsInt()
  @Min(1, { message: 'Quantity must be at least 1' })
  Quantity: number;
}
