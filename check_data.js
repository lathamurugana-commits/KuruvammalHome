
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = "https://vqkfbosiunigsmkaayka.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxa2Zib3NpdW5pZ3Nta2FheWthIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2MTczOTQsImV4cCI6MjA5NTE5MzM5NH0.5ZudHoPnLnOebmQAtVrKwkj2BfzsPS6EpSvqZGuYuik";

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('homes').select('*');
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('HOMES_DATA_START');
    console.log(JSON.stringify(data, null, 2));
    console.log('HOMES_DATA_END');
  }
}

check();
