// @generated by protoc-gen-es v1.2.0 with parameter "target=ts"
// @generated from file dmp.proto (syntax proto2)
/* eslint-disable */
// @ts-nocheck

import type {
  BinaryReadOptions,
  FieldList,
  JsonReadOptions,
  JsonValue,
  PartialMessage,
  PlainMessage
} from '@bufbuild/protobuf'
import { Message, proto2, protoInt64 } from '@bufbuild/protobuf'

/**
 * The type of identifier being uploaded.
 *
 * @generated from enum UserIdType
 */
export enum UserIdType {
  /**
   * A user identifier received through the cookie matching service.
   *
   * @generated from enum value: GOOGLE_USER_ID = 0;
   */
  GOOGLE_USER_ID = 0,

  /**
   * iOS Advertising ID.
   *
   * @generated from enum value: IDFA = 1;
   */
  IDFA = 1,

  /**
   * Android Advertising ID.
   *
   * @generated from enum value: ANDROID_ADVERTISING_ID = 2;
   */
  ANDROID_ADVERTISING_ID = 2,

  /**
   * Roku ID.
   *
   * @generated from enum value: RIDA = 5;
   */
  RIDA = 5,

  /**
   * Amazon Fire TV ID.
   *
   * @generated from enum value: AFAI = 6;
   */
  AFAI = 6,

  /**
   * XBOX/Microsoft ID.
   *
   * @generated from enum value: MSAI = 7;
   */
  MSAI = 7,

  /**
   * A "generic" category for any UUID formatted device provided ID.
   * Allows partner uploads without needing to select a specific,
   * pre-existing Device ID type.
   *
   * @generated from enum value: GENERIC_DEVICE_ID = 9;
   */
  GENERIC_DEVICE_ID = 9,

  /**
   * Partner provided ID. User identifier in partner's namespace.
   * If the partner has sent the partner user identifier during cookie matching,
   * then Google will be able to store user list membership associated with
   * the partner's user identifier.
   * See cookie matching documentation:
   * https://developers.google.com/authorized-buyers/rtb/cookie-guide
   *
   * @generated from enum value: PARTNER_PROVIDED_ID = 4;
   */
  PARTNER_PROVIDED_ID = 4
}
// Retrieve enum metadata with: proto2.getEnumType(UserIdType)
proto2.util.setEnumType(UserIdType, 'UserIdType', [
  { no: 0, name: 'GOOGLE_USER_ID' },
  { no: 1, name: 'IDFA' },
  { no: 2, name: 'ANDROID_ADVERTISING_ID' },
  { no: 5, name: 'RIDA' },
  { no: 6, name: 'AFAI' },
  { no: 7, name: 'MSAI' },
  { no: 9, name: 'GENERIC_DEVICE_ID' },
  { no: 4, name: 'PARTNER_PROVIDED_ID' }
])

/**
 * Notification code.
 *
 * @generated from enum NotificationCode
 */
export enum NotificationCode {
  /**
   * A cookie is considered inactive if Google has not seen any activity related
   * to the cookie in several days.
   *
   * @generated from enum value: INACTIVE_COOKIE = 0;
   */
  INACTIVE_COOKIE = 0
}
// Retrieve enum metadata with: proto2.getEnumType(NotificationCode)
proto2.util.setEnumType(NotificationCode, 'NotificationCode', [{ no: 0, name: 'INACTIVE_COOKIE' }])

/**
 * Notification status code.
 *
 * @generated from enum NotificationStatus
 */
export enum NotificationStatus {
  /**
   * No need to send notifications for this request.
   *
   * @generated from enum value: NO_NOTIFICATION = 0;
   */
  NO_NOTIFICATION = 0,

  /**
   * Google decided to not send notifications, even though there were
   * notifications to send.
   *
   * @generated from enum value: NOTIFICATIONS_OMITTED = 1;
   */
  NOTIFICATIONS_OMITTED = 1
}
// Retrieve enum metadata with: proto2.getEnumType(NotificationStatus)
proto2.util.setEnumType(NotificationStatus, 'NotificationStatus', [
  { no: 0, name: 'NO_NOTIFICATION' },
  { no: 1, name: 'NOTIFICATIONS_OMITTED' }
])

/**
 * Response error codes.
 *
 * @generated from enum ErrorCode
 */
export enum ErrorCode {
  /**
   * @generated from enum value: NO_ERROR = 0;
   */
  NO_ERROR = 0,

