import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn
} from "typeorm";
import { SkuStock } from "./skustock.entity";

@Entity({ name: "stock_movements" })
export class StockMovement {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => SkuStock, (ss) => ss.movements, { onDelete: "SET NULL", nullable: true })
  skuStock: SkuStock | null;

  @Column()
  skuId!: number;

  @Column()
  inventoryItemId!: number;

  @Column("integer")
  delta!: number;

  @Column()
  type!: string;

  @Column({ nullable: true, type: "varchar"})
  reference?: string | null;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;
}