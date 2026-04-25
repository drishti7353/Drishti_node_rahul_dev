import cron from 'node-cron';
import { sendEventReminders } from './notificationController'; // Adjust the path as needed

// Run every minute
cron.schedule('* * * * *', async () => {
  //console.log('Running sendEventReminders job...');
  await sendEventReminders();
});
