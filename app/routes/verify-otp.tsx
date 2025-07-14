import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useNavigation, useSearchParams } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import { createUserSession } from "~/services/auth.server";
import { apiRequestOrThrow } from "~/services/api.server";
import { useState, useRef, useEffect } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const email = url.searchParams.get("email");
  
  if (!email) {
    return redirect("/signup");
  }
  
  return json({ email });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get("email");
  const otp = formData.get("otp");
  const action = formData.get("_action");

  if (action === "resend") {
    try {
      await apiRequestOrThrow('/auth/developers/request-otp', {
        method: "POST",
        body: JSON.stringify({ email }),
      });

      return json({ success: "OTP resent successfully" });
    } catch (error) {
      return json(
        { error: error instanceof Error ? error.message : "Failed to resend OTP" },
        { status: 400 }
      );
    }
  }

  if (typeof email !== "string" || typeof otp !== "string") {
    return json(
      { error: "Email and OTP are required" },
      { status: 400 }
    );
  }

  try {
    // Verify OTP
    const response = await apiRequestOrThrow('/auth/developers/verify-otp', {
      method: "POST",
      body: JSON.stringify({ email, otp }),
    });

    const data = await response.json();
    console.log("OTP verification response:", data);

    // Get cookies from the backend response
    const setCookieHeader = response.headers.get('set-cookie');
    const cookies = setCookieHeader ? [setCookieHeader] : [];

    // Create session and forward backend cookies
    return createUserSession(
      data.access_token,
      "/dashboard",
      cookies // Forward the backend cookies including refresh_token
    );
  } catch (error) {
    console.error("OTP verification error:", error);
    return json(
      { error: error instanceof Error ? error.message : "Verification failed" },
      { status: 400 }
    );
  }
}

export default function VerifyOTP() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [lastResendTime, setLastResendTime] = useState<number | null>(null);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const pastedValue = value.slice(0, 6);
      const newOtp = [...otp];
      for (let i = 0; i < pastedValue.length && index + i < 6; i++) {
        newOtp[index + i] = pastedValue[i];
      }
      setOtp(newOtp);
      
      // Focus last filled input or next empty one
      const lastFilledIndex = Math.min(index + pastedValue.length - 1, 5);
      inputRefs.current[lastFilledIndex]?.focus();
    } else {
      // Single character input
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Move to next input
      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const otpValue = otp.join("");

  // Handle resend cooldown
  useEffect(() => {
    // Check if we just successfully resent
    if (actionData?.success && navigation.state === "idle") {
      setLastResendTime(Date.now());
      setResendCooldown(60);
    }
  }, [actionData?.success, navigation.state]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const canResend = resendCooldown === 0;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow">
        <div>
          <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">
            Verify Your Email
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            We've sent a 6-digit code to {email}
          </p>
        </div>

        <Form method="post" className="space-y-6">
          <input type="hidden" name="email" value={email} />
          <input type="hidden" name="otp" value={otpValue} />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter verification code
            </label>
            <div className="flex gap-2 justify-center">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  maxLength={6}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-12 text-center text-lg font-semibold border border-gray-300 rounded-md focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  autoFocus={index === 0}
                />
              ))}
            </div>
          </div>

          {actionData?.error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{actionData.error}</p>
            </div>
          )}

          {actionData?.success && (
            <div className="rounded-md bg-green-50 p-4">
              <p className="text-sm text-green-800">{actionData.success}</p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || otpValue.length !== 6}
          >
            {isSubmitting ? "Verifying..." : "Verify Email"}
          </Button>

          <div className="text-center">
            <Form method="post" className="inline">
              <input type="hidden" name="email" value={email} />
              <input type="hidden" name="_action" value="resend" />
              <button
                type="submit"
                className={`text-sm ${
                  canResend 
                    ? "text-indigo-600 hover:text-indigo-500" 
                    : "text-gray-400 cursor-not-allowed"
                }`}
                disabled={isSubmitting || !canResend}
              >
                {canResend 
                  ? "Didn't receive the code? Resend" 
                  : `Resend code in ${resendCooldown}s`}
              </button>
            </Form>
          </div>

          <div className="text-center text-sm">
            <a
              href="/login"
              className="text-gray-600 hover:text-gray-500"
            >
              Back to login
            </a>
          </div>
        </Form>

        <div className="text-sm text-gray-500 text-center">
          <p>The code will expire in 10 minutes</p>
        </div>
      </div>
    </div>
  );
}