

import React, { useEffect, useState } from "react"
import { useAtom } from "jotai"
import { useMutation, useQuery } from "@tanstack/react-query"
import { adminTokenAtom } from "./Login.view.tsx"
import { Card } from "@umnburrow/core"

// ---- Configure endpoints here so backend paths are easy to adjust ----
const ADMIN_BASE = "/api/admin"
const ME_URL = `${ADMIN_BASE}/me` // optional; used to prefill username/email if available
const PROFILE_URL = `${ADMIN_BASE}/settings/profile`
const PASSWORD_URL = `${ADMIN_BASE}/settings/password`
const TOTP_RESET_URL = `${ADMIN_BASE}/settings/totp/reset`

// ---- Types ----
interface MeResponse { username?: string; email?: string }

// ---- Helpers ----
async function jfetch<T>(url: string, opts: RequestInit & { token?: string } = {}): Promise<T> {
  const { token, ...init } = opts
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
  })
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(text || `Request failed: ${res.status}`)
  }
  // Some endpoints may return no content
  // @ts-expect-error - handle 204/empty bodies
  return res.status === 204 ? undefined : await res.json()
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-semibold">{children}</h2>
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-sm text-muted-foreground">{children}</label>
}

function Field({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-1">{children}</div>
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{children}</div>
}

export default function SettingsView() {
  const [token] = useAtom(adminTokenAtom)

  // Prefill username/email if backend supports /me
  const { data: me, isFetching: loadingMe } = useQuery<MeResponse>({
    queryKey: ["admin","me"],
    queryFn: () => jfetch<MeResponse>(ME_URL, { token: token ?? undefined }),
    // If endpoint doesn't exist/403, don't explode the page
    retry: 0,
  })

  // Local form state
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")

  useEffect(() => {
    if (me?.username) setUsername(me.username)
    if (me?.email) setEmail(me.email)
  }, [me?.username, me?.email])

  // Profile update
  const updateProfile = useMutation({
    mutationKey: ["settings","profile"],
    mutationFn: async (body: { username?: string; email?: string }) =>
      jfetch<void>(PROFILE_URL, {
        method: "PATCH",
        body: JSON.stringify(body),
        token: token ?? undefined,
      }),
  })

  // Password update
  const changePassword = useMutation({
    mutationKey: ["settings","password"],
    mutationFn: async (body: { currentPassword: string; newPassword: string }) =>
      jfetch<void>(PASSWORD_URL, {
        method: "POST",
        body: JSON.stringify(body),
        token: token ?? undefined,
      }),
  })

  // TOTP reset
  const resetTotp = useMutation({
    mutationKey: ["settings","totp"],
    mutationFn: async () =>
      jfetch<void>(TOTP_RESET_URL, {
        method: "POST",
        token: token ?? undefined,
      }),
  })

  // Password form state
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const passwordMismatch = newPassword.length > 0 && newPassword !== confirmPassword
  const canSubmitPassword = !!currentPassword && !!newPassword && !passwordMismatch

  return (
    <div className="mx-auto w-full max-w-3xl p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Settings</h1>
        {loadingMe && <div className="text-xs text-muted-foreground">Loading profile…</div>}
      </div>

      {/* Profile */}
      <Card className="border border-primary/20">
        <div className="flex flex-col gap-4 p-4">
          <SectionTitle>Profile</SectionTitle>
          <Row>
            <Field>
              <Label>Username</Label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="your_username"
                className="rounded-lg border border-primary/20 bg-card px-3 py-2 text-sm focus:border-primary"
              />
            </Field>
            <Field>
              <Label>Email</Label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="rounded-lg border border-primary/20 bg-card px-3 py-2 text-sm focus:border-primary"
              />
            </Field>
          </Row>
          <div className="flex items-center gap-2">
            <button
              onClick={() => updateProfile.mutate({ username: username || undefined, email: email || undefined })}
              className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm font-medium hover:border-primary hover:bg-primary/10"
              disabled={updateProfile.isPending}
            >
              {updateProfile.isPending ? "Saving…" : "Save changes"}
            </button>
            {updateProfile.isError && (
              <span className="text-xs text-error">{(updateProfile.error as Error)?.message || "Failed to update"}</span>
            )}
            {updateProfile.isSuccess && (
              <span className="text-xs text-success">Profile updated</span>
            )}
          </div>
        </div>
      </Card>

      {/* Password */}
      <Card className="mt-6 border border-primary/20">
        <div className="flex flex-col gap-4 p-4">
          <SectionTitle>Password</SectionTitle>
          <Row>
            <Field>
              <Label>Current password</Label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="rounded-lg border border-primary/20 bg-card px-3 py-2 text-sm focus:border-primary"
              />
            </Field>
            <div />
            <Field>
              <Label>New password</Label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="rounded-lg border border-primary/20 bg-card px-3 py-2 text-sm focus:border-primary"
              />
            </Field>
            <Field>
              <Label>Confirm new password</Label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="rounded-lg border border-primary/20 bg-card px-3 py-2 text-sm focus:border-primary"
              />
              {passwordMismatch && (
                <span className="text-xs text-warn">Passwords do not match</span>
              )}
            </Field>
          </Row>
          <div className="flex items-center gap-2">
            <button
              onClick={() => changePassword.mutate({ currentPassword, newPassword })}
              className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm font-medium hover:border-primary hover:bg-primary/10"
              disabled={!canSubmitPassword || changePassword.isPending}
            >
              {changePassword.isPending ? "Changing…" : "Change password"}
            </button>
            {changePassword.isError && (
              <span className="text-xs text-error">{(changePassword.error as Error)?.message || "Failed to change password"}</span>
            )}
            {changePassword.isSuccess && (
              <span className="text-xs text-success">Password updated</span>
            )}
          </div>
        </div>
      </Card>

      {/* TOTP */}
      <Card className="mt-6 border border-warn/30">
        <div className="flex flex-col gap-3 p-4">
          <SectionTitle>Two‑factor (TOTP)</SectionTitle>
          <p className="text-sm text-muted-foreground">
            Resetting TOTP will revoke your existing authenticator pairing. You will need to set up your
            authenticator app again the next time you sign in.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (confirm("Reset TOTP for your account? This will invalidate your current authenticator.")) {
                  resetTotp.mutate()
                }
              }}
              className="rounded-lg border border-warn/40 bg-warn/10 px-3 py-2 text-sm font-medium hover:border-warn hover:bg-warn/20"
              disabled={resetTotp.isPending}
            >
              {resetTotp.isPending ? "Resetting…" : "Reset TOTP"}
            </button>
            {resetTotp.isError && (
              <span className="text-xs text-error">{(resetTotp.error as Error)?.message || "Failed to reset TOTP"}</span>
            )}
            {resetTotp.isSuccess && (
              <span className="text-xs text-success">TOTP reset</span>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}