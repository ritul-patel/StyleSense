import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "").trim();

  if (!token) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }

  req.user = data.user;
  return next();
};
