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
import { Order } from "./order.entity";
import { Product } from "./product.entity";

/** @owner Order Service */
@Entity("order_lines")
@Index(["order_id"])
export class OrderLine {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  order_id: string;

  @Column({ type: "varchar", length: 20 })
  line_type: string;

  @Column({ type: "uuid", nullable: true })
  product_id: string | null;

  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({ type: "decimal", precision: 12, scale: 3 })
  quantity: string;

  @Column({ type: "varchar", length: 20 })
  unit: string;

  @Column({ type: "decimal", precision: 12, scale: 2 })
  unit_price: string;

  @Column({ type: "decimal", precision: 5, scale: 4 })
  tax_rate: string;

  @Column({ type: "decimal", precision: 12, scale: 2 })
  line_total: string;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at: Date;

  @ManyToOne(() => Order, { onDelete: "CASCADE" })
  @JoinColumn({ name: "order_id" })
  order: Order;

  @ManyToOne(() => Product, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "product_id" })
  product: Product | null;
}
