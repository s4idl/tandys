import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);
async function run() {
  const buffer = Buffer.from('hello world');
  const { data, error } = await supabase.storage.from('comprobants').upload('test.txt', buffer, {
    contentType: 'text/plain',
    upsert: true,
  });
  if (error) console.error("Upload error:", error.message);
  else console.log("Upload success:", data);
}
run();
