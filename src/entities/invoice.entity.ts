import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from "typeorm";
import { Provider } from "./provider.entity";
import { Business } from "./business.entity";
import { InvoiceLine } from "./invoice-line.entity";
import { Payment } from "./payment.entity";

/** @owner Payment Service */
@Entity("invoices")
@Index(["provider_id", "status"])
@Index(["business_id", "status"])
@Index(["invoice_number"], { unique: true })
export class Invoice {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 50, unique: true })
  invoice_number: string;

  @Column({ type: "uuid" })
  provider_id: string;

  @Column({ type: "uuid" })
  business_id: string;

  @Column({ type: "varchar", length: 20, default: "draft" })
  status: string;

  @Column({ type: "decimal", precision: 12, scale: 2 })
  subtotal: string;

  @Column({ type: "decimal", precision: 12, scale: 2 })
  tax_total: string;

  @Column({ type: "decimal", precision: 12, scale: 2 })
  total: string;

  @Column({ type: "varchar", length: 3 })
  currency: string;

  @Column({ type: "date" })
  due_date: Date;

  @Column({ type: "timestamptz", nullable: true })
  issued_at: Date | null;

  @Column({ type: "timestamptz", nullable: true })
  paid_at: Date | null;

  /** Set when a Stripe Checkout session is created for this invoice; used by webhook to find invoice. */
  @Column({ type: "varchar", length: 255, nullable: true })
  stripe_session_id: string | null;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at: Date;

  @ManyToOne(() => Provider, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "provider_id" })
  provider: Provider;

  @ManyToOne(() => Business, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "business_id" })
  business: Business;

  @OneToMany(() => InvoiceLine, (il) => il.invoice)
  invoiceLines: InvoiceLine[];

  @OneToMany(() => Payment, (p) => p.invoice)
  payments: Payment[];
}
