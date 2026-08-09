# Bekten Art production dönüşümü

Bu liste yalnız bir yapılacaklar özeti değildir: bir madde ancak ilgili test,
komut veya dış sistem doğrulaması başarıyla tamamlandığında `[x]` yapılır.

## Mimari kararlar ve değişmezler

- [x] ADR-001: Next.js tek uygulama + Prisma/PostgreSQL korunacak; Heremio'nun
      repository/service/handler sınırları taşınacak, Drizzle/monorepo
      kopyalanmayacak
- [x] ADR-002: `SectionData` tek seferde silinmeyecek; typed domain tabloları
      additive migration ve doğrulanmış backfill ile devreye alınacak
- [x] ADR-003: Stable auth hattı `next-auth@4.24.15` +
      `@next-auth/prisma-adapter@1.0.7` olacak; v5 beta API bırakılacak
- [x] ADR-004: Garage private ve Bekten'e özel bucket/key kullanacak; DB'de
      provider-neutral object key/checksum metadata tutulacak
- [x] ADR-005: Public URL modeli locale-prefix `always` (`en`, `tr`, `ru`, `ky`)
      olacak; canonical/hreflang/sitemap/breadcrumb tek helper kullanacak
- [x] Mevcut 17 kullanıcı değişikliğini reset/revert etmeden koru
- [x] Her veri/storage migrationından önce doğrulanmış backup ve envanter al
- [x] Secret değerlerini hiçbir dosya, terminal çıktısı veya rapora yazmadan
      Coolify secret store içinde yönet

## Faz 0 — Baseline ve veri güvenliği

- [x] Baseline envanteri tamamla
  - [x] Mevcut worktree değişikliklerini gözden geçir ve korunacakları netleştir
  - [x] `heremio` referans projesindeki auth, database, storage, admin ve
        operasyon mimarisini çıkar
  - [x] Production hedef mimarisini bu repo için netleştir
  - [x] Ayrıntılı tasarım kaydını
        `docs/plans/2026-08-09-production-transformation-design.md` altında
        oluştur
  - [x] Başlangıç RED kanıtını al: 5 eksik sözleşme suite'i başarısız, mevcut 14
        test başarılı
  - [x] İlk GREEN kapısını geç: 7 suite / 45 test başarılı
  - [x] Production DB tablo/kayıt sayılarını secrets içermeyen envantere kaydet
        (users=9, sections=6, section_data=30, uploaded_files=50)
  - [x] PostgreSQL custom-format dump al; manifest üret ve izole PostgreSQL 17
        üzerinde restore ederek 9/30/50 kayıt sayılarını doğrula
  - [x] Eski medya metadata envanterini çıkar (50 kayıt, 14.799.786 byte);
        kaynak servis son cutover öncesinde silindiği için nesne gövdelerinin
        geri alınamadığını Coolify kaynak listesi ve bağlantı kontrolüyle
        doğrula
  - [x] Coolify/Garage/Resend yapılandırmalarının secret içermeyen snapshot'ını
        tamamla

## Faz 1 — Test, CI ve güvenlik kapıları

- [x] Vitest, React Testing Library, Playwright ve axe bağımlılık/konfigürasyon
      temelini kur
- [x] Coverage eşiklerini branch/function/line/statement için %80 yap
- [x] Safe redirect, locale URL, production env, Garage ve Resend testlerini
      RED→GREEN tamamla
- [x] Auth JWT/session ve authorization testlerini RED→GREEN tamamla
- [x] SSRF private IP/DNS/redirect/timeout/size testlerini RED→GREEN tamamla
- [x] Profil IDOR regression/integration testini RED→GREEN tamamla
- [x] SEO robots/sitemap/canonical/hreflang testlerini RED→GREEN tamamla
- [x] Accessibility component ve Playwright+axe testlerini RED→GREEN tamamla
- [x] CI'da lint/typecheck/test/coverage/build/audit/Docker smoke kapılarını
      zorunlu yap

## Faz 2 — Garage ve medya geçişi

