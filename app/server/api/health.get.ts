// Liveness/readiness probe: succeeds only if the database answers.
export default handle(async () => {
  await useServices().db.$queryRaw`SELECT 1`
  return { status: 'ok' }
})
