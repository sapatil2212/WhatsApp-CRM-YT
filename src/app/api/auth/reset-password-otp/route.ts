import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import crypto from "crypto";

// Server-side client to bypass RLS and update user passwords using service role
function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

interface OtpEntry {
  code: string;
  expires: number;
}
interface VerifiedEntry {
  verified: boolean;
  expires: number;
}

// Development-safe in-memory stores that persist across hot reloads in Next.js dev server
const globalStore = globalThis as any;
globalStore.otpStore = globalStore.otpStore || new Map<string, OtpEntry>();
globalStore.verifiedStore = globalStore.verifiedStore || new Map<string, VerifiedEntry>();

const otpStore: Map<string, OtpEntry> = globalStore.otpStore;
const verifiedStore: Map<string, VerifiedEntry> = globalStore.verifiedStore;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, email } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (action === "send") {
      // 1. Generate 6-digit OTP code
      const code = crypto.randomInt(100000, 999999).toString();
      
      // 2. Save code in our store with 10-minute validity
      otpStore.set(email, {
        code,
        expires: Date.now() + 10 * 60 * 1000,
      });

      // 3. Prepare SMTP Configuration
      const cleanEnv = (val: string | undefined): string => {
        if (!val) return "";
        return val.replace(/^["']|["']$/g, "");
      };

      const smtpHost = cleanEnv(process.env.SMTP_HOST || process.env.EMAIL_HOST);
      const rawPort = process.env.SMTP_PORT || process.env.EMAIL_PORT;
      const smtpPort = rawPort ? parseInt(cleanEnv(rawPort)) : 587;
      const smtpUser = cleanEnv(process.env.SMTP_USER || process.env.EMAIL_USERNAME);
      const smtpPass = cleanEnv(process.env.SMTP_PASS || process.env.EMAIL_PASSWORD);
      const smtpFrom = cleanEnv(process.env.SMTP_FROM) || smtpUser || "chatnexgenai@gmail.com";

      // Developer Fallback: Log the verification code to the console
      console.log(`\n--- [AUTH OTP] Verification code for ${email} is: ${code} ---\n`);

      if (smtpHost && smtpUser && smtpPass) {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

        const mailOptions = {
          from: smtpFrom,
          to: email,
          subject: "Password Reset Verification Code",
          text: `Your 6-digit verification code is: ${code}. It is valid for 10 minutes.`,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 24px; color: #1e293b; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
              <h2 style="color: #10b981; margin-top: 0;">Password Reset Verification</h2>
              <p>You requested to reset your password. Use the verification code below to proceed:</p>
              <div style="font-size: 32px; font-weight: bold; font-family: monospace; background-color: #f1f5f9; padding: 12px 24px; border-radius: 8px; display: inline-block; letter-spacing: 6px; margin: 16px 0; color: #0f172a; border: 1px solid #e2e8f0;">
                ${code}
              </div>
              <p style="color: #64748b; font-size: 14px; margin-bottom: 0;">This code will expire in 10 minutes. If you did not make this request, you can safely ignore this email.</p>
            </div>
          `,
        };

        try {
          await transporter.sendMail(mailOptions);
        } catch (mailErr: any) {
          console.error("Failed to send SMTP email:", mailErr);
          // In development mode, don't block the user if SMTP fails (since code is printed in terminal)
          if (process.env.NODE_ENV === "development") {
            return NextResponse.json({ 
              success: true, 
              note: "SMTP sending failed, but OTP logged in terminal for development." 
            });
          }
          return NextResponse.json({ error: `Failed to send email: ${mailErr.message || mailErr}` }, { status: 500 });
        }
      } else {
        // If SMTP credentials aren't configured, let development environment succeed using logged OTP
        if (process.env.NODE_ENV !== "development") {
          return NextResponse.json({ error: "SMTP is not configured on the server." }, { status: 500 });
        }
      }

      return NextResponse.json({ success: true });
    }

    if (action === "verify") {
      const { code } = body;
      if (!code) {
        return NextResponse.json({ error: "Code is required" }, { status: 400 });
      }

      const stored = otpStore.get(email);
      if (!stored) {
        return NextResponse.json({ error: "Verification code not found or expired. Please request a new one." }, { status: 400 });
      }

      if (stored.expires < Date.now()) {
        otpStore.delete(email);
        return NextResponse.json({ error: "Verification code expired. Please request a new one." }, { status: 400 });
      }

      if (stored.code !== code) {
        return NextResponse.json({ error: "Invalid verification code. Please try again." }, { status: 400 });
      }

      // Mark the email as verified for password resets
      otpStore.delete(email);
      verifiedStore.set(email, {
        verified: true,
        expires: Date.now() + 10 * 60 * 1000, // Valid for 10 minutes to reset
      });

      return NextResponse.json({ success: true });
    }

    if (action === "reset") {
      const { password } = body;
      if (!password) {
        return NextResponse.json({ error: "Password is required" }, { status: 400 });
      }

      const verifiedEntry = verifiedStore.get(email);
      if (!verifiedEntry || !verifiedEntry.verified || verifiedEntry.expires < Date.now()) {
        return NextResponse.json({ error: "Session expired. Please verify your email again." }, { status: 400 });
      }

      const db = adminClient();

      // Find user id by querying the profiles table
      const { data: profile, error: profileErr } = await db
        .from("profiles")
        .select("user_id")
        .eq("email", email)
        .single();

      let targetUserId = profile?.user_id;

      // Fallback: If profile table is missing or doesn't match, search users via listUsers
      if (profileErr || !targetUserId) {
        const { data: usersData, error: listErr } = await db.auth.admin.listUsers();
        if (listErr) {
          return NextResponse.json({ error: `User listing failed: ${listErr.message}` }, { status: 500 });
        }
        const matchedUser = usersData?.users?.find(u => u.email === email);
        if (!matchedUser) {
          return NextResponse.json({ error: "User with this email not found." }, { status: 404 });
        }
        targetUserId = matchedUser.id;
      }

      // Reset the password via admin auth SDK (bypasses tokens)
      const { error: resetErr } = await db.auth.admin.updateUserById(targetUserId, {
        password,
      });

      if (resetErr) {
        return NextResponse.json({ error: `Password update failed: ${resetErr.message}` }, { status: 500 });
      }

      // Clear verification record
      verifiedStore.delete(email);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("OTP password reset error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
