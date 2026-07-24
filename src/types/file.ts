export interface FileItem {
  name: string;
  is_dir: boolean;
  size: number;
  modified_at: number | null;
}

export interface FileInfo {
  name: string;
  path: string;
  relative_path: string;
  is_dir: boolean;
  size: number;
  modified_at: number;
  score: number;
}
