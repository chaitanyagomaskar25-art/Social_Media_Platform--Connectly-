import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/common/Button';
import ThemeToggle from '../components/common/ThemeToggle';
import { Home, Compass, Search, Feather } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-bg-primary text-txt-primary flex flex-col justify-between p-6">
      <div className="flex items-center justify-between max-w-4xl w-full mx-auto">
        <Link to="/feed" className="flex items-center gap-2 font-serif font-bold text-lg tracking-tight">
          <span className="w-8 h-8 rounded-xl bg-accent text-white flex items-center justify-center text-sm font-sans font-black shadow-editorial-xs">
            C
          </span>
          <span>Connectly</span>
        </Link>
        <ThemeToggle variant="switch" />
      </div>

      <main className="max-w-md w-full mx-auto text-center py-16 space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-accent/10 text-accent border border-accent/20 shadow-editorial-sm">
          <Feather className="w-7 h-7" />
        </div>

        <div>
          <span className="editorial-chip font-mono text-xs">Error 404 • Missing Dispatch</span>
          <h1 className="mt-3 text-3xl sm:text-4xl font-serif font-bold tracking-tight text-txt-primary">
            A story left unwritten.
          </h1>
          <p className="mt-2 text-sm text-txt-secondary leading-relaxed">
            The page or dispatch you are looking for has been archived, relocated, or may have never existed in this edition.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Link to="/feed" className="w-full sm:w-auto">
            <Button icon={Home} size="md" className="w-full sm:w-auto">
              Return to Feed
            </Button>
          </Link>
          <Link to="/explore" className="w-full sm:w-auto">
            <Button variant="outline" icon={Compass} size="md" className="w-full sm:w-auto">
              Explore Dispatches
            </Button>
          </Link>
        </div>
      </main>

      <footer className="text-center font-mono text-xs text-txt-muted py-4">
        Connectly Editorial Platform • {new Date().getFullYear()}
      </footer>
    </div>
  );
}
