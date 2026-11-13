import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import ThemeToggle from '../components/common/ThemeToggle';
import {
  Sparkles,
  User,
  Mail,
  Lock,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Compass,
} from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const { showSuccess } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Full name is required';
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Only letters, numbers, and underscores are allowed';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please provide a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (serverError) setServerError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setServerError('');

    try {
      await register({
        name: formData.name.trim(),
        username: formData.username.trim().toLowerCase(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      showSuccess('Account created! Welcome to Connectly.');
      navigate('/feed', { replace: true });
    } catch (err) {
      setServerError(err.message || 'Registration failed. Please check your inputs.');
    } finally {
      setIsLoading(false);
    }
  };

  const isPasswordLongEnough = formData.password.length >= 8;
  const doPasswordsMatch = Boolean(
    formData.confirmPassword && formData.password === formData.confirmPassword
  );

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
        <div className="sm:mx-auto sm:w-full sm:max-w-lg text-center">
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
            Create your account
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-txt-secondary max-w-sm mx-auto">
            Join a calm, chronological social space built for mindful creators.
          </p>
        </div>

        {/* Card Form */}
        <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-lg">
          <div className="bg-surface/95 backdrop-blur-xl py-7 px-5 sm:px-9 shadow-editorial-lg rounded-3xl border border-border-medium transition-colors">
            {serverError && (
              <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-start gap-2.5 text-xs font-medium animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                <span className="leading-relaxed">{serverError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Responsive 2-column on desktop for name and username */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  id="name"
                  label="Full Name"
                  icon={User}
                  placeholder="Jane Doe"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  error={errors.name}
                  required
                />

                <Input
                  id="username"
                  label="Username"
                  icon={User}
                  placeholder="janedoe"
                  value={formData.username}
                  onChange={(e) => handleChange('username', e.target.value)}
                  error={errors.username}
                  required
                />
              </div>

              <Input
                id="email"
                label="Email Address"
                type="email"
                icon={Mail}
                placeholder="jane@example.com"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                error={errors.email}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  id="password"
                  label="Password"
                  type="password"
                  icon={Lock}
                  placeholder="At least 8 characters"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  error={errors.password}
                  required
                />

                <Input
                  id="confirmPassword"
                  label="Confirm Password"
                  type="password"
                  icon={Lock}
                  placeholder="Re-enter password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  error={errors.confirmPassword}
                  required
                />
              </div>

              {/* Password Helpers */}
              {formData.password && (
                <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-txt-secondary pt-1">
                  <span className={`flex items-center gap-1 ${isPasswordLongEnough ? 'text-emerald-600 dark:text-emerald-400' : 'text-txt-muted'}`}>
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>8+ characters</span>
                  </span>
                  {formData.confirmPassword && (
                    <span className={`flex items-center gap-1 ${doPasswordsMatch ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>{doPasswordsMatch ? 'Passwords match' : 'Passwords differ'}</span>
                    </span>
                  )}
                </div>
              )}

              <div className="pt-2">
                <Button
                  type="submit"
                  isLoading={isLoading}
                  size="lg"
                  className="w-full py-3 text-sm font-semibold rounded-2xl bg-accent hover:bg-accent-hover text-white shadow-editorial-sm hover:shadow-editorial-md transition-all"
                  icon={ArrowRight}
                  iconPosition="right"
                >
                  Create Account
                </Button>
              </div>
            </form>

            {/* Switch to Login */}
            <div className="mt-6 pt-5 border-t border-border-subtle text-center space-y-3">
              <p className="text-xs text-txt-secondary">
                Already have an account?
              </p>
              <Link to="/login" className="block">
                <Button
                  variant="outline"
                  className="w-full py-2.5 text-xs font-semibold rounded-xl shadow-editorial-xs border-border-medium hover:border-accent/40"
                >
                  Sign In to Existing Account
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
