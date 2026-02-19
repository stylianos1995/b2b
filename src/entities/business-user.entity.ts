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
import { Business } from "./business.entity";

/** @owner Identity Service */
@Entity("business_users")
@Unique(["user_id", "business_id"])
@Index(["business_id"])
export class BusinessUser {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  user_id: string;

  @Column({ type: "uuid" })
  business_id: string;

  @Column({ type: "varchar", length: 30 })
  role: string;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at: Date;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

  @ManyToOne(() => Business, { onDelete: "CASCADE" })
  @JoinColumn({ name: "business_id" })
  business: Business;
}
