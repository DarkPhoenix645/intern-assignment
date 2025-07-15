"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

export default function NoteDetailPage() {
  const { id } = useParams();
  const [note, setNote] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchNote() {
      setLoading(true);
      try {
        const res = await apiFetch(`/api/notes/${id}`);
        if (!res.ok) throw new Error("Failed to fetch note");
        setNote(await res.json());
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

  return (
    <div className="min-h-screen bg-background text-foreground p-4 flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <Card>
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
