import { Entity, Column, CreateDateColumn, PrimaryGeneratedColumn } from "typeorm";

@Entity('email_verification')   
export class EmailVerification {
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
