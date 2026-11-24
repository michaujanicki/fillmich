# Fillmich

**Temat projektu:** Fillmich — aplikacja do zarządzania domową apteczką.

Projekt realizowany w ramach przedmiotu **Projekt Zespołowy 2026–2027**.

## Zespół i prace dyplomowe

### Michał Janicki

- Numer indeksu: 13446
- Promotor: Marcin Kacprowicz
- Proponowany temat pracy dyplomowej: Projekt i implementacja aplikacji do zarządzania domową apteczką z wykorzystaniem React i Node.js

### Filip Sosnowicz

- Numer indeksu: do uzupełnienia
- Promotor: do uzupełnienia
- Temat lub zakres pracy dyplomowej: do uzupełnienia

## Opis i cel projektu

Fillmich to domowa apteczka pomagająca uporządkować leki, kontrolować ich zapasy i terminy ważności oraz zapisywać plan przyjmowania. Aplikacja działa w przeglądarce i jest przygotowana również na Androida.

Celem projektu jest ułatwienie domownikom prowadzenia wspólnej ewidencji leków oraz korzystania z informacji pochodzących z Rejestru Produktów Leczniczych. Użytkownik może zapisywać informacje o opakowaniach i przypisywać je do osób, a także kontrolować codzienny plan dawek i stan zapasów.

## Podstawowe funkcjonalności

- Dodawanie leków do apteczki, edycja ich danych, zdjęć, stanu i terminu ważności.
- Wyszukiwanie produktów w Rejestrze Produktów Leczniczych oraz odczyt kodów z opakowań. Dostępność odczytu zależy od urządzenia i obsługi kodu.
- Przeglądanie ulotki dla pacjenta w aplikacji, jeśli rejestr udostępnia ją dla wybranego leku. Dostępne są zmiana stron i powiększenie; pobranie ulotki wymaga internetu.
- Aktualizacja lokalnej bazy rejestru w ustawieniach aplikacji.
- Przypisywanie leków do osób lub przechowywanie ich jako wspólnych, filtrowanie i wyszukiwanie w apteczce.
- Oznaczanie leków przeterminowanych i tych, których termin ważności upływa w ciągu 90 dni.
- Tworzenie codziennych planów dawkowania, oznaczanie przyjętych dawek i przeglądanie kalendarza. Po podaniu stanu tabletek aplikacja uwzględnia przyjęte dawki i szacuje, kiedy zapas może się skończyć.
- Jasny i ciemny motyw, zmiana rozmiaru tekstu oraz przewodnik po aplikacji.

Aplikacja nie wysyła obecnie przypomnień. Dane z kodu UI należy porównać z opakowaniem: Fillmich nie sprawdza jego autentyczności ani statusu sprzedaży lub wycofania. Dawkowanie należy ustalić z lekarzem lub sprawdzić w ulotce.

## Wymagania

- Node.js 22.15 lub nowszy (ewentualnie Node.js 22.13 lub nowszy z obsługą `node:sqlite` i opcji `--use-system-ca`).
- npm.
- Do wersji na Androida: Android Studio z Android SDK oraz urządzenie lub emulator z Androidem 8.0 (API 26) lub nowszym.

## Uruchomienie lokalne

W katalogu `fillmich` zainstaluj zależności i uruchom serwer:

```bash
npm install
npm run dev
```

