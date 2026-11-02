import axios from 'axios';
import { useState } from 'react';
import { ping, type PingArea } from '../api/authApi.ts';

interface ProbeResult {
  area: PingArea;
  status: number | string;
  body: unknown;
}

export default function RbacProbe() {
  const [result, setResult] = useState<ProbeResult | null>(null);

  const probe = async (area: PingArea): Promise<void> => {
    try {
      const data = await ping(area);
      setResult({ area, status: 200, body: data });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setResult({
          area,
          status: err.response?.status ?? 'network error',
          body: err.response?.data,
        });
      } else {
        setResult({ area, status: 'error', body: String(err) });
      }
    }
  };

  return (
    <div className="mt-6 rounded-xl bg-slate-800 p-4">
      <h2 className="mb-3 text-sm font-semibold text-slate-300">RBAC probe (dev only)</h2>
      <div className="flex gap-2">
        <button
          onClick={() => void probe('student')}
          className="rounded-lg bg-slate-700 px-3 py-1.5 text-sm hover:bg-slate-600"
        >
          Call /student/ping
        </button>
        <button
          onClick={() => void probe('instructor')}
          className="rounded-lg bg-slate-700 px-3 py-1.5 text-sm hover:bg-slate-600"
        >
          Call /instructor/ping
        </button>
      </div>
      {result && (
        <pre className="mt-3 overflow-x-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-300">
          {`${result.area} → ${result.status}\n${JSON.stringify(result.body, null, 2)}`}
        </pre>
      )}
    </div>
  );
}