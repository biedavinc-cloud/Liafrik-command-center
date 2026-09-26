import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Mail, Lock, Loader2, AlertCircle, ShieldCheck } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import { toast } from "@/components/ui/use-toast";
import { safeReturnTo } from "@/lib/authReturnTo";
import { useAuth } from "@/lib/AuthContext";

export default function Register() {
  const { isAuthenticated, isLoadingAuth } = useAuth();
  const navigate = useNavigate();
  const [inviteToken, setInviteToken] = useState(null);
  const [invitation, setInvitation] = useState(null);
  const [validating, setValidating] = useState(true);
  const [inviteError, setInviteError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [completing, setCompleting] = useState(false);

  // Validate invite token on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("invite");
    if (!token) {
      setValidating(false);
      setInviteError("no_token");
      return;
    }
    setInviteToken(token);
    base44.functions.invoke("validateInvitation", { token })
      .then((res) => {
        if (res.data?.valid) {
          setInvitation(res.data);
          setEmail(res.data.email);
        } else {
          setInviteError(res.data?.reason || "invalid");
        }
      })
      .catch(() => setInviteError("error"))
      .finally(() => setValidating(false));
  }, []);

  // If already authenticated (e.g., after Google OAuth redirect), complete the invitation
  useEffect(() => {
    if (isAuthenticated && !isLoadingAuth && inviteToken && !completing && invitation) {
      setCompleting(true);
      base44.functions.invoke("completeInvitation", { token: inviteToken })
        .then(() => { window.location.href = safeReturnTo(); })
        .catch((e) => {
          setError("Failed to activate account: " + (e.message || "Unknown error"));
          setCompleting(false);
        });
    }
  }, [isAuthenticated, isLoadingAuth, inviteToken, invitation, completing]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    try {
      await base44.auth.register({ email, password });
      setShowOtp(true);
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await base44.auth.verifyOtp({ email, otpCode });
      if (result?.access_token) {
        base44.auth.setToken(result.access_token);
        // Complete the invitation — activate the administrator record
        if (inviteToken) {
          try {
            await base44.functions.invoke("completeInvitation", { token: inviteToken });
          } catch (e) {
            console.error("Failed to complete invitation:", e);
          }
        }
      }
      window.location.href = safeReturnTo();
    } catch (err) {
      setError(err.message || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      await base44.auth.resendOtp(email);
      toast({ title: "Code sent", description: "Check your email for the new code." });
    } catch (err) {
      setError(err.message || "Failed to resend code");
    }
  };

  const handleGoogle = () => {
    const returnTo = inviteToken ? `/register?invite=${inviteToken}` : safeReturnTo();
    base44.auth.loginWithProvider("google", returnTo);
  };

  // Loading state — validating invitation
  if (validating) {
    return (
      <AuthLayout icon={ShieldCheck} title="Validating invitation" subtitle="Please wait...">
        <div className="flex flex-col items-center gap-3 py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Verifying your invitation...</p>
        </div>
      </AuthLayout>
    );
  }

  // No token or invalid invitation
  if (!invitation) {
    const errorMessages = {
      no_token: "Access to the Command Center is invite-only. You need a valid invitation link to create an account.",
      not_found: "This invitation could not be found. Please contact your administrator for a new invitation.",
      expired: "This invitation has expired. Please request a new invitation from your administrator.",
      used: "This invitation has already been used. If you already have an account, please log in.",
      revoked: "This invitation has been revoked. Please contact your administrator.",
      error: "Failed to validate your invitation. Please try again or contact your administrator.",
      invalid: "This invitation is invalid. Please contact your administrator.",
    };
    return (
      <AuthLayout icon={AlertCircle} title="Invitation required" subtitle="Access is invite-only">
        <div className="mb-4 p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
          {errorMessages[inviteError] || errorMessages.invalid}
        </div>
        <Button variant="outline" className="w-full h-12 font-medium" onClick={() => navigate("/login")}>
          Go to login
        </Button>
      </AuthLayout>
    );
  }

  // Completing invitation after Google login
  if (completing) {
    return (
      <AuthLayout icon={ShieldCheck} title="Activating your account" subtitle="Almost there...">
        <div className="flex flex-col items-center gap-3 py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Activating your administrator access...</p>
        </div>
      </AuthLayout>
    );
  }

  // OTP verification
  if (showOtp) {
    return (
      <AuthLayout
        icon={Mail}
        title="Verify your email"
        subtitle={`We sent a code to ${email}`}
      >
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}
        <div className="flex justify-center mb-6">
          <InputOTP
            maxLength={6}
            value={otpCode}
            onChange={setOtpCode}
            autoFocus
            autoComplete="one-time-code"
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>
        <Button
          className="w-full h-12 font-medium"
          onClick={handleVerify}
          disabled={loading || otpCode.length < 6}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Verifying...
            </>
          ) : (
            "Verify & activate"
          )}
        </Button>
        <p className="text-center text-sm text-muted-foreground mt-4">
          Didn't receive the code?{" "}
          <button onClick={handleResend} className="text-primary font-medium hover:underline">
            Resend
          </button>
        </p>
      </AuthLayout>
    );
  }

  // Registration form (invite-only)
  return (
    <AuthLayout
      icon={UserPlus}
      title="Accept your invitation"
      subtitle={`Welcome, ${invitation.full_name || "team member"}`}
      footer={
        <span className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">
            Log in
          </Link>
        </span>
      }
    >
      <div className="mb-4 p-3 rounded-lg bg-brand-soft/40 border border-brand/30 text-sm">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-brand shrink-0" />
          <span>You were invited to join the Liafrik Command Center. Create your password below to activate your account.</span>
        </div>
      </div>

      <Button
        variant="outline"
        className="w-full h-12 text-sm font-medium mb-6"
        onClick={handleGoogle}
      >
        <GoogleIcon className="w-5 h-5 mr-2" />
        Continue with Google
      </Button>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-3 text-muted-foreground">or</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="email"
              type="email"
              value={email}
              disabled
              className="pl-10 h-12 bg-muted/50"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-12"
              required
              minLength={8}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirm Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating account...
            </>
          ) : (
            "Create account & activate"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}