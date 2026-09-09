import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";

export class OrderLineDto {
  @IsString()
  @MaxLength(60)
  productId!: string;

  @IsString()
  @MaxLength(60)
  sku!: string;

  @IsInt()
  @Min(1)
  @Max(99)
  quantity!: number;
}

export class PlaceOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => OrderLineDto)
  items!: OrderLineDto[];

  @IsString()
  @MinLength(2)
  @MaxLength(120)
  shippingName!: string;

  @IsString()
  @MinLength(4)
  @MaxLength(200)
  shippingAddress!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  shippingCity!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(20)
  shippingPostalCode!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(64)
  idempotencyKey!: string;
}
