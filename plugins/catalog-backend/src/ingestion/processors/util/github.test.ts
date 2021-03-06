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

import { graphql } from '@octokit/graphql';
import { graphql as graphqlMsw } from 'msw';
import { setupServer } from 'msw/node';
import { msw } from '@backstage/test-utils';
import {
  getOrganizationTeams,
  getOrganizationUsers,
  getTeamMembers,
  QueryResponse,
} from './github';

describe('github', () => {
  const server = setupServer();
  msw.setupDefaultHandlers(server);

  describe('getOrganizationUsers', () => {
    it('reads members', async () => {
      const input: QueryResponse = {
        organization: {
          membersWithRole: {
            pageInfo: { hasNextPage: false },
            nodes: [
              {
                login: 'a',
                name: 'b',
                bio: 'c',
                email: 'd',
                avatarUrl: 'e',
              },
            ],
          },
        },
      };

      const output = {
        users: [
          expect.objectContaining({
            metadata: expect.objectContaining({ name: 'a', description: 'c' }),
            spec: {
              profile: { displayName: 'b', email: 'd', picture: 'e' },
              memberOf: [],
            },
          }),
        ],
      };

      server.use(
        graphqlMsw.query('users', (_req, res, ctx) => res(ctx.data(input))),
      );

      await expect(getOrganizationUsers(graphql, 'a')).resolves.toEqual(output);
    });
  });

  describe('getOrganizationTeams', () => {
    it('reads teams', async () => {
      const input: QueryResponse = {
        organization: {
          teams: {
            pageInfo: { hasNextPage: false },
            nodes: [
              {
                slug: 'team',
                combinedSlug: 'blah/team',
                parentTeam: {
                  slug: 'parent',
                  combinedSlug: '',
                  members: { pageInfo: { hasNextPage: false }, nodes: [] },
                },
                members: {
                  pageInfo: { hasNextPage: false },
                  nodes: [{ login: 'user' }],
                },
              },
            ],
          },
        },
      };

      const output = {
        groups: [
          expect.objectContaining({
            metadata: expect.objectContaining({ name: 'team' }),
            spec: {
              type: 'team',
              parent: 'parent',
              ancestors: [],
              children: [],
              descendants: [],
            },
          }),
        ],
        groupMemberUsers: new Map([['team', ['user']]]),
      };

      server.use(
        graphqlMsw.query('teams', (_req, res, ctx) => res(ctx.data(input))),
      );

      await expect(getOrganizationTeams(graphql, 'a')).resolves.toEqual(output);
    });
  });

  describe('getTeamMembers', () => {
    it('reads team members', async () => {
      const input: QueryResponse = {
        organization: {
          team: {
            slug: '',
            combinedSlug: '',
            members: {
              pageInfo: { hasNextPage: false },
              nodes: [{ login: 'user' }],
            },
          },
        },
      };

      const output = {
        members: ['user'],
      };

      server.use(
        graphqlMsw.query('members', (_req, res, ctx) => res(ctx.data(input))),
      );

      await expect(getTeamMembers(graphql, 'a', 'b')).resolves.toEqual(output);
    });
  });
});
