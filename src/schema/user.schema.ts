import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectIdDocument } from 'src/dto/common.schema';

@Schema({ collection: 'users' })
export class User extends ObjectIdDocument {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  age: string;

  @Prop({ required: true })
  role: string;

  @Prop({ required: true })
  companyname: string;

  @Prop({ required: true })
  image: string;

  @Prop({ required: true, enum: ['active', 'inactive'], default: 'active' })
  status: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
