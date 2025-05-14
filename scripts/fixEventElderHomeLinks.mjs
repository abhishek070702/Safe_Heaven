import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://abhishekchithrasena0707:U7qcV6iraUAU9z1d@cluster0.nmbtgvj.mongodb.net/donor_management';

const eventSchema = new mongoose.Schema({
  name: String,
  elderHomeId: { type: mongoose.Schema.Types.ObjectId, ref: 'ElderHome' },
});
const elderHomeSchema = new mongoose.Schema({
  name: String,
  contactNumber: String,
});

const Event = mongoose.model('Event', eventSchema, 'events');
const ElderHome = mongoose.model('ElderHome', elderHomeSchema, 'elderhomes');

async function fixEvents() {
  await mongoose.connect(MONGODB_URI);
  const homes = await ElderHome.find({ name: { $exists: true, $ne: '' }, contactNumber: { $exists: true, $ne: '' } });
  if (homes.length === 0) {
    console.log('No elder homes with names and contact numbers found.');
    process.exit(0);
  }
  const firstHome = homes[0];
  const events = await Event.find();
  let updated = 0;
  for (const event of events) {
    let home = null;
    if (event.elderHomeId) {
      home = homes.find(h => h._id.equals(event.elderHomeId));
    }
    if (!home) {
      // Assign the first available home
      event.elderHomeId = firstHome._id;
      await event.save();
      updated++;
      console.log(`Updated event '${event.name}' to use elder home '${firstHome.name}'`);
    }
  }
  console.log(`Done. Updated ${updated} events.`);
  process.exit(0);
}

fixEvents().catch(err => { console.error(err); process.exit(1); }); 