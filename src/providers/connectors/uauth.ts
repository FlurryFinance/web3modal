// src/providers/connectors/uauth.ts

import { connectors } from "..";
import Web3Modal from "../../index";
import { IAbstractConnectorOptions } from "../../helpers";

interface IUAuthOptions extends IAbstractConnectorOptions {
    shouldLoginWithRedirect?: boolean;
    clientID: string;
    clientSecret?: string;
    clientAuthMethod: any;
    maxAge: number;
    prompt: string;
    resource?: string;
    redirectUri: string;
    responseMode: any;
    scope: string;
    flowId?: 'login' | 'signup';
}

let w3m: Web3Modal;
const ConnectToUAuth = async (
    UAuth: any,
    opts: IUAuthOptions
) => {
    const uauth = new UAuth(opts);

    let user: any;
    try {
      user = await uauth.user();
    } catch (error) {
      if (!uauth.fallbackLoginOptions.scope.includes('wallet')) {
        throw new Error('Must request the "wallet" scope for connector to work.');
      }
  
      if (opts.shouldLoginWithRedirect) {
        await uauth.login();
  
        // NOTE: We don't want to throw because the page will take some time to
        // load the redirect page.
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        await new Promise<void>(() => {});
        // We need to throw here otherwise typescript won't know that user isn't null.
        throw new Error('Should never get here.');
      } else {
        await uauth.loginWithPopup();
        user = await uauth.user();
      }
    }
  
    if (user.wallet_type_hint == null) {
      throw new Error('no wallet type present');
    }
  
    let provider: any;
    if (['web3', 'injected'].includes(user.wallet_type_hint)) {
      provider = connectors.injected();
    } else if (user.wallet_type_hint === 'walletconnect') {
      const id = 'walletconnect';
  
      provider = connectors.walletconnect(
        (w3m as any).providerController.getProviderOption(id, 'package'),
        {
          network: opts.network,
          ...(w3m as any).providerController.getProviderOption(id, 'options'),
        }
      );
    } else {
      throw new Error('Connector not supported');
    }
  
    return provider;
};

export default ConnectToUAuth;