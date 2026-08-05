import mongoose from 'mongoose';

const ReadingSchema = new mongoose.Schema(
  {
    vrms: { type: Number, required: true },
    irms: { type: Number, required: true },
    power: { type: Number, required: true }, // watts
    energy: { type: Number, required: true }, // kWh (cumulative)
    real_power_kw: { type: Number, required: true },
    apparent_power_kva: { type: Number, required: true },
    power_factor: { type: Number, required: true },
    reactive_power_kvar: { type: Number, required: true },
    instant_cost: { type: Number, required: true },
    carbon_footprint: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  {
    versionKey: false,
  },
);

ReadingSchema.index({ timestamp: -1 });

const ReadingModel = mongoose.model('Reading', ReadingSchema);

export default ReadingModel;

