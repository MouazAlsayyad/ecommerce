import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { ProductModule } from './product/product.module';
import { PrismaModule } from './prisma/prisma.module';
// import { JwtModule } from '@nestjs/jwt';
import { ImageModule } from './image/image.module';


@Module({
  imports: [UserModule, ProductModule,PrismaModule, ImageModule],
  controllers: [],
  providers: [],
})

export class AppModule{}

