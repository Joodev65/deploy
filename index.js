import express from "express";
import multer from "multer";
import axios from "axios";
import fs from "fs";
import FormData from "form-data";

const app = express();
const upload = multer({ dest: "uploads/" });

// pastebin raw URL
const pastebinRawUrl = "https://pastebin.com/raw/NXsRYLWu";

app.use(express.static("views"));

app.post("/deploy", upload.single("file"), async (req, res) => {
  const { namaWeb } = req.body;
  const file = req.file;

  if (!file) return res.send("❌ Upload file dulu!");
  if (!file.originalname.endsWith(".html")) {
    return res.send("❌ File harus .html");
  }

  try {
    // Ambil token dari pastebin
    const tokenRes = await axios.get(pastebinRawUrl);
    const vercelToken = tokenRes.data.trim();

    // Buat form-data untuk API Vercel
    const form = new FormData();
    form.append("file", fs.createReadStream(file.path), "index.html");
    form.append("file", Buffer.from(JSON.stringify({
      version: 2,
      builds: [{ src: "index.html", use: "@vercel/static" }],
      routes: [{ src: "/(.*)", dest: "/index.html" }]
    })), { filename: "vercel.json", contentType: "application/json" });

    const deployRes = await axios.post(
      "https://api.vercel.com/v13/deployments",
      form,
      {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${vercelToken}`
        },
        params: { name: namaWeb, project: namaWeb }
      }
    );

    const url = deployRes.data.url;

    res.send(`✅ Sukses deploy!<br>🔗 <a href="https://${url}" target="_blank">${url}</a>`);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.send("❌ Gagal deploy ke Vercel.");
  }
});

export default app;

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
