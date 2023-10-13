/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import RAL from './ral';

export class ComponentModelError extends Error {
	constructor(message: string) {
		super(message);
	}
}

namespace BigInts {
	const MAX_VALUE_AS_BIGINT = BigInt(Number.MAX_VALUE);
	export function asNumber(value: bigint): number {
		if (value > MAX_VALUE_AS_BIGINT) {
			throw new ComponentModelError('Value too big for number');
		}
		return Number(value);
	}
	export function max(...args: bigint[]): bigint {
		return args.reduce((m, e) => e > m ? e : m);
	}

	export function min(...args: bigint[]): bigint {
		return args.reduce((m, e) => e < m ? e : m);
	}
}

const utf8Decoder = RAL().TextDecoder.create('utf-8');
const utf8Encoder = RAL().TextEncoder.create('utf-8');

export interface Memory {
	readonly buffer: ArrayBuffer;
	readonly raw: Uint8Array;
	readonly view: DataView;
	alloc: (align: alignment, size: size) => ptr;
	realloc: (ptr: ptr, oldSize: size, align: alignment, newSize: size) => ptr;
}

export type encodings = 'utf-8' | 'utf-16' | 'latin1+utf-16';
export interface Options {
	encoding: encodings;
	keepOption?: boolean;
}

export type alignment = 1 | 2 | 4 | 8;
function align(ptr: ptr, alignment: alignment): ptr {
	return Math.ceil(ptr / alignment) * alignment;
}

export type i32 = number;
export type i64 = bigint;
export type f32 = number;
export type f64 = number;
export type wasmType = i32 | i64 | f32 | f64;
export type wasmTypeName = 'i32' | 'i64' | 'f32' | 'f64';

namespace WasmTypes {

	const $32 = new DataView(new ArrayBuffer(4));
	const $64 = new DataView(new ArrayBuffer(8));

	export function reinterpret_i32_as_f32(i32: number): f32 {
		$32.setInt32(0, i32, true);
		return $32.getFloat32(0, true);
	}

	export function reinterpret_f32_as_i32(f32: f32): i32 {
		$32.setFloat32(0, f32, true);
		return $32.getInt32(0, true);
	}

	export function convert_i64_to_i32(i64: i64): i32 {
		return BigInts.asNumber(i64);
	}

	export function convert_i32_to_i64(i32: i32): i64 {
		return BigInt(i32);
	}

	export function reinterpret_i64_as_f32(i64: i64): f32 {
		const i32 = convert_i64_to_i32(i64);
		return reinterpret_i32_as_f32(i32);
	}

	export function reinterpret_f32_as_i64(f32: f32): i64 {
		const i32 = reinterpret_f32_as_i32(f32);
		return convert_i32_to_i64(i32);
	}

	export function reinterpret_i64_as_f64(i64: i64): f64 {
		$64.setBigInt64(0, i64, true);
		return $64.getFloat64(0, true);
	}

	export function reinterpret_f64_as_i64(f64: f64): i64 {
		$64.setFloat64(0, f64, true);
		return $64.getBigInt64(0, true);
	}
}

export type FlatValuesIter = Iterator<wasmType, wasmType>;

class CoerceValueIter implements Iterator<wasmType, wasmType> {

	private index: number;

	constructor(private readonly values: FlatValuesIter, private haveFlatTypes: readonly wasmTypeName[], private wantFlatTypes: readonly wasmTypeName[]) {
		if (haveFlatTypes.length < wantFlatTypes.length) {
			throw new ComponentModelError(`Invalid coercion: have ${haveFlatTypes.length} values, want ${wantFlatTypes.length} values`);
		}
		this.index = 0;
	}

	next(): IteratorResult<wasmType, wasmType> {
		const value = this.values.next();
		if (value.done) {
			return value;
		}
		const haveType = this.haveFlatTypes[this.index];
		const wantType = this.wantFlatTypes[this.index++];

		if (haveType === 'i32' && wantType === 'f32') {
			return { done: false, value: WasmTypes.reinterpret_i32_as_f32(value.value as i32) };
		} else if (haveType === 'i64' && wantType === 'i32') {
			return { done: false, value: WasmTypes.convert_i64_to_i32(value.value as i64) };
		} else if (haveType === 'i64' && wantType === 'f32') {
			return { done: false, value: WasmTypes.reinterpret_i64_as_f32(value.value as i64) };
		} else if (haveType === 'i64' && wantType === 'f64') {
			return { done: false, value: WasmTypes.reinterpret_i64_as_f64(value.value as i64) };
		} else {
			return value;
		}
	}
}

export enum ComponentModelTypeKind {
	bool = 'bool',
	u8 = 'u8',
	u16 = 'u16',
	u32 = 'u32',
	u64 = 'u64',
	s8 = 's8',
	s16 = 's16',
	s32 = 's32',
	s64 = 's64',
	float32 = 'float32',
	float64 = 'float64',
	char = 'char',
	string = 'string',
	list = 'list',
	record = 'record',
	tuple = 'tuple',
	variant = 'variant',
	enum = 'enum',
	flags = 'flags',
	option = 'option',
	result = 'result',
	resource = 'resource',
	borrow = 'borrow',
	own = 'own'
}

export interface ComponentModelType<J> {
	readonly kind : ComponentModelTypeKind;
	readonly size: number;
	readonly alignment: alignment;
	readonly flatTypes: ReadonlyArray<wasmTypeName>;
	// Loads an object directly from the memory buffer
	load(memory: Memory, ptr: ptr, options: Options): J;
	// Loads an object from a flattened signature
	liftFlat(memory: Memory, values: FlatValuesIter, options: Options): J;
	// Allocates a new object in the memory buffer
	alloc(memory: Memory): ptr;
	// Stores an object directly into the memory buffer
	store(memory: Memory, ptr: ptr, value: J, options: Options): void;
	// Stores an object into a flattened signature
	lowerFlat(result: wasmType[], memory: Memory, value: J, options: Options): void;
}
export type GenericComponentModelType = ComponentModelType<any>;

export type bool = number;
export const bool: ComponentModelType<boolean> = {
	kind: ComponentModelTypeKind.bool,
	size: 1,
	alignment: 1,
	flatTypes: ['i32'],
	load(memory, ptr: ptr<u8>): boolean {
		return memory.view.getUint8(ptr) !== 0;
	},
	liftFlat(_memory, values): boolean {
		const value = values.next().value;
		if (value < 0) {
			throw new Error(`Invalid bool value ${value}`);
		}
		return value !== 0;
	},
	alloc(memory): ptr<u8> {
		return memory.alloc(bool.alignment, bool.size);
	},
	store(memory, ptr: ptr<u8>, value: boolean): void {
		memory.view.setUint8(ptr, value ? 1 : 0);
	},
	lowerFlat(result, _memory, value: boolean): void {
		result.push(value ? 1 : 0);
	}
};

export type u8 = number;
namespace $u8 {
	export const kind: ComponentModelTypeKind = ComponentModelTypeKind.u8;
	export const size = 1;
	export const alignment: alignment = 1;
	export const flatTypes: readonly wasmTypeName[] = ['i32'];

	export const LOW_VALUE = 0;
	export const HIGH_VALUE = 255;

	export function load(memory: Memory, ptr: ptr<u8>): u8 {
		return memory.view.getUint8(ptr);
	}

	export function liftFlat(_memory: Memory, values: FlatValuesIter): u8 {
		const value = values.next().value;
		if (value < LOW_VALUE || value > HIGH_VALUE || !Number.isInteger(value)) {
			throw new Error(`Invalid u8 value ${value}`);
		}
		return value as u8;
	}

	export function alloc(memory: Memory): ptr<u8> {
		return memory.alloc(alignment, size);
	}

	export function store(memory: Memory, ptr: ptr<u8>, value: u8): void {
		memory.view.setUint8(ptr, value);
	}

	export function lowerFlat(result: wasmType[], _memory: Memory, value: u8): void {
		if (value < LOW_VALUE || value > HIGH_VALUE || !Number.isInteger(value)) {
			throw new Error(`Invalid u8 value ${value}`);
		}
		result.push(value);
	}
}
export const u8:ComponentModelType<number> = $u8;

export type u16 = number;
namespace $u16 {
	export const kind: ComponentModelTypeKind = ComponentModelTypeKind.u16;
	export const size = 2;
	export const alignment: alignment = 2;
	export const flatTypes: readonly wasmTypeName[] = ['i32'];

	export const LOW_VALUE = 0;
	export const HIGH_VALUE = 65535;

	export function load(memory: Memory, ptr: ptr): u16 {
		return memory.view.getUint16(ptr, true);
	}

	export function liftFlat(_memory: Memory, values:FlatValuesIter): u16 {
		const value = values.next().value;
		if (value < LOW_VALUE || value > HIGH_VALUE || !Number.isInteger(value)) {
			throw new Error(`Invalid u16 value ${value}`);
		}
		return value as u16;
	}

	export function alloc(memory: Memory): ptr<u16> {
		return memory.alloc(alignment, size);
	}

	export function store(memory: Memory, ptr: ptr<u16>, value: u16): void {
		memory.view.setUint16(ptr, value, true);
	}

	export function lowerFlat(result: wasmType[], _memory: Memory, value: number): void {
		if (value < LOW_VALUE || value > HIGH_VALUE || !Number.isInteger(value)) {
			throw new Error(`Invalid u16 value ${value}`);
		}
		result.push(value);
	}
}
export const u16: ComponentModelType<number> = $u16;

