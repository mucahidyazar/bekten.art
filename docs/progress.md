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
- [x] Kritik Playwright E2E akışlarını geçir
- [x] Local lint, typecheck, test, coverage, build ve audit kapılarını geçir
- [x] Production Docker image'ını frozen lockfile ile başarıyla üret
- [x] Docker readiness'i production env ile local production smoke'ta doğrula
- [x] Production secret rotasyonu ve Coolify env yenilemesini deploy öncesi
      tamamla
- [x] Coolify migration, env, deploy, health ve readiness doğrulamasını tamamla
- [x] Garage'a V2 demo varlıklarını yükle ve Studio seed operasyonunu doğrula
- [x] Geçici `backup/` klasörünü tamamen sil
- [x] Requirement-by-requirement final audit yap; deployment dışındaki tüm
      maddelerin kod, veri, test veya browser kanıtını doğrula
- [x] V2 goal'ünü yalnız bütün kanıtlar tamamlandığında kapat

## 7. Görünür içerik ve route düzeltmeleri

- [x] Garage'da Bekten için ayrı local-development anahtarı oluştur
- [x] Local-development anahtarını yalnız Bekten bucket'ında read/write ile
      sınırla
- [x] Garage bağlantısını secret sızdırmadan yerel env'e ekle
- [x] `/about` sayfasını gerçek public About yüzeyi yap ve `/artist` adresini
      yönlendir
- [x] `/collectors` sayfasını yayımlanmış Studio içeriğiyle görünür yap
- [x] Public `/studio` sayfasını koru; CMS ve magic-link girişini `/dashboard`
      altına taşı
- [x] Home, Collections ve Works sayfalarını düzenlenebilir demo içerikle doldur
- [x] Demo medya varlıklarını Garage'a, kayıtları PostgreSQL'e idempotent seed
      et
- [x] Local PostgreSQL'de tüm V2 migration'larını uygula
- [x] About, Collectors, Studio, Dashboard ve dolu katalog için regresyon
      testlerini geçir
- [x] Tüm public yüzeyleri desktop/mobile tarayıcıda tek tek doğrula

## 8. Ortak public layout ve local Dashboard erişimi

- [x] Footer'dan yinelenen telif metnini kaldır ve üç kolonlu link düzenini kur
- [x] En alta `Made with 💜 by mucahid.dev for bekten.art` attribution satırını
      ekle
- [x] Collector-temelli ortak framed hero componentini tüm public hero'lara
      uygula
- [x] Tek public container max-width ve responsive padding primitive'ini tanımla
- [x] Tüm public sayfa/header/footer yüzeylerini ortak container'a geçir
- [x] `mucahidyazar@gmail.com` kullanıcısını local PostgreSQL'de `EDITOR` yap
- [x] `.env.example` dosyasını tüm local ve production değişkenleriyle tamamla
- [x] Secret değerleri loglamadan local `.env` dosyasını tamamla
- [x] Resend magic-link ile local `/dashboard` girişini gerçek tarayıcıda
      doğrula
- [x] Footer, hero, container ve Dashboard erişim regresyon testlerini geçir
- [x] Collections hero başlığını dört dilde iki satırlık sabit ritme getir
- [x] Tüm `Link`, programatik navigation, route ve Suspense yüzeylerini View
      Transitions için envanterle
- [x] Eski `next-view-transitions` layout wrapper'ını kaldır ve Next.js 16'nın
      config gerektirmeyen native View Transitions entegrasyonuna geç
- [x] Ortak page-level View Transition primitive'ini ve reduced-motion CSS
      sözleşmesini ekle
- [x] Public header/footer ile Dashboard header/sidebar yüzeylerini transition
      snapshot'ından izole et
- [x] Public ve Dashboard navigasyonlarını lateral/forward/back transition
      tipleriyle bağla
- [x] Katalog kartlarından detail hero'lara benzersiz image/title shared-element
      geçişlerini ekle
- [x] View Transitions davranışını unit, desktop/mobile E2E ve reduced-motion
      senaryolarında doğrula

## 9. Heremio-temelli Dashboard ve dil yönetimi

- [x] Heremio dashboard container, shell, sidebar ve navigation desenlerini
      incele
- [x] Bekten renk/tokenlarıyla shadcn `SidebarProvider` tabanlı shell geliştir
- [x] Responsive sidebar, sticky header, active route ve owner-only grubu
      tamamla
- [x] Overview, içerik listeleri, editör formu, inquiry ve medya yüzeylerini
      ortak shadcn kart/form/buton desenlerine geçir
- [x] `public/locales/{en,tr,ru,kg}/common.json` kataloglarını tek kanonik
      translation workspace olarak envanterle
