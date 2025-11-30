import { InventoryItem } from "../../stock/entities/inventoryitems.entity";
import { Sku } from "../../sku/entities/sku.entity";
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

  @Column("decimal", { precision: 10, scale: 2, default: 0 })
  price: number;

  @Column({ nullable: true, type: "text" })
  description?: string | null;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt?: Date;
  @OneToMany(() => Sku, (sku) => sku.product, { cascade: true, eager: true })
  skus?: Sku[];

  @OneToMany(() => InventoryItem, (inv) => inv.product)
  inventoryItems?: InventoryItem[];
}