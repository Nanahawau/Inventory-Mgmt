import { InventoryItem } from "../../stock/entities/inventoryitems.entity";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  Index,
  CreateDateColumn
} from "typeorm";


@Entity({ name: "stores" })
export class Store {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  @Index()
  name!: string;

  @Column({ nullable: true })
  location?: string;

  @Column({ default: false, type: "boolean", name: "is_central" })
  isCentral?: boolean;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt?: Date;

  @OneToMany(() => InventoryItem, (inv) => inv.store)
  inventory?: InventoryItem[];
}