import { Product } from "src/product/entities/product.entity";
import { SkuStock } from "src/stock/entities/skustock.entity";
import { Store } from "src/store/entities/store.entity";
import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  OneToMany,
  Unique,
  Index,
  CreateDateColumn
} from "typeorm";

@Entity({ name: "inventory_items" })
@Unique(["store", "product"])
export class InventoryItem {
  @PrimaryGeneratedColumn()
  id!: number;

  // the store that carries this product
  @ManyToOne(() => Store, (s) => s.inventory, { onDelete: "CASCADE" })
  @Index()
  store?: Store;

  // the product being carried (eager for reads)
  @ManyToOne(() => Product, (p) => p.inventoryItems, { onDelete: "CASCADE", eager: true })
  @Index()
  product?: Product;

  // optional per-store price override; when null use product.price
  @Column("decimal", { precision: 10, scale: 2, nullable: true })
  priceOverride?: number  | null; 

  @Column("boolean", { default: true })
  isActive?: boolean;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt?: Date;

  // SKU-level stock records for this (store,product)
  @OneToMany(() => SkuStock, (ss) => ss.inventoryItem, { cascade: true })
  skuStocks?: SkuStock[];
}