- [x] Storage katmanını tamamen Garage’a taşı
  - [x] Mevcut eski-provider upload/delete akışlarını tespit et
  - [x] Garage için S3-compatible storage istemcisini ekle
  - [x] Ortam değişkenlerini Garage uyumlu hale getir
  - [x] Upload route’larını Garage ile çalışacak şekilde değiştir
  - [x] Media URL üretimini güvenli ve tutarlı hale getir
  - [x] Eski medya servisi bağımlılığını, cutover scriptini, env sözleşmesini ve
        Docker startup kopyasını kaldır
  - [x] Veri modeli ve migration’ları Garage depolama kayıtlarını yansıtacak
        şekilde güncelle
  - [x] MIME allowlist, dosya boyutu, magic-byte, checksum ve image metadata
        stripping uygula
  - [x] Same-origin/presigned upload ve object-key traversal sınırlarını test et
  - [x] Dual-read/backfill migration provasını çalıştır
  - [x] Kaynak servis daha önce silindiğinden checksum eşitliğinin mümkün
        olmadığını doğrula; mevcut metadata/DB backup'ını koru ve yeni medya
        için Garage checksum doğrulamasını zorunlu tut
  - [x] PostgreSQL restore rollback yolunu doğrula ve erişilemeyen eski-provider
        runtime/env/schema kalıntılarını kaldır

## Faz 3 — Typed backend ve Supabase temizliği

- [x] Supabase uyumluluk katmanını tamamen kaldır
  - [x] `src/utils/supabase` kullanım noktalarını kaldır
  - [x] Section, store, workshop, artist, memories, testimonial, news ve auth
        veri erişimlerini Prisma/typed repository yapısına taşı
  - [x] TODO/placeholder Supabase action’larını gerçek implementasyonlarla
        değiştir
  - [x] Supabase import/export ve artık scriptleri temizle

- [ ] Database/backend mimarisini iyileştir
  - [x] Heremio’daki repository/service/handler ayrımından uygun olan yapıyı bu
        projeye uyarla
  - [x] Ortak database erişim katmanını tanımla
  - [x] Domain odaklı server modülleri oluştur
  - [x] Transaction kullanan yazma akışlarını standartlaştır
  - [x] Yetki kontrollerini veri erişim sınırında uygula
  - [x] `Artwork`, `NewsArticle`, `PressItem`, `Testimonial`, `WorkshopItem`,
        `Memory`, `ArtistStat`, `ContactInfo`, `Feedback`,
        `NewsletterSubscriber`, `MediaObject`, `AuditEvent`, `OutboxJob` typed
        modellerini ekle
  - [x] `SectionData` verisini typed tablolara idempotent backfill et ve canlı
        startup logunda 30 legacy satır / 4 locale için typed sayıları doğrula
  - [x] DB tabanlı rate-limit, audit ve outbox repository'lerini ekle

## Faz 4 — Authentication ve uygulama güvenliği

- [x] Auth katmanını production-grade hale getir
  - [x] NextAuth’u daha güvenli/stabil sürüme güncelle
  - [x] JWT callback/session bug’ını düzelt
  - [x] Google Auth entegrasyonunu best practice seviyesine getir
  - [x] Login/register rate limit ve abuse korumalarını ekle
  - [x] Redirect güvenliğini düzelt
  - [x] Profil/oturum/rol tiplerini güvenli hale getir
  - [x] IDOR ve yetki açıklarını kapat
  - [x] E-posta doğrulama, password reset, token expiry/replay ve generic error
        akışlarını tamamla
  - [x] Admin mutation'ları için recent-auth/origin guard uygula
  - [x] Register akışındaki otomatik verification'ı kaldır
  - [x] Link preview SSRF açığını private ağ, redirect ve response limitleriyle
        kapat

## Faz 5 — Google, Resend ve diğer entegrasyonlar

- [x] Google servis entegrasyonlarını iyileştir
  - [x] Google OAuth akışını güçlendir
  - [x] GTM entegrasyonunu consent ve environment guard ile güncelle
  - [x] GA/GTM yardımcılarını sadeleştir ve doğrula
  - [x] Site verification ve metadata entegrasyonlarını güncelle

