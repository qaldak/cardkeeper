export default handle(async (event) => {
  await useServices().images.remove(getIdParam(event), getActor(event))
  setResponseStatus(event, 204)
  return null
})
