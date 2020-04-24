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

import * as React from 'react';
import { FlatList } from 'react-native';
import styled, { withTheme } from 'styled-components/native';
import { connect } from 'react-redux';
import { BigNumber } from 'bignumber.js';
import isEmpty from 'lodash.isempty';
import { InAppBrowser } from '@matt-block/react-native-in-app-browser';
import { utils } from 'ethers';
import { createStructuredSelector } from 'reselect';

// actions
import {
  authorizeWithShapeshiftAction,
  setDismissTransactionAction,
  setExecutingTransactionAction,
  setTokenAllowanceAction,
  takeOfferAction,
} from 'actions/exchangeActions';

// components
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import OfferCard from 'components/OfferCard/OfferCard';

// constants
import { EXCHANGE, PROVIDER_SHAPESHIFT, NORMAL } from 'constants/exchangeConstants';
import { EXCHANGE_CONFIRM, FIAT_EXCHANGE, SEND_TOKEN_PIN_CONFIRM } from 'constants/navigationConstants';
import { defaultFiatCurrency, ETH } from 'constants/assetsConstants';

// services
import { wyreWidgetUrl } from 'services/sendwyre';

// types
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { Allowance, ExchangeProvider, FiatOffer, Offer, ProvidersMeta } from 'models/Offer';
import type { NavigationScreenProp } from 'react-navigation';
import type { Theme } from 'models/Theme';
import type { Accounts } from 'models/Account';
import type { BitcoinAddress } from 'models/Bitcoin';
import type { TokenTransactionPayload } from 'models/Transaction';
import type { Asset, Balances, Rates } from 'models/Asset';
import type { GasInfo } from 'models/GasInfo';

//  selectors
import { accountBalancesSelector } from 'selectors/balances';

// utils
import { getOfferProviderLogo, isFiatProvider, getCryptoProviderName } from 'utils/exchange';
import { formatAmount, formatAmountDisplay } from 'utils/common';
import { spacing } from 'utils/variables';
import { getActiveAccountAddress } from 'utils/accounts';
import { getBalance, getRate } from 'utils/assets';

// partials
import ExchangeStatus from './ExchangeStatus';
import { calculateAmountToBuy, getAvailable } from './utils';
import type { FormValue } from './Exchange';
import AssetEnableModal from './AssetEnableModal';


export type EnableData = {
  providerName: string,
  assetSymbol: string,
  assetIcon: string,
  fiatCurrency: string,
  feeInEth: string,
  feeInFiat: string,
  isDisabled?: boolean,
};

type AllowanceResponse = {
  gasLimit: number,
  payToAddress: string,
  transactionObj: { data: string },
};

type Props = {
  navigation: NavigationScreenProp<*>,
  offers: Offer[],
  takeOffer: (string, string, number, string, string, () => void) => void,
  authorizeWithShapeshift: () => void,
  setExecutingTransaction: () => void,
  setTokenAllowance: (string, string, string, string, string, (AllowanceResponse) => void) => void,
  exchangeAllowances: Allowance[],
  connectedProviders: ExchangeProvider[],
  smartWalletFeatureEnabled: boolean,
  providersMeta: ProvidersMeta,
  theme: Theme,
  showEmptyMessage: boolean,
  isExchangeActive: boolean,
  disableNonFiatExchange: boolean,
  setFromAmount: (string) => void,
  value: FormValue,
  accounts: Accounts,
  btcAddresses: BitcoinAddress[],
  exchangeSupportedAssets: Asset[],
  baseFiatCurrency: ?string,
  gasInfo: GasInfo,
  rates: Rates,
  setDismissTransaction: () => void,
  balances: Balances,
};

type State = {
  shapeshiftAuthPressed: boolean,
  pressedOfferId: string, // offer id will be passed to prevent double clicking
  pressedTokenAllowanceId: string,
  isEnableAssetModalVisible: boolean,
  enableData?: ?EnableData,
  enablePayload: ?TokenTransactionPayload,
};


const ListHeader = styled.View`
  width: 100%;
  align-items: flex-start;
  margin-bottom: 8px;
  padding: 0 ${spacing.layoutSides}px;
`;

const ESWrapper = styled.View`
  width: 100%;
  align-items: center;
  padding: 0 ${spacing.layoutSides}px;
`;

