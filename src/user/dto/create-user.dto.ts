import { ApiProperty } from "@nestjs/swagger";
import { UserType } from "@prisma/client";
import { Transform } from "class-transformer";
import { IsEmail, IsEnum, IsString } from "class-validator";

export class CreateUserDto {
  @ApiProperty()
  @IsString()
  username: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  password: string;

  @ApiProperty()
  @IsEnum(UserType)
  @Transform(({ value }) => UserType[value]) // Transform the enum to its string value
  user_type: UserType;
}