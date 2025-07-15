"use client";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { createContext, useContext, useEffect, useState, useRef } from "react";
import { motion } from "@motionone/react";
import Link from "next/link";
import { Book, Bookmark, Search, LogOut, StickyNote, Menu } from "lucide-react";
import NotesPage from "./notes/page";
import BookmarksPage from "./bookmarks/page";
import { apiFetch } from "@/lib/api";
import { useRouter, usePathname } from "next/navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

type AuthContextType = {
  user: any;
  setUser: (u: any) => void;
  loading: boolean;
  selectedTab: string;
  setSelectedTab: (tab: string) => void;
  searchValue: string;
  setSearchValue: (v: string) => void;
  searchTags: string[];
  setSearchTags: (tags: string[]) => void;
};
const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  loading: false,
  selectedTab: "notes",
  setSelectedTab: () => {},
  searchValue: "",
  setSearchValue: () => {},
  searchTags: [],
  setSearchTags: () => {},
});
export function useAuth() {
  return useContext(AuthContext);
}

const TABS = [
  {
    key: "notes",
    label: "Notes",
    icon: <StickyNote className="w-5 h-5 mr-2" />,
  },
  {
    key: "bookmarks",
    label: "Bookmarks",
    icon: <Bookmark className="w-5 h-5 mr-2" />,
  },
];

type SearchModalProps = {
  open: boolean;
  onClose: () => void;
  onSearch: () => void;
  value: string;
  setValue: (v: string) => void;
  tags: string[];
  setTags: (tags: string[]) => void;
  selectedTab: string;
};