const OfferCardWrapper = styled.View`
  padding: 0 ${spacing.layoutSides}px;
`;

// const PromoWrapper = styled.View`
//   width: 100%;
//   align-items: center;
//   padding: ${spacing.large}px ${spacing.layoutSides}px;
//   margin-bottom: 30px;
// `;
//
// const PromoText = styled(BaseText)`
//   ${fontStyles.medium};
//   color: ${themedColors.secondaryText};
//   text-align: center;
// `;
//
// const PopularSwapsGridWrapper = styled.View`
//   border-top-width: 1px;
//   border-bottom-width: 1px;
//   border-color: ${themedColors.tertiary};
//   background-color: ${themedColors.card};
//   padding: ${spacing.large}px ${spacing.layoutSides}px 0;
// `;


function getCardAdditionalButtonData(additionalData) {
  const {
    offer,
    minOrMaxNeeded,
    isBelowMin,
    isShapeShift,
    shapeshiftAccessToken,
    storedAllowance,
    allowanceSet,
    shapeshiftAuthPressed,
    pressedTokenAllowanceId,
    authoriseWithShapeShift,
    setFromAmount,
    onSetTokenAllowancePress,
  } = additionalData;

  const {
    _id: offerId,
    minQuantity,
    maxQuantity,
    fromAsset,
  } = offer;

  const { code: fromAssetCode } = fromAsset;
  const isSetAllowancePressed = pressedTokenAllowanceId === offerId;
  const minOrMaxAmount = formatAmountDisplay(isBelowMin ? minQuantity : maxQuantity);

  if (minOrMaxNeeded) {
    return {
      title: `${isBelowMin ? 'Min' : 'Max'} ${minOrMaxAmount} ${fromAssetCode}`,
      onPress: () => setFromAmount(isBelowMin ? minQuantity : maxQuantity),
    };
  } else if (isShapeShift && !shapeshiftAccessToken) {
    return {
      title: 'Connect',
      onPress: authoriseWithShapeShift,
      disabled: shapeshiftAuthPressed,
    };
  } else if (!allowanceSet) {
    return {
      title: storedAllowance ? 'Pending' : 'Allow this exchange',
      onPress: () => onSetTokenAllowancePress(offer),
      disabled: isSetAllowancePressed || !!storedAllowance,
      isLoading: isSetAllowancePressed,
    };
  }
  return null;
}

class ExchangeOffers extends React.Component<Props, State> {
  state = {
    pressedOfferId: '',
    shapeshiftAuthPressed: false,
    pressedTokenAllowanceId: '',
    isEnableAssetModalVisible: false,
    enableData: null,
    enablePayload: null,
  };

  onShapeshiftAuthPress = () => {
    const { authorizeWithShapeshift } = this.props;
    this.setState({ shapeshiftAuthPressed: true }, async () => {
      await authorizeWithShapeshift();
      this.setState({ shapeshiftAuthPressed: false });
    });
  };

  onSetTokenAllowancePress = (offer: Offer) => {
    const {
      exchangeSupportedAssets,
      providersMeta,
      baseFiatCurrency,
      gasInfo,
      setTokenAllowance,
      setExecutingTransaction,
      rates,
      balances,
    } = this.props;

    const {
      _id,
      provider,
      fromAsset,
      toAsset,
      trackId = '',
    } = offer;
    const { address: fromAssetAddress, code: fromAssetCode, decimals } = fromAsset;
    const { address: toAssetAddress, code: toAssetCode } = toAsset;

    this.setState({ pressedTokenAllowanceId: _id }, () => {
      setTokenAllowance(fromAssetCode, fromAssetAddress, toAssetAddress, provider, trackId, (response) => {
        this.setState({ pressedTokenAllowanceId: '' }); // reset set allowance button to be enabled
        if (isEmpty(response)) return;
        setExecutingTransaction();
        const {
          gasLimit,
          payToAddress,
          transactionObj: {
            data,
          } = {},
        } = response;

        const assetToEnable = exchangeSupportedAssets.find(({ symbol }) => symbol === fromAssetCode) || {};
        const { symbol: assetSymbol, iconUrl: assetIcon } = assetToEnable;
        const providerName = getCryptoProviderName(providersMeta, provider);
        const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
        const gasPriceInfo = gasInfo.gasPrice[NORMAL] || 0;
        const gasPrice = utils.parseUnits(gasPriceInfo.toString(), 'gwei');
        const txFeeInWei = gasPrice.mul(gasLimit);
        const feeInEth = formatAmount(utils.formatEther(txFeeInWei));

        const transactionPayload = {
          gasLimit,
          txFeeInWei,
          gasPrice,
          amount: 0,
          to: payToAddress,
          symbol: fromAssetCode,
          contractAddress: fromAssetAddress || '',
          decimals: parseInt(decimals, 10) || 18,
          data,
          extra: {
            allowance: {
              provider,
              fromAssetCode,
              toAssetCode,
            },
          },
        };

        const ethBalance = getBalance(balances, ETH);
        const balanceInWei = utils.parseUnits(ethBalance.toString(), 'ether');
        const isDisabled = !balanceInWei.gte(txFeeInWei);

        this.setState({
          isEnableAssetModalVisible: true,
          enableData: {
            providerName,
            assetSymbol,
            assetIcon,
            fiatCurrency,
            feeInEth,
            feeInFiat: (parseFloat(feeInEth) * getRate(rates, ETH, fiatCurrency)).toFixed(2),
            isDisabled,
          },
          enablePayload: transactionPayload,
        });
      });
    });
  };

