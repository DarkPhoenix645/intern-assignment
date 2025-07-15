"use client";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Book, Bookmark, StickyNote, Search, Brain } from "lucide-react";
import { useAuth } from "./layout";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { Eye, EyeOff, X } from "lucide-react";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { motion } from "framer-motion";
import { AnimatePresence } from "framer-motion";

export default function Home() {
  const { user, setUser } = useAuth();
  const router = useRouter();
  const [showFeatures, setShowFeatures] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  // Login form state
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const loginForm = useForm({
    mode: "onTouched",
    defaultValues: { email: "", password: "" },
  });
  const otpForm = useForm({
    mode: "onTouched",
    defaultValues: { email: "", otp: "" },
  });
  // Register form state
  const registerForm = useForm({
    mode: "onTouched",
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });
  const [loadingRegister, setLoadingRegister] = useState(false);

  useEffect(() => {
    document.body.classList.add("landing-scroll-lock");
    document.documentElement.classList.add("landing-scroll-lock");
    return () => {
      document.body.classList.remove("landing-scroll-lock");
      document.documentElement.classList.remove("landing-scroll-lock");
    };
  }, []);

  async function onPasswordLogin(data: any) {
    setLoadingLogin(true);
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
      setUser(user);
      toast.success("Login successful!");
      setShowLogin(false);
      router.push("/notes");
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setLoadingLogin(false);
    }
  }
  async function onSendOtp(data: any) {
    setLoadingLogin(true);
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
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setLoadingLogin(false);
    }
  }
  async function onOtpLogin(data: any) {
    setLoadingLogin(true);
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
      setShowLogin(false);
      router.push("/notes");
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setLoadingLogin(false);
    }
  }
  async function onRegister(data: any) {
    if (data.password !== data.confirmPassword) {
      registerForm.setError("confirmPassword", {
        message: "Passwords do not match",
      });
      return;
    }
    setLoadingRegister(true);
    try {
      const res = await apiFetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email, password: data.password }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Registration failed");
      }
      toast.success("Registration successful! Please login.");
      setShowRegister(false);
      setShowLogin(true);
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setLoadingRegister(false);
    }
  }

  return (
    <div
      className={`relative min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-b from-[#090a1a] to-[#1e293b] text-foreground md:overflow-hidden md:min-h-screen ${
        showLogin || showRegister || showFeatures
          ? "overflow-hidden"
          : "overflow-auto"
      } min-h-0`}
    >
      {/* Animated Glowing Gradient Background Shapes */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none">
        <motion.div
          className="absolute w-[60vw] h-[60vw] bg-gradient-to-br from-[#6366f1] to-[#a21caf] opacity-30 blur-3xl left-[-20vw] top-[-10vw] rounded-full"
          animate={{
            scale: [1, 1.1, 1],
            x: [0, 40, 0],
            y: [0, 30, 0],
            rotate: [0, 10, -10, 0],
          }}
          transition={{
            duration: 16,
            repeat: Infinity,
            repeatType: "mirror",
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute w-[50vw] h-[50vw] bg-gradient-to-tr from-[#f472b6] to-[#6366f1] opacity-20 blur-2xl right-[-15vw] top-[20vw] rounded-full"
          animate={{
            scale: [1, 1.08, 1],
            x: [0, -30, 0],
            y: [0, -20, 0],
            rotate: [0, -10, 10, 0],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            repeatType: "mirror",
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute w-[40vw] h-[40vw] bg-gradient-to-tl from-[#a21caf] to-[#f472b6] opacity-25 blur-2xl left-[20vw] bottom-[-15vw] rounded-full"
          animate={{
            scale: [1, 1.12, 1],
            x: [0, 20, 0],
            y: [0, 25, 0],
            rotate: [0, 8, -8, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: "mirror",
            ease: "easeInOut",
          }}
        />
      </div>
      {/* Background Brain SVG */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0">
        <Brain
          className="w-[60vw] max-w-2xl opacity-10 blur-sm animate-spin-slow text-primary"
          style={{ animationDuration: "60s" }}
        />
      </div>
      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center w-full h-screen max-h-screen px-4">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 mb-4">
            <img
              src="/file.svg"
              alt="File"
              className="w-8 h-8 opacity-80 text-primary"
            />
            <img
              src="/window.svg"
              alt="Window"
              className="w-8 h-8 opacity-80 text-primary"
            />
            <Brain className="w-8 h-8 opacity-80 text-primary" />
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent mb-4">
            Organize Your Mind
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto mb-6">
            Capture, connect, and rediscover your notes and bookmarks. Minimal,
            fast, and beautiful. Your knowledge, your way.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-4">
            <Button
              size="lg"
              className="px-8 py-4 text-lg font-semibold shadow-xl bg-gradient-to-r from-primary to-secondary text-white border-0"
              onClick={() => setShowRegister(true)}
            >
              Get Started
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="px-8 py-4 text-lg font-semibold border-primary text-primary bg-transparent hover:bg-primary/10"
              onClick={() =>
                user ? router.push("/notes") : setShowLogin(true)
              }
            >
              View Notes
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className="px-8 py-4 text-lg font-semibold bg-card-glass text-white border-0 md:hidden"
              onClick={() => setShowFeatures(true)}
            >
              Show Features
            </Button>
          </div>
        </div>
        {/* Features Grid (desktop only) */}
        <div
          className="hidden md:grid grid-cols-1 md:grid-cols-2 gap-8 mt-8 max-w-3xl w-full overflow-y-auto pb-8"
          style={{ maxHeight: "60vh" }}
        >
          <div className="flex items-center gap-4 p-6 rounded-xl bg-card-glass backdrop-blur-2xl shadow-lg border border-border">
            <StickyNote className="w-8 h-8 text-primary" />
            <div>
              <h3 className="font-bold text-lg text-white">
                Rich Markdown Notes
              </h3>
              <p className="text-muted-foreground text-sm">
                Write, edit, and organize notes with markdown, code, and files.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-6 rounded-xl bg-card-glass backdrop-blur-2xl shadow-lg border border-border">
            <Bookmark className="w-8 h-8 text-primary" />
            <div>
              <h3 className="font-bold text-lg text-white">Smart Bookmarks</h3>
              <p className="text-muted-foreground text-sm">
                Save, tag, and search your favorite links and resources.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-6 rounded-xl bg-card-glass backdrop-blur-2xl shadow-lg border border-border">
            <Search className="w-8 h-8 text-primary" />
            <div>
              <h3 className="font-bold text-lg text-white">Lightning Search</h3>
              <p className="text-muted-foreground text-sm">
                Find anything instantly with full-text and tag search.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-6 rounded-xl bg-card-glass backdrop-blur-2xl shadow-lg border border-border">
            <Book className="w-8 h-8 text-primary" />
            <div>
              <h3 className="font-bold text-lg text-white">
                Your Data, Your Way
              </h3>
              <p className="text-muted-foreground text-sm">
                Private, secure, and always accessible. You own your notes.
              </p>
            </div>
          </div>
        </div>
        {/* Features Modal */}
        <AnimatePresence>
          {showFeatures && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
              onClick={() => setShowFeatures(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeInOut" }}
            >
              <motion.div
                className="bg-card-glass/90 rounded-2xl shadow-2xl w-full max-w-md md:p-10 p-4 flex flex-col gap-6 relative max-w-sm mx-2 border border-border backdrop-blur-2xl"
                style={{ boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)" }}
                onClick={(e) => e.stopPropagation()}
                initial={{ y: 64, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 64, opacity: 0 }}
                transition={{ duration: 0.22, ease: "easeInOut" }}
              >
                <h2 className="text-2xl font-bold mb-2 text-center text-white">
                  Features
                </h2>
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-card-glass backdrop-blur-2xl shadow-lg border border-border">
                    <StickyNote className="w-8 h-8 text-primary" />
                    <div>
                      <h3 className="font-bold text-lg text-white">
                        Rich Markdown Notes
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        Write, edit, and organize notes with markdown, code, and
                        files.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-card-glass backdrop-blur-2xl shadow-lg border border-border">
                    <Bookmark className="w-8 h-8 text-primary" />
                    <div>
                      <h3 className="font-bold text-lg text-white">
                        Smart Bookmarks
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        Save, tag, and search your favorite links and resources.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-card-glass backdrop-blur-2xl shadow-lg border border-border">
                    <Search className="w-8 h-8 text-primary" />
                    <div>
                      <h3 className="font-bold text-lg text-white">
                        Lightning Search
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        Find anything instantly with full-text and tag search.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-card-glass backdrop-blur-2xl shadow-lg border border-border">
                    <Book className="w-8 h-8 text-primary" />
                    <div>
                      <h3 className="font-bold text-lg text-white">
                        Your Data, Your Way
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        Private, secure, and always accessible. You own your
                        notes.
                      </p>
                    </div>
                  </div>
                </div>
                <Button
                  size="lg"
                  className="mt-4 bg-gradient-to-r from-primary to-secondary text-white border-0"
                  onClick={() => setShowFeatures(false)}
                >
                  Close
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Login Modal */}
        <AnimatePresence>
          {showLogin && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
              onClick={() => setShowLogin(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeInOut" }}
            >
              <motion.div
                className="bg-card-glass/90 rounded-2xl shadow-2xl w-full max-w-md md:p-10 p-4 flex flex-col gap-6 relative max-w-sm mx-2 border border-border backdrop-blur-2xl"
                style={{ boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)" }}
                onClick={(e) => e.stopPropagation()}
                initial={{ y: 64, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 64, opacity: 0 }}
                transition={{ duration: 0.22, ease: "easeInOut" }}
              >
                <button
                  className="absolute right-4 top-4 text-muted-foreground hover:text-foreground bg-black/30 rounded-full p-2 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                  style={{ boxShadow: "0 2px 8px 0 rgba(0,0,0,0.12)" }}
                  onClick={() => setShowLogin(false)}
                  aria-label="Close login modal"
                >
                  <X className="w-7 h-7" />
                </button>
                <h2 className="text-2xl font-bold text-center text-white mb-2">
                  Login
                </h2>
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
                    <Form {...loginForm}>
                      <form
                        onSubmit={loginForm.handleSubmit(onPasswordLogin)}
                        className="space-y-6"
                      >
                        <FormField
                          control={loginForm.control}
                          name="email"
                          rules={{ required: "Email is required" }}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input
                                  type="email"
                                  autoComplete="email"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={loginForm.control}
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
                                      showPassword
                                        ? "Hide password"
                                        : "Show password"
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
                        <Button
                          type="submit"
                          className="w-full"
                          disabled={loadingLogin}
                        >
                          {loadingLogin ? "Logging in..." : "Login"}
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
                                <Input
                                  type="email"
                                  autoComplete="email"
                                  {...field}
                                />
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
                                message:
                                  "OTP must be 6 alphanumeric characters",
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
                                        value={field.value?.[i] || ""}
                                        onChange={(e) => {
                                          const val = e.target.value
                                            .replace(/[^A-Za-z0-9]/g, "")
                                            .slice(0, 1);
                                          const arr = (field.value || "").split(
                                            ""
                                          );
                                          arr[i] = val;
                                          const newVal = arr
                                            .join("")
                                            .slice(0, 6);
                                          field.onChange(newVal);
                                        }}
                                      />
                                    ))}
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                        <Button
                          type="submit"
                          className="w-full"
                          disabled={loadingLogin}
                        >
                          {loadingLogin
                            ? otpSent
                              ? "Logging in..."
                              : "Sending OTP..."
                            : otpSent
                            ? "Login"
                            : "Send OTP"}
                        </Button>
                      </form>
                    </Form>
                  </TabsContent>
                </Tabs>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Register Modal */}
        <AnimatePresence>
          {showRegister && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
              onClick={() => setShowRegister(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeInOut" }}
            >
              <motion.div
                className="bg-card-glass/90 rounded-2xl shadow-2xl w-full max-w-md md:p-10 p-4 flex flex-col gap-6 relative max-w-sm mx-2 border border-border backdrop-blur-2xl"
                style={{ boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)" }}
                onClick={(e) => e.stopPropagation()}
                initial={{ y: 64, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 64, opacity: 0 }}
                transition={{ duration: 0.22, ease: "easeInOut" }}
              >
                <button
                  className="absolute right-4 top-4 text-muted-foreground hover:text-foreground bg-black/30 rounded-full p-2 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                  style={{ boxShadow: "0 2px 8px 0 rgba(0,0,0,0.12)" }}
                  onClick={() => setShowRegister(false)}
                  aria-label="Close register modal"
                >
                  <X className="w-7 h-7" />
                </button>
                <h2 className="text-2xl font-bold text-center text-white mb-2">
                  Register
                </h2>
                <Form {...registerForm}>
                  <form
                    onSubmit={registerForm.handleSubmit(onRegister)}
                    className="space-y-6"
                  >
                    <FormField
                      control={registerForm.control}
                      name="email"
                      rules={{ required: "Email is required" }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              autoComplete="email"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      rules={{ required: "Password is required" }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              autoComplete="new-password"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="confirmPassword"
                      rules={{ required: "Please confirm your password" }}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              autoComplete="new-password"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loadingRegister}
                    >
                      {loadingRegister ? "Registering..." : "Register"}
                    </Button>
                  </form>
                </Form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// AnimatedBlob is a React component for animating SVG blobs
function AnimatedBlob({
  id,
  cx,
  cy,
  r,
  fill,
}: {
  id: string;
  cx: number;
  cy: number;
  r: number;
  fill: string;
}) {
  // Animate the blob using a simple sine wave for organic movement
  const [t, setT] = useState(0);
  useEffect(() => {
    let frame: number;
    const animate = () => {
      setT(performance.now() / 1000);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);
  // Generate a blob path with some animated control points
  const points = 8;
  const step = (2 * Math.PI) / points;
  const path = Array.from({ length: points }, (_, i) => {
    const angle = i * step;
    const rad =
      r *
      (0.92 + 0.08 * Math.sin(t * 0.7 + i * 1.3 + (id === "blob2" ? 1 : 0)));
    return [cx + rad * Math.cos(angle), cy + rad * Math.sin(angle)];
  });
  // Create a smooth path string
  const d =
    path
      .map((p, i) =>
        i === 0 ? `M${p[0]},${p[1]}` : `Q${cx},${cy} ${p[0]},${p[1]}`
      )
      .join(" ") + " Z";
  return <path d={d} fill={fill} style={{ transition: "d 0.2s" }} />;
}
