#!/usr/bin/env node
/**
 * فحص سريع قبل النشر إلى Vercel.
 * التشغيل: node tools/preflight.mjs
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const problems = [];
const warnings = [];
const invalid = /[ ()[\]]/;

const required = ["package.json", "index.html", "vercel.json", "api", "server"];
for (const item of required) {
  if (!fs.existsSync(path.join(root, item))) problems.push(`العنصر المطلوب غير موجود في جذر المشروع: ${item}`);
}

const walk = (dir, depth = 0) => {
  if (depth > 4) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", "dist", ".git"].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    const relative = path.relative(root, full);
    if (invalid.test(entry.name) && !entry.name.startsWith(".")) {
      problems.push(`اسم غير صالح للنشر (فيه مسافة/أقواس): ${relative}`);
    }
    if (entry.isDirectory()) walk(full, depth + 1);
  }
};
walk(root);

const ancestors = path.resolve(root).split(path.sep).filter(Boolean);
ancestors.forEach((name, index) => {
  if (index > 0 && invalid.test(name)) {
    warnings.push(`اسم مجلد أعلى المشروع يحتوي مسافة/أقواس: "${name}" — إن كان هذا هو جذر المستودع فاجعل Root Directory في Vercel هو مجلد المشروع، أو أعد تسميته.`);
  }
});

const apiDir = path.join(root, "api");
if (fs.existsSync(apiDir)) {
  for (const entry of fs.readdirSync(apiDir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      problems.push(`مجلد داخل api يجعل أسماء الدوال غير مباشرة: api/${entry.name} — استخدم ملفات مباشرة api/*.js`);
    }
  }
}

try {
  const config = JSON.parse(fs.readFileSync(path.join(root, "vercel.json"), "utf8"));
  if (config.outputDirectory !== "dist") warnings.push("outputDirectory المتوقع هو dist");
} catch (error) {
  problems.push(`vercel.json غير صالح: ${error.message}`);
}

console.log("مسارات دوال الخادم:");
fs.readdirSync(path.join(root, "api")).filter((name) => name.endsWith(".js")).forEach((name) => console.log(`  /api/${name}`));

if (warnings.length) {
  console.log("\nتنبيهات:");
  warnings.forEach((item) => console.log(`  - ${item}`));
}

if (problems.length) {
  console.log("\nمشكلات يجب إصلاحها قبل النشر:");
  problems.forEach((item) => console.log(`  ✗ ${item}`));
  process.exitCode = 1;
} else {
  console.log("\n✔ لا توجد أسماء مسارات غير صالحة داخل المشروع.");
  console.log("تأكد أن جذر المستودع على GitHub هو هذا المجلد مباشرة، وأن Vercel → Root Directory يشير إليه.");
}
