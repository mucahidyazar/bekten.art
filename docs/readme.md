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
- [x] **2026-08-11 — Locale detail geçişi:** Editorial kayıtların farklı
      dillerde aynı slug'ı kullanma garantisi olmadığı için detail sayfasındaki
      dil değişimi, yanlış/404 URL üretmek yerine seçilen dilin ilgili liste
      sayfasına güvenli biçimde dönecek. Statik sayfa route'ları korunacak.
- [x] **2026-08-11 — Referans sadakati:** Public V2 yalnız editorial heritage
      yaklaşımını yorumlamayacak; `docs/references` altındaki yirmi ekranın
      sayfa iskeleti, tipografi hiyerarşisi, grid oranları, çerçeveler, çizgisel
      illüstrasyon kullanımı, form ve footer kompozisyonu ilgili route'lara
      sayfa sayfa mümkün olduğunca birebir uygulanacak. Referanslardaki sahte
      eser, biyografi, tarih, fiyat ve iletişim verileri yine kopyalanmayacak.
- [x] **2026-08-11 — Marka işareti:** CSS/font ile yazılan geçici `Bekten`
      wordmark kaldırılacak; mevcut gerçek `public/svg/full-logo.svg` header ve
      uygun footer yüzeylerinde kullanılacak.
- [x] **2026-08-11 — Default locale URL sözleşmesi:** İngilizce varsayılan dil
      olacak ve URL prefix'i kullanmayacak (`/`, `/works`). Türkçe, Rusça ve
      Kırgızca sırasıyla `/tr`, `/ru`, `/ky` prefix'lerini koruyacak. Eski
      `/en/**` adresleri kalıcı olarak prefixsiz İngilizce karşılığına
      yönlendirilecek; canonical, hreflang, sitemap ve locale switch aynı
      sözleşmeyi kullanacak.
- [x] **2026-08-11 — Kesintisiz ilk yüzey:** Header ile her route'un ilk hero
      alanı ayrı background, ton veya sınır bandı çizmeyecek; ikisi ortak
      `heritage-site` parşömen/grain yüzeyini gösterecek. Bölüm ayrımı yalnız
      kompozisyon, içerik ve hero sonundaki ince çizgiyle kurulacak.
- [x] **2026-08-11 — Gerçek hero çerçevesi:** Çerçeveli hero eserlerinde CSS ile
      taklit edilen border/shadow çerçevesi kullanılmayacak.
      `public/img/frame.png` transparan overlay olarak, eser de ölçülmüş iç
      açıklığın altında render edilecek. Referansta çerçevesiz olan çizim ve
      panoramik Studio yüzeyleri route-specific olarak çerçevesiz kalacak.
- [x] **2026-08-11 — Geçici üretim görselleri:** GPT Image 2 ile üretilen
      `heritage-*` JPG varlıkları yalnız düzeni dolduran, fiyat ve satış iddiası
      taşımayan değiştirilebilir demo içeriktir. Deterministik Garage obje
      anahtarlarıyla Studio seed'ine bağlanır; Studio'dan silinebilir veya
      gerçek eserlerle değiştirilebilir.
- [x] **2026-08-11 — Kaynaklı demo bağlamı:** Demo biyografi ve sergi özeti
      kişisel adres içermeden
      [Open.kg sanatçı profili](https://open.kg/en/about-kyrgyzstan/famous-personalities/artists-kyrgyzstan/print%3Apage%2C1%2C32767-usubaliev-bekten-ashimbaevich.html),
      [B'Art Open Studio kaydı](https://www.bishkekart.kg/news/10/) ve
      [2013 Al Hayat sergi haberi](https://www.vb.kg/doc/212800_v_bishkeke_otkrylas_vystavka_bektena_ysybalieva_.html)
      temel alınarak özetlenecek; yayın öncesinde sanatçı tarafından doğrulanıp
      Studio'dan değiştirilecek.
- [x] **2026-08-11 — Collector inquiry sınıflandırması:** `/collectors`
      üzerinden gelen özel konuşmalar genel iletişimden ayrı `COLLECTOR` türüyle
      kaydedilecek; aynı subject/message güvenlik sınırlarını kullanıp Studio
      inbox filtrelerinde ayrı görünecek.

## Bekleyen kullanıcı kararları

- [ ] Henüz bekleyen karar yok.
