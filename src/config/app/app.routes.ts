// Root
const usersRoot = 'users';
const authRoot = 'auth';
const mailRoot = 'mail';
const interestsRoot = 'interests';
const roomsRoot = 'rooms';
const mediaRoot = 'media';

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
    refresh: `/${authRoot}/refresh`,
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
    findOne: `/${roomsRoot}/:id`,
  },
  media: {
    root: mediaRoot,
    upload: `/${mediaRoot}/upload`,
  },
  mail: {
    confirm: `/${mailRoot}/confirm`,
    sendConfirm: `/${mailRoot}/confirm/send`,
    resetPasswordSend: `/${mailRoot}/reset-password/send`,
    resetPasswordConfirm: `/${mailRoot}/reset-password/confirm`,
  },
};
