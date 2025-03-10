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
import { isEmpty, mapValues } from 'lodash';
import t from 'translations/translate';
import { NotificationTypes as EtherspotNotificationTypes } from 'etherspot';

// components
import Toast from 'components/Toast';

// constants
import { ACCOUNT_TYPES } from 'constants/accountsConstants';
import { SET_HISTORY, TX_CONFIRMED_STATUS } from 'constants/historyConstants';
import { CHAIN_NAMES, CHAIN_SHORT } from 'constants/chainConstants';

// actions
import {
  addAccountAction,
  updateAccountExtraIfNeededAction,
  setActiveAccountAction,
} from 'actions/accountsActions';
import { saveDbAction } from 'actions/dbActions';
import { setEnsNameIfNeededAction } from 'actions/ensRegistryActions';
import { setHistoryTransactionStatusByHashAction } from 'actions/historyActions';
import { fetchAssetsBalancesAction } from 'actions/assetsActions';
import { logEventAction } from 'actions/analyticsActions';

// services
import etherspotService from 'services/etherspot';

// selectors
import {
  accountsSelector,
  historySelector,
  supportedAssetsPerChainSelector,
  activeAccountSelector,
} from 'selectors';
import { accountHistorySelector } from 'selectors/history';

// utils
import { normalizeWalletAddress } from 'utils/wallet';
import {
  formatUnits,
  isCaseInsensitiveMatch,
  reportErrorLog,
} from 'utils/common';
import {
  findAccountById,
  findFirstEtherspotAccount,
  getAccountAddress,
  getAccountId,
  isEtherspotAccount,
} from 'utils/accounts';
import { findAssetByAddress } from 'utils/assets';
import { parseEtherspotTransactionState } from 'utils/etherspot';
import { isLogV2AppEvents } from 'utils/environment';

// types
import type { Dispatch, GetState } from 'reducers/rootReducer';
import type { Chain } from 'models/Chain';
import type { EtherspotAccountExtra } from 'models/Account';


export const connectEtherspotAccountAction = (accountId: string) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const accounts = accountsSelector(getState());

    const account = findAccountById(accountId, accounts);
    if (!account) {
      reportErrorLog('connectEtherspotAccountAction failed: no account', { accountId });
      return;
    }

    const accountAddress = getAccountAddress(account);
    const extra = await etherspotService.getAccountPerChains(accountAddress);

    if (!extra?.ethereum) {
      reportErrorLog('connectEtherspotAccountAction failed: no ethereum account', { accountId, account });
      return;
    }

    // update account extras
    dispatch(updateAccountExtraIfNeededAction(accountId, extra));
  };
};

export const initEtherspotServiceAction = (privateKey: string) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      session: { data: { isOnline, fcmToken } },
    } = getState();

    if (!isOnline) return; // nothing to do

    await etherspotService.init(privateKey, fcmToken);

    const accounts = accountsSelector(getState());
    const etherspotAccount = findFirstEtherspotAccount(accounts);

    // not an issue at this point, just no etherspot account
    if (!etherspotAccount) return;

    const accountId = getAccountId(etherspotAccount);
    dispatch(connectEtherspotAccountAction(accountId));
  };
};

export const importEtherspotAccountsAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      session: { data: session },
      user: { data: user },
    } = getState();

    if (!session.isOnline) return; // offline, nothing to dp

    if (!etherspotService?.sdk) {
      reportErrorLog('importEtherspotAccountsAction failed: action dispatched when Etherspot SDK was not initialized');
      return;
    }

    if (!user) {
      reportErrorLog('importEtherspotAccountsAction failed: no user');
      return;
    }

    const etherspotAccounts = await etherspotService.getAccounts();
    if (!etherspotAccounts) {
      // Note: there should be always at least one account, it syncs on Etherspot SDK init, otherwise it's failure
      reportErrorLog('importEtherspotAccountsAction failed: no accounts', { etherspotAccounts });
      return;
    }

    // sync accounts with app
    await Promise.all(etherspotAccounts.map(async ({ address: etherspotAccountAddress }) => {
      const extra = await etherspotService.getAccountPerChains(etherspotAccountAddress);
      dispatch(addAccountAction(
        etherspotAccountAddress,
        ACCOUNT_TYPES.ETHERSPOT_SMART_WALLET,
        extra, // full object as extras
      ));
    }));

    const accountId = normalizeWalletAddress(etherspotAccounts[0].address);

    // set active
    dispatch(setActiveAccountAction(accountId));

    // set ENS if needed
    dispatch(setEnsNameIfNeededAction());
  };
};

export const refreshEtherspotAccountsAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      session: { data: session },
      user: { data: user },
    } = getState();

    const account = activeAccountSelector(getState());

    if (!session.isOnline) return; // offline, nothing to dp

    if (!etherspotService?.sdk) {
      reportErrorLog('refreshEtherspotAccountsAction failed: action dispatched when Etherspot SDK was not initialized');
      return;
    }

    if (!user) {
      reportErrorLog('refreshEtherspotAccountsAction failed: no user');
      return;
    }

    const etherspotAccounts = await etherspotService.getAccounts();
    if (!etherspotAccounts) {
      // Note: there should be always at least one account, it syncs on Etherspot SDK init, otherwise it's failure
      reportErrorLog('refreshEtherspotAccountsAction failed: no accounts', { etherspotAccounts });
      return;
    }

    // sync accounts with app
    await Promise.all(
      etherspotAccounts.map(async ({ address: etherspotAccountAddress }) => {
        const extra = await etherspotService.getAccountPerChains(etherspotAccountAddress);
        if (isEtherspotAccount(account)) handleAccountStateChange(extra, account?.extra, dispatch);
        dispatch(updateAccountExtraIfNeededAction(etherspotAccountAddress, extra));
      }),
    );
  };
};

const getChain = (chain: Chain) => {
  switch (chain) {
    case CHAIN_NAMES.ETHEREUM:
      return CHAIN_SHORT.ETHEREUM.toLowerCase();
    case CHAIN_NAMES.BINANCE:
      return CHAIN_SHORT.BINANCE.toLowerCase();
    case CHAIN_NAMES.XDAI:
      return CHAIN_SHORT.XDAI.toLowerCase();
    case CHAIN_NAMES.POLYGON:
      return CHAIN_SHORT.POLYGON.toLowerCase();
    default:
      return '';
  }
};

const handleAccountStateChange = (
  etherspotAccountExtra: EtherspotAccountExtra,
  initialEtherspotAccountExtra: EtherspotAccountExtra,
  dispatch: Dispatch,
) => {
  const chains = Object.keys(etherspotAccountExtra);
  chains.forEach((chainName) => {
    if (
      initialEtherspotAccountExtra[chainName]?.state !== etherspotAccountExtra[chainName]?.state &&
      isLogV2AppEvents()
    ) {
      dispatch(logEventAction(`v2_account_deployed_${getChain(chainName)}`));
    }
  });
};

export const reserveEtherspotEnsNameAction = (username: string) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      accounts: { data: accounts },
      session: { data: { isOnline } },
    } = getState();

    if (!isOnline) return; // nothing to do

    const etherspotAccount = findFirstEtherspotAccount(accounts);
    if (!etherspotAccount) {
      reportErrorLog('reserveEtherspotENSNameAction failed: no Etherspot account found');
      return;
    }

    const reserved = await etherspotService.reserveEnsName(username);
    if (!reserved) {
      reportErrorLog('reserveEtherspotENSNameAction reserveENSName failed', { username });
    }
  };
};

const updateBatchTransactionHashAction = (
  chain: Chain,
  batchHash: string,
  transactionHash: string,
) => {
  return (dispatch: Dispatch, getState: GetState) => {
    const allAccountsHistory = historySelector(getState());

    const updatedHistory = Object.keys(allAccountsHistory).reduce((history, accountId) => {
      const accountHistory = mapValues(
        allAccountsHistory[accountId],
        (transactions = [], accountHistoryChain) => transactions.map((transaction) => {
          if (isCaseInsensitiveMatch(transaction.batchHash, batchHash) && accountHistoryChain === chain) {
            return { ...transaction, hash: transactionHash };
          }

          return transaction;
        }),
      );

      return { ...history, [accountId]: accountHistory };
    }, {});

    dispatch(saveDbAction('history', { history: updatedHistory }, true));
    dispatch({ type: SET_HISTORY, payload: updatedHistory });
  };
};