export type u32 = number;
namespace $u32 {
	export const kind: ComponentModelTypeKind = ComponentModelTypeKind.u32;
	export const size = 4;
	export const alignment: alignment = 4;
	export const flatTypes: readonly wasmTypeName[] = ['i32'];

	export const LOW_VALUE = 0;
	export const HIGH_VALUE = 4294967295; // 2 ^ 32 - 1

	export function load(memory: Memory, ptr: ptr): u32 {
		return memory.view.getUint32(ptr, true);
	}

	export function liftFlat(_memory: Memory, values: FlatValuesIter): u32 {
		const value = values.next().value;
		if (value < LOW_VALUE || value > HIGH_VALUE || !Number.isInteger(value)) {
			throw new Error(`Invalid u32 value ${value}`);
		}
		return value as u32;
	}

	export function alloc(memory: Memory): ptr<u32> {
		return memory.alloc(alignment, size);
	}

	export function store(memory: Memory, ptr: ptr<u32>, value: u32): void {
		memory.view.setUint32(ptr, value, true);
	}

	export function lowerFlat(result: wasmType[], _memory: Memory, value: number): void {
		if (value < LOW_VALUE || value > HIGH_VALUE || !Number.isInteger(value)) {
			throw new Error(`Invalid u32 value ${value}`);
		}
		result.push(value);
	}
}
export const u32: ComponentModelType<number> = $u32;

export type u64 = bigint;
namespace $u64 {
	export const kind: ComponentModelTypeKind = ComponentModelTypeKind.u64;
	export const size = 8;
	export const alignment: alignment = 8;
	export const flatTypes: readonly wasmTypeName[] = ['i64'];

	export const LOW_VALUE = 0n;
	export const HIGH_VALUE = 18446744073709551615n; // 2 ^ 64 - 1

	export function load(memory: Memory, ptr: ptr): u64 {
		return memory.view.getBigUint64(ptr, true);
	}

	export function liftFlat(_memory: Memory, values: FlatValuesIter): u64 {
		const value = values.next().value;
		if (value < LOW_VALUE) {
			throw new Error(`Invalid u64 value ${value}`);
		}
		return value as u64;
	}

	export function alloc(memory: Memory): ptr<u64> {
		return memory.alloc(alignment, size);
	}

	export function store(memory: Memory, ptr: ptr<u64>, value: u64): void {
		memory.view.setBigUint64(ptr, value, true);
	}

	export function lowerFlat(result: wasmType[], _memory: Memory, value: bigint): void {
		if (value < LOW_VALUE) {
			throw new Error(`Invalid u64 value ${value}`);
		}
		result.push(value);
	}
}
export const u64: ComponentModelType<bigint> = $u64;

export type s8 = number;
namespace $s8 {
	export const kind: ComponentModelTypeKind = ComponentModelTypeKind.s8;
	export const size = 1;
	export const alignment: alignment = 1;
	export const flatTypes: readonly wasmTypeName[] = ['i32'];

	const LOW_VALUE = -128;
	const HIGH_VALUE = 127;

	export function load(memory: Memory, ptr: ptr): s8 {
		return memory.view.getInt8(ptr);
	}

	export function liftFlat(_memory: Memory, values: FlatValuesIter): s8 {
		const value = values.next().value;
		// All int values in the component model are transferred as unsigned
		// values. So for signed values we need to convert them back. First
		// we check if the value is in range of the corresponding unsigned
		// value and the convert it to a signed value.
		if (value < $u8.LOW_VALUE || value > $u8.HIGH_VALUE || !Number.isInteger(value)) {
			throw new Error(`Invalid u8 value ${value}`);
		}
		if (value <= HIGH_VALUE) {
			return value as s8;
		} else {
			return (value as u8) - 256;
		}
	}

	export function alloc(memory: Memory): ptr<s8> {
		return memory.alloc(alignment, size);
	}

	export function store(memory: Memory, ptr: ptr<s8>, value: s8): void {
		memory.view.setInt8(ptr, value);
	}

	export function lowerFlat(result: wasmType[], _memory: Memory, value: number): void {
		if (value < LOW_VALUE || value > HIGH_VALUE || !Number.isInteger(value)) {
			throw new Error(`Invalid s8 value ${value}`);
		}
		result.push((value < 0) ? (value + 256) : value);
	}
}
export const s8: ComponentModelType<number> = $s8;

export type s16 = number;
namespace $s16 {
	export const kind: ComponentModelTypeKind = ComponentModelTypeKind.s16;
	export const size = 2;
	export const alignment: alignment = 2;
	export const flatTypes: readonly wasmTypeName[] = ['i32'];

	const LOW_VALUE = -32768; // -2 ^ 15
	const HIGH_VALUE = 32767; // 2 ^ 15 - 1

	export function load(memory: Memory, ptr: ptr): s16 {
		return memory.view.getInt16(ptr, true);
	}

	export function liftFlat(_memory: Memory, values: FlatValuesIter): s16 {
		const value = values.next().value;
		if (value < $u16.LOW_VALUE || value > $u16.HIGH_VALUE || !Number.isInteger(value)) {
			throw new Error(`Invalid s16 value ${value}`);
		}
		return (value <= HIGH_VALUE) ? value as s16 : (value as u16) - 65536;
	}

	export function alloc(memory: Memory): ptr<s16> {
		return memory.alloc(alignment, size);
	}

	export function store(memory: Memory, ptr: ptr<s16>, value: s16): void {
		memory.view.setInt16(ptr, value, true);
	}

	export function lowerFlat(result: wasmType[], _memory: Memory, value: number): void {
		if (value < LOW_VALUE || value > HIGH_VALUE || !Number.isInteger(value)) {
			throw new Error(`Invalid s16 value ${value}`);
		}
		result.push((value < 0) ? (value + 65536) : value);
	}
}
export const s16: ComponentModelType<number> = $s16;

export type s32 = number;
namespace $s32 {
	export const kind: ComponentModelTypeKind = ComponentModelTypeKind.s32;
	export const size = 4;
	export const alignment: alignment = 4;
	export const flatTypes: readonly wasmTypeName[] = ['i32'];

	const LOW_VALUE = -2147483648; // -2 ^ 31
	const HIGH_VALUE = 2147483647; // 2 ^ 31 - 1

	export function load(memory: Memory, ptr: ptr): s32 {
		return memory.view.getInt32(ptr, true);
	}

	export function liftFlat(_memory: Memory, values: FlatValuesIter): s32 {
		const value = values.next().value;
		if (value < $u32.LOW_VALUE || value > $u32.HIGH_VALUE || !Number.isInteger(value)) {
			throw new Error(`Invalid s32 value ${value}`);
		}
		return (value <= HIGH_VALUE) ? value as s32 : (value as u32) - 4294967296;
	}

	export function alloc(memory: Memory): ptr<s32> {
		return memory.alloc(alignment, size);
	}

	export function store(memory: Memory, ptr: ptr<s32>, value: s32): void {
		memory.view.setInt32(ptr, value, true);
	}

	export function lowerFlat(result: wasmType[], _memory: Memory, value: number): void {
		if (value < LOW_VALUE || value > HIGH_VALUE || !Number.isInteger(value)) {
			throw new Error(`Invalid s32 value ${value}`);
		}
		result.push((value < 0) ? (value + 4294967296) : value);
	}
}
export const s32: ComponentModelType<number> = $s32;

export type s64 = bigint;
namespace $s64 {
	export const kind: ComponentModelTypeKind = ComponentModelTypeKind.s64;
	export const size = 8;
	export const alignment: alignment = 8;
	export const flatTypes: readonly wasmTypeName[] = ['i64'];

	const LOW_VALUE = -9223372036854775808n; // -2 ^ 63
	const HIGH_VALUE = 9223372036854775807n; // 2 ^ 63 - 1

	export function load(memory: Memory, ptr: ptr<s64>): s64 {
		return memory.view.getBigInt64(ptr, true);
	}

	export function liftFlat(_memory: Memory, values: FlatValuesIter): s64 {
		const value = values.next().value;
		if (value < $u64.LOW_VALUE) {
			throw new Error(`Invalid s64 value ${value}`);
		}
		return (value <= HIGH_VALUE) ? value as s64 : (value as u64) - 18446744073709551616n;
	}

	export function alloc(memory: Memory): ptr<s64> {
		return memory.alloc(alignment, size);
	}

	export function store(memory: Memory, ptr: ptr<s64>, value: s64): void {
		memory.view.setBigInt64(ptr, value, true);
	}

	export function lowerFlat(result: wasmType[], _memory: Memory, value: bigint): void {
		if (value < LOW_VALUE || value > HIGH_VALUE) {
			throw new Error(`Invalid s64 value ${value}`);
		}
		result.push((value < 0) ? (value + 18446744073709551616n) : value);
	}
}
export const s64: ComponentModelType<bigint> = $s64;

export type float32 = number;
namespace $float32 {
	export const kind: ComponentModelTypeKind = ComponentModelTypeKind.float32;
	export const size = 4;
	export const alignment:alignment = 4;
	export const flatTypes: readonly wasmTypeName[] = ['f32'];

	const LOW_VALUE = -3.4028234663852886e+38;
	const HIGH_VALUE = 3.4028234663852886e+38;
	const NAN = 0x7fc00000;

	export function load(memory: Memory, ptr: ptr): float32 {
		return memory.view.getFloat32(ptr, true);
	}

