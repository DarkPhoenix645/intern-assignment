"use client";
import { useEffect, useState, Suspense } from "react";
import { apiFetch } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { Trash2, Star, StarOff, Plus } from "lucide-react";
import { useAuth } from "../layout";
import { useRef } from "react";
import { useDebounce } from "use-debounce";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";

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

function NoteDetailModal({
  noteId,
  onClose,
  onNoteUpdated,
  onNoteDeleted,
}: {
  noteId: string;
  onClose: () => void;
  onNoteUpdated: (note: any) => void;
  onNoteDeleted: (id: string) => void;
}) {
  const [note, setNote] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingFile, setDeletingFile] = useState<string | null>(null);
  const editForm = useForm({
    defaultValues: {
      title: "",
      content: "",
      tags: "",
      favorite: false,
      files: [],
    },
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchNote() {
      setLoading(true);
      try {
        const res = await apiFetch(`/api/notes/${noteId}`);
        if (!res.ok) throw new Error("Failed to fetch note");
        const data = await res.json();
        setNote(data.note);
        editForm.reset({
          title: data.note.title,
          content: data.note.content,
          tags: data.note.tags?.join(",") || "",
          favorite: !!data.note.favorite,
        });
      } catch (e: any) {
        toast.error(e.message);
      } finally {
        setLoading(false);
      }
    }
    if (noteId) fetchNote();
    // eslint-disable-next-line
  }, [noteId]);

  async function onSave(data: any) {
    setSaving(true);
    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("content", data.content);
    // Convert tags to array and favorite to boolean string
    const tagsArr =
      typeof data.tags === "string"
        ? data.tags
            .split(",")
            .map((t: string) => t.trim())
            .filter(Boolean)
        : Array.isArray(data.tags)
        ? data.tags
        : [];
    tagsArr.forEach((tag: string) => formData.append("tags", tag));
    formData.append("favorite", data.favorite ? "true" : "false");
    if (fileInputRef.current && fileInputRef.current.files) {
      Array.from(fileInputRef.current.files).forEach((file) => {
        formData.append("files", file);
      });
    }
    try {
      const res = await apiFetch(`/api/notes/${noteId}`, {
        method: "PUT",
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to update note");
      toast.success("Note updated");
      setEditMode(false);
      const updated = await res.json();
      setNote(updated);
      onNoteUpdated(updated);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function onDeleteFile(fileId: string) {
    setDeletingFile(fileId);
    try {
      const res = await apiFetch(`/api/notes/${noteId}/file`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId }),
      });
      if (!res.ok) throw new Error("Failed to delete file");
      toast.success("File deleted");
      setNote((prev: any) => ({
        ...prev,
        files: prev.files.filter((f: any) => f.id !== fileId),
      }));
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setDeletingFile(null);
    }
  }

  async function onToggleFavorite() {
    try {
      const res = await apiFetch(`/api/notes/${noteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ favorite: !note.favorite }),
      });
      if (!res.ok) throw new Error("Failed to update favorite");
      setNote((prev: any) => ({ ...prev, favorite: !prev.favorite }));
      toast.success("Favorite updated");
      onNoteUpdated({ ...note, favorite: !note.favorite });
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function onDeleteNote() {
    try {
      const res = await apiFetch(`/api/notes/${noteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete note");
      toast.success("Note deleted");
      onNoteDeleted(noteId);
      onClose();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  if (loading || !note)
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
            {editMode ? "Edit Note" : note.title}
          </h2>
          <button
            onClick={onToggleFavorite}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#232323] shadow-md border border-[#2a2a2a] hover:bg-[#333] transition-colors"
            title={note.favorite ? "Unfavorite" : "Favorite"}
            style={{ color: "#fff" }}
          >
            {note.favorite ? (
              <Star className="w-5 h-5" />
            ) : (
              <StarOff className="w-5 h-5" />
            )}
          </button>
          <button
            onClick={onDeleteNote}
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
                name="title"
                control={editForm.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Title" required />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="content"
                control={editForm.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <textarea
                        {...field}
                        placeholder="Content (Markdown supported)"
                        rows={6}
                        className="w-full rounded border bg-muted p-2"
                        required
                      />
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
                <FormLabel>Files</FormLabel>
                <FormControl>
                  <Input type="file" multiple ref={fileInputRef} />
                </FormControl>
                <FormDescription>
                  Images, audio, or PDF. Max 10 files.
                </FormDescription>
              </FormItem>
              {note.files && note.files.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {note.files.map((file: any) => (
                    <div
                      key={file.id || file.url}
                      className="flex items-center gap-1 bg-muted rounded px-2 py-1"
                    >
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline text-xs text-primary"
                      >
                        {file.name || file.url}
                      </a>
                      <button
                        type="button"
                        className="ml-1 text-destructive hover:text-destructive/80"
                        disabled={deletingFile === file.id}
                        onClick={() => onDeleteFile(file.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <FormItem>
                <label className="flex items-center gap-2">
                  <input type="checkbox" {...editForm.register("favorite")} />{" "}
                  Favorite
                </label>
              </FormItem>
              <div className="flex gap-2 mt-4">
                <button
                  type="submit"
                  className="bg-primary text-primary-foreground rounded px-4 py-2 font-medium hover:bg-primary/90"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  className="rounded px-4 py-2 border border-muted hover:bg-muted"
                  onClick={() => setEditMode(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </Form>
        ) : (
          <>
            <div className="prose prose-invert max-w-none text-base mb-4">
              <ReactMarkdown>{note.content}</ReactMarkdown>
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
          </>
        )}
      </div>
    </div>
  );
}

export default function NotesPage() {
  const { searchValue, searchTags } = useAuth();
  const router = useRouter();
  const [hasHydrated, setHasHydrated] = useState(false);
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const createForm = useForm({
    defaultValues: {
      title: "",
      content: "",
      tags: "",
      favorite: false,
      files: [],
    },
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [openNoteId, setOpenNoteId] = useState<string | null>(null);

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

  async function handleFavorite(
    e: React.MouseEvent,
    id: string,
    current: boolean
  ) {
    e.stopPropagation();
    const note = notes.find((n) => n._id === id);
    // Optimistically update UI
    setNotes((prev) =>
      prev.map((n) => (n._id === id ? { ...n, favorite: !n.favorite } : n))
    );
    try {
      const res = await apiFetch(`/api/notes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: note.title,
          content: note.content,
          tags: note.tags || [],
          favorite: !current,
        }),
      });
      if (!res.ok) throw new Error("Failed to update favorite");
      toast.success("Favorite updated");
    } catch (e: any) {
      // Revert UI
      setNotes((prev) =>
        prev.map((n) => (n._id === id ? { ...n, favorite: current } : n))
      );
      toast.error("Failed to update favorite");
    }
  }

  async function onCreateNote(data: any) {
    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("content", data.content);
    formData.append("tags", data.tags);
    formData.append("favorite", data.favorite ? "true" : "false");
    if (fileInputRef.current && fileInputRef.current.files) {
      Array.from(fileInputRef.current.files).forEach((file) => {
        formData.append("files", file);
      });
    }
    try {
      const res = await apiFetch("/api/notes", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to create note");
      toast.success("Note created");
      setShowCreate(false);
      createForm.reset();
      fetchNotes();
    } catch (e: any) {
      toast.error(e.message);
    }
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
                className="relative group hover:ring-2 ring-primary transition-all flex flex-col cursor-pointer"
                onClick={() => setOpenNoteId(note._id)}
                tabIndex={0}
              >
                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFavorite(e, note._id, note.favorite);
                    }}
                    className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#232323] shadow-md border border-[#2a2a2a] hover:bg-[#333] transition-colors"
                    title={note.favorite ? "Unfavorite" : "Favorite"}
                    tabIndex={0}
                    style={{ color: "#fff" }}
                  >
                    {note.favorite ? (
                      <Star className="w-5 h-5" />
                    ) : (
                      <StarOff className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleDelete(note._id);
                    }}
                    className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#232323] shadow-md border border-[#2a2a2a] hover:bg-[#333] transition-colors"
                    title="Delete"
                    tabIndex={0}
                    style={{ color: "#fff" }}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
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
              </Card>
            ))}
        </div>
      </Suspense>
      {/* Note Detail Modal */}
      {openNoteId && (
        <NoteDetailModal
          noteId={openNoteId}
          onClose={() => setOpenNoteId(null)}
          onNoteUpdated={(updated) =>
            setNotes((prev) =>
              prev.map((n) => (n._id === updated._id ? updated : n))
            )
          }
          onNoteDeleted={(id) =>
            setNotes((prev) => prev.filter((n) => n._id !== id))
          }
        />
      )}
      {/* Create Note Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-background rounded-xl shadow-xl w-full max-w-lg p-6 flex flex-col gap-4 relative">
            <button
              className="absolute top-2 right-2 text-2xl"
              onClick={() => setShowCreate(false)}
            >
              &times;
            </button>
            <h2 className="text-xl font-bold mb-2">Create Note</h2>
            <Form {...createForm}>
              <form
                onSubmit={createForm.handleSubmit(onCreateNote)}
                className="flex flex-col gap-4"
              >
                <FormField
                  name="title"
                  control={createForm.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Title" required />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="content"
                  control={createForm.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content</FormLabel>
                      <FormControl>
                        <textarea
                          {...field}
                          placeholder="Content (Markdown supported)"
                          rows={4}
                          className="w-full rounded border bg-muted p-2"
                          required
                        />
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
                  <FormLabel>Files</FormLabel>
                  <FormControl>
                    <Input type="file" multiple ref={fileInputRef} />
                  </FormControl>
                  <FormDescription>
                    Images, audio, or PDF. Max 10 files.
                  </FormDescription>
                </FormItem>
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
        title="Create New Note"
        onClick={() => setShowCreate(true)}
      >
        <Plus className="w-7 h-7" />
      </button>
    </div>
  );
}
