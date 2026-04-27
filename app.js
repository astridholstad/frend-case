const API_BASE = 'https://api.frankfurter.dev/v2';
const DEFAULT_FROM = 'NOK';
const DEFAULT_TO = 'EUR';
const REQUEST_TIMEOUT_MS = 8000;
 
// Feilkoder 
const FEIL = {
    NETTVERK: 'NETTVERK',
    TIMEOUT: 'TIMEOUT',
    API: 'API',
    UGYLDIG_RESPONS: 'UGYLDIG_RESPONS',
    INGEN_KURS: 'INGEN_KURS',
    UKJENT: 'UKJENT',
};
 
// Egen feilklasse for forventede API-feil.
class ApiFeil extends Error {
    constructor(kode) {
        super(kode);
        this.name = 'ApiFeil';
    }
}
 
const state = {
    currencies: {},
    currentRate: null,
};
 
const elementer = {
    amount: document.getElementById('amount'),
    fromCurrency: document.getElementById('from-currency'),
    toCurrency: document.getElementById('to-currency'),
    swapButton: document.getElementById('swap-button'),
    status: document.getElementById('status'),
    result: document.getElementById('result'),
    quickButtons: document.querySelectorAll('.quick-amounts button'),
};
 
// API-lag
 
async function hentJson(url) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
 
    let response;
    try {
        response = await fetch(url, { signal: controller.signal });
    } catch (feil) {
        if (feil.name === 'AbortError') {
            throw new ApiFeil(FEIL.TIMEOUT);
        }
        throw new ApiFeil(FEIL.NETTVERK);
    } finally {
        clearTimeout(timeoutId);
    }
 
    if (!response.ok) {
        throw new ApiFeil(FEIL.API);
    }
 
    try {
        return await response.json();
    } catch (feil) {
        throw new ApiFeil(FEIL.UGYLDIG_RESPONS);
    }
}
 
async function hentValutaer() {
    const data = await hentJson(`${API_BASE}/currencies`);
 
    if (!Array.isArray(data) || data.length === 0) {
        throw new ApiFeil(FEIL.UGYLDIG_RESPONS);
    }
 
    // Bygg en dict { ISO_KODE: { navn, symbol } } for raskere oppslag.
    const valutaer = {};
    for (const valuta of data) {
        if (valuta && typeof valuta.iso_code === 'string' && typeof valuta.name === 'string') {
            valutaer[valuta.iso_code] = {
                navn: valuta.name,
                symbol: valuta.symbol || '',
            };
        }
    }
 
    if (Object.keys(valutaer).length === 0) {
        throw new ApiFeil(FEIL.UGYLDIG_RESPONS);
    }
 
    return valutaer;
}
 
async function hentKurs(fra, til) {
    const url = `${API_BASE}/rates?base=${encodeURIComponent(fra)}&quotes=${encodeURIComponent(til)}`;
    const data = await hentJson(url);
 
    // Defekt respons fra API-et (skal ikke skje, men beskytt likevel).
    if (!Array.isArray(data)) {
        throw new ApiFeil(FEIL.UGYLDIG_RESPONS);
    }
 
    // Tomt array betyr at API-et ikke har en kurs mellom disse valutaene.
    if (data.length === 0) {
        throw new ApiFeil(FEIL.INGEN_KURS);
    }
 
    const treff = data.find(r => r && r.quote === til && typeof r.rate === 'number');
    if (!treff) {
        throw new ApiFeil(FEIL.UGYLDIG_RESPONS);
    }
 
    return { fra, til, kurs: treff.rate, dato: treff.date };
}
 
// UI-lag
 
function visStatus(melding, type = 'info') {
    elementer.status.textContent = melding;
    elementer.status.classList.toggle('error', type === 'error');
}
 
function tomStatus() {
    elementer.status.textContent = '';
    elementer.status.classList.remove('error');
}
 
function visTomtResultat(melding) {
    elementer.result.className = 'result empty';
    elementer.result.textContent = melding;
}
 
function visResultat(beløp, kursinfo) {
    const konvertert = beløp * kursinfo.kurs;
    elementer.result.className = 'result';
    elementer.result.innerHTML = `
        <p class="result-amount">${formaterTall(konvertert)} ${kursinfo.til}</p>
        <p class="result-rate">
            1 ${kursinfo.fra} = ${formaterKurs(kursinfo.kurs)} ${kursinfo.til}
            · Sist oppdatert ${formaterDato(kursinfo.dato)}
        </p>
    `;
}
 
