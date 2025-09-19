import express from "express";
import multer from "multer";
import axios from "axios";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const app = express();
const upload = multer({ dest: "uploads/" });

// 🔑 Ganti dengan raw Pastebin lu
const pastebinRawUrl = "https://pastebin.com/raw/XXXXXXX";

app.use(express.static("views"));

app.post("/deploy", upload.single("file"), async (req, res) => {
  const { namaWeb } = req.body;
  const file = req.file;

  if (!file) return res.send("❌ Upload file dulu!");
  if (!file.originalname.endsWith(".html")) {
    return res.send("❌ File harus .html");
  }

  try {
    // Ambil token vercel dari pastebin raw
    const tokenRes = await axios.get(pastebinRawUrl);
    const vercelToken = tokenRes.data.trim();

    // Buat folder temp
    const projectDir = `./deploy_${Date.now()}`;
    fs.mkdirSync(projectDir);

    // Simpan file jadi index.html
    const destPath = path.join(projectDir, "index.html");
    fs.renameSync(file.path, destPath);

    // Buat vercel.json
    fs.writeFileSync(
      `${projectDir}/vercel.json`,
      JSON.stringify(
        {
          version: 2,
          builds: [{ src: "index.html", use: "@vercel/static" }],
          routes: [{ src: "/(.*)", dest: "/index.html" }]
        },
        null,
        2
      )
    );

    // Zip project
    execSync(`cd ${projectDir} && zip -r ../${projectDir}.zip .`);
    const zipBuffer = fs.readFileSync(`${projectDir}.zip`);

    // Deploy ke Vercel
    const deployRes = await axios.post(
      "https://api.vercel.com/v13/deployments",
      zipBuffer,
      {
        headers: {
          Authorization: `Bearer ${vercelToken}`,
          "Content-Type": "application/zip"
        },
        params: {
          name: namaWeb,
          project: namaWeb
        }
      }
    );

    const url = deployRes.data.url;

    // Hapus temp
    fs.rmSync(projectDir, { recursive: true, force: true });
    fs.unlinkSync(`${projectDir}.zip`);

    res.send(`✅ Sukses deploy!<br>🔗 Link: <a href="https://${url}" target="_blank">${url}</a>`);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.send("❌ Gagal deploy ke Vercel.");
  }
});

app.listen(3000, () => {
  console.log("🚀 Server jalan di http://localhost:3000");
});
