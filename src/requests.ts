export type DataPoint = [string, number];
export type GetResult = number | Array<DataPoint> | undefined;
export type GetCallback = (result: GetResult) => void;

export interface GetRequest {
	key: string;
	callback: GetCallback;
}

export interface GetValue {
	key: string;
	rank: number;
	value: number;
}
