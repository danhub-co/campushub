import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>('');
  const [doc, setDoc] = useState<any>(null);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setStatus('');
    if (!file) return setStatus('No file selected');

    try {
      setStatus('Requesting presigned URL...');
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      // Request presigned URL from API (cookie auth is used)
      const presignRes = await axios.post(
        `${apiBase}/api/documents/presign`,
        { filename: file.name, contentType: file.type || 'application/octet-stream' },
        { withCredentials: true }
      );

      const { uploadUrl, document } = presignRes.data;
      if (!uploadUrl) throw new Error('No upload URL returned');

      setStatus('Uploading to S3...');
      // Upload file with PUT to the presigned URL
      const putRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
        },
        body: file,
      });

      if (!putRes.ok) {
        throw new Error(`Upload failed with status ${putRes.status}`);
      }

      setStatus('Upload complete. Document record created.');
      setDoc(document);
    } catch (err: any) {
      setStatus(`Error: ${err?.message || 'unknown'}`);
      console.error(err);
    }
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>Upload document</h1>
      <p>
        Note: you must be signed in. Login at <Link href="/login">/login</Link> first (demo auth).
      </p>
      <form onSubmit={handleUpload}>
        <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <br />
        <button type="submit">Upload to S3</button>
      </form>

      <p>Status: {status}</p>

      {doc && (
        <div>
          <h3>Document record</h3>
          <pre>{JSON.stringify(doc, null, 2)}</pre>
          <DownloadSection document={doc} />
        </div>
      )}
    </main>
  );
}

function DownloadSection({ document }: { document: any }) {
  const [url, setUrl] = useState<string | null>(null);

  async function fetchUrl() {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await axios.get(`${apiBase}/api/documents/${document.id}/url`, { withCredentials: true });
      setUrl(res.data.url);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDelete() {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      await axios.delete(`${apiBase}/api/documents/${document.id}`, { withCredentials: true });
      setUrl(null);
      window.location.reload();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div>
      <button onClick={fetchUrl}>Get Download URL (signed)</button>
      {url && (
        <div>
          <p>
            <a href={url} target="_blank" rel="noreferrer">Download file</a>
          </p>
        </div>
      )}
      <button onClick={handleDelete} style={{ color: 'red' }}>
        Delete document
      </button>
    </div>
  );
}