import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";

function loadEnv(file) {
  const out = {};
  try {
    const s = fs.readFileSync(path.resolve(file), "utf8");
    for (const l of s.split(/\r?\n/)) {
      const m = l.match(/^\s*([A-Z_0-9]+)\s*=\s*(.*)$/);
      if (m) {
        let v = m[2].trim();
        if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
        out[m[1]] = v;
      }
    }
  } catch {}
  return out;
}

const env = { ...loadEnv(".env"), ...loadEnv(".env.local") };
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

function b64ToBuffer(dataUrl) {
  if (dataUrl && dataUrl.includes(",")) {
    const [head, body] = dataUrl.split(",");
    if (/^data:image\/\w+/i.test(head)) return { buf: Buffer.from(body, "base64"), isDataUrl: true };
  }
  return { buf: Buffer.from(dataUrl || "", "base64"), isDataUrl: false };
}

async function compressPhoto(dataUrl) {
  try {
    const { buf } = b64ToBuffer(dataUrl);
    if (buf.length < 30000) return dataUrl;
    const out = await sharp(buf)
      .resize({ width: 256, height: 256, fit: "cover" })
      .jpeg({ quality: 82 })
      .toBuffer();
    const small = `data:image/jpeg;base64,${out.toString("base64")}`;
    return small.length < dataUrl.length ? small : dataUrl;
  } catch (err) {
    return null;
  }
}

(async () => {
  const { data, error } = await sb.from("users").select("username,photo");
  if (error) {
    console.log("ERROR:", error.message);
    return;
  }
  let checked = 0;
  let fixed = 0;
  let skipped = 0;
  for (const u of data || []) {
    const raw = u.photo;
    if (!raw) continue;
    const len = raw.length;
    checked++;
    if (len <= 30000) continue;
    const small = await compressPhoto(raw);
    if (!small) {
      skipped++;
      console.log(`skip ${u.username} (${len} bytes, no se pudo convertir)`);
      continue;
    }
    const upd = await sb.from("users").update({ photo: small }).eq("username", u.username);
    if (upd.error) {
      skipped++;
      console.log(`error ${u.username}: ${upd.error.message}`);
    } else {
      fixed++;
      console.log(`ok ${u.username}: ${len} -> ${small.length} bytes`);
    }
  }
  console.log(`\nFotos revisadas: ${checked}, reducidas: ${fixed}, omitidas: ${skipped}`);
})();