  /**
   * Some of the user data operations failed.  See comments in the
   * UpdateUserDataResponse
   *
   * @generated from enum value: PARTIAL_SUCCESS = 1;
   */
  PARTIAL_SUCCESS = 1,

  /**
   * Provided network_id cannot add data to attribute_id or non-HTTPS.
   *
   * @generated from enum value: PERMISSION_DENIED = 2;
   */
  PERMISSION_DENIED = 2,

  /**
   * Cannot parse payload.
   *
   * @generated from enum value: BAD_DATA = 3;
   */
  BAD_DATA = 3,

  /**
   * Cannot decode provided cookie.
   *
   * @generated from enum value: BAD_COOKIE = 4;
   */
  BAD_COOKIE = 4,

  /**
   * Invalid or closed user_list_id.
   *
   * @generated from enum value: BAD_ATTRIBUTE_ID = 5;
   */
  BAD_ATTRIBUTE_ID = 5,

  /**
   * An invalid nid parameter was provided in the request.
   *
   * @generated from enum value: BAD_NETWORK_ID = 7;
   */
  BAD_NETWORK_ID = 7,

  /**
   * Request payload size over allowed limit.
   *
   * @generated from enum value: REQUEST_TOO_BIG = 8;
   */
  REQUEST_TOO_BIG = 8,

  /**
   * No UserDataOperation messages in UpdateUsersDataRequest.
   *
   * @generated from enum value: EMPTY_REQUEST = 9;
   */
  EMPTY_REQUEST = 9,

  /**
   * The server could not process the request due to an internal error. Retrying
   * the same request later is suggested.
   *
   * @generated from enum value: INTERNAL_ERROR = 10;
   */
  INTERNAL_ERROR = 10,

  /**
   * Bad data_source_id -- most likely out of range from [1, 1000].
   *
   * @generated from enum value: BAD_DATA_SOURCE_ID = 11;
   */
  BAD_DATA_SOURCE_ID = 11,

  /**
   * The timestamp is a past/future time that is too far from current time.
   *
   * @generated from enum value: BAD_TIMESTAMP = 12;
   */
  BAD_TIMESTAMP = 12,

  /**
   * Missing internal mapping.
   * If operation is PARTNER_PROVIDED_ID, then this error means our mapping
   * table does not contain corresponding google user id. This mapping is
   * recorded during Cookie Matching.
   * For other operations, then it may be internal error.
   *
   * @generated from enum value: UNKNOWN_ID = 21;
   */
  UNKNOWN_ID = 21
}
// Retrieve enum metadata with: proto2.getEnumType(ErrorCode)
proto2.util.setEnumType(ErrorCode, 'ErrorCode', [
  { no: 0, name: 'NO_ERROR' },
  { no: 1, name: 'PARTIAL_SUCCESS' },
  { no: 2, name: 'PERMISSION_DENIED' },
  { no: 3, name: 'BAD_DATA' },
  { no: 4, name: 'BAD_COOKIE' },
  { no: 5, name: 'BAD_ATTRIBUTE_ID' },
  { no: 7, name: 'BAD_NETWORK_ID' },
  { no: 8, name: 'REQUEST_TOO_BIG' },
  { no: 9, name: 'EMPTY_REQUEST' },
  { no: 10, name: 'INTERNAL_ERROR' },
  { no: 11, name: 'BAD_DATA_SOURCE_ID' },
  { no: 12, name: 'BAD_TIMESTAMP' },
  { no: 21, name: 'UNKNOWN_ID' }
])

/**
 * Update data for a single user.
 *
 * @generated from message UserDataOperation
 */
export class UserDataOperation extends Message<UserDataOperation> {
  /**
   * User id.  The type is determined by the user_id_type field.
   *
   * Must always be present.  Specifies which user this operation applies to.
   *
   * @generated from field: optional string user_id = 1 [default = ""];
   */
  userId?: string

  /**
   * The type of the user id.
   *
   * @generated from field: optional UserIdType user_id_type = 14 [default = GOOGLE_USER_ID];
   */
  userIdType?: UserIdType

  /**
   * The id of the userlist.  This can be retrieved from the AdX UI for AdX
   * customers, the AdWords API for non-AdX customers, or through your Technical
   * Account Manager.
   *
   * @generated from field: optional int64 user_list_id = 4 [default = 0];
   */
  userListId?: bigint

