/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as $wcm from '@vscode/wasm-component-model';
import type { resource, own, borrow, result, u32, u16, i32, ptr } from '@vscode/wasm-component-model';
import { io } from './io';

export namespace http {
	export namespace Types {
		export const id = 'wasi:http/types' as const;
		
		export type InputStream = io.Streams.InputStream;
		
		export type OutputStream = io.Streams.OutputStream;
		
		export type Pollable = io.Poll.Pollable;
		
		export namespace Method {
			export const get = 'get' as const;
			export type Get = { readonly tag: typeof get } & _common;
			export function Get(): Get {
				return new VariantImpl(get, undefined) as Get;
			}
			
			export const head = 'head' as const;
			export type Head = { readonly tag: typeof head } & _common;
			export function Head(): Head {
				return new VariantImpl(head, undefined) as Head;
			}
			
			export const post = 'post' as const;
			export type Post = { readonly tag: typeof post } & _common;
			export function Post(): Post {
				return new VariantImpl(post, undefined) as Post;
			}
			
			export const put = 'put' as const;
			export type Put = { readonly tag: typeof put } & _common;
			export function Put(): Put {
				return new VariantImpl(put, undefined) as Put;
			}
			
			export const delete_ = 'delete_' as const;
			export type Delete = { readonly tag: typeof delete_ } & _common;
			export function Delete(): Delete {
				return new VariantImpl(delete_, undefined) as Delete;
			}
			
			export const connect = 'connect' as const;
			export type Connect = { readonly tag: typeof connect } & _common;
			export function Connect(): Connect {
				return new VariantImpl(connect, undefined) as Connect;
			}
			
			export const options = 'options' as const;
			export type Options = { readonly tag: typeof options } & _common;
			export function Options(): Options {
				return new VariantImpl(options, undefined) as Options;
			}
			
			export const trace = 'trace' as const;
			export type Trace = { readonly tag: typeof trace } & _common;
			export function Trace(): Trace {
				return new VariantImpl(trace, undefined) as Trace;
			}
			
			export const patch = 'patch' as const;
			export type Patch = { readonly tag: typeof patch } & _common;
			export function Patch(): Patch {
				return new VariantImpl(patch, undefined) as Patch;
			}
			
			export const other = 'other' as const;
			export type Other = { readonly tag: typeof other; readonly value: string } & _common;
			export function Other(value: string): Other {
				return new VariantImpl(other, value) as Other;
			}
			
			export type _tt = typeof get | typeof head | typeof post | typeof put | typeof delete_ | typeof connect | typeof options | typeof trace | typeof patch | typeof other;
			export type _vt = string | undefined;
			type _common = Omit<VariantImpl, 'tag' | 'value'>;
			export function _ctor(t: _tt, v: _vt): Method {
				return new VariantImpl(t, v) as Method;
			}
			class VariantImpl {
				private readonly _tag: _tt;
				private readonly _value?: _vt;
				constructor(t: _tt, value: _vt) {
					this._tag = t;
					this._value = value;
				}
				get tag(): _tt {
					return this._tag;
				}
				get value(): _vt {
					return this._value;
				}
				isGet(): this is Get {
					return this._tag === Method.get;
				}
				isHead(): this is Head {
					return this._tag === Method.head;
				}
				isPost(): this is Post {
					return this._tag === Method.post;
				}
				isPut(): this is Put {
					return this._tag === Method.put;
				}
				isDelete(): this is Delete {
					return this._tag === Method.delete_;
				}
				isConnect(): this is Connect {
					return this._tag === Method.connect;
				}
				isOptions(): this is Options {
					return this._tag === Method.options;
				}
				isTrace(): this is Trace {
					return this._tag === Method.trace;
				}
				isPatch(): this is Patch {
					return this._tag === Method.patch;
				}
				isOther(): this is Other {
					return this._tag === Method.other;
				}
			}
		}
		export type Method = Method.Get | Method.Head | Method.Post | Method.Put | Method.Delete | Method.Connect | Method.Options | Method.Trace | Method.Patch | Method.Other;
		
		export namespace Scheme {
			export const http = 'HTTP' as const;
			export type HTTP = { readonly tag: typeof http } & _common;
			export function HTTP(): HTTP {
				return new VariantImpl(http, undefined) as HTTP;
			}
			
			export const https = 'HTTPS' as const;
			export type HTTPS = { readonly tag: typeof https } & _common;
			export function HTTPS(): HTTPS {
				return new VariantImpl(https, undefined) as HTTPS;
			}
			
			export const other = 'other' as const;
			export type Other = { readonly tag: typeof other; readonly value: string } & _common;
			export function Other(value: string): Other {
				return new VariantImpl(other, value) as Other;
			}
			
