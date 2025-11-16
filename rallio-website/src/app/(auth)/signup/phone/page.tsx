"use client";

import { useState } from "react";
import { Logo } from "@/components/logo";
import { AuthBackground } from "@/components/auth-background";
import { Button } from "../../../../../components/ui/button";
import { Input } from "../../../../../components/ui/input";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/hooks/useAuth";

export default function PhoneVerificationPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    setError(null);

    // Validate phone number (basic validation)
    const cleanedPhone = phoneNumber.replace(/\D/g, "");
    if (cleanedPhone.length < 10) {
      setError("Please enter a valid phone number");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      // Format phone number (Philippines format)
      const formattedPhone = cleanedPhone.startsWith("63")
        ? `+${cleanedPhone}`
        : `+63${cleanedPhone.startsWith("0") ? cleanedPhone.slice(1) : cleanedPhone}`;

      // Generate random 4-digit verification code
      const verificationCode = Math.floor(
        1000 + Math.random() * 9000
      ).toString();

      // Store phone and verification code in user metadata
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          phone: formattedPhone,
        })
        .eq("id", user?.id);

      if (updateError) throw updateError;

      // Store verification code in localStorage (in production, send via SMS)
      localStorage.setItem("rallio_verification_code", verificationCode);
      localStorage.setItem("rallio_phone_number", formattedPhone);

      // In production, you would send SMS here:
      // await sendSMS(formattedPhone, verificationCode);

      console.log(
        `📱 Verification code for ${formattedPhone}: ${verificationCode}`
      );

      // Redirect to code verification page
      router.push("/signup/verify");
    } catch (err: any) {
      setError(err.message || "Failed to send verification code");
      setLoading(false);
    }
  };

  return (
    <AuthBackground
      backgroundColor="#006D77"
      backgroundImage="/images/court-background.jpg"
      overlayOpacity={0.2}
    >
      <div className="flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-[#006D77]/40 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/10">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <Logo
                size={80}
                showText={false}
                // imageSrc="/images/rallio-logo.png"
              />
            </div>

            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white mb-4">
                Ready to Rally?
              </h1>
              <p className="text-white/80 text-sm">
                Enter your number so we can keep you updated on your next
                match!
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-200 px-4 py-3 rounded-lg text-sm mb-6">
                {error}
              </div>
            )}

            {/* Phone Input */}
            <div className="space-y-2 mb-8">
              <label className="text-white/90 text-sm font-medium block">
                Mobile Number (Philippines)
              </label>
              <Input
                type="tel"
                placeholder="(+63)9054085084"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="h-14 px-4 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40 focus:ring-white/20 text-base"
                disabled={loading}
              />
              <p className="text-white/60 text-xs mt-2">
                We'll send you a verification code
              </p>
            </div>

            {/* Continue Button */}
            <Button
              onClick={handleContinue}
              className="w-full h-14 bg-white text-[#006D77] hover:bg-gray-100 font-semibold text-base"
              disabled={loading || !phoneNumber}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Sending code...
                </>
              ) : (
                "Continue"
              )}
            </Button>

            {/* Skip for now */}
            <button
              onClick={() => router.push("/signup/location")}
              className="w-full mt-4 text-white/70 hover:text-white text-sm underline"
              disabled={loading}
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    </AuthBackground>
  );
}
