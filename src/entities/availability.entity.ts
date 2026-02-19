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
import { Provider } from "./provider.entity";

/** @owner Provider Service */
@Entity("availability")
@Index(["provider_id"])
export class Availability {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  provider_id: string;

  @Column({ type: "varchar", length: 30 })
  availability_type: string;

  @Column({ type: "int", nullable: true })
  day_of_week: number | null;

  @Column({ type: "time", nullable: true })
  start_time: string | null;

  @Column({ type: "time", nullable: true })
  end_time: string | null;

  @Column({ type: "date", nullable: true })
  valid_from: Date | null;

  @Column({ type: "date", nullable: true })
  valid_until: Date | null;

  @Column({ type: "jsonb", nullable: true })
  region_postcodes: string[] | null;

  @Column({ type: "decimal", precision: 8, scale: 2, nullable: true })
  radius_km: string | null;

  @Column({ type: "boolean", default: true })
  is_active: boolean;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at: Date;

  @ManyToOne(() => Provider, { onDelete: "CASCADE" })
  @JoinColumn({ name: "provider_id" })
  provider: Provider;
}
