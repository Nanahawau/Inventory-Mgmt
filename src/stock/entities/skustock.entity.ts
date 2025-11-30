import { InventoryItem } from "../../stock/entities/inventoryitems.entity";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Unique,
  OneToMany,
  CreateDateColumn,
  Index
} from "typeorm";
import { Sku } from "../../sku/entities/sku.entity";
import { StockMovement } from "./stockmovement.entity";


@Entity({ name: "sku_stocks" })
@Unique(["inventoryItem", "sku"])
export class SkuStock {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => InventoryItem, (inv) => inv.skuStocks, { onDelete: "CASCADE" })
  @Index()
  inventoryItem!: InventoryItem;

  @ManyToOne(() => Sku, { eager: true, onDelete: "CASCADE" })
  @Index()
  sku!: Sku;

  // physical on-hand quantity
  @Column("integer", { default: 0 })
  stock!: number;

  // reserved quantity for orders/holds
  @Column("integer", { default: 0 })
  reserved!: number;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @OneToMany(() => StockMovement, (m) => m.skuStock)
  movements?: StockMovement[];
}