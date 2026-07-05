// Toutes les routes admin renvoient un PageResponse : { content, page, size, totalElements, totalPages, last }.
// Les services renvoient ce PageResponse tel quel (voir Recherche.jsx pour une page qui
// navigue elle-même page par page). fetchAllPages sert aux écrans qui ont besoin de la
// collection complète en mémoire (ex. onglets filtrés côté client dans AdminDashboard) :
// il parcourt toutes les pages et concatène leur `content`.
//
// À réserver aux vues admin à volumétrie raisonnable : ce n'est pas adapté à une liste
// pouvant compter des dizaines de milliers d'éléments.
export async function fetchAllPages(fetchPage, size = 50) {
  const first = await fetchPage(0, size)
  const items = [...first.content]
  for (let page = 1; page < first.totalPages; page++) {
    const next = await fetchPage(page, size)
    items.push(...next.content)
  }
  return items
}