Otwórz adres wyświetlony w terminalu, domyślnie [http://localhost:5173](http://localhost:5173). W systemie Windows w razie potrzeby użyj `npm.cmd` zamiast `npm`. Port można zmienić przez zmienną środowiskową `PORT`, na przykład w PowerShell:

```powershell
$env:PORT = '5188'
npm.cmd run dev
```

Przy pierwszym uruchomieniu serwer pobiera i importuje rejestr leków. Wyszukiwanie w rejestrze będzie dostępne po zakończeniu importu.

## Wersja produkcyjna

```bash
npm run build
npm start
```

Serwer udostępnia zbudowaną aplikację i API rejestru pod adresem lokalnym. Musi pozostać uruchomiony, aby wyszukiwanie w rejestrze działało.

## Android

Najpierw uruchom `npm run dev` i poczekaj na zakończenie pierwszego importu rejestru. Następnie zatrzymaj serwer i wykonaj:

```bash
npm run android:sync
npm run android:open
```

W Android Studio wybierz telefon lub emulator i uruchom aplikację przyciskiem **Run**. APK do ręcznej instalacji można zbudować przez **Build → Build Bundle(s) / APK(s) → Build APK(s)**.

### Podpisany pakiet release

Po synchronizacji otwórz projekt Androida i w Android Studio wybierz **Build → Generate Signed Bundle / APK**. Wybierz APK lub Android App Bundle, wskaż klucz wydawniczy, a następnie wybierz wariant **release** i zakończ budowanie. Aby zaktualizować aplikację już zainstalowaną na urządzeniu, podpisz nowy pakiet tym samym kluczem co poprzednie wydanie. Numer wersji i kod wersji są pobierane z `src/version.json`.

Polecenie `android:sync` przygotowuje grafikę aplikacji, eksportuje lokalną bazę rejestru, buduje aplikację i synchronizuje projekt Capacitor. Wyszukiwanie w zainstalowanej aplikacji korzysta z lokalnej kopii rejestru i nie wymaga serwera. Kopię można odświeżyć w ustawieniach aplikacji za pomocą przycisku **Sprawdź i aktualizuj**. Pobranie całego rejestru wymaga internetu i może zużyć dużo danych. Odczyt kodów ze zdjęć zależy od możliwości systemowej przeglądarki WebView.

## Dane i rejestr leków

Dane apteczki, osób, planów, historii dawek i ustawień są zapisywane lokalnie w `localStorage` przeglądarki lub aplikacji na urządzeniu. Nie są automatycznie synchronizowane między urządzeniami ani między przeglądarką komputera a aplikacją na telefonie. Wyczyszczenie danych aplikacji lub przeglądarki może je usunąć.

Serwer pobiera oficjalny [eksport Rejestru Produktów Leczniczych](https://rejestry.ezdrowie.gov.pl/rpl/search/public) i zapisuje go w lokalnej bazie SQLite `data/registry.sqlite`, niezależnie od danych apteczki. Sprawdza potrzebę aktualizacji co godzinę i podejmuje próbę odświeżenia po 24 godzinach od ostatniego udanego importu, gdy jest uruchomiony. W ustawieniach można również ręcznie pobrać aktualny rejestr. W razie błędu zachowywana jest poprzednia baza. Katalog `data` nie jest dodawany do repozytorium.

## Przydatne polecenia

| Polecenie | Działanie |
| --- | --- |
| `npm run dev` | Uruchamia serwer deweloperski. |
| `npm run build` | Buduje aplikację do katalogu `dist`. |
| `npm start` | Uruchamia serwer wersji produkcyjnej. |
| `npm run lint` | Sprawdza kod za pomocą Oxlint. |
| `npm run android:sync` | Przygotowuje i synchronizuje projekt Androida. |
| `npm run android:open` | Otwiera projekt w Android Studio. |

## Technologie

| Technologia | Zastosowanie |
| --- | --- |
| JavaScript, HTML i CSS | Logika aplikacji, struktura i wygląd interfejsu. |
| React | Budowa interfejsu użytkownika z komponentów. |
| Vite | Środowisko deweloperskie i budowanie interfejsu. |
| Node.js | Serwer HTTP, API wyszukiwania i import rejestru. |
| SQLite | Przechowywanie lokalnej kopii rejestru leków na serwerze. |
| XML i Saxes | Odczyt i przetwarzanie eksportu rejestru. |
| PDF.js | Wyświetlanie ulotek PDF w aplikacji. |
| Capacitor i Android Studio | Przygotowanie i uruchamianie aplikacji na Androidzie. |
| localStorage i IndexedDB | Lokalne przechowywanie danych apteczki oraz pobranej kopii rejestru na Androidzie. |

## Struktura projektu

Interfejs wykorzystuje React i Vite. Serwer działa na Node.js, korzysta z SQLite i importuje rejestr w formacie XML. Wersja na Androida jest oparta na Capacitorze.

- `src/` — interfejs, komponenty i logika aplikacji.
- `server/` — serwer HTTP, import rejestru i API wyszukiwania.
- `scripts/` — przygotowanie zasobów Androida i eksport rejestru.
- `public/` — zasoby statyczne.
- `android/` — natywny projekt Androida.

## Literatura i dokumentacja

1. [Dokumentacja React](https://react.dev/learn) — komponenty i budowa interfejsu użytkownika.
2. [Dokumentacja Vite](https://vite.dev/guide/) — uruchamianie i budowanie aplikacji.
3. [Dokumentacja Node.js](https://nodejs.org/docs/latest/api/) oraz [modułu SQLite](https://nodejs.org/api/sqlite.html) — środowisko serwera i dostęp do bazy danych.
4. [Dokumentacja SQLite](https://www.sqlite.org/docs.html) — baza danych rejestru.
5. [Dokumentacja Capacitor](https://capacitorjs.com/docs) oraz [Android Developers](https://developer.android.com/docs) — przygotowanie aplikacji na Androida.
6. [Rejestr Produktów Leczniczych](https://rejestry.ezdrowie.gov.pl/rpl/search/public) — źródło danych o produktach leczniczych.
7. [Dokumentacja Web Storage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage) i [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) — lokalne przechowywanie danych.