- [ ] Resend e-posta altyapısını kur
  - [x] Resend oturumunda `mucahid.dev` domain doğrulamasını teyit et
  - [x] Sadece Bekten Art için sınırlandırılmış Resend API anahtarı oluştur
  - [x] Uygulama içi mailer katmanını ekle
  - [x] Support/gerekli operasyon adreslerini yapılandır
  - [x] Contact/notification/auth maillerini bağla
  - [x] Browser üzerinden Resend yapılandırmasını tamamla
  - [ ] Sender ile inbound mailbox ayrımını doğrula; çalışan reply-to adresiyle
        gerçek teslimat testi yap
  - [x] Contact, newsletter ve auth e-postalarını outbox/idempotency ile bağla
  - [x] Resend webhook imza doğrulama, idempotency ve bounce/complaint
        suppression akışını kodla ve test et
  - [x] Resend webhook signing secret'ını production ortamına secret olarak ekle
  - [ ] Gerçek Resend webhook teslimatını production üzerinde doğrula
  - [x] Apify/Instagram çağrılarına timeout, retry/backoff, validation ve
        gözlemlenebilir hata ekle

## Faz 6 — Gerçek admin ürünü

- [x] Admin dashboard’u oluştur ve eksikleri kapat
  - [x] Heremio admin dashboard yapısını incele
  - [x] Bu proje için gerekli admin özet metriklerini belirle
  - [x] Kullanıcılar, içerik, iletişim, medya ve sistem durumu ekranlarını
        oluştur
  - [x] Mock/coming soon/placeholder alanlarını kaldır
  - [x] Admin guard ve navigation akışlarını tamamla
  - [x] Overview metrikleri ve activity'yi gerçek repository'ye bağla
  - [x] Content, Media, Users, Contact, Email, System ve Audit modüllerine
        filtre/sayfalama/empty state ekle
  - [x] Admin bootstrap/owner hesabını seed ve env yerine veri/yetki modeliyle
        çöz

## Faz 7 — SEO, locale, accessibility ve performans

- [x] SEO sorunlarını tamamen gider
  - [x] `robots.txt` ve `sitemap.xml` route/matcher sorunlarını çöz
  - [x] Canonical URL üretimini sayfa bazlı düzelt
  - [x] Locale URL, hreflang ve sitemap stratejisini düzelt
  - [x] Sayfa bazlı metadata üretimini iyileştir
  - [x] H1/heading yapısını düzelt
  - [x] Structured data sorunlarını gider
  - [x] Breadcrumb ve public path üretimini düzelt

- [x] Accessibility sorunlarını tamamen gider
  - [x] Skip link ve main landmark yapısını ekle
  - [x] Keyboard erişilemeyen interaktif öğeleri düzelt
  - [x] İsimsiz icon button/link problemlerini gider
  - [x] Form label/focus/aria eksiklerini düzelt
  - [x] Kontrast sorunlarını gider
  - [x] Reduced motion desteği ekle
  - [x] Carousel/video/iframe erişilebilirliğini düzelt
  - [x] Consent Mode v2 default-denied + update/revoke akışını uygula
  - [x] GTM içinde GA4 varsa duplicate pageview üretimini önle
  - [x] YouTube/marketing embed'ini consent ve kullanıcı etkileşimi öncesi
        yükleme
  - [x] Homepage sorgularını batch/parallel yap; news detayını targeted query'ye
        taşı
  - [x] Public requestlerde duplicate user fetch ve global Swiper/player
        maliyetini kaldır

## Faz 8 — Production operasyonları ve paketler

- [ ] Production readiness eksiklerini kapat
  - [x] Link preview SSRF açığını kapat veya mimariyi değiştir
  - [x] Upload validation ve içerik güvenliğini güçlendir
  - [x] Security headers, CSP ve HSTS ayarlarını ekle
  - [x] Env validation ve fail-fast kontrollerini ekle
  - [x] Health/readiness endpoint’lerini ekle
  - [x] Logging/monitoring için kod seviyesinde gerekenleri ekle
  - [x] Backup/migration/deploy akışlarını dokümante et ve koddan destekle
  - [x] Dockerfile ve release workflow’u düzelt
  - [x] Production startup'ta migration/backfill/media cutover sırasını ve
        graceful signal forwarding'i uygula
  - [x] Retention cleanup endpoint/job'unu bounded ve idempotent olarak ekle
  - [x] Retention cleanup production cron'unu yapılandır ve manuel ilk çalışmayı
        `Last run: success` ile doğrula

