import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { Resend } from "resend";

const MAX_LENGTH = 1500;

let emailTransporter: nodemailer.Transporter | null = null;
const resendApiKey = process.env.RESEND_API_KEY;
const resendClient = resendApiKey ? new Resend(resendApiKey) : null;

const ensureTransporter = () => {
  if (emailTransporter) {
    return emailTransporter;
  }

  const host = process.env.FEEDBACK_SMTP_HOST;
  const port = Number(process.env.FEEDBACK_SMTP_PORT ?? 465);
  const secure = process.env.FEEDBACK_SMTP_SECURE !== "false";
  const user = process.env.FEEDBACK_SMTP_USER;
  const pass = process.env.FEEDBACK_SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error("Feedback email transport is not configured.");
  }

  emailTransporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });

  return emailTransporter;
};

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { error: "Feedback message is required." },
        { status: 400 }
      );
    }

    if (message.length > MAX_LENGTH) {
      return NextResponse.json(
        { error: "Feedback is too long." },
        { status: 413 }
      );
    }

    const payload = {
      createdAt: new Date().toISOString(),
      message: message.trim(),
      userAgent: request.headers.get("user-agent") ?? undefined,
    };

    const webhookUrl = process.env.FEEDBACK_WEBHOOK_URL;

    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    } else {
      console.info("Anonymous feedback received (no webhook configured):", payload);
    }

    const toEmail = process.env.FEEDBACK_EMAIL_TO ?? "dominique.c.a.paul@gmail.com";
    const fallbackFrom = resendClient ? "onboarding@resend.dev" : undefined;
    const fromEmail = process.env.FEEDBACK_FROM_EMAIL ?? fallbackFrom;

    if (!fromEmail) {
      throw new Error(
        "Feedback from email is not configured. Set FEEDBACK_FROM_EMAIL or configure Resend with a verified from address."
      );
    }

    const subject = "New anonymous feedback";
    const textBody = `${payload.message}

—
Sent at: ${payload.createdAt}
User agent: ${payload.userAgent ?? "unknown"}`;
    const htmlBody = `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #1f2937;">
<p style="margin: 0 0 16px 0; font-size: 15px;">${payload.message.replace(/\n/g, "<br />")}</p>
<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
<div style="font-size: 13px; color: #6b7280;">
<p style="margin: 0;"><strong>Sent at:</strong> ${payload.createdAt}</p>
<p style="margin: 0;"><strong>User agent:</strong> ${payload.userAgent ?? "unknown"}</p>
</div>
</div>`;

    if (resendClient) {
      await resendClient.emails.send({
        from: fromEmail,
        to: [toEmail],
        subject,
        text: textBody,
        html: htmlBody,
      });
    } else {
      const transporter = ensureTransporter();

      await transporter.sendMail({
        from: fromEmail,
        to: toEmail,
        subject,
        text: textBody,
        html: htmlBody,
      });
    }

    return NextResponse.json({
      received: true,
      deliveredToInbox: true,
      transport: resendClient ? "resend" : "smtp",
    });
  } catch (error) {
    console.error("Failed to handle anonymous feedback", error);
    return NextResponse.json(
      { error: "Unable to record feedback right now." },
      { status: 500 }
    );
  }
}

