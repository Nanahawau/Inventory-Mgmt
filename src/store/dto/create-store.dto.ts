import { IsString, IsBoolean } from "class-validator";

export class CreateStoreDto {
  @IsBoolean()
  isCentral: boolean;

  @IsString()
  name!: string;

  @IsString()
  location?: string;
}