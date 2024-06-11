import { Prop, Schema } from '@nestjs/mongoose';
import { SchemaTypes } from 'mongoose';

@Schema()
export class ObjectIdDocument {
  @Prop({ type: SchemaTypes.String })
  _id: string;
}
