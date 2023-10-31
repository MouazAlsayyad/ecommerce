import { BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { OptionDTO, ProductAttributeDTO, VarintDTO } from './dto/create-product.dto';

const logger = new Logger('ProductService');

export async function createVarints(
  productId: number,
  varintsDTO: VarintDTO[],
  prisma: Prisma.TransactionClient
) {
  return Promise.all(
    varintsDTO.map(async (varintDTO) => {
      const varint = await createVarint(productId, varintDTO.available, varintDTO.price, varintDTO.qty, varintDTO.image, prisma);

      await Promise.all(
        varintDTO.optionValueVarint.map(async (ValueVarint) => {
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
          });

          if (!optionValue)
            throw new ConflictException(`not found ${ValueVarint.optionValue.name}`);

          await createOptionValueVarint(varint.id, optionValue.id, optionValue.optionId, prisma);
        })
      );

      return varint;
    })
  );
}

export  async function  createOptionValueVarint(varintId: number, optionValueId: number, optionId: number,prisma:Prisma.TransactionClient) {
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


export function  arraysEqual(arr1, arr2) {
  if (arr1.length !== arr2.length) return false;

  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i].name !== arr2[i].name) return false;
  }

  return true;
}

export async function updateAndAddVarints(
  productId: number,
  varintsDTO: VarintDTO[],
  prisma: Prisma.TransactionClient
) {
  return await Promise.all(
    varintsDTO.map(async (varintDTO) => { // Use arrow functions here
      const optionValues = varintDTO.optionValueVarint.map((optionValue) => {
        return {
          name: optionValue.optionValue.name
        };
      });

      const varint = await prisma.varint.findFirst({
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
        }
      });

      const outputArray = varint?.optionValueVarint.map((item) => {
        return { name: item.optionValue.name };
      });

      if (arraysEqual(outputArray, optionValues)) {
        throw new ConflictException('product already has varint with these options');
      }

      if (!varint) {
        const newVarint = await createVarint(
          productId,
          varintDTO.available,
          varintDTO.price,
          varintDTO.qty,
          varintDTO.image,
          prisma
        );
        await Promise.all(
          varintDTO.optionValueVarint.map(async (ValueVarint) => { // Use arrow functions here
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
            });
            createOptionValueVarint(newVarint.id, optionValue.id, optionValue.optionId, prisma);
          })
        );
        return newVarint;
      }

      await prisma.varint.update({
        where: {
          id: varint.id
        },
        data: {
          available: varintDTO.available,
          price: varintDTO.price,
          qty: varintDTO.qty,
          image: varintDTO.image
        }
      });
    })
  );
}

export async function addOptionsAndOptionValue(
  productId: number,
  productOptions: OptionDTO[],
  prisma: Prisma.TransactionClient
) {
  return await Promise.all(
    productOptions.map(async (optionDto) => {
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
      });

      if (!option) {
        option = await createOption(productId, optionDto.name, prisma);
        await Promise.all(
          optionDto.optionValues.map(async (valueDto) => {
            await createOptionValue(option.id, valueDto.name, prisma);
          })
        );
      } else {
        await Promise.all(optionDto.optionValues.map(async (valueDto) => {
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
          });
          if (!optionValue) {
            await createOptionValue(option.id, valueDto.name, prisma);
          }
        }));
      }
    })
  );
}

export async function updateProductAttributes(
  productId: number,
  productAttributes: ProductAttributeDTO[],
  prisma: Prisma.TransactionClient
) {
  try {
    await Promise.all(
      productAttributes.map(async (attr) => {
        const productAttribute = await prisma.productAttribute.findFirst({
          where: {
            AND: [
              {
                name: attr.name,
              },
              {
                productId,
              },
            ],
          },
        });

        if (productAttribute) {
          await prisma.productAttribute.update({
            data: {
              value: attr.value,
            },
            where: {
              id: productAttribute.id,
            },
          });
        } else {
          await createAttribute(productId, attr.name, attr.value, prisma);
        }
      })
    );
  } catch (error) {
    logger.error(error);
    return error;
  }
}

export async function createProductOptions(
  productId: number,
  productOptions: OptionDTO[],
  prisma: Prisma.TransactionClient
) {
  await Promise.all(
    productOptions.map(async (optionDto) => {
      const option = await createOption(productId, optionDto.name, prisma);
      await Promise.all(
        optionDto.optionValues.map(async (valueDto) => {
          if (!valueDto.name) {
            throw new BadRequestException('Required property in optionValues (name) is missing.');
          }
          await createOptionValue(option.id, valueDto.name, prisma);
        })
      );
    })
  );
}

export  async function  createProductAttributes(productId: number, productAttributes: ProductAttributeDTO[],prisma:Prisma.TransactionClient) {
  await Promise.all(productAttributes.map((attr) =>
    createAttribute(productId, attr.name, attr.value,prisma)
  ));
}

export  async function  createVarint(productId: number, available: boolean, price: number, qty: number, image: string,prisma:Prisma.TransactionClient) {
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

export  async function  createAttribute(productId: number, name: string, value: string,prisma:Prisma.TransactionClient) {
  try {
    const productAttribute = await prisma.productAttribute.findFirst({
      where:{
        AND:[
          {
            productId
          },
          {
            name
          }
        ]
      }
    })
    if(productAttribute)
      throw new BadRequestException(`The product already has this Attribute ${name}`);
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


export  async function  createOption(productId: number, name: string,prisma:Prisma.TransactionClient) {
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


export  async function createOptionValue(optionId: number, name: string,prisma:Prisma.TransactionClient) {
  return await prisma.optionValue.create({
    data: {
      name,
      optionId
    },
  });
}