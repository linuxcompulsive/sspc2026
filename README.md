# SSPC2026 v1.1 — Sistema de Seguretat Pública de Catalunya 2026

Aplicació estàtica per a GitHub Pages, adaptada per a **classes projectades** i per a **repàs individual** des del mòbil o l’ordinador. No requereix cap servidor propi ni base de dades externa.

## Funcionament a l'aula

1. El professor prepara un test amb **10, 30 o 50** preguntes de tot el temari o d'una lliçó.
2. Un alumne marca les respostes a l'ordinador. La resta de la classe veu les preguntes al projector i anota les lletres que considera correctes.
3. El botó **Mode projector** amplia l'enunciat i les alternatives per a la pantalla gran; es pot desactivar en qualsevol moment.
4. En acabar, apareix la **graella de solucions** (1 → A, 2 → C...), calculada segons l'ordre aleatori real de les opcions en aquest test, a més de la nota de l'alumne que ha respost.
5. El solucionari es pot **ampliar al projector**, **copiar** o **imprimir**. Les preguntes errònies també es poden revisar individualment.

**Nota:** cada test barreja preguntes i opcions, per això cada nova sessió pot tenir un solucionari diferent. El solucionari és correcte per a la sessió que s'acaba de fer, no per a altres tests.

## Format de preguntes.csv

Capçalera exacta:

```csv
id,tema,enunciat,opcio_a,opcio_b,opcio_c,opcio_d,correcta,explicacio
```

- `id`: identificador únic, com `1.1-001` o `1.2-013`.
- `tema`: número de lliçó, per exemple `1.1`, `1.2` (desar com a text en un full de càlcul).
- `enunciat`: pregunta.
- `opcio_a`, `opcio_b`, `opcio_c`, `opcio_d`: quatre opcions no buides.
- `correcta`: lletra A, B, C o D **de les opcions originals del CSV**.
- `explicacio`: camp opcional.

**El camp `bloc` s'ha eliminat.** Si s'importa un CSV antic que contingui la columna `bloc`, l'aplicació la ignora. Quan s'exporti des de la versió 1.1, el fitxer ja no inclourà aquesta columna.

Codificació UTF-8. Separador coma. Escapa amb cometes dobles els textos que tinguin comes o salts de línia; dins d'un camp entre cometes, escriu `""` per a una cometa literal. Hi ha una plantilla inclosa.

## Publicar a GitHub Pages

1. Crea o obre el repositori (per exemple, `linuxcompulsive/sspc2026`).
2. Puja `index.html`, `styles.css`, `app.js` i `preguntes.csv` a l'arrel del repositori.
3. Activa **Settings → Pages → Deploy from a branch → main → /(root)**.
4. La web quedarà disponible a `https://linuxcompulsive.github.io/sspc2026/` si fas servir aquests noms.
5. Per actualitzar preguntes, substitueix únicament **`preguntes.csv`** a GitHub.

El CSV en producció és inicialment **buit** perquè no s'afegeixin preguntes de demostració al material docent. Per provar l'aplicació, pots importar el fitxer separat **`preguntes_demo.csv`** (10 preguntes fictícies, NO corresponents al temari) des de la pestanya **Preguntes**. No el publiquis com a banc oficial. Per la càrrega automàtica, obre la web publicada o un servidor HTTP local; els navegadors no solen permetre llegir el CSV automàticament quan obres `index.html` amb `file://`.

Les edicions fetes a l'aplicació només es guarden al navegador; per compartir-les cal exportar-les i pujar `preguntes.csv` a GitHub. Si has editat el banc local, utilitza l'opció **Restaurar CSV de GitHub** per tornar a carregar la versió publicada.

## Privacitat i autoavaluació

El banc de preguntes i les solucions són **públics** a GitHub Pages: adequat per practicar, no per a un examen amb respostes secretes. Les respostes i notes són locals al dispositiu, i no s'envien al professor. Cada alumne pot obrir l'URL a casa i practicar pel seu compte.
