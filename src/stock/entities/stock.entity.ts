import { Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "stocks" })
export class Stock {
    @PrimaryGeneratedColumn()
    id!: number;
}