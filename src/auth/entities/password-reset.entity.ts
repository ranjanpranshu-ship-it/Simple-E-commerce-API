import { Entity, Column, CreateDateColumn, PrimaryGeneratedColumn } from "typeorm";

@Entity('password_reset')
export class PasswordReset {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  tokenhash: string;
  
  @Column()
  expiresAt: Date;

  @Column({default: false})
  used: boolean;

  @CreateDateColumn()
  createdAt: Date;
}