import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#F9F9F6] flex flex-col">
      {/* Navbar */}
      <nav className="p-6 flex justify-between items-center max-w-7xl mx-auto w-full">
        <span className="text-xl font-bold tracking-tight">Censeo</span>
        <div className="flex gap-4">
          <Link href="/login">
            <Button variant="ghost" className="hover:bg-transparent hover:text-accent transition-colors">Log In</Button>
          </Link>
          <Link href="/login">
            <Button className="rounded-full px-6">Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col justify-center items-center text-center px-4 py-20">
        <div className="max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary/10 text-secondary-foreground hover:bg-secondary/20 uppercase tracking-widest mb-4">
            Beta Access
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground leading-[1.1]">
            <span className="block">Ditch the</span>
            <span className="block text-secondary">LeetCode Grind.</span>
          </h1>
          <p className="text-xl text-secondary max-w-2xl mx-auto leading-relaxed">
            The modern platform for engineering judgment. Design scenario-based technical interviews that focus on tradeoffs, decisions, and actual engineering work.
          </p>

          <div className="flex flex-col items-center justify-center gap-2 pt-4">
            <Link href="/login">
              <Button size="lg" className="rounded-full px-12 h-14 text-lg">
                Start for Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <p className="text-xs text-secondary opacity-60">
              No credit card required.
            </p>
          </div>
        </div>
      </section>

      {/* Features / Social Proof */}
      <section className="bg-white py-24 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-12">
          <div className="space-y-4">
            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 text-accent">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold">Real Scenarios</h3>
            <p className="text-secondary">Replace algorithmic puzzles with realistic system design and tradeoff discussions.</p>
          </div>
          <div className="space-y-4">
            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 text-accent">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold">Asynchronous</h3>
            <p className="text-secondary">Respect candidate time. Allow them to think deeply and respond without a timer staring them down.</p>
          </div>
          <div className="space-y-4">
            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 text-accent">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold">Human Review</h3>
            <p className="text-secondary">AI assists with summarization, but human engineers make the final hiring decision.</p>
          </div>
        </div>
      </section>

      <footer className="py-10 text-center text-sm text-secondary bg-[#F9F9F6]">
        &copy; {new Date().getFullYear()} Censeo.dev. All rights reserved.
      </footer>
    </main>
  );
}
