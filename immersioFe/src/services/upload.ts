import { authService, API_BASE } from "./auth";

const UPLOAD_URL = `${API_BASE}/api/upload/image`;

/**
 * Uploads an image to the backend (which stores it on Cloudinary) and returns
 * the secure URL. Requires an authenticated session.
 */
export async function uploadImage(file: File, folder?: string): Promise<string> {
  const token = authService.getAccessToken();
  if (!token) throw new Error("You must be signed in to upload images.");

  const form = new FormData();
  form.append("File", file);
  if (folder) form.append("Folder", folder);

  const response = await fetch(UPLOAD_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }, // do NOT set Content-Type; browser sets multipart boundary
    body: form,
  });

  const body = await response.json().catch(() => null);
  if (!response.ok || !body?.success) {
    throw new Error(body?.message || body?.detail || "Image upload failed.");
  }
  return body.data.url as string;
}
