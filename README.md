# frend-case: Valutakonverterer

Bygget en liten widget for å konvertere mellom valutaer ved hjelp av kurser fra Frankfurter API.

## Funksjonalitet

- Skriv inn beløp og velg fra- og til-valuta fra dynamiske nedtrekkslister
- Resultatet oppdateres umiddelbart ved input eller endring av valuta
- Hurtigknapper for 100, 500 og 1000
- Bytteknapp som snur fra og til
- Lastetilstand mens kurser hentes
- Forskjellige feilmeldinger for nettverksfeil, timeout, ingen kurs, og uventede feil

## Kjøre lokalt 

Du kan åpne index.html direkte i nettleseren, eller kjøre en lokal server hvis du foretrekker det. Jeg har brukt vscode live server og kan åpnes  på http://127.0.0.1:5500 hvis du velger det. 

## Filstruktur: 

index.html: Markup
style.css: Styling
app.js: All JS-logikk: API-lag, UI-lag, hovedlogikk
refleksjon.md

## Tekniske valg

Enkel html + css med Javascript funksjonalitet. 

Jeg henter listen fra /v2/currencies ved oppstart i stedet for å hardkode et utvalg.
Alle forventede feil mappes til en egen ApiFeil-klasse med koder definert i
et FEIL-konstantobjekt. UI oversetter koder til meldinger.

Uventede feil logges separat til konsollen så det er noe å feilsøke fra.

Detaljer og diskusjon av valg finnes i refleksjon.md.






