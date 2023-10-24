import { Injectable, Logger } from '@nestjs/common';

import { Prisma } from 'src/prisma/prisma.service';
import { CustomNotFoundException } from 'src/unit/not-found.exception';
import { OptionDTO, ProductAttributeDTO, ProductDTO, VarintDTO } from './dto/create-product.dto';


@Injectable()
export class ProductService {
  constructor(private readonly prisma:Prisma,){}
  private readonly logger = new Logger(ProductService.name);

async createProduct(createProductDto:ProductDTO) {
  
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

  private async createProductOptions(productId: number, productOptions:OptionDTO[]) {
    const optionPromises = productOptions.map(async (optionDto) => {
      const option = await this.prisma.option.create({
        data: {
          name: optionDto.name,
          productId
        },
      });
      
      const optionValuePromises = await Promise.all( optionDto.optionValues.map(async (valueDto) => {
        
        const optionValue = await this.prisma.optionValue.create({
          data: {
            name: valueDto.name,
            optionId: option.id,
          },
        });
        return optionValue
      }))
      return optionValuePromises;
    });

    await Promise.all(optionPromises);
  }

  private async createProductAttributes(productId: number,productAttributes:ProductAttributeDTO[]) {
    const attributePromises = productAttributes.map((attr) =>
      this.prisma.productAttribute.create({
        data: {
          productId,
          name: attr.name,
          value: attr.value,
        },
      })
    );

    await Promise.all(attributePromises);
  }

  async createVarints(productId: number, varintsDTO:VarintDTO[]) {
    const varintPromises = varintsDTO.map(async (varintDTO) => {
      const varint = await this.prisma.varint.create({
        data: {
          product:{
            connect:{
              id:productId
            }
          },
          available: varintDTO.available,
          price: varintDTO.price,
          qty: varintDTO.qty,
        },
      });


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

        await this.prisma.optionValueVarint.create({
          data:{
            varint:{connect:{id:varint.id}},
            optionValue:{
              connect:{
              id:optionValue.id
            }
          }
          }
        })
      }))

      return varint;
    });
  
    return Promise.all(varintPromises);
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
}
