How push Notifications Work

First,
define the expo token
define the channels (I don't know what they are used for)
Define the notification
Define the notificationListener
Define the responseListener

Once the component has been rendered
You can registerPushNotificationsAsync to receive a token
If platform is android, you must get the notification channels
You also need to define the notification listener
You also need to define the response listener


In case you unmount the component, you should use a cleanup function to ensure that you remove  the notification 
and response listeners from the notification subscription



If you want to send a notification, you need to use the static scheduleNotificationAsync
