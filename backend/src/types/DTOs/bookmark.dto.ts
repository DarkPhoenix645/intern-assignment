export interface BookmarkCreateDTO {
  url: string;
  title?: string;
  description?: string;
  tags?: string[];
  favorite?: boolean;
}

export interface BookmarkUpdateDTO {
  bookmarkId: string;
  url?: string;
  title?: string;
  description?: string;
  tags?: string[];
  favorite?: boolean;
}

export interface BookmarkDeleteDTO {
  bookmarkId: string;
}
