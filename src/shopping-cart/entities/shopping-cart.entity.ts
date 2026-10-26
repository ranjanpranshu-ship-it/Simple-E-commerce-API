import { Column, Entity, ObjectIdColumn } from 'typeorm';
import { ObjectId } from 'mongodb';

@Entity()
export class ShoppingCart {
  @ObjectIdColumn()
  id: ObjectId;

  @Column()
  userId: number;

  @Column()
  ProductId: ObjectId;

  @Column({ length: 255 })
  ProductName: string;

  @Column()
  Quantity: number;

  @Column()
  EachPrice: number;

  @Column()
  TotalPrice: number;

  @Column({ default: 'pending' })
  paymentStatus: 'pending' | 'paid' | 'failed';

  @Column({ nullable: true })
  paymentId: string;
}
