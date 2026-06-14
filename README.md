# JARVIS Ultimate

Görseldeki **JARVIS A1 OS** konseptinden ilham alan, **çok daha gelişmiş** bir tam yığın yapay zeka asistanı. Gerçek zamanlı cihaz yönetimi, kalıcı hafıza, kişilik sistemi, not yöneticisi, sesli etkileşim ve çoklu LLM sağlayıcısı desteğiyle gelir.

## ✨ Özellikler

- 🧠 **Çoklu AI sağlayıcı**: OpenAI, Anthropic, Ollama (yerel), veya mock fallback
- 💾 **Kalıcı hafıza**: Kısa süreli (son 20 mesaj) + uzun süreli anahtar-değer + arama
- 🖥️ **Gerçek zamanlı cihaz yönetimi**: Socket.IO + heartbeat (15s) + lost detection (45s)
- 📋 **Not sistemi**: Kategori bazlı, arama, filtreleme
- ⚙️ **Kimlik & Kişilik**: AI adı, 4 farklı kişilik, çok dilli yanıt
- 🎙️ **Sesli giriş/çıkış**: Web Speech API (mikrofon) + TTS
- 🔐 **Güvenlik**: Rate limit, parametreli sorgular, CORS
- 🎨 **Neon dark tema**: Mobil uyumlu, animasyonlu reaktör

## 📦 Klasör Yapısı

```
jarvis-ultimate/
├── backend/         # Node.js + Express + Socket.IO
│   ├── server.js
│   ├── modules/
│   └── database/    # otomatik oluşur (SQLite)
├── frontend/        # HTML + CSS + Vanilla JS
└── README.md
```

## 🚀 Kurulum

### 1. Bağımlılıkları yükle

```bash
cd backend
npm install
```

### 2. `.env` dosyası oluştur

```bash
cp .env.example .env
```

`.env` içeriğini düzenle. **Hiçbir API anahtarın yoksa** `AI_PROVIDER=mock` bırakabilirsin — sistem mock yanıt üretir.

OpenAI kullanmak için:

```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4-turbo
```

Anthropic için:

```env
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
```

Yerel Ollama için (önce `ollama serve` çalıştır):

```env
AI_PROVIDER=ollama
OLLAMA_BASE_URL=[localhost](http://localhost:11434)
OLLAMA_MODEL=llama3.1
```

### 3. Çalıştır

```bash
npm start
# veya geliştirme modu
npm run dev
```

Tarayıcıdan aç: **http://localhost:3400**

> Backend hem REST API'yi hem de `frontend/` klasörünü statik olarak servis eder, ek sunucu gerekmez.

## 💬 Slash Komutları

Chat ekranında:

| Komut | Açıklama |
|---|---|
| `/help` | Komutları listele |
| `/clear` | Kısa süreli hafızayı temizle |
| `/note Başlık \| İçerik \| Kategori` | Not oluştur |
| `/remind anahtar = değer` | Uzun hafızaya yaz |
| `/devices` | Bağlı cihazları listele |
| `/settings` | Mevcut ayarları göster |

Ayrıca **"Hatırla ki ..."** veya **"Remember that ..."** ile başlayan mesajlar otomatik olarak uzun hafızaya kaydedilir.

## 🔌 REST API Özeti

| Method | Endpoint | Açıklama |
|---|---|---|
| GET  | `/api/health` | Sağlık kontrolü |
| GET/PUT | `/api/settings` | Ayarları al/güncelle |
| POST | `/api/chat` | Mesaj gönder |
| GET  | `/api/conversations` | Konuşmalar |
| GET  | `/api/notes` | Notlar (filter: `?category=...&search=...`) |
| POST/PUT/DELETE | `/api/notes[/:id]` | CRUD |
| GET  | `/api/devices` | Cihazlar |
| GET  | `/api/memory` | Uzun hafıza |
| GET  | `/api/memory/export` | Tüm hafızayı JSON olarak indir |
| DELETE | `/api/memory` | Uzun hafızayı temizle |

## 🧩 Socket.IO Olayları

| Yön | Olay | Açıklama |
|---|---|---|
| C→S | `device:register` | Cihaz kaydı (`{ name, type }`) |
| C→S | `device:heartbeat` | Her 15s gönderilir |
| S→C | `devices:update` | Cihaz listesi değişti |

## 🛡️ Güvenlik Notları

- **`.env` dosyasını git'e ekleme** — `.gitignore` ekle.
- Üretim ortamında `FRONTEND_ORIGIN` değerini gerçek domain ile değiştir.
- Reverse proxy (Nginx/Caddy) arkasında HTTPS ile çalıştır.

## 🗺️ Yol Haritası

- [ ] Vektör DB entegrasyonu (Chroma / Qdrant) — gerçek semantik arama
- [ ] Çoklu kullanıcı + auth (JWT)
- [ ] Mobil uygulama (React Native)
- [ ] Wake-word ("Hey JARVIS") tarayıcı dinleyicisi
- [ ] Streaming yanıtlar (SSE / Socket)

## 📄 Lisans

MIT
