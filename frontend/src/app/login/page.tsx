"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { apiFetch } from "@/lib/api";
import { useAuth } from "../layout";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm({
    mode: "onTouched",
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const otpForm = useForm({
    mode: "onTouched",
    defaultValues: {
      email: "",
      otp: "",
    },
  });

  async function onPasswordLogin(data: any) {
    setLoading(true);
    try {
      const res = await apiFetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email, password: data.password }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Login failed");
      }
      const user = await res.json();
      setUser(user); // update context
      toast.success("Login successful!");
      router.push("/notes");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function onSendOtp(data: any) {
    setLoading(true);
    try {
      const res = await apiFetch("/api/auth/gen-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to send OTP");
      }
      setOtpSent(true);
      toast.success("OTP sent to your email.");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function onOtpLogin(data: any) {
    setLoading(true);
    try {
      const res = await apiFetch("/api/auth/login-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email, otp: data.otp }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "OTP login failed");
      }
      toast.success("Login successful!");
      router.push("/notes");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <Card className="w-full max-w-md shadow-lg border-none bg-card/80 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Login</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="password" className="w-full">
            <TabsList className="w-full mb-6">
              <TabsTrigger value="password" className="w-1/2">
                Password
              </TabsTrigger>
              <TabsTrigger value="otp" className="w-1/2">
                OTP
              </TabsTrigger>
            </TabsList>
            <TabsContent value="password">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onPasswordLogin)}
                  className="space-y-6"
                >
                  <FormField
                    control={form.control}
                    name="email"
                    rules={{ required: "Email is required" }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" autoComplete="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    rules={{ required: "Password is required" }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? "text" : "password"}
                              autoComplete="current-password"
                              {...field}
                            />
                            <button
                              type="button"
                              tabIndex={-1}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              onClick={() => setShowPassword((v) => !v)}
                              aria-label={
                                showPassword ? "Hide password" : "Show password"
                              }
                            >
                              {showPassword ? (
                                <EyeOff className="w-5 h-5" />
                              ) : (
                                <Eye className="w-5 h-5" />
                              )}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Logging in..." : "Login"}
                  </Button>
                </form>
              </Form>
            </TabsContent>
            <TabsContent value="otp">
              <Form {...otpForm}>
                <form
                  onSubmit={
                    otpSent
                      ? otpForm.handleSubmit(onOtpLogin)
                      : otpForm.handleSubmit(onSendOtp)
                  }
                  className="space-y-6"
                >
                  <FormField
                    control={otpForm.control}
                    name="email"
                    rules={{ required: "Email is required" }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" autoComplete="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {otpSent && (
                    <FormField
                      control={otpForm.control}
                      name="otp"
                      rules={{
                        required: "OTP is required",
                        pattern: {
                          value: /^[A-Za-z0-9]{6}$/,
                          message: "OTP must be 6 alphanumeric characters",
                        },
                        minLength: {
                          value: 6,
                          message: "OTP must be 6 characters",
                        },
                        maxLength: {
                          value: 6,
                          message: "OTP must be 6 characters",
                        },
                      }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>OTP</FormLabel>
                          <FormControl>
                            <div className="flex gap-2">
                              {[...Array(6)].map((_, i) => (
                                <input
                                  key={i}
                                  type="text"
                                  inputMode="text"
                                  maxLength={1}
                                  pattern="[A-Za-z0-9]"
                                  className="w-10 h-12 text-center text-xl rounded border border-input bg-muted focus:border-primary outline-none transition-colors"
                                  value={field.value[i] || ""}
                                  onChange={(e) => {
                                    const val = e.target.value
                                      .replace(/[^A-Za-z0-9]/g, "")
                                      .slice(0, 1);
                                    const arr = field.value.split("");
                                    arr[i] = val;
                                    const newVal = arr.join("").slice(0, 6);
                                    field.onChange(newVal);
                                    // Move to next input if not last and input is filled
                                    if (val && i < 5) {
                                      const next = document.getElementById(
                                        `otp-input-${i + 1}`
                                      );
                                      if (next)
                                        (next as HTMLInputElement).focus();
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (
                                      e.key === "Backspace" &&
                                      !field.value[i] &&
                                      i > 0
                                    ) {
                                      const prev = document.getElementById(
                                        `otp-input-${i - 1}`
                                      );
                                      if (prev)
                                        (prev as HTMLInputElement).focus();
                                    }
                                  }}
                                  id={`otp-input-${i}`}
                                  autoComplete="one-time-code"
                                  aria-label={`OTP character ${i + 1}`}
                                />
                              ))}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading
                      ? otpSent
                        ? "Logging in..."
                        : "Sending OTP..."
                      : otpSent
                      ? "Login with OTP"
                      : "Send OTP"}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
