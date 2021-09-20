export interface IMetadataKey {
	name: string,
}

export interface IMetadata {
	keys: Record<string, IMetadataKey>

	get<T>(key: IMetadataKey): T
	has(key: IMetadataKey): boolean
	set(key: IMetadataKey, value: unknown): void
}