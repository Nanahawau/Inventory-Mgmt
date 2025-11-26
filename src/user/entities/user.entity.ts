import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  BeforeInsert,
  BeforeUpdate
} from "typeorm";
import { Exclude } from "class-transformer";
import * as bcrypt from "bcrypt";

/**
 * Simple User entity for admin users.
 * - id: integer primary key
 * - username: unique username
 * - password: hashed password (excluded from JSON serialization)
 *
 * Notes:
 * - This entity hashes the password before insert/update using bcrypt.
 * - Install bcrypt (or bcryptjs) in your project:
 *     npm install bcrypt
 *   or
 *     npm install bcryptjs
 *   If you use bcryptjs, change the import accordingly.
 * - You should also add proper authentication (JWT/session) and password policies in your app.
 */
@Entity({ name: "users" })
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  @Index({ unique: true })
  email!: string;

  // Exclude password from plain object / JSON output
  @Column({ nullable: false })
  @Exclude()
  password!: string;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  // Hash password before saving (only if it's a plain value)
  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (!this.password) return;
    // If password already looks hashed (starts with $2b$ or $2a$), skip hashing.
    // This is a simple heuristic to avoid double-hashing when updating other fields.
    if (this.password.startsWith("$2a$") || this.password.startsWith("$2b$") || this.password.startsWith("$2y$")) {
      return;
    }
    const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;
    this.password = await bcrypt.hash(this.password, saltRounds);
  }

  // Helper to compare a plaintext password with the stored hash
  async comparePassword(plain: string): Promise<boolean> {
    return bcrypt.compare(plain, this.password);
  }
}