function formaterTall(verdi) {
    return new Intl.NumberFormat('no-NO', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(verdi);
}
 
function formaterKurs(verdi) {
    return new Intl.NumberFormat('no-NO', {
        minimumFractionDigits: 4,
        maximumFractionDigits: 4,
    }).format(verdi);
}
 
function formaterDato(isoDato) {
    return new Intl.DateTimeFormat('no-NO', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(new Date(isoDato));
}
 
function fyllDropdowns(currencies) {
    const koder = Object.keys(currencies).sort();
 
    for (const dropdown of [elementer.fromCurrency, elementer.toCurrency]) {
        dropdown.innerHTML = '';
        for (const kode of koder) {
            const option = document.createElement('option');
            option.value = kode;
            option.textContent = `${kode} ${currencies[kode].navn}`;
            dropdown.appendChild(option);
        }
    }
 
    elementer.fromCurrency.value = currencies[DEFAULT_FROM] ? DEFAULT_FROM : koder[0];
    elementer.toCurrency.value = currencies[DEFAULT_TO] ? DEFAULT_TO : koder[1];
}
 
function settDeaktivert(deaktivert) {
    elementer.fromCurrency.disabled = deaktivert;
    elementer.toCurrency.disabled = deaktivert;
    elementer.swapButton.disabled = deaktivert;
}
 
function feilmelding(kode) {
    switch (kode) {
        case FEIL.NETTVERK:
            return 'Ingen kontakt med kursserveren. Sjekk internettforbindelsen og prøv igjen.';
        case FEIL.TIMEOUT:
            return 'Forespørselen tok for lang tid. Prøv igjen.';
        case FEIL.API:
            return 'Kursserveren svarer ikke som forventet. Prøv igjen senere.';
        case FEIL.UGYLDIG_RESPONS:
            return 'Vi fikk uventet svar fra kursserveren. Prøv igjen.';
        case FEIL.INGEN_KURS:
            return 'Det finnes ingen kurs mellom disse valutaene. Velg et annet valutapar.';
        default:
            return 'Noe gikk galt. Prøv igjen.';
    }
}
 
// Hovedlogikk
 
function lesBeløp() {
    const verdi = parseFloat(elementer.amount.value.replace(',', '.'));
    if (isNaN(verdi) || verdi < 0) {
        return null;
    }
    return verdi;
}
 
function tegnResultat() {
    const beløp = lesBeløp();
 
    if (beløp === null) {
        visTomtResultat('Skriv inn et gyldig beløp');
        return;
    }
 
    const fra = elementer.fromCurrency.value;
    const til = elementer.toCurrency.value;
 
    // Samme valuta gir 1:1 uten API-kall.
    if (fra === til) {
        visResultat(beløp, {
            fra,
            til,
            kurs: 1,
            dato: state.currentRate?.dato || new Date().toISOString().slice(0, 10),
        });
        return;
    }
 
    // Bruk cachet kurs hvis vi har den for dette paret.
    if (state.currentRate && state.currentRate.fra === fra && state.currentRate.til === til) {
        visResultat(beløp, state.currentRate);
        return;
    }
 
    // Ellers hent ny kurs.
    oppdaterKurs();
}
 
async function oppdaterKurs() {
    const fra = elementer.fromCurrency.value;
    const til = elementer.toCurrency.value;
 
    if (fra === til) {
        tegnResultat();
        return;
    }
 
    visStatus('Henter kurs...');
 
    try {
        const kursinfo = await hentKurs(fra, til);
        state.currentRate = kursinfo;
        tomStatus();
        tegnResultat();
    } catch (feil) {
        if (feil instanceof ApiFeil) {
            visStatus(feilmelding(feil.message), 'error');
        } else {
            // Uventet feil, for loggens skyld
            console.error('Uventet feil:', feil);
            visStatus(feilmelding(FEIL.UKJENT), 'error');
        }
        visTomtResultat('Ingen kurs tilgjengelig');
        state.currentRate = null;
    }
}
 
function bytteValutaer() {
    const fra = elementer.fromCurrency.value;
    const til = elementer.toCurrency.value;
    elementer.fromCurrency.value = til;
    elementer.toCurrency.value = fra;
    oppdaterKurs();
}
 
// Oppstart av app
 
async function start() {
    visTomtResultat('Laster valutaliste...');
 
    try {
        state.currencies = await hentValutaer();
        fyllDropdowns(state.currencies);
        settDeaktivert(false);
        oppdaterKurs();
    } catch (feil) {
        if (feil instanceof ApiFeil) {
            visStatus(feilmelding(feil.message), 'error');
        } else {
            // Uventet feil, for loggens skyld
            console.error('Uventet feil ved oppstart:', feil);
            visStatus(feilmelding(FEIL.UKJENT), 'error');
        }
        visTomtResultat('Last siden på nytt for å prøve igjen');
    }
}
 
elementer.amount.addEventListener('input', tegnResultat);
elementer.fromCurrency.addEventListener('change', oppdaterKurs);
elementer.toCurrency.addEventListener('change', oppdaterKurs);
elementer.swapButton.addEventListener('click', bytteValutaer);
 
for (const knapp of elementer.quickButtons) {
    knapp.addEventListener('click', () => {
        elementer.amount.value = knapp.dataset.amount;
        tegnResultat();
    });
}
 
start();