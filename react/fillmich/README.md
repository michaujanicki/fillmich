# Fillmich

## Android

Potrzebne są Node.js 22.15 lub nowszy oraz Android Studio z Android SDK. Przy pierwszym uruchomieniu najpierw uruchom `npm.cmd run dev` i poczekaj na import rejestru. Następnie zatrzymaj serwer i wykonaj:

```powershell
npm.cmd run android:sync
npm.cmd run android:open
```

W Android Studio wybierz telefon lub emulator i uruchom aplikację przyciskiem Run. APK do ręcznej instalacji można zbudować przez **Build → Build Bundle(s) / APK(s) → Build APK(s)**. Wymagany jest Android 8 lub nowszy.

Polecenie `android:sync` tworzy z lokalnej bazy kopię rejestru i dołącza ją do aplikacji. Wyszukiwanie na telefonie nie wymaga serwera, ale rejestr odświeża się tylko przy ponownym przygotowaniu i zainstalowaniu aplikacji. Dane apteczki są lokalne dla telefonu i nie są automatycznie przenoszone z przeglądarki komputera. Odczyt zdjęć zależy od obsługi kodu przez systemową przeglądarkę WebView.

Domowa apteczka z wyszukiwaniem w Rejestrze Produktów Leczniczych.

## Uruchomienie

Wymagany jest Node.js 22.15 lub nowszy (Node.js 22.13 lub nowszy z obsługą `node:sqlite` i opcją `--use-system-ca`).

```powershell
npm.cmd install
npm.cmd run dev
```

Otwórz adres pokazany w terminalu, domyślnie http://localhost:5173. Jeśli port jest zajety, zatrzymaj poprzedni serwer lub ustaw inny: `$env:PORT='5188'; npm.cmd run dev`.

Przy pierwszym uruchomieniu serwer pobiera oficjalny eksport XML rejestru i importuje go do `data/registry.sqlite`. Wyszukiwanie będzie dostępne po zakończeniu importu. Serwer sprawdza potrzebę aktualizacji co godzinę i pobiera nową wersję po upływie 24 godzin od ostatniego udanego importu. Musi byc wtedy uruchomiony. W razie błędu pozostaje poprzednia baza. Folder `data` jest lokalny i nie jest dodawany do repozytorium.

Leki i osoby zapisane przez użytkownika pozostają w przeglądarce (localStorage), osobno od bazy rejestru.

Wersja produkcyjna: `npm.cmd run build`, a nastepnie `npm.cmd start`. Serwer musi pozostać uruchomiony, aby API wyszukiwania działało.
