import { DataStoreService } from "@rbxts/services";
import { DataPoint, GetCallback, GetRequest, GetResult, GetValue } from "./requests";

export class LeaderStore {
	private dataStore: DataStore;

	/**
	 * Constructor validates that the requested name is avaiable for use
	 * If this is a new LeaderStore, initializes the data store for use
	 *
	 * @param name - Identifier for the LeaderStore
	 * @param scope - Scope of the leader store
	 */
	public constructor(
		public name: string,
		public scope?: string,
	) {
		this.dataStore = DataStoreService.GetDataStore(`ls_${name}`);

		let pointer = this.dataStore.GetAsync("ls_tail")[0] as number;
		const hasKeys = this.dataStore.ListKeysAsync().GetCurrentPage().size() > 0;

		if (pointer === undefined) {
			if (hasKeys) return error(`${name} unavailable for Leaderstore. Try different name.`);

			pointer = 0;
			this.dataStore.SetAsync("ls_tail", pointer);
		}
	}

	// * Get Requests
	private getRunning = false;
	private getQueue = new Array<GetRequest>();

	/**
	 * Processes get requests from the queue as soon as budget becomes avaiable
	 */
	private processGetQueue(): void {
		if (this.getRunning) return;
		this.getRunning = true;

		this.getQueue.forEach((element) => {
			while (DataStoreService.GetRequestBudgetForRequestType(Enum.DataStoreRequestType.GetAsync) <= 0) {
				warn(`Waiting for GET budget. ${this.getQueue.size()} requests in GET queue.`);
				task.wait(3);
			}

			element.callback(this.dataStore.GetAsync(element.key)[0] as GetResult);
		});

		this.getRunning = false;
	}

	/**
	 * Adds get requests to the queue
	 *
	 * @param key - The key to retrieve
	 * @param callback - Function called with GetResult when request is resolved
	 */
	private queueGetRequest(key: string, callback: GetCallback): void {
		this.getQueue.push({ key: key, callback: callback });
		this.processGetQueue();
	}

	/**
	 * Retrieves a value matching the key
	 *
	 * @param key - The key to retrive
	 * @returns result - A promise which resolve the reuslts as a GetResult
	 */
	private async getValue(key: string): Promise<GetResult> {
		return new Promise<GetResult>((resolve) => {
			this.queueGetRequest(key, (result) => {
				resolve(result);
			});
		});
	}

	/**
	 * Retrieves the tail pointer of the LeaderStore
	 *
	 * @returns tail - The tail pointer value
	 */
	private getTail(): number {
		return this.getValue("ls_tail").expect() as number;
	}

	/**
	 * Retrieves a keys value and rank from the LeaderStore
	 * An optional value can be provided to leverage binary to optimize retrival
	 *
	 * @param key - The key to retrieve
	 * @param value - (Optional) value to leverage binary search
	 * @returns GetValue - The key, rank and value as a table
	 */
	public get(key: string, value?: number): GetValue {
		for (let i = 0; i <= this.getTail(); i++) {
			let returnResult = undefined;

			const result = this.getValue(tostring(i)).expect() as DataPoint[];

			if (value !== undefined) {
				if (result[result.size() - 1][1] < (value as number)) {
					continue;
				}

				// TODO: Use a binary search here to speed things up
			}

			result.forEach((element, index) => {
				if (element[0] === key) {
					returnResult = { key: key, rank: index, value: element[1] };
					return;
				}
			});

			if (returnResult !== undefined) return returnResult;
		}

		return error(`Key ${key} doesn't exist.`);
	}

	// TODO: Handle setting results
}