  hideEnableAssetModal = () => {
    const { setDismissTransaction } = this.props;
    setDismissTransaction();
    this.setState({ isEnableAssetModalVisible: false, enableData: null });
  };

  enableAsset = () => {
    const { enablePayload } = this.state;
    const { navigation } = this.props;
    this.hideEnableAssetModal();

    navigation.navigate(SEND_TOKEN_PIN_CONFIRM, {
      transactionPayload: enablePayload,
      goBackDismiss: true,
      transactionType: EXCHANGE,
    });
  };

  onOfferPress = (offer: Offer) => {
    const {
      navigation,
      takeOffer,
      setExecutingTransaction,
      value: {
        fromInput: {
          input: selectedSellAmount,
        },
      },
    } = this.props;

    const {
      _id,
      provider,
      fromAsset,
      toAsset,
      askRate,
      trackId = '',
    } = offer;
    const { code: fromAssetCode } = fromAsset;
    const { code: toAssetCode } = toAsset;
    const amountToSell = parseFloat(selectedSellAmount);
    const amountToBuy = calculateAmountToBuy(askRate, amountToSell);

    this.setState({ pressedOfferId: _id }, () => {
      takeOffer(fromAssetCode, toAssetCode, amountToSell, provider, trackId, order => {
        this.setState({ pressedOfferId: '' }); // reset offer card button loading spinner
        if (isEmpty(order)) return;
        setExecutingTransaction();
        navigation.navigate(EXCHANGE_CONFIRM, {
          offerOrder: {
            ...order,
            receiveQuantity: amountToBuy, // this value should be provided by exchange, currently returning 0,
            // hence we overwrite it with our calculation
            provider,
          },
        });
      });
    });
  };

  onFiatOfferPress = (offer: FiatOffer) => {
    const {
      navigation,
      value: {
        fromInput: {
          input: selectedSellAmount,
        },
      },
    } = this.props;
    const { provider } = offer;

    if (provider === 'SendWyre') {
      this.openSendWyre(selectedSellAmount, offer);
      return;
    }

    navigation.navigate(FIAT_EXCHANGE, {
      fiatOfferOrder: {
        ...offer,
        amount: selectedSellAmount,
      },
    });
  };

  openSendWyre(selectedSellAmount: string, offer: FiatOffer) {
    const { accounts, btcAddresses } = this.props;
    const { fromAsset, toAsset } = offer;
    const { code: fromAssetCode } = fromAsset;
    const { code: toAssetCode } = toAsset;

    let destAddress;
    if (toAssetCode === 'BTC') {
      destAddress = btcAddresses[0].address;
    } else {
      destAddress = getActiveAccountAddress(accounts);
    }

    const wyreUrl = wyreWidgetUrl(
      destAddress,
      toAssetCode,
      fromAssetCode,
      selectedSellAmount,
    );

    InAppBrowser.open(wyreUrl).catch(error => {
      console.error('InAppBrowser.error', error); // eslint-disable-line no-console
    });
  }