  /**
   * Optional time (seconds since the epoch) when the user performed an action
   * causing them to be added to the list.  Using the default value of 0
   * indicates that the current time on the server should be used.
   *
   * @generated from field: optional int64 time_added_to_user_list = 5 [default = 0];
   */
  timeAddedToUserList?: bigint

  /**
   * Same as time_added_to_user_list but with finer grained time resolution, in
   * microseconds.  If both timestamps are specified,
   * time_added_to_user_list_in_usec will be used.
   *
   * @generated from field: optional int64 time_added_to_user_list_in_usec = 8 [default = 0];
   */
  timeAddedToUserListInUsec?: bigint

  /**
   * Set to true if the operation is a deletion.
   *
   * @generated from field: optional bool delete = 6 [default = false];
   */
  delete?: boolean

  /**
   * Set true if the user opted out from being targeted.
   *
   * @generated from field: optional bool opt_out = 12 [default = false];
   */
  optOut?: boolean

  /**
   * An id indicating the data source which contributed this membership.  The id
   * is required to be in the range of 1 to 1000 and any ids greater than this
   * will result in an error of type BAD_DATA_SOURCE_ID.  These ids don't have
   * any semantics for Google and may be used as labels for reporting purposes.
   *
   * @generated from field: optional int32 data_source_id = 7 [default = 0];
   */
  dataSourceId?: number

  constructor(data?: PartialMessage<UserDataOperation>) {
    super()
    proto2.util.initPartial(data, this)
  }

  static readonly runtime: typeof proto2 = proto2
  static readonly typeName = 'UserDataOperation'
  static readonly fields: FieldList = proto2.util.newFieldList(() => [
    { no: 1, name: 'user_id', kind: 'scalar', T: 9 /* ScalarType.STRING */, opt: true, default: '' },
    {
      no: 14,
      name: 'user_id_type',
      kind: 'enum',
      T: proto2.getEnumType(UserIdType),
      opt: true,
      default: UserIdType.GOOGLE_USER_ID
    },
    {
      no: 4,
      name: 'user_list_id',
      kind: 'scalar',
      T: 3 /* ScalarType.INT64 */,
      opt: true,
      default: protoInt64.parse('0')
    },
    {
      no: 5,
      name: 'time_added_to_user_list',
      kind: 'scalar',
      T: 3 /* ScalarType.INT64 */,
      opt: true,
      default: protoInt64.parse('0')
    },
    {
      no: 8,
      name: 'time_added_to_user_list_in_usec',
      kind: 'scalar',
      T: 3 /* ScalarType.INT64 */,
      opt: true,
      default: protoInt64.parse('0')
    },
    { no: 6, name: 'delete', kind: 'scalar', T: 8 /* ScalarType.BOOL */, opt: true, default: false },
    { no: 12, name: 'opt_out', kind: 'scalar', T: 8 /* ScalarType.BOOL */, opt: true, default: false },
    { no: 7, name: 'data_source_id', kind: 'scalar', T: 5 /* ScalarType.INT32 */, opt: true, default: 0 }
  ])

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): UserDataOperation {
    return new UserDataOperation().fromBinary(bytes, options)
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): UserDataOperation {
    return new UserDataOperation().fromJson(jsonValue, options)
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): UserDataOperation {
    return new UserDataOperation().fromJsonString(jsonString, options)
  }

  static equals(
    a: UserDataOperation | PlainMessage<UserDataOperation> | undefined,
    b: UserDataOperation | PlainMessage<UserDataOperation> | undefined
  ): boolean {
    return proto2.util.equals(UserDataOperation, a, b)
  }
}

/**
 * This protocol buffer is used to update user data.  It is sent as the payload
 * of an HTTPS POST request with the Content-Type header set to
 * "application/octet-stream" (preferrably Content-Encoding: gzip).
 *
 * @generated from message UpdateUsersDataRequest
 */
export class UpdateUsersDataRequest extends Message<UpdateUsersDataRequest> {
  /**
   * Multiple operations over user attributes or user lists.
   *
   * @generated from field: repeated UserDataOperation ops = 1;
   */
  ops: UserDataOperation[] = []

  /**
   * If true, request sending notifications about the given users in the
   * response.  Note that in some circumstances notifications may not be sent
   * even if requested.  In this case the notification_status field of the
   * response will be set to NOTIFICATIONS_OMITTED.
   *
   * @generated from field: optional bool send_notifications = 2 [default = false];
   */
  sendNotifications?: boolean

