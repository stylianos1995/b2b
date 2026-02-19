import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from "typeorm";
import { ProviderUser } from "./provider-user.entity";
import { Product } from "./product.entity";
import { Availability } from "./availability.entity";

/** @owner Provider Service */
@Entity("providers")
@Index(["status"])
@Index(["provider_type"])
export class Provider {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 255 })
  legal_name: string;

  @Column({ type: "varchar", length: 255 })
  trading_name: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  registration_number: string | null;

  @Column({ type: "varchar", length: 50, nullable: true })
  tax_id: string | null;

  @Column({ type: "varchar", length: 50 })
  provider_type: string;

  @Column({ type: "varchar", length: 30, default: "pending_verification" })
  status: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  logo_url: string | null;

  @Column({ type: "text", nullable: true })
  description: string | null;

  @Column({ type: "varchar", length: 3, default: "GBP" })
  default_currency: string;

  @Column({ type: "decimal", precision: 12, scale: 2, nullable: true })
  min_order_value: string | null;

  @Column({ type: "int", nullable: true })
  lead_time_hours: number | null;

  @Column({ type: "decimal", precision: 8, scale: 2, nullable: true })
  service_radius_km: string | null;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at: Date;

  @OneToMany(() => ProviderUser, (pu) => pu.provider)
  userMemberships: ProviderUser[];

  @OneToMany(() => Product, (p) => p.provider)
  products: Product[];

  @OneToMany(() => Availability, (a) => a.provider)
  availability: Availability[];
}
