import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { Order } from "./order.entity";

/** @owner Logistics Service */
@Entity("deliveries")
@Index(["order_id"], { unique: true })
@Index(["status"])
export class Delivery {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid", unique: true })
  order_id: string;

  @Column({ type: "varchar", length: 20, default: "scheduled" })
  status: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  carrier: string | null;

  @Column({ type: "varchar", length: 100, nullable: true })
  tracking_code: string | null;

  @Column({ type: "timestamptz", nullable: true })
  estimated_delivery_at: Date | null;

  @Column({ type: "timestamptz", nullable: true })
  actual_delivery_at: Date | null;

  @Column({ type: "varchar", length: 500, nullable: true })
  proof_of_delivery_url: string | null;

  @Column({ type: "text", nullable: true })
  notes: string | null;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at: Date;

  @OneToOne(() => Order, (o) => o.delivery, { onDelete: "CASCADE" })
  @JoinColumn({ name: "order_id" })
  order: Order;
}
