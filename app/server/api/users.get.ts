// All users with the number of their cards; every logged in user can see them.
export default handle(() => useServices().users.list())
