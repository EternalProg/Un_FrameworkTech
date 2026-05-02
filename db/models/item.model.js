import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema(
  {
    device: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['on', 'off'],
      default: 'off',
    },
    room: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    image: {
      type: String,
      default: null,
    },
  },
  {
    collection: 'items',
    versionKey: false,
  },
);

const ItemModel = mongoose.models.Item ?? mongoose.model('Item', itemSchema);

export { ItemModel };
