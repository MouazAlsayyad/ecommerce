import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNumber, IsString } from 'class-validator';

export class ProductFilterDTO {
  @ApiProperty({ required: false })
  name?: string;

  @ApiProperty({ required: false })
  maxPrice?: number;

  @ApiProperty({ required: false })
  minPrice?: number;
}


export class CreateProductDto {  
  @IsString()
  @ApiProperty()
  name: string;

  @IsString()
  @ApiProperty()
  description: string;


  @IsString()
  @ApiProperty({required:false})
  coverImage: string;

  @IsNumber()
  @ApiProperty()
  basePrice: number;

  @IsBoolean()
  @ApiProperty({required:false})
  available: boolean;

  @ApiProperty()
  options: OptionDTO[];

  @ApiProperty()
  varints: VarintDTO[];

  @ApiProperty()
  attribute: ProductAttributeDTO[];
}

export class OptionDTO {
  @IsString()
  @ApiProperty()
  name: string;


  @ApiProperty({ type: CreateProductDto })
  product: CreateProductDto;

  @ApiProperty()
  optionValues: OptionValueDTO[];

  @ApiProperty()
  optionValueVarint: OptionValueVarintDTO[];
}

export class OptionValueDTO {
  @IsString()
  @ApiProperty()
  name: string;

  @ApiProperty({ type: OptionDTO })
  option: OptionDTO;

  @ApiProperty()
  optionValueVarint: OptionValueVarintDTO[];
}

export class VarintDTO {
  @IsNumber()
  @ApiProperty()
  price: number; 

  @IsInt()
  @ApiProperty()
  qty: number;

  @IsBoolean()
  @ApiProperty({required:false})
  available: boolean;

  @IsString()
  @ApiProperty({required:false})
  image: string;

  @ApiProperty({ type: CreateProductDto })
  product: CreateProductDto;

  @ApiProperty()
  optionValueVarint: OptionValueVarintDTO[];
}

export class OptionValueVarintDTO {
  @ApiProperty({ type: OptionValueDTO })
  optionValue: OptionValueDTO;

  @ApiProperty({ type: OptionDTO })
  option: OptionDTO;

  @ApiProperty({ type: VarintDTO })
  varint: VarintDTO;
}

export class ProductAttributeDTO {
  @IsString()
  @ApiProperty()
  name: string;

  @IsString()
  @ApiProperty()
  value: string;
}
