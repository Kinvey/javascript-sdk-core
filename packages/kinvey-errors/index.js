module.exports = {
  ActiveUserError: require('./src/activeUser'),
  APIVersionNotAvailableError: require('./src/apiVersionNotAvailable'),
  APIVersionNotImplementedError: require('./src/apiVersionNotImplemented'),
  AppProblemError: require('./src/appProblem'),
  BadRequestError: require('./src/badRequest'),
  BaseError: require('./src/base'),
  BLError: require('./src/bl'),
  CORSDisabledError: require('./src/corsDisabled'),
  DuplicateEndUsersError: require('./src/duplicateEndUsers'),
  FeatureUnavailableError: require('./src/featureUnavailable'),
  IncompleteRequestBodyError: require('./src/incompleteRequestBody'),
  IndirectCollectionAccessDisallowedError: require('./src/indirectCollectionAccessDisallowed'),
  InsufficientCredentialsError: require('./src/insufficientCredentials'),
  InvalidCredentialsError: require('./src/invalidCredentials'),
  InvalidIdentifierError: require('./src/invalidIdentifier'),
  InvalidQuerySyntaxError: require('./src/invalidQuerySyntax'),
  JSONParseError: require('./src/jsonParse'),
  KinveyInternalErrorRetry: require('./src/kinveyInternalErrorRetry'),
  KinveyInternalErrorStop: require('./src/kinveyInternalErrorStop'),
  KinveyError: require('./src/kinvey'),
  MissingQueryError: require('./src/missingQuery'),
  MissingRequestHeaderError: require('./src/missingRequestHeader'),
  MissingRequestParameterError: require('./src/missingRequestParameter'),
  MobileIdentityConnectError: require('./src/mobileIdentityConnect'),
  NetworkConnectionError: require('./src/networkConnection'),
  NoActiveUserError: require('./src/noActiveuser'),
  NoResponseError: require('./src/noResponse'),
  NotFoundError: require('./src/notFound'),
  ParameterValueOutOfRangeError: require('./src/parameterValueOutOfRange'),
  PopupError: require('./src/popup'),
  QueryError: require('./src/query'),
  ServerError: require('./src/server'),
  StaleRequestError: require('./src/staleRequest'),
  SyncError: require('./src/sync'),
  TimeoutError: require('./src/timeout'),
  UserAlreadyExistsError: require('./src/userAlreadyExists'),
  WritesToCollectionDisallowedError: require('./src/writesToCollectionDisallowed'),
}