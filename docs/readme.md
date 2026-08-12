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
- [x] **2026-08-10 — Studio erişimi (2026-08-11'de güncellendi):** Public auth
      olmayacak; editör magic-link alanı başlangıçta `/studio` olarak planlandı,
      daha sonra public Studio hikâyesiyle çakışmaması için `/dashboard` olarak
      kesinleştirildi. Teknik ekranlar yalnız owner'a açık olacak.
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
      açıklığın altında render edilecek. Son kullanıcı kararıyla About ve
      panoramik Studio dahil bütün public hero görselleri Collector sayfasıyla
      aynı ortak framed hero primitive'ini kullanacak.
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
- [x] **2026-08-11 — Public Studio ve CMS route ayrımı:** `/studio`
      referanslardaki public Studio hikâyesi olarak kalacak. İçerik yönetimi,
      editör magic-link girişi ve owner operasyonları `/dashboard` altında
      yaşayacak. Public `/about` gerçek About yüzeyi olacak; eski `/artist`
      adresi `/about`'a kalıcı yönlendirilecek.
- [x] **2026-08-11 — Native View Transitions:** Public ve Dashboard route
      geçişleri üçüncü taraf layout wrapper'ı yerine Next.js 16.3'ün App Router
      ile config gerektirmeyen entegrasyonu ve React `ViewTransition`
      primitive'iyle kurulacak. Persistent shell sabit kalacak; yalnız anlamlı
      list→detail geçişleri yönlü/shared-element, sibling geçişleri hafif fade
      kullanacak ve `prefers-reduced-motion` altında animasyon kapanacak.
      Özellik Next.js tarafından hâlâ experimental olarak işaretlendiği için
      production öncesi regression ve tarayıcı fallback kontrolü zorunlu
      kalacak.
- [x] **2026-08-11 — Dashboard görsel sistemi:** `/dashboard`, Heremio'nun sade
      workspace/sidebar bilgi mimarisini örnek alacak; bileşenler yerel shadcn
      primitive'leriyle kurulacak ve tüm renk, tipografi, logo, border ve
      yüzeyler Bekten'in editorial heritage tasarım tokenlarını kullanacak.
- [x] **2026-08-11 — Dil yönetimi UX'i (netleştirildi):** Dashboard chrome'u
      sade İngilizce kalacak. `Languages` ekranı editorial kayıt kapsamını değil
      `public/locales/{en,tr,ru,kg}/common.json` arayüz çevirilerini yönetecek.
      JSON dosyaları güvenli ve immutable varsayılan kaynak olarak kalacak;
      editörün EN/TR/RU/KY değişiklikleri PostgreSQL'de audit'li override olarak
      saklanıp runtime'da katalogla birleşecek. Production filesystem'ine yazma,
      otomatik çeviri veya yeni harici servis eklenmeyecek. Editör anahtarları
      arayıp filtreleyebilecek, dört dili birlikte düzenleyebilecek ve locale
      bazında dosya varsayılanına dönebilecek.
- [x] **2026-08-11 — Dashboard gizlilik sınırı:** Public consent banner ve GTM
      `/dashboard/**` altında render edilmeyecek; özel editör route ve içerik
      yolları analytics'e gönderilmeyecek.
- [x] **2026-08-11 — Public transition anahtarı:** Shared-element View
      Transition adları internal veritabanı UUID'si taşımayacak; yalnız zaten
      public olan kebab-case içerik slug'ı kullanılacak ve UUID/unsafe anahtar
      fail-closed reddedilecek.
- [x] **2026-08-11 — Dinamik tam CMS dili:** Dashboard'dan eklenen yeni dil UI
      çevirileri, public selector/URL, SEO ve editoryal içerik kapsamına
      birlikte girecek. Eksik UI veya editoryal değer İngilizceye düşecek;
      İngilizce prefixsiz kalacak. Yeni dil önce taslak/preview olacak, owner
      tarafından etkinleştirilecek ve içeriği varsa silinmek yerine devre dışı
      bırakılacak.
- [x] **2026-08-11 — Editoryal dil kimliği:** Aynı eserin veya sayfanın dil
      varyantları stable translation group ile bağlanacak. İngilizce fallback
      gösterilen URL duplicate SEO üretmeyecek; canonical İngilizce kayda
      dönecek ve hreflang yalnız gerçek yayımlanmış varyantları listeleyecek.
- [x] **2026-08-11 — Media workspace:** Medya klasörleri PostgreSQL'de sanal
      olacak; rename/move Garage object key'ini değiştirmeyecek. EDITOR yükleme,
      klasör, rename ve move; OWNER/ADMIN ayrıca kalıcı silme yapabilecek.
      Kullanılan medya ve dolu klasör silinemeyecek. Grid, liste ve desktop/icon
      görünümü aynı erişilebilir action ve drag/drop sözleşmesini kullanacak.
- [x] **2026-08-11 — Media upload yüzeyi:** Ayrı upload kartı kaldırılacak;
      yükleme alanı Media Library header'ının sağında düzensiz, yarı saydam
      quatrefoil formunda olacak. Tıklama, klavye ve drag/drop aynı doğrulanmış
      Garage upload akışını kullanacak; hover/focus/drag-over durumları görünür
      kontrastla belirtilecek.
- [x] **2026-08-11 — Dashboard kullanıcı yönetimi:** `/dashboard/users` yalnız
      OWNER/ADMIN'e açık olacak. Erişim Resend üzerinden tek kullanımlık süreli
      magic-link davetiyle verilecek; rol, askıya alma ve erişim kaldırma audit
      edilecek. Son aktif OWNER hiçbir eşzamanlı akışta kaldırılamayacak, askıya
      alınamayacak veya yetkisi düşürülemeyecek.
- [x] **2026-08-11 — Local owner:** `mucahidyazar@gmail.com` local ortamda OWNER
      rolüne yükseltilecek; production yetkileri Coolify/deploy fazında ayrıca
      doğrulanacak.
- [x] **2026-08-11 — Dashboard activity log:** İçerik, yayınlama, translation,
      locale, media, inquiry, kullanıcı ve operasyon mutasyonları ortak
      `AuditEvent` akışında tutulacak. `/dashboard/activity` yalnız
      OWNER/ADMIN'e açık, filtrelenebilir ve sayfalı olacak; token, tam e-posta,
      çeviri değeri, private object key veya form PII audit metadata'sına
      yazılmayacak.
- [x] **2026-08-11 — Instagram gerçek içerik cutover'ı:** Mevcut Apify
      entegrasyonu yalnız `bekten_usubaliev` hesabından gelen, caption'ı
      incelenmiş ve READY/PUBLIC Garage medyası bulunan kayıtları kaynak kabul
      edecek. Başlığı olmayan, ölçüsü şüpheli veya caption'ı manifestten sapmış
      gönderi otomatik eser olmayacak. Seed fiyat üretmeyecek, source URL'yi
      yalnız hassas veri içermeyen audit metadata'sında tutacak ve mevcut Studio
      düzenlemesini asla ezmeyecek.
- [x] **2026-08-12 — Editorial locale fallback:** Seçilen dilde yayımlanmış
      varyant yoksa içerik önce İngilizce, İngilizce de yoksa ilk yayımlanmış
      dilden gösterilecek. Ziyaretçinin URL'si ve public kabuğu seçtiği dilde
      kalacak; fallback içeriğin `lang` değeri gerçek içerik dili olacak,
      canonical gerçek kaynak varyanta dönecek ve hreflang yalnız var olan
      çevirileri yayımlayacak.
- [x] **2026-08-12 — Work detail çoklu medya:** Tek görsel bulunan eserde mevcut
      framed detail kompozisyonu değişmeyecek. İki veya daha fazla yayımlanmış
      görselde aynı çerçeve içinde klavye, dokunma, buton ve reduced-motion
      destekli carousel açılacak.
- [x] **2026-08-12 — Public navigation önceliği:** Header ana navigasyonunda
      Collectors yerine public Studio yer alacak. Collectors footer'a taşınacak;
      diğer ikincil public route'lar görünür iç linklerle erişilebilir kalacak.
- [x] **2026-08-12 — Gerçek hero medya sınırı:** Home, Collections, About ve
      Contact mevcut seçilmiş görsellerini koruyacak. Diğer public hero'lar
      yalnız doğrulanmış `bekten_usubaliev` Instagram kayıtlarının READY/PUBLIC
      Garage medyasını kullanacak; GPT üretimi editorial hero görselleri burada
      kullanılmayacak.
- [x] **2026-08-12 — Production cutover:** V2 `main` revizyonu Coolify'a
      alınacak; bütün secret'lar runtime-only tutulacak. Garage private bucket
      yalnız Bekten local-development ve güncel production anahtarlarına açık
      olacak. Resend domain-sınırlı production anahtarı, imzalı webhook,
      outbox/retention task'leri ve Apify uygulama tokenı canlı smoke testleri
      geçmeden teslim tamamlanmış sayılmayacak. Bu kontrollerin tamamı geçti.

## Bekleyen kullanıcı kararları

- [x] Henüz bekleyen karar yok.
