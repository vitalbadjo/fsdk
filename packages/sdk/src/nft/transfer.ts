import type { Fcl } from "@rarible/fcl-types"
import type { Maybe } from "@rarible/types/build/maybe"
import type { AuthWithPrivateKey, FlowNetwork, FlowTransaction } from "../types"
import { runTransaction, waitForSeal } from "../common/transaction"
import { getNftCode } from "../tx-code-store/nft"
import type { FlowContractAddress } from "../common/flow-address"
import { getCollectionConfig } from "../common/collection/get-config"

export async function transfer(
	fcl: Maybe<Fcl>,
	auth: AuthWithPrivateKey,
	network: FlowNetwork,
	collection: FlowContractAddress,
	tokenId: number,
	to: string,
): Promise<FlowTransaction> {
	if (fcl) {
		const { map, name } = getCollectionConfig(network, collection)
		const txId = await runTransaction(fcl, map, getNftCode(name).transfer(fcl, tokenId, to), auth)
		return await waitForSeal(fcl, txId)
	}
	throw new Error("Fcl is required for transfer")
}
