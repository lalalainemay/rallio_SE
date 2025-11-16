"use client";

import { useState } from "react";
import { AuthBackground } from "@/components/auth-background";
import { Button } from "../../../../../components/ui/button";
import { useRouter } from "next/navigation";
import { MapPin, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/useAuth";

export default function LocationPermissionPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEnableLocation = () => {
    setError(null);
    setLoading(true);

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const supabase = createClient();

          // Save location to user profile
          const { error: updateError } = await supabase
            .from("profiles")
            .update({
              onboarding_completed: true,
            })
            .eq("id", user?.id);

          if (updateError) throw updateError;

          // Store location preference
          localStorage.setItem("rallio_location_enabled", "true");
          localStorage.setItem(
            "rallio_user_location",
            JSON.stringify({ latitude, longitude })
          );

          // Redirect to dashboard
          router.push("/dashboard");
        } catch (err: any) {
          setError(err.message || "Failed to save location");
          setLoading(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setError(
          "Unable to get your location. Please enable location services."
        );
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleRemindLater = async () => {
    try {
      const supabase = createClient();

      // Mark onboarding as complete even without location
      await supabase
        .from("profiles")
        .update({
          onboarding_completed: true,
        })
        .eq("id", user?.id);

      localStorage.setItem("rallio_location_enabled", "false");

      router.push("/dashboard");
    } catch (err: any) {
      console.error(err);
      router.push("/dashboard");
    }
  };

  return (
    <AuthBackground
      backgroundColor="#006D77"
      overlayOpacity={0.15}
    >
      <div className="flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-2xl">
            {/* Location Icon */}
            <div className="flex justify-center mb-6">
              <div className="bg-[#006D77] rounded-full p-6">
                <MapPin className="h-12 w-12 text-white" />
              </div>
            </div>

            {/* Header */}
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-3">
                Enable precise location
              </h1>
              <p className="text-gray-600 text-sm leading-relaxed">
                Your precise location is used to show courts near you, estimate
                travel times and improve search results.
              </p>
            </div>

            {/* Precision Toggle (Visual Only) */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-[#006D77]" />
                  <span className="text-sm font-medium text-gray-700">
                    Precise: On
                  </span>
                </div>
                <div className="bg-[#006D77] rounded-full p-1">
                  <div className="w-8 h-4 relative">
                    <div className="absolute right-0 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
                {error}
              </div>
            )}

            {/* Enable Location Button */}
            <Button
              onClick={handleEnableLocation}
              className="w-full h-14 bg-[#006D77] text-white hover:bg-[#005862] font-semibold text-base mb-3"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Getting location...
                </>
              ) : (
                "Enable Location"
              )}
            </Button>

            {/* Remind Me Later */}
            <Button
              onClick={handleRemindLater}
              variant="outline"
              className="w-full h-14 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold text-base"
              disabled={loading}
            >
              Remind me later
            </Button>

            {/* Info Text */}
            <p className="text-xs text-gray-500 text-center mt-6 leading-relaxed">
              You can change this setting anytime in your profile preferences.
              We respect your privacy and only use location data to enhance your
              experience.
            </p>
          </div>
        </div>
      </div>
    </AuthBackground>
  );
}
