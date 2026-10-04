// Fetches texts, attributes and prices from the card API again; the user's own data is kept.
export default handle(event => useServices().cards.refresh(getIdParam(event), getActor(event)))
