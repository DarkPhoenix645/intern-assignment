"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground px-4">
      <AlertTriangle className="w-16 h-16 text-primary mb-4" />
      <h1 className="text-6xl font-extrabold mb-2">404</h1>
      <p className="text-lg text-muted-foreground mb-6 text-center max-w-md">
        Oops! The page you are looking for does not exist or has been moved.
      </p>
      <Button asChild size="lg" className="px-8 py-4 text-lg font-semibold">
        <Link href="/">Go Home</Link>
      </Button>
    </div>
  );
}
