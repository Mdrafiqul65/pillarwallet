// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2019 Stiftung Pillar Project

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/
import * as Keychain from 'react-native-keychain';

const KEYCHAIN_SERVICE = 'com.pillarproject.wallet';
const KEYCHAIN_DATA_KEY = 'data';

export function setKeychainDataObject(data: Object) {
  return Keychain
    .setGenericPassword(KEYCHAIN_DATA_KEY, JSON.stringify(data), {
      accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY,
      service: KEYCHAIN_SERVICE,
    })
    .catch(() => null);
}

export function getKeychainDataObject() {
  return Keychain
    .getGenericPassword({
      username: KEYCHAIN_DATA_KEY,
      service: KEYCHAIN_SERVICE,
    })
    .then(({ password = '{}' }) => JSON.parse(password))
    .catch(() => {});
}