			export type _tt = typeof http | typeof https | typeof other;
			export type _vt = string | undefined;
			type _common = Omit<VariantImpl, 'tag' | 'value'>;
			export function _ctor(t: _tt, v: _vt): Scheme {
				return new VariantImpl(t, v) as Scheme;
			}
			class VariantImpl {
				private readonly _tag: _tt;
				private readonly _value?: _vt;
				constructor(t: _tt, value: _vt) {
					this._tag = t;
					this._value = value;
				}
				get tag(): _tt {
					return this._tag;
				}
				get value(): _vt {
					return this._value;
				}
				isHTTP(): this is HTTP {
					return this._tag === Scheme.http;
				}
				isHTTPS(): this is HTTPS {
					return this._tag === Scheme.https;
				}
				isOther(): this is Other {
					return this._tag === Scheme.other;
				}
			}
		}
		export type Scheme = Scheme.HTTP | Scheme.HTTPS | Scheme.Other;
		
		export namespace Error {
			export const invalidUrl = 'invalidUrl' as const;
			export type InvalidUrl = { readonly tag: typeof invalidUrl; readonly value: string } & _common;
			export function InvalidUrl(value: string): InvalidUrl {
				return new VariantImpl(invalidUrl, value) as InvalidUrl;
			}
			
			export const timeoutError = 'timeoutError' as const;
			export type TimeoutError = { readonly tag: typeof timeoutError; readonly value: string } & _common;
			export function TimeoutError(value: string): TimeoutError {
				return new VariantImpl(timeoutError, value) as TimeoutError;
			}
			
			export const protocolError = 'protocolError' as const;
			export type ProtocolError = { readonly tag: typeof protocolError; readonly value: string } & _common;
			export function ProtocolError(value: string): ProtocolError {
				return new VariantImpl(protocolError, value) as ProtocolError;
			}
			
			export const unexpectedError = 'unexpectedError' as const;
			export type UnexpectedError = { readonly tag: typeof unexpectedError; readonly value: string } & _common;
			export function UnexpectedError(value: string): UnexpectedError {
				return new VariantImpl(unexpectedError, value) as UnexpectedError;
			}
			
			export type _tt = typeof invalidUrl | typeof timeoutError | typeof protocolError | typeof unexpectedError;
			export type _vt = string | string | string | string;
			type _common = Omit<VariantImpl, 'tag' | 'value'>;
			export function _ctor(t: _tt, v: _vt): Error {
				return new VariantImpl(t, v) as Error;
			}
			class VariantImpl {
				private readonly _tag: _tt;
				private readonly _value: _vt;
				constructor(t: _tt, value: _vt) {
					this._tag = t;
					this._value = value;
				}
				get tag(): _tt {
					return this._tag;
				}
				get value(): _vt {
					return this._value;
				}
				isInvalidUrl(): this is InvalidUrl {
					return this._tag === Error.invalidUrl;
				}
				isTimeoutError(): this is TimeoutError {
					return this._tag === Error.timeoutError;
				}
				isProtocolError(): this is ProtocolError {
					return this._tag === Error.protocolError;
				}
				isUnexpectedError(): this is UnexpectedError {
					return this._tag === Error.unexpectedError;
				}
			}
		}
		export type Error = Error.InvalidUrl | Error.TimeoutError | Error.ProtocolError | Error.UnexpectedError;
		
		export namespace Fields {
			
			export type constructor = (entries: [string, Uint8Array][]) => own<Fields>;
			
			export type get = (self: borrow<Fields>, name: string) => Uint8Array[];
			
			export type set = (self: borrow<Fields>, name: string, value: Uint8Array[]) => void;
			
			export type delete_ = (self: borrow<Fields>, name: string) => void;
			
			export type append = (self: borrow<Fields>, name: string, value: Uint8Array) => void;
			
			export type entries = (self: borrow<Fields>) => [string, Uint8Array][];
			
			export type clone = (self: borrow<Fields>) => own<Fields>;
		}
		export type Fields = resource;
		
		export type Headers = Fields;
		
		export type Trailers = Fields;
		
		export namespace IncomingRequest {
			
			export type method = (self: borrow<IncomingRequest>) => Method;
			
			export type pathWithQuery = (self: borrow<IncomingRequest>) => string | undefined;
			
			export type scheme = (self: borrow<IncomingRequest>) => Scheme | undefined;
			
			export type authority = (self: borrow<IncomingRequest>) => string | undefined;
			
			export type headers = (self: borrow<IncomingRequest>) => own<Headers>;
			
			export type consume = (self: borrow<IncomingRequest>) => result<own<IncomingBody>, void>;
		}
		export type IncomingRequest = resource;
		
