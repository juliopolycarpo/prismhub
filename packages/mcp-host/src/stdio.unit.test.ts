import { describe, expect, mock, test } from 'bun:test';
import type { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js';

// Must be hoisted before importing the module under test so bun uses the mock.
void mock.module('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: class MockStdioServerTransport {
    onclose: (() => void) | undefined = undefined;
    onerror: ((err: Error) => void) | undefined = undefined;
    onmessage: ((msg: JSONRPCMessage) => void) | undefined = undefined;

    start(): Promise<void> {
      return Promise.resolve();
    }
    send(_message: JSONRPCMessage): Promise<void> {
      return Promise.resolve();
    }
    close(): Promise<void> {
      this.onclose?.();
      return Promise.resolve();
    }
  },
}));

import { connectStdio } from './stdio.ts';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';

describe('connectStdio()', () => {
  test('connects a Server to the transport and returns it', async () => {
    const server = new Server({ name: 'test', version: '0.0.0' }, { capabilities: { tools: {} } });

    const transport = await connectStdio(server);

    expect(transport).toBeDefined();
    await server.close();
  });
});
