"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useOnboarding } from "@/lib/onboarding-context";
import { api } from "@/lib/api";

const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(2, "Full name must be at least 2 characters")
      .regex(/^[a-zA-Z\s.]+$/, "Please enter a valid name using letters"),
    email: z.string().email("Enter a valid email address (e.g. name@company.com)"),
    mobile: z
      .string()
      .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number (e.g. 9876543210)"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Za-z]/, "Must contain at least one letter")
      .regex(/\d/, "Must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    acceptTerms: z.boolean().refine((val) => val === true, "You must accept the Terms and Privacy Policy to continue"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { registerUser, verifyOtp } = useOnboarding();

  const [otpSent, setOtpSent] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [otpInput, setOtpInput] = useState("1234");
  const [otpError, setOtpError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: "onTouched",
    defaultValues: {
      fullName: "",
      email: "",
      mobile: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false as any,
    },
  });

  const onRegisterSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true);
    const res = await api.register(data);
    setIsSubmitting(false);

    if (res.success) {
      registerUser({
        id: "usr_" + Math.random().toString(36).substring(2, 8),
        name: data.fullName,
        email: data.email.toLowerCase(),
        mobile: data.mobile,
      });
      setRegisteredEmail(data.email.toLowerCase());
      setOtpSent(true);
    }
  };

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError("");

    if (!otpInput || otpInput.trim().length < 4) {
      setOtpError("Please enter the 4-digit code sent to your email.");
      return;
    }

    const verified = await verifyOtp(otpInput.trim());
    if (verified) {
      // Flow rule: Register, then Sign in.
      router.push("/signin?registered=true");
    } else {
      setOtpError("Invalid code. Please try again.");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card register-card">
        {/* Header */}
        <div className="auth-header">
          <Link href="/" className="auth-logo" aria-label="UlavanSanthai home">
            <Image
              src="/logo.png"
              alt="UlavanSanthai"
              width={210}
              height={46}
              priority
              className="brand-logo"
            />
          </Link>
          <h2>{otpSent ? "Verify your email" : "Create your trading account"}</h2>
          <p className="muted">
            {otpSent
              ? `We sent a 4-digit verification code to ${registeredEmail}. Enter it below to activate your account.`
              : "Register once. Trade as a Buyer, Seller, or Both. Individual & Company accounts."}
          </p>
        </div>

        {/* STEP 2: Email OTP Stub */}
        {otpSent ? (
          <form onSubmit={handleOtpVerify} className="auth-form" noValidate>
            <div className="form-group">
              <label htmlFor="otp">4-digit verification code</label>
              <input
                id="otp"
                type="text"
                maxLength={6}
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ""))}
                placeholder="1234"
                className="otp-input"
                autoComplete="one-time-code"
                required
              />
              <small className="muted">
                Demo stub: Any 4-digit code (e.g. <b>1234</b>) is accepted immediately.
              </small>
              {otpError && <p className="err-msg" role="alert">{otpError}</p>}
            </div>

            <button type="submit" className="btn primary block lg">
              Verify Code &amp; Continue to Sign In →
            </button>

            <button
              type="button"
              className="btn ghost block mt sm"
              onClick={() => setOtpSent(false)}
            >
              ← Edit registration details
            </button>
          </form>
        ) : (
          /* STEP 1: Full registration form */
          <form onSubmit={handleSubmit(onRegisterSubmit)} className="auth-form" noValidate>
            <div className="form-group">
              <label htmlFor="fullName">Full name *</label>
              <input
                id="fullName"
                type="text"
                placeholder="e.g. Senthil Nathan"
                autoComplete="name"
                {...register("fullName")}
                aria-invalid={errors.fullName ? "true" : "false"}
              />
              {errors.fullName && <p className="err-msg" role="alert">{errors.fullName.message}</p>}
            </div>

            <div className="two-col">
              <div className="form-group">
                <label htmlFor="email">Email address *</label>
                <input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  autoComplete="email"
                  {...register("email")}
                  aria-invalid={errors.email ? "true" : "false"}
                />
                {errors.email && <p className="err-msg" role="alert">{errors.email.message}</p>}
              </div>

              <div className="form-group">
                <label htmlFor="mobile">Mobile number *</label>
                <input
                  id="mobile"
                  type="tel"
                  maxLength={10}
                  placeholder="10-digit mobile"
                  autoComplete="tel"
                  {...register("mobile")}
                  aria-invalid={errors.mobile ? "true" : "false"}
                />
                {errors.mobile && <p className="err-msg" role="alert">{errors.mobile.message}</p>}
              </div>
            </div>

            <div className="two-col">
              <div className="form-group">
                <label htmlFor="password">Password (min 8 chars) *</label>
                <input
                  id="password"
                  type="password"
                  placeholder="Letters &amp; numbers"
                  autoComplete="new-password"
                  {...register("password")}
                  aria-invalid={errors.password ? "true" : "false"}
                />
                {errors.password && <p className="err-msg" role="alert">{errors.password.message}</p>}
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm password *</label>
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="Re-enter password"
                  autoComplete="new-password"
                  {...register("confirmPassword")}
                  aria-invalid={errors.confirmPassword ? "true" : "false"}
                />
                {errors.confirmPassword && (
                  <p className="err-msg" role="alert">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label" htmlFor="acceptTerms">
                <input
                  id="acceptTerms"
                  type="checkbox"
                  {...register("acceptTerms")}
                />
                <span>
                  I agree to the Terms of Service and Privacy Policy. I understand documents and GSTIN are kept private.
                </span>
              </label>
              {errors.acceptTerms && <p className="err-msg" role="alert">{errors.acceptTerms.message}</p>}
            </div>

            <button type="submit" disabled={isSubmitting} className="btn primary block lg">
              {isSubmitting ? "Creating account..." : "Register & Verify Email →"}
            </button>
          </form>
        )}

        <div className="auth-footer-action">
          <p>
            Already have an account?{" "}
            <Link href="/signin" className="highlight-link">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