  renderOffers = ({ item: offer }, disableNonFiatExchange: boolean) => {
    const {
      pressedOfferId,
      shapeshiftAuthPressed,
      pressedTokenAllowanceId,
    } = this.state;
    const {
      exchangeAllowances,
      connectedProviders,
      providersMeta,
      theme,
      value: { fromInput },
      setFromAmount,
    } = this.props;
    const { input: selectedSellAmount } = fromInput;
    const {
      _id: offerId,
      minQuantity,
      maxQuantity,
      askRate,
      toAsset,
      fromAsset,
      provider: offerProvider,
      feeAmount,
      extraFeeAmount,
      quoteCurrencyAmount,
      offerRestricted,
    } = offer;
    let { allowanceSet = true } = offer;

    const { code: toAssetCode } = toAsset;
    const { code: fromAssetCode } = fromAsset;

    let storedAllowance;
    if (!allowanceSet) {
      storedAllowance = exchangeAllowances.find(
        ({ provider, fromAssetCode: _fromAssetCode, toAssetCode: _toAssetCode }) => _fromAssetCode === fromAssetCode
          && _toAssetCode === toAssetCode && provider === offerProvider,
      );
      allowanceSet = storedAllowance && storedAllowance.enabled;
    }

    const available = getAvailable(minQuantity, maxQuantity, askRate);
    const amountToBuy = calculateAmountToBuy(askRate, selectedSellAmount);
    const isTakeOfferPressed = pressedOfferId === offerId;
    const isShapeShift = offerProvider === PROVIDER_SHAPESHIFT;
    const providerLogo = getOfferProviderLogo(providersMeta, offerProvider, theme, 'horizontal');
    const amountToBuyString = formatAmountDisplay(amountToBuy);

    let shapeshiftAccessToken;
    if (isShapeShift) {
      ({ extra: shapeshiftAccessToken } = connectedProviders
        .find(({ id: providerId }) => providerId === PROVIDER_SHAPESHIFT) || {});
    }

    const amountToSell = parseFloat(selectedSellAmount);
    const minQuantityNumeric = parseFloat(minQuantity);
    const maxQuantityNumeric = parseFloat(maxQuantity);
    const isBelowMin = minQuantityNumeric !== 0 && amountToSell < minQuantityNumeric;
    const isAboveMax = maxQuantityNumeric !== 0 && amountToSell > maxQuantityNumeric;

    const minOrMaxNeeded = isBelowMin || isAboveMax;
    const isTakeButtonDisabled = !!minOrMaxNeeded
      || isTakeOfferPressed
      || !allowanceSet
      || (isShapeShift && !shapeshiftAccessToken);

    const isFiat = isFiatProvider(offerProvider);

    const disableFiatExchange = isFiat && (minOrMaxNeeded || !!offerRestricted);
    const disableOffer = disableNonFiatExchange || disableFiatExchange;

    const additionalData = {
      offer,
      minOrMaxNeeded,
      isBelowMin,
      isShapeShift,
      shapeshiftAccessToken,
      allowanceSet,
      storedAllowance,
      shapeshiftAuthPressed,
      pressedTokenAllowanceId,
      authoriseWithShapeShift: this.onShapeshiftAuthPress,
      setFromAmount,
      onSetTokenAllowancePress: this.onSetTokenAllowancePress,
    };

    if (isFiat) {
      return (
        <OfferCardWrapper>
          <OfferCard
            isDisabled={isTakeButtonDisabled || disableOffer}
            onPress={() => this.onFiatOfferPress(offer)}
            labelTop="Amount total"
            valueTop={`${askRate} ${fromAssetCode}`}
            cardImageSource={providerLogo}
            labelBottom="Fees total"
            valueBottom={feeAmount ?
              `${formatAmountDisplay(feeAmount + extraFeeAmount)} ${fromAssetCode}`
              : 'Will be calculated'
            }
            cardButton={{
              title: `${formatAmountDisplay(quoteCurrencyAmount)} ${toAssetCode}`,
              onPress: () => this.onFiatOfferPress(offer),
              disabled: disableFiatExchange,
              isLoading: isTakeOfferPressed,
            }}
            cardNote={offerRestricted}
            additionalCardButton={getCardAdditionalButtonData(additionalData)}
          />
        </OfferCardWrapper>
      );
    }

    return (
      <OfferCardWrapper>
        <OfferCard
          isDisabled={isTakeButtonDisabled || disableOffer}
          onPress={() => this.onOfferPress(offer)}
          labelTop="Exchange rate"
          valueTop={formatAmountDisplay(askRate)}
          cardImageSource={providerLogo}
          labelBottom="Available"
          valueBottom={available}
          cardButton={{
            title: `${amountToBuyString} ${toAssetCode}`,
            onPress: () => this.onOfferPress(offer),
            disabled: isTakeButtonDisabled || disableNonFiatExchange,
            isLoading: isTakeOfferPressed,
          }}
          additionalCardButton={getCardAdditionalButtonData(additionalData)}
        />
      </OfferCardWrapper>
    );
  };

