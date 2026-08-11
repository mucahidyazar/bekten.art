# Bekten.art V2 Karar Günlüğü

Bu dosya kullanıcı onayı gerektiren kararları ve gözden kaçmaması gereken kalıcı
sözleşmeleri kısa biçimde tutar. Yeni kararlar tarih sırasıyla eklenir;
tamamlanan kararlar silinmez.

## Onaylanan kararlar

- [x] **2026-08-10 — Görsel yön:** Editorial heritage yaklaşımı kullanılacak.
- [x] **2026-08-10 — Public hesaplar:** Login, kayıt, profil ve kullanıcı
      araçları tamamen kaldırılacak.
- [x] **2026-08-10 — Ticari akış:** Sepet, ödeme ve doğrudan satış yerine
      availability inquiry, commission request ve private viewing kullanılacak.
- [x] **2026-08-10 — İçerik yönetimi:** Harici CMS kurulmayacak; PostgreSQL,
      Prisma, Garage ve Resend üzerinde Bekten Studio geliştirilecek.
- [x] **2026-08-10 — Studio erişimi:** Public auth olmayacak; editörler
      `/studio` alanına Resend magic-link ile girecek. Teknik ekranlar yalnız
      owner'a açık olacak.
- [x] **2026-08-10 — Studio auth altyapısı:** Yeni ve özel bir session sistemi
      yazılmayacak. Stabil NextAuth + Prisma adapter yalnız Studio email
      provider için korunacak; Credentials, Google, public kayıt ve
      password-reset yüzeyleri kaldırılacak.
- [x] **2026-08-10 — Rol geçişi:** `EDITOR` ve `OWNER` additif eklenecek; mevcut
      `ADMIN` operatörleri sayım/audit ile `OWNER` rolüne taşınana kadar tek
      release uyumluluk penceresi kullanılacak.
- [x] **2026-08-10 — Press modeli:** Mevcut `PressItem` tablosu additif cutover
      sırasında V2 `PressEntry` domaininin persistence modeli olarak korunacak;
      fiziksel rename ancak doğrulanmış ayrı migration ile yapılacak.
- [x] **2026-08-10 — Başlangıç içeriği:** Referans düzenini kurmak için
      değiştirilebilir demo içerik kullanılabilir; gerçek içerik doğrulanmadan
      production yayını yapılmayacak.
- [x] **2026-08-10 — İsimlendirme:** Yeni dosya, klasör ve route URL yapıları
      kebab-case olacak.
- [x] **2026-08-10 — Görsel kaynak sırası:** Önce mevcut proje görselleri
      kullanılacak. Eksik stil varlığı gerekirse `gpt-image-2`, gerekli şeffaf
      kesim için background-removal akışı kullanılacak.
- [x] **2026-08-10 — İlerleme takibi:** Kanonik kontrol listesi
      `docs/progress.md`; karar günlüğü `docs/readme.md` olacak.
- [x] **2026-08-10 — Geçici backup:** V1'den tekrar kullanılabilecek öğeler
      kaynak yolunu koruyarak geçici `backup/` altında tutulacak ve V2 final
      doğrulamasından sonra tamamen silinecek.
- [x] **2026-08-10 — PocketBase sınırı:** Runtime, script, environment ve deploy
      akışında PocketBase bulunmayacak. Daha önce uygulanmış Prisma migration
      dosyalarındaki tarihsel isimler checksum/audit bütünlüğü için
      değiştirilmeyecek; production doğrulaması Garage kayıt ve obje
      sayımlarıyla yapılacak.
- [x] **2026-08-11 — Demo seed güvenliği:** Demo içerik container başlangıcında
      otomatik çalışmayacak. Bağlandığı ortamdan bağımsız olarak yalnız
      `ALLOW_V2_DEMO_SEED=true` ve
      `V2_DEMO_SEED_CONFIRMATION=bekten-art-v2-demo` birlikte verilerek
      `pnpm db:seed:demo` ayrı owner operasyonu olarak çalıştırılacak. Mevcut
      Studio kaydı asla üzerine yazılmayacak; deterministic Garage varlıkları
      doğrulanacak veya onarılacak ve işlem sonrası iki flag tekrar kapatılacak.

## Bekleyen kullanıcı kararları

- [ ] Henüz bekleyen karar yok.
