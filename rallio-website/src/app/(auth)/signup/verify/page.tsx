"use client";

import { useState, useRef, useEffect } from "react";
import { Logo } from "@/components/logo";
import { AuthBackground } from "@/components/auth-background";
import { Button } from "../../../../../components/ui/button";
import { useRouter } from "next/navigation";
import { Loader2, Bell } from "lucide-react";

export default function CodeVerificationPage() {
  const router = useRouter();
  const [code, setCode] = useState(["", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showNotification, setShowNotification] = useState(true);
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Get verification code from localStorage
  const [storedCode, setStoredCode] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  useEffect(() => {
    const code = localStorage.getItem("rallio_verification_code") || "";
    const phone = localStorage.getItem("rallio_phone_number") || "";
    setStoredCode(code);
    setPhoneNumber(phone);

    // Auto-hide notification after 5 seconds
    const timer = setTimeout(() => {
      setShowNotification(false);
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  const handleCodeChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 4);
    const newCode = pastedData.split("");

    setCode([
      newCode[0] || "",
      newCode[1] || "",
      newCode[2] || "",
      newCode[3] || "",
    ]);

    // Focus last filled input
    const lastIndex = Math.min(newCode.length, 3);
    inputRefs[lastIndex].current?.focus();
  };

  const handleVerify = async () => {
    setError(null);
    const enteredCode = code.join("");

    if (enteredCode.length !== 4) {
      setError("Please enter the complete 4-digit code");
      return;
    }

    setLoading(true);

    // Simulate verification delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Verify code
    if (enteredCode === storedCode) {
      // Clear stored code
      localStorage.removeItem("rallio_verification_code");

      // Mark phone as verified
      localStorage.setItem("rallio_phone_verified", "true");

      // Redirect to location page
      router.push("/signup/location");
    } else {
      setError("Invalid verification code. Please try again.");
      setCode(["", "", "", ""]);
      inputRefs[0].current?.focus();
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError(null);

    // Generate new code
    const newCode = Math.floor(1000 + Math.random() * 9000).toString();
    localStorage.setItem("rallio_verification_code", newCode);

    console.log(`📱 New verification code: ${newCode}`);

    // Show success message
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 5000);
  };

  return (
    <AuthBackground
      backgroundColor="#006D77"
      backgroundImage="/images/court-background.jpg"
      overlayOpacity={0.2}
    >
      <div className="flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Notification */}
          {showNotification && storedCode && (
            <div className="mb-4 bg-[#006D77]/60 backdrop-blur-sm rounded-2xl p-4 border border-white/10 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-start gap-3">
                <div className="bg-white rounded-full p-2">
                  <Bell className="h-4 w-4 text-[#006D77]" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-white text-sm">
                      RALLIO
                    </span>
                    <span className="text-white/60 text-xs">1min ago</span>
                  </div>
                  <p className="text-white text-sm">
                    Your Rallio Verification Code is{" "}
                    <span className="font-bold">{storedCode}</span>.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-[#006D77]/40 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/10">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <Logo
                size={64}
                showText={false}
                // imageSrc="/images/rallio-logo.png"
              />
            </div>

            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-white mb-2">
                Enter confirmation code
              </h1>
              <p className="text-white/70 text-sm">
                A 4-digit code was sent to
                <br />
                <span className="font-medium">{phoneNumber}</span>
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-200 px-4 py-3 rounded-lg text-sm mb-6">
                {error}
              </div>
            )}

            {/* Code Inputs */}
            <div
              className="flex justify-center gap-3 mb-8"
              onPaste={handlePaste}
            >
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={inputRefs[index]}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-16 h-16 text-center text-2xl font-bold bg-white/10 border-2 border-white/20 text-white rounded-xl focus:border-white focus:ring-2 focus:ring-white/20 focus:outline-none transition-all"
                  disabled={loading}
                />
              ))}
            </div>

            {/* Resend Code */}
            <button
              onClick={handleResendCode}
              className="w-full mb-4 text-white/80 hover:text-white text-sm font-medium py-3 border border-white/20 rounded-xl hover:bg-white/5 transition-colors"
              disabled={loading}
            >
              Resend code
            </button>

            {/* Continue Button */}
            <Button
              onClick={handleVerify}
              className="w-full h-14 bg-white text-[#006D77] hover:bg-gray-100 font-semibold text-base"
              disabled={loading || code.some((d) => !d)}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Continue"
              )}
            </Button>

            {/* Dev Info */}
            {process.env.NODE_ENV === "development" && storedCode && (
              <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-yellow-200 text-xs text-center">
                  <strong>Dev Mode:</strong> Code is {storedCode}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthBackground>
  );
}
