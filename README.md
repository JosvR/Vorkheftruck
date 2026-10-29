# Heftruck Balanslab

Nederlandstalige, buildloze educatieve webapp met een SVG-heftruck, lastdiagram, stabiliteitsdriehoek, negen instelbare grootheden, uitleg bij acht factoren en zeven praktische opdrachten, waaronder twee afleesoefeningen met echte diagramgegevens. Open `dist/index.html` via een statische webserver. Voortgang wordt alleen lokaal opgeslagen.

## Validatie

`node check-model.cjs` controleert belangrijke fysische verbanden en de haalbaarheid van de oefeningen. `node --check dist/app.js` controleert JavaScript-syntaxis.

## Model

Zie `dist/model.js` en de modeldialoog voor aannames en eenheden. De fictieve nominale capaciteit en hoogtecorrectie zijn onderwijsvoorbeelden; geen fabrikantgegevens. Het model berekent het gezamenlijke massazwaartepunt, een quasi-statische krachtprojectie en een getekende afstand tot de drie randen van het steunvlak. Er is geen simulatie van glijden, trillingen of lastverlies.

Bronnen voor de principes:

- https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.178AppA
- https://www.osha.gov/etools/powered-industrial-trucks/operating-forklift/load-handling


## Weergave en deelnemen

Standaardtekst is groter en vet; de knop Groepsscherm vergroot de lesweergave verder. Op telefoons kan de actuele figuur worden vergroot. De QR-code opent `/#oefenen`. Voortgang wordt alleen op het eigen apparaat bewaard.

Bij een langshelling draaien de vloer, heftruck en geometrische meetlijnen samen. De labels blijven horizontaal leesbaar. De zwaartekrachtprojectie blijft bij stilstand verticaal in het wereldbeeld. Positieve waarden betekenen dat de lastzijde neerwaarts staat; negatieve waarden betekenen opwaarts. Het bovenaanzicht verwijst voor de hellingshoek naar het zijaanzicht.

Het label van het gezamenlijke zwaartepunt staat boven de heftruck met een doorlopende verwijslijn. De illustratieve vooroverbeweging draait om de vooras en stopt zodra de vork de vloer raakt. Dat neemt het berekende kantelmoment niet weg. Bij lage vorken en mastneiging wordt de minimumhoogte door vloercontact begrensd; zowel de tekening als de massaposities gebruiken dezelfde geometrie.

Op telefoons blijft de compacte figuur zichtbaar boven de bediening. Een keuzelijst toont één van de negen instellingen tegelijk, direct bij de afbeelding. Legenda en toelichting staan daaronder. Bij oefeningen wordt de relevante instelling geselecteerd; vastgezette instellingen zijn ook in de keuzelijst uitgeschakeld.

Het ongewijzigde logo van Deltalinqs Training & Services is afkomstig van de officiële website: https://www.deltalinqstraining.nl/templates/standaard/images/logo.png .

## Stabiliteitspiramide

Beide aanzichten tonen een blauwe doorsnede van een schematische stabiliteitspiramide op de hoogte van het gezamenlijke zwaartepunt. In het zijaanzicht beweegt het vlak omhoog en wordt het kleiner; het bovenaanzicht en de kleine driehoek tonen hetzelfde vlak van bovenaf. De grijze gestippelde basis tussen de drie steunpunten blijft onveranderd. Markeringen in het bovenaanzicht horen bij de vloerprojectie en worden niet getoetst aan het blauwe vlak.

De tekening gebruikt een vaste top op 5,5 m boven het midden van de vooras, met lineaire doorsneden. Deze hoogte en verkleining zijn didactische tekenkeuzes, geen fabrikantgegevens, restcapaciteit, veiligheidspercentage of nieuwe kantelgrens. Ze veranderen de berekende momenten, krachtprojectie en marge op de vloer niet. De doorsnede volgt de gezamenlijke zwaartepunthoogte, inclusief de invloed van lastgewicht en mastneiging.

Conceptbron: EPRI, *Material Handling Application Guide* (2012), §5.1.3, figuur 5-12, gedrukte pagina 5-10 (PDF-pagina 84): https://restservice.epri.com/publicdownload/000000000001025240/0/Product . De afbeeldingen zijn eigen SVG-tekeningen; het bronbeeld is niet gekopieerd.

## Lastdiagrammen

Opdracht 6 gebruikt het door Jos aangeleverde Deltalinqs-trainingsdiagram, inclusief een vergrootbare originele afbeelding met typeplaat. De getekende 4.000 mm-lijn wordt bij een lastafstand van 1.000 mm afgelezen als ongeveer 1.500 kg (tolerantie 25 kg vanwege de grafische aflezing). Er wordt niet gesteld dat dit diagram bij de afgebeelde Yale-typeplaat hoort.

Opdracht 7 gebruikt de exacte gepubliceerde restcapaciteitstabel voor de Toyota Traigo 48 9FBEK16T: https://toyota-forklifts.eu/guides/residual-capacity-guide/ . Er wordt niet geïnterpoleerd. De tabel is geen capaciteitstabel voor het fictieve simulatiemodel.
