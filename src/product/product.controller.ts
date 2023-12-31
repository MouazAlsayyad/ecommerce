import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
// import { UpdateVarintDTO } from './dto/update-product.dto';
import { CreateProductDto, ProductFilterDTO } from './dto/create-product.dto';
import { UpdateAttributeDTO, UpdateVarintDTO } from './dto/update-product.dto';
import { ProductService } from './product.service';


@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  create(@Body() createProductDto:CreateProductDto) { 
    return this.productService.createProduct(createProductDto);
  }

  @Get()
  
  findAll(@Query() filters: ProductFilterDTO) {
    return this.productService.findAll(filters);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProductDto) {
    return this.productService.update(+id, updateProductDto);
  }

  @Patch(':productId/option/:id')
  updateOption(@Param('id') id: string, @Param('productId') productId: string, @Body() updateOptionDto) {
    return this.productService.updateOption(+productId,+id, updateOptionDto);
  }

  @Patch(':productId/option/:OptionId/optionValue/:id')
  updateOptionValue(@Param('id') id: string, @Param('OptionId') OptionId: string, @Body() updateOptionValueDTO) {
    return this.productService.updateOptionValue(+OptionId,+id, updateOptionValueDTO);
  }

  @Patch(':productId/varint/:id')
  updateVarint(@Param('id') id: string, @Param('productId') productId: string, @Body() updateVarintDTO:UpdateVarintDTO){
    return this.productService.updateVarint(+productId,+id, updateVarintDTO);
  }


  @Patch(':productId/attribute/:id')
  updateAttribute(@Param('id') id: string, @Param('productId') productId: string, @Body() updateAttributeDTO:UpdateAttributeDTO){
    return this.productService.updateAttribute(+productId,+id, updateAttributeDTO);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productService.remove(+id);
  }

  @Delete(':productId/attribute/:id')
  removeAttribute(@Param('productId') productId: string,@Param('id') id: string) {
    return this.productService.removeAttribute(+productId,+id);
  }

  @Delete(':productId/varint/:id')
  removeVarint(@Param('productId') productId: string,@Param('id') id: string) {
    return this.productService.removeVarint(+productId,+id);
  }

  @Delete('optionValue/:id')
  removeOptionValue(@Param('id') id: string) {
    return this.productService.removeOptionValue(+id);
  }
  @Delete(':productId/option/:id')
  removeOption(@Param('productId') productId: string,@Param('id') id: string) {
    return this.productService.removeOption(+productId,+id);
  }
}
