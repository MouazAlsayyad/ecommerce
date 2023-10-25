import { PartialType } from '@nestjs/swagger';
import { CreateProductDto, OptionDTO, OptionValueDTO, VarintDTO } from './create-product.dto';

export class UpdateProductDto extends PartialType(CreateProductDto) {}
export class UpdateOptionDTO extends PartialType(OptionDTO) {}
export class UpdateOptionValueDTO extends PartialType(OptionValueDTO) {}
export class UpdateVarintDTO extends PartialType(VarintDTO) {}