- [x] Kod kalitesi ve mimari borçları kapat
  - [x] Büyük dosyaları parçala
  - [x] Kullanılmayan bağımlılıkları kaldır
  - [x] Runtime/dev dependency ayrımını düzelt
  - [x] Lockfile ve package manager standardını netleştir
  - [x] README ve operasyon dokümanlarını güncelle
  - [x] Placeholder/mock verileri kaldır veya gerçek veri akışına bağla

- [x] Paket güncellemelerini yap
  - [x] Güvenlik ve patch/minor güncellemelerini batched şekilde uygula
  - [x] Riskli major geçişleri izole ele al
  - [x] Build/type/lint/test kırıklarını her batch sonrası düzelt
  - [x] `next-auth` beta'yı stable `4.24.15` hattına ve Prisma v4 adapter
        paketine pinle
  - [x] Runtime/test paketlerini latest batch ile güncelle; uyumsuz TypeScript
        7/ESLint 10'u framework peer aralığına geri pinle
  - [x] `pnpm audit` sonucunda reachable critical/high bırakma

- [x] Test ve doğrulama altyapısını tamamla
  - [x] Vitest/RTL/Playwright altyapısını kur veya güncelle
  - [x] Auth, SEO, upload, admin ve public akışlar için test ekle
  - [x] Coverage raporu üret; final kodda statement %90,12, branch %80,92,
        function %93,38 ve line %91,37 ile tüm eşikleri geçir
  - [x] Build, typecheck, lint, test ve smoke doğrulamalarını temiz geçir

- [ ] Browser tabları üzerinden dış sistem ayarlarını tamamla
  - [x] Coolify içindeki mevcut Bekten uygulaması, PostgreSQL ve Garage
        servislerini tespit et
  - [x] Resend oturumunu ve doğrulanmış domaini tespit et
  - [x] Garage üzerinde Bekten'e özel bucket ve erişim anahtarı oluştur
  - [x] Coolify içinde gerekli environment/deploy ayarlarını güncelle
  - [x] Resend domain ve sender ayarlarını tamamla
  - [x] Resend webhook ve outbox/retention cron ayarlarını Coolify üzerinde
        tamamla; outbox ve retention görevlerini `Last run: success` ile doğrula
  - [ ] Gerekirse Google servis ayarlarını doğrula
  - [ ] Coolify migration/startup/healthcheck/deploy ayarlarını doğrula
  - [ ] Bekten production deploy sonrası health/readiness ve kritik smoke
        akışlarını doğrula

## Faz 9 — Final doğrulama ve devir

- [ ] Final temizleme ve completion audit
  - [x] `progress.md` üzerindeki tamamlanmış maddeleri kanıta göre güncelle
  - [x] Son kod güvenlik/SEO/accessibility taramalarını çalıştır
  - [x] Son build/type/lint/test/e2e doğrulamasını çalıştır
  - [x] Runtime placeholder/mock/broken path olmadığını doğrula; form
        placeholder metinleri, test mock'ları ve tarihsel migration kayıtları
        dışında runtime kalıntısı bırakma
  - [ ] Goal completion için kanıtları topla
  - [x] `rg -i "TODO|mock|placeholder|supabase|legacy storage"` sonuçlarını tek
        tek temizle veya bilinçli istisna olarak belgele
  - [x] `pnpm lint`, `pnpm type-check`, `pnpm test:coverage`, `pnpm build`,
        Playwright E2E (48/48) ve Docker startup/health smoke'u aynı final kod
        üzerinde geçir
  - [ ] Lighthouse hedefleri: performance ≥85, accessibility/SEO/best-practices
        ≥95
  - [ ] Tüm checklist maddeleri `[x]` olmadan goal'i complete yapma
