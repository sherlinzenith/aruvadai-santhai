"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/lib/auth-context";

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Za-z]/, "Must contain at least one letter")
      .regex(/\d/, "Must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export default function ResetPasswordPage() {
  const router = useRouter();
  const { updatePassword } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onTouched",
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data) => {
    setErrorMsg("");
    setIsSubmitting(true);
    const res = await updatePassword(data.password);
    setIsSubmitting(false);

    if (res.success) {
      setSuccess(true);
      setTimeout(() => {
        router.push("/signin?reset=success");
      }, 2000);
    } else {
      setErrorMsg(res.error || "Failed to update password. Please try again.");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
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
          <h2>Set new password</h2>
          <p className="muted">Enter a new secure password for your trading account.</p>
        </div>

        {success && (
          <div className="alert-success" role="status">
            Password updated successfully! Redirecting to sign in...
          </div>
        )}

        {errorMsg && (
          <div className="alert-error" role="alert">
            {errorMsg}
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit(onSubmit)} className="auth-form" noValidate>
            <div className="form-group">
              <label htmlFor="password">New Password (min 8 chars) *</label>
              <input
                id="password"
                type="password"
                placeholder="Letters & numbers"
                autoComplete="new-password"
                {...register("password")}
                aria-invalid={errors.password ? "true" : "false"}
              />
              {errors.password && (
                <p className="err-msg" role="alert">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm New Password *</label>
              <input
                id="confirmPassword"
                type="password"
                placeholder="Re-enter password"
                autoComplete="new-password"
                {...register("confirmPassword")}
                aria-invalid={errors.confirmPassword ? "true" : "false"}
              />
              {errors.confirmPassword && (
                <p className="err-msg" role="alert">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <button type="submit" disabled={isSubmitting} className="btn primary block lg">
              {isSubmitting ? "Updating password..." : "Set New Password →"}
            </button>
          </form>
        )}

        <div className="auth-footer-action">
          <p>
            Remembered your password?{" "}
            <Link href="/signin" className="highlight-link">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

