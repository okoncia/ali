# BIST Analyzer Pro

Electron tabanlı macOS masaüstü uygulaması. Python, pip, Playwright veya Xcode kurulumu gerektirmeden GitHub Actions üzerinde `.dmg` üretir.

## Neler hazır?

- Kalıcı ve ayrı TradingView oturum penceresi
- BIST sembol CSV seçimi
- TradingView'den indirilmiş 1 saatlik OHLCV CSV klasörünü otomatik okuma
- 1 saatten 4 saatlik ve günlük mum üretimi
- Kıvanç Özbilgiç VIDYA: Close, Fixed CMO 9, CMO
- VIDYA 5/8/14/21/23 yön dönüşleri veya fiyat kesişimi
- VIDYA 28/34 ve 44/55 yukarı kesişimleri
- 7 puanlık skor
- EMA 5/8/14/21/23/28/34/44/55
- Excel: VIDYA, EMA, Hatalar ve Bilgi sayfaları
- GitHub Actions ile universal macOS DMG üretimi

## Önemli teknik gerçek

TradingView son kullanıcı aboneliği için desteklenen toplu tarihsel veri API'si sağlamaz. Bu nedenle uygulama şifreyi okuyup arka planda 616 hisseyi resmî API ile çekemez. TradingView penceresi hesabın oturumunu korur; grafik CSV'leri TradingView'den indirildikten sonra uygulama klasörü toplu işler. Web arayüzünü otomatik tıklayan çözümler kırılgandır ve hesap/arayüz değişikliklerine bağlıdır; bu ilk sürümde bilinçli olarak güvenilir hesaplama çekirdeği öne alınmıştır.

## Xcode olmadan DMG alma

1. Bu klasörü bir GitHub deposuna yükle.
2. GitHub'da **Actions** sekmesine gir.
3. **Build macOS DMG** iş akışını aç.
4. **Run workflow** seç.
5. İşlem tamamlanınca **Artifacts → BIST-Analyzer-Pro-macOS** paketini indir.
6. İçindeki `.dmg` dosyasını çift tıklayıp uygulamayı Applications klasörüne taşı.

Uygulama Apple Developer sertifikasıyla imzalanmadığı için ilk açılışta macOS'ta uygulamaya sağ tıklayıp **Aç** seçmek gerekebilir.

## CSV biçimi

Sembol dosyasında `Sembol` veya `Symbol` sütunu gerekir.

Her hisse veri CSV'sinde şu sütunların karşılığı bulunmalıdır:

- time/date/tarih
- open/açılış
- high/yüksek
- low/düşük
- close/kapanış
- volume/hacim

Dosya adında sembol geçmelidir; örnek: `THYAO_1h.csv`.
