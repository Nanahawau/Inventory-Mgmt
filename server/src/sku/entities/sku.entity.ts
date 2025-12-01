
import { Product } from "../../product/entities/product.entity";
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Index } from "typeorm";


@Entity()
export class Sku {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  @Index()
  skuCode!: string;

  @Column({ type: 'json', nullable: true })
  attributes: Record<string, string> | null;

  @ManyToOne(() => Product, (product) => product.skus, { onDelete: "CASCADE" })
  product!: Product;
}