import type { Fcl } from "@rarible/fcl-types"
import type { AuthWithPrivateKey, FlowTransaction } from "../types"
import { replaceImportAddresses } from "./replace-imports"

export type MethodArgs = {
	cadence: string
	args?: any
}

export const runScript = async (
	fcl: Fcl,
	params: MethodArgs,
	addressMap: Record<string, string>,
) => {
	const cadence = replaceImportAddresses(params.cadence, addressMap)
	const result = await fcl.send([fcl.script`${cadence}`, params.args])
	return await fcl.decode(result)
}

export const runTransaction = async (
	fcl: Fcl,
	addressMap: Record<string, string>,
	params: MethodArgs,
	signature: AuthWithPrivateKey,
	gasLimit: number = 999,
): Promise<string> => {
	const code = replaceImportAddresses(params.cadence, addressMap)
	const ix = [fcl.limit(gasLimit)]
	ix.push(
		fcl.payer(signature || fcl.authz),
		fcl.proposer(signature || fcl.authz),
		fcl.authorizations([signature || fcl.authz]),
	)

	if (params.args) {
		ix.push(params.args)
	}
	ix.push(fcl.transaction(code))
	const tx = await fcl.send(ix)
	return tx.transactionId
}

type TxEvent = {
	data: any,
	type: string
}

export type TxResult = {
	error: boolean,
	txId: string,
	events: TxEvent[]
	errorMessage?: string,
	status?: number
	statusCode?: number
}

export const waitForSeal = async (fcl: Fcl, txId: string): Promise<FlowTransaction> => {
	const sealed = await fcl.tx(txId).onceSealed()
	return {
		...sealed,
		txId,
	}
}

export function subscribeForTxResult(fcl: Fcl, txId: string, cb: (tx: FlowTransaction) => void) {
	const unsub = fcl
		.tx(txId)
		.subscribe((transaction) => {
			cb({ txId, ...transaction })
			if (fcl.tx.isSealed(transaction)) {
				unsub()
			}
		})
}

export const contractAddressHex = async <T extends Record<string, any>>(fcl: Fcl<T>, label: keyof T) => {
	const contract = await fcl.config().get(label)
	return fcl.sansPrefix(contract)
}
