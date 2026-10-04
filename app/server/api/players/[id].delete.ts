export default handle(async (event) => {
  await useServices().players.remove(getIdParam(event))
  setResponseStatus(event, 204)
  return null
})
