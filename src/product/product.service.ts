import { Injectable, Logger } from '@nestjs/common';

import { Prisma } from 'src/prisma/prisma.service';
import { CustomNotFoundException } from 'src/unit/not-found.exception';
import { CreateProductDto, OptionDTO, ProductAttributeDTO, VarintDTO } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';


@Injectable()
export class ProductService {
  constructor(private readonly prisma:Prisma,){}
  private readonly logger = new Logger(ProductService.name);

async createProduct(createProductDto:CreateProductDto) {
  
  const product = await this.prisma.product.create({
    data:{
      name:createProductDto.name,
      available:createProductDto.available,
      basePrice:createProductDto.basePrice,
      description:createProductDto.description,
      totalQty:createProductDto.totalQty,
    }
  })

  if(createProductDto.attribute)
    await this.createProductAttributes(product.id,createProductDto.attribute);

  if (createProductDto.options) 
    await this.createProductOptions(product.id, createProductDto.options);

  if(createProductDto.varints && createProductDto.options)
    await this.createVarints(product.id,createProductDto.varints)
    

  return product;
}







  async findOne(id:number){
    const product = await this.prisma.product.findUnique({
      where:{
        id
      },
      select:{
        id:true,
        available:true,
        basePrice:true,
        description:true,
        name:true,
        totalQty:true,
        attribute:{
          select:{
            name:true,
            value:true
          },
        },
        varints:{
          select:{
            available:true,
            price:true,
            qty:true,
            optionValueVarint:{
              select:{
                optionValue:{
                  select:{
                    name:true
                  }
                }
              }
            }
          }
        }
      }
    })
    if (!product) {
      throw new CustomNotFoundException(`Product with ID ${id} not found`);
    }

    return product
  }

  async update(productId:number,updateProductDto:UpdateProductDto){
    const product = await this.prisma.product.update({
      where:{id:productId},
      data:{
        name:updateProductDto.name,
      available:updateProductDto.available,
      basePrice:updateProductDto.basePrice,
      description:updateProductDto.description,
      totalQty:updateProductDto.totalQty,
      },
      select:{
        options:true,
        
      }
    })
    
    if(updateProductDto.attribute)
      this.updateProductAttributes(productId,updateProductDto.attribute);

    if (updateProductDto.options) 
      await this.updateProductOptions(productId, updateProductDto.options);

    if(updateProductDto.varints)
      await this.updateVarints(productId,updateProductDto.varints)

      return product
  }

  updateVarints(productId: number, varintsDTO:VarintDTO[]){
    return Promise.all(varintsDTO.map(async (varintDTO) => {
      const optionValues = varintDTO.optionValueVarint.map((optionValue)=>{
        return {
          name: optionValue.optionValue.name
        }
      })

      let varint = await this.prisma.varint.findFirst({
        where:{
          AND:[
            {
              productId
            },
            {
              optionValueVarint:{
                every:{
                  optionValue:{
                    AND:optionValues
                  }
                }
              }
            }
          ]
        }
      })

      if(!varint){
        varint = await this.createVarint(productId,varintDTO.available,varintDTO.price,varintDTO.qty)
        await Promise.all(varintDTO.optionValueVarint.map(async (ValueVarint)=>{
          const optionValue = await this.prisma.optionValue.findFirstOrThrow({
            where:{
              AND:[
                {
                  name:ValueVarint.optionValue.name
                },
                {
                  option:{
                    productId
                  }
                }
                
              ]
            }
          })
          await this.createOptionValueVarint(varint.id,optionValue.id)
        }))
        return varint;
      }

      this.prisma.varint.update({
        where:{
          id:varint.id
        },
        data:{
          available:varint.available,
          price:varint.price,
          qty:varint.qty
        }
      })

    }));
  }




  async findAll() {
    const products = await this.prisma.product.findMany();
    return products
  }


