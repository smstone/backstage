/*
 * Copyright 2020 Spotify AB
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import GoogleIcon from '@material-ui/icons/AcUnit';
import { googleAuthApiRef } from '../../../definitions/auth';
import {
  OAuthRequestApi,
  AuthProvider,
  DiscoveryApi,
} from '../../../definitions';
import { OAuth2 } from '../oauth2';

type CreateOptions = {
  discoveryApi: DiscoveryApi;
  oauthRequestApi: OAuthRequestApi;

  environment?: string;
  provider?: AuthProvider & { id: string };
};

const DEFAULT_PROVIDER = {
  id: 'google',
  title: 'Google',
  icon: GoogleIcon,
};

class GoogleAuth {
  static create({
    discoveryApi,
    oauthRequestApi,
    environment = 'development',
    provider = DEFAULT_PROVIDER,
  }: CreateOptions): typeof googleAuthApiRef.T {
    const SCOPE_PREFIX = 'https://www.googleapis.com/auth/';

    return OAuth2.create({
      discoveryApi,
      oauthRequestApi,
      provider,
      environment,
      defaultScopes: [
        'openid',
        `${SCOPE_PREFIX}userinfo.email`,
        `${SCOPE_PREFIX}userinfo.profile`,
      ],
      scopeTransform(scopes: string[]) {
        return scopes.map(scope => {
          if (scope === 'openid') {
            return scope;
          }

          if (scope === 'profile' || scope === 'email') {
            return `${SCOPE_PREFIX}userinfo.${scope}`;
          }

          if (scope.startsWith(SCOPE_PREFIX)) {
            return scope;
          }

          return `${SCOPE_PREFIX}${scope}`;
        });
      },
    });
  }
}
export default GoogleAuth;