	export function liftFlat(_memory: Memory, values: FlatValuesIter): float32 {
		const value = values.next().value;
		if (value < LOW_VALUE || value > HIGH_VALUE) {
			throw new Error(`Invalid float32 value ${value}`);
		}
		return value === NAN ? Number.NaN : value as float32;
	}

	export function alloc(memory: Memory): ptr<float32> {
		return memory.alloc(alignment, size);
	}

	export function store(memory: Memory, ptr: ptr<float32>, value: float32): void {
		memory.view.setFloat32(ptr, value, true);
	}

	export function lowerFlat(result: wasmType[], _memory: Memory, value: number): void {
		if (value < LOW_VALUE || value > HIGH_VALUE) {
			throw new Error(`Invalid float32 value ${value}`);
		}
		result.push(Number.isNaN(value) ? NAN : value);
	}
}
export const float32: ComponentModelType<number> = $float32;

export type float64 = number;
namespace $float64 {
	export const kind: ComponentModelTypeKind = ComponentModelTypeKind.float64;
	export const size = 8;
	export const alignment: alignment = 8;
	export const flatTypes: readonly wasmTypeName[] = ['f64'];

	const LOW_VALUE = -1 * Number.MAX_VALUE;
	const HIGH_VALUE = Number.MAX_VALUE;
	const NAN = 0x7ff8000000000000;

	export function load(memory: Memory, ptr: ptr): float64 {
		return memory.view.getFloat64(ptr, true);
	}

	export function liftFlat(_memory: Memory, values: FlatValuesIter): float64 {
		const value = values.next().value;
		if (value < LOW_VALUE || value > HIGH_VALUE) {
			throw new Error(`Invalid float64 value ${value}`);
		}
		return value === NAN ? Number.NaN : value as float64;
	}

	export function alloc(memory: Memory): ptr<float64> {
		return memory.alloc(alignment, size);
	}

	export function store(memory: Memory, ptr: ptr<float64>, value: float64): void {
		memory.view.setFloat64(ptr, value, true);
	}

	export function lowerFlat(result: wasmType[], _memory: Memory, value: number): void {
		if (value < LOW_VALUE || value > HIGH_VALUE) {
			throw new Error(`Invalid float64 value ${value}`);
		}
		result.push(Number.isNaN(value) ? NAN : value);
	}
}
export const float64: ComponentModelType<number> = $float64;

export type byte = u8;
export const byte: ComponentModelType<byte> = {
	kind: u8.kind,
	size: u8.size,
	alignment: u8.alignment,
	flatTypes: u8.flatTypes,

	load: u8.load,
	liftFlat: u8.liftFlat,
	alloc: u8.alloc,
	store: u8.store,
	lowerFlat: u8.lowerFlat
};

export type size = u32;
export const size: ComponentModelType<size> = {
	kind: u32.kind,
	size: u32.size,
	alignment: u32.alignment,
	flatTypes: u32.flatTypes,

	load: u32.load,
	liftFlat: u32.liftFlat,
	alloc: u32.alloc,
	store: u32.store,
	lowerFlat: u32.lowerFlat
};

export type ptr<_type = ArrayBuffer> = u32;
export const ptr: ComponentModelType<ptr> = {
	kind: u32.kind,
	size: u32.size,
	alignment: u32.alignment,
	flatTypes: u32.flatTypes,

	load: u32.load,
	liftFlat: u32.liftFlat,
	alloc: u32.alloc,
	store: u32.store,
	lowerFlat: u32.lowerFlat
};
namespace $wchar {
	export const kind: ComponentModelTypeKind = ComponentModelTypeKind.char;
	export const size = 4;
	export const alignment: alignment = 4;
	export const flatTypes: readonly wasmTypeName[] = ['i32'];

	export function load(memory: Memory, ptr: ptr, options: Options): string {
		return fromCodePoint(u32.load(memory, ptr, options));
	}

	export function liftFlat(memory: Memory, values: FlatValuesIter, options: Options): string {
		return fromCodePoint(u32.liftFlat(memory, values, options));
	}

	export function alloc(memory: Memory): ptr {
		return u32.alloc(memory);
	}

	export function store(memory: Memory, ptr: ptr, value: string, options: Options): void {
		u32.store(memory, ptr, asCodePoint(value), options);
	}

	export function lowerFlat(result: wasmType[], memory: Memory, value: string, options: Options): void {
		u32.lowerFlat(result, memory, asCodePoint(value), options);
	}

	function fromCodePoint(code: u32): string {
		if (code >= 0x110000 || (0xD800 <= code && code <= 0xDFFF)) {
			throw new ComponentModelError('Invalid code point');
		}
		return String.fromCodePoint(code);
	}

	function asCodePoint(str: string): u32 {
		if (str.length !== 1) {
			throw new ComponentModelError('String length must be 1');
		}
		const code = str.codePointAt(0)!;
		if (!(code <= 0xD7FF || (0xD800 <= code && code <= 0x10FFFF))) {
			throw new ComponentModelError('Invalid code point');
		}
		return code;
	}
}
export const wchar: ComponentModelType<string> = $wchar;

namespace $wstring {

	const offsets = {
		data: 0,
		codeUnits: 4
	};

	export const kind: ComponentModelTypeKind = ComponentModelTypeKind.string;
	export const size = 8;
	export const alignment: alignment = 4;
	export const flatTypes: readonly wasmTypeName[] = ['i32', 'i32'];

	export function load(memory: Memory, ptr: ptr, options: Options): string {
		const view = memory.view;
		const dataPtr: ptr =  view.getUint32(ptr + offsets.data);
		const codeUnits: u32 = view.getUint32(ptr + offsets.codeUnits);
		return loadFromRange(memory, dataPtr, codeUnits, options);
	}

	export function liftFlat(memory: Memory, values: FlatValuesIter, options: Options): string {
		const dataPtr: ptr = values.next().value as ptr;
		const codeUnits: u32 = values.next().value as u32;
		return loadFromRange(memory, dataPtr, codeUnits, options);
	}

	export function alloc(memory: Memory): ptr {
		return memory.alloc(alignment, size);
	}

	export function store(memory: Memory, ptr: ptr, str: string, options: Options): void {
		const [ data, codeUnits ] = storeIntoRange(memory, str, options);
		const view = memory.view;
		view.setUint32(ptr + offsets.data, data, true);
		view.setUint32(ptr + offsets.codeUnits, codeUnits, true);
	}

	export function lowerFlat(result: wasmType[], memory: Memory, str: string, options: Options): void {
		result.push(...storeIntoRange(memory, str, options));
	}

	function loadFromRange(memory: Memory, data: ptr, codeUnits: u32, options: Options): string {
		const encoding = options.encoding;
		if (encoding === 'latin1+utf-16') {
			throw new Error('latin1+utf-16 encoding not yet supported');
		}
		if (encoding === 'utf-8') {
			const byteLength = codeUnits;
			return utf8Decoder.decode(new Uint8Array(memory.buffer, data, byteLength));
		} else if (encoding === 'utf-16') {
			return String.fromCharCode(...(new Uint16Array(memory.buffer, data, codeUnits)));
		} else {
			throw new Error('Unsupported encoding');
		}
	}

	function storeIntoRange(memory: Memory, str: string, options: Options): [ptr, u32] {
		const { encoding } = options;
		if (encoding === 'latin1+utf-16') {
			throw new Error('latin1+utf-16 encoding not yet supported');
		}
		if (encoding === 'utf-8') {
			const data = utf8Encoder.encode(str);
			const dataPtr = memory.alloc(u8.alignment, data.length);
			memory.raw.set(data, dataPtr);
			return [dataPtr, data.length];
		} else if (encoding === 'utf-16') {
			const dataPtr = memory.alloc(u8.alignment, str.length * 2);
			const data = new Uint16Array(memory.buffer, dataPtr, str.length);
			for (let i = 0; i < str.length; i++) {
				data[i] = str.charCodeAt(i);
			}
			return [dataPtr, data.length];
		} else {
			throw new Error('Unsupported encoding');
		}
	}
}
export const wstring: ComponentModelType<string> = $wstring;

export type JArray = JType[];
export class ListType<T> implements ComponentModelType<T[]> {

	private static readonly offsets = {
		data: 0,
		length: 4
	};

	private readonly elementType: ComponentModelType<T>;

	public readonly kind: ComponentModelTypeKind;
	public readonly size: size;
	public readonly alignment: alignment;
	public readonly flatTypes: readonly wasmTypeName[];

	constructor(elementType: ComponentModelType<T>) {
		this.elementType = elementType;
		this.kind = ComponentModelTypeKind.list;
		this.size = 8;
		this.alignment = 4;
		this.flatTypes = ['i32', 'i32'];
	}

	public load(memory: Memory, ptr: ptr, options: Options): T[] {
		const view = memory.view;
		const offsets = ListType.offsets;
		const dataPtr: ptr =  view.getUint32(ptr + offsets.data);
		const codeUnits: u32 = view.getUint32(ptr + offsets.length);
		return this.loadFromRange(memory, dataPtr, codeUnits, options);
	}

	public liftFlat(memory: Memory, values: FlatValuesIter, options: Options): T[] {
		const dataPtr: ptr = values.next().value as ptr;
		const length: u32 = values.next().value as u32;
		return this.loadFromRange(memory, dataPtr, length, options);
	}

	public alloc(memory: Memory): ptr {
		return memory.alloc(this.alignment, this.size);
	}

