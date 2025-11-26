import { InventoryItem } from "src/stock/entities/inventoryitems.entity";
import { Sku } from "src/sku/entities/sku.entity";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  Index,
  CreateDateColumn
} from "typeorm";

@Entity({ name: "products" })
export class Product {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar'})
  @Index()
  name: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  category: string | null;

  // decimal maps to numeric/decimal in the DB
  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  price: number;

  @Column({ nullable: true, type: "text" })
  description?: string | null;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt?: Date;

  // Product-level SKUs (eager to simplify reads)
  @OneToMany(() => Sku, (sku) => sku.product, { cascade: true, eager: true })
  skus?: Sku[];

  // InventoryItems that reference this product (inverse)
  @OneToMany(() => InventoryItem, (inv) => inv.product)
  inventoryItems?: InventoryItem[];
}