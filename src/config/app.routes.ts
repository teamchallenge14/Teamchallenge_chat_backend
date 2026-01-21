// Root
const usersRoot = 'users';
const authRoot = 'auth';
const mailRoot = 'mail';

// Api Versions
const v1 = 'v1';

export const routesV1 = {
  version: v1,
  user: {
    root: usersRoot,
    create: `/${usersRoot}`,
    delete: `/${usersRoot}/:id`,
    findOne: `/${usersRoot}/:id`,
    findAll: `/${usersRoot}`,
    update: `/${usersRoot}/:id`,
    interest: `/${usersRoot}/:id/interests`,
  },
  auth: {
    root: authRoot,
    me: `/${authRoot}/me`,
    refresh: `/${authRoot}/refresh`,
    delete: `/${authRoot}/:id`,
    findOne: `/${authRoot}/:id`,
    update: `/${authRoot}/:id`,
    google: `/${authRoot}/google`,
    github: `/${authRoot}/github`,
    facebook: `/${authRoot}/facebook`,
  },
  mail: {
    confirm: `/${mailRoot}/confirm`,
    sendConfirm: `/${mailRoot}/confirm/send`,
    resetPasswordSend: `/${mailRoot}/reset-password/send`,
    resetPasswordConfirm: `/${mailRoot}/reset-password/confirm`,
  },
};
