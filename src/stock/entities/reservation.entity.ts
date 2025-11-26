import { InventoryItem } from "src/stock/entities/inventoryitems.entity";
import { Sku } from "src/sku/entities/sku.entity";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index
} from "typeorm";

/**
 * Reservation / hold record for a SKU at an inventory item (e.g., central pool).
 * - id: integer primary key
 * - inventoryItem: the InventoryItem (store or central) this reservation is against
 * - sku: the SKU being reserved
 * - quantity: integer reserved quantity
 * - status: lifecycle state ("active" | "fulfilled" | "released")
 * - reference: optional external id (order id, etc.)
 * - expiresAt: when the reservation automatically becomes releasable
 * - createdAt / updatedAt timestamps
 */
@Entity({ name: "reservations" })
@Index(["status", "expiresAt"])
export class Reservation {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => InventoryItem, { onDelete: "CASCADE" })
  @Index()
  inventoryItem!: InventoryItem;

  @ManyToOne(() => Sku, { onDelete: "CASCADE" })
  @Index()
  sku!: Sku;

  @Column("integer")
  quantity!: number;

  @Column({ type: "varchar", length: 32, default: "active" })
  status!: "active" | "fulfilled" | "released";

  @Column({ nullable: true, type: "varchar" })
  reference?: string | null;

  @Column({ type: "timestamptz", nullable: true })
  expiresAt?: Date | null;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}