  constructor(data?: PartialMessage<UpdateUsersDataRequest>) {
    super()
    proto2.util.initPartial(data, this)
  }

  static readonly runtime: typeof proto2 = proto2
  static readonly typeName = 'UpdateUsersDataRequest'
  static readonly fields: FieldList = proto2.util.newFieldList(() => [
    { no: 1, name: 'ops', kind: 'message', T: UserDataOperation, repeated: true },
    { no: 2, name: 'send_notifications', kind: 'scalar', T: 8 /* ScalarType.BOOL */, opt: true, default: false },
    {
      no: 3,
      name: 'process_consent',
      kind: 'scalar',
      T: 8 /* ScalarType.BOOL */,
      opt: true,
      default: false
    }
  ])

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): UpdateUsersDataRequest {
    return new UpdateUsersDataRequest().fromBinary(bytes, options)
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): UpdateUsersDataRequest {
    return new UpdateUsersDataRequest().fromJson(jsonValue, options)
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): UpdateUsersDataRequest {
    return new UpdateUsersDataRequest().fromJsonString(jsonString, options)
  }

  static equals(
    a: UpdateUsersDataRequest | PlainMessage<UpdateUsersDataRequest> | undefined,
    b: UpdateUsersDataRequest | PlainMessage<UpdateUsersDataRequest> | undefined
  ): boolean {
    return proto2.util.equals(UpdateUsersDataRequest, a, b)
  }

  /**
   * https://developers.google.com/authorized-buyers/rtb/bulk-uploader#process_consent_in_bulk_upload_request
   *
   * @generated from field: optional bool process_consent = 3 [default = true];
   */
  processConsent: boolean = false
}

/**
 * Information about an error with an individual user operation.
 *
 * @generated from message ErrorInfo
 */
export class ErrorInfo extends Message<ErrorInfo> {
  /**
   * The user_list_id in the request which caused problems.  This may be empty
   * if the problem was with a particular user id.
   *
   * @generated from field: optional int64 user_list_id = 2 [default = 0];
   */
  userListId?: bigint

  /**
   * The user_id which caused problems.  This may be empty if other data was bad
   * regardless of a cookie.
   *
   * @generated from field: optional string user_id = 3 [default = ""];
   */
  userId?: string

  /**
   * The type of the user ID.
   *
   * @generated from field: optional UserIdType user_id_type = 7 [default = GOOGLE_USER_ID];
   */
  userIdType?: UserIdType

  /**
   * @generated from field: optional ErrorCode error_code = 4;
   */
  errorCode?: ErrorCode

  constructor(data?: PartialMessage<ErrorInfo>) {
    super()
    proto2.util.initPartial(data, this)
  }

  static readonly runtime: typeof proto2 = proto2
  static readonly typeName = 'ErrorInfo'
  static readonly fields: FieldList = proto2.util.newFieldList(() => [
    {
      no: 2,
      name: 'user_list_id',
      kind: 'scalar',
      T: 3 /* ScalarType.INT64 */,
      opt: true,
      default: protoInt64.parse('0')
    },
    { no: 3, name: 'user_id', kind: 'scalar', T: 9 /* ScalarType.STRING */, opt: true, default: '' },
    {
      no: 7,
      name: 'user_id_type',
      kind: 'enum',
      T: proto2.getEnumType(UserIdType),
      opt: true,
      default: UserIdType.GOOGLE_USER_ID
    },
    { no: 4, name: 'error_code', kind: 'enum', T: proto2.getEnumType(ErrorCode), opt: true }
  ])

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): ErrorInfo {
    return new ErrorInfo().fromBinary(bytes, options)
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): ErrorInfo {
    return new ErrorInfo().fromJson(jsonValue, options)
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): ErrorInfo {
    return new ErrorInfo().fromJsonString(jsonString, options)
  }

  static equals(
    a: ErrorInfo | PlainMessage<ErrorInfo> | undefined,
    b: ErrorInfo | PlainMessage<ErrorInfo> | undefined
  ): boolean {
    return proto2.util.equals(ErrorInfo, a, b)
  }
}

/**
 * Per user notification information.
 *
 * @generated from message NotificationInfo
 */
export class NotificationInfo extends Message<NotificationInfo> {
  /**
   * The user_id for which the notification applies.  One of the user_ids sent
   * in a UserDataOperation.
   *
   * @generated from field: optional string user_id = 1 [default = ""];
   */
  userId?: string

