import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

/** @owner Business Service (owner_type=business) / Provider Service (owner_type=provider) */
@Entity("locations")
@Index(["owner_type", "owner_id"])
@Index(["postal_code"])
export class Location {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 255 })
  address_line_1: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  address_line_2: string | null;

  @Column({ type: "varchar", length: 100 })
  city: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  region: string | null;

  @Column({ type: "varchar", length: 20 })
  postal_code: string;

  @Column({ type: "varchar", length: 2 })
  country: string;

  @Column({ type: "decimal", precision: 10, scale: 7, nullable: true })
  latitude: string | null;

  @Column({ type: "decimal", precision: 10, scale: 7, nullable: true })
  longitude: string | null;

  @Column({ type: "varchar", length: 30 })
  location_type: string;

  @Column({ type: "varchar", length: 20 })
  owner_type: string;

  @Column({ type: "uuid" })
  owner_id: string;

  @Column({ type: "boolean", default: false })
  is_default: boolean;

  @Column({ type: "varchar", length: 100, nullable: true })
  contact_name: string | null;

  @Column({ type: "varchar", length: 50, nullable: true })
  contact_phone: string | null;

  @Column({ type: "text", nullable: true })
  delivery_instructions: string | null;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at: Date;
}
