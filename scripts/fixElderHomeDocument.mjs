import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://abhishekchithrasena0707:U7qcV6iraUAU9z1d@cluster0.nmbtgvj.mongodb.net/donor_management';

const elderHomeSchema = new mongoose.Schema({
  name: String,
  contactNumber: String,
});

const ElderHome = mongoose.model('ElderHome', elderHomeSchema, 'elderhomes');

const homeId = '680e42879dc17909f8170139'; // The ID from your event
const homeName = 'elder home 01';
const contactNumber = '0779516105';

async function fixElderHome() {
  await mongoose.connect(MONGODB_URI);
  const existing = await ElderHome.findById(homeId);
  if (existing) {
    await ElderHome.updateOne({ _id: homeId }, { $set: { name: homeName, contactNumber } });
    console.log('Updated existing ElderHome:', homeId);
  } else {
    await ElderHome.create({ _id: homeId, name: homeName, contactNumber });
    console.log('Created new ElderHome:', homeId);
  }
  process.exit(0);
}

fixElderHome().catch(err => { console.error(err); process.exit(1); }); 