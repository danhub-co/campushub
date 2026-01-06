import axios from 'axios';
import { useEffect, useState } from 'react';

export default function Home() {
  const [health, setHealth] = useState<any>(null);

  useEffect(() => {
    async function fetchHealth() {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        const res = await axios.get(`${apiBase}/api/health`);
        setHealth(res.data);
      } catch (err) {
        setHealth({ status: 'unreachable' });
      }
    }
    fetchHealth();
  }, []);

  return (
    <main style={{ fontFamily: 'Inter, system-ui, sans-serif', padding: 24 }}>
      <h1>Study Abroad Assistant — Starter</h1>
      <p>A minimal Next.js + NestJS scaffold.</p>
      <section>
        <h2>API health</h2>
        <pre>{JSON.stringify(health, null, 2)}</pre>
      </section>
      <section>
        <h2>Next steps</h2>
        <ul>
          <li>Add authentication (Clerk/Auth0 or JWT)</li>
          <li>Wire Prisma models to API endpoints</li>
          <li>Add S3 presigned uploads for documents</li>
          <li>Implement tasks & checklists</li>
        </ul>
      </section>
    </main>
  );
}