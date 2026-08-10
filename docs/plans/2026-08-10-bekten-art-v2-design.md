# Bekten.art V2 — Editorial Heritage Platform

**Durum:** Onaylandı  
**Tarih:** 10 Ağustos 2026  
**Kaynak:** `docs/references/` görsel referansları ve kullanıcı kararları

## 1. Amaç

Bekten.art, klasik bir portfolyo veya e-ticaret sitesi değil; Bekten'in eserlerini,
kültürel hafızasını ve üretim pratiğini koleksiyoner odaklı bir editoryal deneyimle
sunan dijital arşiv olacak. Public hesap sistemi kaldırılacak. Eser edinmek isteyen
ziyaretçi için satış/sepet yerine kişisel ve yüksek temaslı inquiry akışları
kullanılacak.

## 2. Değişmez kararlar

- Görsel yön **editorial heritage**: sıcak parşömen, kömür siyahı, pas kırmızısı,
  ölçülü altın, karakterli serif başlıklar ve sakin sans-serif gövde.
- Eser görselleri kompozisyonun ana unsuru; dekor, eserle yarışmayacak.
- Public login, kayıt, profil, kullanıcı menüsü, sepet, ödeme ve ürün dili yok.
- Dönüşüm akışları: **availability inquiry**, **commission request** ve
  **private viewing**.
- Harici CMS yok. PostgreSQL + Prisma + Garage + Resend mevcut platform
  sınırları olarak korunacak.
- İçerik yönetimi `/studio` altında, teknik olmayan editör için tasarlanmış
  **Bekten Studio** olacak.
- İlk V2, referansların düzenini göstermek için açıkça demo olarak yönetilen
  başlangıç içeriğiyle kurulabilir. Demo kayıtlar Studio'dan değiştirilebilir;
  gerçek içerik kontrolü bitmeden production yayınına alınmaz.
- `en`, `tr`, `ru`, `ky` locale modeli, SEO, accessibility ve consent
  gereksinimleri korunacak.
- Yeni dosya, klasör ve route URL adları kebab-case olacak.
- Kanonik ilerleme listesi `docs/progress.md`, karar günlüğü `docs/readme.md`
  olacak.
- Görsel ihtiyacında önce mevcut proje arşivi; yalnız eksik stil varlığında
  `gpt-image-2`, gerekli şeffaf kesimde background-removal akışı kullanılacak.

## 3. Bilgi mimarisi

### Public

- Home
- Collections / Collection detail
- Works / Work detail
- Available works
- Exhibitions / Exhibition detail
- Artist / Studio
- Journal / Journal detail
- Press & publications
- Collectors
- Commission a work
- Private viewings
- Contact / Inquiry
- Archive

Üst navigasyon yalnız birincil keşif yollarını taşıyacak. İkincil sayfalar footer
ve bağlamsal editoryal bağlantılarla erişilecek. Her public sayfa locale-prefix'li
canonical URL kullanacak.

### Bekten Studio

- Genel bakış
- Eserler
- Koleksiyonlar
- Sergiler
- Journal ve basın
- Sayfalar
- Medya kütüphanesi
- Inquiry gelen kutusu
- Taslaklar ve değişiklik geçmişi

Editör teknik model, sistem sağlığı, cron, outbox veya deployment terimleri
görmeyecek. Owner için operasyon araçları ayrı ve rol kontrollü bir alanda
kalacak.

## 4. Görsel sistem

- **Yüzey:** açık sıcak kâğıt, çok düşük kontrastlı grain ve çizim katmanları.
- **Mürekkep:** koyu kömür; tam siyah yalnız kritik kontrast için.
- **Vurgu:** logo, aktif çizgi ve küçük yönlendirmelerde pas kırmızısı.
- **Altın:** çerçeve/ayraç gibi nadir detaylarda; buton rengi olarak kullanılmaz.
- **Tipografi:** yüksek kontrastlı editoryal serif display + okunaklı nötr sans.
- **Grid:** desktop'ta 12 kolon; eser listelerinde 4 kolon, küçük ekranda tek
  kolon. Dikey ritim ve negatif alan korunur.
- **Hareket:** sakin reveal ve görsel geçişleri; reduced-motion altında kapalı.
- **İmza detayı:** dağ, yurt, at ve bozkır çizgileri yalnız atmosferik arka plan
  olarak kullanılır ve yardımcı teknolojilerden gizlenir.

## 5. İçerik ve domain modeli

Temel aggregate'ler `Artwork`, `Collection`, `Exhibition`, `JournalEntry`,
`PressEntry`, `Page`, `MediaObject`, `Inquiry` ve `ContentRevision` olacak.
İçerik locale bazlı alanlar, slug, sıralama, SEO verisi, görünürlük ve
`DRAFT | PUBLISHED | ARCHIVED` yaşam döngüsü taşıyacak.