	public store(memory: Memory, ptr: ptr, values: T[], options: Options): void {
		const [ data, length ] = this.storeIntoRange(memory, values, options);
		const view = memory.view;
		const offsets = ListType.offsets;
		view.setUint32(ptr + offsets.data, data, true);
		view.setUint32(ptr + offsets.length, length, true);
	}

	public lowerFlat(result: wasmType[], memory: Memory, values: T[], options: Options): void {
		result.push(...this.storeIntoRange(memory, values, options));
	}

	private loadFromRange(memory: Memory, data: ptr, length: u32, options: Options): T[] {
		const result: T[] = [];
		let offset = 0;
		for (let i = 0; i < length; i++) {
			result.push(this.elementType.load(memory, data + offset, options));
			offset += this.elementType.size;
		}
		return result;
	}

	private storeIntoRange(memory: Memory, values: T[], options: Options): [ptr, u32] {
		const bytes = this.elementType.size * values.length;
		const ptr = memory.alloc(this.elementType.alignment, bytes);
		let indexPtr = ptr;
		for (const item of values) {
			this.elementType.store(memory, indexPtr, item, options);
			indexPtr += this.elementType.size;
		}
		return [ptr, values.length];
	}
}

abstract class TypeArrayType<T> implements ComponentModelType<T> {

	private static readonly offsets = {
		data: 0,
		length: 4
	};

	public readonly kind: ComponentModelTypeKind;
	public readonly size: size;
	public readonly alignment: alignment;
	public readonly flatTypes: readonly wasmTypeName[];

	constructor() {
		this.kind = ComponentModelTypeKind.list;
		this.size = 8;
		this.alignment = 4;
		this.flatTypes = ['i32', 'i32'];
	}

	public load(memory: Memory, ptr: ptr, options: Options): T {
		const view = memory.view;
		const offsets = TypeArrayType.offsets;
		const dataPtr: ptr =  view.getUint32(ptr + offsets.data);
		const codeUnits: u32 = view.getUint32(ptr + offsets.length);
		return this.loadFromRange(memory, dataPtr, codeUnits, options);
	}

	public liftFlat(memory: Memory, values: FlatValuesIter, options: Options): T {
		const dataPtr: ptr = values.next().value as ptr;
		const length: u32 = values.next().value as u32;
		return this.loadFromRange(memory, dataPtr, length, options);
	}

	public alloc(memory: Memory): ptr {
		return memory.alloc(this.alignment, this.size);
	}

	public store(memory: Memory, ptr: ptr, value: T, options: Options): void {
		const [ data, length ] = this.storeIntoRange(memory, value, options);
		const view = memory.view;
		const offsets = TypeArrayType.offsets;
		view.setUint32(ptr + offsets.data, data, true);
		view.setUint32(ptr + offsets.length, length, true);
	}

	public lowerFlat(result: wasmType[], memory: Memory, value: T, options: Options): void {
		result.push(...this.storeIntoRange(memory, value, options));
	}

	protected abstract loadFromRange(memory: Memory, data: ptr, length: u32, options: Options): T;
	protected abstract storeIntoRange(memory: Memory, value: T, options: Options): [ptr, u32];

}

export class Int8ArrayType extends TypeArrayType<Int8Array> {
	protected loadFromRange(memory: Memory, data: ptr, length: u32): Int8Array {
		return new Int8Array(memory.buffer, data, length);
	}
	protected storeIntoRange(memory: Memory, value: Int8Array): [ptr, u32] {
		const ptr = memory.alloc(s8.alignment, value.byteLength);
		const target = new Int8Array(memory.buffer, ptr, value.length);
		target.set(value);
		return [ptr, target.length];
	}
}

export class Int16ArrayType extends TypeArrayType<Int16Array> {
	protected loadFromRange(memory: Memory, data: ptr, length: u32): Int16Array {
		return new Int16Array(memory.buffer, data, length);
	}
	protected storeIntoRange(memory: Memory, value: Int16Array): [ptr, u32] {
		const ptr = memory.alloc(s16.alignment, value.byteLength);
		const target = new Int16Array(memory.buffer, ptr, value.length);
		target.set(value);
		return [ptr, target.length];
	}
}

export class Int32ArrayType extends TypeArrayType<Int32Array> {
	protected loadFromRange(memory: Memory, data: ptr, length: u32): Int32Array {
		return new Int32Array(memory.buffer, data, length);
	}
	protected storeIntoRange(memory: Memory, value: Int32Array): [ptr, u32] {
		const ptr = memory.alloc(s32.alignment, value.byteLength);
		const target = new Int32Array(memory.buffer, ptr, value.length);
		target.set(value);
		return [ptr, target.length];
	}
}

export class BigInt64ArrayType extends TypeArrayType<BigInt64Array> {
	protected loadFromRange(memory: Memory, data: ptr, length: u32): BigInt64Array {
		return new BigInt64Array(memory.buffer, data, length);
	}
	protected storeIntoRange(memory: Memory, value: BigInt64Array): [ptr, u32] {
		const ptr = memory.alloc(s64.alignment, value.byteLength);
		const target = new BigInt64Array(memory.buffer, ptr, value.length);
		target.set(value);
		return [ptr, target.length];
	}
}

export class Uint8ArrayType extends TypeArrayType<Uint8Array> {
	protected loadFromRange(memory: Memory, data: ptr, length: u32): Uint8Array {
		return new Uint8Array(memory.buffer, data, length);
	}
	protected storeIntoRange(memory: Memory, value: Uint8Array): [ptr, u32] {
		const ptr = memory.alloc(u8.alignment, value.byteLength);
		const target = new Uint8Array(memory.buffer, ptr, value.length);
		target.set(value);
		return [ptr, target.length];
	}
}

export class Uint16ArrayType extends TypeArrayType<Uint16Array> {
	protected loadFromRange(memory: Memory, data: ptr, length: u32): Uint16Array {
		return new Uint16Array(memory.buffer, data, length);
	}
	protected storeIntoRange(memory: Memory, value: Uint16Array): [ptr, u32] {
		const ptr = memory.alloc(u16.alignment, value.byteLength);
		const target = new Uint16Array(memory.buffer, ptr, value.length);
		target.set(value);
		return [ptr, target.length];
	}
}

export class Uint32ArrayType extends TypeArrayType<Uint32Array> {
	protected loadFromRange(memory: Memory, data: ptr, length: u32): Uint32Array {
		return new Uint32Array(memory.buffer, data, length);
	}
	protected storeIntoRange(memory: Memory, value: Uint32Array): [ptr, u32] {
		const ptr = memory.alloc(u32.alignment, value.byteLength);
		const target = new Uint32Array(memory.buffer, ptr, value.length);
		target.set(value);
		return [ptr, target.length];
	}
}

export class BigUint64ArrayType extends TypeArrayType<BigUint64Array> {
	protected loadFromRange(memory: Memory, data: ptr, length: u32): BigUint64Array {
		return new BigUint64Array(memory.buffer, data, length);
	}
	protected storeIntoRange(memory: Memory, value: BigUint64Array): [ptr, u32] {
		const ptr = memory.alloc(u64.alignment, value.byteLength);
		const target = new BigUint64Array(memory.buffer, ptr, value.length);
		target.set(value);
		return [ptr, target.length];
	}
}

export class Float32ArrayType extends TypeArrayType<Float32Array> {
	protected loadFromRange(memory: Memory, data: ptr, length: u32): Float32Array {
		return new Float32Array(memory.buffer, data, length);
	}
	protected storeIntoRange(memory: Memory, value: Float32Array): [ptr, u32] {
		const ptr = memory.alloc(float32.alignment, value.byteLength);
		const target = new Float32Array(memory.buffer, ptr, value.length);
		target.set(value);
		return [ptr, target.length];
	}
}

export class Float64ArrayType extends TypeArrayType<Float64Array> {
	protected loadFromRange(memory: Memory, data: ptr, length: u32): Float64Array {
		return new Float64Array(memory.buffer, data, length);
	}
	protected storeIntoRange(memory: Memory, value: Float64Array): [ptr, u32] {
		const ptr = memory.alloc(float32.alignment, value.byteLength);
		const target = new Float64Array(memory.buffer, ptr, value.length);
		target.set(value);
		return [ptr, target.length];
	}
}

interface TypedField {
	readonly type: GenericComponentModelType;
	readonly offset: number;
}

export interface JRecord {
	[key: string]: JType | undefined;
}

export type JTuple = JType[];

abstract class BaseRecordType<T extends JRecord | JTuple, F extends TypedField> implements ComponentModelType<T> {

	private fields: F[];

	public kind: ComponentModelTypeKind;
	public readonly size: size;
	public readonly alignment: alignment;
	public readonly flatTypes: readonly wasmTypeName[];

	constructor(fields: F[], kind: ComponentModelTypeKind.record | ComponentModelTypeKind.tuple) {
		this.fields = fields;

		this.kind = kind;
		this.size = BaseRecordType.size(fields);
		this.alignment = BaseRecordType.alignment(fields);
		this.flatTypes = BaseRecordType.flatTypes(fields);
	}

	public load(memory: Memory, ptr: ptr, options: Options): T {
		const result: JType[] = [];
		for (const field of this.fields) {
			const value = field.type.load(memory, ptr + field.offset, options);
			result.push(value);
		}
		return this.create(this.fields, result);
	}


	public liftFlat(memory: Memory, values: FlatValuesIter, options: Options): T {
		const result: JType[] = [];
		for (const field of this.fields) {
			result.push(field.type.liftFlat(memory, values, options));
		}
		return this.create(this.fields, result);
	}