function SearchModal({
  open,
  onClose,
  onSearch,
  value,
  setValue,
  tags,
  setTags,
  selectedTab,
}: SearchModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [tagInput, setTagInput] = useState("");
  const [autocomplete, setAutocomplete] = useState<any[]>([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState(value);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
    if (!open) {
      setAutocomplete([]);
      setShowAutocomplete(false);
      setTagInput("");
    }
  }, [open]);

  // Debounce search value for autocomplete
  useEffect(() => {
    if (!open || selectedTab !== "notes") return;
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      setDebouncedSearch(value);
    }, 300);
    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, [value, open, selectedTab]);

  // Fetch autocomplete for notes
  useEffect(() => {
    async function fetchAutocomplete(q: string, tags: string[]) {
      if (!q || selectedTab !== "notes" || !open) {
        setAutocomplete([]);
        setShowAutocomplete(false);
        return;
      }
      try {
        const params = new URLSearchParams();
        params.append("q", q);
        if (tags && tags.length > 0) params.append("tags", tags.join(","));
        const res = await fetch(
          `/api/notes-autocomplete?${params.toString()}`,
          { credentials: "include" }
        );
        if (!res.ok) return setAutocomplete([]);
        setAutocomplete(await res.json());
        setShowAutocomplete(true);
      } catch {
        setAutocomplete([]);
        setShowAutocomplete(false);
      }
    }
    if (open && selectedTab === "notes") {
      fetchAutocomplete(debouncedSearch, tags);
    }
  }, [debouncedSearch, tags, open, selectedTab]);

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput("");
    } else if (e.key === "Backspace" && !tagInput && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
  }
  function removeTag(idx: number) {
    setTags(tags.filter((_, i) => i !== idx));
  }
  function handleAutocompleteSelect(title: string) {
    setValue(title);
    setShowAutocomplete(false);
    setAutocomplete([]);
    onSearch();
    onClose();
  }
  return (
    open && (
      <div
        className="fixed inset-0 z-50 flex items-start justify-center bg-black/40"
        onClick={onClose}
      >
        <div
          className="bg-background rounded-xl shadow-xl mt-32 w-full max-w-lg p-6 flex flex-col gap-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative w-full mb-2">
            <input
              ref={inputRef}
              className="w-full pl-10 pr-4 py-2 rounded border border-border bg-muted text-base outline-none"
              placeholder="Search notes or bookmarks..."
              value={value}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setValue(e.target.value)
              }
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === "Enter") {
                  onSearch();
                  onClose();
                }
                if (e.key === "Escape") {
                  onClose();
                }
              }}
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
          </div>
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map((tag, idx) => (
              <span
                key={tag}
                className="flex items-center bg-muted px-2 py-0.5 rounded text-xs"
              >
                {tag}
                <button
                  className="ml-1 text-muted-foreground hover:text-destructive"
                  onClick={() => removeTag(idx)}
                  tabIndex={-1}
                  aria-label={`Remove tag ${tag}`}
                >
                  ×
                </button>
              </span>
            ))}
            <input
              className="min-w-[80px] flex-1 bg-transparent outline-none text-xs"
              placeholder="Add tag"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
            />
          </div>
          {/* Autocomplete suggestions for notes, inside modal */}
          {showAutocomplete && autocomplete.length > 0 && (
            <div className="w-full bg-background border border-border rounded shadow-lg mb-2">
              {autocomplete.map((item: any) => (
                <div
                  key={item._id}
                  className="px-4 py-2 hover:bg-muted cursor-pointer text-sm"
                  onClick={() => handleAutocompleteSelect(item.title)}
                >
                  {item.title}
                </div>
              ))}
            </div>
          )}
          <div className="text-xs text-muted-foreground">
            Press Enter to search, Esc to close. Enter/comma to add tag.
          </div>
        </div>
      </div>
    )
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Define public routes at the top so it's available everywhere
  const publicRoutes = ["/", "/login", "/register"];
  const [user, setUser] = useState<any>({ name: "Demo User" }); // For demo, assume logged in
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState("notes");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [searchTags, setSearchTags] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // On mount, check if user is authenticated
    async function checkAuth() {
      try {
        const res = await apiFetch("/api/auth/me");
        if (res.ok) {
          const user = await res.json();
          setUser(user);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      }
    }
    checkAuth();
  }, []);

  useEffect(() => {
    // If not authenticated and on a protected route, redirect to landing page
    if (user === null && !publicRoutes.includes(pathname)) {
      router.replace("/");
    }
  }, [user, pathname, router]);

  // Keyboard shortcut for search (Ctrl+K)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Top right auth buttons
  function AuthButtons() {
    if (user) {
      return (
        <button
          className="flex items-center gap-2 px-4 py-2 rounded bg-destructive text-destructive-foreground font-medium transition-transform hover:scale-105 active:scale-95"
          onClick={async () => {
            await apiFetch("/api/auth/logout", { method: "POST" });
            setUser(null);
            setSelectedTab("notes");
          }}
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      );
    }
    return null;
  }

  // Sidebar tabs
  function SidebarTabs({ onClick }: { onClick?: () => void }) {
    return (
      <nav className="flex flex-col gap-2 w-full">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setSelectedTab(tab.key);
              if (onClick) onClick();
            }}
            className={`relative flex items-center px-4 py-2 rounded-lg font-medium transition-colors w-full text-base gap-2 ${
              selectedTab === tab.key
                ? "bg-primary/90 text-primary-foreground shadow-md"
                : "hover:bg-muted text-muted-foreground"
            } transition-transform hover:scale-105 active:scale-95`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {selectedTab === tab.key && (
              <span
                className="absolute left-2 right-2 bottom-1 h-1 rounded bg-primary transition-all"
                style={{ transition: "all 0.3s cubic-bezier(.4,2,.6,1)" }}
              />
            )}
          </button>
        ))}
      </nav>
    );
  }

  // Search bar in top bar (for logged in users)
  function TopBarSearch() {
    if (!user) return null;
    return (
      <button
        className="flex items-center gap-2 px-4 py-2 rounded border border-border bg-muted text-muted-foreground hover:bg-accent transition-colors"
        onClick={() => setSearchOpen(true)}
        tabIndex={0}
        aria-label="Open search (Ctrl+K)"
      >
        <Search className="w-5 h-5" />
        <span className="hidden sm:inline">Search (Ctrl+K)</span>
      </button>
    );
  }

  // Handle search action (can be customized to trigger search in notes/bookmarks)
  function handleSearch() {
    // You can route or filter notes/bookmarks here
    setSearchOpen(false);
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>NotesApp</title>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <AuthContext.Provider
          value={{
            user,
            setUser,
            loading,
            selectedTab,
            setSelectedTab,
            searchValue,
            setSearchValue,
            searchTags,
            setSearchTags,
          }}
        >
          <SearchModal
            open={searchOpen}
            onClose={() => setSearchOpen(false)}
            onSearch={() => setSearchOpen(false)}
            value={searchValue}
            setValue={setSearchValue}
            tags={searchTags}
            setTags={setSearchTags}
            selectedTab={selectedTab}
          />
          <div className="min-h-screen flex flex-col">
            {/* Top Bar */}
            <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b border-border bg-background/80 backdrop-blur z-10">
              <div className="flex items-center gap-2">
                {/* Hamburger for mobile, only when authenticated and not on public routes */}
                {user && !publicRoutes.includes(pathname) && (
                  <button
                    className="sm:hidden p-2 rounded hover:bg-muted"
                    onClick={() => setSidebarOpen(true)}
                  >
                    <Menu className="w-6 h-6" />
                  </button>
                )}
                {/* Show NotesApp in header after sidebar on desktop only when sidebar is present */}
                {user && !publicRoutes.includes(pathname) ? (
                  <span className="font-bold text-xl tracking-tight hidden sm:inline-block ml-4">
                    NotesApp
                  </span>
                ) : (
                  <Link href="/" className="font-bold text-xl tracking-tight">
                    NotesApp
                  </Link>
                )}
              </div>
              <div className="flex gap-2 items-center">
                <TopBarSearch />
                <AuthButtons />
              </div>
            </div>
            {/* Main Content with Sidebar */}
            <div className="flex flex-1 min-h-0">
              {/* Sidebar: desktop or mobile drawer, only when authenticated and not on public routes */}
              {user && !publicRoutes.includes(pathname) && (
                <>
                  {/* Desktop sidebar */}
                  <aside className="hidden sm:fixed sm:flex w-48 h-screen top-0 left-0 z-20 border-r border-border bg-background/90 flex-col items-start py-8 px-4 gap-2">
                    <SidebarTabs />
                  </aside>
                  {/* Mobile sidebar drawer */}
                  {sidebarOpen && (
                    <div className="fixed inset-0 z-40 flex">
                      <div
                        style={{
                          transform: sidebarOpen
                            ? "translateX(0)"
                            : "translateX(-100%)",
                          transition: "transform 0.3s",
                        }}
                        className="bg-background w-64 h-full shadow-xl flex flex-col p-6 gap-4"
                      >
                        <button
                          className="self-end mb-4"
                          onClick={() => setSidebarOpen(false)}
                        >
                          <span className="text-2xl">×</span>
                        </button>
                        <SidebarTabs onClick={() => setSidebarOpen(false)} />
                      </div>
                      <div
                        className="flex-1 bg-black/30"
                        onClick={() => setSidebarOpen(false)}
                      />
                    </div>
                  )}
                </>
              )}
              {/* Main Content Area */}
              <main
                className={`flex-1 flex flex-col min-h-0 ${
                  user && !publicRoutes.includes(pathname) ? "sm:ml-48" : ""
                }`}
              >
                {user && !publicRoutes.includes(pathname) ? (
                  selectedTab === "notes" ? (
                    <NotesPage />
                  ) : (
                    <BookmarksPage />
                  )
                ) : (
                  children
                )}
              </main>
            </div>
          </div>
          <Toaster />
        </AuthContext.Provider>
      </body>
    </html>
  );
}
