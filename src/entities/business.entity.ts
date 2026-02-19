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
} from 'typeorm';
import { Location } from './location.entity';
import { BusinessUser } from './business-user.entity';
import { PreferredSupplier } from './preferred-supplier.entity';

/** @owner Business Service */
@Entity('businesses')
@Index(['status'])
export class Business {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  legal_name: string;

  @Column({ type: 'varchar', length: 255 })
  trading_name: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  registration_number: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  tax_id: string | null;

  @Column({ type: 'varchar', length: 30 })
  business_type: string;

  @Column({ type: 'varchar', length: 30, default: 'pending_verification' })
  status: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  logo_url: string | null;

  @Column({ type: 'varchar', length: 3, default: 'GBP' })
  default_currency: string;

  @Column({ type: 'uuid', nullable: true })
  default_delivery_address_id: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @ManyToOne(() => Location, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'default_delivery_address_id' })
  defaultDeliveryAddress: Location | null;

  @OneToMany(() => BusinessUser, (bu) => bu.business)
  userMemberships: BusinessUser[];

  @OneToMany(() => PreferredSupplier, (ps) => ps.business)
  preferredSuppliers: PreferredSupplier[];
}
