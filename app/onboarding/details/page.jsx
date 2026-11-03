"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import OnboardingGuard from "@/components/onboarding/Guard";
import OnboardingLayout from "@/components/onboarding/OnboardingLayout";
import { useOnboarding } from "@/lib/onboarding-context";
import {
  BUSINESS_CATEGORIES,
  GSTIN_REGEX,
  PURCHASE_PURPOSES,
} from "@/lib/config";

/* -------------------------------------------------------------
 * 1. INDIVIDUAL SCHEMA - Strictly NO GSTIN!
 * ------------------------------------------------------------- */
const individualSchema = z.object({
  name: z.string().min(2, "Full name must be at least 2 characters"),
  address: z.string().min(5, "Please enter your street address / locality"),
  city: z.string().min(2, "Enter your city or district"),
  state: z.string().min(2, "Enter your state"),
  pincode: z.string().regex(/^\d{6}$/, "Enter a valid 6-digit Indian postal pincode"),
  purposeOfPurchase: z.array(z.string()).optional(),
});

/* -------------------------------------------------------------
 * 2. COMPANY / GROUP SCHEMA - Mandatory Valid GSTIN!
 * ------------------------------------------------------------- */
const companyGroupSchema = z.object({
  legalName: z.string().min(2, "Legal or registered name is required"),
  gstin: z
    .string()
    .trim()
    .toUpperCase()
    .regex(
      GSTIN_REGEX,
      "Enter a valid 15-character Indian GSTIN (e.g. 33AAAAA0000A1Z5)"
    ),
  contactPerson: z.string().min(2, "Contact person name is required"),
  address: z.string().min(5, "Registered business address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  pincode: z.string().regex(/^\d{6}$/, "Enter a valid 6-digit pincode"),
  businessCategory: z.string().min(1, "Please select your business category"),
});

export default function OnboardingDetailsPage() {
  const router = useRouter();
  const {
    state,
    saveIndividualDetails,
    saveCompanyDetails,
  } = useOnboarding();

  const isIndividual = state.accountType === "individual";
  const isBuyerRole = state.roles.includes("buyer");
  const isGroup = state.accountType === "group";

  const [purposes, setPurposes] = useState(
    state.individualDetails?.purposeOfPurchase || ["Personal use"]
  );
  const [submitting, setSubmitting] = useState(false);

  /* Form for Individual */
  const indForm = useForm({
    resolver: zodResolver(individualSchema),
    mode: "onTouched",
    defaultValues: {
      name: state.individualDetails?.name || state.user?.name || "",
      address: state.individualDetails?.address || "",
      city: state.individualDetails?.city || "Salem",
      state: state.individualDetails?.state || "Tamil Nadu",
      pincode: state.individualDetails?.pincode || "636001",
      purposeOfPurchase: purposes,
    },
  });

  /* Form for Company or Group */
  const compForm = useForm({
    resolver: zodResolver(companyGroupSchema),
    mode: "onTouched",
    defaultValues: {
      legalName: state.companyDetails?.legalName || "",
      gstin: state.companyDetails?.gstin || "",
      contactPerson: state.companyDetails?.contactPerson || state.user?.name || "",
      address: state.companyDetails?.address || "",
      city: state.companyDetails?.city || "Coimbatore",
      state: state.companyDetails?.state || "Tamil Nadu",
      pincode: state.companyDetails?.pincode || "641001",
      businessCategory: state.companyDetails?.businessCategory || "Bakery or food business",
    },
  });

  const onIndividualSubmit = async (data) => {
    setSubmitting(true);
    await saveIndividualDetails({
      ...data,
      purposeOfPurchase: isBuyerRole ? purposes : undefined,
    });
    setSubmitting(false);
    router.push("/onboarding/status");
  };

  const onCompanySubmit = async (data) => {
    setSubmitting(true);
    await saveCompanyDetails(data);
    setSubmitting(false);
    router.push("/onboarding/status");
  };

  const togglePurpose = (p) => {
    setPurposes((prev) =>
      prev.includes(p) ? prev.filter((item) => item !== p) : [...prev, p]
    );
  };

  return (
    <OnboardingGuard allowedPath="/onboarding/details">
      <OnboardingLayout
        currentStep={3}
        title={
          isIndividual
            ? "Individual profile details"
            : isGroup
            ? "Group / FPO details with GSTIN"
            : "Company details with GSTIN"
        }
        subtitle={
          isIndividual
            ? "A simple form for personal and household buyers. Zero GSTIN field rendered."
            : "GSTIN is mandatory for all companies and groups. Format is validated for admin review."
        }
      >
        {/* =========================================================
            PATH A: INDIVIDUAL FORM (STRICTLY NO GSTIN RENDERED)
            ========================================================= */}
        {isIndividual ? (
          <form
            onSubmit={indForm.handleSubmit(onIndividualSubmit)}
            className="details-form"
            noValidate
          >
            <div className="form-notice green-notice">
              <span className="notice-icon">✓</span>
              <div>
                <strong>Individual account flow</strong>
                <p>
                  As an individual, you skip commercial category and tax questions.
                  <b> No GSTIN is required or requested.</b>
                </p>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="ind-name">Full name *</label>
              <input
                id="ind-name"
                type="text"
                placeholder="e.g. Senthil Nathan"
                autoComplete="name"
                {...indForm.register("name")}
                aria-invalid={indForm.formState.errors.name ? "true" : "false"}
              />
              {indForm.formState.errors.name && (
                <p className="err-msg" role="alert">
                  {indForm.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="ind-address">Address / Street *</label>
              <input
                id="ind-address"
                type="text"
                placeholder="House / Door No, Street, Landmark"
                autoComplete="street-address"
                {...indForm.register("address")}
                aria-invalid={indForm.formState.errors.address ? "true" : "false"}
              />
              {indForm.formState.errors.address && (
                <p className="err-msg" role="alert">
                  {indForm.formState.errors.address.message}
                </p>
              )}
            </div>

            <div className="three-col">
              <div className="form-group">
                <label htmlFor="ind-city">City / Town *</label>
                <input
                  id="ind-city"
                  type="text"
                  placeholder="e.g. Salem"
                  autoComplete="address-level2"
                  {...indForm.register("city")}
                  aria-invalid={indForm.formState.errors.city ? "true" : "false"}
                />
                {indForm.formState.errors.city && (
                  <p className="err-msg" role="alert">
                    {indForm.formState.errors.city.message}
                  </p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="ind-state">State *</label>
                <input
                  id="ind-state"
                  type="text"
                  placeholder="e.g. Tamil Nadu"
                  autoComplete="address-level1"
                  {...indForm.register("state")}
                  aria-invalid={indForm.formState.errors.state ? "true" : "false"}
                />
                {indForm.formState.errors.state && (
                  <p className="err-msg" role="alert">
                    {indForm.formState.errors.state.message}
                  </p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="ind-pincode">6-digit Pincode *</label>
                <input
                  id="ind-pincode"
                  type="text"
                  maxLength={6}
                  placeholder="636001"
                  autoComplete="postal-code"
                  {...indForm.register("pincode")}
                  aria-invalid={indForm.formState.errors.pincode ? "true" : "false"}
                />
                {indForm.formState.errors.pincode && (
                  <p className="err-msg" role="alert">
                    {indForm.formState.errors.pincode.message}
                  </p>
                )}
              </div>
            </div>

            {/* If buyer role: Purpose of purchase */}
            {isBuyerRole && (
              <div className="form-group">
                <label>Purpose of purchase (select all that apply)</label>
                <div className="chips-grid">
                  {PURCHASE_PURPOSES.map((purpose) => {
                    const active = purposes.includes(purpose);
                    return (
                      <button
                        key={purpose}
                        type="button"
                        className={`chip-btn ${active ? "active" : ""}`}
                        onClick={() => togglePurpose(purpose)}
                        aria-pressed={active}
                      >
                        {active ? "✓ " : "+ "}
                        {purpose}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="privacy-callout">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>Your phone number and address are private and never shown publicly on the marketplace.</span>
            </div>

            <div className="step-footer-actions">
              <button
                type="button"
                className="btn ghost lg"
                onClick={() => router.push("/onboarding/account-type")}
              >
                ← Back
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn primary lg"
              >
                {submitting ? "Submitting application..." : "Submit for Admin Approval →"}
              </button>
            </div>
          </form>
        ) : (
          /* =========================================================
             PATH B: COMPANY / GROUP FORM (GSTIN MANDATORY & CHECKED)
             ========================================================= */
          <form
            onSubmit={compForm.handleSubmit(onCompanySubmit)}
            className="details-form"
            noValidate
          >
            <div className="form-notice amber-notice">
              <span className="notice-icon">!</span>
              <div>
                <strong>GSTIN Required for {isGroup ? "Groups" : "Companies"}</strong>
                <p>
                  You selected <b>{isGroup ? "Group" : "Company"}</b>. A valid 15-character GSTIN is required.
                  The administrator will review your GSTIN against your business details.
                </p>
              </div>
            </div>

            <div className="two-col">
              <div className="form-group">
                <label htmlFor="comp-legalName">
                  {isGroup ? "Group / Society / FPO name *" : "Company legal name *"}
                </label>
                <input
                  id="comp-legalName"
                  type="text"
                  placeholder={
                    isGroup
                      ? "e.g. Kongu Farmer Producer Company Ltd"
                      : "e.g. Annapoorna Agro Foods Pvt Ltd"
                  }
                  autoComplete="organization"
                  {...compForm.register("legalName")}
                  aria-invalid={compForm.formState.errors.legalName ? "true" : "false"}
                />
                {compForm.formState.errors.legalName && (
                  <p className="err-msg" role="alert">
                    {compForm.formState.errors.legalName.message}
                  </p>
                )}
              </div>

              {/* GSTIN FIELD - MANDATORY & STRICT FORMAT CHECK */}
              <div className="form-group">
                <label htmlFor="comp-gstin">
                  GSTIN (15 characters) *
                  <span className="tag-required">Mandatory</span>
                </label>
                <input
                  id="comp-gstin"
                  type="text"
                  maxLength={15}
                  placeholder="33AAAAA0000A1Z5"
                  className="gstin-input"
                  autoComplete="off"
                  {...compForm.register("gstin", {
                    setValueAs: (v) => (v ? v.trim().toUpperCase() : ""),
                  })}
                  aria-invalid={compForm.formState.errors.gstin ? "true" : "false"}
                />
                {compForm.formState.errors.gstin ? (
                  <p className="err-msg" role="alert">
                    {compForm.formState.errors.gstin.message}
                  </p>
                ) : (
                  <small className="muted">
                    Format: 2 state digits + 10-digit PAN + entity code + Z + checksum.
                  </small>
                )}
              </div>
            </div>

            <div className="two-col">
              <div className="form-group">
                <label htmlFor="comp-contactPerson">Contact person name *</label>
                <input
                  id="comp-contactPerson"
                  type="text"
                  placeholder="e.g. R. Venkatesh"
                  autoComplete="name"
                  {...compForm.register("contactPerson")}
                  aria-invalid={compForm.formState.errors.contactPerson ? "true" : "false"}
                />
                {compForm.formState.errors.contactPerson && (
                  <p className="err-msg" role="alert">
                    {compForm.formState.errors.contactPerson.message}
                  </p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="comp-category">Business category *</label>
                <select
                  id="comp-category"
                  {...compForm.register("businessCategory")}
                  aria-invalid={compForm.formState.errors.businessCategory ? "true" : "false"}
                >
                  {BUSINESS_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                {compForm.formState.errors.businessCategory && (
                  <p className="err-msg" role="alert">
                    {compForm.formState.errors.businessCategory.message}
                  </p>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="comp-address">Registered business address *</label>
              <input
                id="comp-address"
                type="text"
                placeholder="Industrial Estate, Mill Road, Warehouse No."
                autoComplete="street-address"
                {...compForm.register("address")}
                aria-invalid={compForm.formState.errors.address ? "true" : "false"}
              />
              {compForm.formState.errors.address && (
                <p className="err-msg" role="alert">
                  {compForm.formState.errors.address.message}
                </p>
              )}
            </div>

            <div className="three-col">
              <div className="form-group">
                <label htmlFor="comp-city">City *</label>
                <input
                  id="comp-city"
                  type="text"
                  placeholder="e.g. Coimbatore"
                  autoComplete="address-level2"
                  {...compForm.register("city")}
                  aria-invalid={compForm.formState.errors.city ? "true" : "false"}
                />
                {compForm.formState.errors.city && (
                  <p className="err-msg" role="alert">
                    {compForm.formState.errors.city.message}
                  </p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="comp-state">State *</label>
                <input
                  id="comp-state"
                  type="text"
                  placeholder="e.g. Tamil Nadu"
                  autoComplete="address-level1"
                  {...compForm.register("state")}
                  aria-invalid={compForm.formState.errors.state ? "true" : "false"}
                />
                {compForm.formState.errors.state && (
                  <p className="err-msg" role="alert">
                    {compForm.formState.errors.state.message}
                  </p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="comp-pincode">Pincode *</label>
                <input
                  id="comp-pincode"
                  type="text"
                  maxLength={6}
                  placeholder="641001"
                  autoComplete="postal-code"
                  {...compForm.register("pincode")}
                  aria-invalid={compForm.formState.errors.pincode ? "true" : "false"}
                />
                {compForm.formState.errors.pincode && (
                  <p className="err-msg" role="alert">
                    {compForm.formState.errors.pincode.message}
                  </p>
                )}
              </div>
            </div>

            <div className="privacy-callout">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>GSTIN and business documents are private and visible only to the platform admin during review.</span>
            </div>

            <div className="step-footer-actions">
              <button
                type="button"
                className="btn ghost lg"
                onClick={() => router.push("/onboarding/account-type")}
              >
                ← Back
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn primary lg"
              >
                {submitting ? "Submitting application..." : "Submit for Admin Approval →"}
              </button>
            </div>
          </form>
        )}
      </OnboardingLayout>
    </OnboardingGuard>
  );
}