export const subscribeToEtherspotNotificationsAction = () => {
  return (dispatch: Dispatch, getState: GetState) => {
    etherspotService.subscribe((chain: Chain, notification) => {
      try {
        switch (notification.type) {
          case EtherspotNotificationTypes.AccountUpdated:
            handleAccountUpdatedNotification(notification, chain, dispatch);
            break;
          case EtherspotNotificationTypes.GatewayBatchUpdated:
            handleGatewayBatchUpdatedNotification(notification, chain, dispatch, getState);
            break;
          case EtherspotNotificationTypes.ENSNodeUpdated:
            isLogV2AppEvents() && dispatch(logEventAction('v2_ens_claimed'));
            break;
          case EtherspotNotificationTypes.TransactionUpdated:
            isLogV2AppEvents() && dispatch(logEventAction('v2_transaction_received'));
            break;
          default:
            break;
        }
      } catch (error) {
        reportErrorLog('Etherspot notificaiton handler failed', {
          error,
          chain,
          notificationType: notification.type,
          notification,
        });
      }
    });
  };
};

export const unsubscribeToEtherspotNotificationsAction = () => {
  return () => {
    etherspotService.unsubscribe();
  };
};

const handleAccountUpdatedNotification = (
  notification: any,
  chain: Chain,
  dispatch: Dispatch,
) => {
  dispatch(refreshEtherspotAccountsAction());
};

const handleGatewayBatchUpdatedNotification = async (
  notification: any,
  chain: Chain,
  dispatch: Dispatch,
  getState: GetState,
) => {
  const { hash: batchHash } = notification.payload;
  const submittedBatch = await etherspotService.getSubmittedBatchByHash(chain, batchHash);

  // check if submitted hash exists within Etherspot otherwise it's a failure
  if (!submittedBatch) {
    reportErrorLog('handleGatewayBatchUpdatedNotification failed: no matching batch', { notification });
    return;
  }

  const accountHistory = accountHistorySelector(getState());
  const history = accountHistory[chain] ?? [];

  const existingTransaction = history.find(({ batchHash: existingBatchHash }) =>
    isCaseInsensitiveMatch(existingBatchHash, batchHash),
  );

  // check if matching transaction exists in history, if not – nothing to update
  if (!existingTransaction) return;

  // update transaction with actual hash received from batch
  const transactionHash = submittedBatch?.transaction?.hash;
  if (!isCaseInsensitiveMatch(transactionHash, existingTransaction.hash)) {
    dispatch(updateBatchTransactionHashAction(chain, batchHash, transactionHash));
  }

  const supportedAssetsPerChain = supportedAssetsPerChainSelector(getState());
  const chainSupportedAssets = supportedAssetsPerChain[chain] ?? [];

  const assetData = findAssetByAddress(chainSupportedAssets, existingTransaction.assetAddress);

  const mappedEtherspotBatchStatus = parseEtherspotTransactionState(submittedBatch.state);

  let notificationMessage;

  // checks for confirmed transaction notification
  if (
    existingTransaction.status !== mappedEtherspotBatchStatus &&
    mappedEtherspotBatchStatus === TX_CONFIRMED_STATUS &&
    existingTransaction.hash
  ) {
    dispatch(setHistoryTransactionStatusByHashAction(existingTransaction.hash, TX_CONFIRMED_STATUS));
    dispatch(fetchAssetsBalancesAction());

    if (!isEmpty(assetData)) {
      const { symbol, decimals } = assetData;
      const { value } = existingTransaction;
      const paymentInfo = `${formatUnits(value, decimals)} ${symbol}`;
      notificationMessage = t('toast.transactionSent', { paymentInfo });
    }
  }

  if (!notificationMessage) return;

  Toast.show({
    message: notificationMessage,
    emoji: 'ok_hand',
    autoClose: true,
  });
};
