import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from "typeorm";
import { User } from "./user.entity";
import { Provider } from "./provider.entity";

/** @owner Identity Service */
@Entity("provider_users")
@Unique(["user_id", "provider_id"])
@Index(["provider_id"])
export class ProviderUser {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  user_id: string;

  @Column({ type: "uuid" })
  provider_id: string;

  @Column({ type: "varchar", length: 30 })
  role: string;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at: Date;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

  @ManyToOne(() => Provider, { onDelete: "CASCADE" })
  @JoinColumn({ name: "provider_id" })
  provider: Provider;
}
