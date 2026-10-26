import { Column, Entity, ObjectIdColumn } from 'typeorm';
import { ObjectId } from 'mongodb';

@Entity()
export class ProductEntity {
  @ObjectIdColumn()
  id: ObjectId;

  @Column({ length: 255 })
  Productname: string;

  @Column()
  Productprice: number;

  @Column({ length: 255, nullable: true })
  Productdescription: string;

  @Column({ length: 255, nullable: true })
  Productimage: string;

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  CreatedAt: Date;

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  UpdatedAt: Date;
}
