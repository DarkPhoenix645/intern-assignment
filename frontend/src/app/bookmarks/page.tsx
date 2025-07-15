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

function BookmarkDetailModal({
  bookmarkId,
  onClose,
  onBookmarkUpdated,
  onBookmarkDeleted,
}: {
  bookmarkId: string;
  onClose: () => void;
  onBookmarkUpdated: (b: any) => void;
  onBookmarkDeleted: (id: string) => void;
}) {
  const [bookmark, setBookmark] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const editForm = useForm({
    defaultValues: {
      url: "",
      title: "",
      description: "",
      tags: "",
      favorite: false,
    },
  });

  useEffect(() => {
    async function fetchBookmark() {
      setLoading(true);
      try {
        const res = await apiFetch(`/api/bookmarks/${bookmarkId}`);
        if (!res.ok) throw new Error("Failed to fetch bookmark");
        const data = await res.json();
        setBookmark(data.bookmark);
        editForm.reset({
          url: data.bookmark.url,
          title: data.bookmark.title,
          description: data.bookmark.description,
          tags: data.bookmark.tags?.join(",") || "",
          favorite: !!data.bookmark.favorite,
        });
      } catch (e: any) {
        toast.error(e.message);
      } finally {
        setLoading(false);
      }
    }
    if (bookmarkId) fetchBookmark();
    // eslint-disable-next-line
  }, [bookmarkId]);

  async function onSave(data: any) {
    try {
      const tagsArr =
        typeof data.tags === "string"
          ? data.tags
              .split(",")
              .map((t: string) => t.trim())
              .filter(Boolean)
          : Array.isArray(data.tags)
          ? data.tags
          : [];
      const res = await apiFetch(`/api/bookmarks/${bookmarkId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: data.url,
          title: data.title,
          description: data.description,
          tags: tagsArr,
          favorite: !!data.favorite,
        }),
      });
      if (!res.ok) throw new Error("Failed to update bookmark");
      toast.success("Bookmark updated");
      const updated = (await res.json()).bookmark;
      setBookmark(updated);
      setEditMode(false);
      onBookmarkUpdated(updated);
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function onDeleteBookmark() {
    try {
      const res = await apiFetch(`/api/bookmarks/${bookmarkId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete bookmark");
      toast.success("Bookmark deleted");
      onBookmarkDeleted(bookmarkId);
      onClose();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function onToggleFavorite() {
    try {
      const res = await apiFetch(`/api/bookmarks/${bookmarkId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ favorite: !bookmark.favorite }),
      });
      if (!res.ok) throw new Error("Failed to update favorite");
      setBookmark((prev: any) => ({ ...prev, favorite: !prev.favorite }));
      toast.success("Favorite updated");
      onBookmarkUpdated({ ...bookmark, favorite: !bookmark.favorite });
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  if (loading || !bookmark)
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="bg-background rounded-xl shadow-xl w-full max-w-lg p-6 flex flex-col gap-4 relative">
          Loading...
        </div>
      </div>
    );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-background rounded-xl shadow-xl w-full max-w-lg p-6 flex flex-col gap-4 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="absolute top-2 right-2 text-2xl" onClick={onClose}>
          &times;
        </button>
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-xl font-bold flex-1">
            {editMode ? "Edit Bookmark" : bookmark.title || bookmark.url}
          </h2>
          <button
            onClick={onToggleFavorite}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#232323] shadow-md border border-[#2a2a2a] hover:bg-[#333] transition-colors"
            title={bookmark.favorite ? "Unfavorite" : "Favorite"}
            style={{ color: "#fff" }}
          >
            {bookmark.favorite ? (
              <Star className="w-5 h-5" />
            ) : (
              <StarOff className="w-5 h-5" />
            )}
          </button>
          <button
            onClick={onDeleteBookmark}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#232323] shadow-md border border-[#2a2a2a] hover:bg-[#333] transition-colors"
            title="Delete"
            style={{ color: "#fff" }}
          >
            <Trash2 className="w-5 h-5" />
          </button>
          {!editMode && (
            <button
              className="rounded px-3 py-1 border border-muted hover:bg-muted ml-2"
              onClick={() => setEditMode(true)}
            >
              Edit
            </button>
          )}
          {editMode && (
            <button
              className="rounded px-3 py-1 border border-muted hover:bg-muted ml-2"
              onClick={() => setEditMode(false)}
            >
              Cancel
            </button>
          )}
        </div>
        {editMode ? (
          <Form {...editForm}>
            <form
              onSubmit={editForm.handleSubmit(onSave)}
              className="flex flex-col gap-4"
            >
              <FormField
                name="url"
                control={editForm.control}
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
                control={editForm.control}
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
                control={editForm.control}
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
                control={editForm.control}
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
                  <input type="checkbox" {...editForm.register("favorite")} />{" "}
                  Favorite
                </label>
              </FormItem>
              <button
                type="submit"
                className="bg-primary text-primary-foreground rounded px-4 py-2 font-medium hover:bg-primary/90"
              >
                Save
              </button>
            </form>
          </Form>
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  );
}

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
  const [openBookmarkId, setOpenBookmarkId] = useState<string | null>(null);

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
      // Ensure tags is always an array of non-empty strings
      const tagsArr =
        typeof data.tags === "string"
          ? data.tags
              .split(",")
              .map((t: string) => t.trim())
              .filter(Boolean)
          : Array.isArray(data.tags)
          ? data.tags
          : [];
      const res = await apiFetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: data.url,
          title: data.title,
          description: data.description,
          tags: tagsArr,
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
                className="relative group hover:ring-2 ring-primary transition-all flex flex-col cursor-pointer"
                onClick={() => setOpenBookmarkId(bm._id)}
                tabIndex={0}
              >
                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFavorite(bm._id);
                    }}
                    className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#232323] shadow-md border border-[#2a2a2a] hover:bg-[#333] transition-colors"
                    title={bm.favorite ? "Unfavorite" : "Favorite"}
                    style={{ color: "#fff" }}
                  >
                    {bm.favorite ? (
                      <Star className="w-5 h-5" />
                    ) : (
                      <StarOff className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(bm._id);
                    }}
                    className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#232323] shadow-md border border-[#2a2a2a] hover:bg-[#333] transition-colors"
                    title="Delete"
                    style={{ color: "#fff" }}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex-1 block">
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
                </div>
              </Card>
            ))}
        </div>
      </Suspense>
      {/* Bookmark Detail Modal */}
      {openBookmarkId && (
        <BookmarkDetailModal
          bookmarkId={openBookmarkId}
          onClose={() => setOpenBookmarkId(null)}
          onBookmarkUpdated={(updated) =>
            setBookmarks((prev) =>
              prev.map((b) => (b._id === updated._id ? updated : b))
            )
          }
          onBookmarkDeleted={(id) =>
            setBookmarks((prev) => prev.filter((b) => b._id !== id))
          }
        />
      )}
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
