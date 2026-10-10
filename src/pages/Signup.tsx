"use client";

import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Check,
  Chrome,
  Eye,
  EyeOff,
  Github,
  Gift,
  Link2,
  Loader2,
  Mail,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

type RegistrationStep = "account" | "verification" | "profile";

const Signup = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<RegistrationStep>("account");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [inviterName, setInviterName] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    referralCode: "",
  });
  const [profileData, setProfileData] = useState({
    title: "",
    skills: "",
    bio: "",
    location: "",
    portfolio_url: "",
  });

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      setFormData((previous) => ({ ...previous, referralCode: ref }));
      localStorage.setItem("pending_referral_code", ref);

      const fetchInviter = async () => {
        const { data } = await supabase
          .from("profiles")
          .select("name")
          .eq("referral_code", ref)
          .maybeSingle();
        if (data) setInviterName(data.name);
      };

      fetchInviter();
    } else {
      const pending = localStorage.getItem("pending_referral_code");
      if (pending) {
        setFormData((previous) => ({ ...previous, referralCode: pending }));
      }
    }
  }, [searchParams]);

  const handleOAuth = async (provider: "google" | "github") => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin },
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
    }
  };

  const passwordChecks = [
    { label: "8 characters minimum", valid: formData.password.length >= 8 },
    { label: "One uppercase letter", valid: /[A-Z]/.test(formData.password) },
    { label: "One lowercase letter", valid: /[a-z]/.test(formData.password) },
    { label: "One symbol", valid: /[^A-Za-z0-9]/.test(formData.password) },
    { label: "One number", valid: /[0-9]/.test(formData.password) },
  ];
  const isPasswordValid = passwordChecks.every((check) => check.valid);
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const passwordsMatch =
    passwordConfirmation.length > 0 && formData.password === passwordConfirmation;

  const processReferral = async (userId: string) => {
    const referralCode =
      formData.referralCode || localStorage.getItem("pending_referral_code");
    if (referralCode) {
      await supabase.rpc("process_referral_signup", {
        p_referral_code: referralCode,
        p_new_user_id: userId,
      });
      localStorage.removeItem("pending_referral_code");
    }
  };

  const handleCreateAccount = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!isPasswordValid) {
      toast.error("Please meet all password requirements.");
      return;
    }
    if (formData.password !== passwordConfirmation) {
      toast.error("Your passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim();
      const { data, error } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          data: { full_name: fullName },
          redirectTo: window.location.origin,
        },
      });

      if (error) throw error;
      if (!data.user) throw new Error("We could not create your account. Please try again.");

      setStep("verification");
      toast.success("Account created. Check your email for the confirmation code.");
    } catch (error: any) {
      toast.error(error.message || "Unable to create your account.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (event: React.FormEvent) => {
    event.preventDefault();
    if (otp.length !== 6) {
      toast.error("Enter the 6-digit code from your email.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: formData.email.trim(),
        token: otp,
        type: "signup",
      });

      if (error) throw error;
      if (!data.user) throw new Error("Your email could not be confirmed. Please try again.");

      await processReferral(data.user.id);
      setStep("profile");
      toast.success("Email confirmed. Now let’s set up your profile.");
    } catch (error: any) {
      toast.error(error.message || "That code is not valid. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: formData.email.trim(),
      });
      if (error) throw error;
      toast.success("A new confirmation code is on its way.");
    } catch (error: any) {
      toast.error(error.message || "Unable to resend the code.");
    } finally {
      setResending(false);
    }
  };

  const saveProfile = async (includeOptionalFields: boolean) => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Your session has expired. Please log in again.");

      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim();
      const profile = {
        id: user.id,
        name: fullName,
        ...(includeOptionalFields
          ? {
              title: profileData.title.trim(),
              skills: profileData.skills
                .split(",")
                .map((skill) => skill.trim())
                .filter(Boolean),
              bio: profileData.bio.trim(),
              location: profileData.location.trim(),
              portfolio_url: profileData.portfolio_url.trim(),
            }
          : {}),
        updated_at: new Date().toISOString(),
      };

      const { error: profileError } = await supabase
        .from("profiles")
        .upsert(profile, { onConflict: "id" });
      if (profileError) throw profileError;

      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          ...(includeOptionalFields ? { title: profileData.title.trim() } : {}),
        },
      });
      if (metadataError) throw metadataError;

      toast.success(
        includeOptionalFields ? "Your profile is ready to discover." : "You can complete your profile anytime.",
      );
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Unable to save your profile.");
    } finally {
      setLoading(false);
    }
  };

  const stepNumber = step === "account" ? 1 : 2;

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-8 text-foreground sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-xl">
        <div className="mb-8 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate("/auth")}
            className="text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            DevSphere
          </button>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Step {stepNumber} of 2
          </p>
        </div>

        <div className="mb-6 flex gap-2" aria-label="Registration progress">
          <div className="h-1.5 flex-1 rounded-full bg-primary" />
          <div
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              step === "profile" ? "bg-primary" : "bg-border"
            }`}
          />
        </div>

        <section className="rounded-3xl border border-border bg-card p-6 shadow-xl shadow-black/5 sm:p-10">
          {step === "account" && (
            <>
              <header className="mb-8">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <ShieldCheck size={25} />
                </div>
                <h1 className="text-3xl font-bold tracking-tight">Build your developer identity</h1>
                <p className="mt-2 text-muted-foreground">
                  Create your account and start connecting with developers.
                </p>
                {inviterName && (
                  <div className="mt-5 flex items-center gap-2 rounded-2xl border border-primary/20 bg-primary/10 p-3 text-sm font-semibold text-primary">
                    <Gift size={16} /> Invited by {inviterName}
                  </div>
                )}
              </header>

              <div className="mb-8 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={loading}
                    className="h-12 gap-2 rounded-xl"
                    onClick={() => handleOAuth("google")}
                  >
                    <Chrome size={18} /> Google
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={loading}
                    className="h-12 gap-2 rounded-xl"
                    onClick={() => handleOAuth("github")}
                  >
                    <Github size={18} /> GitHub
                  </Button>
                </div>
                <div className="flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground">
                  <div className="h-px flex-1 bg-border" />
                  Or sign up with email
                  <div className="h-px flex-1 bg-border" />
                </div>
              </div>

              <form onSubmit={handleCreateAccount} className="space-y-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      required
                      value={formData.firstName}
                      onChange={(event) =>
                        setFormData({ ...formData, firstName: event.target.value })
                      }
                      placeholder="Ada"
                      className="h-12 rounded-xl bg-accent/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      required
                      value={formData.lastName}
                      onChange={(event) =>
                        setFormData({ ...formData, lastName: event.target.value })
                      }
                      placeholder="Lovelace"
                      className="h-12 rounded-xl bg-accent/10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} />
                    <Input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(event) =>
                        setFormData({ ...formData, email: event.target.value })
                      }
                      placeholder="ada@example.com"
                      className="h-12 rounded-xl bg-accent/10 pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={formData.password}
                      onChange={(event) =>
                        setFormData({ ...formData, password: event.target.value })
                      }
                      autoComplete="new-password"
                      className="h-12 rounded-xl bg-accent/10 pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {formData.password.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {passwordChecks.map((check) => (
                        <div
                          key={check.label}
                          className={`flex items-center gap-1.5 text-xs ${
                            check.valid ? "text-emerald-500" : "text-muted-foreground"
                          }`}
                        >
                          <span
                            className={`flex h-4 w-4 items-center justify-center rounded-full border text-[10px] ${
                              check.valid
                                ? "border-emerald-500 bg-emerald-500 text-white"
                                : "border-muted-foreground/40"
                            }`}
                          >
                            {check.valid && <Check size={10} />}
                          </span>
                          {check.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      required
                      value={passwordConfirmation}
                      onChange={(event) => setPasswordConfirmation(event.target.value)}
                      autoComplete="new-password"
                      placeholder="Re-enter your password"
                      className={`h-12 rounded-xl bg-accent/10 pr-11 ${
                        passwordConfirmation.length > 0
                          ? passwordsMatch
                            ? "border-emerald-500"
                            : "border-destructive"
                          : ""
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {passwordConfirmation.length > 0 && (
                    <p className={`text-xs ${passwordsMatch ? "text-emerald-500" : "text-destructive"}`}>
                      {passwordsMatch ? "✓ Passwords match" : "Passwords do not match"}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="h-14 mt-2 w-full rounded-xl text-base font-bold shadow-lg shadow-primary/20"
                >
                  {loading ? <Loader2 className="animate-spin" /> : <>Create account <ArrowRight size={18} /></>}
                </Button>
              </form>
            </>
          )}

          {step === "verification" && (
            <div className="py-4 text-center sm:py-8">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
                <Mail size={30} />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Check your inbox</h1>
              <p className="mx-auto mt-3 max-w-sm text-muted-foreground">
                We sent a 6-digit confirmation code to <strong className="text-foreground">{formData.email}</strong>.
              </p>

              <form onSubmit={handleVerifyEmail} className="mx-auto mt-8 max-w-sm space-y-6">
                <InputOTP maxLength={6} value={otp} onChange={setOtp} containerClassName="justify-center">
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
                <Button type="submit" disabled={loading || otp.length !== 6} className="h-12 w-full rounded-xl font-bold">
                  {loading ? <Loader2 className="animate-spin" /> : <>Confirm email <ArrowRight size={18} /></>}
                </Button>
              </form>

              <div className="mt-7 space-y-3 text-sm">
                <p className="text-muted-foreground">Didn’t receive the code?</p>
                <Button type="button" variant="ghost" disabled={resending} onClick={handleResendCode} className="font-semibold text-primary">
                  {resending ? <Loader2 className="mr-2 animate-spin" size={16} /> : null}
                  Resend code
                </Button>
              </div>
              <button
                type="button"
                onClick={() => setStep("account")}
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft size={15} /> Use a different email
              </button>
            </div>
          )}

          {step === "profile" && (
            <>
              <header className="mb-8">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <BriefcaseBusiness size={25} />
                </div>
                <h1 className="text-3xl font-bold tracking-tight">Let&apos;s set up your profile.</h1>
                <p className="mt-2 text-muted-foreground">
                  Help other developers discover you. You can always complete this later.
                </p>
              </header>

              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="title">Professional title <span className="font-normal text-muted-foreground">(optional)</span></Label>
                  <div className="relative">
                    <BriefcaseBusiness className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} />
                    <Input
                      id="title"
                      value={profileData.title}
                      onChange={(event) => setProfileData({ ...profileData, title: event.target.value })}
                      placeholder="e.g. Senior Fullstack Developer"
                      className="h-12 rounded-xl bg-accent/10 pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="skills">Skills <span className="font-normal text-muted-foreground">(comma separated, optional)</span></Label>
                  <Input
                    id="skills"
                    value={profileData.skills}
                    onChange={(event) => setProfileData({ ...profileData, skills: event.target.value })}
                    placeholder="React, TypeScript, Node.js"
                    className="h-12 rounded-xl bg-accent/10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio / About <span className="font-normal text-muted-foreground">(optional)</span></Label>
                  <Textarea
                    id="bio"
                    value={profileData.bio}
                    onChange={(event) => setProfileData({ ...profileData, bio: event.target.value })}
                    placeholder="Tell the community a little about your journey..."
                    className="min-h-[120px] rounded-xl bg-accent/10"
                  />
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location <span className="font-normal text-muted-foreground">(optional)</span></Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} />
                      <Input
                        id="location"
                        value={profileData.location}
                        onChange={(event) => setProfileData({ ...profileData, location: event.target.value })}
                        placeholder="San Francisco, CA"
                        className="h-12 rounded-xl bg-accent/10 pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="portfolio_url">Portfolio URL <span className="font-normal text-muted-foreground">(optional)</span></Label>
                    <div className="relative">
                      <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={17} />
                      <Input
                        id="portfolio_url"
                        type="url"
                        value={profileData.portfolio_url}
                        onChange={(event) => setProfileData({ ...profileData, portfolio_url: event.target.value })}
                        placeholder="https://yourportfolio.com"
                        className="h-12 rounded-xl bg-accent/10 pl-10"
                      />
                    </div>
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={() => saveProfile(true)}
                  disabled={loading}
                  className="h-14 mt-3 w-full rounded-xl text-base font-bold shadow-lg shadow-primary/20"
                >
                  {loading ? <Loader2 className="animate-spin" /> : <>Complete Profile <ArrowRight size={18} /></>}
                </Button>
                <button
                  type="button"
                  onClick={() => saveProfile(false)}
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-1 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                >
                  Skip for now <ArrowRight size={15} />
                </button>
              </div>
            </>
          )}
        </section>

        {step === "account" && (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account? <button type="button" onClick={() => navigate("/auth")} className="font-semibold text-primary hover:underline">Log in</button>
          </p>
        )}
      </div>
    </main>
  );
};

export default Signup;
