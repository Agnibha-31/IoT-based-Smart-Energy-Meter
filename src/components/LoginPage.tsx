import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Shield, Database, Eye, EyeOff } from 'lucide-react';
import { useSettings } from './SettingsContext';

interface LoginProps {
  onLogin: (payload: { email: string; password: string }) => Promise<void> | void;
  onRegister: (payload: { email: string; password: string; name: string }) => Promise<void> | void;
}

export default function LoginPage({ onLogin, onRegister }: LoginProps) {
  const { translate } = useSettings();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showError, setShowError] = useState<string | null>(null);
  const [usernameFocused, setUsernameFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false); // Always start with login page
  const [showPasswordHelp, setShowPasswordHelp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const debounceTimer = useRef<number | null>(null);
  const emailCheckTimer = useRef<number | null>(null);
  const lastTried = useRef<{ email: string; password: string } | null>(null);

  // Always show login page on load - removed automatic first-time check

  // Check if email exists in database (real-time during registration)
  useEffect(() => {
    // Only check email during registration mode
    if (!isFirstTimeUser) {
      setEmailExists(false);
      setCheckingEmail(false);
      return;
    }

    // Clear previous timer
    if (emailCheckTimer.current) {
      window.clearTimeout(emailCheckTimer.current);
      emailCheckTimer.current = null;
    }

    // Skip if email is empty or invalid format
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setEmailExists(false);
      setCheckingEmail(false);
      return;
    }

    // Basic email format validation before checking
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmedEmail)) {
      setEmailExists(false);
      setCheckingEmail(false);
      return;
    }

    // Set checking state and debounce the API call
    setCheckingEmail(true);
    emailCheckTimer.current = window.setTimeout(async () => {
      try {
        const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';
        const response = await fetch(`${API_BASE}/api/auth/check-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: trimmedEmail }),
        });
        
        if (response.ok) {
          const data = await response.json();
          setEmailExists(data.exists);
        }
      } catch (error) {
        console.error('Error checking email:', error);
        setEmailExists(false);
      } finally {
        setCheckingEmail(false);
      }
    }, 800); // 800ms debounce

    return () => {
      if (emailCheckTimer.current) {
        window.clearTimeout(emailCheckTimer.current);
        emailCheckTimer.current = null;
      }
    };
  }, [email, isFirstTimeUser]);

  // Full name validation - at least 2 words, each starting with capital letter
  const validateName = (fullName: string) => {
    const trimmed = fullName.trim();
    const words = trimmed.split(/\s+/).filter(word => word.length > 0);
    
    return {
      hasTwoWords: words.length >= 2,
      allCapitalized: words.every(word => /^[A-Z]/.test(word)),
      isValid: words.length >= 2 && words.every(word => /^[A-Z]/.test(word))
    };
  };

  // Email validation - proper email format with valid domain
  const validateEmail = (emailStr: string) => {
    const trimmed = emailStr.trim();
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const hasValidFormat = emailRegex.test(trimmed);
    const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'protonmail.com', 'aol.com', 'mail.com'];
    const domain = trimmed.split('@')[1]?.toLowerCase();
    
    return {
      hasValidFormat: hasValidFormat,
      hasAtSymbol: trimmed.includes('@'),
      hasDomain: trimmed.split('@').length === 2 && trimmed.split('@')[1].includes('.'),
      isCommonDomain: domain ? commonDomains.includes(domain) : false,
      isValid: hasValidFormat
    };
  };

  // Password validation
  const validatePassword = (pwd: string) => {
    return {
      minLength: pwd.length >= 8,
      hasUpper: /[A-Z]/.test(pwd),
      hasLower: /[a-z]/.test(pwd),
      hasNumber: /[0-9]/.test(pwd),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
    };
  };

  const nameValidation = validateName(name);
  const emailValidation = validateEmail(email);
  const passwordValidation = validatePassword(password);
  const isPasswordValid = Object.values(passwordValidation).every(v => v);
  const passwordsMatch = password === confirmPassword;
  const isFormValid = isFirstTimeUser 
    ? (nameValidation.isValid && emailValidation.isValid && !emailExists && isPasswordValid && passwordsMatch)
    : (emailValidation.isValid && password.length >= 6);

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault?.();
    if (!email || !password) {
      setShowError('Please provide email and password');
      return;
    }
    if (isFirstTimeUser && !name) {
      setShowError('Please provide your name');
      return;
    }
    if (isFirstTimeUser && emailExists) {
      setShowError('This email is already registered. Please sign in instead.');
      return;
    }
    if (isFirstTimeUser && !isPasswordValid) {
      setShowError('Password does not meet requirements');
      return;
    }
    if (isFirstTimeUser && !passwordsMatch) {
      setShowError('Passwords do not match');
      return;
    }
    setShowError(null);
    setIsSubmitting(true);
    try {
      if (isFirstTimeUser) {
        await onRegister({ email, password, name });
        // After successful registration, mark that a user now exists
        setIsFirstTimeUser(false);
        // Store in localStorage to persist across page reloads
        localStorage.setItem('userExists', 'true');
      } else {
        await onLogin({ email, password });
      }
      lastTried.current = { email, password };
    } catch (err: any) {
      setShowError(err?.message || 'Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Auto-authenticate for existing users only (not for registration)
  useEffect(() => {
    if (isFirstTimeUser) return; // Disable auto-login for first time setup
    
    if (debounceTimer.current) {
      window.clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
    if (!email || !password || isSubmitting) return;
    if (lastTried.current &&
        lastTried.current.email === email &&
        lastTried.current.password === password) {
      return;
    }
    debounceTimer.current = window.setTimeout(() => {
      void handleSubmit();
    }, 1500);
    return () => {
      if (debounceTimer.current) {
        window.clearTimeout(debounceTimer.current);
        debounceTimer.current = null;
      }
    };
  }, [email, password, isSubmitting, isFirstTimeUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 px-4">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-md w-full space-y-8"
      >
        {/* Header */}
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mx-auto h-20 w-20 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mb-4"
          >
            <Zap className="h-10 w-10 text-white" />
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-3xl font-medium text-white mb-2"
          >
            {translate('smart_iot_meter')}
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-gray-300 text-sm"
          >
            {translate('welcome_advanced_iot')}
          </motion.p>
        </div>

        {/* Login Form */}
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20"
        >
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-white/90 text-lg font-bold mb-6">
                {isFirstTimeUser ? 'Account Registration' : translate('enter_credentials')}
              </p>
            </div>
            
            {isFirstTimeUser && (
              <div className="relative">
                <label className="block text-white/90 text-sm mb-2 text-center">Full Name</label>
                <div className="relative w-4/5 mx-auto">
                  <motion.input
                    whileFocus={{ scale: 1.02 }}
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onFocus={() => setNameFocused(true)}
                    onBlur={() => setNameFocused(false)}
                    style={{ paddingLeft: '4.5rem', paddingRight: '5.0rem' }}
                    className="w-full py-2.5 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 placeholder:text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-center"
                    placeholder={nameFocused || name ? '' : 'Enter your full name'}
                    autoComplete="name"
                  />
                  {name && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center justify-center"
                    >
                      {nameValidation.isValid ? (
                        <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                          <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center">
                          <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
                {name && !nameValidation.isValid && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-red-400 text-center mt-1"
                  >
                    {!nameValidation.hasTwoWords && "Enter at least 2 words"}
                    {nameValidation.hasTwoWords && !nameValidation.allCapitalized && "Each word must start with a capital letter"}
                  </motion.p>
                )}
              </div>
            )}
            
            <div className="relative">
              <label className="block text-white/90 text-sm mb-2 text-center">Mail ID</label>
              <div className="relative w-4/5 mx-auto">
                <motion.input
                  whileFocus={{ scale: 1.02 }}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setUsernameFocused(true)}
                  onBlur={() => setUsernameFocused(false)}
                  className={`w-full py-2.5 px-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 placeholder:text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-center ${isFirstTimeUser && !nameValidation.isValid ? 'pointer-events-none' : ''}`}
                  placeholder={usernameFocused || email ? '' : translate('enter_username')}
                  autoComplete="email"
                  disabled={isFirstTimeUser ? !nameValidation.isValid : false}
                />
                {isFirstTimeUser && email && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center justify-center"
                  >
                    {checkingEmail ? (
                      <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                    ) : emailExists ? (
                      <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center">
                        <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                    ) : emailValidation.isValid ? (
                      <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                        <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center">
                        <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
              {isFirstTimeUser && email && emailExists && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute left-1/2 -translate-x-1/2 mt-2 w-72 bg-slate-800 border border-orange-500/30 rounded-lg p-3 shadow-xl z-50"
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <p className="text-orange-400 text-xs font-medium">
                      Already Registered! Please sign in instead.
                    </p>
                  </div>
                </motion.div>
              )}
              {isFirstTimeUser && email && !emailExists && !emailValidation.isValid && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-red-400 text-center mt-1"
                >
                  {!emailValidation.hasAtSymbol && "Email must contain @ symbol"}
                  {emailValidation.hasAtSymbol && !emailValidation.hasDomain && "Enter a valid email domain (e.g., @gmail.com)"}
                  {emailValidation.hasDomain && !emailValidation.hasValidFormat && "Enter a valid email format"}
                </motion.p>
              )}
            </div>
            
            <div className="relative">
              <label className="block text-white/90 text-sm mb-2 text-center">{translate('password')}</label>
              <div className="relative w-4/5 mx-auto flex items-center">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => {
                    setPasswordFocused(true);
                    if (isFirstTimeUser) setShowPasswordHelp(true);
                  }}
                  onBlur={() => {
                    setPasswordFocused(false);
                    setTimeout(() => setShowPasswordHelp(false), 200);
                  }}
                  className={`w-full py-2.5 px-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 placeholder:text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-center ${isFirstTimeUser && !emailValidation.isValid ? 'pointer-events-none' : ''}`}
                  placeholder={passwordFocused || password ? '' : '••••••••'}
                  autoComplete={isFirstTimeUser ? 'new-password' : 'current-password'}
                  disabled={isFirstTimeUser ? !emailValidation.isValid : false}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-white/60 hover:text-white transition-colors duration-200"
                  style={{ right: isFirstTimeUser && password ? '2.5rem' : '0.75rem' }}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
                {isFirstTimeUser && password && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="absolute right-3 flex items-center justify-center"
                  >
                    {isPasswordValid ? (
                      <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                        <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center">
                        <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
              
              {/* Password Requirements Tooltip */}
              {isFirstTimeUser && showPasswordHelp && password && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute left-1/2 -translate-x-1/2 mt-2 w-72 bg-slate-800 border border-white/20 rounded-lg p-4 shadow-xl z-50"
                >
                  <p className="text-white text-xs font-medium mb-2">Password Requirements:</p>
                  <ul className="space-y-1 text-xs">
                    <li className={passwordValidation.minLength ? 'text-green-400' : 'text-red-400'}>
                      {passwordValidation.minLength ? '✓' : '✗'} At least 8 characters
                    </li>
                    <li className={passwordValidation.hasUpper ? 'text-green-400' : 'text-red-400'}>
                      {passwordValidation.hasUpper ? '✓' : '✗'} One uppercase letter (A-Z)
                    </li>
                    <li className={passwordValidation.hasLower ? 'text-green-400' : 'text-red-400'}>
                      {passwordValidation.hasLower ? '✓' : '✗'} One lowercase letter (a-z)
                    </li>
                    <li className={passwordValidation.hasNumber ? 'text-green-400' : 'text-red-400'}>
                      {passwordValidation.hasNumber ? '✓' : '✗'} One number (0-9)
                    </li>
                    <li className={passwordValidation.hasSpecial ? 'text-green-400' : 'text-red-400'}>
                      {passwordValidation.hasSpecial ? '✓' : '✗'} One special character (!@#$%^&*)
                    </li>
                  </ul>
                </motion.div>
              )}
            </div>

            {isFirstTimeUser && (
              <div className="relative">
                <label className="block text-white/90 text-sm mb-2 text-center">Confirm Password</label>
                <div className="relative w-4/5 mx-auto flex items-center">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onFocus={() => setConfirmPasswordFocused(true)}
                    onBlur={() => setConfirmPasswordFocused(false)}
                    className={`w-full py-2.5 px-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-300 placeholder:text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-center ${!isPasswordValid ? 'pointer-events-none' : ''}`}
                    placeholder={confirmPasswordFocused || confirmPassword ? '' : 'Re-enter your password'}
                    autoComplete="new-password"
                    disabled={!isPasswordValid}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 text-white/60 hover:text-white transition-colors duration-200"
                    style={{ right: confirmPassword ? '2.5rem' : '0.75rem' }}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                  {confirmPassword && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      className="absolute right-3 flex items-center justify-center"
                    >
                      {passwordsMatch ? (
                        <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                          <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center">
                          <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
                
                {/* Password Mismatch Tooltip */}
                {confirmPassword && !passwordsMatch && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute left-1/2 -translate-x-1/2 mt-2 w-64 bg-slate-800 border border-red-500/30 rounded-lg p-3 shadow-xl z-50"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                        <svg className="w-3 h-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                      <p className="text-red-400 text-xs font-medium">
                        Passwords do not match
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* Register link for login mode */}
            {!isFirstTimeUser && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-center"
              >
                <p className="text-white/70 text-sm">
                  Not registered?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsFirstTimeUser(true);
                      setShowError(null);
                      setPassword('');
                      setConfirmPassword('');
                      setName('');
                    }}
                    className="text-cyan-400 hover:text-cyan-300 font-medium underline underline-offset-2 transition-colors duration-200 cursor-pointer"
                  >
                    Register
                  </button>
                </p>
              </motion.div>
            )}

            {/* Sign In button removed - auto-login handles authentication */}
            {/* Register button for registration mode */}
            {isFirstTimeUser && (
              <>
                <motion.button
                  whileHover={{ scale: isFormValid ? 1.05 : 1 }}
                  whileTap={{ scale: isFormValid ? 0.95 : 1 }}
                  type="submit"
                  disabled={isSubmitting || !isFormValid}
                  className={`w-4/5 mx-auto block py-3 rounded-lg font-medium shadow-lg transition-all duration-300 ${
                    isFormValid && !isSubmitting
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:shadow-xl cursor-pointer'
                      : 'bg-gray-500 text-gray-300 cursor-not-allowed opacity-50'
                  }`}
                >
                  {isSubmitting ? 'Creating Account...' : 'Register'}
                </motion.button>

                {/* Sign In link for registration mode */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-center mt-3"
                >
                  <p className="text-white/70 text-sm">
                    Already registered?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setIsFirstTimeUser(false);
                        setShowError(null);
                        setPassword('');
                        setConfirmPassword('');
                        setName('');
                      }}
                      className="text-cyan-400 hover:text-cyan-300 font-medium underline underline-offset-2 transition-colors duration-200 cursor-pointer"
                    >
                      Sign In
                    </button>
                  </p>
                </motion.div>
              </>
            )}

            {showError && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-red-400 text-sm text-center"
              >
                {showError}
              </motion.div>
            )}
          </div>
        </motion.form>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
          className="grid grid-cols-3 gap-4 text-center"
        >
          <div className="text-white/70">
            <Database className="h-6 w-6 mx-auto mb-1" />
            <p className="text-xs">Real-time Data</p>
          </div>
          <div className="text-white/70">
            <Zap className="h-6 w-6 mx-auto mb-1" />
            <p className="text-xs">Smart Analytics</p>
          </div>
          <div className="text-white/70">
            <Shield className="h-6 w-6 mx-auto mb-1" />
            <p className="text-xs">Secure Access</p>
          </div>
        </motion.div>

        {/* Copyright */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="text-center"
        >
          <p className="text-white/60 text-xs">
            © 2025 Advanced IoT Solutions. All rights reserved.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}