  async remove(id: number): Promise<void> {
    const product = await this.prisma.product.delete({
      where: { id },
    });

    if (!product) {
      throw new CustomNotFoundException(`Product with ID ${id} not found`);
    }
  }

  private async updateProductOptions(productId: number, productOptions:OptionDTO[]){
    await Promise.all(productOptions.map(async (optionDto) => {
      let option = await this.prisma.option.findFirst({
        where:{
          AND:[
            {
              name:optionDto.name
            },
            {
              productId
            }
          ]
        }
      })

      if(!option){
        option = await this.createOption(productId,optionDto.name)
        return await Promise.all(optionDto.optionValues.map(async (valueDto) => {
          return await this.createOptionValue(option.id,valueDto.name)
        }))
      }else{
        optionDto.optionValues.map(async (valueDto)=>{
          const optionValue = await this.prisma.optionValue.findFirst({
            where:{
              AND:[
                {
                  optionId:option.id
                },
                {
                  name:valueDto.name
                }
              ]
            }
          })
          if(!optionValue)
            return await this.createOptionValue(option.id,valueDto.name)
        })
      }
      
    }))
  }
  private async updateProductAttributes(productId: number,productAttributes:ProductAttributeDTO[]){
    await Promise.all(productAttributes.map(async (attr) =>{
      const productAttribute = await this.prisma.productAttribute.findFirst({
        where:{ 
          AND:[
            {
              name:attr.name,
            },
            {
              productId
            }
          ]
          
        }
      })
      
      if(productAttribute){
        await this.prisma.productAttribute.update({
          data:{
            value:attr.value
          },
          where:{
            id:productAttribute.id
          }
        })}
      else
        {
          await this.createAttribute(productId,attr.name,attr.value)
        }
    }))
    
  }

  private async createProductOptions(productId: number, productOptions:OptionDTO[]) {
    await Promise.all(productOptions.map(async (optionDto) => {
      const option = await this.createOption(productId,optionDto.name)
      return await Promise.all(optionDto.optionValues.map(async (valueDto) => {
        return await this.createOptionValue(option.id,valueDto.name)
      }))
    }));
  }
  private async createProductAttributes(productId: number,productAttributes:ProductAttributeDTO[]) {
    await Promise.all(productAttributes.map((attr) =>
      this.createAttribute(productId,attr.name,attr.value)
    ));
  }
  async createVarints(productId: number, varintsDTO:VarintDTO[]) {
    return Promise.all(varintsDTO.map(async (varintDTO) => {
      const varint = await this.createVarint(productId,varintDTO.available,varintDTO.price,varintDTO.qty)
      await Promise.all(varintDTO.optionValueVarint.map(async (ValueVarint)=>{
        const optionValue = await this.prisma.optionValue.findFirstOrThrow({
          where:{
            AND:[
              {
                name:ValueVarint.optionValue.name
              },
              {
                option:{
                  productId
                }
              }
              
            ]
          }
        })
        await this.createOptionValueVarint(varint.id,optionValue.id)
      }))

      return varint;
    }));
  }

  private async createOptionValueVarint(varintId:number,optionValue:number){
    await this.prisma.optionValueVarint.create({
      data:{
        varint:{connect:{id:varintId}},
        optionValue:{
          connect:{
          id:optionValue
        }
      }
      }
    })
  }
  private async createVarint(productId:number,available:boolean,price:number,qty:number){
    return await this.prisma.varint.create({
      data: {
        product:{
          connect:{
            id:productId
          }
        },
        available,
        price,
        qty,
      },
    });
  }
  private async createAttribute(productId:number,name:string,value:string){
    return await this.prisma.productAttribute.create({
      data: {
        productId,
        name,
        value,
      },
    })
  }
  private async createOption(productId:number,name:string){
    return await this.prisma.option.create({
      data: {
        name,
        productId
      },
    });
  }
  private async createOptionValue(optionId:number,name:string){
    return await this.prisma.optionValue.create({
      data: {
        name,
        optionId
      },
    });
  }
}
