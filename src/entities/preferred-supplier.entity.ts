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
import { Business } from "./business.entity";
import { Provider } from "./provider.entity";

/** @owner Business Service */
@Entity("preferred_suppliers")
@Unique(["business_id", "provider_id"])
@Index(["provider_id"])
export class PreferredSupplier {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  business_id: string;

  @Column({ type: "uuid" })
  provider_id: string;

  @Column({ type: "text", nullable: true })
  notes: string | null;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at: Date;

  @ManyToOne(() => Business, { onDelete: "CASCADE" })
  @JoinColumn({ name: "business_id" })
  business: Business;

  @ManyToOne(() => Provider, { onDelete: "CASCADE" })
  @JoinColumn({ name: "provider_id" })
  provider: Provider;
}
