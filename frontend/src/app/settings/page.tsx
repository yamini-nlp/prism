"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { S, C } from "@/lib/styles";
import { bootstrapSession, getCurrentUser, type CurrentUser } from "@/lib/auth";
import { useTheme } from "@/components/ThemeProvider";
import ThemeToggle from "@/components/ThemeToggle";
import { useResetDocuments } from "@/lib/queries/documents";
import { toast } from "@/lib/toast";
import {
  profileSettingsSchema, type ProfileSettingsFormValues,
  passwordSettingsSchema, type PasswordSettingsFormValues,
} from "@/lib/validation/schemas";
import {
  User, Mail, Lock, Palette, Bell, ShieldAlert, Save, Loader2,
  Info, Trash2, CheckCircle2, Sun, Moon,
} from "lucide-react";

const PROFILE_STORAGE_KEY = "prism_profile_display_name";
const NOTIFICATIONS_STORAGE_KEY = "prism_notification_prefs";

interface NotificationPrefs {
  evaluationComplete: boolean;
  ingestionErrors: boolean;
  weeklySummary: boolean;
}

const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  evaluationComplete: true,
  ingestionErrors: true,
  weeklySummary: false,
};

function loadDisplayName(): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(PROFILE_STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

function loadNotificationPrefs(): NotificationPrefs {
  if (typeof window === "undefined") return DEFAULT_NOTIFICATION_PREFS;
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (!raw) return DEFAULT_NOTIFICATION_PREFS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_NOTIFICATION_PREFS, ...parsed };
  } catch {
    return DEFAULT_NOTIFICATION_PREFS;
  }
}

const sectionCardStyle = { ...S.card, padding: 26 } as const;

const fieldLabelStyle = {
  fontSize: 12,
  fontWeight: 600,
  color: C.textSec,
  display: "block",
  marginBottom: 6,
} as const;

const fieldHintStyle = {
  fontSize: 11.5,
  color: C.textMuted,
  marginTop: 6,
  lineHeight: 1.5,
} as const;

const fieldErrorStyle = {
  fontSize: 11.5,
  color: C.red,
  marginTop: 6,
  fontWeight: 600,
} as const;

function SectionHeader({ icon: Icon, iconColor, title }: { icon: typeof User; iconColor: string; title: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 20 }}>
      <Icon size={17} color={iconColor} />
      <div style={{ fontFamily: "'DM Serif Display',Georgia,serif", fontSize: 19, color: C.text }}>{title}</div>
    </div>
  );
}

