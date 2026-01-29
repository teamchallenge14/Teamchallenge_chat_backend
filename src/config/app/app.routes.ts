// Root
const usersRoot = 'users';
const authRoot = 'auth';
const mailRoot = 'mail';
const interestsRoot = 'interests';

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
    delete: `/${authRoot}/:id`,
    findOne: `/${authRoot}/:id`,
    update: `/${authRoot}/:id`,
    google: `/${authRoot}/google`,
    github: `/${authRoot}/github`,
    facebook: `/${authRoot}/facebook`,
  },
  interests: {
    root: interestsRoot,
    crate: `/${interestsRoot}`,
    findAll: `/${interestsRoot}`,
    delete: `/${interestsRoot}/:id`,
    findOne: `/${interestsRoot}/:id`,
    update: `/${interestsRoot}/:id`,
  },
  mail: {
    confirm: `/${mailRoot}/confirm`,
    sendConfirm: `/${mailRoot}/confirm/send`,
    resetPasswordSend: `/${mailRoot}/reset-password/send`,
    resetPasswordConfirm: `/${mailRoot}/reset-password/confirm`,
  },
};
