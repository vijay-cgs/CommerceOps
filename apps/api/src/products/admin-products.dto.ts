import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";

const SKU_PATTERN = /^[A-Z0-9][A-Z0-9-]*$/;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class ProductVariantDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(60)
  @Matches(SKU_PATTERN, {
    message: "sku must be uppercase letters, digits and hyphens",
  })
  sku!: string;

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

export class ProductUpsertDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  @Matches(SLUG_PATTERN, {
    message: "slug must be lowercase words separated by hyphens",
  })
  slug!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(160)
  name!: string;

  @IsString()
  @MaxLength(2000)
  description!: string;

  @IsString()
  @MaxLength(60)
  tag!: string;

  @IsString()
  @MaxLength(60)
  category!: string;

  @IsString()
  @MaxLength(120)
  accent!: string;

  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(120, { each: true })
  features!: string[];

  @IsIn(["draft", "active", "archived"])
  status!: "draft" | "active" | "archived";

  @IsOptional()
  @IsString()
  @MaxLength(60)
  optionName?: string | null;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => ProductVariantDto)
  variants!: ProductVariantDto[];
}