		export namespace OutgoingRequest {
			
			export type constructor = (method: Method, pathWithQuery: string | undefined, scheme: Scheme | undefined, authority: string | undefined, headers: borrow<Headers>) => own<OutgoingRequest>;
			
			export type write = (self: borrow<OutgoingRequest>) => result<own<OutgoingBody>, void>;
		}
		export type OutgoingRequest = resource;
		
		export type RequestOptions = {
			connectTimeoutMs?: u32 | undefined;
			firstByteTimeoutMs?: u32 | undefined;
			betweenBytesTimeoutMs?: u32 | undefined;
		};
		
		export namespace ResponseOutparam {
			
			export type set = (param: own<ResponseOutparam>, response: result<own<OutgoingResponse>, Error>) => void;
		}
		export type ResponseOutparam = resource;
		
		export type StatusCode = u16;
		
		export namespace IncomingResponse {
			
			export type status = (self: borrow<IncomingResponse>) => StatusCode;
			
			export type headers = (self: borrow<IncomingResponse>) => own<Headers>;
			
			export type consume = (self: borrow<IncomingResponse>) => result<own<IncomingBody>, void>;
		}
		export type IncomingResponse = resource;
		
		export namespace IncomingBody {
			
			export type stream = (self: borrow<IncomingBody>) => result<own<InputStream>, void>;
			
			export type finish = (this_: own<IncomingBody>) => own<FutureTrailers>;
		}
		export type IncomingBody = resource;
		
		export namespace FutureTrailers {
			
			/**
			 * Pollable that resolves when the body has been fully read, and the trailers
			 * are ready to be consumed.
			 */
			export type subscribe = (self: borrow<FutureTrailers>) => own<Pollable>;
			
			/**
			 * Retrieve reference to trailers, if they are ready.
			 */
			export type get = (self: borrow<FutureTrailers>) => result<own<Trailers>, Error> | undefined;
		}
		export type FutureTrailers = resource;
		
		export namespace OutgoingResponse {
			
			export type constructor = (statusCode: StatusCode, headers: borrow<Headers>) => own<OutgoingResponse>;
			
			/**
			 * Will give the child outgoing-response at most once. subsequent calls will
			 * return an error.
			 */
			export type write = (self: borrow<OutgoingResponse>) => result<own<OutgoingBody>, void>;
		}
		export type OutgoingResponse = resource;
		
		export namespace OutgoingBody {
			
			/**
			 * Will give the child output-stream at most once. subsequent calls will
			 * return an error.
			 */
			export type write = (self: borrow<OutgoingBody>) => result<own<OutputStream>, void>;
			
			/**
			 * Finalize an outgoing body, optionally providing trailers. This must be
			 * called to signal that the response is complete. If the `outgoing-body` is
			 * dropped without calling `outgoing-body-finalize`, the implementation
			 * should treat the body as corrupted.
			 */
			export type finish = (this_: own<OutgoingBody>, trailers: own<Trailers> | undefined) => void;
		}
		export type OutgoingBody = resource;
		
		/**
		 * The following block defines a special resource type used by the
		 * `wasi:http/outgoing-handler` interface to emulate
		 * `future<result<response, error>>` in advance of Preview3. Given a
		 * `future-incoming-response`, the client can call the non-blocking `get`
		 * method to get the result if it is available. If the result is not available,
		 * the client can call `listen` to get a `pollable` that can be passed to
		 * `wasi:io/poll.poll-list`.
		 */
		export namespace FutureIncomingResponse {
			
			/**
			 * option indicates readiness.
			 * outer result indicates you are allowed to get the
			 * incoming-response-or-error at most once. subsequent calls after ready
			 * will return an error here.
			 * inner result indicates whether the incoming-response was available, or an
			 * error occured.
			 */
			export type get = (self: borrow<FutureIncomingResponse>) => result<result<own<IncomingResponse>, Error>, void> | undefined;
			