- [x] Dosya kataloglarını immutable varsayılan bırakıp PostgreSQL translation
      override modeli ve migration'ını ekle
- [x] Public next-intl yükleyicisini statik katalog + doğrulanmış database
      override birleşimine geçir
- [x] EN/TR/RU/KY çeviri tamlığı ve custom override özet kartlarını ekle
- [x] Translation anahtarlarını section ve görünür metinle arama/filtreleme
      akışını geliştir
- [x] Dört dili aynı satırda düzenleyen shadcn accordion/card/textarea
      deneyimini ekle
- [x] Locale bazında `public/locales` varsayılanına tek tıkla dönme akışını ekle
- [x] ICU argüman koruması, key güvenliği, editör yetkisi, atomik audit ve
      public cache invalidation sınırlarını tamamla
- [x] Dashboard yollarını public consent banner ve Google analytics'ten ayır
- [x] Oturumlu Dashboard translation arama, satır açma ve varsayılana dönme
      akışını desktop/mobile gerçek tarayıcıda doğrula
- [x] Mobil sidebar'ı Radix dialog odak hapsi, inert arka plan, görünür focus ve
      `aria-expanded` sözleşmesiyle tamamla
- [x] Dashboard'da consent bootstrap, dataLayer ve public structured-data
      runtime'ını tamamen kapat
- [x] Shared-element transition adlarında internal UUID yerine public slug
      kullan
- [x] Native route transition çağrısı ve UA animasyonlarını production Chromium
      üzerinde doğrudan doğrula

## 10. Final veri bütünlüğü ve üretim denetimi

- [x] Destructive V2 migration'lardan önce legacy medya/içerik eşleşmesini
      fail-closed doğrulayan preflight ekle
- [x] Dashboard editor upsert'inin `OWNER` ve `ADMIN` rollerini düşürmesini
      engelle
- [x] Inquiry label limitini PostgreSQL constraint'iyle birebir hizala
- [x] Production veri envanterine tüm V2 içerik, revision, inquiry ve operasyon
      tablolarını ekle
- [x] Kullanılmayan eski `/api/cms/contact-info` yüzeyini tamamen kaldır
- [x] Legal sayfa semantiği, metadata, localized 404 ve frame LCP önceliğini
      düzelt
- [x] Playwright'ı gerçek standalone output ile çalıştıran test sunucusu ekle
- [x] CI container smoke kontrolünü gerçek S3-compatible bucket ve `/api/ready`
      üzerinden çalışacak şekilde geliştir
- [x] Production runbook'u Dashboard auth ve one-way V2 rollback sözleşmesiyle
      güncelle
- [x] Full lint, typecheck, unit/integration coverage, build ve Playwright
      kapılarını yeniden geçir
- [x] Docker image build ve local `/api/ready` smoke kanıtını yeniden al
- [x] Coolify, Garage, Resend ve production secret işlemlerini en son tamamla

## 11. Kaynaklı içerik, locale fallback ve public deneyim turu

- [x] About içeriğini doğrulanmış sanatçı biyografisi ve sergi geçmişiyle dört
      dilde güçlendir
- [x] Demo/placeholder Journal ve public editorial metinlerini kaynaklı, tutarlı
      içerikle değiştir
- [x] Public hero yüksekliği, görsel alanı ve metin başlangıcını desktop/mobile
      tüm route'larda ortak ritme getir
- [x] Header'da Collectors yerine Studio linkini göster; Collectors'ı footer'a
      taşı
- [x] Public route'ların tamamı için görünür iç-link erişilebilirliğini denetle
- [x] Home, Collections, About ve Contact dışındaki hero medyalarını doğrulanmış
      Instagram/Garage eserleriyle değiştir
- [x] Work detail'de tek medya görünümünü koru; iki veya daha fazla medyada
      erişilebilir carousel göster
- [x] Liste ve detail sorgularına `seçili dil → İngilizce → ilk yayımlanmış dil`
      fallback zincirini ekle
- [x] Fallback içerikte seçili locale URL/kabuğunu koru; içerik `lang`,
      canonical ve hreflang değerlerini gerçek içerik diline bağla
- [x] Commission FAQ alanını animasyonlu shadcn Accordion'a geçir
- [x] Public yüzeylerde uygun olduğu halde kullanılmayan shadcn primitive'lerini
      denetle ve yalnız işlevsel karşılığı olanları standardize et
- [x] `mucahidyazar@gmail.com` için local Dashboard magic-link girişini gerçek
      Chrome oturumunda tamamla ve `/dashboard`u hazır bırak
