import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '@/lib/mongo';
import { generateArchitecture } from '@/lib/gemini';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function joinPath(params) {
  return '/' + (params?.path || []).join('/');
}

export async function GET(request, { params }) {
  const path = joinPath(params);
  try {
    const db = await getDb();

    if (path === '/' || path === '/health') {
      return NextResponse.json({ ok: true, service: 'ArchitectAI' });
    }

    if (path === '/projects') {
      const projects = await db
        .collection('projects')
        .find({}, { projection: { _id: 0 } })
        .sort({ createdAt: -1 })
        .limit(50)
        .toArray();
      return NextResponse.json({ projects });
    }

    const projectMatch = path.match(/^\/projects\/([\w-]+)$/);
    if (projectMatch) {
      const id = projectMatch[1];
      const project = await db
        .collection('projects')
        .findOne({ id }, { projection: { _id: 0 } });
      if (!project) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      return NextResponse.json({ project });
    }

    return NextResponse.json({ error: 'Not found', path }, { status: 404 });
  } catch (err) {
    console.error('GET error', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  const path = joinPath(params);
  try {
    const body = await request.json();

    if (path === '/generate') {
      const { prompt } = body || {};
      if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 5) {
        return NextResponse.json(
          { error: 'Please provide a meaningful prompt (min 5 chars).' },
          { status: 400 },
        );
      }

      // Call Gemini API with structured JSON output (responseSchema).
      const architecture = await generateArchitecture(prompt.trim());

      // Persist to MongoDB so users can browse past generations.
      const db = await getDb();
      const project = {
        id: uuidv4(),
        prompt: prompt.trim(),
        ...architecture,
        createdAt: new Date().toISOString(),
      };
      await db.collection('projects').insertOne({ ...project });

      // Strip _id before returning
      const { _id, ...clean } = project;
      return NextResponse.json({ project: clean });
    }

    return NextResponse.json({ error: 'Not found', path }, { status: 404 });
  } catch (err) {
    console.error('POST error', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function DELETE(request, { params }) {
  const path = joinPath(params);
  try {
    const db = await getDb();
    const m = path.match(/^\/projects\/([\w-]+)$/);
    if (m) {
      await db.collection('projects').deleteOne({ id: m[1] });
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