			export type subscribe = (self: borrow<FutureIncomingResponse>) => own<Pollable>;
		}
		export type FutureIncomingResponse = resource;
	}
	export type Types = {
		Fields: {
			constructor: Types.Fields.constructor;
			get: Types.Fields.get;
			set: Types.Fields.set;
			delete_: Types.Fields.delete_;
			append: Types.Fields.append;
			entries: Types.Fields.entries;
			clone: Types.Fields.clone;
		};
		IncomingRequest: {
			method: Types.IncomingRequest.method;
			pathWithQuery: Types.IncomingRequest.pathWithQuery;
			scheme: Types.IncomingRequest.scheme;
			authority: Types.IncomingRequest.authority;
			headers: Types.IncomingRequest.headers;
			consume: Types.IncomingRequest.consume;
		};
		OutgoingRequest: {
			constructor: Types.OutgoingRequest.constructor;
			write: Types.OutgoingRequest.write;
		};
		ResponseOutparam: {
			set: Types.ResponseOutparam.set;
		};
		IncomingResponse: {
			status: Types.IncomingResponse.status;
			headers: Types.IncomingResponse.headers;
			consume: Types.IncomingResponse.consume;
		};
		IncomingBody: {
			stream: Types.IncomingBody.stream;
			finish: Types.IncomingBody.finish;
		};
		FutureTrailers: {
			subscribe: Types.FutureTrailers.subscribe;
			get: Types.FutureTrailers.get;
		};
		OutgoingResponse: {
			constructor: Types.OutgoingResponse.constructor;
			write: Types.OutgoingResponse.write;
		};
		OutgoingBody: {
			write: Types.OutgoingBody.write;
			finish: Types.OutgoingBody.finish;
		};
		FutureIncomingResponse: {
			get: Types.FutureIncomingResponse.get;
			subscribe: Types.FutureIncomingResponse.subscribe;
		};
	};
	
	export namespace IncomingHandler {
		export const id = 'wasi:http/incoming-handler' as const;
		
		export type IncomingRequest = http.Types.IncomingRequest;
		
		export type ResponseOutparam = http.Types.ResponseOutparam;
		
		export type handle = (request: own<IncomingRequest>, responseOut: own<ResponseOutparam>) => void;
	}
	export type IncomingHandler = {
		handle: IncomingHandler.handle;
	};
	
	export namespace OutgoingHandler {
		export const id = 'wasi:http/outgoing-handler' as const;
		
		export type OutgoingRequest = http.Types.OutgoingRequest;
		
		export type RequestOptions = http.Types.RequestOptions;
		
		export type FutureIncomingResponse = http.Types.FutureIncomingResponse;
		
		export type Error = http.Types.Error;
		
		export type handle = (request: own<OutgoingRequest>, options: RequestOptions | undefined) => result<own<FutureIncomingResponse>, Error>;
	}
	export type OutgoingHandler = {
		handle: OutgoingHandler.handle;
	};
	
}

