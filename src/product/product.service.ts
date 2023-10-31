import { ConflictException, Injectable, Logger } from '@nestjs/common';


// import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CustomNotFoundException } from 'src/unit/not-found.exception';
import { CreateProductDto, ProductFilterDTO } from './dto/create-product.dto';
import { UpdateAttributeDTO, UpdateOptionDTO, UpdateOptionValueDTO, UpdateProductDto, UpdateVarintDTO } from './dto/update-product.dto';
import { addOptionsAndOptionValue, arraysEqual, createOptionValueVarint, createProductAttributes, createProductOptions, createVarints, updateAndAddVarints, updateProductAttributes } from './product-service-utils';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService,) { }
  private readonly logger = new Logger(ProductService.name);
  async createProduct(createProductDto: CreateProductDto) {
    return this.prisma.$transaction(async (prisma) => {
      const product = await prisma.product.create({
        data: {
          name: createProductDto.name,
          available: createProductDto.available,
          basePrice: createProductDto.basePrice,
          description: createProductDto.description,
          coverImage: createProductDto.coverImage,
        },
      });
  
      try {
        if (createProductDto.attribute)
          await createProductAttributes(product.id, createProductDto.attribute,prisma);
  
        if (createProductDto.options)
          await createProductOptions(product.id, createProductDto.options, prisma);
  
        if (createProductDto.varints && createProductDto.options)
          await createVarints(product.id, createProductDto.varints, prisma);
      } catch (error) {
        this.logger.error(error);
        throw error;
      }
  
      return product;
    });
  }
  
  async findOne(id: number) {
    return this.prisma.$transaction(async (prisma) => {
    const product = await prisma.product.findUnique({
      where: {
        id
      },
      select: {
        id: true,
        available: true,
        basePrice: true,
        description: true,
        name: true,
        coverImage: true,
        attribute: {
          select: {
            id: true,
            name: true,
            value: true
          },
        },
        varints: {
          select: {
            id: true,
            available: true,
            price: true,
            qty: true,
            image: true,
            optionValueVarint: {
              select: {
                optionValue: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        },
        options: {
          select: {
            id: true,
            name: true,
            optionValues: {
              select: {
                id: true,
                name: true
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
    })
  }

  async update(productId: number, updateProductDto: UpdateProductDto) {
    try {
      return this.prisma.$transaction(async (prisma) => {
        await this.findOne(productId);
  
        const product = await prisma.product.update({
          where: { id: productId },
          data: {
            name: updateProductDto.name,
            available: updateProductDto.available,
            basePrice: updateProductDto.basePrice,
            description: updateProductDto.description,
            coverImage: updateProductDto.coverImage,
          },
        });
  
        if (updateProductDto.attribute) {
          await updateProductAttributes(productId, updateProductDto.attribute, prisma);
        }
  
        if (updateProductDto.options) {
          await addOptionsAndOptionValue(productId, updateProductDto.options, prisma);
        }
  
        if (updateProductDto.varints) {
          await updateAndAddVarints(productId, updateProductDto.varints, prisma);
        }
  
        return product;
      });
    } catch (error) {
      this.logger.error(error);
      return error;
    }
  }

  async findAll(filters:ProductFilterDTO) {
    const price = (filters.minPrice || filters.maxPrice) ? {
      ...(filters.minPrice && { gte: parseFloat(filters.minPrice.toString()) }),
      ...(filters.maxPrice && { lte: parseFloat(filters.maxPrice.toString()) }),
    } : undefined;
    
    delete filters?.minPrice;
    delete filters?.maxPrice;
    
    
    const filter = {
      ...(filters.name && { name: filters.name }),
      ...(price && { varints: { some: { price } } }),
    };

    return await this.prisma.product.findMany({
      where:filter
    });
  }
  
  async remove(id: number) {
    return this.prisma.$transaction(async (prisma) => {
      await this.findOne(id)
    try { 
    await prisma.productAttribute.deleteMany({
      where: {
        productId: id
      }
    })

    await prisma.optionValueVarint.deleteMany({
      where: {
        optionValue: {
          option: {
            productId: id,
          }
        }
      }
    })

    await prisma.varint.deleteMany({
      where: {
        productId: id
      }
    })



    await prisma.optionValue.deleteMany({
      where: {
        option: {
          productId: id
        }
      }
    })

    await prisma.option.deleteMany({
      where: {
        productId: id
      }
    })

    const product = await prisma.product.delete({
      where: { id: id },
    });

    if (!product) {
      throw new CustomNotFoundException(`Product with ID ${id} not found`);
    }

    return product
  } catch (error) {
    this.logger.error(error)
    return error
  }
  })

  }

  async removeAttribute(productId: number, id: number) {
    return this.prisma.$transaction(async (prisma) => {
      try{
        return await prisma.productAttribute.delete({
          where: {
            id,
            productId
          }
        })
      } catch (error) {
        this.logger.error(error)
        return error
      }
    })
  }

  async removeVarint(productId: number, id: number) {
    return this.prisma.$transaction(async (prisma) => {
      try{
        await prisma.optionValueVarint.deleteMany({
          where: {
            VarintId: id
          }
        })
        return await prisma.varint.delete({
          where: {
            id,
            productId
          }
        })
      }catch (error) {
        this.logger.error(error)
        return error
      }
  })
  }

  async removeOptionValue(id: number) {
    return this.prisma.$transaction(async (prisma) => {
      try{
        await prisma.optionValueVarint.deleteMany({
          where: {
            optionValueId: id
          }
        })
  
        return await prisma.optionValue.delete({
          where: {
            id
          }
        })
      }catch (error) {
        this.logger.error(error)
        return error
      }
      
  })
  }

  async removeOption(productId: number, id: number) {
    return this.prisma.$transaction(async (prisma) => {
      try{
        await prisma.optionValueVarint.deleteMany({
          where: {
            optionValue: {
              optionId: id
            }
          }
        })
  
        await prisma.optionValue.deleteMany({
          where: {
            optionId: id
          }
        })
  
        return await prisma.option.delete({
          where: {
            id
          }
        })
      }catch (error) {
        this.logger.error(error)
        return error
      }
  })
  }


  async updateOption(productId: number, id: number, updateOptionDto: UpdateOptionDTO) {
    return this.prisma.$transaction(async (prisma) => {
      try{
        const option = await prisma.option.findFirst({
          where: {
            AND: [
              {
                name: updateOptionDto.name
              },
              {
                productId
              }
            ]
          }
        })
  
        if (option) {
          throw new ConflictException('product already has this option')
        }
  
        return await prisma.option.update({
          where: {
            id,
          },
          data: {
            name: updateOptionDto.name
          }
        })
      } catch (error) {
        this.logger.error(error)
        return error
      }
  })
  }

  async updateAttribute(productId:number,id:number, updateAttributeDTO:UpdateAttributeDTO){
    return this.prisma.$transaction(async (prisma) => {
    const option = await prisma.productAttribute.update({
      where:{
        id
      },
      data:{
        name:updateAttributeDTO.name,
        value:updateAttributeDTO.value
      }
    })

    return option
  })
  }


  async updateOptionValue(optionId: number, id: number, UpdateOptionValue: UpdateOptionValueDTO) {
    return this.prisma.$transaction(async (prisma) => {
      try {
        const OptionValue = await prisma.optionValue.findFirst({
          where: {
            AND: [
              {
                name: UpdateOptionValue.name
              },
              {
                optionId
              }
            ]
          }
        })
        if (OptionValue)
          throw new ConflictException(`option already has this OptionValue`)
  
        return await prisma.optionValue.update({
          where: {
            id,
          },
          data: {
            name: UpdateOptionValue.name
          }
        })
      } catch (error) {
        this.logger.error(error)
        return error
      }
  })
  }

  async updateVarint(productId: number, id: number, updateVarintDTO: UpdateVarintDTO) {
    return this.prisma.$transaction(async (prisma) => {
      try{
        let optionValues
        if (updateVarintDTO.optionValueVarint) {
          optionValues = updateVarintDTO.optionValueVarint.map((optionValue) => {
            return {
              name: optionValue.optionValue.name
            }
          })
  
          const existsVarint = await prisma.varint.findFirst({
            where: {
              AND: [
                {
                  productId
                },
                {
                  optionValueVarint: {
                    none: {
                      optionValue: {
                        AND: optionValues
                      }
                    }
                  }
                }
              ]
            },
            select: {
              id: true,
              optionValueVarint: {
                select: {
                  optionValue: {
                    select: {
                      name: true
                    }
                  }
                }
              }
            },
  
          })
          const outputArray = existsVarint?.optionValueVarint.map(item => {
            return { name: item.optionValue.name };
          });
  
  
          if (arraysEqual(outputArray, optionValues)) {
            throw new ConflictException('product already has varint with this options')
          }
  
          await Promise.all(updateVarintDTO.optionValueVarint.map(async (ValueVarint) => {
            const optionValue = await prisma.optionValue.findFirst({
              where: {
                AND: [
                  {
                    name: ValueVarint.optionValue.name
                  },
                  {
                    option: {
                      productId
                    }
                  }
  
                ]
              }
            })
            if (!optionValue)
              throw new ConflictException(`not found ${ValueVarint.optionValue.name}`)
  
            await createOptionValueVarint(id, optionValue.id, optionValue.optionId,prisma)
          }))
        }
  
        return await prisma.varint.update({
          where: {
            id,
          },
          data: {
            available: updateVarintDTO.available,
            price: updateVarintDTO.price,
            qty: updateVarintDTO.qty
          },
          select: {
            id: true,
            available: true,
            price: true,
            qty: true,
            optionValueVarint: {
              select: {
                optionValue: true
              }
            }
          }
        })

      }catch (error) {
        this.logger.error(error)
        return error
      }
  })
  }
}