Eser; ölçü, teknik, yıl, seri/koleksiyon, availability durumu, kapak ve galeri
medyası içerecek. Fiyat public modele alınmayacak. Inquiry kaydı tür, ilgili eser,
iletişim bilgisi, tercih edilen görüşme zamanı, locale, consent ve operasyon
durumunu taşıyacak.

## 6. Veri ve yayın akışı

1. Editör e-posta bağlantısıyla Studio'ya girer.
2. İçeriği taslak olarak oluşturur veya düzenler.
3. Garage'daki medyayı seçer/yükler, sıralar ve alternatif metin ekler.
4. Locale bazlı önizlemeyi açar.
5. Yayınlama transaction'ı doğrulanmış snapshot/revision üretir.
6. İlgili public route ve sitemap cache'i kontrollü biçimde yenilenir.
7. Geri alma, eski revision'ı mutasyona uğratmadan yeni revision olarak uygular.

## 7. Erişim modeli

Public hesap yoktur. Studio erişimi stabil NextAuth session/Prisma adapter
altyapısının yalnız e-posta provider'ı üzerinden, Resend ile gönderilen kısa
ömürlü, tek kullanımlık ve hash olarak saklanan magic-link tokenıyla sağlanır.
Credentials ve Google provider public auth ile birlikte kaldırılır. Kullanıcı
rolleri `EDITOR` ve `OWNER` ile sınırlandırılır. İçerik işlemleri server-side
authorization, same-origin/CSRF doğrulaması, rate limiting ve audit event
gerektirir. Teknik operasyonlar yalnız `OWNER` rolüne açıktır.

## 8. Inquiry ve e-posta akışı

Public formlar Zod ile doğrulanır, honeypot + DB rate-limit uygular ve inquiry ile
outbox işini aynı transaction'da oluşturur. Kullanıcı hızlı ve generic bir başarı
yanıtı alır. Resend gönderimi outbox dispatcher üzerinden idempotent yapılır;
hata halinde bounded retry uygulanır. Editör Studio'da talebi okuyabilir,
etiketleyebilir, not ekleyebilir ve durumunu değiştirebilir.

## 9. Hata, güvenlik ve mahremiyet

- Garage yüklemelerinde boyut, MIME, magic-byte, checksum ve güvenli object key.
- Draft ve private medya için public ACL kullanılmaz; süreli erişim üretilir.
- Hassas token/query değerleri analytics'e gönderilmez.
- Formlar hesap/record varlığını açığa çıkaran cevap vermez.
- Revision, audit ve inquiry PII için tanımlı retention/cleanup uygulanır.
- Studio hataları editöre sade mesaj; ayrıntılar structured server log olarak
  kaydedilir.

## 10. Geçiş stratejisi

Önce V1'e özel public auth, profil, store/satış dili, kullanıcı araçları ve eski
admin UI kaldırılır. Geçiş sırasında tekrar kullanılabilecek dosyalar `backup/`
altında kaynak yolunu koruyan geçici bir yapıya taşınır. İlk temizlik ayrı commit
olur. V2 doğrulanınca `backup/` tamamen silinir ve bu da final temizlik commit'ine
girer.

Veritabanı geçişleri additive başlayacak; production verisini yok eden migration
ancak V2 okuma/yazma yolları ve geri dönüş kanıtı hazır olduğunda yapılacak.

## 11. Test ve kabul kapıları

- Her domain değişikliği test-first RED → GREEN → refactor döngüsüyle yapılır.
- Unit ve integration coverage statements/branches/functions/lines için en az
  `%80`.
- Kritik E2E: public keşif, work detail → inquiry, commission, private viewing,
  editor magic-link, draft → preview → publish, revision restore, Garage upload.
- Axe/WCAG 2.1 AA, keyboard, reduced-motion ve responsive kontrolleri.
- Locale canonical/hreflang/sitemap ve structured data testleri.
- `lint`, `type-check`, unit/integration, coverage, build, E2E, audit ve Docker
  readiness aynı revision üzerinde yeşil olmadan V2 tamamlanmış sayılmaz.

## 12. Başarı ölçütü

Ziyaretçi Bekten'in dünyasını bir galeri kataloğu sakinliğinde keşfedebilmeli ve
satın alma baskısı olmadan kişisel temas başlatabilmeli. Teknik olmayan editör,
geliştirici yardımı almadan içerik ve talepleri güvenle yönetebilmeli. Public
yüzeyde V1 hesap/satış kalıntısı, sahte production içeriği veya teknik admin
detayı bulunmamalı.