	public alloc(memory: Memory): ptr {
		return memory.alloc(this.alignment, this.size);
	}

	public store(memory: Memory, ptr: ptr, record: T, options: Options): void {
		const values = this.elements(record, this.fields);
		for (let i = 0; i < this.fields.length; i++) {
			const field = this.fields[i];
			const value = values[i];
			field.type.store(memory, ptr + field.offset, value, options);
		}
	}

	public lowerFlat(result: wasmType[], memory: Memory, record: T, options: Options): void {
		const values = this.elements(record, this.fields);
		for (let i = 0; i < this.fields.length; i++) {
			const field = this.fields[i];
			const value = values[i];
			field.type.lowerFlat(result, memory, value, options);
		}
	}

	protected abstract create(fields: F[], values: JType[]): T;
	protected abstract elements(record: T, fields: F[]): JType[];

	private static size(fields: TypedField[]): size {
		let result: ptr = 0;
		for (const field of fields) {
			align(result, field.type.alignment);
			result += field.type.size;
		}
		return result;
	}

	private static alignment(fields: TypedField[]): alignment {
		let result: alignment = 1;
		for (const field of fields) {
			result = Math.max(result, field.type.alignment) as alignment;
		}
		return result;
	}

	private static flatTypes(fields: TypedField[]): readonly wasmTypeName[] {
		const result: wasmTypeName[] = [];
		for (const field of fields) {
			result.push(...field.type.flatTypes);
		}
		return result;
	}
}

interface RecordField extends TypedField {
	readonly name: string;
	readonly offset: number;
}

namespace RecordField {
	export function create(name: string, offset: number, type: GenericComponentModelType): RecordField {
		return { name, offset, type };
	}
}

export class RecordType<T extends JRecord> extends BaseRecordType<T, RecordField> {

	constructor(fields: [string, GenericComponentModelType][]) {
		let offset = 0;
		const recordFields: RecordField[] = [];
		for (const [name, type] of fields) {
			offset = align(offset, type.alignment);
			recordFields.push(RecordField.create(name, offset, type));
			offset += type.size;
		}
		super(recordFields, ComponentModelTypeKind.record);
	}

	protected create(fields: RecordField[], values: JType[]): T {
		const result: JRecord = {};
		for (let i = 0; i < fields.length; i++) {
			const field = fields[i];
			const value = values[i];
			result[field.name] = value;
		}
		return result as T;
	}

	protected elements(record: T, fields: RecordField[]): JType[] {
		const result: JType[] = [];
		for (const field of fields) {
			const value = record[field.name];
			result.push(value);
		}
		return result;
	}
}

interface TupleField extends TypedField {
	readonly offset: number;
}
namespace TupleField {
	export function create(offset: number, type: GenericComponentModelType): TupleField {
		return { offset, type };
	}
}

export class TupleType<T extends JTuple> extends BaseRecordType<T, TupleField> {

	constructor(fields: GenericComponentModelType[]) {
		let offset = 0;
		const tupleFields: TupleField[] = [];
		for (const type of fields) {
			offset = align(offset, type.alignment);
			tupleFields.push(TupleField.create(offset, type));
			offset += type.size;
		}
		super(tupleFields, ComponentModelTypeKind.tuple);
	}

	protected create(_fields: TupleField[], values: JType[]): T {
		return values as JTuple as T;
	}

	protected elements(record: T, _fields: TupleField[]): JType[] {
		return record;
	}
}

export interface JFlags {
	[key: string]: boolean;
}

interface FlagField {
	readonly name: string;
	readonly index: number;
	readonly mask: u32;
}

export namespace FlagField {
	export function create(name: string, index: number, mask: u32): FlagField {
		return { name, index, mask };
	}
}

enum FlagsStorageType {
	Empty,
	Single,
	Array
}

interface SingleFlags {
	readonly _bits: u8 | u16 | u32;
}

interface ArrayFlags {
	readonly _bits: u32[];
}

export type flags<K extends keyof any> = Record<K, boolean> & JFlags;
export class FlagsType<T extends JFlags> implements ComponentModelType<T> {

	private readonly fields: FlagField[];
	private readonly num32Flags: number;
	private type: [FlagsStorageType, typeof u8 | typeof u16 | typeof u32 | undefined];

	public readonly kind: ComponentModelTypeKind;
	public readonly size: size;
	public readonly alignment: alignment;
	public readonly flatTypes: readonly wasmTypeName[];

	constructor(fields: string[]) {
		this.fields = [];
		for (let i = 0; i < fields.length; i++) {
			this.fields.push(FlagField.create(fields[i], i >>> 5, 1 << (i & 31)));
		}

		const nr = fields.length;
		const size = this.size = FlagsType.size(nr);
		this.kind = ComponentModelTypeKind.flags;
		this.type = FlagsType.getType(size);
		this.num32Flags = FlagsType.num32Flags(nr);
		this.alignment = FlagsType.alignment(nr);
		this.flatTypes = FlagsType.flatTypes(nr);
	}

	public create(): T {
		switch (this.type[0]) {
			case FlagsStorageType.Empty:
				return Object.create(null) as T;
			case FlagsStorageType.Single:
				return this.createSingle(0) as T;
			case FlagsStorageType.Array:
				return this.createArray(new Array(this.num32Flags)) as T;
		}
	}

	public load(memory: Memory, ptr: ptr<u8 | u16 | u32 | u32[]>, options: Options): T {
		switch (this.type[0]) {
			case FlagsStorageType.Empty:
				return Object.create(null) as T;
			case FlagsStorageType.Single:
				return this.createSingle(this.type[1]!.load(memory, ptr, options)) as T;
			case FlagsStorageType.Array:
				const bits: u32[] = new Array(this.num32Flags);
				const type = this.type[1]!;
				for (let i = 0; i < this.num32Flags; i++) {
					bits[i] = type.load(memory, ptr, options);
					ptr += type.size;
				}
				return this.createArray(bits) as T;
		}
	}

	public liftFlat(_memory: Memory, values: FlatValuesIter, options: Options): T {
		switch (this.type[0]) {
			case FlagsStorageType.Empty:
				return Object.create(null) as T;
			case FlagsStorageType.Single:
				return this.createSingle(this.type[1]!.liftFlat(_memory, values, options)) as T;
			case FlagsStorageType.Array:
				const bits: i32[] = new Array(this.num32Flags);
				const type = this.type[1]!;
				for (let i = 0; i < this.num32Flags; i++) {
					bits[i] = type.liftFlat(_memory, values, options);
				}
				return this.createArray(bits) as T;
		}
	}

	public alloc(memory: Memory): ptr<u8 | u16 | u32 | u32[]> {
		return memory.alloc(this.alignment, this.size);
	}

	public store(memory: Memory, ptr: ptr<u8 | u16 | u32 | u32[]>, flags: JFlags, options: Options): void {
		switch (this.type[0]) {
			case FlagsStorageType.Empty:
				return;
			case FlagsStorageType.Single:
				this.type[1]!.store(memory, ptr, (flags as unknown as SingleFlags)._bits, options);
				break;
			case FlagsStorageType.Array:
				const type = this.type[1]!;
				for (const flag of (flags as unknown as ArrayFlags)._bits) {
					type.store(memory, ptr, flag, options);
					ptr += type.size;
				}
				break;
		}
	}

	public lowerFlat(result: wasmType[], _memory: Memory, flags: JFlags, options: Options): void {
		switch (this.type[0]) {
			case FlagsStorageType.Empty:
				return;
			case FlagsStorageType.Single:
				this.type[1]!.lowerFlat(result, _memory, (flags as unknown as SingleFlags)._bits, options);
				break;
			case FlagsStorageType.Array:
				const type = this.type[1]!;
				for (const flag of (flags as unknown as ArrayFlags)._bits) {
					type.lowerFlat(result, _memory, flag, options);
				}
				break;
		}
	}

	private createSingle(bits: number): JFlags {
		const result: SingleFlags = { _bits: bits };
		const props = Object.create(null);
		for (const field of this.fields) {
			props[field.name] = {
				get: () => (bits & field.mask) !== 0,
				set: (newVal: boolean) => {
					if (newVal) {
						bits |= field.mask;
					} else {
						bits &= ~field.mask;
					}
				}
			};
		}
		return Object.defineProperties(result as object, props) as JFlags;
	}

	private createArray(bits: u32[]): JFlags {
		const result: ArrayFlags = { _bits: bits };
		const props = Object.create(null);
		for (const field of this.fields) {
			props[field.name] = {
				get: () => (bits[field.index] & field.mask) !== 0,
				set: (newVal: boolean) => {
					if (newVal) {
						bits[field.index] |= field.mask;
					} else {
						bits[field.index] &= ~field.mask;
					}
				}
			};
		}
		return Object.defineProperties(result as object, props) as JFlags;
	}

	private static size(fields: number): size {
		if (fields === 0) {
			return 0;
		} else if (fields <= 8) {
			return 1;
		} else if (fields <= 16) {
			return 2;
		} else {
			return 4 * this.num32Flags(fields);
		}
	}

	private static alignment(fields: number): alignment {
		if (fields <= 8) {
			return 1;
		} else if (fields <= 16) {
			return 2;
		} else {
			return 4;
		}
	}

	private static flatTypes(fields: number): 'i32'[] {
		return new Array(this.num32Flags(fields)).fill('i32');
	}

