// Root
const usersRoot = 'users';
const authRoot = 'auth';
const mailRoot = 'mail';
const interestsRoot = 'interests';
const roomsRoot = 'rooms';
const mediaRoot = 'media';
const randomMatchRoot = 'random-match';
const tenantsRoot = 'tenant';
const healthsRoot = 'health';

// Api Versions
const v1 = 'v1';

export const routesV1 = {
  version: v1,
  user: {
    root: usersRoot,
    create: `/${usersRoot}`,
    createGuest: `/${usersRoot}/guest`,
    delete: `/${usersRoot}/:id`,
    findOne: `/${usersRoot}/:id`,
    findAll: `/${usersRoot}`,
    update: `/${usersRoot}/:id`,
    interest: `/${usersRoot}/:id/interests`,
  },
  auth: {
    root: authRoot,
    delete: `/${authRoot}/:id`,
    findOne: `/${authRoot}/:id`,
    update: `/${authRoot}/:id`,
    refresh: `/${authRoot}/refresh`,
    registerUser: authRoot,
    registerGuest: `/${authRoot}/guest`,
    login: `/${authRoot}/login`,
    google: `/${authRoot}/google`,
    github: `/${authRoot}/github`,
    facebook: `/${authRoot}/facebook`,
    googleCallback: `/${authRoot}/google/callback`,
    githubCallback: `/${authRoot}/github/callback`,
    facebookCallback: `/${authRoot}/facebook/callback`,
  },
  interests: {
    root: interestsRoot,
    create: `/${interestsRoot}`,
    findAll: `/${interestsRoot}`,
    delete: `/${interestsRoot}/:id`,
    findOne: `/${interestsRoot}/:id`,
    update: `/${interestsRoot}/:id`,
  },
  rooms: {
    root: roomsRoot,
    create: `/${roomsRoot}`,
    findAll: `/${roomsRoot}`,
    findOne: `/${roomsRoot}/:id`,
    report: `/${roomsRoot}/:id/report`,
    join: `/${roomsRoot}/join`,
    approve: `/${roomsRoot}/approve`,
    leave: `/${roomsRoot}/:roomId/leave`,
  },
  media: {
    root: mediaRoot,
    upload: `/${mediaRoot}/upload`,
  },
  randomMatch: {
    root: randomMatchRoot,
    start: `/${randomMatchRoot}/start`,
  },
  mail: {
    confirm: `/${mailRoot}/confirm`,
    sendConfirm: `/${mailRoot}/confirm/send`,
    resetPasswordSend: `/${mailRoot}/reset-password/send`,
    resetPasswordConfirm: `/${mailRoot}/reset-password/confirm`,
  },
  tenant: {
    root: tenantsRoot,

    // tenant CRUD
    create: `/${tenantsRoot}`,
    findAll: `/${tenantsRoot}`,
    findOne: `/${tenantsRoot}/:id`,
    update: `/${tenantsRoot}/:id`,
    delete: `/${tenantsRoot}/:id`,

    // tenant domains
    domainsRoot: `/${tenantsRoot}/domain`,
    createDomain: `/${tenantsRoot}/domain`,
    findAllDomains: `/${tenantsRoot}/domain`,
    findOneDomain: `/${tenantsRoot}/domain/:id`,
    updateDomain: `/${tenantsRoot}/domain/:id`,
    deleteDomain: `/${tenantsRoot}/domain/:id`,

    // tenant users
    addUser: `/${tenantsRoot}/:tenantId/user`,
  },
  health: {
    root: healthsRoot,
    liveness: `/${healthsRoot}/liveness`,
    readiness: `/${healthsRoot}/readiness`,
  },
};
