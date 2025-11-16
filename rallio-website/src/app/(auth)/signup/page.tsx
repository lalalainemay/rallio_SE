"use client";

import { useState } from "react";
import { Logo } from "@/components/logo";
import { AuthBackground } from "@/components/auth-background";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { useAuth } from "@/lib/hooks/useAuth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const { signUp, signInWithGoogle } = useAuth();

  const [formData, setFormData] = useState({
    firstName: "",
    middleInitial: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!agreedToTerms) {
      setError("Please agree to the Terms and Conditions");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    const fullName = `${formData.firstName} ${formData.middleInitial ? formData.middleInitial + '. ' : ''}${formData.lastName}`.trim();

    const { error } = await signUp(formData.email, formData.password, {
      full_name: fullName,
      first_name: formData.firstName,
      middle_initial: formData.middleInitial,
      last_name: formData.lastName,
      onboarding_completed: false,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      // Redirect to phone verification
      router.push("/signup/phone");
    }
  };

  const handleGoogleSignup = async () => {
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || "Failed to sign up with Google");
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
            <div className="flex justify-center mb-6">
              <Logo
                size={48}
                showText={false}
                // imageSrc="/images/rallio-logo.png"
              />
            </div>

            {/* Header */}
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-white mb-2">Sign up</h1>
              <p className="text-white/80 text-sm">
                Create an account to get started
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-200 px-4 py-3 rounded-lg text-sm mb-4">
                {error}
              </div>
            )}

            {/* Signup Form */}
            <form onSubmit={handleSignup} className="space-y-3">
              {/* First Name */}
              <div>
                <label className="text-white/80 text-sm mb-1 block">
                  First Name
                </label>
                <Input
                  type="text"
                  name="firstName"
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="h-12 px-4 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-white/40 focus:ring-white/20"
                  required
                  disabled={loading}
                />
              </div>

              {/* Middle Initial */}
              <div>
                <label className="text-white/80 text-sm mb-1 block">
                  Middle Initial
                </label>
                <Input
                  type="text"
                  name="middleInitial"
                  placeholder="Middle Initial"
                  maxLength={1}
                  value={formData.middleInitial}
                  onChange={handleChange}
                  className="h-12 px-4 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-white/40 focus:ring-white/20"
                  disabled={loading}
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="text-white/80 text-sm mb-1 block">
                  Last Name
                </label>
                <Input
                  type="text"
                  name="lastName"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="h-12 px-4 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-white/40 focus:ring-white/20"
                  required
                  disabled={loading}
                />
              </div>

              {/* Email */}
              <div>
                <label className="text-white/80 text-sm mb-1 block">
                  Email
                </label>
                <Input
                  type="email"
                  name="email"
                  placeholder="name@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="h-12 px-4 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-white/40 focus:ring-white/20"
                  required
                  disabled={loading}
                />
              </div>

              {/* Password */}
              <div>
                <label className="text-white/80 text-sm mb-1 block">
                  Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={handleChange}
                    className="h-12 px-4 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-white/40 focus:ring-white/20 pr-12"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="text-white/80 text-sm mb-1 block">
                  Confirm Password
                </label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="Confirm password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="h-12 px-4 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-white/40 focus:ring-white/20 pr-12"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                    disabled={loading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="flex items-start gap-2 pt-2">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-white/20 bg-white/10 text-white focus:ring-white/20"
                  disabled={loading}
                />
                <label htmlFor="terms" className="text-white/80 text-xs">
                  I've read and agree with the{" "}
                  <Link
                    href="/terms"
                    className="text-white underline hover:text-white/80"
                  >
                    Terms and Conditions
                  </Link>{" "}
                  and the{" "}
                  <Link
                    href="/privacy"
                    className="text-white underline hover:text-white/80"
                  >
                    Privacy Policy
                  </Link>
                  .
                </label>
              </div>

              {/* Sign Up Button */}
              <Button
                type="submit"
                className="w-full h-12 bg-white text-[#006D77] hover:bg-gray-100 font-semibold text-base mt-4"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Sign up"
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-[#006D77]/40 px-4 text-white/80">Or</span>
              </div>
            </div>

            {/* Google Sign Up */}
            <Button
              type="button"
              onClick={handleGoogleSignup}
              variant="outline"
              className="w-full h-12 bg-white text-gray-700 hover:bg-gray-100 border-white font-semibold text-base"
              disabled={loading}
            >
              <svg
                className="mr-2 h-5 w-5"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </Button>

            {/* Sign In Link */}
            <div className="mt-4 text-center">
              <p className="text-white/80 text-sm">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="text-white font-semibold hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </AuthBackground>
  );
}
