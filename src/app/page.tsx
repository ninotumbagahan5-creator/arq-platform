import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 text-zinc-50 p-8">
      <div className="max-w-3xl w-full text-center space-y-8">
        
        {/* ARQ Logo / Badge */}
        <div className="mx-auto w-24 h-24 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center shadow-2xl mb-8">
          <span className="text-3xl font-black tracking-tighter bg-gradient-to-br from-white to-zinc-500 bg-clip-text text-transparent">
            ARQ
          </span>
        </div>

        {/* Hero Headline */}
        <h1 className="text-5xl font-semibold tracking-tight sm:text-7xl">
          Your Curriculum <br />
          <span className="text-zinc-500">Engineered.</span>
        </h1>
        
        <p className="text-lg text-zinc-400 max-w-xl mx-auto leading-relaxed">
          The platform is alive. CI/CD pipelines are connected. Database is spun up. ARQ is ready for you to build the future of learning.
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-4 pt-8">
          <button className="px-6 py-3 rounded-full bg-white text-black font-medium hover:bg-zinc-200 transition-colors">
            Get Started
          </button>
          <button className="px-6 py-3 rounded-full bg-zinc-900 border border-zinc-800 text-white font-medium hover:bg-zinc-800 transition-colors">
            Learn More
          </button>
        </div>

      </div>
    </main>
  );
}
