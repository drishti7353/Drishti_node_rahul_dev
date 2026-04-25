// delete_latest_events.js

const mongoose = require('mongoose');

// Replace with your actual connection string
const MONGO_URI = 'mongodb+srv://acetechnosys:qhZuiCNN6brp0DxL@cluster0.qxvyy.mongodb.net/srisridrishti';

const eventSchema = new mongoose.Schema({}, { strict: false });
const Event = mongoose.model('Event', eventSchema, 'events');

async function deleteLatestEvents() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

  // Find the 15 latest events (sorted by creation time, newest first)
  const latestEvents = await Event.find({}).sort({ _id: -1 }).limit(15).lean();

  if (latestEvents.length === 0) {
    console.log('No events found to delete.');
    await mongoose.disconnect();
    return;
  }

  const idsToDelete = latestEvents.map(event => event._id);
  console.log('Deleting the following event IDs:', idsToDelete);

  const result = await Event.deleteMany({ _id: { $in: idsToDelete } });

  console.log(`Deleted ${result.deletedCount} events.`);

  await mongoose.disconnect();
}

deleteLatestEvents().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});