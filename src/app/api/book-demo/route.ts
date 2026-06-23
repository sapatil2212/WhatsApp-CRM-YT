import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, date, time } = await req.json();

    if (!name || !email || !phone || !date || !time) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const superAdmin = process.env.SUPER_ADMIN_USERNAME || "chatnexgenai@gmail.com";

    // Setup SMTP Transporter
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpFrom = process.env.SMTP_FROM || smtpUser || "chatnexgenai@gmail.com";

    // Developer Fallback: Log demo booking details to terminal console
    console.log(`
\n=== [NEW DEMO BOOKING REGISTERED] ===
Customer: ${name} (${email})
Phone:    ${phone}
Slot:     ${date} at ${time}
Notification sent to Super Admin: ${superAdmin}
======================================\n
    `);

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

      // 1. Confirmation Email to the user booking the demo
      const userMailOptions = {
        from: smtpFrom,
        to: email,
        subject: "ChatNexGen Ai Product Demo Confirmed!",
        text: `Hi ${name},\n\nYour ChatNexGen Ai product walkthrough has been scheduled for ${date} at ${time}.\n\nMeeting link: Google Meet (the link will be attached to your calendar invite).\n\nBest regards,\nThe ChatNexGen Ai Team`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 24px; color: #1e293b; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
            <h2 style="color: #10b981; margin-top: 0;">ChatNexGen Ai Demo Confirmed!</h2>
            <p>Hi <strong>${name}</strong>,</p>
            <p>Your product walkthrough has been successfully booked. Here are your details:</p>
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; margin: 20px 0; font-size: 14px; line-height: 1.5;">
              <p style="margin: 0 0 8px 0;"><strong>Date:</strong> ${date}</p>
              <p style="margin: 0 0 8px 0;"><strong>Time Slot:</strong> ${time}</p>
              <p style="margin: 0;"><strong>Location:</strong> Google Meet (invite attached to calendar)</p>
            </div>
            <p>If you need to reschedule or have any questions, please reply directly to this email.</p>
            <p style="margin-top: 30px; font-size: 14px; color: #64748b; border-t: 1px solid #e2e8f0; pt-15;">Best regards,<br>The ChatNexGen Ai Team</p>
          </div>
        `,
      };

      // 2. Notification Email to the Super Admin
      const adminMailOptions = {
        from: smtpFrom,
        to: superAdmin,
        subject: `New Demo Walkthrough Booked: ${name}`,
        text: `New ChatNexGen Ai product demo booking.\n\nDetails:\nName: ${name}\nEmail: ${email}\nPhone: ${phone}\nSlot: ${date} at ${time}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 24px; color: #1e293b; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
            <h2 style="color: #4f46e5; margin-top: 0;">New Demo Booking</h2>
            <p>A client has scheduled a ChatNexGen Ai product walkthrough. Lead details:</p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-weight: bold; width: 120px;">Name:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: 500; color: #0f172a;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-weight: bold;">Email:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: 500;"><a href="mailto:${email}" style="color: #4f46e5; text-decoration: none;">${email}</a></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-weight: bold;">Phone Number:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: 500; color: #0f172a;">${phone}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-weight: bold;">Date:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: 500; color: #0f172a;">${date}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; font-weight: bold;">Time Slot:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-weight: 500; color: #10b981;">${time}</td>
              </tr>
            </table>
            <p style="margin-top: 30px; font-size: 12px; color: #94a3b8; border-t: 1px solid #e2e8f0; pt-15;">ChatNexGen Ai Notification Engine</p>
          </div>
        `,
      };

      try {
        await Promise.all([
          transporter.sendMail(userMailOptions),
          transporter.sendMail(adminMailOptions),
        ]);
      } catch (mailErr: any) {
        console.error("Failed to send demo emails:", mailErr);
        // Do not block user in development if SMTP details fail
        if (process.env.NODE_ENV === "development") {
          return NextResponse.json({ 
            success: true, 
            note: "SMTP send failed, but booking logged locally." 
          });
        }
        return NextResponse.json({ error: `SMTP Send Error: ${mailErr.message || mailErr}` }, { status: 500 });
      }
    } else {
      if (process.env.NODE_ENV !== "development") {
        return NextResponse.json({ error: "SMTP host not configured on backend." }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Book demo backend error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
