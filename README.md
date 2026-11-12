# INSPECTOR 2.2 — Banc de preguntes en CSV

Aplicació HTML, CSS i JavaScript per preparar els tests de les oposicions d'inspector/a de Mossos d'Esquadra. Adaptada a PC i mòbil; funciona gratuïtament a GitHub Pages. **El fitxer principal del banc és `preguntes.csv`; ja no cal generar ni mantenir `preguntes.json`.**

## Fitxers

- **`index.html`**: pàgina i banc de 59 preguntes incorporat com a còpia de prova quan l'obres amb doble clic (`file://`).
- **`styles.css`**: aparença visual adaptativa (PC i mòbil).
- **`app.js`**: tests, filtres, revisió d'errors, importació i exportació CSV.
- **`preguntes.csv`**: **banc principal** que la pàgina carrega AUTOMÀTICAMENT a GitHub Pages. Inclou els 59 ítems i els solucionaris del document «M8 TEST.docx».
- **`plantilla-preguntes.csv`**: capçalera per incorporar noves preguntes.

## Format CSV

La primera fila ha de contenir les columnes següents:

```csv
id,bloc,tema,enunciat,opcio_a,opcio_b,opcio_c,opcio_d,correcta,explicacio,origen
```

- `id`: únic per a cada pregunta, per exemple `8.1-T-001`.
- `bloc`: enter entre 1 i 8.
- `tema`: text com `8.1`, `7.3`.
- `enunciat`: text de la pregunta.
- `opcio_a`, `opcio_b`, `opcio_c`, `opcio_d`: les quatre alternatives.
- `correcta`: lletra `A`, `B`, `C` o `D`.
- `explicacio` i `origen`: columnes opcionals (pots mantenir-les en blanc).

Desa en **CSV UTF-8**. El separador pot ser coma `,` o punt i coma `;` (el programa el detecta a la capçalera). Quan algun text conté comes, cometes o salts de línia, cal fer servir les regles CSV habituals: cometes al voltant del camp i cometes internes duplicades. Recomanat: utilitzar el botó **Exportar CSV** de l'aplicació o l'opció «Desar com → CSV UTF-8» de LibreOffice.

## Actualitzar el banc de GitHub (sense JSON)

1. Obre `preguntes.csv` a LibreOffice Calc o Excel.
2. Afegeix o modifica preguntes, respectant la capçalera i els identificadors únics.
3. Desa com a **CSV UTF-8** i conserva el nom exacte `preguntes.csv`.
4. Entra a https://github.com/linuxcompulsive/inspector-tests .
5. Obre `preguntes.csv`, clica l'icona del llapis (Edit) si vols editar-lo en línia, **o** substitueix el fitxer mitjançant **Add file → Upload files**; confirma amb **Commit changes**.
6. Passats uns instants, refresca https://linuxcompulsive.github.io/inspector-tests/ . El programa llegeix el CSV cada vegada que s'obre.
7. Si has editat/importat preguntes dins del simulador i manté una còpia local, obre **Preguntes → Restaurar CSV de GitHub**. **Exporta abans el banc local** si no vols perdre aquests canvis.

**En actualitzar les preguntes només cal tocar `preguntes.csv`.** `index.html`, `app.js` i `styles.css` es mantenen.

## Passar de la versió 2.1 a la 2.2

1. Puja/substitueix `index.html`, `app.js`, `styles.css` i `preguntes.csv` a l'arrel de `inspector-tests`.
2. `preguntes.json` de la versió anterior **ja no s'utilitza** i el pots eliminar de GitHub quan vulguis (és opcional).
3. `plantilla-preguntes.csv` és útil però no imprescindible per a l'execució.
4. Assegura't que Pages continuï configurat a `main` / `/(root)`.

No cal tornar a crear el repositori ni reactivar GitHub Pages.

## Proves locals

- **Doble clic a `index.html`:** funciona, amb les 59 preguntes del bloc 8 **integrades com a còpia inicial**, sense llegir automàticament el CSV del disc. Per provar un CSV modificat localment, utilitza **Preguntes → Importar fitxer**.
- **Per provar la lectura automàtica del CSV abans de pujar-lo:** obre un terminal a la carpeta, executa `python3 -m http.server 8000` i visita `http://localhost:8000/`. Llavors es carrega `preguntes.csv` directament, igual que a GitHub Pages.

## Preguntes incloses

| Qüestionari original | Preguntes |
|---|---:|
| Diagnòstic inicial | 10 |
| Tema 8.1 · Transparència | 5 |
| Tema 8.2 · Protecció de dades personals | 8 |
| Tema 8.3 · Dades en l'àmbit penal i policial | 12 |
| Test global de consolidació | 24 |
| **Total** | **59** |

Classificació per tema: **8.1: 16, 8.2: 17, 8.3: 26**. Alguns conceptes són repetits perquè així apareixen en diferents tests del material.

**Advertiment del document original:** la pregunta `8.2-D-004` té una nota sobre la necessitat de contrastar-ne l'edat i el redactat legal. Les claus es conserven tal com apareixen al Word aportat i no constitueixen una verificació normativa independent.

## Desament i privacitat

Els resultats, l'historial i les respostes es desen al navegador del dispositiu (localStorage/sessionStorage). Quan **edites o importes preguntes a l'aplicació**, se'n crea una còpia local perquè no es perdin en recarregar; aquesta còpia té preferència fins que tries **Restaurar CSV de GitHub**. Quan només edites el CSV a GitHub, la nova versió es mostra automàticament als navegadors sense modificacions locals. GitHub Pages és estàtic i no pot escriure el CSV al repositori: per compartir canvis fets a l'editor del programa, exporta el CSV i puja'l manualment.
