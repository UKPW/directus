import { expect, describe, test, vi, Mock, beforeEach, afterEach } from 'vitest';
import { WebSocketClient } from '../types';
import emitter from '../../emitter';
import { ItemsHandler } from './items';
import { getSchema } from '../../utils/get-schema';
import { ItemsService, MetaService } from '../../services';

// mocking
vi.mock('../controllers', () => ({
	getWebsocketController: vi.fn(() => ({
		clients: new Set(),
	})),
}));
vi.mock('../../utils/get-schema', () => ({
	getSchema: vi.fn(),
}));
vi.mock('../../services', () => ({
	ItemsService: vi.fn(),
	MetaService: vi.fn(),
}));
function mockClient() {
	return {
		on: vi.fn(),
		off: vi.fn(),
		send: vi.fn(),
		close: vi.fn(),
		accountability: null,
	} as unknown as WebSocketClient;
}
function delay(ms: number) {
	return new Promise<void>((resolve) => {
		setTimeout(() => resolve(), ms);
	});
}

describe('Websocket heartbeat handler', () => {
	let handler: ItemsHandler;
	beforeEach(() => {
		// initialize handler
		handler = new ItemsHandler();
	});
	afterEach(() => {
		emitter.offAll();
		vi.clearAllMocks();
	});

	test('ignore other message types', async () => {
		const spy = vi.spyOn(handler, 'onMessage');
		// receive message
		emitter.emitAction('websocket.message', {
			client: mockClient(),
			message: { type: 'PONG' },
		});
		// expect nothing
		expect(spy).not.toBeCalled();
	});
	test('invalid collection should error', async () => {
		(getSchema as Mock).mockImplementation(() => ({ collections: {} }));
		// receive message
		const fakeClient = mockClient();
		emitter.emitAction('websocket.message', {
			client: fakeClient,
			message: { type: 'ITEMS', collection: 'test', action: 'create', data: {} },
		});
		await delay(10); // 10ms to make sure the event is handled
		// expect error
		expect(fakeClient.send).toBeCalledWith(
			'{"type":"items","status":"error","error":{"code":"INVALID_COLLECTION","message":"The provided collection does not exists or is not accessible."}}'
		);
	});
	test('create one item', async () => {
		// do mocking
		(getSchema as Mock).mockImplementation(() => ({ collections: { test: [] } }));
		const createOne = vi.fn(),
			readOne = vi.fn();
		(ItemsService as Mock).mockImplementation(() => ({ createOne, readOne }));
		// receive message
		const fakeClient = mockClient();
		emitter.emitAction('websocket.message', {
			client: fakeClient,
			message: { type: 'ITEMS', collection: 'test', action: 'create', data: {} },
		});
		await delay(10); // 10ms to make sure the event is handled
		// expect service functions
		expect(createOne).toBeCalled();
		expect(readOne).toBeCalled();
		expect(fakeClient.send).toBeCalled();
	});
	test('create multiple items', async () => {
		// do mocking
		(getSchema as Mock).mockImplementation(() => ({ collections: { test: [] } }));
		const createMany = vi.fn(),
			readMany = vi.fn();
		(ItemsService as Mock).mockImplementation(() => ({ createMany, readMany }));
		// receive message
		const fakeClient = mockClient();
		emitter.emitAction('websocket.message', {
			client: fakeClient,
			message: { type: 'ITEMS', collection: 'test', action: 'create', data: [{}, {}] },
		});
		await delay(10); // 10ms to make sure the event is handled
		// expect service functions
		expect(createMany).toBeCalled();
		expect(readMany).toBeCalled();
		expect(fakeClient.send).toBeCalled();
	});
	test('read by query', async () => {
		// do mocking
		(getSchema as Mock).mockImplementation(() => ({ collections: { test: [] } }));
		const readByQuery = vi.fn();
		(ItemsService as Mock).mockImplementation(() => ({ readByQuery }));
		const getMetaForQuery = vi.fn();
		(MetaService as Mock).mockImplementation(() => ({ getMetaForQuery }));
		// receive message
		const fakeClient = mockClient();
		emitter.emitAction('websocket.message', {
			client: fakeClient,
			message: { type: 'ITEMS', collection: 'test', action: 'read', query: {} },
		});
		await delay(10); // 10ms to make sure the event is handled
		// expect service functions
		expect(readByQuery).toBeCalled();
		expect(getMetaForQuery).toBeCalled();
		expect(fakeClient.send).toBeCalled();
	});
	test('update one item', async () => {
		// do mocking
		(getSchema as Mock).mockImplementation(() => ({ collections: { test: [] } }));
		const updateOne = vi.fn(),
			readOne = vi.fn();
		(ItemsService as Mock).mockImplementation(() => ({ updateOne, readOne }));
		// receive message
		const fakeClient = mockClient();
		emitter.emitAction('websocket.message', {
			client: fakeClient,
			message: { type: 'ITEMS', collection: 'test', action: 'update', data: {}, id: '123' },
		});
		await delay(10); // 10ms to make sure the event is handled
		// expect service functions
		expect(updateOne).toBeCalled();
		expect(readOne).toBeCalled();
		expect(fakeClient.send).toBeCalled();
	});
	test('update multiple items', async () => {
		// do mocking
		(getSchema as Mock).mockImplementation(() => ({ collections: { test: [] } }));
		const updateMany = vi.fn(),
			readMany = vi.fn();
		(ItemsService as Mock).mockImplementation(() => ({ updateMany, readMany }));
		const getMetaForQuery = vi.fn();
		(MetaService as Mock).mockImplementation(() => ({ getMetaForQuery }));
		// receive message
		const fakeClient = mockClient();
		emitter.emitAction('websocket.message', {
			client: fakeClient,
			message: { type: 'ITEMS', collection: 'test', action: 'update', data: {}, ids: ['123', '456'] },
		});
		await delay(10); // 10ms to make sure the event is handled
		// expect service functions
		expect(updateMany).toBeCalled();
		expect(getMetaForQuery).toBeCalled();
		expect(readMany).toBeCalled();
		expect(fakeClient.send).toBeCalled();
	});
	test('delete one item', async () => {
		// do mocking
		(getSchema as Mock).mockImplementation(() => ({ collections: { test: [] } }));
		const deleteOne = vi.fn();
		(ItemsService as Mock).mockImplementation(() => ({ deleteOne }));
		// receive message
		const fakeClient = mockClient();
		emitter.emitAction('websocket.message', {
			client: fakeClient,
			message: { type: 'ITEMS', collection: 'test', action: 'delete', id: '123' },
		});
		await delay(10); // 10ms to make sure the event is handled
		// expect service functions
		expect(deleteOne).toBeCalled();
		expect(fakeClient.send).toBeCalled();
	});
	test('delete multiple items by id', async () => {
		// do mocking
		(getSchema as Mock).mockImplementation(() => ({ collections: { test: [] } }));
		const deleteMany = vi.fn();
		(ItemsService as Mock).mockImplementation(() => ({ deleteMany }));
		// receive message
		const fakeClient = mockClient();
		emitter.emitAction('websocket.message', {
			client: fakeClient,
			message: { type: 'ITEMS', collection: 'test', action: 'delete', ids: ['123', 456] },
		});
		await delay(10); // 10ms to make sure the event is handled
		// expect service functions
		expect(deleteMany).toBeCalled();
		expect(fakeClient.send).toBeCalled();
	});
	test('delete multiple items by query', async () => {
		// do mocking
		(getSchema as Mock).mockImplementation(() => ({ collections: { test: [] } }));
		const deleteByQuery = vi.fn();
		(ItemsService as Mock).mockImplementation(() => ({ deleteByQuery }));
		// receive message
		const fakeClient = mockClient();
		emitter.emitAction('websocket.message', {
			client: fakeClient,
			message: { type: 'ITEMS', collection: 'test', action: 'delete', query: {} },
		});
		await delay(10); // 10ms to make sure the event is handled
		// expect service functions
		expect(deleteByQuery).toBeCalled();
		expect(fakeClient.send).toBeCalled();
	});
});
