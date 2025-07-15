"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";

export default function BookmarkDetailPage() {
  const { id } = useParams();
  const [bookmark, setBookmark] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchBookmark() {
      setLoading(true);
      try {
        const res = await apiFetch(`/api/bookmarks/${id}`);
        if (!res.ok) throw new Error("Failed to fetch bookmark");
        setBookmark(await res.json());
      } catch (e: any) {
        toast.error(e.message);
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchBookmark();
  }, [id]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  if (!bookmark)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Bookmark not found.
      </div>
    );

  return (
    <div className="min-h-screen bg-background text-foreground p-4 flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>{bookmark.title || bookmark.url}</CardTitle>
            <div className="flex flex-wrap gap-2 mt-2">
              {bookmark.tags?.map((tag: string) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded bg-muted text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground mb-2">
              <a
                href={bookmark.url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                {bookmark.url}
              </a>
            </div>
            {bookmark.description && (
              <div className="text-sm mb-2">{bookmark.description}</div>
            )}
            {bookmark.meta?.title && (
              <div className="text-xs text-muted-foreground">
                Meta: {bookmark.meta.title}
              </div>
            )}
            <div className="mt-6">
              <Button asChild variant="outline">
                <Link href="/bookmarks">Back to Bookmarks</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
