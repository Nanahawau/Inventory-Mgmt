import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index
} from "typeorm";

@Entity({ name: "transfers" })
export class Transfer {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  @Index()
  fromInventoryItemId!: number;

  @Column()
  @Index()
  toInventoryItemId!: number;

  @Column()
  skuId!: number;

  @Column("integer")
  quantity!: number;

  @Column({ nullable: true, type: "varchar" })
  reference?: string | null;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;
}