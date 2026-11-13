import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import ThemeToggle from '../components/common/ThemeToggle';
import {
  Sparkles,
  Mail,
  Lock,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Compass,
} from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const { showSuccess } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const from = location.state?.from?.pathname || '/feed';

  const validate = () => {
    const newErrors = {};
    if (!identifier.trim()) newErrors.identifier = 'Email address is required';
    if (!password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setServerError('');

    try {
      await login({
        email: identifier.trim(),
        password,
      });

      showSuccess('Welcome back!');
      navigate(from, { replace: true });
    } catch (err) {
      setServerError(err.message || 'Invalid credentials. Please verify your details.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-txt-primary flex flex-col justify-between py-6 px-4 sm:px-6 lg:px-8 relative selection:bg-accent selection:text-white transition-colors duration-300 overflow-x-hidden">
      {/* Ambient Decorative Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[350px] sm:h-[450px] bg-gradient-to-b from-accent/15 via-accent/5 to-transparent blur-3xl pointer-events-none -z-10 rounded-full" />
      <div className="hidden sm:block absolute bottom-10 -right-32 w-80 h-80 bg-accent/5 blur-3xl pointer-events-none -z-10 rounded-full" />

      {/* Top Header Bar */}
      <header className="max-w-5xl mx-auto w-full flex items-center justify-between pb-4">
        {/* Back to Home Button */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface/80 hover:bg-surface border border-border-medium hover:border-accent/40 text-xs font-semibold text-txt-secondary hover:text-txt-primary shadow-editorial-xs hover:shadow-editorial-sm transition-all group"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-txt-tertiary group-hover:text-accent group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Home</span>
        </Link>

        {/* Theme Toggle */}
        <ThemeToggle variant="icon" />
      </header>

      {/* Main Content Area */}
      <main className="my-auto py-6 sm:py-8 w-full">
        {/* Brand Header */}
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <Link to="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-accent to-accent-hover text-white flex items-center justify-center shadow-editorial-sm group-hover:scale-105 transition-transform duration-200">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <span className="font-serif font-bold text-2xl tracking-tight text-txt-primary block leading-none">
                Connectly
              </span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-accent font-semibold">
                Atelier
              </span>
            </div>
          </Link>

          <h1 className="mt-5 text-2xl sm:text-3xl font-serif font-bold tracking-tight text-txt-primary">
            Welcome back
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-txt-secondary max-w-sm mx-auto">
            Sign in to continue your mindful conversations, stories, and feed.
          </p>
        </div>

        {/* Card Form */}
        <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-surface/95 backdrop-blur-xl py-7 px-5 sm:px-9 shadow-editorial-lg rounded-3xl border border-border-medium transition-colors">
            {serverError && (
              <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-start gap-2.5 text-xs font-medium animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                <span className="leading-relaxed">{serverError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                id="identifier"
                label="Email address"
                icon={Mail}
                type="email"
                placeholder="jane@example.com"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  if (errors.identifier) setErrors((prev) => ({ ...prev, identifier: undefined }));
                  if (serverError) setServerError('');
                }}
                error={errors.identifier}
                required
              />

              <Input
                id="password"
                label="Password"
                type="password"
                icon={Lock}
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                  if (serverError) setServerError('');
                }}
                error={errors.password}
                required
              />

              <div className="pt-2">
                <Button
                  type="submit"
                  isLoading={isLoading}
                  size="lg"
                  className="w-full py-3 text-sm font-semibold rounded-2xl bg-accent hover:bg-accent-hover text-white shadow-editorial-sm hover:shadow-editorial-md transition-all"
                  icon={ArrowRight}
                  iconPosition="right"
                >
                  Log In
                </Button>
              </div>
            </form>

            {/* Switch to Register */}
            <div className="mt-6 pt-5 border-t border-border-subtle text-center space-y-3">
              <p className="text-xs text-txt-secondary">
                Don't have an account yet?
              </p>
              <Link to="/register" className="block">
                <Button
                  variant="outline"
                  className="w-full py-2.5 text-xs font-semibold rounded-xl shadow-editorial-xs border-border-medium hover:border-accent/40"
                >
                  Register for Connectly
                </Button>
              </Link>
            </div>

            {/* Explore without signing in */}
            <div className="mt-5 text-center">
              <Link
                to="/explore"
                className="inline-flex items-center gap-1.5 text-xs font-mono text-txt-secondary hover:text-accent transition-colors"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Or explore public perspectives first</span>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-md mx-auto w-full py-4 text-center text-[11px] font-mono text-txt-muted flex items-center justify-center gap-3">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-accent" /> Encrypted Session
        </span>
        <span>&bull;</span>
        <Link to="/" className="hover:text-txt-primary transition-colors">
          Home
        </Link>
        <span>&bull;</span>
        <span>&copy; {new Date().getFullYear()} Connectly</span>
      </footer>
    </div>
  );
}
