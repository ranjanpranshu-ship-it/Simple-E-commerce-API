import { Column, PrimaryGeneratedColumn, CreateDateColumn, Entity, Unique } from "typeorm";

@Entity('oauth_identities')
@Unique(['provider', 'providerId'])
export class OAuthIdentity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({name: 'provider', length: 50})
  provider: string;
  
  @Column({name: 'provider_id', length: 255})
  providerId: string;
  
  @Column({type: 'varchar', nullable: true})
  email: string | null;
  
  @Column()
  userId: number;
  
  @CreateDateColumn()
  createdAt: Date;
}