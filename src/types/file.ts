export interface FileItem {
  name: string;
  is_dir: boolean;
  size: number;
  modified_at: number | null;
}
