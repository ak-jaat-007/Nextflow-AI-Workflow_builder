import { defineConfig } from "prisma/config";
import "dotenv/config"; // Yeh zaroori hai env files load karne ke liye

export default defineConfig({
  schema: "./prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL, // Yeh aapki Neon link uthayega
  },
});