export namespace http {
	export namespace Types.$ {
		export const InputStream = io.Streams.$.InputStream;
		export const OutputStream = io.Streams.$.OutputStream;
		export const Pollable = io.Poll.$.Pollable;
		export const Method = new $wcm.VariantType<http.Types.Method, http.Types.Method._tt, http.Types.Method._vt>([['get', undefined], ['head', undefined], ['post', undefined], ['put', undefined], ['delete_', undefined], ['connect', undefined], ['options', undefined], ['trace', undefined], ['patch', undefined], ['other', $wcm.wstring]], http.Types.Method._ctor);
		export const Scheme = new $wcm.VariantType<http.Types.Scheme, http.Types.Scheme._tt, http.Types.Scheme._vt>([['HTTP', undefined], ['HTTPS', undefined], ['other', $wcm.wstring]], http.Types.Scheme._ctor);
		export const Error = new $wcm.VariantType<http.Types.Error, http.Types.Error._tt, http.Types.Error._vt>([['invalidUrl', $wcm.wstring], ['timeoutError', $wcm.wstring], ['protocolError', $wcm.wstring], ['unexpectedError', $wcm.wstring]], http.Types.Error._ctor);
		export const Fields = new $wcm.NamespaceResourceType('Fields', 'fields');
		export const Headers = Fields;
		export const Trailers = Fields;
		export const IncomingRequest = new $wcm.NamespaceResourceType('IncomingRequest', 'incoming-request');
		export const OutgoingRequest = new $wcm.NamespaceResourceType('OutgoingRequest', 'outgoing-request');
		export const RequestOptions = new $wcm.RecordType<http.Types.RequestOptions>([
			['connectTimeoutMs', new $wcm.OptionType<u32>($wcm.u32)],
			['firstByteTimeoutMs', new $wcm.OptionType<u32>($wcm.u32)],
			['betweenBytesTimeoutMs', new $wcm.OptionType<u32>($wcm.u32)],
		]);
		export const ResponseOutparam = new $wcm.NamespaceResourceType('ResponseOutparam', 'response-outparam');
		export const StatusCode = $wcm.u16;
		export const IncomingResponse = new $wcm.NamespaceResourceType('IncomingResponse', 'incoming-response');
		export const IncomingBody = new $wcm.NamespaceResourceType('IncomingBody', 'incoming-body');
		export const FutureTrailers = new $wcm.NamespaceResourceType('FutureTrailers', 'future-trailers');
		export const OutgoingResponse = new $wcm.NamespaceResourceType('OutgoingResponse', 'outgoing-response');
		export const OutgoingBody = new $wcm.NamespaceResourceType('OutgoingBody', 'outgoing-body');
		export const FutureIncomingResponse = new $wcm.NamespaceResourceType('FutureIncomingResponse', 'future-incoming-response');
		Fields.addFunction(new $wcm.FunctionType<http.Types.Fields.constructor>('constructor', '[constructor]fields', [
			['entries', new $wcm.ListType<[string, Uint8Array]>(new $wcm.TupleType<[string, Uint8Array]>([$wcm.wstring, new $wcm.Uint8ArrayType()]))],
		], new $wcm.OwnType<http.Types.Fields>(Fields)));
		Fields.addFunction(new $wcm.FunctionType<http.Types.Fields.get>('get', '[method]fields.get', [
			['self', new $wcm.BorrowType<http.Types.Fields>(Fields)],
			['name', $wcm.wstring],
		], new $wcm.ListType<Uint8Array>(new $wcm.Uint8ArrayType())));
		Fields.addFunction(new $wcm.FunctionType<http.Types.Fields.set>('set', '[method]fields.set', [
			['self', new $wcm.BorrowType<http.Types.Fields>(Fields)],
			['name', $wcm.wstring],
			['value', new $wcm.ListType<Uint8Array>(new $wcm.Uint8ArrayType())],
		], undefined));
		Fields.addFunction(new $wcm.FunctionType<http.Types.Fields.delete_>('delete_', '[method]fields.delete', [
			['self', new $wcm.BorrowType<http.Types.Fields>(Fields)],
			['name', $wcm.wstring],
		], undefined));
		Fields.addFunction(new $wcm.FunctionType<http.Types.Fields.append>('append', '[method]fields.append', [
			['self', new $wcm.BorrowType<http.Types.Fields>(Fields)],
			['name', $wcm.wstring],
			['value', new $wcm.Uint8ArrayType()],
		], undefined));
		Fields.addFunction(new $wcm.FunctionType<http.Types.Fields.entries>('entries', '[method]fields.entries', [
			['self', new $wcm.BorrowType<http.Types.Fields>(Fields)],
		], new $wcm.ListType<[string, Uint8Array]>(new $wcm.TupleType<[string, Uint8Array]>([$wcm.wstring, new $wcm.Uint8ArrayType()]))));
		Fields.addFunction(new $wcm.FunctionType<http.Types.Fields.clone>('clone', '[method]fields.clone', [
			['self', new $wcm.BorrowType<http.Types.Fields>(Fields)],
		], new $wcm.OwnType<http.Types.Fields>(Fields)));
		IncomingRequest.addFunction(new $wcm.FunctionType<http.Types.IncomingRequest.method>('method', '[method]incoming-request.method', [
			['self', new $wcm.BorrowType<http.Types.IncomingRequest>(IncomingRequest)],
		], Method));
		IncomingRequest.addFunction(new $wcm.FunctionType<http.Types.IncomingRequest.pathWithQuery>('pathWithQuery', '[method]incoming-request.path-with-query', [
			['self', new $wcm.BorrowType<http.Types.IncomingRequest>(IncomingRequest)],
		], new $wcm.OptionType<string>($wcm.wstring)));
		IncomingRequest.addFunction(new $wcm.FunctionType<http.Types.IncomingRequest.scheme>('scheme', '[method]incoming-request.scheme', [
			['self', new $wcm.BorrowType<http.Types.IncomingRequest>(IncomingRequest)],
		], new $wcm.OptionType<http.Types.Scheme>(Scheme)));
		IncomingRequest.addFunction(new $wcm.FunctionType<http.Types.IncomingRequest.authority>('authority', '[method]incoming-request.authority', [
			['self', new $wcm.BorrowType<http.Types.IncomingRequest>(IncomingRequest)],
		], new $wcm.OptionType<string>($wcm.wstring)));
		IncomingRequest.addFunction(new $wcm.FunctionType<http.Types.IncomingRequest.headers>('headers', '[method]incoming-request.headers', [
			['self', new $wcm.BorrowType<http.Types.IncomingRequest>(IncomingRequest)],
		], new $wcm.OwnType<http.Types.Headers>(Headers)));
		IncomingRequest.addFunction(new $wcm.FunctionType<http.Types.IncomingRequest.consume>('consume', '[method]incoming-request.consume', [
			['self', new $wcm.BorrowType<http.Types.IncomingRequest>(IncomingRequest)],
		], new $wcm.ResultType<own<http.Types.IncomingBody>, void>(new $wcm.OwnType<http.Types.IncomingBody>(IncomingBody), undefined)));
		OutgoingRequest.addFunction(new $wcm.FunctionType<http.Types.OutgoingRequest.constructor>('constructor', '[constructor]outgoing-request', [
			['method', Method],
			['pathWithQuery', new $wcm.OptionType<string>($wcm.wstring)],
			['scheme', new $wcm.OptionType<http.Types.Scheme>(Scheme)],
			['authority', new $wcm.OptionType<string>($wcm.wstring)],
			['headers', new $wcm.BorrowType<http.Types.Headers>(Headers)],
		], new $wcm.OwnType<http.Types.OutgoingRequest>(OutgoingRequest)));
		OutgoingRequest.addFunction(new $wcm.FunctionType<http.Types.OutgoingRequest.write>('write', '[method]outgoing-request.write', [
			['self', new $wcm.BorrowType<http.Types.OutgoingRequest>(OutgoingRequest)],
		], new $wcm.ResultType<own<http.Types.OutgoingBody>, void>(new $wcm.OwnType<http.Types.OutgoingBody>(OutgoingBody), undefined)));
		ResponseOutparam.addFunction(new $wcm.FunctionType<http.Types.ResponseOutparam.set>('set', '[static]response-outparam.set', [
			['param', new $wcm.OwnType<http.Types.ResponseOutparam>(ResponseOutparam)],
			['response', new $wcm.ResultType<own<http.Types.OutgoingResponse>, http.Types.Error>(new $wcm.OwnType<http.Types.OutgoingResponse>(OutgoingResponse), Error)],
		], undefined));
		IncomingResponse.addFunction(new $wcm.FunctionType<http.Types.IncomingResponse.status>('status', '[method]incoming-response.status', [
			['self', new $wcm.BorrowType<http.Types.IncomingResponse>(IncomingResponse)],
		], StatusCode));
		IncomingResponse.addFunction(new $wcm.FunctionType<http.Types.IncomingResponse.headers>('headers', '[method]incoming-response.headers', [
			['self', new $wcm.BorrowType<http.Types.IncomingResponse>(IncomingResponse)],
		], new $wcm.OwnType<http.Types.Headers>(Headers)));
		IncomingResponse.addFunction(new $wcm.FunctionType<http.Types.IncomingResponse.consume>('consume', '[method]incoming-response.consume', [
			['self', new $wcm.BorrowType<http.Types.IncomingResponse>(IncomingResponse)],
		], new $wcm.ResultType<own<http.Types.IncomingBody>, void>(new $wcm.OwnType<http.Types.IncomingBody>(IncomingBody), undefined)));
		IncomingBody.addFunction(new $wcm.FunctionType<http.Types.IncomingBody.stream>('stream', '[method]incoming-body.stream', [
			['self', new $wcm.BorrowType<http.Types.IncomingBody>(IncomingBody)],
		], new $wcm.ResultType<own<http.Types.InputStream>, void>(new $wcm.OwnType<http.Types.InputStream>(InputStream), undefined)));
		IncomingBody.addFunction(new $wcm.FunctionType<http.Types.IncomingBody.finish>('finish', '[static]incoming-body.finish', [
			['this_', new $wcm.OwnType<http.Types.IncomingBody>(IncomingBody)],
		], new $wcm.OwnType<http.Types.FutureTrailers>(FutureTrailers)));
		FutureTrailers.addFunction(new $wcm.FunctionType<http.Types.FutureTrailers.subscribe>('subscribe', '[method]future-trailers.subscribe', [
			['self', new $wcm.BorrowType<http.Types.FutureTrailers>(FutureTrailers)],
		], new $wcm.OwnType<http.Types.Pollable>(Pollable)));
		FutureTrailers.addFunction(new $wcm.FunctionType<http.Types.FutureTrailers.get>('get', '[method]future-trailers.get', [
			['self', new $wcm.BorrowType<http.Types.FutureTrailers>(FutureTrailers)],
		], new $wcm.OptionType<result<own<http.Types.Trailers>, http.Types.Error>>(new $wcm.ResultType<own<http.Types.Trailers>, http.Types.Error>(new $wcm.OwnType<http.Types.Trailers>(Trailers), Error))));
		OutgoingResponse.addFunction(new $wcm.FunctionType<http.Types.OutgoingResponse.constructor>('constructor', '[constructor]outgoing-response', [
			['statusCode', StatusCode],
			['headers', new $wcm.BorrowType<http.Types.Headers>(Headers)],
		], new $wcm.OwnType<http.Types.OutgoingResponse>(OutgoingResponse)));
		OutgoingResponse.addFunction(new $wcm.FunctionType<http.Types.OutgoingResponse.write>('write', '[method]outgoing-response.write', [
			['self', new $wcm.BorrowType<http.Types.OutgoingResponse>(OutgoingResponse)],
		], new $wcm.ResultType<own<http.Types.OutgoingBody>, void>(new $wcm.OwnType<http.Types.OutgoingBody>(OutgoingBody), undefined)));
		OutgoingBody.addFunction(new $wcm.FunctionType<http.Types.OutgoingBody.write>('write', '[method]outgoing-body.write', [
			['self', new $wcm.BorrowType<http.Types.OutgoingBody>(OutgoingBody)],
		], new $wcm.ResultType<own<http.Types.OutputStream>, void>(new $wcm.OwnType<http.Types.OutputStream>(OutputStream), undefined)));
		OutgoingBody.addFunction(new $wcm.FunctionType<http.Types.OutgoingBody.finish>('finish', '[static]outgoing-body.finish', [
			['this_', new $wcm.OwnType<http.Types.OutgoingBody>(OutgoingBody)],
			['trailers', new $wcm.OptionType<own<http.Types.Trailers>>(new $wcm.OwnType<http.Types.Trailers>(Trailers))],
		], undefined));
		FutureIncomingResponse.addFunction(new $wcm.FunctionType<http.Types.FutureIncomingResponse.get>('get', '[method]future-incoming-response.get', [
			['self', new $wcm.BorrowType<http.Types.FutureIncomingResponse>(FutureIncomingResponse)],
		], new $wcm.OptionType<result<result<own<http.Types.IncomingResponse>, http.Types.Error>, void>>(new $wcm.ResultType<result<own<http.Types.IncomingResponse>, http.Types.Error>, void>(new $wcm.ResultType<own<http.Types.IncomingResponse>, http.Types.Error>(new $wcm.OwnType<http.Types.IncomingResponse>(IncomingResponse), Error), undefined))));
		FutureIncomingResponse.addFunction(new $wcm.FunctionType<http.Types.FutureIncomingResponse.subscribe>('subscribe', '[method]future-incoming-response.subscribe', [
			['self', new $wcm.BorrowType<http.Types.FutureIncomingResponse>(FutureIncomingResponse)],
		], new $wcm.OwnType<http.Types.Pollable>(Pollable)));
	}
	export namespace Types._ {
		const functions: $wcm.FunctionType<$wcm.ServiceFunction>[] = [];
		const resources: $wcm.NamespaceResourceType[] = [$.Fields, $.IncomingRequest, $.OutgoingRequest, $.ResponseOutparam, $.IncomingResponse, $.IncomingBody, $.FutureTrailers, $.OutgoingResponse, $.OutgoingBody, $.FutureIncomingResponse];
		export type WasmInterface = {
			'[constructor]fields': (entries_ptr: i32, entries_len: i32) => i32;
			'[method]fields.get': (self: i32, name_ptr: i32, name_len: i32, result: ptr<[i32, i32]>) => void;
			'[method]fields.set': (self: i32, name_ptr: i32, name_len: i32, value_ptr: i32, value_len: i32) => void;
			'[method]fields.delete': (self: i32, name_ptr: i32, name_len: i32) => void;
			'[method]fields.append': (self: i32, name_ptr: i32, name_len: i32, value_ptr: i32, value_len: i32) => void;
			'[method]fields.entries': (self: i32, result: ptr<[i32, i32]>) => void;
			'[method]fields.clone': (self: i32) => i32;
			'[method]incoming-request.method': (self: i32, result: ptr<[i32, i32, i32]>) => void;
			'[method]incoming-request.path-with-query': (self: i32, result: ptr<[i32, i32, i32]>) => void;
			'[method]incoming-request.scheme': (self: i32, result: ptr<[i32, i32, i32, i32]>) => void;
			'[method]incoming-request.authority': (self: i32, result: ptr<[i32, i32, i32]>) => void;
			'[method]incoming-request.headers': (self: i32) => i32;
			'[method]incoming-request.consume': (self: i32, result: ptr<[i32, i32]>) => void;
			'[constructor]outgoing-request': (method_case: i32, method_0: i32, method_1: i32, pathWithQuery_case: i32, pathWithQuery_option_ptr: i32, pathWithQuery_option_len: i32, scheme_case: i32, scheme_option_case: i32, scheme_option_0: i32, scheme_option_1: i32, authority_case: i32, authority_option_ptr: i32, authority_option_len: i32, headers: i32) => i32;
			'[method]outgoing-request.write': (self: i32, result: ptr<[i32, i32]>) => void;
			'[static]response-outparam.set': (param: i32, response_case: i32, response_0: i32, response_1: i32, response_2: i32) => void;
			'[method]incoming-response.status': (self: i32) => i32;
			'[method]incoming-response.headers': (self: i32) => i32;
			'[method]incoming-response.consume': (self: i32, result: ptr<[i32, i32]>) => void;
			'[method]incoming-body.stream': (self: i32, result: ptr<[i32, i32]>) => void;
			'[static]incoming-body.finish': (this_: i32) => i32;
			'[method]future-trailers.subscribe': (self: i32) => i32;
			'[method]future-trailers.get': (self: i32, result: ptr<[i32, i32, i32, i32, i32]>) => void;
			'[constructor]outgoing-response': (statusCode: i32, headers: i32) => i32;
			'[method]outgoing-response.write': (self: i32, result: ptr<[i32, i32]>) => void;
			'[method]outgoing-body.write': (self: i32, result: ptr<[i32, i32]>) => void;
			'[static]outgoing-body.finish': (this_: i32, trailers_case: i32, trailers_option: i32) => void;
			'[method]future-incoming-response.get': (self: i32, result: ptr<[i32, i32, i32, i32, i32, i32]>) => void;
			'[method]future-incoming-response.subscribe': (self: i32) => i32;
		};
		export function createHost(service: http.Types, context: $wcm.Context): WasmInterface {
			return $wcm.Host.create<WasmInterface>(functions, resources, service, context);
		}
		export function createService(wasmInterface: WasmInterface, context: $wcm.Context): http.Types {
			return $wcm.Service.create<http.Types>(functions, resources, wasmInterface, context);
		}
	}
	export namespace IncomingHandler.$ {
		export const IncomingRequest = http.Types.$.IncomingRequest;
		export const ResponseOutparam = http.Types.$.ResponseOutparam;
		export const handle = new $wcm.FunctionType<http.IncomingHandler.handle>('handle', 'handle',[
			['request', new $wcm.OwnType<http.IncomingHandler.IncomingRequest>(IncomingRequest)],
			['responseOut', new $wcm.OwnType<http.IncomingHandler.ResponseOutparam>(ResponseOutparam)],
		], undefined);
	}
	export namespace IncomingHandler._ {
		const functions: $wcm.FunctionType<$wcm.ServiceFunction>[] = [$.handle];
		const resources: $wcm.NamespaceResourceType[] = [];
		export type WasmInterface = {
			'handle': (request: i32, responseOut: i32) => void;
		};
		export function createHost(service: http.IncomingHandler, context: $wcm.Context): WasmInterface {
			return $wcm.Host.create<WasmInterface>(functions, resources, service, context);
		}
		export function createService(wasmInterface: WasmInterface, context: $wcm.Context): http.IncomingHandler {
			return $wcm.Service.create<http.IncomingHandler>(functions, resources, wasmInterface, context);
		}
	}
	export namespace OutgoingHandler.$ {
		export const OutgoingRequest = http.Types.$.OutgoingRequest;
		export const RequestOptions = http.Types.$.RequestOptions;
		export const FutureIncomingResponse = http.Types.$.FutureIncomingResponse;
		export const Error = http.Types.$.Error;
		export const handle = new $wcm.FunctionType<http.OutgoingHandler.handle>('handle', 'handle',[
			['request', new $wcm.OwnType<http.OutgoingHandler.OutgoingRequest>(OutgoingRequest)],
			['options', new $wcm.OptionType<http.OutgoingHandler.RequestOptions>(RequestOptions)],
		], new $wcm.ResultType<own<http.OutgoingHandler.FutureIncomingResponse>, http.OutgoingHandler.Error>(new $wcm.OwnType<http.OutgoingHandler.FutureIncomingResponse>(FutureIncomingResponse), Error));
	}
	export namespace OutgoingHandler._ {
		const functions: $wcm.FunctionType<$wcm.ServiceFunction>[] = [$.handle];
		const resources: $wcm.NamespaceResourceType[] = [];
		export type WasmInterface = {
			'handle': (request: i32, options_case: i32, options_option_RequestOptions_connectTimeoutMs_case: i32, options_option_RequestOptions_connectTimeoutMs_option: i32, options_option_RequestOptions_firstByteTimeoutMs_case: i32, options_option_RequestOptions_firstByteTimeoutMs_option: i32, options_option_RequestOptions_betweenBytesTimeoutMs_case: i32, options_option_RequestOptions_betweenBytesTimeoutMs_option: i32, result: ptr<[i32, i32, i32, i32]>) => void;
		};
		export function createHost(service: http.OutgoingHandler, context: $wcm.Context): WasmInterface {
			return $wcm.Host.create<WasmInterface>(functions, resources, service, context);
		}
		export function createService(wasmInterface: WasmInterface, context: $wcm.Context): http.OutgoingHandler {
			return $wcm.Service.create<http.OutgoingHandler>(functions, resources, wasmInterface, context);
		}
	}
}