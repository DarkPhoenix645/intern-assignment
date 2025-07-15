"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ServerCrash } from "lucide-react";

export default function Error({ reset }: { reset: () => void }) {
  const [backendDown, setBackendDown] = useState(false);

  useEffect(() => {
    // Health check to backend /api endpoint
    fetch("/api", { method: "GET" })
      .then((res) => {
        if (!res.ok) {
          setBackendDown(true);
        } else {
          setBackendDown(false);
        }
      })
      .catch(() => setBackendDown(true));
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground px-4">
      <ServerCrash className="w-16 h-16 text-primary mb-4" />
      <h1 className="text-6xl font-extrabold mb-2">500</h1>
      <p className="text-lg text-muted-foreground mb-6 text-center max-w-md">
        {backendDown
          ? "The backend server is unreachable. Please try again later or check your connection."
          : "Something went wrong. Please try again or contact support if the problem persists."}
      </p>
      <Button
        size="lg"
        className="px-8 py-4 text-lg font-semibold"
        onClick={() => reset()}
      >
        Retry
      </Button>
    </div>
  );
}
