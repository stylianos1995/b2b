import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { Invoice } from "./invoice.entity";
import { Business } from "./business.entity";

/** @owner Payment Service */
@Entity("payments")
@Index(["invoice_id"])
@Index(["business_id"])
@Index(["status"])
export class Payment {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  invoice_id: string;

  @Column({ type: "uuid" })
  business_id: string;

  @Column({ type: "decimal", precision: 12, scale: 2 })
  amount: string;

  @Column({ type: "varchar", length: 3 })
  currency: string;

  @Column({ type: "varchar", length: 20 })
  status: string;

  @Column({ type: "varchar", length: 30 })
  method: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  external_id: string | null;

  /** Stripe PaymentIntent id when payment is made via Stripe Checkout. */
  @Column({ type: "varchar", length: 255, nullable: true })
  stripe_payment_intent_id: string | null;

  @Column({ type: "jsonb", nullable: true })
  metadata: Record<string, unknown> | null;

  @Column({ type: "timestamptz", nullable: true })
  paid_at: Date | null;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at: Date;

  @ManyToOne(() => Invoice, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "invoice_id" })
  invoice: Invoice;

  @ManyToOne(() => Business, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "business_id" })
  business: Business;
}