  render() {
    const {
      offers,
      disableNonFiatExchange,
      isExchangeActive,
      showEmptyMessage,
    } = this.props;
    const { isEnableAssetModalVisible, enableData } = this.state;
    const reorderedOffers = offers.sort((a, b) => (new BigNumber(b.askRate)).minus(a.askRate).toNumber());

    return (
      <React.Fragment>
        <FlatList
          data={reorderedOffers}
          keyExtractor={(item) => item._id}
          style={{ width: '100%', flex: 1 }}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            width: '100%',
            paddingVertical: 10,
            flexGrow: 1,
          }}
          renderItem={(props) => this.renderOffers(props, disableNonFiatExchange)}
          ListHeaderComponent={(
            <ListHeader>
              <ExchangeStatus isVisible={isExchangeActive} />
            </ListHeader>
          )}
          ListEmptyComponent={!!showEmptyMessage && (
            <ESWrapper style={{ marginTop: '15%', marginBottom: spacing.large }}>
              <EmptyStateParagraph
                title="No live offers"
                bodyText="Currently no matching offers from exchange services are provided.
                                New offers may appear at any time — don’t miss it."
                large
                wide
              />
            </ESWrapper>
          )}
          // ListFooterComponentStyle={{ flex: 1, justifyContent: 'flex-end' }}
          // ListFooterComponent={
          //   <PopularSwapsGridWrapper>
          //     <SafeAreaView forceInset={{ top: 'never', bottom: 'always' }}>
          //       <MediumText medium style={{ marginBottom: spacing.medium }}>
          //           Try these popular swaps
          //       </MediumText>
          //       <HotSwapsGridList onPress={this.onSwapPress} swaps={swaps} />
          //     </SafeAreaView>
          //   </PopularSwapsGridWrapper>
          // }
        />
        <AssetEnableModal
          isVisible={isEnableAssetModalVisible}
          onModalHide={this.hideEnableAssetModal}
          onEnable={this.enableAsset}
          enableData={enableData}
        />
      </React.Fragment>
    );
  }
}


const mapStateToProps = ({
  accounts: { data: accounts },
  appSettings: { data: { baseFiatCurrency } },
  exchange: {
    data: {
      offers,
      allowances: exchangeAllowances,
      connectedProviders,
    },
    providersMeta,
    exchangeSupportedAssets,
  },
  bitcoin: { data: { addresses: btcAddresses } },
  history: { gasInfo },
  rates: { data: rates },
}: RootReducerState): $Shape<Props> => ({
  accounts,
  baseFiatCurrency,
  offers,
  exchangeAllowances,
  connectedProviders,
  providersMeta,
  exchangeSupportedAssets,
  btcAddresses,
  gasInfo,
  rates,
});

const structuredSelector = createStructuredSelector({
  balances: accountBalancesSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  authorizeWithShapeshift: () => dispatch(authorizeWithShapeshiftAction()),
  setExecutingTransaction: () => dispatch(setExecutingTransactionAction()),
  setDismissTransaction: () => dispatch(setDismissTransactionAction()),
  setTokenAllowance: (formAssetCode, fromAssetAddress, toAssetAddress, provider, trackId, callback) => dispatch(
    setTokenAllowanceAction(formAssetCode, fromAssetAddress, toAssetAddress, provider, trackId, callback),
  ),
  takeOffer: (fromAssetCode, toAssetCode, fromAmount, provider, trackId, callback) => dispatch(
    takeOfferAction(fromAssetCode, toAssetCode, fromAmount, provider, trackId, callback),
  ),
});


export default withTheme(connect(combinedMapStateToProps, mapDispatchToProps)(ExchangeOffers));