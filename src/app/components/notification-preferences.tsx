import { useState, useEffect } from "react";
import { Bell, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  isSubscribedToPushNotifications,
  getNotificationPermission,
  sendTestNotification,
} from "../lib/push-notifications";

export function NotificationPreferences() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const permission = getNotificationPermission();

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async () => {
    const subscribed = await isSubscribedToPushNotifications();
    setIsSubscribed(subscribed);
  };

  const handleToggleNotifications = async () => {
    setIsLoading(true);
    try {
      if (isSubscribed) {
        const success = await unsubscribeFromPushNotifications();
        if (success) {
          setIsSubscribed(false);
          toast.success("Push notifications disabled");
        }
      } else {
        const subscription = await subscribeToPushNotifications();
        if (subscription) {
          setIsSubscribed(true);
          toast.success("Push notifications enabled! You'll receive updates.");
        } else {
          toast.error("Failed to enable notifications");
        }
      }
    } catch (error) {
      console.error("Error toggling notifications:", error);
      toast.error("Failed to update notification settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendTestNotification = async () => {
    if (!isSubscribed) {
      toast.error("Please enable notifications first");
      return;
    }

    setIsSendingTest(true);
    try {
      await sendTestNotification();
      toast.success("Test notification sent!");
    } catch (error) {
      console.error("Error sending test notification:", error);
      toast.error("Failed to send test notification");
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Notification Permission Status */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <div className="flex items-start gap-3">
          <Bell className="w-5 h-5 text-primary mt-0.5 shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold mb-1">Push Notifications</h3>
            <p className="text-muted-foreground text-sm">
              {permission === "granted"
                ? "You'll receive notifications about logbooks, attendance, grades, and announcements."
                : permission === "denied"
                ? "Notifications are blocked. Enable them in your browser settings to receive updates."
                : "Enable notifications to stay updated with important information."}
            </p>
          </div>
        </div>

        {/* Permission Status Indicator */}
        <div className="flex items-center gap-2 text-sm">
          {permission === "granted" ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="text-emerald-700 dark:text-emerald-400">
                Permission granted
              </span>
            </>
          ) : permission === "denied" ? (
            <>
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-red-700 dark:text-red-400">
                Permission blocked
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span className="text-amber-700 dark:text-amber-400">
                Permission not requested
              </span>
            </>
          )}
        </div>

        {/* Subscription Status */}
        <div className="flex items-center gap-2 text-sm">
          {isSubscribed ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="text-emerald-700 dark:text-emerald-400">
                Subscribed to notifications
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                Not subscribed to notifications
              </span>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={handleToggleNotifications}
            disabled={isLoading || permission === "denied"}
            className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
              isSubscribed
                ? "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50"
                : "bg-primary text-primary-foreground hover:opacity-90"
            } disabled:opacity-50`}
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSubscribed ? "Disable Notifications" : "Enable Notifications"}
          </button>

          {isSubscribed && (
            <button
              onClick={handleSendTestNotification}
              disabled={isSendingTest || !isSubscribed}
              className="px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors font-medium text-sm disabled:opacity-50 flex items-center gap-2"
            >
              {isSendingTest && <Loader2 className="w-4 h-4 animate-spin" />}
              Test Notification
            </button>
          )}
        </div>

        {/* Info Box */}
        {permission === "denied" && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-lg p-3 text-sm text-red-700 dark:text-red-400">
            To enable notifications, please change your browser settings:
            <div className="mt-2 text-xs space-y-1">
              <div>
                <strong>Chrome/Edge:</strong> Settings → Privacy → Site Settings →
                Notifications
              </div>
              <div>
                <strong>Firefox:</strong> Settings → Privacy → Permissions →
                Notifications
              </div>
              <div>
                <strong>Safari:</strong> Preferences → Websites → Notifications
              </div>
            </div>
          </div>
        )}
      </div>

      {/* What You'll Get Section */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="font-semibold mb-3">You'll receive notifications for:</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            Logbook status changes (submitted, approved, rejected)
          </li>
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            Attendance updates and check-in confirmations
          </li>
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            Grade announcements and evaluation results
          </li>
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            Important announcements from DLO/CLO
          </li>
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            Direct messages from supervisors
          </li>
        </ul>
      </div>
    </div>
  );
}
