import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { Business } from "./business.entity";
import { Provider } from "./provider.entity";
import { Location } from "./location.entity";
import { OrderLine } from "./order-line.entity";
import { Delivery } from "./delivery.entity";
import { Rating } from "./rating.entity";

/** @owner Order Service */
@Entity("orders")
@Index(["business_id", "status", "created_at"])
@Index(["provider_id", "status"])
@Index(["order_number"], { unique: true })
export class Order {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 50, unique: true })
  order_number: string;

  @Column({ type: "uuid" })
  business_id: string;

  @Column({ type: "uuid" })
  provider_id: string;

  @Column({ type: "uuid" })
  delivery_location_id: string;

  @Column({ type: "varchar", length: 20, default: "draft" })
  status: string;

  @Column({ type: "decimal", precision: 12, scale: 2 })
  subtotal: string;

  @Column({ type: "decimal", precision: 12, scale: 2 })
  tax_total: string;

  @Column({ type: "decimal", precision: 12, scale: 2, nullable: true })
  delivery_fee: string | null;

  @Column({ type: "decimal", precision: 12, scale: 2 })
  total: string;

  @Column({ type: "varchar", length: 3 })
  currency: string;

  @Column({ type: "date" })
  requested_delivery_date: Date;

  @Column({ type: "time", nullable: true })
  requested_delivery_slot_start: string | null;

  @Column({ type: "time", nullable: true })
  requested_delivery_slot_end: string | null;

  @Column({ type: "text", nullable: true })
  notes: string | null;

  @Column({ type: "text", nullable: true })
  internal_notes: string | null;

  @Column({ type: "timestamptz", nullable: true })
  submitted_at: Date | null;

  @Column({ type: "timestamptz", nullable: true })
  confirmed_at: Date | null;

  @Column({ type: "timestamptz", nullable: true })
  delivered_at: Date | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  cancellation_reason: string | null;

  @Column({ type: "timestamptz", nullable: true })
  cancelled_at: Date | null;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at: Date;

  @ManyToOne(() => Business, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "business_id" })
  business: Business;

  @ManyToOne(() => Provider, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "provider_id" })
  provider: Provider;

  @ManyToOne(() => Location, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "delivery_location_id" })
  deliveryLocation: Location;

  @OneToMany(() => OrderLine, (ol) => ol.order)
  orderLines: OrderLine[];

  @OneToOne(() => Delivery, (d) => d.order)
  delivery: Delivery;

  @OneToMany(() => Rating, (r) => r.order)
  ratings: Rating[];
}
