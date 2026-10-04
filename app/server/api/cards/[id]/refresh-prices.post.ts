export default handle(event => useServices().cards.refreshPrices(getIdParam(event), getActor(event)))
