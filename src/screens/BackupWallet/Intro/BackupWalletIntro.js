// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2021 Stiftung Pillar Project

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

import * as React from 'react';
import { Image } from 'react-native';
import { useNavigation } from 'react-navigation-hooks';
import SafeAreaView from 'react-native-safe-area-view';
import styled from 'styled-components/native';
import { useTranslationWithPrefix } from 'translations/translate';

// Contants
import { BACKUP_PHRASE } from 'constants/navigationConstants';

// Components
import { Container } from 'components/layout/Layout';
import Button from 'components/core/Button';
import HeaderBlock from 'components/HeaderBlock';
import Text from 'components/core/Text';

// Utils
import { appFont, fontStyles, spacing, fontSizes } from 'utils/variables';


const smartWalletImage = require('assets/images/logo-wallet-migration.png');

function BackupWalletIntro() {
  const { t, tRoot } = useTranslationWithPrefix('backupWallet.intro');
  const navigation = useNavigation();
  const seedPhrase = navigation.getParam('mnemonicPhrase', null);

  const navigateToBackupPhrase = () => {
    navigation.navigate(BACKUP_PHRASE, {
      mnemonicPhrase: seedPhrase,
    });
  };

  const close = () => {
    navigation.dismiss();
  };

  return (
    <Container>
      <HeaderBlock leftItems={[{ close: true }]} navigation={navigation} noPaddingTop />

      <NonScrollableContent>
        <LogoContainer>
          <Logo source={smartWalletImage} />
        </LogoContainer>

        <Title>{t('title')}</Title>
        <Subtitle>{t('subtitle')}</Subtitle>

        <Body>{t('body')}</Body>

        <Button title={tRoot('button.continue')} onPress={navigateToBackupPhrase} style={styles.button} size="large" />
        <Button
          title={tRoot('button.notNow')}
          variant="text"
          onPress={close}
          style={styles.button}
          size="large"
        />
      </NonScrollableContent>
    </Container>
  );
}

export default BackupWalletIntro;

const styles = {
  button: {
    marginBottom: spacing.large,
  },
};

const NonScrollableContent = styled(SafeAreaView)`
  flex: 1;
  padding: 0 ${spacing.large}px;
`;

const LogoContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
`;

const Logo = styled(Image)`
  align-self: center;
`;

const Title = styled(Text)`
  margin: ${spacing.medium}px 0 0;
  font-family: ${appFont.medium};
  font-size: ${fontSizes.large}px;
  text-align: center;
`;

const Subtitle = styled(Text)`
  margin: ${spacing.small}px 0 0;
  color: ${({ theme }) => theme.colors.negative};
  text-align: center;
`;

const Body = styled(Text)`
  margin: ${spacing.large}px 0 ${spacing.extraLarge}px;
  color: ${({ theme }) => theme.colors.tertiaryText};
  ${fontStyles.medium};
  text-align: center;
`;