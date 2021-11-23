export declare type JSONPrimitive = string | number | boolean | null;
export declare type JSONValue = JSONPrimitive | JSONObject | JSONArray;
export declare type JSONObject = {
    [member: string]: JSONValue;
};
export declare type JSONArray = Array<JSONValue>;
export declare type JSONLike = JSONPrimitive | JSONLikeObject | Array<JSONLike> | Date | undefined;
export declare type JSONLikeObject = {
    [member: string]: JSONLike;
    [member: number]: JSONLike;
};