	private static getType(size: number): [FlagsStorageType, GenericComponentModelType | undefined] {
		switch (size) {
			case 0: return [FlagsStorageType.Empty, undefined];
			case 1: return [FlagsStorageType.Single, u8];
			case 2: return [FlagsStorageType.Single, u16];
			case 4: return [FlagsStorageType.Single, u32];
			default: return [FlagsStorageType.Array, u32];
		}
	}

	private static num32Flags(fields: number): number {
		return Math.ceil(fields / 32);
	}
}

interface VariantCase {
	readonly index: u32;
	readonly type: GenericComponentModelType | undefined;
	readonly wantFlatTypes: wasmTypeName[] | undefined;
}

namespace VariantCase {
	export function create(index: number, type: GenericComponentModelType | undefined): VariantCase {
		return { index, type, wantFlatTypes: type !== undefined ? [] : undefined };
	}
}

export interface JVariantCase {
	readonly case: u32;
	readonly value?: JType | undefined | void;
}

export class VariantType<T extends JVariantCase, I, V> implements ComponentModelType<T> {

	private readonly cases: VariantCase[];
	private readonly ctor: (caseIndex: I, value: V) => T;
	private readonly discriminantType: GenericComponentModelType;
	private readonly maxCaseAlignment: alignment;

	public readonly kind: ComponentModelTypeKind;
	public readonly size: size;
	public readonly alignment: alignment;
	public readonly flatTypes: readonly wasmTypeName[];

	constructor(variants: (GenericComponentModelType | undefined)[], ctor: (caseIndex: I, value: V) => T, kind: ComponentModelTypeKind.variant | ComponentModelTypeKind.result = ComponentModelTypeKind.variant) {
		const cases: VariantCase[] = [];
		for (let i = 0; i < variants.length; i++) {
			const type = variants[i];
			cases.push(VariantCase.create(i, type));
		}
		this.cases = cases;
		this.ctor = ctor;

		this.discriminantType = VariantType.discriminantType(cases.length);
		this.maxCaseAlignment = VariantType.maxCaseAlignment(cases);
		this.kind = kind;
		this.size = VariantType.size(this.discriminantType, cases);
		this.alignment = VariantType.alignment(this.discriminantType, cases);
		this.flatTypes = VariantType.flatTypes(this.discriminantType, cases);
	}

	public load(memory: Memory, ptr: ptr, options: Options): T {
		const caseIndex = this.discriminantType.load(memory, ptr, options);
		ptr += this.discriminantType.size;
		const caseVariant = this.cases[caseIndex];
		if (caseVariant.type === undefined) {
			return this.ctor(caseIndex, undefined as any);
		} else {
			ptr = align(ptr, this.maxCaseAlignment);
			const value = caseVariant.type.load(memory, ptr, options);
			return this.ctor(caseIndex, value);
		}
	}

	public liftFlat(memory: Memory, values: FlatValuesIter, options: Options): T {
		// First one is the discriminant type. So skip it.
		let valuesToReadOver = this.flatTypes.length - 1;
		const caseIndex = this.discriminantType.liftFlat(memory, values, options);
		const caseVariant = this.cases[caseIndex];
		let result: T;
		if (caseVariant.type === undefined) {
			result = this.ctor(caseIndex, undefined as any);
		} else {
			// The first flat type is the discriminant type. So skip it.
			const wantFlatTypes = caseVariant.wantFlatTypes!;
			const iter = new CoerceValueIter(values, this.flatTypes.slice(1), wantFlatTypes);
			const value = caseVariant.type.liftFlat(memory, iter, options);
			result = this.ctor(caseIndex, value);
			valuesToReadOver = valuesToReadOver - wantFlatTypes.length;
		}
		for (let i = 0; i < valuesToReadOver; i++) {
			values.next();
		}
		return result;
	}

	public alloc(memory: Memory): ptr {
		return memory.alloc(this.alignment, this.size);
	}

	public store(memory: Memory, ptr: ptr, variantValue: T, options: Options): void {
		this.discriminantType.store(memory, ptr, variantValue.case, options);
		ptr += this.discriminantType.size;
		const c = this.cases[variantValue.case];
		if (c.type !== undefined && variantValue.value !== undefined) {
			ptr = align(ptr, this.maxCaseAlignment);
			c.type.store(memory, ptr, variantValue.value, options);
		}
	}

	public lowerFlat(result: wasmType[], memory: Memory, variantValue: T, options: Options): void {
		const flatTypes = this.flatTypes;
		this.discriminantType.lowerFlat(result, memory, variantValue.case, options);
		const c = this.cases[variantValue.case];
		// First one is the discriminant type. So skip it.
		let valuesToFill = this.flatTypes.length - 1;
		if (c.type !== undefined && variantValue.value !== undefined) {
			const payload: wasmType[] = [];
			c.type.lowerFlat(payload, memory, variantValue.value, options);
			// First one is the discriminant type. So skip it.
			const wantTypes = flatTypes.slice(1);
			const haveTypes = c.wantFlatTypes!;
			if (payload.length !== haveTypes.length) {
				throw new ComponentModelError('Mismatched flat types');
			}
			for (let i = 0; i < wantTypes.length; i++) {
				const have: wasmTypeName = haveTypes[i];
				const want: wasmTypeName = wantTypes[i];
				if (have === 'f32' && want === 'i32') {
					payload[i] = WasmTypes.reinterpret_f32_as_i32(payload[i] as number);
				} else if (have === 'i32' && want === 'i64') {
					payload[i] = WasmTypes.convert_i32_to_i64(payload[i] as number);
				} else if (have === 'f32' && want === 'i64') {
					payload[i] = WasmTypes.reinterpret_f32_as_i64(payload[i] as number);
				} else if (have === 'f64' && want === 'i64') {
					payload[i] = WasmTypes.reinterpret_f64_as_i64(payload[i] as number);
				}
			}
			valuesToFill = valuesToFill - payload.length;
			result.push(...payload);
		}
		for(let i = flatTypes.length - valuesToFill; i < flatTypes.length; i++) {
			const type = flatTypes[i];
			if (type === 'i64') {
				result.push(0n);
			} else {
				result.push(0);
			}
		}
	}

	private static size(discriminantType: GenericComponentModelType, cases: VariantCase[]): size {
		let result = discriminantType.size;
		result = align(result, this.maxCaseAlignment(cases));
		return result + this.maxCaseSize(cases);
	}

	private static alignment(discriminantType: GenericComponentModelType, cases: VariantCase[]): alignment {
		return Math.max(discriminantType.alignment, this.maxCaseAlignment(cases)) as alignment;
	}

	private static flatTypes(discriminantType: GenericComponentModelType, cases: VariantCase[]): readonly wasmTypeName[] {
		const flat: wasmTypeName[] = [];
		for (const c of cases) {
			if (c.type === undefined) {
				continue;
			}
			const flatTypes = c.type.flatTypes;
			for (let i = 0; i < flatTypes.length; i++) {
				const want = flatTypes[i];
				if (i < flat.length) {
					const use = this.joinFlatType(flat[i], want);
					flat[i] = use;
					c.wantFlatTypes!.push(want);
				} else {
					flat.push(want);
					c.wantFlatTypes!.push(want);
				}
			}
		}
		return [...discriminantType.flatTypes, ...flat];
	}

	private static discriminantType(cases: number): GenericComponentModelType {
		switch (Math.ceil(Math.log2(cases) / 8)) {
			case 0: return u8;
			case 1: return u8;
			case 2: return u16;
			case 3: return u32;
		}
		throw new ComponentModelError(`Too many cases: ${cases}`);
	}

	private static maxCaseAlignment(cases: VariantCase[]): alignment {
		let result: alignment = 1;
		for (const c of cases) {
			if (c.type !== undefined) {
				result = Math.max(result, c.type.alignment) as alignment;
			}
		}
		return result;
	}

	private static maxCaseSize(cases: VariantCase[]): size {
		let result = 0;
		for (const c of cases) {
			if (c.type !== undefined) {
				result = Math.max(result, c.type.size);
			}
		}
		return result;
	}

	private static joinFlatType(a: wasmTypeName, b:wasmTypeName) : wasmTypeName {
		if (a === b) {
			return a;
		}
		if ((a === 'i32' && b === 'f32') || (a === 'f32' && b === 'i32')) {
			return 'i32';
		}
		return 'i64';
	}
}

export type JEnum = number;

export class EnumType<T extends JEnum> implements ComponentModelType<T> {

	private readonly discriminantType: ComponentModelType<u8> | ComponentModelType<u16> | ComponentModelType<u32>;
	private readonly cases: number;

	public readonly kind: ComponentModelTypeKind;
	public readonly size: size;
	public readonly alignment: alignment;
	public readonly flatTypes: readonly wasmTypeName[];

	constructor(cases: number) {
		this.cases = cases;
		this.discriminantType = EnumType.discriminantType(cases);
		this.kind = ComponentModelTypeKind.enum;
		this.size = this.discriminantType.size;
		this.alignment = this.discriminantType.alignment;
		this.flatTypes = this.discriminantType.flatTypes;
	}

	public load(memory: Memory, ptr: ptr, options: Options): T {
		return this.assertRange(this.discriminantType.load(memory, ptr, options)) as T;
	}
	public liftFlat(memory: Memory, values: FlatValuesIter, options: Options): T {
		return this.assertRange(this.discriminantType.liftFlat(memory, values, options)) as T;
	}
	public alloc(memory: Memory): ptr {
		return memory.alloc(this.alignment, this.size);
	}
	public store(memory: Memory, ptr: ptr, value: T, options: Options): void {
		this.discriminantType.store(memory, ptr, value, options);
	}
	public lowerFlat(result: wasmType[], memory: Memory, value: T, options: Options): void {
		this. discriminantType.lowerFlat(result, memory, value, options);
	}

