import { Product } from "src/product/entities/product.entity";
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Index } from "typeorm";


@Entity()
export class Sku {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  @Index()
  skuCode!: string;

  // JSON details like { color: "red", size: "M" }
  @Column("simple-json", { nullable: true })
  attributes?: Record<string, any> | null;

  @ManyToOne(() => Product, (product) => product.skus, { onDelete: "CASCADE" })
  product!: Product;
}