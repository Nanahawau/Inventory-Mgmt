import { InventoryItem } from "../../stock/entities/inventoryitems.entity";
import { Sku } from "../../sku/entities/sku.entity";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  RelationId
} from "typeorm";

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

  @RelationId((r: Reservation) => r.sku)
  skuId!: number;

  @RelationId((r: Reservation) => r.inventoryItem)
  inventoryItemId!: number;

  @Column({ type: "varchar", length: 32, default: "active" })
  status!: "active" | "cancelled" | "fulfilled";

  @Column({ nullable: true, type: "varchar" })
  reference?: string | null;

  @Column({ type: "timestamptz", nullable: true })
  expiresAt?: Date | null;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}