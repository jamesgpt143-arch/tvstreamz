import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://bkcetkqsqxxxockgmqcs.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrY2V0a3FzcXh4eG9ja2dtcWNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2OTA3NDYsImV4cCI6MjA5MTI2Njc0Nn0.93qR3jb74drHRhSAfHGxilbZhSkQX216tWN1R4C8Cr8";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function test() {
  console.log("Testing Supabase connection...");
  const { data, error } = await supabase.from('site_settings').select('*').limit(1);
  if (error) {
    console.error("Error:", error.message, error.details, error.hint, error.code);
  } else {
    console.log("Success! Data:", data);
  }
}

test();
