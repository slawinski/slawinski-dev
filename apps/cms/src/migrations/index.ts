import * as migration_20261005_131533_initial from './20261005_131533_initial';

export const migrations = [
  {
    up: migration_20261005_131533_initial.up,
    down: migration_20261005_131533_initial.down,
    name: '20261005_131533_initial'
  },
];
