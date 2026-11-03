"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/lib/auth-context";

const signinSchema = z.object({
  identifier: z
    .string()
    .min(3, "Enter your registered email address or mobile number"),
  password: z.string().min(1, "Please enter your password"),
  rememberMe: z.boolean().optional(),
});

function SigninContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, resetPasswordForEmail } = useAuth();

  const justRegistered = searchParams.get("registered") === "true";
  const resetSuccess = searchParams.get("reset") === "success";
  const callbackError = searchParams.get("error") === "verification_failed";
  const redirectTarget = searchParams.get("redirect") || "/onboarding/role";

  const [authError, setAuthError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forgot password modal state
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(signinSchema),
    mode: "onTouched",
    defaultValues: {
      identifier: "",
      password: "",
      rememberMe: true,
    },
  });

  const onSigninSubmit = async (data) => {
    setAuthError("");
    setIsSubmitting(true);

    const res = await signIn(data.identifier, data.password);
    setIsSubmitting(false);

    if (res.success) {
      router.push(redirectTarget);
    } else {
      setAuthError(res.error || "Invalid credentials. Please check your email/mobile and password.");
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setForgotError("");
    if (!forgotEmail || !forgotEmail.includes("@")) {
      setForgotError("Please enter a valid email address to receive the password reset link.");
      return;
    }

    setForgotLoading(true);
    const res = await resetPasswordForEmail(forgotEmail);
    setForgotLoading(false);

    if (res.success) {
      setForgotSent(true);
    } else {
      setForgotError(res.error || "Could not send password reset email. Please try again.");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Brand Header */}
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
          <h2>Sign in to your account</h2>
          <p className="muted">Enter your registered email or mobile number to continue trading.</p>
        </div>

        {justRegistered && (
          <div className="alert-success" role="status">
            Registration initiated! If email confirmation was sent, please verify your email before signing in.
          </div>
        )}

        {resetSuccess && (
          <div className="alert-success" role="status">
            Password reset successful! Please sign in with your new password.
          </div>
        )}

        {callbackError && (
          <div className="alert-error" role="alert">
            Email verification link expired or invalid. Please request a new link or sign in below.
          </div>
        )}

        {authError && (
          <div className="alert-error" role="alert">
            {authError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSigninSubmit)} className="auth-form" noValidate>
          <div className="form-group">
            <label htmlFor="identifier">Email address or mobile number *</label>
            <input
              id="identifier"
              type="text"
              placeholder="e.g. name@company.com or 9876543210"
              autoComplete="username"
              {...register("identifier")}
              aria-invalid={errors.identifier ? "true" : "false"}
            />
            {errors.identifier && (
              <p className="err-msg" role="alert">
                {errors.identifier.message}
              </p>
            )}
          </div>

          <div className="form-group">
            <div className="label-row">
              <label htmlFor="password">Password *</label>
              <button
                type="button"
                className="text-link"
                onClick={() => {
                  setForgotError("");
                  setForgotSent(false);
                  setForgotOpen(true);
                }}
              >
                Forgot password?
              </button>
            </div>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              {...register("password")}
              aria-invalid={errors.password ? "true" : "false"}
            />
            {errors.password && (
              <p className="err-msg" role="alert">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="form-row between">
            <label className="checkbox-label" htmlFor="rememberMe">
              <input id="rememberMe" type="checkbox" {...register("rememberMe")} />
              <span>Remember me</span>
            </label>
          </div>

          <button type="submit" disabled={isSubmitting} className="btn primary block lg">
            {isSubmitting ? "Authenticating with Supabase..." : "Sign in →"}
          </button>
        </form>

        <div className="auth-footer-action">
          <p>
            Don&apos;t have an account yet?{" "}
            <Link href="/register" className="highlight-link">
              Register now →
            </Link>
          </p>
        </div>
      </div>

      {/* Real Supabase Forgot Password Modal */}
      {forgotOpen && (
        <div className="modal-backdrop" onClick={() => setForgotOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3>Reset password</h3>
            {forgotSent ? (
              <div className="modal-body">
                <p className="success-msg">
                  Password reset link has been dispatched to <b>{forgotEmail}</b>. Please check your inbox and click the link to choose a new password.
                </p>
                <button
                  type="button"
                  className="btn primary block mt"
                  onClick={() => {
                    setForgotSent(false);
                    setForgotOpen(false);
                  }}
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="modal-body">
                <p className="muted">Enter your registered email address to receive a secure password reset link.</p>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="modal-input"
                  required
                />
                {forgotError && (
                  <p className="err-msg" style={{ margin: "6px 0 0 0" }} role="alert">
                    {forgotError}
                  </p>
                )}
                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn ghost sm"
                    onClick={() => setForgotOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="btn primary sm"
                  >
                    {forgotLoading ? "Sending..." : "Send Reset Link"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SigninPage() {
  return (
    <Suspense
      fallback={
        <div className="guard-loading">
          <div className="spinner" />
          <p>Loading sign in portal...</p>
        </div>
      }
    >
      <SigninContent />
    </Suspense>
  );
}
