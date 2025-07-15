"use client";
import { useEffect, useState, Suspense } from "react";
import { apiFetch } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { Trash2, Star, StarOff } from "lucide-react";
import { useAuth } from "../layout";
import { useRef } from "react";
import { useDebounce } from "use-debounce";

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

export default function NotesPage() {
  const { searchValue, searchTags } = useAuth();
  const [hasHydrated, setHasHydrated] = useState(false);
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function fetchNotes(q = searchValue, tags = searchTags) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.append("q", q);
      if (tags && tags.length > 0) params.append("tags", tags.join(","));
      const res = await apiFetch(`/api/notes?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch notes");
      const data = await res.json();
      setNotes(Array.isArray(data.result) ? data.result : []);
    } catch (e: any) {
      toast.error(e.message);
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setHasHydrated(true);
    fetchNotes();
  }, []);

  useEffect(() => {
    if (hasHydrated) fetchNotes(searchValue, searchTags);
    // eslint-disable-next-line
  }, [searchValue, searchTags]);

  if (!hasHydrated) return null;

  async function handleDelete(id: string) {
    try {
      const res = await apiFetch(`/api/notes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete note");
      setNotes((prev) => prev.filter((n) => n._id !== id));
      toast.success("Note deleted");
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  function handleFavorite(id: string) {
    setNotes((prev) =>
      prev.map((n) => (n._id === id ? { ...n, favorite: !n.favorite } : n))
    );
    // Optionally call backend to persist
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 flex flex-col items-center">
      <Suspense fallback={<SheenLoader />}>
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
          {loading && <SheenLoader />}
          {!loading && notes.length === 0 && (
            <div className="text-center col-span-full">No notes found.</div>
          )}
          {!loading &&
            notes.map((note) => (
              <Card
                key={note._id}
                className="relative group hover:ring-2 ring-primary transition-all flex flex-col"
              >
                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button
                    onClick={() => handleFavorite(note._id)}
                    className="p-1 rounded hover:bg-primary/20"
                    title={note.favorite ? "Unfavorite" : "Favorite"}
                  >
                    {note.favorite ? (
                      <Star className="w-5 h-5 text-yellow-400" />
                    ) : (
                      <StarOff className="w-5 h-5 text-muted-foreground" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(note._id)}
                    className="p-1 rounded hover:bg-destructive/20"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5 text-destructive" />
                  </button>
                </div>
                <Link href={`/notes/${note._id}`} className="flex-1 block">
                  <CardHeader>
                    <CardTitle>{note.title}</CardTitle>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {note.tags?.map((tag: string) => (
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
                    <div className="prose prose-invert max-w-none text-sm">
                      <ReactMarkdown>
                        {note.content?.slice(0, 200) +
                          (note.content?.length > 200 ? "..." : "")}
                      </ReactMarkdown>
                    </div>
                    {note.files && note.files.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {note.files.map((file: any) => (
                          <a
                            key={file.id || file.url}
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline text-xs text-primary"
                          >
                            {file.name || file.url}
                          </a>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Link>
              </Card>
            ))}
        </div>
      </Suspense>
    </div>
  );
}
