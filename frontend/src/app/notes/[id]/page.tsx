"use client";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
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
import { Trash2, Star, StarOff } from "lucide-react";

export default function NoteDetailPage() {
  const { id } = useParams();
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
        const res = await apiFetch(`/api/notes/${id}`);
        if (!res.ok) throw new Error("Failed to fetch note");
        const data = await res.json();
        setNote(data);
        editForm.reset({
          title: data.title,
          content: data.content,
          tags: data.tags?.join(",") || "",
          favorite: !!data.favorite,
        });
      } catch (e: any) {
        toast.error(e.message);
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchNote();
  }, [id]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  if (!note)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Note not found.
      </div>
    );

  async function onSave(data: any) {
    setSaving(true);
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
      const res = await apiFetch(`/api/notes/${id}`, {
        method: "PUT",
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to update note");
      toast.success("Note updated");
      setEditMode(false);
      // Refetch note
      const updated = await res.json();
      setNote(updated);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function onDeleteFile(fileId: string) {
    setDeletingFile(fileId);
    try {
      const res = await apiFetch(`/api/notes/${id}/file`, {
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
      const res = await apiFetch(`/api/notes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ favorite: !note.favorite }),
      });
      if (!res.ok) throw new Error("Failed to update favorite");
      setNote((prev: any) => ({ ...prev, favorite: !prev.favorite }));
      toast.success("Favorite updated");
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <Card>
          <CardHeader className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <CardTitle>{editMode ? "Edit Note" : note.title}</CardTitle>
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
              {!editMode && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditMode(true)}
                >
                  Edit
                </Button>
              )}
              {editMode && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditMode(false)}
                >
                  Cancel
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {(editMode ? editForm.watch("tags")?.split(",") : note.tags)?.map(
                (tag: string) =>
                  tag && (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded bg-muted text-xs"
                    >
                      {tag}
                    </span>
                  )
              )}
            </div>
          </CardHeader>
          <CardContent>
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
                      <input
                        type="checkbox"
                        {...editForm.register("favorite")}
                      />{" "}
                      Favorite
                    </label>
                  </FormItem>
                  <div className="flex gap-2 mt-4">
                    <Button type="submit" disabled={saving}>
                      {saving ? "Saving..." : "Save"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setEditMode(false)}
                    >
                      Cancel
                    </Button>
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
            <div className="mt-6">
              <Button asChild variant="outline">
                <Link href="/notes">Back to Notes</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
