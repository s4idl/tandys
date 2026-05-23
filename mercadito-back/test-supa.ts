import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);
async function run() {
  const { data, error } = await supabase.storage.getBucket('comprobants');
  if (error) console.error("Error fetching bucket:", error.message);
  else console.log("Bucket details:", data);
}
run();
