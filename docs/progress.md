# Bekten.art V2 Progress

Bir iş yalnız ilgili kod, test ve doğrulama kanıtı tamamlandığında `[x]`
yapılır. Sıra, bağımlılık yönünü gösterir; aktif iş yukarıdan aşağı ilerler.

## 0. Tasarım ve hazırlık

- [x] Editorial heritage görsel yönünü onayla
- [x] Public hesapları kaldırma kararını onayla
- [x] Satış yerine inquiry / commission / private viewing modelini onayla
- [x] Harici CMS yerine Bekten Studio yaklaşımını onayla
- [x] V2 tasarım, mimari, veri, güvenlik ve test sözleşmesini belgele
- [x] Referans görselleri kaynak kontrolüne al
- [x] V1 baseline lint, typecheck, unit test ve build kapılarını geçir
- [x] V2 blueprint'i yaz ve adversarial review ile doğrula
- [x] V1 kaldırma envanterini kaynak yollarıyla tamamla

## 1. Kontrollü V1 temizliği

- [x] Tekrar kullanılabilecek V1 parçalarını geçici `backup/` yapısına taşı
- [x] Public login, kayıt, reset-password ve verification sayfalarını kaldır
- [x] Public profil, kullanıcı provider ve kullanıcı araçlarını kaldır
- [x] Store, create-store, fiyat ve satış dilini kaldır
- [x] Eski admin UI'ı kaldır; reusable operasyon kodunu koru
- [x] Kullanılmayan component, test, dependency, env ve locale anahtarlarını
      temizle
- [x] Route, import ve dependency taramasını geçir
- [x] Cleanup sonrası lint, typecheck, test ve build kanıtını al
- [x] V1 cleanup commit'ini oluştur

## 2. Domain ve içerik altyapısı

- [x] Collection domainini ve migration'ını test-first ekle
- [x] Exhibition domainini ve migration'ını test-first ekle
- [x] Journal entry ve editable page domainlerini test-first ekle
- [x] Inquiry domainini ve retention kurallarını test-first ekle
- [x] Content revision domainini ve immutable restore akışını test-first ekle
- [x] Artwork'i availability ve editorial metadata ile geliştir
- [x] Locale, slug, sıralama ve draft/published/archived sözleşmesini tamamla
- [x] Publish transaction ve cache invalidation akışını tamamla
- [x] Düzenlenebilir demo seed'i production gate ile ekle

## 3. Bekten Studio erişimi ve temel deneyim

- [x] Resend magic-link akışını test-first geliştir
- [x] EDITOR ve OWNER authorization sınırlarını tamamla
- [x] Public auth route ve bağımlılıklarının kalmadığını doğrula
- [x] Bekten Studio responsive shell'ini geliştir
- [x] Owner-only operasyon alanını editörden ayır
- [x] Studio genel bakış ve görev odaklı boş durumları geliştir
- [x] Studio error, loading ve accessibility durumlarını tamamla

## 4. Bekten Studio içerik yönetimi

- [x] Eser CRUD, sıralama, preview ve publish akışını geliştir
- [x] Koleksiyon CRUD, sıralama, preview ve publish akışını geliştir
- [x] Sergi CRUD, preview ve publish akışını geliştir
- [x] Journal, press ve sayfa CRUD akışlarını geliştir
- [x] Garage medya yükleme, seçme, sıralama ve alt-text akışını geliştir
- [x] Inquiry inbox, filtre, durum ve not akışını geliştir
- [x] Revision geçmişi, karşılaştırma ve geri alma deneyimini geliştir

## 5. Public editorial heritage deneyimi

- [x] Yirmi referans ekranını route ve reusable layout primitive'lerine eşle
- [x] Tasarım tokenları, tipografi, parşömen/grain ve responsive grid'i
      referanslara birebir yaklaştır
- [x] Gerçek eski logoyu header ve ilgili footer yüzeylerine yerleştir
- [x] Header, footer ve locale-aware navigasyonu referans stilinde tamamla
- [x] Home sayfasını referans kompozisyonuna göre tamamla
- [x] Collections ve collection detail sayfalarını referans kompozisyonuna göre
      tamamla
- [x] Works, available works ve work detail sayfalarını referans kompozisyonuna
      göre tamamla
- [x] Exhibitions ve exhibition detail sayfalarını referans kompozisyonuna göre
      tamamla
- [x] Artist, studio ve archive sayfalarını referans kompozisyonuna göre tamamla
- [x] Journal, journal detail ve press sayfalarını referans kompozisyonuna göre
      tamamla
- [x] Collectors, commission ve private-viewings sayfalarını referans
      kompozisyonuna göre tamamla
- [x] Availability, commission ve private-viewings formlarını referans
      kompozisyonuna göre tamamla
- [x] Demo içeriğin Studio'dan tamamen değiştirilebilir olduğunu doğrula
- [x] GPT Image 2 demo eserlerini optimize et ve deterministik Studio seed'ine
      bağla

## 6. Kalite ve production

- [x] Inquiry ve Resend outbox akışını idempotent tamamla
- [x] Garage private/public medya güvenlik sınırlarını doğrula
- [x] Coolify envanterinde PocketBase bulunmadığını ve `garage-s3` servisinin
      çalıştığını doğrula
- [x] Dört locale çeviri, canonical, hreflang, sitemap ve structured data'yı
      tamamla
- [x] İngilizce prefixsiz default route ve `/en/**` kalıcı redirect sözleşmesini
      tamamla
- [x] WCAG 2.1 AA, keyboard, focus, contrast ve reduced-motion testlerini geçir
- [x] Analytics consent ve hassas URL redaction'ını doğrula
- [x] Unit/integration coverage'i tüm metriklerde en az `%80` geçir
- [ ] Kritik Playwright E2E akışlarını geçir
- [ ] Lint, typecheck, test, coverage, build, audit ve Docker readiness'i geçir
- [ ] Coolify migration, env, deploy, health ve readiness doğrulamasını tamamla
- [ ] Garage'a V2 demo varlıklarını yükle ve Studio seed operasyonunu doğrula
- [x] Geçici `backup/` klasörünü tamamen sil
- [ ] Requirement-by-requirement final audit yap
- [ ] V2 goal'ünü yalnız bütün kanıtlar tamamlandığında kapat
