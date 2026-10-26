import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('linking_intents')
export class LinkingIntent {
    @PrimaryColumn()
    token: string;

    @Column()
    userId: number;

    @Column()
    expiresAt: Date;
}   