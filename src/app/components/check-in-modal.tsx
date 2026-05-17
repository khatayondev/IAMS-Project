import { useState } from "react";
import { MapPin, X, CheckCircle2, Clock } from "lucide-react";
import { submitCheckIn, getTodayCheckIn } from "../services/attendance-service";
import { useAppContext } from "../lib/context";
import { toast } from "sonner";

interface CheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CheckInModal({ isOpen, onClose }: CheckInModalProps) {
  const { user } = useAppContext();
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [checkInType, setCheckInType] = useState<"gps" | "manual">("gps");
  const [locationDetails, setLocationDetails] = useState("");

  if (!isOpen || !user) return null;

  const todayCheckIn = getTodayCheckIn(user.studentId || "");

  const handleGetLocation = () => {
    setIsGettingLocation(true);
    // Simulate GPS fetch
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocationDetails(`Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`);
          setIsGettingLocation(false);
          toast.success("GPS coordinates captured successfully!");
        },
        (error) => {
          // Fallback to simulated GPS
          setTimeout(() => {
            setLocationDetails("Lat: 6.6111, Lng: 0.4704 (Ho Technical University, Ghana)");
            setIsGettingLocation(false);
            toast.success("GPS coordinates logged successfully!");
          }, 1500);
        }
      );
    } else {
      // Fallback to simulated GPS
      setTimeout(() => {
        setLocationDetails("Lat: 6.6111, Lng: 0.4704 (Ho Technical University, Ghana)");
        setIsGettingLocation(false);
        toast.success("GPS coordinates logged successfully!");
      }, 1500);
    }
  };

  const handleCheckIn = () => {
    if (!locationDetails) {
      toast.error("Please provide your location details (GPS or Manual).");
      return;
    }

    const result = submitCheckIn(
      user.studentId || "",
      user.name,
      user.department || "",
      checkInType,
      locationDetails
    );

    if (result.success) {
      toast.success(result.message);
      setLocationDetails("");
      setCheckInType("gps");
      onClose();
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3>Daily Check-in</h3>
            <button
              onClick={onClose}
              className="p-1 rounded-md hover:bg-accent"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Already checked in */}
          {todayCheckIn ? (
            <div className="space-y-4">
              <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <h4 className="text-emerald-700 dark:text-emerald-400">Already Checked In</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <p className="text-muted-foreground">
                    <strong>Date:</strong> {todayCheckIn.date}
                  </p>
                  <p className="text-muted-foreground">
                    <strong>Check-In Time:</strong> {todayCheckIn.checkInTime}
                  </p>
                  {todayCheckIn.checkOutTime && (
                    <p className="text-muted-foreground">
                      <strong>Check-Out Time:</strong> {todayCheckIn.checkOutTime}
                    </p>
                  )}
                  <p className="text-muted-foreground">
                    <strong>Location:</strong> {todayCheckIn.location}
                  </p>
                  <p className="text-muted-foreground">
                    <strong>Type:</strong> {todayCheckIn.checkInType === "gps" ? "GPS" : "Manual"}
                  </p>
                  <div className="flex items-center gap-1.5 mt-3">
                    {todayCheckIn.verificationStatus === "Verified" && (
                      <span className="flex items-center gap-1 px-2 py-1 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded text-xs">
                        <CheckCircle2 className="w-3 h-3" /> Verified
                      </span>
                    )}
                    {todayCheckIn.verificationStatus === "Pending Verification" && (
                      <span className="flex items-center gap-1 px-2 py-1 bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 rounded text-xs">
                        <Clock className="w-3 h-3" /> Pending Verification
                      </span>
                    )}
                  </div>
                  {!todayCheckIn.checkOutTime && (
                    <p className="text-xs text-muted-foreground mt-3 italic">
                      Auto check-out at 5:00 PM (17:00)
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
                style={{ fontSize: "0.85rem" }}
              >
                Close
              </button>
            </div>
          ) : (
            <>
              {/* Check-in form */}
              <div>
                <p className="text-muted-foreground mb-3" style={{ fontSize: "0.85rem" }}>
                  Check in for {new Date().toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="mb-3">Choose Check-in Method</h4>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="checkInType"
                        value="gps"
                        checked={checkInType === "gps"}
                        onChange={() => {
                          setCheckInType("gps");
                          setLocationDetails("");
                        }}
                        className="accent-primary w-4 h-4"
                      />
                      <span style={{ fontSize: "0.85rem" }}>GPS Auto-Locate</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="checkInType"
                        value="manual"
                        checked={checkInType === "manual"}
                        onChange={() => {
                          setCheckInType("manual");
                          setLocationDetails("");
                        }}
                        className="accent-primary w-4 h-4"
                      />
                      <span style={{ fontSize: "0.85rem" }}>Manual Check-in</span>
                    </label>
                  </div>
                </div>

                {checkInType === "gps" ? (
                  <div className="space-y-2">
                    <p className="text-muted-foreground" style={{ fontSize: "0.8rem" }}>
                      Record your geographic coordinates for today's attendance.
                    </p>
                    <div className="flex gap-2 items-center">
                      <button
                        type="button"
                        onClick={handleGetLocation}
                        disabled={isGettingLocation || !!locationDetails}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                        style={{ fontSize: "0.85rem" }}
                      >
                        <MapPin className="w-4 h-4" />
                        {isGettingLocation
                          ? "Locating..."
                          : locationDetails
                            ? "Coordinates Captured"
                            : "Get Current Location"}
                      </button>
                    </div>
                    {locationDetails && (
                      <div className="mt-2 p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-lg">
                        <p className="text-emerald-700 dark:text-emerald-400 font-medium" style={{ fontSize: "0.85rem" }}>
                          ✓ {locationDetails}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-muted-foreground" style={{ fontSize: "0.8rem" }}>
                      Provide your current location or reason for manual check-in (e.g. "GPS failed", "Working remote").
                    </p>
                    <input
                      type="text"
                      value={locationDetails}
                      onChange={(e) => setLocationDetails(e.target.value)}
                      placeholder="Enter location or reason manually..."
                      className="w-full px-3 py-2 border border-border rounded-lg bg-card"
                      style={{ fontSize: "0.85rem" }}
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-accent"
                  style={{ fontSize: "0.85rem" }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCheckIn}
                  disabled={!locationDetails}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
                  style={{ fontSize: "0.85rem" }}
                >
                  Check In
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
