import { BadRequestException, ConflictException, Injectable, Logger } from '@nestjs/common';


import { Prisma } from 'src/prisma/prisma.service';
import { CustomNotFoundException } from 'src/unit/not-found.exception';
import { CreateProductDto, OptionDTO, ProductAttributeDTO, VarintDTO } from './dto/create-product.dto';
import { UpdateOptionDTO, UpdateOptionValueDTO, UpdateProductDto, UpdateVarintDTO } from './dto/update-product.dto';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: Prisma,) { }
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
          await this.createProductAttributes(product.id, createProductDto.attribute,prisma);
  
        if (createProductDto.options)
          await this.createProductOptions(product.id, createProductDto.options, prisma);
  
        if (createProductDto.varints && createProductDto.options)
          await this.createVarints(product.id, createProductDto.varints, prisma);
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
    return this.prisma.$transaction(async (prisma) => {
    const product = await this.prisma.product.update({
      where: { id: productId },
      data: {
        name: updateProductDto.name,
        available: updateProductDto.available,
        basePrice: updateProductDto.basePrice,
        description: updateProductDto.description,
        coverImage: updateProductDto.coverImage
      }
    })
    try {
      if (updateProductDto.attribute)
        this.updateProductAttributes(productId, updateProductDto.attribute,prisma);

      if (updateProductDto.options)
        await this.addOptionsAndOptionValue(productId, updateProductDto.options,prisma);

      if (updateProductDto.varints)
        await this.updateAndAddVarints(productId, updateProductDto.varints,prisma)
    } catch (error) {
      this.logger.error(error)
      return error
    }
    return product
    })
  }

  async findAll() {
    return await this.prisma.product.findMany();

  }


  async remove(id: number) {
    return this.prisma.$transaction(async (prisma) => {
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
  })
  }

  async removeAttribute(productId: number, id: number) {
    return this.prisma.$transaction(async (prisma) => {
      return await prisma.productAttribute.delete({
        where: {
          id,
          productId
        }
      })
    })
  }

  async removeVarint(productId: number, id: number) {
    return this.prisma.$transaction(async (prisma) => {
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
  })
  }

  async removeOptionValue(id: number) {
    return this.prisma.$transaction(async (prisma) => {
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
  })
  }

  async removeOption(productId: number, id: number) {
    return this.prisma.$transaction(async (prisma) => {
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
  })
  }


  async updateOption(productId: number, id: number, updateOptionDto: UpdateOptionDTO) {
    return this.prisma.$transaction(async (prisma) => {
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
  })
  }

  async updateOptionValue(optionId: number, id: number, UpdateOptionValue: UpdateOptionValueDTO) {
    return this.prisma.$transaction(async (prisma) => {
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
  })
  }


  private async varintExists(productId:number,optionValues,prisma:any){


    const existsVarint =  await prisma.varint.findFirst({
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

    if (this.arraysEqual(outputArray, optionValues)) {
      throw new ConflictException('product already has varint with this options')
    }
  }

  async updateVarint(productId: number, id: number, updateVarintDTO: UpdateVarintDTO) {
    return this.prisma.$transaction(async (prisma) => {
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


        if (this.arraysEqual(outputArray, optionValues)) {
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

          await this.createOptionValueVarint(id, optionValue.id, optionValue.optionId,prisma)
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
  })
  }


  private async createVarints(productId: number, varintsDTO: VarintDTO[],prisma:any) {
    // console.log(varintsDTO)
    return Promise.all(varintsDTO.map(async (varintDTO) => {
      const varint = await this.createVarint(productId, varintDTO.available, varintDTO.price, varintDTO.qty, varintDTO.image,prisma)
      await Promise.all(varintDTO.optionValueVarint.map(async (ValueVarint) => {
        // await this.varintExists(productId,varintDTO.optionValueVarint,prisma)
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

        await this.createOptionValueVarint(varint.id, optionValue.id, optionValue.optionId,prisma)
      }))

      return varint;
    }));
  }

  private async createOptionValueVarint(varintId: number, optionValueId: number, optionId: number,prisma:any) {
    const optionValueVarint = await prisma.optionValueVarint.findUnique({
      where: {
        VarintId_optionId: {
          VarintId: varintId,
          optionId,
        }
      }
    })

    if (optionValueVarint)
      await prisma.optionValueVarint.update({
        where: {
          VarintId_optionId: {
            VarintId: varintId,
            optionId,
          }
        },
        data: {
          optionValue: {
            connect: {
              id: optionValueId
            }
          }
        }
      })
    else
      await prisma.optionValueVarint.create({
        data: {
          option: { connect: { id: optionId } },
          varint: { connect: { id: varintId } },
          optionValue: { connect: { id: optionValueId } }
        }
      })
  }


  private arraysEqual(arr1, arr2) {
    if (arr1.length !== arr2.length) return false;

    for (let i = 0; i < arr1.length; i++) {
      if (arr1[i].name !== arr2[i].name) return false;
    }

    return true;
  }

  private async updateAndAddVarints(productId: number, varintsDTO: VarintDTO[],prisma:any) {
    return await Promise.all(varintsDTO.map(async (varintDTO) => {
      const optionValues = varintDTO.optionValueVarint.map((optionValue) => {
        return {
          name: optionValue.optionValue.name
        }
      })

      let varint = await prisma.varint.findFirst({
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

      const outputArray = varint?.optionValueVarint.map(item => {
        return { name: item.optionValue.name };
      });

      if (this.arraysEqual(outputArray, optionValues)) {
        throw new ConflictException('product already has varint with this options')
      }

      if (!varint) {
        varint = await this.createVarint(productId, varintDTO.available, varintDTO.price, varintDTO.qty, varint.image,prisma)
        await Promise.all(varintDTO.optionValueVarint.map(async (ValueVarint) => {
          const optionValue = await prisma.optionValue.findFirstOrThrow({
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
          await this.createOptionValueVarint(varint.id, optionValue.id, optionValue.optionId,prisma)
        }))
        return varint;
      }

      prisma.varint.update({
        where: {
          id: varint.id
        },
        data: {
          available: varint.available,
          price: varint.price,
          qty: varint.qty,
          image: varint.image
        }
      })

    }));
  }
  private async addOptionsAndOptionValue(productId: number, productOptions: OptionDTO[],prisma:any) {
    await Promise.all(productOptions.map(async (optionDto) => {
      let option = await prisma.option.findFirst({
        where: {
          AND: [
            {
              name: optionDto.name
            },
            {
              productId
            }
          ]
        }
      })

      if (!option) {
        option = await this.createOption(productId, optionDto.name,prisma)
        return await Promise.all(optionDto.optionValues.map(async (valueDto) => {
          return await this.createOptionValue(option.id, valueDto.name,prisma)
        }))
      } else {
        optionDto.optionValues.map(async (valueDto) => {
          const optionValue = await prisma.optionValue.findFirst({
            where: {
              AND: [
                {
                  optionId: option.id
                },
                {
                  name: valueDto.name
                }
              ]
            }
          })
          if (!optionValue)
            return await this.createOptionValue(option.id, valueDto.name,prisma)
        })
      }

    }))
  }
  private async updateProductAttributes(productId: number, productAttributes: ProductAttributeDTO[],prisma:any) {
    await Promise.all(productAttributes.map(async (attr) => {
      const productAttribute = await prisma.productAttribute.findFirst({
        where: {
          AND: [
            {
              name: attr.name,
            },
            {
              productId
            }
          ]

        }
      })

      if (productAttribute) {
        await prisma.productAttribute.update({
          data: {
            value: attr.value
          },
          where: {
            id: productAttribute.id
          }
        })
      }
      else {
        await this.createAttribute(productId, attr.name, attr.value,prisma)
      }
    }))

  }

  private async createProductOptions(productId: number, productOptions: OptionDTO[],prisma:any) {
    await Promise.all(productOptions.map(async (optionDto) => {

      const option = await this.createOption(productId, optionDto.name,prisma)
      return await Promise.all(optionDto.optionValues.map(async (valueDto) => {
        if (!valueDto.name)
          throw new BadRequestException('Required property in optionValues (name) is missing.');
        return await this.createOptionValue(option.id, valueDto.name,prisma)
      }))
    }));
  }
  private async createProductAttributes(productId: number, productAttributes: ProductAttributeDTO[],prisma:any) {
    await Promise.all(productAttributes.map((attr) =>
      this.createAttribute(productId, attr.name, attr.value,prisma)
    ));
  }

  private async createVarint(productId: number, available: boolean, price: number, qty: number, image: string,prisma:any) {
    try {
      return await prisma.varint.create({
        data: {
          product: {
            connect: {
              id: productId
            }
          },
          available,
          price,
          qty,
          image
        },
      });
    } catch (error) {
      throw new BadRequestException('Failed to create the varint');
    }
  }
  private async createAttribute(productId: number, name: string, value: string,prisma:any) {
    try {
      return await prisma.productAttribute.create({
        data: {
          productId,
          name,
          value,
        },
      })
    } catch (error) {
      throw new BadRequestException('Failed to create the product attribute');
    }
  }
  private async createOption(productId: number, name: string,prisma:any) {
    try {
      return await prisma.option.create({
        data: {
          name,
          productId
        },
      });
    } catch (error) {
      console.error(error);
      throw new BadRequestException('Failed to create the option');
    }
  }
  private async createOptionValue(optionId: number, name: string,prisma:any) {
    return await prisma.optionValue.create({
      data: {
        name,
        optionId
      },
    });
  }
}
