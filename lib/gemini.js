// Gemini API integration for ArchitectAI
// Uses @google/genai SDK with structured JSON output via responseSchema.
// Model: gemini-2.5-flash - latest stable model with reliable JSON Schema support.

import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL_ID = 'gemini-2.5-flash';

// JSON Schema instructing Gemini to act as a senior software architect.
// Each entity becomes a React Flow node; each edge becomes a relationship.
const architectureSchema = {
  type: Type.OBJECT,
  properties: {
    appName: {
      type: Type.STRING,
      description: 'A concise, catchy name for the application.',
    },
    summary: {
      type: Type.STRING,
      description: 'A 1-2 sentence summary of what is being built.',
    },
    prismaSchema: {
      type: Type.STRING,
      description:
        'A complete, valid Prisma schema string. Must include generator client, datasource (PostgreSQL), and all models with relations. No markdown fences.',
    },
    entities: {
      type: Type.ARRAY,
      description: 'Database tables / Prisma models for visualization.',
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: 'Stable id, lowercase model name.' },
          name: { type: Type.STRING, description: 'Model name e.g. User.' },
          fields: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                type: { type: Type.STRING, description: 'Prisma type, e.g. String, Int, DateTime, User[].' },
                isPrimary: { type: Type.BOOLEAN },
                isRelation: { type: Type.BOOLEAN },
              },
              required: ['name', 'type'],
            },
          },
        },
        required: ['id', 'name', 'fields'],
      },
    },
    edges: {
      type: Type.ARRAY,
      description: 'Relationships between entities for diagram edges.',
      items: {
        type: Type.OBJECT,
        properties: {
          source: { type: Type.STRING, description: 'Source entity id.' },
          target: { type: Type.STRING, description: 'Target entity id.' },
          label: { type: Type.STRING, description: 'e.g. one-to-many, has-many.' },
        },
        required: ['source', 'target', 'label'],
      },
    },
    apiRoutes: {
      type: Type.ARRAY,
      description: 'Suggested REST API endpoints.',
      items: {
        type: Type.OBJECT,
        properties: {
          method: { type: Type.STRING, description: 'GET | POST | PUT | PATCH | DELETE' },
          path: { type: Type.STRING, description: 'e.g. /api/users/[id]' },
          description: { type: Type.STRING },
          auth: { type: Type.BOOLEAN, description: 'Requires authentication.' },
        },
        required: ['method', 'path', 'description'],
      },
    },
  },
  required: ['appName', 'summary', 'prismaSchema', 'entities', 'edges', 'apiRoutes'],
};

const SYSTEM_PROMPT = `You are a Senior Software Architect and Principal Engineer with 15+ years of experience designing scalable web applications. You specialize in database design, Prisma ORM, and REST API architecture.

Given a natural-language description of a software product, you MUST:
1. Design a realistic, production-grade relational data model with proper relations, indexes, and types.
2. Output a valid Prisma schema using PostgreSQL as the datasource, with all models including id (cuid), createdAt, updatedAt where appropriate.
3. Use realistic field types (String, Int, DateTime, Boolean, Json, Decimal, etc.).
4. Model many-to-many, one-to-many, one-to-one relations correctly using @relation directives.
5. Suggest 6-12 REST API endpoints reflecting realistic CRUD + business logic.
6. Provide entity positions implicitly through ordering (frontend lays them out).
7. CRITICAL: The prismaSchema string MUST contain actual newline characters (\\n) between every model, every field, and around every brace. Format it as if you were writing a real schema.prisma file. Each field on its own line. Each model separated by a blank line.
8. Return ONLY valid JSON matching the schema. No markdown. No commentary.`;

export async function generateArchitecture(userPrompt) {
  const response = await ai.models.generateContent({
    model: MODEL_ID,
    contents: [
      {
        role: 'user',
        parts: [{ text: `${SYSTEM_PROMPT}\n\nUser request:\n${userPrompt}` }],
      },
    ],
    config: {
      responseMimeType: 'application/json',
      responseSchema: architectureSchema,
      temperature: 0.7,
    },
  });

  const text = response.text;
  if (!text) throw new Error('Empty response from Gemini');

  let data;
  try {
    data = JSON.parse(text);
  } catch (err) {
    console.error('Gemini returned non-JSON:', text.substring(0, 500));
    throw new Error('Gemini returned invalid JSON: ' + err.message);
  }

  // Defensive: Gemini sometimes returns the Prisma schema minified onto one line.
  // Reformat into a multi-line string by inserting newlines around braces and after
  // top-level statements. This is purely cosmetic and preserves semantics.
  if (data.prismaSchema && !data.prismaSchema.includes('\n')) {
    data.prismaSchema = prettifyPrisma(data.prismaSchema);
  }
  return data;
}

function prettifyPrisma(src) {
  // Step 1: insert newlines after `{` and before `}`
  let s = src
    .replace(/\{/g, ' {\n')
    .replace(/\}/g, '\n}\n');
  // Step 2: collapse extra spaces but keep newlines
  s = s.replace(/[ \t]+/g, ' ');
  // Step 3: split on newlines, then for each line, re-split on multi-field tokens.
  // Prisma fields look like:  fieldName   Type  modifiers
  // We detect them by looking for "  word  Word" patterns inside braces.
  const lines = s.split('\n');
  const out = [];
  let indent = 0;
  for (let raw of lines) {
    let line = raw.trim();
    if (!line) continue;
    if (line.startsWith('}')) indent = Math.max(0, indent - 1);

    // Within a model block, split multiple field declarations on one line.
    // Heuristic: a field starts after a complete previous declaration. We split
    // before any "  word " that follows a non-comma token, but only inside blocks.
    if (indent > 0 && /\s\w+\s+\w/.test(line) && !line.endsWith('{')) {
      // Split at every position where "  identifier <space> Identifier" appears.
      line = line.replace(/(\)|"|\w|\])\s+(@@\w|@\w|\w+\s+\w)/g, (m, a, b) => {
        // do not split inside `@relation(...)` parentheses heuristically: keep as-is
        return a + '\n' + ' '.repeat((indent) * 2) + b;
      });
    }

    const sublines = line.split('\n').map((l) => l.trim()).filter(Boolean);
    for (const sl of sublines) {
      out.push(' '.repeat(indent * 2) + sl);
    }
    if (line.endsWith('{')) indent += 1;
  }
  return out.join('\n');
}
