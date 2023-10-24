import { ApiProperty } from "@nestjs/swagger";
import { ArrayMinSize, IsInt, IsNumber } from "class-validator";

export class CreateOrderDto {
  @ApiProperty()
  @IsInt()
  userId: number;

  @ApiProperty()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  productIds: number[];

  @ApiProperty()
  @IsNumber()
  totalPrice: number;
}