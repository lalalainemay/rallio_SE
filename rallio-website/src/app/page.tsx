import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold text-center mb-8">
          Welcome to Rallio
        </h1>
        <p className="text-center text-gray-600 mb-12">
          Find badminton courts and manage queues in Zamboanga City
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Find Courts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Search for badminton courts near you with real-time
                availability.
              </p>
              <Button asChild className="w-full">
                <Link href="/courts">Browse Courts</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Join Queue</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Join a queue session and get matched with players of similar
                skill.
              </p>
              <Button asChild className="w-full">
                <Link href="/queues">View Queues</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Track your games, view statistics, and manage your skill
                rating.
              </p>
              <Button asChild className="w-full">
                <Link href="/profile">View Profile</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}