  /**
   * @generated from field: optional NotificationCode notification_code = 2;
   */
  notificationCode?: NotificationCode

  constructor(data?: PartialMessage<NotificationInfo>) {
    super()
    proto2.util.initPartial(data, this)
  }

  static readonly runtime: typeof proto2 = proto2
  static readonly typeName = 'NotificationInfo'
  static readonly fields: FieldList = proto2.util.newFieldList(() => [
    { no: 1, name: 'user_id', kind: 'scalar', T: 9 /* ScalarType.STRING */, opt: true, default: '' },
    { no: 2, name: 'notification_code', kind: 'enum', T: proto2.getEnumType(NotificationCode), opt: true }
  ])

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): NotificationInfo {
    return new NotificationInfo().fromBinary(bytes, options)
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): NotificationInfo {
    return new NotificationInfo().fromJson(jsonValue, options)
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): NotificationInfo {
    return new NotificationInfo().fromJsonString(jsonString, options)
  }

  static equals(
    a: NotificationInfo | PlainMessage<NotificationInfo> | undefined,
    b: NotificationInfo | PlainMessage<NotificationInfo> | undefined
  ): boolean {
    return proto2.util.equals(NotificationInfo, a, b)
  }
}

/**
 * Response to the UpdateUsersDataRequest.  Sent in HTTP response to the
 * original POST request, with the Content-Type header set to
 * "application/octet-stream".  The HTTP response status is either 200 (no
 * errors) or 400, in which case the protocol buffer will provide error details.
 *
 * @generated from message UpdateUsersDataResponse
 */
export class UpdateUsersDataResponse extends Message<UpdateUsersDataResponse> {
  /**
   * When status == PARTIAL_SUCCESS, some (not all) of the operations failed and
   * the "errors" field has details on the types and number of errors
   * encountered.  When status == NO_ERROR, all the data was imported
   * successfully.  When status > PARTIAL_SUCCESS no data was imported.
   *
   * @generated from field: optional ErrorCode status = 1;
   */
  status?: ErrorCode

  /**
   * Each operation that failed is reported as a separate error here when
   * status == PARTIAL_SUCCESS.
   *
   * @generated from field: repeated ErrorInfo errors = 2;
   */
  errors: ErrorInfo[] = []

  /**
   * Useful, non-error, information about the user ids in the request.  Each
   * NotificationInfo provides information about a single user id.  Only sent if send_notifications is set to true.
   *
   * @generated from field: repeated NotificationInfo notifications = 3;
   */
  notifications: NotificationInfo[] = []

  /**
   * Indicates why a notification has not been sent.
   *
   * @generated from field: optional NotificationStatus notification_status = 4;
   */
  notificationStatus?: NotificationStatus

  constructor(data?: PartialMessage<UpdateUsersDataResponse>) {
    super()
    proto2.util.initPartial(data, this)
  }

  static readonly runtime: typeof proto2 = proto2
  static readonly typeName = 'UpdateUsersDataResponse'
  static readonly fields: FieldList = proto2.util.newFieldList(() => [
    { no: 1, name: 'status', kind: 'enum', T: proto2.getEnumType(ErrorCode), opt: true },
    { no: 2, name: 'errors', kind: 'message', T: ErrorInfo, repeated: true },
    { no: 3, name: 'notifications', kind: 'message', T: NotificationInfo, repeated: true },
    { no: 4, name: 'notification_status', kind: 'enum', T: proto2.getEnumType(NotificationStatus), opt: true }
  ])

  static fromBinary(bytes: Uint8Array, options?: Partial<BinaryReadOptions>): UpdateUsersDataResponse {
    return new UpdateUsersDataResponse().fromBinary(bytes, options)
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): UpdateUsersDataResponse {
    return new UpdateUsersDataResponse().fromJson(jsonValue, options)
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): UpdateUsersDataResponse {
    return new UpdateUsersDataResponse().fromJsonString(jsonString, options)
  }

  static equals(
    a: UpdateUsersDataResponse | PlainMessage<UpdateUsersDataResponse> | undefined,
    b: UpdateUsersDataResponse | PlainMessage<UpdateUsersDataResponse> | undefined
  ): boolean {
    return proto2.util.equals(UpdateUsersDataResponse, a, b)
  }
}
