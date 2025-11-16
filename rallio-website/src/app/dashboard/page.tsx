import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // If onboarding not completed, redirect to phone step
  if (profile && !profile.onboarding_completed) {
    redirect("/signup/phone");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {profile?.first_name || "User"}!
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user.email}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Welcome Card */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              🎉 You're all set!
            </h2>
            <p className="text-gray-600 text-sm">
              Your account has been created and verified. You can now find
              courts and join queues.
            </p>
          </div>

          {/* Profile Info */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Profile Information
            </h2>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-500">Name:</span>{" "}
                <span className="text-gray-900 font-medium">
                  {profile?.full_name}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Email:</span>{" "}
                <span className="text-gray-900">{user.email}</span>
              </div>
              {profile?.phone && (
                <div>
                  <span className="text-gray-500">Phone:</span>{" "}
                  <span className="text-gray-900">{profile.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </h2>
            <div className="space-y-2">
              <button className="w-full text-left px-4 py-2 bg-[#006D77] text-white rounded-lg hover:bg-[#005862] transition-colors">
                Find Courts
              </button>
              <button className="w-full text-left px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                Join Queue
              </button>
              <button className="w-full text-left px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                View Profile
              </button>
            </div>
          </div>
        </div>

        {/* Status Cards */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Games</p>
                <p className="text-2xl font-bold text-gray-900">
                  {profile?.total_games || 0}
                </p>
              </div>
              <div className="text-4xl">🎾</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Skill Level</p>
                <p className="text-2xl font-bold text-gray-900">
                  {profile?.skill_level || 1}/10
                </p>
              </div>
              <div className="text-4xl">⭐</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Win Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {profile?.total_games
                    ? Math.round(
                        ((profile.wins || 0) / profile.total_games) * 100
                      )
                    : 0}
                  %
                </p>
              </div>
              <div className="text-4xl">🏆</div>
            </div>
          </div>
        </div>

        {/* Development Info */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">
            🚀 Dashboard Under Construction
          </h3>
          <p className="text-sm text-blue-700">
            This is a placeholder dashboard. More features coming soon:
          </p>
          <ul className="mt-2 text-sm text-blue-700 space-y-1 ml-4">
            <li>• Court finder with map</li>
            <li>• Real-time queue management</li>
            <li>• Game history and stats</li>
            <li>• Player matching system</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
