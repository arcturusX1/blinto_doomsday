import 'dotenv/config';
import app from './app.ts';
import { connectDB } from './config/db.ts';

const PORT = process.env.PORT || 5000;

try {
  await connectDB();
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
} catch (err) {
  console.error('Failed to start server:', err instanceof Error ? err.message : err);
  process.exit(1);
}
