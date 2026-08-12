# Public Content Consistency Design

## Amaç

Bekten.art public yüzeyini doğrulanmış sanatçı bilgisi, gerçek Garage medyası,
tutarlı hero ritmi ve locale bağımsız eksiksiz bir arşiv deneyimiyle tamamlamak.

## İçerik

- Biyografi; Open.kg, mevcut bekten.art kaydı ve doğrulanmış sergi haberlerinden
  kısa, kaynak-temelli bir anlatıya dönüştürülecek.
- Journal ve diğer seeded editorial metinlerdeki "demo" ifadeleri kaldırılacak;
  yalnız doğrulanabilen eğitim, öğretmenlik, üretim ve sergi bağlamı kullanılacak.
- Seed yeni kurulumların varsayılanını oluşturacak; mevcut local deterministic
  kayıtlar audit'li tek seferlik refresh ile güncellenecek.

## Locale fallback

Editorial reader aynı translation group içindeki varyantları `requested → en →
first published locale` önceliğiyle seçer. Liste sonuçları bütün yayımlanmış
kimliklerin birleşimidir; böylece diller arasında eser sayısı değişmez. Fallback
içerik seçilen locale URL'sinde gösterilir, içerik dili semantik `lang` ile
işaretlenir ve canonical gerçek kaynak locale'e gider.

## Görsel sistem

- Bütün public landing hero'ları aynı desktop yüksekliği ve aynı mobile medya/
  metin ritmini kullanır; kısa ve uzun başlıklar alanı büyütmez.
- Home, Collections, About ve Contact istisnadır. Diğer hero yerleşimleri
  doğrulanmış Instagram medyalarından deterministik olarak seçilir.
- Work detail tek görselde bugünkü layout'u korur. Çoklu görselde shadcn tarzı
  carousel aynı framed media alanını kullanır; sayaç, önce/sonra, thumbnail,
  keyboard, swipe ve reduced-motion desteği verir.

## Navigasyon ve bileşenler

Header: Home, Collections, About, Works, Studio, Contact. Collectors footer'a
taşınır. Exhibitions, Journal, Press, Availability, Commission ve Private
Viewings görünür footer/home bağlantılarıyla erişilebilir kalır.

Commission FAQ mevcut native details yerine yerel shadcn Accordion ile kurulur.
Mobil header details'i no-JS/semantik menü davranışı olduğu için Accordion'a
çevrilmez.

## Doğrulama

Reader fallback ve SEO için unit/integration; carousel, header/footer, hero ve
accordion için RTL; locale eşitliği, keyboard, mobile/desktop hero geometrisi
ve Dashboard magic-link için Playwright/gerçek Chrome doğrulaması yapılır.