- [x] RED/GREEN testleri, coverage, lint, typecheck, build ve desktop/mobile
      browser doğrulamasını tamamla

## 11. Dinamik diller, medya yöneticisi ve Dashboard kullanıcıları

- [x] Deployment hariç Dashboard tamamlama tasarımını onaylı kararlarla
      `docs/plans/2026-08-11-dashboard-completion-design.md` içinde sabitle
- [x] Dinamik dil, İngilizce fallback, medya klasörleri ve kullanıcı davet
      mimarisini kullanıcıyla onayla
- [x] Güvenli rol sözleşmesini onayla: EDITOR düzenler/taşır, OWNER/ADMIN siler
- [x] Resend tek kullanımlık magic-link kullanıcı davet akışını onayla
- [x] `SiteLocale` registry modelini, migration'ını ve EN/TR/RU/KY başlangıç
      kayıtlarını TDD ile ekle
- [x] Dinamik locale doğrulama, prefixsiz İngilizce routing, selector, sitemap
      ve hreflang sözleşmesini tamamla
- [x] UI translation workspace'i dinamik dil sayısına uygun hale getir
- [x] Dashboard'dan dil ekleme, sıralama, preview, etkinleştirme ve devre dışı
      bırakma akışını geliştir
- [x] Editoryal kayıtları stable translation group ile bağla
- [x] Eksik editoryal çeviride İngilizce fallback ve doğru canonical davranışını
      geliştir
- [x] Translation inputlarını kompakt, iki satırlık ve erişilebilir editöre
      dönüştür
- [x] Sidebar logo altındaki `Studio` metnini kaldır ve iki header'ı ortak 64px
      yükseklikte hizala
- [x] PostgreSQL sanal medya klasörü ve mutable display-name modellerini ekle
- [x] Media grid, liste ve desktop/icon görünümlerini ortak selection modeliyle
      geliştir
- [x] Media upload kartını kaldır; header sağına tıklama/drag-drop destekli,
      hover/focus/drag-over durumları belirgin düzensiz quatrefoil dropzone ekle
- [x] Tüm medya görünümlerinde klasörleme, sağ tık/ellipsis, rename ve
      drag-and-drop akışlarını tamamla
- [x] Kullanılan medya ve dolu klasör silme korumasını; OWNER/ADMIN silme
      sınırını tamamla
- [x] `/dashboard/users` owner/admin yönetim sayfasını oluştur
- [x] Resend daveti, rol değiştirme, askıya alma, erişim kaldırma ve daveti
      yeniden gönderme akışlarını tamamla
- [x] Son OWNER'ın eşzamanlı silinme/askıya alınma/yetki düşürme korumasını
      tamamla
- [x] Dashboard mutasyonlarını ortak ve hassas veri içermeyen audit
      sözleşmesiyle envanterle; eksik action loglarını tamamla
- [x] `/dashboard/activity` owner/admin sayfasını tarih, kullanıcı, işlem ve
      hedef filtreleriyle geliştir
- [x] `mucahidyazar@gmail.com` hesabını local PostgreSQL'de OWNER yap
- [x] Yeni dil, üç medya görünümü ve kullanıcı yönetimini desktop/mobile gerçek
      tarayıcıda doğrula
- [x] Değişen kapsam coverage'ini en az `%80`; full lint, typecheck, test, E2E,
      build ve audit kapılarını geçir
- [x] Coolify ve production deployment işlemlerini bu geliştirmeler tamamen
      doğrulandıktan sonra en son yap

## 12. Kaynaklı gerçek içerik ve runtime regresyonları

- [x] Eski Instagram entegrasyonunun Apify tabanlı güvenli sync akışı olduğunu
      doğrula; token ve kullanıcı adını loglamadan local env'den kullan
- [x] Local PostgreSQL'deki 50 Instagram kaydını ve READY/PUBLIC Garage medya
      eşleşmelerini envanterle
- [x] Şüpheli ölçü, başlıksız paylaşım ve değişmiş caption'ı fail-closed
      reddeden kaynak manifestini TDD ile ekle
- [x] 18 doğrulanmış eseri fiyat taşımadan immutable revision, Garage placement,
      source audit ve Studio'dan düzenlenebilir kayıt olarak local DB'ye ekle
- [x] Gerçek içerik seed'inin ikinci çalıştırmada `0 created / 18 preserved`
      olduğunu ve Studio düzenlemelerini ezmediğini doğrula
- [x] Public Works ve gerçek eser detayını tarayıcıda Garage görseli, SEO ve
      inquiry formuyla doğrula
- [x] Work detail inquiry formunu ortak public container içine al
- [x] Prisma dev hot-reload cache'ini yeni delegate'ler eksikse güvenli yeniden
      oluşturacak biçimde düzelt
