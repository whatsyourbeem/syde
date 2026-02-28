const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "http://127.0.0.1:54321"\;
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5ZGUiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcwNDAzMjAwMCwiZXhwIjoyMDIwMDcyMDAwfQ.anon-key-here"; // placeholder, anon key not needed for just schema test if we are public

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
); // will fail without real key

async function test() {
  const { data, error } = await supabase
    .from("insights")
    .select(`
        id,
        title,
        summary,
        image_url,
        created_at,
        profiles:user_id (
            username,
            avatar_url,
            tagline
        ),
        insight_comments (id),
        insight_likes (id),
        insight_bookmarks (insight_id)
    `)
    .order("created_at", { ascending: false });

  console.log("Error:", error);
  console.log("Data:", data);
}

test();
