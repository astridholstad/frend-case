# Refleksjonsnotat 

Jeg valgte vanilla JS over React fordi oppgaven ikke belønner rammeverk. Det ga meg tid til feilhåndtering og UX i stedet. 

Frankfurter er CORS-aktivert og åpent, så en mellomlaget backend hadde bare duplisert async-håndtering. Jeg valgte v2 av API-et selv om v1 har innebygd konvertering, fordi v2 vedlikeholdes aktivt og det matcher at jeg henter valutalisten dynamisk fra /v2/currencies i stedet for å hardkode et utvalg. Default NOK til EUR siden brukstilfellet er norsk nettbutikk.

Feilhåndtering

De vanligste feilene er nettverksfeil, problemer med API-et (nede eller tregt), at brukeren skriver inn noe rart, og at noe feiler ved oppstart. Det er nyttig å skille disse, fordi brukeren skal ha forskjellige meldinger for hvert tilfelle.

Vanlig feil med fetch er at den ikke kaster ved HTTP-feilkoder, kun ved nettverksfeil. Derfor sjekker jeg response.ok eksplisitt. AbortController gir egen timeout etter åtte sekunder, slik at brukeren ikke står og venter på et API som henger.

Alle feil mappes til en egen ApiFeil-klasse med koder, og UI-laget oversetter til meldinger. Brukeren får alltid vite hva som skjedde, og appen havner aldri i en låst tilstand. 

Feil for input er . vs ,. For output: Intl.NumberFormat('no-NO') håndterer norsk notasjon med komma.
Input var mer interessant. Jeg testet med både 1,5 og 1.5, og begge ga riktig svar, til tross for at <input type="number"> formelt sett kun aksepterer punktum. Jeg sjekket i Console hva input feltet faktisk inneholdt. Det viste seg at Chrome konverterer kommaet til punktum internt basert på systemets locale. Dette er ikke garantert i andre nettlesere. Jeg la derfor inn en eksplisitt .replace(',', '.') i lesBeløp slik at oppførselen er forutsigbar uavhengig av nettleser.

Sentralbanker publiserer ikke kurser i helger og helligdager, så da jeg testet appen på en søndag og så at det sto "hentet fra Frankfurter den 26. april 2026", trodde jeg dette var en bug. Jeg trodde at API-et burde sendt en dato fra fredag.
Jeg sjekket i DevTools for å se hva responsen faktisk inneholdt, og oppdaget at API-et selv returnerer dagens dato. Jeg endret uansett fra "kurs fra" til "sist oppdatert" siden det er mest naturlig. 

Underveis testet jeg å konvertere mellom XPD (palladium) og GMD (Gambian Dalasi).API-et returnerte 200 med tomt array fordi det ikke finnes kurs mellom disse valutaene. Den generelle "ugyldig respons"-meldingen var misvisende, så jeg la til en egen ingen kurs kode.

# Videre utvikling

Tester. Widgeten ville hatt godt av enhetstester med mockede fetch-svar. 

Race condition-håndtering. Hvis bruker bytter valuta veldig raskt flere ganger, kan svar ankomme i annen rekkefølge enn de ble sendt og dermed vise feil resultat. 

