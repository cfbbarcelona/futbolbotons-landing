# futbolbotons.cat

Web de referència del futbol amb botons a Catalunya. Directori de clubs, presentació de l'esport i mapa interactiu. Desplegat a GitHub Pages.

## Tech stack

HTML + CSS + JS planer, sense framework ni procés de build. Leaflet.js, Google Fonts i Font Awesome via CDN.

## Desplegar a GitHub Pages

1. Fes push a la branca `main`
2. A GitHub → Settings → Pages → Source: `main / (root)`
3. El lloc estarà disponible a `https://<usuari>.github.io/futbolbotons-landing/`

## Afegir o modificar un club

Edita `js/clubs-data.js`. Cada club és un objecte amb aquests camps:

```js
{
  id: 'id-unic',
  name: 'Nom complet del club',
  abbr: 'SIGLES',
  logo: 'images/logos/nom-del-logo.png',
  lat: 41.0000,
  lng: 2.0000,
  location: 'Municipi (Comarca)',
  address: 'Adreça postal',
  phone: '93 000 00 00',
  hours: 'Horari',
  website: 'https://...',
  email: 'contacte@club.cat'
}
```

El logo ha d'anar a `images/logos/`. Format recomanat: PNG amb fons transparent.

## Imatges de seccions

Consulta `MISSING_IMAGES.md` per a les especificacions de cada imatge (dimensions, descripció ideal).
