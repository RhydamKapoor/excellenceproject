"use client";

import {
  emailVerificationSchema,
  nameSchema,
  passwordVerificationSchema,
} from "@/schemas/validation";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { format } from "date-fns";
import {
  Calendar,
  Eye,
  EyeClosed,
  KeyRound,
  Mail,
  Shield,
  User,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useBoolToggle } from "react-haiku";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { z } from "zod";

const profileFormSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailVerificationSchema,
  newPassword: passwordVerificationSchema.optional().or(z.literal("")),
  oldPassword: z.string().optional(),
});

function FieldGroup({ label, error, children, hint }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function ReadOnlyField({ label, value, icon: Icon }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-muted/40 px-4 py-3 text-sm text-foreground">
        {Icon && <Icon className="size-4 shrink-0 text-primary" />}
        <span className="capitalize">{value || "—"}</span>
      </div>
    </div>
  );
}

export default function EditProfileComp() {
  const [showNew, setShowNew] = useBoolToggle();
  const [showOld, setShowOld] = useBoolToggle();
  const { data: session, update } = useSession();
  const [nameParts, setNameParts] = useState({ firstName: "", lastName: "" });

  const [sections, setSections] = useState({
    disable: true,
    verification: false,
  });

  const isOAuthUser =
    session?.user?.provider === "google" || session?.user?.provider === "slack";

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      oldPassword: "",
      newPassword: "",
    },
    resolver: zodResolver(profileFormSchema),
  });

  useEffect(() => {
    if (session?.user?.name) {
      const parts = session.user.name.split(" ");
      setNameParts({
        firstName: parts[0] || "",
        lastName: parts.slice(1).join(" ") || "",
      });
    }
  }, [session]);

  useEffect(() => {
    if (session?.user) {
      setValue("firstName", session.user.firstName || nameParts.firstName);
      setValue("lastName", session.user.lastName || nameParts.lastName);
      setValue("email", session.user.email || "");
    }
  }, [session, nameParts, setValue]);

  const resetForm = () => {
    setValue("firstName", session?.user?.firstName || nameParts.firstName);
    setValue("lastName", session?.user?.lastName || nameParts.lastName);
    setValue("email", session?.user?.email || "");
    setValue("newPassword", "");
    setValue("oldPassword", "");
    setSections({ disable: true, verification: false });
  };

  const verifyingPassword = async (data) => {
    if (!sections.disable && sections.verification) {
      if (!data.oldPassword?.trim()) {
        toast.error("Please enter your current password");
        return;
      }
      editProfile(data);
    } else {
      setSections({ ...sections, verification: true });
      setValue("oldPassword", "");
    }
  };

  const editProfile = async (data) => {
    const toastId = toast.loading("Saving changes...");
    try {
      const res = await axios.put("/api/edit-profile/update", {
        ...data,
        id: session?.user?.id,
      });
      if (res.status === 200) {
        toast.success("Profile updated successfully!", { id: toastId });
        await update({
          ...session,
          user: {
            ...session.user,
            firstName: res?.data?.firstName,
            lastName: res?.data?.lastName,
            email: res?.data?.email,
            name: `${res?.data?.firstName} ${res?.data?.lastName}`,
          },
        });
        setSections({ disable: true, verification: false });
        setValue("newPassword", "");
        setValue("oldPassword", "");
      }
    } catch (error) {
      toast.error(error?.response?.data?.error || "Update failed", { id: toastId });
    }
  };

  const initials =
    (session?.user?.firstName?.charAt(0) || nameParts.firstName?.charAt(0) || "") +
    (session?.user?.lastName?.charAt(0) || nameParts.lastName?.charAt(0) || "");

  const createdAt = session?.user?.createdAt
    ? format(new Date(session.user.createdAt), "dd MMM yyyy")
    : "N/A";

  const isEditing = !sections.disable && !isOAuthUser;
  const isVerifying = isEditing && sections.verification;

  return (
    <div className="grid w-full items-start gap-6 lg:grid-cols-[minmax(280px,300px)_1fr] lg:gap-8">
      {/* Profile summary — sticky on desktop */}
      <aside className="lg:sticky lg:top-[5.75rem] lg:z-10 lg:self-start">
        <div className="card-surface flex flex-col items-center gap-5 p-6 text-center md:p-8">
        {session?.user?.image ? (
          <div className="relative size-28 overflow-hidden rounded-2xl ring-4 ring-primary/15 md:size-32">
            <Image
              src={session.user.image}
              alt={session.user.name || "Profile"}
              fill
              sizes="128px"
              priority
              className="object-cover"
            />
          </div>
        ) : (
          <div className="flex size-28 items-center justify-center rounded-2xl bg-primary/10 text-3xl font-bold uppercase text-primary md:size-32">
            {initials || "?"}
          </div>
        )}

        <div className="space-y-1">
          <h2 className="text-lg font-semibold capitalize text-foreground">
            {session?.user?.name || "User"}
          </h2>
          <p className="text-sm text-muted-foreground">{session?.user?.email}</p>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold capitalize text-primary">
            {session?.user?.role?.toLowerCase()}
          </span>
          {isOAuthUser && (
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium capitalize text-muted-foreground">
              {session?.user?.provider} account
            </span>
          )}
        </div>

        <div className="w-full space-y-2 border-t border-border pt-5 text-left text-sm">
          <div className="flex items-center justify-between gap-2 text-muted-foreground">
            <span className="flex items-center gap-2">
              <Calendar className="size-4" /> Member since
            </span>
            <span className="font-medium text-foreground">{createdAt}</span>
          </div>
        </div>

        {!isOAuthUser && sections.disable && (
          <Button
            type="button"
            className="mt-2 w-full rounded-2xl"
            onClick={() => setSections({ disable: false, verification: false })}
          >
            Edit profile
          </Button>
        )}

        {!isOAuthUser && isEditing && (
          <Button
            type="button"
            variant="outline"
            className="mt-2 w-full rounded-2xl"
            onClick={resetForm}
          >
            Cancel editing
          </Button>
        )}
        </div>
      </aside>

      {/* Form panels */}
      <div className="flex flex-col gap-6">
        {isVerifying ? (
          <div className="card-surface p-6 md:p-8">
            <div className="mb-6 flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <KeyRound className="size-5" />
              </span>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Verify your identity</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Enter your current password to confirm these changes.
                </p>
              </div>
            </div>

            <form
              onSubmit={handleSubmit(verifyingPassword)}
              className="mx-auto flex max-w-md flex-col gap-5"
            >
              <FieldGroup label="Current password" error={errors?.oldPassword?.message}>
                <div className="relative">
                  <input
                    type={showOld ? "text" : "password"}
                    className="input-field pr-12"
                    placeholder="Enter current password"
                    autoComplete="current-password"
                    {...register("oldPassword")}
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowOld()}
                  >
                    {showOld ? <Eye size={18} /> : <EyeClosed size={18} />}
                  </button>
                </div>
              </FieldGroup>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button type="submit" className="flex-1 rounded-2xl">
                  Verify & save
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 rounded-2xl"
                  onClick={resetForm}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        ) : (
          <>
            {/* Personal info */}
            <div className="card-surface p-6 md:p-8">
              <div className="mb-6 flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <User className="size-5" />
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Personal information</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {isOAuthUser
                      ? "Managed by your connected account."
                      : isEditing
                        ? "Update your name and email address."
                        : "Your basic profile details."}
                  </p>
                </div>
              </div>

              <form className="flex flex-col gap-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <FieldGroup label="First name" error={isEditing ? errors?.firstName?.message : undefined}>
                    <input
                      type="text"
                      className="input-field capitalize disabled:cursor-not-allowed disabled:opacity-70"
                      disabled={!isEditing}
                      {...register("firstName")}
                    />
                  </FieldGroup>
                  <FieldGroup label="Last name" error={isEditing ? errors?.lastName?.message : undefined}>
                    <input
                      type="text"
                      className="input-field capitalize disabled:cursor-not-allowed disabled:opacity-70"
                      disabled={!isEditing}
                      {...register("lastName")}
                    />
                  </FieldGroup>
                </div>

                <FieldGroup label="Email address" error={isEditing ? errors?.email?.message : undefined}>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="email"
                      className="input-field pl-11 lowercase disabled:cursor-not-allowed disabled:opacity-70"
                      disabled={!isEditing}
                      {...register("email")}
                    />
                  </div>
                </FieldGroup>

                {isEditing && (
                  <FieldGroup
                    label="New password"
                    error={errors?.newPassword?.message}
                    hint="Leave blank to keep your current password."
                  >
                    <div className="relative">
                      <input
                        type={showNew ? "text" : "password"}
                        className="input-field pr-12"
                        placeholder="Optional — min 4 characters"
                        autoComplete="new-password"
                        {...register("newPassword")}
                      />
                      <button
                        type="button"
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={() => setShowNew()}
                      >
                        {showNew ? <Eye size={18} /> : <EyeClosed size={18} />}
                      </button>
                    </div>
                  </FieldGroup>
                )}

                {isEditing && (
                  <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row">
                    <Button
                      type="button"
                      className="rounded-2xl sm:flex-1"
                      onClick={handleSubmit(verifyingPassword)}
                    >
                      Save changes
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-2xl sm:flex-1"
                      onClick={resetForm}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </form>
            </div>

            {/* Account details (read-only) */}
            <div className="card-surface p-6 md:p-8">
              <div className="mb-6 flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Shield className="size-5" />
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Account details</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Information about your account and access level.
                  </p>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <ReadOnlyField
                  label="Role"
                  value={session?.user?.role?.toLowerCase()}
                  icon={Shield}
                />
                {isOAuthUser ? (
                  <ReadOnlyField
                    label="Connected account"
                    value={session?.user?.provider}
                    icon={User}
                  />
                ) : (
                  <ReadOnlyField label="Sign-in method" value="Email & password" icon={KeyRound} />
                )}
                <ReadOnlyField label="Member since" value={createdAt} icon={Calendar} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
