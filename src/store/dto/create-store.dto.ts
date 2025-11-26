import { IsString, IsOptional } from "class-validator";

/**
 * CreateStoreDto
 * - name is required
 * - location optional
 */
export class CreateStoreDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  location?: string;
}