	private assertRange(value: number): number {
		if (value < 0 || value > this.cases) {
			throw new ComponentModelError('Enumeration value out of range');
		}
		return value;
	}

	private static discriminantType(cases: number): ComponentModelType<u8> | ComponentModelType<u16> | ComponentModelType<u32> {
		switch (Math.ceil(Math.log2(cases) / 8)) {
			case 0: return u8;
			case 1: return u8;
			case 2: return u16;
			case 3: return u32;
		}
		throw new ComponentModelError(`Too many cases: ${cases}`);
	}
}


export namespace option {
	export const none = 0 as const;
	export const some = 1 as const;

	export type _ct = typeof none | typeof some;
	export type _vt<T extends JType> = undefined | T;

	type _common<T extends JType> = Omit<OptionImpl<T>, 'case' | 'value'>;

	export type none<T extends JType> = { readonly case: typeof none } & _common<T>;
	export type some<T extends JType> = { readonly case: typeof some; readonly value: T } & _common<T>;

	export function _ctor<T extends JType>(c: _ct, v: _vt<T>): option<T> {
		return new OptionImpl(c, v) as option<T>;
	}

	export function _none<T extends JType>(): none<T> {
		return new OptionImpl<T>(none, undefined) as none<T>;
	}

	export function _some<T extends JType>(value: T): some<T> {
		return new OptionImpl<T>(some, value ) as some<T>;
	}

	export function isOption<T extends JType>(value: T | option<T>): value is option<T> {
		return value instanceof OptionImpl;
	}

	class OptionImpl<T extends JType> {
		private readonly _case: _ct;
		private readonly _value?: _vt<T>;

		constructor(c: typeof option.none | typeof option.some, value: undefined | T) {
			this._case = c;
			this._value = value;
		}

		get case():  typeof option.none | typeof option.some {
			return this._case;
		}

		get value(): undefined | T {
			return this._value;
		}

		public none(): this is none<T> {
			return this._case === option.none;
		}

		public some(): this is some<T> {
			return this._case === option.some;
		}

	}
}
export type option<T extends JType> = option.none<T> | option.some<T>;
export class OptionType<T extends JType> implements ComponentModelType<T | option<T> | undefined> {

	private readonly valueType: GenericComponentModelType;

	public readonly kind: ComponentModelTypeKind;
	public readonly size: size;
	public readonly alignment: alignment;
	public readonly flatTypes: readonly wasmTypeName[];


	constructor(valueType: GenericComponentModelType) {
		this.valueType = valueType;
		this.kind = ComponentModelTypeKind.option;
		this.size = this.computeSize();
		this.alignment = this.computeAlignment();
		this.flatTypes = this.computeFlatTypes();
	}

	public load(memory: Memory, ptr: ptr, options: Options): T | option<T> | undefined {
		const caseIndex = u8.load(memory, ptr, options);
		if (caseIndex === option.none) {
			return options.keepOption ? option._ctor<T>(option.none, undefined) : undefined;
		} else {
			ptr += u8.size;
			ptr = align(ptr, this.alignment);
			const value = this.valueType.load(memory, ptr, options);
			return options.keepOption ? option._ctor(option.some, value) : value;
		}
	}

	public liftFlat(memory: Memory, values: FlatValuesIter, options: Options): T | option<T> | undefined {
		// First one is the discriminant type. So skip it.
		const caseIndex = u8.liftFlat(memory, values, options);
		if (caseIndex === option.none) {
			// Read over the value params
			for (let i = 0; i < this.valueType.flatTypes.length; i++) {
				values.next();
			}
			return options.keepOption ? option._ctor<T>(option.none, undefined) : undefined;
		} else {
			const value = this.valueType.liftFlat(memory, values, options);
			return options.keepOption ? option._ctor(option.some, value) : value;
		}
	}

	public alloc(memory: Memory): ptr {
		return memory.alloc(this.alignment, this.size);
	}

	public store(memory: Memory, ptr: ptr, value: T | option<T> | undefined, options: Options): void {
		const optValue = this.asOptionValue(value, options);
		u8.store(memory, ptr, optValue.case, options);
		ptr += u8.size;
		if (optValue.case === option.some) {
			ptr = align(ptr, this.valueType.alignment);
			this.valueType.store(memory, ptr, optValue.value, options);
		}
	}

	public lowerFlat(result: wasmType[], memory: Memory, value: T | option<T> | undefined, options: Options): void {
		const optValue = this.asOptionValue(value, options);
		u8.lowerFlat(result, memory, optValue.case, options);
		if (optValue.case === option.none) {
			for (const type of this.valueType.flatTypes) {
				if (type === 'i64') {
					result.push(0n);
				} else {
					result.push(0);
				}
			}
		} else {
			this.valueType.lowerFlat(result, memory, optValue.value, options);
		}
	}

	private asOptionValue(value: T | option<T> | undefined, options: Options): option<T> {
		if (option.isOption(value)) {
			if (!options.keepOption) {
				throw new ComponentModelError('Received an option value although options should be unpacked.');
			}
			return value as option<T>;
		} else {
			if (options.keepOption) {
				throw new ComponentModelError('Received a unpacked option value although options should NOT be unpacked.');
			}
			return value === undefined ? option._ctor<T>(option.none, undefined) : option._ctor(option.some, value);
		}
	}

	private computeSize(): size {
		let result = u8.size;
		result = align(result, this.valueType.alignment);
		return result + this.valueType.size;
	}

	private computeAlignment(): alignment {
		return Math.max(u8.alignment, this.valueType.alignment) as alignment;
	}

	private computeFlatTypes(): readonly wasmTypeName[] {
		return [...u8.flatTypes, ...this.valueType.flatTypes];
	}
}

export namespace result {
	export const ok = 0 as const;
	export const error = 1 as const;

	export type _ct = typeof ok | typeof error;
	export type _vt<O extends JType | void, E extends JType | void> = O | E;

	type _common<O extends JType | void, E extends JType | void> = Omit<ResultImpl<O, E>, 'case' | 'value'>;

	export type ok<O extends JType | void, E extends JType | void> = { readonly case: typeof ok; readonly value: O } & _common<O, E>;
	export type error<O extends JType | void, E extends JType | void> = { readonly case: typeof error; readonly value: E } & _common<O, E>;

	export function _ctor<O extends JType | void, E extends JType | void>(c: _ct, v: _vt<O, E>): result<O, E> {
		return new ResultImpl<O, E>(c, v) as result<O, E>;
	}

	export function _ok<O extends JType | void , E extends JType | void>(value: O): ok<O, E> {
		return new ResultImpl<O, E>(ok, value) as ok<O, E>;
	}

	export function _error<O extends JType | void, E extends JType | void>(value: E): error<O, E> {
		return new ResultImpl<O, E>(error, value ) as error<O, E>;
	}

	export class ResultImpl<O extends JType | void, E extends JType | void> implements JVariantCase {

		private readonly _case: _ct;
		private readonly _value: _vt<O, E>;

		constructor(c: _ct, value: _vt<O, E>) {
			this._case = c;
			this._value = value;
		}

		get case(): _ct {
			return this._case;
		}

		get value(): _vt<O, E> {
			return this._value;
		}

		public ok(): this is ok<O, E> {
			return this._case === ok;
		}

		public error(): this is error<O, E> {
			return this._case === error;
		}
	}
}
export type result<O extends JType | void, E extends JType | void = void> = result.ok<O, E> | result.error<O, E>;
export class ResultType<O extends JType | void, E extends JType | void = void> extends VariantType<result<O, E>, 0 | 1, O | E> {
	constructor(okType: GenericComponentModelType | undefined, errorType: GenericComponentModelType | undefined) {
		super([okType, errorType], result._ctor<O, E>, ComponentModelTypeKind.result);
	}
}

export type JType = number | bigint | string | boolean | JArray | JRecord | JVariantCase | JFlags | JTuple | JEnum | option<any> | undefined | result<any, any> | Int8Array | Int16Array | Int32Array | BigInt64Array | Uint8Array | Uint16Array | Uint32Array | BigUint64Array | Float32Array | Float64Array;

export type CallableParameter = [/* name */string, /* type */GenericComponentModelType];

abstract class AbstractResourceCallable {

	protected static MAX_FLAT_PARAMS = 16;
	protected static MAX_FLAT_RESULTS = 1;

	public readonly name: string;
	public readonly witName: string;
	public readonly params: CallableParameter[];
	protected readonly paramTupleType: TupleType<JTuple>;
	public readonly returnType: GenericComponentModelType | undefined;

	protected readonly paramFlatTypes: number;
	protected readonly returnFlatTypes: number;
	protected readonly mode: 'lift' | 'lower';

	constructor(name: string, witName: string, params: CallableParameter[], returnType?: GenericComponentModelType) {
		this.name = name;
		this.witName = witName;
		this.params = params;
		this.returnType = returnType;
		const paramTypes: GenericComponentModelType[] = [];
		let paramFlatTypes: number = 0;
		for (const param of params) {
			paramTypes.push(param[1]);
			paramFlatTypes += param[1].flatTypes.length;
		}
		this.paramFlatTypes = paramFlatTypes;
		this.paramTupleType = new TupleType(paramTypes);
		this.returnFlatTypes = returnType !== undefined ? returnType.flatTypes.length : 0;
		this.mode = 'lower';
	}

