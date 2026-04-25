const user = require("./modules/user/userRoute");
const event = require("./modules/event/eventRoute");
const course = require("./modules/courses/coursesRoute");
const address = require("./modules/address/addressRoute");
const cronJob = require("./common/utils/cron");
const banner = require("./modules/banners/bannersRoute");
const notification = require("./modules/notification/notificationRoute")
const profile = require("./modules/profile/profileRoute")

// const room = require("./modules/room/roomRoute");

module.exports = (app) => {
  cronJob();
  app.use("/user", user);
  app.use("/event", event);
  app.use("/course", course);
  app.use("/address", address);
  app.use("/banner", banner);
  app.use('/notifications', notification);
  app.use('/profile', profile)

  // app.use("/room", room);
  app.get("/", (request, response) => {
    response.send({ result: "success" });
  });

  // Deep link route for course sharing
  app.get("/course/:eventId", (request, response) => {
    const eventId = request.params.eventId;
    
    // Return HTML that redirects to app or shows app download links
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Sri Sri Drishti - Course Link</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
            .container { max-width: 400px; margin: 0 auto; }
            .logo { font-size: 24px; font-weight: bold; color: #ff6b35; margin-bottom: 20px; }
            .message { margin: 20px 0; }
            .download-links { margin: 20px 0; }
            .download-btn { 
                display: inline-block; 
                padding: 12px 24px; 
                margin: 10px; 
                background: #ff6b35; 
                color: white; 
                text-decoration: none; 
                border-radius: 8px; 
            }
        </style>
        <script>
            // Try to open the app with deep link
            setTimeout(function() {
                window.location.href = 'srisridrishti://course/${eventId}';
            }, 1000);
        </script>
    </head>
    <body>
        <div class="container">
            <div class="logo">🎯 Sri Sri Drishti</div>
            <div class="message">
                <h3>Opening Course...</h3>
                <p>If the app doesn't open automatically, download it below:</p>
            </div>
            <div class="download-links">
                <a href="https://play.google.com/store/apps/details?id=com.drishti.android" class="download-btn">
                    📱 Download for Android
                </a>
            </div>
        </div>
    </body>
    </html>`;
    
    response.send(html);
  });
};
