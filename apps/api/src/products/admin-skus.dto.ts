import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  IsInt,
  Min,
  Max,
} from "class-validator";

const SKU_PATTERN = /^[A-Z0-9][A-Z0-9-]*$/;

export class SkuUpsertDto {
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  @Matches(SKU_PATTERN, { message: "sku must be uppercase letters, digits and hyphens" })
  sku!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(60)
  productId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  optionValue?: string | null;

  @IsInt()
  @Min(0)
  @Max(100_000_000)
  priceCents!: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
