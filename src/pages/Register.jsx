import { invokeFunction } from '@/lib/api';
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signInEmail } from "@/lib/neonAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Mail, Lock, Loader2, AlertCircle, ShieldCheck } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { toast } from "@/components/ui/use-toast";
import { safeReturnTo } from "@/lib/authReturnTo";
import { useT } from "@/lib/i18n/I18nProvider";

export default function Register() {
  const { t } = useT();
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("invite");
    if (!token) {
      setValidating(false);
      setInviteError("no_token");
      return;
    }
    setInviteToken(token);
    invokeFunction("validateInvitation", { token })
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError(t('authPage.passwordMismatch'));
      return;
    }
    if (password.length < 8) {
      setError(t('authPage.passwordTooShort'));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: inviteToken, password, name: invitation?.full_name }),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(out.error || t('authPage.activateFailed'));
      await signInEmail(email, password);
      window.location.href = safeReturnTo();
    } catch (err) {
      setError(err.message || t('authPage.activateFailed'));
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <AuthLayout icon={ShieldCheck} title={t('authPage.validatingInvite')} subtitle={t('authPage.pleaseWait')}>
        <div className="flex flex-col items-center gap-3 py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{t('authPage.verifyingInvite')}</p>
        </div>
      </AuthLayout>
    );
  }

  if (!invitation) {
    const errorMessages = {
      no_token: t('authPage.errNoToken'),
      not_found: t('authPage.errNotFound'),
      expired: t('authPage.errExpired'),
      used: t('authPage.errUsed'),
      revoked: t('authPage.errRevoked'),
      error: t('authPage.errError'),
      invalid: t('authPage.errInvalid'),
    };
    return (
      <AuthLayout icon={AlertCircle} title={t('authPage.invitationRequired')} subtitle={t('authPage.accessInviteOnly')}>
        <div className="mb-4 p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
          {errorMessages[inviteError] || errorMessages.invalid}
        </div>
        <Button variant="outline" className="w-full h-12 font-medium" onClick={() => navigate("/login")}>
          {t('authPage.goToLogin')}
        </Button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      icon={UserPlus}
      title={t('authPage.acceptInvite')}
      subtitle={t('authPage.welcomeName', { name: invitation.full_name || '' })}
      footer={
        <span className="text-sm text-muted-foreground">
          {t('authPage.alreadyAccount')}{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">
            {t('authPage.logIn')}
          </Link>
        </span>
      }
    >
      <div className="mb-4 p-3 rounded-lg bg-brand-soft/40 border border-brand/30 text-sm">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-brand shrink-0" />
          <span>{t('authPage.inviteBanner')}</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">{t('authPage.email')}</Label>
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
          <Label htmlFor="password">{t('authPage.password')}</Label>
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
          <Label htmlFor="confirm">{t('authPage.confirmPassword')}</Label>
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
              {t('authPage.creatingAccount')}
            </>
          ) : (
            t('authPage.createActivate')
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}