- [x] Consent default/update bootstrap'ını React script ağacından çıkar; GTM
      yüklenmeden önce çalışan idempotent istemci başlangıcına taşı
- [x] `/tr/contact` locale regresyonunu düzelt; URL locale'ini header, seçici,
      metadata ve sayfa metninin tek kaynağı yap
- [x] Public header active-link border'ını route değişiminde eski sayfadan
      taşınmadan anlık güncelle
- [x] Open.kg, B'Art, TURKSOY, eski bekten.art ve bağımsız yayınlardan
      doğrulanan biyografi/sergi/press kayıtlarını kaynak URL'leriyle Studio'ya
      ekle

## 13. Deployment öncesi son güvenlik ve ölçek doğrulamaları

- [x] Dashboard veri okuyan tüm leaf sayfalarına sorgudan önce bağımsız rol ve
      oturum doğrulaması ekle
- [x] Magic-link request gövdesini parse etmeden önce 16 KiB ve content-type
      sınırını uygula
- [x] Güvenilir proxy IP çözümlemesini sağdaki son geçerli hop ile sınırla ve
      Coolify sözleşmesini production runbook'una ekle
- [x] Kaldırılan public parola girişinin hash/reset kolonlarını Prisma şeması,
      kod ve local PostgreSQL'den temizle
- [x] Dashboard girişinde `last_sign_in_at` ve audit kaydını atomik güncelle
- [x] Dinamik locale'lerde Dashboard koruması, eksik çeviri aktivasyon kapısı,
      canonical/noindex, sitemap ve hreflang fallback kurallarını tamamla
- [x] CI E2E için kişisel hesaptan bağımsız, tekrar çalıştırılabilir test
      fixture seed'i ekle
- [x] Media Library'ye klavyeyle menü dolaşımı, klasöre taşıma, güvenli rename
      dialog'u ve cursor tabanlı eski medya yükleme akışı ekle
- [x] Activity sayfasında servis limitini aşan sayfa numaralarını güvenle
      sınırla
- [x] Resend/Svix URL-safe webhook secret biçimini startup ve readiness
      validatorlerinde doğrula
- [x] Final lint, typecheck, coverage, build, audit ve Playwright kapılarının
      tamamını son revision üzerinde yeniden geçir
- [x] Kullanıcı son local kontrolünü yaptıktan sonra Coolify/deployment
      işlemlerini ayrı ve son adım olarak uygula

## 15. Production teslim kanıtı — 2026-08-12

- [x] Exact `main` revision `6f0446a7e555511735116a81d5dcc9936f3ab77c` Coolify
      üzerinde yeniden deploy edildi ve healthy duruma ulaştı
- [x] Yalnız `NEXT_PUBLIC_APP_URL` ve Google ölçüm/container kimliklerini
      build-time bırakarak bütün veritabanı, auth, Garage, Resend ve operasyon
      sırlarını runtime-only yaptım
- [x] Auth, outbox, Resend, Garage ve Apify production credential'larını
      döndürdüm; eski Bekten Garage production anahtarlarını kaldırdım
- [x] `bekten-art-private-media` bucket'ının website erişiminin kapalı, yeni
      production anahtarının yalnız read/write ve owner olmadan yetkili olduğunu
      doğruladım
- [x] `/api/health` ve `/api/ready` için `200`; configuration, database, email
      ve object storage kontrolleri için `ok` kanıtı aldım
- [x] Public dört locale, prefixsiz İngilizce, `/en` redirect'i, Dashboard auth
      redirect'i ve gerçek Garage WebP medya yanıtını production üzerinde
      doğruladım
- [x] Coolify outbox ve retention scheduled task'lerini manuel çalıştırıp
      `Success` sonucunu doğruladım
- [x] Production Dashboard magic-link isteğini yeni Resend anahtarıyla
      gönderdim; teslimatı ve `email.sent` / `email.delivered` webhook başarı
      olaylarını doğruladım
- [x] Yeni Apify tokenıyla production Instagram Actor smoke run'ını bir sonuçla
      başarıyla tamamladım
- [x] Deploy öncesi PostgreSQL backup'ını repository dışında sakladım ve izole
      PostgreSQL 17 restore testini tamamladım:
      `c867cf9e5883ff613309b894c1b6065cc226ab14621440d2bede4c2930615423`
- [x] Final kapılarda 178 test dosyası / 1049 test, `%88.76` statement, `%80.75`
      branch, `%90.37` function, `%90.04` line coverage; lint, typecheck,
      production build ve `pnpm audit` temiz geçti
