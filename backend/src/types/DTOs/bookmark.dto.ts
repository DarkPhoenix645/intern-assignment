export interface BookmarkCreateDTO {
  url: string;
  title?: string;
  description?: string;
  tags?: string[];
  favorite?: boolean;
}

export interface BookmarkUpdateDTO {
  url?: string;
  title?: string;
  description?: string;
  tags?: string[];
  favorite?: boolean;
}
