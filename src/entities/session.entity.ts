import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { User } from "./user.entity";

/** @owner Identity Service */
@Entity("sessions")
@Index(["user_id"])
@Index(["token_hash"])
@Index(["expires_at"])
export class Session {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  user_id: string;

  @Column({ type: "varchar", length: 255 })
  token_hash: string;

  @Column({ type: "timestamptz" })
  expires_at: Date;

  @Column({ type: "timestamptz", nullable: true })
  revoked_at: Date | null;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;
}
