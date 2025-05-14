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
});

const Event = mongoose.model('Event', eventSchema, 'events');
const ElderHome = mongoose.model('ElderHome', elderHomeSchema, 'elderhomes');

// Option 1: Assign by Event Name
const eventToHomeMap = {
  "Bood donation for child": "elder home 01",
  "book donation": "elder home 02"
  // Add more mappings as needed
};

async function fixEvents() {
  await mongoose.connect(MONGODB_URI);
  const homes = await ElderHome.find({ name: { $exists: true, $ne: '' } });
  if (homes.length === 0) {
    console.log('No elder homes with names found.');
    process.exit(0);
  }
  const events = await Event.find();
  let updated = 0;
  for (const event of events) {
    let assignedHome = null;
    const mappedHomeName = eventToHomeMap[event.name];
    if (mappedHomeName) {
      assignedHome = homes.find(h => h.name === mappedHomeName);
    }
    if (!assignedHome) {
      assignedHome = homes[0]; // fallback
    }
    if (!event.elderHomeId || !event.elderHomeId.equals(assignedHome._id)) {
      event.elderHomeId = assignedHome._id;
      await event.save();
      updated++;
      console.log(`Updated event '${event.name}' to use elder home '${assignedHome.name}'`);
    }
  }
  console.log(`Done. Updated ${updated} events.`);
  process.exit(0);
}

fixEvents().catch(err => { console.error(err); process.exit(1); }); 