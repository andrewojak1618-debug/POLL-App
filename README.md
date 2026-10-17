# Poll-App

Poll-App ist eine Webanwendung zum Erstellen, Teilen und Beantworten von Umfragen. Sie soll Feedback zu unterschiedlichen Themen sammeln und Ergebnisse übersichtlich darstellen.

Das Projekt befindet sich in Entwicklung. Die Home-Seite zeigt aktuell lokale Beispielumfragen; die Ansicht zum Erstellen einer Umfrage enthält die ersten Eingabefelder.

## Funktionen

- Responsive Home-Seite für Desktop und mobile Geräte
- Animierte Handy-Illustration mit Berücksichtigung reduzierter Bewegung
- Übersicht aktiver und vergangener Umfragen
- Filterung nach sechs Themenkategorien
- Kombinierbare Status- und Kategoriefilter
- Highlight-Bereich für Umfragen, die innerhalb der nächsten 24 Stunden enden
- Regelmäßig aktualisierte zeitabhängige Anzeigen
- Scrollbare Umfrageliste
- Hover- und Fokuszustände für interaktive Elemente
- Navigation zur Ansicht „Create Survey“ und zurück über „Cancel“

## Ablauf

Auf der Home-Seite können Umfragen nach Status und Kategorie gefiltert werden. „Ending soon surveys“ hebt aktive Umfragen hervor, deren Endzeit innerhalb der nächsten 24 Stunden liegt.

Über „New survey“ öffnet sich die Ansicht „Create Survey“. Sie enthält die Umfragedaten, eine erste Frage mit zwei Antwortfeldern und den Cancel-Button. Eingaben lassen sich bearbeiten und leeren. Dynamische Fragen und Antworten sowie die Veröffentlichung folgen in weiteren Schritten.

## Technologien

- Angular
- TypeScript
- HTML und SCSS
- RxJS
- Supabase für die geplante Datenanbindung
- Vitest für automatisierte Tests

## Aufbau

Die Anwendung verwendet Angular-Komponenten und clientseitiges Routing. Die Home-Seite ist unter `/` erreichbar, die Ansicht zum Erstellen einer Umfrage unter `/create-survey`.

Die Umfrageübersicht, Kategorieauswahl und Highlight-Karten sind in eigene Komponenten aufgeteilt. Gemeinsam verwendete UI-Elemente liegen unter `src/app/shared/ui`; die Farbvariablen werden zentral in `src/styles/_colors.scss` gepflegt.

## Lokal starten

Voraussetzung sind Node.js und npm in einer mit Angular 22 kompatiblen Version.

```bash
npm install
npm start
```

Der Entwicklungsserver startet unter `http://localhost:4200/` und öffnet die Anwendung im Browser.

## Qualität prüfen

Automatisierte Tests ausführen:

```bash
npm test -- --watch=false
```

Produktions-Build erstellen:

```bash
npm run build
```

Die Build-Dateien werden unter `dist/poll-app` abgelegt.

## Projektstatus

Die Anwendung wird schrittweise erweitert. Die folgenden Punkte zeigen den aktuellen Funktionsumfang und die nächsten Schritte.

- [x] Home-Seite nach Figma gestalten
- [x] Mobile Home-Ansicht umsetzen
- [x] Illustration, Animationen und Hover-Zustände ergänzen
- [x] Aktive und vergangene Beispielumfragen filtern
- [x] Kategorieauswahl funktional machen
- [x] Innerhalb von 24 Stunden endende Umfragen hervorheben
- [x] Create-Survey-Grundlayout und Cancel-Navigation umsetzen
- [x] Formularfelder und erste Frage ergänzen
- [ ] Mehrere Fragen und dynamische Antwortmöglichkeiten ermöglichen
- [ ] Mehrfachauswahl je Frage ergänzen
- [ ] Eingaben validieren und Veröffentlichung umsetzen
- [ ] Umfragen dauerhaft in Supabase speichern und laden
- [ ] Einzelansicht und Teilnahme an Umfragen umsetzen
- [ ] Ergebnisse darstellen
- [ ] Vollständigen Ablauf auf Desktop und Mobilgeräten prüfen

## Design und Assets

Die Gestaltung orientiert sich am [Figma-Design „Poll-App-Design“](https://www.figma.com/design/yjKdGp9Z612bnRp2iayYe7/Poll-App-Design). Logo, Illustrationen und Icons sind als Projektdateien eingebunden. Für die Typografie werden Nerko One, Mulish und Nokora verwendet.
