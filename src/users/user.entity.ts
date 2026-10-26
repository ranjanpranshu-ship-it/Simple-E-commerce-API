import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  // Nullable so Google-only accounts can exist without a local password.
  @Column({ type: 'varchar', nullable: true })
  password: string | null;

  @Column('simple-array', { default: 'user' })
  roles: string[];

  @Column({ default: 0 })
  tokenVersion: number;

  @Column({ default: false })
  verified: boolean;
}
