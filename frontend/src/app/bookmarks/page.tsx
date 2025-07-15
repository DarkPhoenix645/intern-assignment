"use client";
import { useEffect, useState, Suspense } from "react";
import { apiFetch } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";
import { Trash2, Star, StarOff, Plus } from "lucide-react";
import { useAuth } from "../layout";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";

function SheenLoader() {
  return (
    <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="h-28 rounded-xl bg-muted relative overflow-hidden animate-pulse"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-sheen" />
        </div>
      ))}
    </div>
  );
}

export default function BookmarksPage() {
  const { searchValue, searchTags } = useAuth();
  const [hasHydrated, setHasHydrated] = useState(false);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const createForm = useForm({
    defaultValues: {
      url: "",
      title: "",
      description: "",
      tags: "",
      favorite: false,
    },
  });

  async function fetchBookmarks(q = searchValue, tags = searchTags) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.append("q", q);
      if (tags && tags.length > 0) params.append("tags", tags.join(","));
      const res = await apiFetch(`/api/bookmarks?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch bookmarks");
      const data = await res.json();
      setBookmarks(Array.isArray(data.result) ? data.result : []);
    } catch (e: any) {
      toast.error(e.message);
      setBookmarks([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setHasHydrated(true);
    fetchBookmarks();
  }, []);

  useEffect(() => {
    if (hasHydrated) fetchBookmarks(searchValue, searchTags);
    // eslint-disable-next-line
  }, [searchValue, searchTags]);

  if (!hasHydrated) return null;

  async function handleDelete(id: string) {
    try {
      const res = await apiFetch(`/api/bookmarks/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete bookmark");
      setBookmarks((prev) => prev.filter((b) => b._id !== id));
      toast.success("Bookmark deleted");
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  function handleFavorite(id: string) {
    setBookmarks((prev) =>
      prev.map((b) => (b._id === id ? { ...b, favorite: !b.favorite } : b))
    );
    // Optionally call backend to persist
  }

  async function onCreateBookmark(data: any) {
    try {
      const res = await apiFetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: data.url,
          title: data.title,
          description: data.description,
          tags: data.tags,
          favorite: data.favorite,
        }),
      });
      if (!res.ok) throw new Error("Failed to create bookmark");
      toast.success("Bookmark created");
      setShowCreate(false);
      createForm.reset();
      fetchBookmarks();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 flex flex-col items-center">
      <Suspense fallback={<SheenLoader />}>
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
          {loading && <SheenLoader />}
          {!loading && bookmarks.length === 0 && (
            <div className="text-center col-span-full">No bookmarks found.</div>
          )}
          {!loading &&
            bookmarks.map((bm) => (
              <Card
                key={bm._id}
                className="relative group hover:ring-2 ring-primary transition-all flex flex-col"
              >
                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button
                    onClick={() => handleFavorite(bm._id)}
                    className="p-1 rounded border border-muted bg-background/80 hover:bg-primary/20 transition-colors"
                    title={bm.favorite ? "Unfavorite" : "Favorite"}
                  >
                    {bm.favorite ? (
                      <Star className="w-5 h-5 text-yellow-400" />
                    ) : (
                      <StarOff className="w-5 h-5 text-muted-foreground" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(bm._id)}
                    className="p-1 rounded border border-muted bg-background/80 hover:bg-destructive/20 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5 text-destructive" />
                  </button>
                </div>
                <Link href={`/bookmarks/${bm._id}`} className="flex-1 block">
                  <CardHeader>
                    <CardTitle>{bm.title || bm.url}</CardTitle>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {bm.tags?.map((tag: string) => (
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
                        href={bm.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                      >
                        {bm.url}
                      </a>
                    </div>
                    {bm.description && (
                      <div className="text-sm mb-2">{bm.description}</div>
                    )}
                    {bm.meta?.title && (
                      <div className="text-xs text-muted-foreground">
                        Meta: {bm.meta.title}
                      </div>
                    )}
                  </CardContent>
                </Link>
              </Card>
            ))}
        </div>
      </Suspense>
      {/* Create Bookmark Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-background rounded-xl shadow-xl w-full max-w-lg p-6 flex flex-col gap-4 relative">
            <button
              className="absolute top-2 right-2 text-2xl"
              onClick={() => setShowCreate(false)}
            >
              &times;
            </button>
            <h2 className="text-xl font-bold mb-2">Create Bookmark</h2>
            <Form {...createForm}>
              <form
                onSubmit={createForm.handleSubmit(onCreateBookmark)}
                className="flex flex-col gap-4"
              >
                <FormField
                  name="url"
                  control={createForm.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="https://..."
                          required
                          type="url"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="title"
                  control={createForm.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title (optional)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="description"
                  control={createForm.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (optional)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="tags"
                  control={createForm.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags (comma separated)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="tag1,tag2" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormItem>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      {...createForm.register("favorite")}
                    />{" "}
                    Favorite
                  </label>
                </FormItem>
                <button
                  type="submit"
                  className="bg-primary text-primary-foreground rounded px-4 py-2 font-medium hover:bg-primary/90"
                >
                  Create
                </button>
              </form>
            </Form>
          </div>
        </div>
      )}
      {/* Floating Plus Button */}
      <button
        className="fixed bottom-8 right-8 z-50 bg-primary text-primary-foreground rounded-full shadow-lg p-4 hover:bg-primary/90 transition-all flex items-center justify-center"
        title="Create New Bookmark"
        onClick={() => setShowCreate(true)}
      >
        <Plus className="w-7 h-7" />
      </button>
    </div>
  );
}