	public liftParamValues(wasmValues: (number | bigint)[], memory: Memory, options: Options): JType[] {
		if (this.paramFlatTypes > AbstractResourceCallable.MAX_FLAT_PARAMS) {
			const p0 = wasmValues[0];
			if (!Number.isInteger(p0)) {
				throw new ComponentModelError('Invalid pointer');
			}
			return this.paramTupleType.load(memory, p0 as ptr, options);
		} else {
			return this.paramTupleType.liftFlat(memory, wasmValues.values(), options);
		}
	}

	public liftReturnValue(value: wasmType | void, memory: Memory, options: Options): JType | void {
		if (this.returnFlatTypes === 0) {
			return;
		} else if (this.returnFlatTypes <= FunctionType.MAX_FLAT_RESULTS) {
			const type = this.returnType!;
			return type.liftFlat(memory, [value!].values(), options);
		} else {
			const type = this.returnType!;
			return type.load(memory, value as ptr, options);
		}
	}

	public lowerParamValues(values: JType[], memory: Memory, options: Options, out: ptr | undefined): wasmType[] {
		if (this.paramFlatTypes > FunctionType.MAX_FLAT_PARAMS) {
			const ptr = out !== undefined ? out : memory.alloc(this.paramTupleType.alignment, this.paramTupleType.size);
			this.paramTupleType.store(memory, ptr, values as JTuple, options);
			return [ptr];
		} else {
			const result: wasmType[] = [];
			this.paramTupleType.lowerFlat(result, memory, values, options);
			return result;
		}
	}

	public lowerReturnValue(value: JType | void, memory: Memory, options: Options, out: ptr | undefined): wasmType | void {
		if (this.returnFlatTypes === 0) {
			return;
		} else if (this.returnFlatTypes <= FunctionType.MAX_FLAT_RESULTS) {
			const result: wasmType[] = [];
			this.returnType!.lowerFlat(result, memory, value, options);
			if (result.length !== 1) {
				throw new ComponentModelError('Invalid result');
			}
			return result[0];
		} else {
			const type = this.returnType!;
			const ptr = out !== undefined ? out : memory.alloc(type.alignment, type.size);
			type.store(memory, ptr, value, options);
			return;
		}
	}
}

export type ServiceFunction = (...params: JType[]) => JType | void;
export interface ServiceInterface {
	readonly [key: string]: (ServiceFunction | ServiceInterface);
}

export type WasmFunction = (...params: wasmType[]) => wasmType | void;

export class FunctionType<_T extends Function> extends AbstractResourceCallable {

	constructor(name: string, witName: string, params: CallableParameter[], returnType?: GenericComponentModelType) {
		super(name, witName, params, returnType);
	}

	public callService(params: (number | bigint)[], serviceFunction: ServiceFunction, memory: Memory, options: Options): number | bigint | void {
		// We currently only support 'lower' mode for results > MAX_FLAT_RESULTS.
		if (this.returnFlatTypes > FunctionType.MAX_FLAT_RESULTS && params.length !== this.paramFlatTypes + 1) {
			throw new ComponentModelError(`Invalid number of parameters. Received ${params.length} but expected ${this.paramFlatTypes + 1}`);
		}
		const jParams = this.liftParamValues(params, memory, options);
		const result: JType | void = serviceFunction(...jParams);
		const out = params[params.length - 1];
		if (typeof out !== 'number') {
			throw new ComponentModelError(`Result pointer must be a number (u32), but got ${out}.`);
		}
		return this.lowerReturnValue(result, memory, options, out);
	}

	public callWasm(params: JType[], wasmFunction: WasmFunction, memory: Memory, options: Options): JType | void {
		const wasmValues = this.lowerParamValues(params, memory, options, undefined);
		// We currently only support 'lower' mode for results > MAX_FLAT_RESULTS.
		let resultPtr: ptr | undefined = undefined;
		if (this.returnFlatTypes > FunctionType.MAX_FLAT_RESULTS) {
			resultPtr = memory.alloc(this.returnType!.alignment, this.returnType!.size);
			wasmValues.push(resultPtr);
		}
		const result = wasmFunction(...wasmValues);
		switch(this.returnFlatTypes) {
			case 0:
				return;
			case 1:
				return result;
			default:
				return this.liftReturnValue(resultPtr, memory, options);
		}
	}
}

export type resource = u32;
abstract class AbstractResourceType implements ComponentModelType<resource> {

	public readonly kind: ComponentModelTypeKind;
	public readonly size: size;
	public readonly alignment: alignment;
	public readonly flatTypes: readonly wasmTypeName[];

	constructor(kind: ComponentModelTypeKind) {
		this.kind = kind;
		this.size = u32.size;
		this.alignment = u32.alignment;
		this.flatTypes = u32.flatTypes;
	}

	public load(memory: Memory, ptr: ptr, options: Options): resource {
		return u32.load(memory, ptr, options);
	}

	public liftFlat(memory: Memory, values: FlatValuesIter, options: Options): resource {
		return u32.liftFlat(memory, values, options);
	}

	public alloc(memory: Memory): ptr {
		return u32.alloc(memory);
	}

	public store(memory: Memory, ptr: ptr, value: resource, options: Options): void {
		u32.store(memory, ptr, value, options);
	}

	public lowerFlat(result: wasmType[], memory: Memory, value: resource, options: Options): void {
		u32.lowerFlat(result, memory, value, options);
	}
}

export type borrow<T extends JType> = T;
export class BorrowType<_T extends resource> extends AbstractResourceType {
	constructor(_r: ComponentModelType<resource>) {
		super(ComponentModelTypeKind.borrow);
	}
}

export type own<T extends JType> = T;
export class OwnType<_T extends resource> extends AbstractResourceType {
	constructor(_r: ComponentModelType<resource>) {
		super(ComponentModelTypeKind.own);
	}
}

export class NamespaceResourceType extends AbstractResourceType {

	public readonly name: string;
	public readonly witName: string;
	public readonly functions: Map<string, FunctionType<Function>>;

	constructor(name: string, witName: string) {
		super(ComponentModelTypeKind.resource);
		this.name = name;
		this.witName = witName;
		this.functions = new Map();
	}

	public addFunction(func: FunctionType<Function>): void {
		this.functions.set(func.name, func);
	}
}

export class ClassResourceType extends AbstractResourceType {
	constructor() {
		super(ComponentModelTypeKind.resource);
	}
}

export interface Context {
	readonly memory: Memory;
	readonly options: Options;
}

type UnionJType = number & bigint & string & boolean & JArray & JRecord & JVariantCase & JFlags & JTuple & JEnum & option<any> & undefined & result<any, any> & Int8Array & Int16Array & Int32Array & BigInt64Array & Uint8Array & Uint16Array & Uint32Array & BigUint64Array & Float32Array & Float64Array;

type UnionWasmType = number & bigint;
type ParamWasmFunction = (...params: UnionWasmType[]) => wasmType | void;
interface ParamWasmInterface {
	readonly [key: string]: ParamWasmFunction;
}

type ParamServiceFunction = (...params: UnionJType[]) => JType | void;
interface ParamServiceInterface {
	readonly [key: string]: (ParamServiceFunction | ParamServiceInterface);
}

export type Host = ParamWasmInterface;
export namespace Host {
	export function create<T extends Host>(signatures: FunctionType<ServiceFunction>[], resources: NamespaceResourceType[], service: ParamServiceInterface, context: Context): T {
		const result: { [key: string]: WasmFunction }  = Object.create(null);
		for (const signature of signatures) {
			result[signature.witName] = createHostFunction(signature, service, context);
		}
		for (const resource of resources) {
			const resourceInterface = service[resource.name] as ParamServiceInterface;
			for (const callable of resource.functions.values()) {
				result[callable.witName] = createHostFunction(callable, resourceInterface, context);
			}
		}
		return result as unknown as T;
	}

	function createHostFunction(func: FunctionType<ServiceFunction>, service: ParamServiceInterface, context: Context): WasmFunction {
		const serviceFunction = service[func.name] as ServiceFunction;
		return (...params: wasmType[]): number | bigint | void => {
			return func.callService(params, serviceFunction, context.memory, context.options);
		};
	}
}

interface WriteableServiceInterface {
	[key: string]: (ServiceFunction | WriteableServiceInterface);
}
export type Service = ParamServiceInterface | {};
export namespace Service {

	export function create<T extends Service>(signatures: FunctionType<Function>[], resources: NamespaceResourceType[], wasm: ParamWasmInterface, context: Context): T {
		const result: WriteableServiceInterface  = Object.create(null);
		for (const signature of signatures) {
			result[signature.name] = createServiceFunction(signature, wasm, context);
		}
		for (const resource of resources) {
			const resourceService: WriteableServiceInterface = Object.create(null);
			result[resource.name] = resourceService;
			for (const callable of resource.functions.values()) {
				resourceService[callable.name] = createServiceFunction(callable, wasm, context);
			}
		}
		return result as unknown as T;
	}

	function createServiceFunction(func: FunctionType<ServiceFunction>, wasm: ParamWasmInterface, context: Context): ServiceFunction {
		const wasmFunction = wasm[func.witName] as WasmFunction;
		return (...params: JType[]): JType | void => {
			return func.callWasm(params, wasmFunction, context.memory, context.options);
		};
	}
}