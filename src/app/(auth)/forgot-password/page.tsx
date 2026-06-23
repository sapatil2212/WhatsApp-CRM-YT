"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MessageSquare, CheckCircle, ArrowLeft, KeyRound, Eye, EyeOff, Loader2, Mail } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type ResetStep = "email" | "otp" | "password" | "success";

const containerVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as any } },
  exit: { opacity: 0, y: -15, transition: { duration: 0.25, ease: "easeIn" as any } }
};

const shakeVariants = {
  idle: { x: 0 },
  shake: {
    x: [-8, 8, -6, 6, -4, 4, -2, 2, 0],
    transition: { duration: 0.4, ease: "easeInOut" as any }
  }
};

const checkmarkPathVariants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: { 
    pathLength: 1, 
    opacity: 1, 
    transition: { 
      pathLength: { type: "spring" as any, stiffness: 80, damping: 12, delay: 0.3 },
      opacity: { duration: 0.1, delay: 0.3 } 
    } 
  }
};

const stepsList = [
  { step: "email", label: "Email" },
  { step: "otp", label: "Verify" },
  { step: "password", label: "Reset" },
  { step: "success", label: "Done" },
];

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<ResetStep>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [isShaking, setIsShaking] = useState(false);
  const [focusedOtpIndex, setFocusedOtpIndex] = useState<number | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Live Validations for password step
  const isLengthValid = password.length >= 6;
  const isMatchValid = password === confirmPassword && password.length > 0;
  const isPasswordFormValid = isLengthValid && isMatchValid;

  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send", email }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || "Failed to send verification code.");
        setLoading(false);
        return;
      }

      setLoading(false);
      setStep("otp");
      setResendTimer(60);
      // Focus first input box after step transition completes
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setError(null);
    setResendTimer(60);

    try {
      const res = await fetch("/api/auth/reset-password-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send", email }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || "Failed to resend code.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    // Only allow single digit numbers
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next box if value is entered
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Trigger verification if all 6 digits are entered
    const fullCode = newOtp.join("");
    if (fullCode.length === 6 && /^\d{6}$/.test(fullCode)) {
      handleVerifyOtp(fullCode);
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      const newOtp = [...otp];
      
      // If current box has a value, clear it
      // If current box is empty, clear previous box and focus it
      if (newOtp[index]) {
        newOtp[index] = "";
        setOtp(newOtp);
      } else if (index > 0) {
        newOtp[index - 1] = "";
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text");
    const digits = pastedData.replace(/\D/g, "").slice(0, 6);
    
    if (digits.length > 0) {
      const newOtp = [...otp];
      for (let i = 0; i < 6; i++) {
        newOtp[i] = digits[i] || "";
      }
      setOtp(newOtp);

      // Focus the last populated input box
      const targetIndex = Math.min(digits.length - 1, 5);
      inputRefs.current[targetIndex]?.focus();

      if (digits.length === 6) {
        handleVerifyOtp(digits);
      }
    }
  };

  const handleVerifyOtp = async (code: string) => {
    setError(null);
    setLoading(true);
    setIsShaking(false);

    try {
      const res = await fetch("/api/auth/reset-password-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", email, code }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || "Invalid verification code.");
        setLoading(false);
        setIsShaking(true);
        // Reset shaking after animation runs
        setTimeout(() => setIsShaking(false), 500);
        return;
      }

      setLoading(false);
      setStep("password");
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isPasswordFormValid) return;

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset", email, password }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || "Failed to update password.");
        setLoading(false);
        return;
      }

      setLoading(false);
      setStep("success");
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 relative overflow-hidden">
      {/* Decorative Radial Glow Backdrops */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-teal-500/5 rounded-full blur-[80px] pointer-events-none" />

      <Card className="w-full max-w-md border-slate-800 bg-slate-900 shadow-2xl overflow-hidden relative transition-all duration-300">
        
        {/* Step Progress Bar */}
        <div className="px-6 pt-6 pb-2 border-b border-slate-800/40 bg-slate-900/50">
          <div className="flex justify-between items-center relative">
            {/* Background Track Line - Aligned at top-3 (12px) to run through center of circle */}
            <div className="absolute left-0 right-0 top-3 h-[2px] bg-slate-800 z-0" />
            
            {/* Animated Active Progress Line - Aligned at top-3 */}
            <motion.div 
              className="absolute left-0 top-3 h-[2px] bg-primary z-0"
              initial={{ width: "0%" }}
              animate={{ 
                width: 
                  step === "email" ? "0%" : 
                  step === "otp" ? "33%" : 
                  step === "password" ? "66%" : "100%" 
              }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
            />

            {stepsList.map((item, index) => {
              const isActive = 
                item.step === step ||
                (step === "otp" && index < 1) ||
                (step === "password" && index < 2) ||
                (step === "success" && index < 3);
              const isCurrent = item.step === step;

              return (
                <div key={item.step} className="flex flex-col items-center z-10 relative">
                  <motion.div 
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all duration-300",
                      isCurrent 
                        ? "bg-slate-900 border-primary text-primary shadow-[0_0_10px_rgba(139,92,246,0.3)]"
                        : isActive
                        ? "bg-primary border-primary text-primary-foreground"
                        : "bg-slate-900 border-slate-800 text-slate-500"
                    )}
                    animate={{ scale: isCurrent ? 1.15 : 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    {isActive && item.step !== step ? "✓" : index + 1}
                  </motion.div>
                  <span className={cn(
                    "text-[10px] font-semibold mt-1 transition-colors duration-300",
                    isCurrent ? "text-white" : isActive ? "text-slate-400" : "text-slate-600"
                  )}>
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === "email" && (
            <motion.div
              key="email"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full"
            >
              <CardHeader className="justify-items-center text-center">
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl text-white">Reset password</CardTitle>
                <CardDescription className="text-slate-400">
                  Enter your email and we&apos;ll send you a 6-digit OTP code to verify your identity.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRequestOtp} className="flex flex-col gap-4">
                  {error && (
                    <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                      {error}
                    </div>
                  )}

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="email" className="text-slate-300">
                      Email
                    </Label>
                    <div className="relative">
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="border-slate-700 bg-slate-800 text-white placeholder:text-slate-500 focus-visible:border-primary focus-visible:ring-primary/20"
                        style={{ paddingLeft: "2.75rem" }}
                      />
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="mt-2 h-10 w-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Sending...
                      </span>
                    ) : (
                      "Send OTP code"
                    )}
                  </Button>
                </form>

                <Link
                  href="/login"
                  className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-slate-300 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to sign in
                </Link>
              </CardContent>
            </motion.div>
          )}

          {step === "otp" && (
            <motion.div
              key="otp"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full"
            >
              <CardHeader className="justify-items-center text-center">
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <KeyRound className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl text-white">Enter OTP Code</CardTitle>
                <CardDescription className="text-slate-400">
                  We&apos;ve sent a 6-digit verification code to <span className="text-white font-medium">{email}</span>.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                {error && (
                  <div className="w-full mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                    {error}
                  </div>
                )}

                <motion.div
                  className="flex gap-2.5 justify-center my-4"
                  variants={shakeVariants}
                  animate={isShaking ? "shake" : "idle"}
                >
                  {otp.map((val, idx) => {
                    const isBoxFocused = focusedOtpIndex === idx;
                    return (
                      <motion.input
                        key={idx}
                        ref={(el) => {
                          inputRefs.current[idx] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={val}
                        onFocus={() => setFocusedOtpIndex(idx)}
                        onBlur={() => setFocusedOtpIndex(null)}
                        onChange={(e) => handleOtpChange(e.target.value, idx)}
                        onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                        onPaste={idx === 0 ? handleOtpPaste : undefined}
                        className={cn(
                          "h-12 w-12 rounded-xl border text-center text-xl font-bold transition-all focus:outline-none focus:ring-2",
                          error
                            ? "border-red-500 focus:border-red-500 focus:ring-red-500/20 text-red-400"
                            : isBoxFocused
                            ? "border-primary bg-slate-800 text-white ring-2 ring-primary/20 shadow-[0_0_15px_rgba(139,92,246,0.25)] scale-105"
                            : val
                            ? "border-primary/80 bg-slate-800 text-white focus:border-primary focus:ring-primary/20"
                            : "border-slate-700 bg-slate-800 text-slate-400 focus:border-primary focus:ring-primary/20"
                        )}
                        whileFocus={{ scale: 1.05 }}
                        transition={{ duration: 0.15 }}
                        disabled={loading}
                      />
                    );
                  })}
                </motion.div>

                {loading && (
                  <div className="flex items-center gap-2 text-sm text-slate-400 my-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    Verifying code...
                  </div>
                )}

                <div className="mt-6 flex flex-col gap-3 items-center w-full">
                  <button
                    onClick={handleResendOtp}
                    disabled={resendTimer > 0}
                    className={cn(
                      "text-xs font-semibold uppercase tracking-wider transition-colors",
                      resendTimer > 0
                        ? "text-slate-500 cursor-not-allowed"
                        : "text-primary hover:text-primary/80 cursor-pointer"
                    )}
                  >
                    {resendTimer > 0 ? `Resend Code in ${resendTimer}s` : "Resend OTP Code"}
                  </button>

                  <button
                    onClick={() => {
                      setError(null);
                      setStep("email");
                    }}
                    className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-300 transition-colors mt-2"
                  >
                    <ArrowLeft className="h-4 w-4" /> Change Email
                  </button>
                </div>
              </CardContent>
            </motion.div>
          )}

          {step === "password" && (
            <motion.div
              key="password"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full"
            >
              <CardHeader className="justify-items-center text-center">
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <KeyRound className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl text-white">Create new password</CardTitle>
                <CardDescription className="text-slate-400">
                  Your identity has been verified. Enter your new password below.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
                  {error && (
                    <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                      {error}
                    </div>
                  )}

                  <div className="flex flex-col gap-2 relative">
                    <Label htmlFor="password" className="text-slate-300">
                      New Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="border-slate-700 bg-slate-800 text-white placeholder:text-slate-500 focus-visible:border-primary focus-visible:ring-primary/20 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 relative">
                    <Label htmlFor="confirmPassword" className="text-slate-300">
                      Confirm New Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="border-slate-700 bg-slate-800 text-white placeholder:text-slate-500 focus-visible:border-primary focus-visible:ring-primary/20 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Live Validation Indicators */}
                  <div className="flex flex-col gap-2.5 mt-1 px-1 bg-slate-800/20 border border-slate-800/40 rounded-xl p-3">
                    <div className="flex items-center gap-2 text-xs">
                      <div className={cn(
                        "h-4 w-4 rounded-full flex items-center justify-center border text-[9px] font-bold transition-all",
                        isLengthValid 
                          ? "bg-primary/10 border-primary text-primary" 
                          : "bg-slate-800/50 border-slate-700 text-slate-500"
                      )}>
                        ✓
                      </div>
                      <span className={cn("transition-colors", isLengthValid ? "text-slate-300 font-medium" : "text-slate-500")}>
                        At least 6 characters
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <div className={cn(
                        "h-4 w-4 rounded-full flex items-center justify-center border text-[9px] font-bold transition-all",
                        isMatchValid 
                          ? "bg-primary/10 border-primary text-primary" 
                          : "bg-slate-800/50 border-slate-700 text-slate-500"
                      )}>
                        ✓
                      </div>
                      <span className={cn("transition-colors", isMatchValid ? "text-slate-300 font-medium" : "text-slate-500")}>
                        Passwords match
                      </span>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading || !isPasswordFormValid}
                    className="mt-2 h-10 w-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Updating...
                      </span>
                    ) : (
                      "Reset Password"
                    )}
                  </Button>
                </form>
              </CardContent>
            </motion.div>
          )}

          {step === "success" && (
            <motion.div
              key="success"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full flex flex-col items-center text-center px-6 py-8"
            >
              {/* Checkmark Circle */}
              <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 border border-primary/20 shadow-lg shadow-primary/10">
                {/* Glowing backdrop */}
                <div className="absolute inset-0 rounded-full bg-primary/5 blur-xl animate-pulse" />
                
                {/* Ripple animation */}
                <motion.div 
                  className="absolute h-24 w-24 rounded-full border border-primary/10"
                  initial={{ scale: 0.8, opacity: 0.8 }}
                  animate={{ scale: 1.3, opacity: 0 }}
                  transition={{ delay: 0.3, duration: 1.2, repeat: Infinity, ease: "easeOut" }}
                />

                {/* Confetti Sparks */}
                {Array.from({ length: 12 }).map((_, i) => {
                  const angle = (i * 360) / 12;
                  const distance = 40 + Math.random() * 20;
                  const x = Math.cos((angle * Math.PI) / 180) * distance;
                  const y = Math.sin((angle * Math.PI) / 180) * distance;
                  return (
                    <motion.div
                      key={i}
                      className="absolute h-1.5 w-1.5 rounded-full bg-primary/80"
                      initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                      animate={{ 
                        x, 
                        y, 
                        scale: [0, 1, 0.8, 0], 
                        opacity: [1, 1, 0.4, 0] 
                      }}
                      transition={{ 
                        delay: 0.4, 
                        duration: 0.8 + Math.random() * 0.4, 
                        ease: "easeOut" 
                      }}
                    />
                  );
                })}

                <svg
                  className="h-9 w-9 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <motion.path
                    vectorEffect="non-scaling-stroke"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                    variants={checkmarkPathVariants}
                    initial="hidden"
                    animate="visible"
                  />
                </svg>
              </div>

              {/* Title & Description */}
              <h2 className="text-2xl font-extrabold text-white tracking-tight mb-2">
                Password reset complete
              </h2>
              <p className="text-slate-400 max-w-sm mb-8 text-sm leading-relaxed">
                Your password has been successfully updated. You can now sign in with your new credentials.
              </p>

              {/* Button */}
              <div className="w-full px-2">
                <motion.div
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                  className="w-full"
                >
                  <Link href="/login" className="w-full block">
                    <Button
                      className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/95 font-semibold rounded-xl shadow-lg transition-all duration-300 border-none"
                    >
                      Back to sign in
                    </Button>
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  );
}
