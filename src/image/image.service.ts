import { Injectable } from '@nestjs/common';
import { Image } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ImageService {
  constructor(private readonly prisma:PrismaService,){}

  async createImage(filename: string, path: string): Promise<Image> {
    return this.prisma.image.create({
      data: {
        filename,
        path,
      },
    });
  }

  findAll() {
    return this.prisma.image.findMany()
  }

  findOne(id: number) {
    return this.prisma.image.findUnique({
      where:{id}
    })
  }

}
