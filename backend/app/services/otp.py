"""
Groupify — Email OTP Service.

Generates, stores, and sends OTP codes via email.
Uses Python's built-in smtplib for SMTP delivery.
Falls back to console logging when SMTP is not configured (development mode).
"""

import os
import random
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta, timezone

from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("groupify.otp")

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_EMAIL = os.getenv("SMTP_EMAIL", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
OTP_EXPIRY_MINUTES = int(os.getenv("OTP_EXPIRY_MINUTES", "5"))


def generate_otp() -> str:
    """Generate a 6-digit numeric OTP."""
    return str(random.randint(100000, 999999))


def _build_otp_email(to_email: str, otp_code: str, purpose: str = "verify your email") -> MIMEMultipart:
    """Build a styled HTML email containing the OTP."""
    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"Groupify — Your verification code is {otp_code}"
    msg["From"] = SMTP_EMAIL or "noreply@groupify.app"
    msg["To"] = to_email

    plain = f"Your Groupify verification code is: {otp_code}\nThis code expires in {OTP_EXPIRY_MINUTES} minutes."

    html = f"""\
    <html>
    <body style="margin:0;padding:0;background:#0a0a0f;font-family:'Inter',Arial,sans-serif;">
      <div style="max-width:480px;margin:40px auto;background:#12121a;border-radius:16px;border:1px solid #1e1e2e;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#6c5ce7,#a855f7);padding:32px 24px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700;">Groupify</h1>
          <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">AI-Powered Teammate Matching</p>
        </div>
        <div style="padding:32px 24px;text-align:center;">
          <p style="color:#a0a0b8;font-size:15px;margin:0 0 24px;">Enter this code to {purpose}:</p>
          <div style="background:#1a1a2e;border:2px solid #6c5ce7;border-radius:12px;padding:20px;margin:0 auto;display:inline-block;">
            <span style="font-size:36px;font-weight:800;letter-spacing:12px;color:#fff;font-family:monospace;">{otp_code}</span>
          </div>
          <p style="color:#666;font-size:13px;margin:24px 0 0;">This code expires in <strong style="color:#a855f7;">{OTP_EXPIRY_MINUTES} minutes</strong>.</p>
          <p style="color:#444;font-size:12px;margin:16px 0 0;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      </div>
    </body>
    </html>
    """

    msg.attach(MIMEText(plain, "plain"))
    msg.attach(MIMEText(html, "html"))
    return msg


def send_otp_email(to_email: str, otp_code: str, purpose: str = "verify your email") -> bool:
    """
    Send an OTP email. Returns True on success.
    
    In development mode (no SMTP_EMAIL configured), logs the OTP
    to the server console instead of sending an email.
    """
    # Development fallback — log to console
    if not SMTP_EMAIL or not SMTP_PASSWORD:
        logger.warning(
            "╔════════════════════════════════════════════════════════╗"
        )
        logger.warning(
            f"║  OTP for {to_email}: {otp_code}  (SMTP not configured)  ║"
        )
        logger.warning(
            "╚════════════════════════════════════════════════════════╝"
        )
        print(f"\n{'='*60}")
        print(f"  📧 OTP for {to_email}: {otp_code}")
        print(f"  ⏰ Expires in {OTP_EXPIRY_MINUTES} minutes")
        print(f"  ⚠️  SMTP not configured — email NOT actually sent")
        print(f"{'='*60}\n")
        return True  # Pretend it worked for dev

    try:
        msg = _build_otp_email(to_email, otp_code, purpose)
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            server.sendmail(SMTP_EMAIL, to_email, msg.as_string())
        logger.info(f"OTP email sent to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send OTP email to {to_email}: {e}")
        # Still log to console so dev can test
        print(f"\n{'='*60}")
        print(f"  📧 OTP for {to_email}: {otp_code}")
        print(f"  ❌ Email send failed: {e}")
        print(f"{'='*60}\n")
        return False


def get_otp_expiry() -> datetime:
    """Return the expiry timestamp for a new OTP."""
    return datetime.now(timezone.utc) + timedelta(minutes=OTP_EXPIRY_MINUTES)
