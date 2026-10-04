export default handle(async (event) => {
  await useServices().cards.remove(getIdParam(event), getActor(event))
  setResponseStatus(event, 204)
  return null
})
