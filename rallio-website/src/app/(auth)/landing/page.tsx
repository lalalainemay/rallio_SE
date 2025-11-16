import { Logo } from "@/components/logo";
import { AuthBackground } from "@/components/auth-background";
import { Button } from "../../../../components/ui/button";
import Link from "next/link";

export default function LandingPage() {
  return (
    <AuthBackground
      backgroundColor="#006D77"
      backgroundImage="/images/court-background.jpg"
      overlayOpacity={0.3}
    >
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <div className="flex flex-col items-center space-y-8">
          {/* Logo - You can add your logo image by passing imageSrc prop */}
          <Logo
            size={80}
            showText={true}
            // imageSrc="/images/rallio-logo.png" // Uncomment and add your logo image path here
          />

          <div className="mt-12 flex flex-col gap-4">
            <Button
              asChild
              size="lg"
              className="w-64 bg-white text-[#006D77] hover:bg-gray-100 font-semibold text-lg h-12"
            >
              <Link href="/login">Get Started</Link>
            </Button>

            <Button
              asChild
              size="lg"
              variant="outline"
              className="w-64 border-2 border-white text-white hover:bg-white/10 font-semibold text-lg h-12"
            >
              <Link href="/login">Sign In</Link>
            </Button>
          </div>

          <p className="mt-8 text-center text-white/90 text-sm max-w-md">
            Your game starts here. Find courts, join queues, and connect with
            players.
          </p>
        </div>
      </div>
    </AuthBackground>
  );
}
