/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import RAL from '../../ral';
import type { TestRequests } from '../tests';

const connection = RAL().$testing.ServiceConnection.create<TestRequests>()!;
connection.onRequest('int64array', (resultBuffer) => {
	const result = new BigInt64Array(64);
	for (let i = 0; i < result.length; i++) {
		result[i] = BigInt((i + 1) * -1);
	}
	resultBuffer.set(result);
	return { errno: 0 };
});
connection.signalReady();