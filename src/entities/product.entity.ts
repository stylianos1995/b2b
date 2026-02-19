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
import { Provider } from "./provider.entity";

/** @owner Provider Service */
@Entity("products")
@Unique(["provider_id", "sku"])
@Index(["provider_id", "is_active"])
@Index(["category"])
export class Product {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  provider_id: string;

  @Column({ type: "varchar", length: 100 })
  sku: string;

  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({ type: "text", nullable: true })
  description: string | null;

  @Column({ type: "varchar", length: 50 })
  category: string;

  @Column({ type: "varchar", length: 20 })
  unit: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  unit_size: string | null;

  /** When set, product is only sold in these sizes (e.g. ["500ml", "1L", "2L", "5L", "10L"]). Buyer must choose one; decimal quantity not allowed. */
  @Column({ type: "jsonb", nullable: true })
  allowed_sizes: string[] | null;

  @Column({ type: "decimal", precision: 12, scale: 2 })
  price: string;

  @Column({ type: "varchar", length: 3 })
  currency: string;

  @Column({ type: "decimal", precision: 5, scale: 4 })
  tax_rate: string;

  @Column({ type: "decimal", precision: 12, scale: 3, nullable: true })
  min_order_quantity: string | null;

  @Column({ type: "decimal", precision: 12, scale: 3, nullable: true })
  max_order_quantity: string | null;

  @Column({ type: "boolean", default: true })
  is_active: boolean;

  @Column({ type: "jsonb", nullable: true })
  image_urls: string[] | null;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at: Date;

  @ManyToOne(() => Provider, { onDelete: "CASCADE" })
  @JoinColumn({ name: "provider_id" })
  provider: Provider;
}