export default function SettingsPage() {
  const { theme } = useTheme();

  const [user, setUser] = useState<CurrentUser | null>(getCurrentUser());
  const [userLoading, setUserLoading] = useState(user === null);

  useEffect(() => {
    if (user) {
      setUserLoading(false);
      return;
    }
    let cancelled = false;
    bootstrapSession().then((restored) => {
      if (cancelled) return;
      setUser(restored);
      setUserLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [profileSavedAt, setProfileSavedAt] = useState<number | null>(null);

  const profileForm = useForm<ProfileSettingsFormValues>({
    resolver: zodResolver(profileSettingsSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: { displayName: "" },
  });

  useEffect(() => {
    profileForm.reset({ displayName: loadDisplayName() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleProfileSave(values: ProfileSettingsFormValues) {
    try {
      await new Promise((resolve) => setTimeout(resolve, 350));
      localStorage.setItem(PROFILE_STORAGE_KEY, values.displayName.trim());
      setProfileSavedAt(Date.now());
      toast.success("Profile saved", "Your display name has been updated in this browser.");
      profileForm.reset({ displayName: values.displayName.trim() });
    } catch (err) {
      toast.error("Could not save profile", err instanceof Error ? err.message : "Please try again.");
    }
  }

  const passwordForm = useForm<PasswordSettingsFormValues>({
    resolver: zodResolver(passwordSettingsSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  async function handlePasswordSave(): Promise<void> {
    try {
      await new Promise((resolve) => setTimeout(resolve, 350));
      throw new Error(
        "Password changes aren't available yet in this deployment. The backend doesn't currently expose an account update endpoint."
      );
    } catch (err) {
      toast.error("Could not update password", err instanceof Error ? err.message : "Please try again.");
    }
  }

  const [notifications, setNotifications] = useState<NotificationPrefs>(DEFAULT_NOTIFICATION_PREFS);
  const [notificationsSaving, setNotificationsSaving] = useState(false);
  const [notificationsSavedAt, setNotificationsSavedAt] = useState<number | null>(null);

  useEffect(() => {
    setNotifications(loadNotificationPrefs());
  }, []);

  function toggleNotification(key: keyof NotificationPrefs) {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleNotificationsSave() {
    setNotificationsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
      setNotificationsSavedAt(Date.now());
      toast.success("Notification preferences saved");
    } catch (err) {
      toast.error("Could not save preferences", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setNotificationsSaving(false);
    }
  }

  const resetMutation = useResetDocuments();
  const [dangerZoneOpen, setDangerZoneOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const confirmMatches = confirmText.trim().toUpperCase() === "DELETE";

  async function handleDeleteAllDocuments() {
    if (!confirmMatches) return;
    try {
      await resetMutation.mutateAsync();
      toast.success("All documents deleted", "Your document library and chunks have been cleared.");
      setDangerZoneOpen(false);
      setConfirmText("");
    } catch (err) {
      toast.error("Could not delete documents", err instanceof Error ? err.message : "Please try again.");
    }
  }

  const memberSince = user?.created_at ? new Date(user.created_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) : null;

  return (
    <main style={{ flex: 1, padding: "38px 46px", overflowY: "auto", background: C.bg }}>
      <style>{`
        .pr-settings-grid { display:grid; grid-template-columns:1fr 1fr; gap:22px; align-items:start; }
        .pr-settings-col { display:flex; flex-direction:column; gap:20px; }
        .pr-password-row { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
        @media (max-width: 920px) {
          .pr-settings-grid { grid-template-columns:1fr; }
        }
        @media (max-width: 560px) {
          .pr-password-row { grid-template-columns:1fr; }
        }
      `}</style>

      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>

        <span style={{ ...S.tagIndigo, marginBottom: 12 }}>Settings</span>
        <h1 style={{ ...S.heading, fontSize: 38, marginTop: 10, marginBottom: 6 }}>Account &amp; Preferences</h1>
        <p style={{ color: C.textSec, fontSize: 15, marginBottom: 28 }}>
          Manage your profile, appearance, notifications, and data.
        </p>

        <div className="pr-settings-grid">
          <div className="pr-settings-col">

            <div style={sectionCardStyle}>
              <SectionHeader icon={User} iconColor={C.accent} title="Profile" />

              {userLoading ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: C.textMuted }}>
                  <Loader2 size={14} style={{ animation: "spin 0.7s linear infinite" }} />
                  Loading account…
                </div>
              ) : (
                <form onSubmit={profileForm.handleSubmit(handleProfileSave)} noValidate style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <label style={fieldLabelStyle} htmlFor="display-name">Display name</label>
                    <input
                      id="display-name"
                      type="text"
                      placeholder="Your name"
                      maxLength={60}
                      aria-invalid={profileForm.formState.errors.displayName ? true : undefined}
                      style={{ ...S.input, borderColor: profileForm.formState.errors.displayName ? C.red : undefined }}
                      {...profileForm.register("displayName")}
                    />
                    {profileForm.formState.errors.displayName ? (
                      <div style={fieldErrorStyle}>{profileForm.formState.errors.displayName.message}</div>
                    ) : (
                      <div style={fieldHintStyle}>Shown only in this browser. Not synced to any backend field yet.</div>
                    )}
                  </div>

                  <div>
                    <label style={fieldLabelStyle} htmlFor="email">
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <Mail size={12} /> Email
                      </span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={user?.email ?? ""}
                      disabled
                      style={{ ...S.input, background: C.bg, color: C.textMuted, cursor: "not-allowed" }}
                    />
                    <div style={fieldHintStyle}>
                      {memberSince ? `Member since ${memberSince}. ` : ""}Email is managed by the account you registered with and can't be changed from this page.
                    </div>
                  </div>

                  <motion.button
                    type="submit"
                    whileHover={{ scale: profileForm.formState.isSubmitting ? 1 : 1.02 }}
                    whileTap={{ scale: profileForm.formState.isSubmitting ? 1 : 0.97 }}
                    disabled={profileForm.formState.isSubmitting || !profileForm.formState.isValid}
                    style={profileForm.formState.isSubmitting || !profileForm.formState.isValid ? S.btnPrimaryDisabled : { ...S.btnPrimary, justifyContent: "center" }}
                  >
                    {profileForm.formState.isSubmitting ? (
                      <>
                        <Loader2 size={14} style={{ animation: "spin 0.7s linear infinite" }} />
                        Saving…
                      </>
                    ) : (
                      <>
                        <Save size={14} />
                        Save profile
                      </>
                    )}
                  </motion.button>

                  {profileSavedAt && !profileForm.formState.isSubmitting && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: C.green }}>
                      <CheckCircle2 size={13} /> Saved just now
                    </div>
                  )}
                </form>
              )}
            </div>

            <div style={sectionCardStyle}>
              <SectionHeader icon={Lock} iconColor={C.orange} title="Password" />

              <div style={{ display: "flex", alignItems: "flex-start", gap: 9, padding: "11px 15px", borderRadius: 10, background: "rgba(212,98,42,0.06)", border: "1px solid rgba(212,98,42,0.14)", marginBottom: 18 }}>
                <Info size={14} color={C.orange} style={{ flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 12, color: C.textSec, lineHeight: 1.55 }}>
                  Password changes require a backend account-update endpoint that isn't available in this deployment yet. You can still fill in the form below to see validation, but saving will show an error.
                </p>
              </div>

              <form onSubmit={passwordForm.handleSubmit(handlePasswordSave)} noValidate style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={fieldLabelStyle} htmlFor="current-password">Current password</label>
                  <input
                    id="current-password"
                    type="password"
                    autoComplete="current-password"
                    aria-invalid={passwordForm.formState.errors.currentPassword ? true : undefined}
                    style={{ ...S.input, borderColor: passwordForm.formState.errors.currentPassword ? C.red : undefined }}
                    {...passwordForm.register("currentPassword")}
                  />
                  {passwordForm.formState.errors.currentPassword && <div style={fieldErrorStyle}>{passwordForm.formState.errors.currentPassword.message}</div>}
                </div>

                <div className="pr-password-row">
                  <div>
                    <label style={fieldLabelStyle} htmlFor="new-password">New password</label>
                    <input
                      id="new-password"
                      type="password"
                      autoComplete="new-password"
                      aria-invalid={passwordForm.formState.errors.newPassword ? true : undefined}
                      style={{ ...S.input, borderColor: passwordForm.formState.errors.newPassword ? C.red : undefined }}
                      {...passwordForm.register("newPassword")}
                    />
                    {passwordForm.formState.errors.newPassword && <div style={fieldErrorStyle}>{passwordForm.formState.errors.newPassword.message}</div>}
                  </div>
                  <div>
                    <label style={fieldLabelStyle} htmlFor="confirm-password">Confirm password</label>
                    <input
                      id="confirm-password"
                      type="password"
                      autoComplete="new-password"
                      aria-invalid={passwordForm.formState.errors.confirmPassword ? true : undefined}
                      style={{ ...S.input, borderColor: passwordForm.formState.errors.confirmPassword ? C.red : undefined }}
                      {...passwordForm.register("confirmPassword")}
                    />
                    {passwordForm.formState.errors.confirmPassword && <div style={fieldErrorStyle}>{passwordForm.formState.errors.confirmPassword.message}</div>}
                  </div>
                </div>

                <motion.button
                  type="submit"
                  whileHover={{ scale: passwordForm.formState.isSubmitting ? 1 : 1.02 }}
                  whileTap={{ scale: passwordForm.formState.isSubmitting ? 1 : 0.97 }}
                  disabled={passwordForm.formState.isSubmitting || !passwordForm.formState.isValid}
                  style={passwordForm.formState.isSubmitting || !passwordForm.formState.isValid ? S.btnPrimaryDisabled : { ...S.btnSecondary, justifyContent: "center" }}
                >
                  {passwordForm.formState.isSubmitting ? (
                    <>
                      <Loader2 size={14} style={{ animation: "spin 0.7s linear infinite" }} />
                      Updating…
                    </>
                  ) : (
                    "Update password"
                  )}
                </motion.button>
              </form>
            </div>

          </div>

          <div className="pr-settings-col">

            <div style={sectionCardStyle}>
              <SectionHeader icon={Palette} iconColor="#3b82f6" title="Appearance" />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: C.text, marginBottom: 3, display: "flex", alignItems: "center", gap: 6 }}>
                    {theme === "dark" ? <Moon size={13} /> : <Sun size={13} />}
                    {theme === "dark" ? "Dark theme" : "Light theme"}
                  </div>
                  <div style={{ fontSize: 12, color: C.textMuted }}>Switches the interface theme and remembers your choice on this device.</div>
                </div>
                <ThemeToggle />
              </div>
            </div>

            <div style={sectionCardStyle}>
              <SectionHeader icon={Bell} iconColor={C.green} title="Notifications" />

              <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 18 }}>
                {[
                  { key: "evaluationComplete" as const, label: "Evaluation runs finish", desc: "Notify me when a manual evaluation re-run completes." },
                  { key: "ingestionErrors" as const, label: "Ingestion errors", desc: "Notify me if a document upload or ingest job fails." },
                  { key: "weeklySummary" as const, label: "Weekly summary", desc: "Send a weekly digest of activity across my workspace." },
                ].map((item, i, arr) => (
                  <div key={item.key} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14,
                    padding: "13px 0", borderBottom: i === arr.length - 1 ? "none" : `1px solid ${C.border}`,
                  }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: C.text }}>{item.label}</div>
                      <div style={{ fontSize: 11.5, color: C.textMuted, marginTop: 2 }}>{item.desc}</div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={notifications[item.key]}
                      aria-label={item.label}
                      onClick={() => toggleNotification(item.key)}
                      style={{
                        flexShrink: 0, width: 40, height: 22, borderRadius: 99, border: "none", cursor: "pointer",
                        background: notifications[item.key] ? C.accent : "rgba(0,0,0,0.15)",
                        position: "relative", transition: "background 0.18s",
                      }}
                    >
                      <span style={{
                        position: "absolute", top: 2, left: notifications[item.key] ? 20 : 2,
                        width: 18, height: 18, borderRadius: "50%", background: "#ffffff",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.25)", transition: "left 0.18s",
                      }} />
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 14 }}>
                Saved locally in this browser. Prism doesn't currently deliver email or push notifications.
              </div>

              <motion.button
                type="button"
                whileHover={{ scale: notificationsSaving ? 1 : 1.02 }}
                whileTap={{ scale: notificationsSaving ? 1 : 0.97 }}
                onClick={handleNotificationsSave}
                disabled={notificationsSaving}
                style={notificationsSaving ? S.btnPrimaryDisabled : { ...S.btnSecondary, justifyContent: "center", width: "100%" }}
              >
                {notificationsSaving ? (
                  <>
                    <Loader2 size={14} style={{ animation: "spin 0.7s linear infinite" }} />
                    Saving…
                  </>
                ) : (
                  "Save preferences"
                )}
              </motion.button>

              {notificationsSavedAt && !notificationsSaving && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: C.green, marginTop: 10 }}>
                  <CheckCircle2 size={13} /> Saved just now
                </div>
              )}
            </div>

            <div style={{ ...sectionCardStyle, border: `1px solid rgba(220,38,38,0.25)` }}>
              <SectionHeader icon={ShieldAlert} iconColor={C.red} title="Danger Zone" />

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: C.text, marginBottom: 3 }}>Delete all my documents</div>
                  <div style={{ fontSize: 12, color: C.textMuted, maxWidth: 360 }}>
                    Permanently removes every ingested document and chunk in your workspace. This cannot be undone.
                  </div>
                </div>
                {!dangerZoneOpen && (
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setDangerZoneOpen(true)}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 18px",
                      background: "#ffffff", color: C.red, border: `1.5px solid rgba(220,38,38,0.4)`,
                      borderRadius: 11, fontSize: 13, fontWeight: 700, fontFamily: "inherit", cursor: "pointer",
                    }}
                  >
                    <Trash2 size={13} />
                    Delete all documents
                  </motion.button>
                )}
              </div>

              {dangerZoneOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  style={{ marginTop: 18, padding: 16, borderRadius: 12, background: C.redBg, border: "1px solid rgba(220,38,38,0.2)" }}
                >
                  <p style={{ fontSize: 12.5, color: C.text, marginBottom: 10, lineHeight: 1.55 }}>
                    Type <strong>DELETE</strong> to confirm. All documents, chunks, and derived data for your workspace will be removed immediately.
                  </p>
                  <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="DELETE"
                    style={{ ...S.input, marginBottom: 12, borderColor: "rgba(220,38,38,0.35)" }}
                  />
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <motion.button
                      type="button"
                      whileHover={{ scale: confirmMatches && !resetMutation.isPending ? 1.02 : 1 }}
                      whileTap={{ scale: confirmMatches && !resetMutation.isPending ? 0.97 : 1 }}
                      onClick={handleDeleteAllDocuments}
                      disabled={!confirmMatches || resetMutation.isPending}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 18px",
                        background: confirmMatches ? C.red : "rgba(220,38,38,0.35)",
                        color: "#ffffff", border: "none", borderRadius: 11, fontSize: 13, fontWeight: 700,
                        fontFamily: "inherit", cursor: confirmMatches && !resetMutation.isPending ? "pointer" : "not-allowed",
                      }}
                    >
                      {resetMutation.isPending ? (
                        <>
                          <Loader2 size={13} style={{ animation: "spin 0.7s linear infinite" }} />
                          Deleting…
                        </>
                      ) : (
                        <>
                          <Trash2 size={13} />
                          Confirm delete
                        </>
                      )}
                    </motion.button>
                    <button
                      type="button"
                      onClick={() => { setDangerZoneOpen(false); setConfirmText(""); }}
                      disabled={resetMutation.isPending}
                      style={{ ...S.btnSecondary }}
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}
            </div>

          </div>
        </div>

      </motion.div>
    </main>
  );
}