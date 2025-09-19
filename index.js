import express from "express";
import multer from "multer";
import axios from "axios";
import FormData from "form-data";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// pastebin raw URL (isi token Vercel lu)
const pastebinRawUrl = "https://pastebin.com/raw/NXsRYLWu";

// serve frontend
app.use(express.static(path.join(__dirname, "views")));

// root → tampilkan index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

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

    // Buat form-data isi index.html + vercel.json
    const form = new FormData();
    form.append("files", file.buffer, { filename: "index.html" });
    form.append(
      "files",
      Buffer.from(
        JSON.stringify({
          version: 2,
          builds: [{ src: "index.html", use: "@vercel/static" }],
          routes: [{ src: "/(.*)", dest: "/index.html" }]
        })
      ),
      { filename: "vercel.json", contentType: "application/json" }
    );

    // Deploy ke Vercel
    const deployRes = await axios.post(
      "https://api.vercel.com/v13/deployments",
      form,
      {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${vercelToken}`
        },
        params: { name: namaWeb }
      }
    );

    const url = deployRes.data.url;
    res.send(
      `✅ Sukses deploy!<br>🔗 <a href="https://${url}" target="_blank">${url}</a>`
    );
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.send("❌ Gagal deploy ke Vercel.");
  }
});

// ✅ export express app buat Vercel
export default app;
          routes: [{ src: "/(.*)", dest: "/index.html" }]
        })
      ),
      { filename: "vercel.json", contentType: "application/json" }
    );

    // Deploy ke Vercel
    const deployRes = await axios.post(
      "https://api.vercel.com/v13/deployments",
      form,
      {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${vercelToken}`
        },
        params: { name: namaWeb }
      }
    );

    const url = deployRes.data.url;
    res.send(`✅ Sukses deploy!<br>🔗 <a href="https://${url}" target="_blank">${url}</a>`);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.send("❌ Gagal deploy ke Vercel.");
  }
});

// ✅ penting: export express app buat Vercel
export default app;
